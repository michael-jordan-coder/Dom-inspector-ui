/**
 * AI Page
 * 
 * Dedicated page for AI functionality:
 * - API key configuration (BYOK)
 * - AI generation from visual changes
 * - Output review and confirmation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AppIcon } from '../primitives/AppIcon';
import { colors, spacing, radii } from '../tokens';
import { AISettings } from '../components/AISettings';
import { AIConfirmation } from '../components/AIConfirmation';
import { PromptBar } from '../primitives/PromptBar';
import {
  aiStateMachine,
  useAIStateMachine,
  callAI,
  type AIResponse,
  type AICredentials,
  AI_STORAGE_KEYS,
} from '../../ai';
import { getExportData } from '../messaging/sidepanelBridge';
import { generateExecutionPrompt } from '../../shared/promptTemplate';
import { EXPORT_SCHEMA_VERSION } from '../../shared/types';

// ============================================================================
// System Prompt (Phase 3 Guardrails)
// ============================================================================

const SYSTEM_PROMPT = `You are an assistant for Visual UI Inspector, a Chrome extension that captures visual CSS changes made to live websites.

## Your Role
You interpret visual change data and produce implementation guidance. You do not make design decisions or modify code without explicit instruction.

## Source of Truth
You receive data in Export Schema v1 format. This data represents:
- FINAL intended values (not history)
- RUNTIME computed styles (not source code intent)
- STABILITY SIGNALS that you must respect

You must treat this data as the only truth. Do not infer, assume, or invent information beyond what is provided.

## Trust Rules (Non-Negotiable)
1. You may NOT claim certainty beyond the provided selectorConfidence signal.
2. You may NOT suggest changes to properties not included in the export.
3. You may NOT assume repository access unless explicitly stated in the prompt mode.
4. You may NOT "improve" or "redesign" the user's visual changes.
5. You must SURFACE all warnings from the export. Never suppress them.
6. If you cannot proceed safely, you MUST refuse and explain why.

## Output Format
Structure your response with these sections:
- **Summary**: Brief overview of what changes were captured
- **Implementation Guidance**: Specific CSS/code to implement
- **Selector Details**: Notes about selector stability
- **Warnings**: Any issues from the export (REQUIRED if warnings exist)
- **Verification Steps**: How to verify the implementation

## Refusal
If the input is malformed, incomplete, or contains signals that prevent safe output (e.g., selectorConfidence: low with no user acknowledgment), you must refuse with an explanation. Silent failure is forbidden.`;

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  } as React.CSSProperties,

  body: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    padding: spacing[4],
  } as React.CSSProperties,

  footer: {
    flexShrink: 0,
    padding: spacing[4],
    paddingTop: 0,
  } as React.CSSProperties,

  // Hero section for empty state
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: `${spacing[6]} ${spacing[4]}`,
    textAlign: 'center',
    flex: 1,
    minHeight: 300,
  } as React.CSSProperties,
  heroIcon: {
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: colors.accent,
  } as React.CSSProperties,
  heroTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  } as React.CSSProperties,
  heroDescription: {
    fontSize: '14px',
    color: colors.textMuted,
    maxWidth: 280,
    lineHeight: 1.5,
    margin: 0,
  } as React.CSSProperties,

  // Status card
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    border: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  } as React.CSSProperties,
  statusConnected: { backgroundColor: '#22c55e' } as React.CSSProperties,
  statusDisconnected: { backgroundColor: '#6b7280' } as React.CSSProperties,
  statusGenerating: {
    backgroundColor: '#fbbf24',
    animation: 'pulse 1.5s ease-in-out infinite',
  } as React.CSSProperties,
  statusInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } as React.CSSProperties,
  statusTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  statusSubtitle: {
    fontSize: '11px',
    color: colors.textMuted,
  } as React.CSSProperties,

  // Generate section
  generateSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  } as React.CSSProperties,
  generateButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: `14px ${spacing[4]}`,
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: colors.accent,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  buttonSecondary: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    color: colors.text,
  } as React.CSSProperties,

  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[6],
  } as React.CSSProperties,
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid var(--border)',
    borderTopColor: colors.accent,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  loadingText: {
    fontSize: '14px',
    color: colors.textMuted,
    textAlign: 'center',
  } as React.CSSProperties,

  // Error display
  error: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: radii.md,
    color: '#fca5a5',
    fontSize: '13px',
    lineHeight: 1.5,
  } as React.CSSProperties,

  // Changes summary
  changesSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    border: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  changesSummaryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  } as React.CSSProperties,
  changesCount: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    fontSize: '24px',
    fontWeight: 700,
    color: colors.text,
  } as React.CSSProperties,

  // Tips
  tips: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: radii.md,
    fontSize: '12px',
    color: colors.textMuted,
    lineHeight: 1.5,
  } as React.CSSProperties,
  tipTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    fontWeight: 600,
    color: colors.text,
    fontSize: '12px',
  } as React.CSSProperties,
};

// ============================================================================
// Component
// ============================================================================

interface AIPageProps {
  hasChanges: boolean;
  patchCount: number;
  onSwitchToInspector?: () => void;
}

export function AIPage({ hasChanges, patchCount, onSwitchToInspector }: AIPageProps): React.ReactElement {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [promptValue, setPromptValue] = useState('');

  // Connect to global AI state machine
  const aiState = useAIStateMachine();
  const isConfirmed = aiState.state === 'CONFIRMED';

  // Check credentials on mount
  useEffect(() => {
    checkCredentials();
  }, []);

  const checkCredentials = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(AI_STORAGE_KEYS.CREDENTIALS);
      const creds = result[AI_STORAGE_KEYS.CREDENTIALS] as AICredentials | undefined;
      setHasCredentials(!!creds && !!creds.apiKey && !creds.isInvalid);
    } catch {
      setHasCredentials(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Get credentials
      const credResult = await chrome.storage.local.get(AI_STORAGE_KEYS.CREDENTIALS);
      const credentials = credResult[AI_STORAGE_KEYS.CREDENTIALS] as AICredentials | undefined;

      if (!credentials || !credentials.apiKey) {
        setError('No API key configured. Please set up your credentials first.');
        setIsLoading(false);
        return;
      }

      // Ensure state machine is connected
      if (!aiStateMachine.isConnected()) {
        await aiStateMachine.connect(credentials);
      } else if (!aiStateMachine.isIdle() && aiState.state !== 'FAILED' && aiState.state !== 'ABORTED' && aiState.state !== 'CONFIRMED' && aiState.state !== 'READY') {
        // Reset if we are in a stuck state or reusing session
        aiStateMachine.returnToIdle();
      }

      // If we confirm previous session or were in a finish state, return to idle to start fresh
      if (['CONFIRMED', 'FAILED', 'ABORTED', 'REVIEW_REQUIRED'].includes(aiState.state)) {
        aiStateMachine.returnToIdle();
      }

      // Get fresh export data (now returns v1 schema directly)
      const { exportData, patchCount: fetchedPatchCount } = await getExportData();
      if (!exportData || fetchedPatchCount === 0) {
        setError('No visual changes to process. Make some edits in the Inspector first.');
        setIsLoading(false);
        return;
      }

      // Dev-only guard: Ensure we never drift from the canonical schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((import.meta as any).env?.DEV) {
        if (exportData.exportVersion !== EXPORT_SCHEMA_VERSION) {
          console.error('[Assertion Failed] Schema version mismatch', {
            expected: EXPORT_SCHEMA_VERSION,
            actual: exportData.exportVersion
          });
          throw new Error(`Schema version mismatch: expected ${EXPORT_SCHEMA_VERSION}`);
        }
      }

      // 1. Prepare Execution Context & Run Gates
      const context: any = {
        mode: 'universal', // Defaulting to universal for Phase 0/1
        exportPayload: exportData,
        stabilityAcknowledged: true, // Assuming explicit user action in inspector implies ack for now, or TODO: add UI for this
      };

      const gateResults = await aiStateMachine.prepareExecution(context);
      const allPassed = gateResults.every(r => r.passed);

      if (!allPassed) {
        const failure = gateResults.find(r => !r.passed);
        setError(`Cannot start generation: ${failure?.message || 'Gate checks failed'}`);
        setIsLoading(false);
        return;
      }

      // 2. Start Generation
      aiStateMachine.startGeneration();

      // Generate prompt from export data
      const userMessage = generateExecutionPrompt(exportData);

      console.log('[DEBUG] AI Prompt Source Version:', exportData.exportVersion);

      // Make AI call
      const result = await callAI({
        credentials,
        systemPrompt: SYSTEM_PROMPT,
        userMessage,
        timeoutMs: 90000,
      });

      if (result.success && result.response) {
        setResponse(result.response);
        // 3. Receive Response
        aiStateMachine.receiveResponse(result.response);
      } else {
        const errorMessage = result.error?.message || 'AI request failed';
        setError(errorMessage);

        // 4. Handle Failure
        aiStateMachine.fail({
          code: result.error?.code || 'SERVER_ERROR',
          message: errorMessage
        });

        if (result.error?.code === 'AUTH_ERROR') {
          await chrome.storage.local.set({
            [AI_STORAGE_KEYS.CREDENTIALS]: {
              ...credentials,
              isInvalid: true,
            },
          });
          setHasCredentials(false);
        }
      }
    } catch (e) {
      console.error('[AI] Generation error:', e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      aiStateMachine.fail({
        code: 'SERVER_ERROR',
        message: msg
      });
    } finally {
      setIsLoading(false);
    }
  }, [aiState.state]);

  const handleConfirm = useCallback(() => {
    aiStateMachine.confirm();
    // Keep response visible after confirmation
  }, []);

  const handleDismiss = useCallback(() => {
    setResponse(null);
    setError(null);
    aiStateMachine.returnToIdle();
  }, []);

  const handleRegenerate = useCallback(() => {
    setResponse(null);
    setError(null);
    handleGenerate();
  }, [handleGenerate]);

  const handlePromptSubmit = useCallback(() => {
    if (!promptValue.trim()) return;
    // TODO: Implement prompt submission logic
    console.log('Submit prompt:', promptValue);
    setPromptValue('');
  }, [promptValue]);

  const handlePickElement = useCallback(() => {
    // Switch to inspector tab for element picking
    onSwitchToInspector?.();
  }, [onSwitchToInspector]);

  const handleCreateSnippet = useCallback(() => {
    // TODO: Implement code snippet creation
    console.log('Create snippet');
  }, []);

  const canGenerate = hasCredentials && hasChanges && !isLoading;
  const showSetup = !hasCredentials;
  const showGenerateUI = hasCredentials && !response && !isLoading;

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        {/* Show setup if no credentials */}
        {showSetup && (
          <>
            {/* Hero section */}
            <div style={styles.hero}>
              <div style={styles.heroIcon}>
                <AppIcon name="command" size={32} />
              </div>
              <h2 style={styles.heroTitle}>AI Assistant</h2>
              <p style={styles.heroDescription}>
                Connect your AI API to generate implementation guidance from your visual changes.
              </p>
            </div>

            {/* Settings card */}
            <AISettings onCredentialsChange={setHasCredentials} />

            {/* Tips */}
            <div style={styles.tips}>
              <div style={styles.tipTitle}>
                <AppIcon name="alertCircle" size={14} />
                How it works
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Your API key is stored locally, never sent to our servers</li>
                <li>Keys are transmitted directly to OpenAI/Anthropic</li>
                <li>AI analyzes your visual changes and generates CSS guidance</li>
              </ul>
            </div>
          </>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>
              Analyzing {patchCount} change{patchCount !== 1 ? 's' : ''} and generating guidance...
            </div>
            <button
              style={{ ...styles.generateButton, ...styles.buttonSecondary, width: 'auto', padding: '10px 24px' }}
              onClick={() => setIsLoading(false)}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Error display */}
        {error && !isLoading && (
          <div style={styles.error}>
            <AppIcon name="alertCircle" size={18} color="#f87171" />
            <div>
              <strong>Error: </strong>
              {error}
            </div>
          </div>
        )}

        {/* Response with confirmation */}
        {response && !isLoading && (
          <AIConfirmation
            response={response}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
            onRegenerate={handleRegenerate}
            isConfirmed={isConfirmed}
          />
        )}

        {/* Generate UI */}
        {showGenerateUI && (
          <>
            {/* Status */}
            <div style={styles.statusCard}>
              <div style={{ ...styles.statusDot, ...styles.statusConnected }} />
              <div style={styles.statusInfo}>
                <div style={styles.statusTitle}>AI Connected</div>
                <div style={styles.statusSubtitle}>Ready to generate implementation guidance</div>
              </div>
            </div>

            {/* Changes summary */}
            {hasChanges ? (
              <div style={styles.changesSummary}>
                <div style={styles.changesSummaryHeader}>
                  <span style={{ color: colors.textMuted }}>VISUAL CHANGES</span>
                  <span style={{ color: colors.accent, fontWeight: 600 }}>Ready</span>
                </div>
                <div style={styles.changesCount}>
                  {patchCount}
                  <span style={{ fontSize: '14px', fontWeight: 400, color: colors.textMuted }}>
                    {patchCount === 1 ? 'change' : 'changes'} captured
                  </span>
                </div>
              </div>
            ) : (
              <div style={styles.changesSummary}>
                <div style={styles.changesSummaryHeader}>
                  <span style={{ color: colors.textMuted }}>VISUAL CHANGES</span>
                  <span style={{ color: colors.warning }}>None</span>
                </div>
                <div style={{ fontSize: '13px', color: colors.textMuted }}>
                  Make some visual changes in the Inspector to generate AI guidance.
                </div>
                {onSwitchToInspector && (
                  <button
                    style={{ ...styles.generateButton, ...styles.buttonSecondary, marginTop: spacing[2] }}
                    onClick={onSwitchToInspector}
                  >
                    <AppIcon name="pointer" size={16} />
                    Go to Inspector
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      {showGenerateUI && (
        <div style={styles.footer}>
          <button
            style={{
              ...styles.generateButton,
              ...(!canGenerate ? styles.buttonDisabled : {}),
            }}
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            <AppIcon name="command" size={18} />
            Generate Implementation Guide
          </button>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Prompt Bar - Always visible at bottom */}
      <PromptBar
        value={promptValue}
        onChange={setPromptValue}
        onSubmit={handlePromptSubmit}
        placeholder="Ask about your changes..."
        disabled={isLoading}
        loading={isLoading}
        onPickElement={handlePickElement}
        onCreateSnippet={handleCreateSnippet}
      />
    </div>
  );
}
