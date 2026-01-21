/**
 * AI Connection State Machine (B-003)
 * 
 * Implements the 8-state execution lifecycle from Phase 4:
 * DISCONNECTED → CONNECTED_IDLE → READY → GENERATING → REVIEW_REQUIRED → CONFIRMED
 *                                     ↓
 *                              FAILED / ABORTED
 */

import type {
  AIConnectionState,
  AICredentials,
  AIExecutionContext,
  AIResponse,
  AIExecutionError,
  GateCheckResult,
} from './types';
import { AI_STORAGE_KEYS } from './types';
import type { VisualUIInspectorExport } from '../shared/types';
import { validateExportSchemaV1 } from '../shared/validation';

// ============================================================================
// State Machine Types
// ============================================================================

export interface AIStateMachineState {
  /** Current state */
  state: AIConnectionState;
  /** Credentials (null if DISCONNECTED) */
  credentials: AICredentials | null;
  /** Current execution context (null if not in READY+) */
  context: AIExecutionContext | null;
  /** AI response (null until REVIEW_REQUIRED) */
  response: AIResponse | null;
  /** Last error (null if no error) */
  error: AIExecutionError | null;
  /** Abort controller for cancellation */
  abortController: AbortController | null;
}

export type StateChangeCallback = (state: AIStateMachineState) => void;

// ============================================================================
// State Machine Implementation
// ============================================================================

class AIStateMachine {
  private state: AIStateMachineState;
  private listeners: Set<StateChangeCallback> = new Set();

  constructor() {
    this.state = {
      state: 'DISCONNECTED',
      credentials: null,
      context: null,
      response: null,
      error: null,
      abortController: null,
    };
  }

  // ============================================================================
  // State Access
  // ============================================================================

  getState(): AIStateMachineState {
    return { ...this.state };
  }

  getCurrentState(): AIConnectionState {
    return this.state.state;
  }

  isConnected(): boolean {
    return this.state.state !== 'DISCONNECTED';
  }

  isIdle(): boolean {
    return this.state.state === 'CONNECTED_IDLE';
  }

  isGenerating(): boolean {
    return this.state.state === 'GENERATING';
  }

  // ============================================================================
  // State Listeners
  // ============================================================================

  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }

  private setState(updates: Partial<AIStateMachineState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  // ============================================================================
  // State Transitions
  // ============================================================================

  /**
   * Initialize state machine by loading credentials.
   */
  async initialize(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(AI_STORAGE_KEYS.CREDENTIALS);
      const credentials = result[AI_STORAGE_KEYS.CREDENTIALS] as AICredentials | undefined;
      
      if (credentials && !credentials.isInvalid) {
        this.setState({
          state: 'CONNECTED_IDLE',
          credentials,
        });
      } else {
        this.setState({
          state: 'DISCONNECTED',
          credentials: null,
        });
      }
    } catch (error) {
      console.error('[AI] Failed to initialize state machine:', error);
      this.setState({
        state: 'DISCONNECTED',
        credentials: null,
      });
    }
  }

  /**
   * Transition: DISCONNECTED → CONNECTED_IDLE
   * Called when credentials are configured.
   */
  async connect(credentials: AICredentials): Promise<void> {
    if (this.state.state !== 'DISCONNECTED') {
      console.warn('[AI] Cannot connect: not in DISCONNECTED state');
      return;
    }

    try {
      await chrome.storage.local.set({
        [AI_STORAGE_KEYS.CREDENTIALS]: credentials,
      });
      
      this.setState({
        state: 'CONNECTED_IDLE',
        credentials,
        error: null,
      });
    } catch (error) {
      console.error('[AI] Failed to save credentials:', error);
      this.setState({
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to save credentials',
          details: error,
        },
      });
    }
  }

  /**
   * Transition: CONNECTED_* → DISCONNECTED
   * Called when credentials are revoked.
   */
  async disconnect(): Promise<void> {
    // Abort any in-progress generation
    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    try {
      await chrome.storage.local.remove(AI_STORAGE_KEYS.CREDENTIALS);
    } catch (error) {
      console.error('[AI] Failed to clear credentials:', error);
    }

    this.setState({
      state: 'DISCONNECTED',
      credentials: null,
      context: null,
      response: null,
      error: null,
      abortController: null,
    });
  }

  /**
   * Transition: CONNECTED_IDLE → READY (if gates pass) or FAILED (if gates fail)
   * Called when user initiates an AI action.
   */
  async prepareExecution(context: AIExecutionContext): Promise<GateCheckResult[]> {
    if (this.state.state !== 'CONNECTED_IDLE') {
      return [{
        passed: false,
        gate: 'NO_CONCURRENT_EXECUTION',
        message: 'Cannot start execution: not in CONNECTED_IDLE state',
      }];
    }

    // Run all gates
    const gateResults = await this.runGates(context);
    const allPassed = gateResults.every(r => r.passed);

    if (allPassed) {
      this.setState({
        state: 'READY',
        context,
        error: null,
      });
    } else {
      const failedGates = gateResults.filter(r => !r.passed);
      this.setState({
        state: 'FAILED',
        context,
        error: {
          code: 'GATE_FAILED',
          message: failedGates.map(g => g.message).join('; '),
          details: failedGates,
        },
      });
    }

    return gateResults;
  }

  /**
   * Transition: READY → GENERATING
   * Called when user confirms execution.
   */
  startGeneration(): void {
    if (this.state.state !== 'READY') {
      console.warn('[AI] Cannot start generation: not in READY state');
      return;
    }

    const abortController = new AbortController();
    this.setState({
      state: 'GENERATING',
      abortController,
      error: null,
    });
  }

  /**
   * Transition: GENERATING → REVIEW_REQUIRED
   * Called when AI response is received successfully.
   */
  receiveResponse(response: AIResponse): void {
    if (this.state.state !== 'GENERATING') {
      console.warn('[AI] Cannot receive response: not in GENERATING state');
      return;
    }

    this.setState({
      state: 'REVIEW_REQUIRED',
      response,
      abortController: null,
    });
  }

  /**
   * Transition: GENERATING → FAILED
   * Called when AI call fails.
   */
  fail(error: AIExecutionError): void {
    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    this.setState({
      state: 'FAILED',
      error,
      abortController: null,
    });
  }

  /**
   * Transition: GENERATING → ABORTED
   * Called when user aborts during generation.
   */
  abort(): void {
    if (this.state.state !== 'GENERATING') {
      console.warn('[AI] Cannot abort: not in GENERATING state');
      return;
    }

    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    this.setState({
      state: 'ABORTED',
      error: {
        code: 'ABORTED',
        message: 'Request aborted by user',
      },
      abortController: null,
    });
  }

  /**
   * Transition: REVIEW_REQUIRED → CONFIRMED
   * Called when user explicitly confirms the AI output.
   */
  confirm(): void {
    if (this.state.state !== 'REVIEW_REQUIRED') {
      console.warn('[AI] Cannot confirm: not in REVIEW_REQUIRED state');
      return;
    }

    this.setState({
      state: 'CONFIRMED',
    });
  }

  /**
   * Transition: REVIEW_REQUIRED → CONNECTED_IDLE
   * Called when user dismisses the output.
   */
  dismiss(): void {
    if (this.state.state !== 'REVIEW_REQUIRED') {
      console.warn('[AI] Cannot dismiss: not in REVIEW_REQUIRED state');
      return;
    }

    this.setState({
      state: 'CONNECTED_IDLE',
      context: null,
      response: null,
    });
  }

  /**
   * Transition: REVIEW_REQUIRED → READY
   * Called when user requests regeneration.
   */
  requestRegeneration(): void {
    if (this.state.state !== 'REVIEW_REQUIRED') {
      console.warn('[AI] Cannot regenerate: not in REVIEW_REQUIRED state');
      return;
    }

    this.setState({
      state: 'READY',
      response: null,
    });
  }

  /**
   * Transition: FAILED/ABORTED/CONFIRMED → CONNECTED_IDLE
   * Called when user acknowledges and returns to idle.
   */
  returnToIdle(): void {
    const validStates: AIConnectionState[] = ['FAILED', 'ABORTED', 'CONFIRMED', 'READY'];
    if (!validStates.includes(this.state.state)) {
      console.warn('[AI] Cannot return to idle from state:', this.state.state);
      return;
    }

    this.setState({
      state: 'CONNECTED_IDLE',
      context: null,
      response: null,
      error: null,
    });
  }

  /**
   * Transition: READY → CONNECTED_IDLE
   * Called when user cancels before starting generation.
   */
  cancel(): void {
    if (this.state.state !== 'READY') {
      console.warn('[AI] Cannot cancel: not in READY state');
      return;
    }

    this.setState({
      state: 'CONNECTED_IDLE',
      context: null,
      error: null,
    });
  }

  // ============================================================================
  // Safe-Run Gates (Phase 4)
  // ============================================================================

  private async runGates(context: AIExecutionContext): Promise<GateCheckResult[]> {
    const results: GateCheckResult[] = [];

    // Gate 1: Export Schema Validation
    results.push(this.checkGate1(context));

    // Gate 2: Patches Exist
    results.push(this.checkGate2(context));

    // Gate 3: Stability Acknowledgment
    results.push(this.checkGate3(context));

    // Gate 4: Mode Compatibility
    results.push(this.checkGate4(context));

    // Gate 5: Credentials Valid
    results.push(await this.checkGate5());

    // Gate 6: No Concurrent Execution
    results.push(this.checkGate6());

    return results;
  }

  /**
   * Gate 1: Export Schema Validation
   * Check: The assembled payload conforms to Export Schema v1.
   */
  private checkGate1(context: AIExecutionContext): GateCheckResult {
    const validation = validateExportSchemaV1(context.exportPayload);
    return {
      passed: validation.valid,
      gate: 'EXPORT_SCHEMA_VALID',
      message: validation.valid
        ? undefined
        : `Export data is invalid: ${validation.errors.map(e => e.message).join(', ')}`,
    };
  }

  /**
   * Gate 2: At Least One Patch Exists
   * Check: patches.length > 0
   */
  private checkGate2(context: AIExecutionContext): GateCheckResult {
    const exportData = context.exportPayload as VisualUIInspectorExport;
    const hasPatch = exportData?.patches?.length > 0;
    return {
      passed: hasPatch,
      gate: 'PATCHES_EXIST',
      message: hasPatch
        ? undefined
        : 'No visual changes to process. Make edits before invoking AI.',
    };
  }

  /**
   * Gate 3: Stability Acknowledgment (Conditional)
   * Check: If any patch has low confidence or stability warnings, user must acknowledge.
   */
  private checkGate3(context: AIExecutionContext): GateCheckResult {
    const exportData = context.exportPayload as VisualUIInspectorExport;
    
    // Check if any patches have low confidence
    const hasLowConfidence = exportData?.patches?.some(p => p.selectorConfidence === 'low');
    
    // Check for critical warnings
    const hasCriticalWarning = exportData?.warnings?.some(w => 
      w.code === 'SELECTOR_POSITIONAL' || 
      w.code === 'MULTIPLE_ELEMENTS_MATCHED'
    );

    const needsAcknowledgment = hasLowConfidence || hasCriticalWarning;
    const isAcknowledged = context.stabilityAcknowledged;

    return {
      passed: !needsAcknowledgment || isAcknowledged,
      gate: 'STABILITY_ACKNOWLEDGED',
      message: needsAcknowledgment && !isAcknowledged
        ? 'Some selectors are unstable. Review warnings and confirm to proceed.'
        : undefined,
    };
  }

  /**
   * Gate 4: Mode Compatibility
   * Check: If repo-connected mode is requested, repository context must be present.
   */
  private checkGate4(context: AIExecutionContext): GateCheckResult {
    if (context.mode !== 'repo-connected') {
      return { passed: true, gate: 'MODE_COMPATIBLE' };
    }

    const hasRepoContext = context.repoContext && context.repoContext.rootPath;
    return {
      passed: !!hasRepoContext,
      gate: 'MODE_COMPATIBLE',
      message: hasRepoContext
        ? undefined
        : 'Repo-Connected Mode requires repository context. Provide file paths or switch to Universal Mode.',
    };
  }

  /**
   * Gate 5: Credentials Valid
   * Check: AI credentials exist and have not been marked invalid.
   */
  private async checkGate5(): Promise<GateCheckResult> {
    const credentials = this.state.credentials;
    const isValid = credentials && !credentials.isInvalid;
    return {
      passed: !!isValid,
      gate: 'CREDENTIALS_VALID',
      message: isValid
        ? undefined
        : 'AI credentials are missing or invalid. Please reconfigure.',
    };
  }

  /**
   * Gate 6: No Concurrent Execution
   * Check: No other AI action is currently in GENERATING state.
   */
  private checkGate6(): GateCheckResult {
    const isGenerating = this.state.state === 'GENERATING';
    return {
      passed: !isGenerating,
      gate: 'NO_CONCURRENT_EXECUTION',
      message: isGenerating
        ? 'An AI action is already in progress. Wait or abort the current action.'
        : undefined,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const aiStateMachine = new AIStateMachine();

// ============================================================================
// React Hook Helper
// ============================================================================

import { useState, useEffect } from 'react';

export function useAIStateMachine(): AIStateMachineState {
  const [state, setState] = useState<AIStateMachineState>(aiStateMachine.getState());

  useEffect(() => {
    return aiStateMachine.subscribe(setState);
  }, []);

  return state;
}
