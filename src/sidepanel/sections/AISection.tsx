/**
 * AI Section
 * 
 * Integrates AI functionality into the side panel:
 * - Shows AI connection status
 * - Allows triggering AI generation from export data
 * - Displays AI response with confirmation flow
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Section } from '../primitives';
import { AppIcon } from '../primitives/AppIcon';
import { colors, spacing, radii } from '../tokens';
import { AISettings } from '../components/AISettings';
import { AIConfirmation } from '../components/AIConfirmation';
import { 
  useAIStateMachine, 
  aiStateMachine,
  callAI,
  type AIResponse,
  type AICredentials,
  AI_STORAGE_KEYS,
} from '../../ai';
import { getExportData } from '../messaging/sidepanelBridge';
import { generateExecutionPrompt } from '../../shared/promptTemplate';

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

## Output Behavior
- Be concise and technical.
- Use code blocks for CSS/code.
- Always include a "Warnings" section if any exist in the export.
- Do not add commentary on design quality.

## Refusal
If the input is malformed, incomplete, or contains signals that prevent safe output (e.g., selectorConfidence: low with no user acknowledgment), you must refuse with an explanation. Silent failure is forbidden.`;

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  } as React.CSSProperties,
  
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    fontSize: '12px',
  } as React.CSSProperties,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  } as React.CSSProperties,
  statusConnected: { backgroundColor: '#22c55e' } as React.CSSProperties,
  statusDisconnected: { backgroundColor: '#6b7280' } as React.CSSProperties,
  statusGenerating: { backgroundColor: '#fbbf24' } as React.CSSProperties,
  
  generateButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: `12px ${spacing[4]}`,
    fontSize: '13px',
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
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  } as React.CSSProperties,
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid var(--border)',
    borderTopColor: colors.accent,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  
  error: {
    padding: spacing[3],
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: radii.md,
    color: '#fca5a5',
    fontSize: '12px',
  } as React.CSSProperties,
  
  hint: {
    fontSize: '11px',
    color: colors.textMuted,
    textAlign: 'center',
  } as React.CSSProperties,
};

// ============================================================================
// Component
// ============================================================================

interface AISectionProps {
  /** Trigger refresh when styles change */
  refreshTrigger?: number;
}

export function AISection({ refreshTrigger }: AISectionProps): React.ReactElement {
  const aiState = useAIStateMachine();
  const [hasCredentials, setHasCredentials] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  
  // Initialize state machine on mount
  useEffect(() => {
    aiStateMachine.initialize();
  }, []);
  
  // Check for changes when refreshTrigger updates
  useEffect(() => {
    checkForChanges();
  }, [refreshTrigger]);
  
  const checkForChanges = useCallback(async () => {
    try {
      const result = await getExportData();
      setHasChanges(result.patchCount > 0);
    } catch {
      setHasChanges(false);
    }
  }, []);
  
  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Get credentials
      const credResult = await chrome.storage.local.get(AI_STORAGE_KEYS.CREDENTIALS);
      const credentials = credResult[AI_STORAGE_KEYS.CREDENTIALS] as AICredentials | undefined;
      
      if (!credentials) {
        setError('No AI credentials configured. Please set up your API key first.');
        setIsLoading(false);
        return;
      }
      
      // Get export data
      const exportResult = await getExportData();
      if (!exportResult.exportData || exportResult.patchCount === 0) {
        setError('No visual changes to process. Make some edits first.');
        setIsLoading(false);
        return;
      }
      
      // Generate execution prompt
      const userMessage = generateExecutionPrompt(exportResult.exportData);
      
      // Create abort controller
      const abortController = new AbortController();
      
      // Make AI call
      const result = await callAI({
        credentials,
        systemPrompt: SYSTEM_PROMPT,
        userMessage,
        abortSignal: abortController.signal,
        timeoutMs: 90000, // 90 second timeout for complex responses
      });
      
      if (result.success && result.response) {
        setResponse(result.response);
        aiStateMachine.receiveResponse(result.response);
      } else {
        const errorMessage = result.error?.message || 'AI request failed';
        setError(errorMessage);
        
        // Mark credentials invalid on auth error
        if (result.error?.code === 'AUTH_ERROR') {
          await chrome.storage.local.set({
            [AI_STORAGE_KEYS.CREDENTIALS]: {
              ...credentials,
              isInvalid: true,
            },
          });
        }
      }
    } catch (e) {
      console.error('[AI] Generation error:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleConfirm = useCallback(() => {
    aiStateMachine.confirm();
    // Response stays visible after confirmation
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
  
  const isConnected = aiState.state !== 'DISCONNECTED';
  const canGenerate = hasCredentials && hasChanges && !isLoading;
  
  return (
    <>
      <AISettings onCredentialsChange={setHasCredentials} />
      
      <Section
        id="ai-generate"
        title="AI Assistant"
        collapsible
        defaultCollapsed={!hasCredentials}
      >
        <div style={styles.container}>
          {/* Status bar */}
          <div style={styles.statusBar}>
            <div
              style={{
                ...styles.statusDot,
                ...(isLoading ? styles.statusGenerating : 
                    isConnected ? styles.statusConnected : styles.statusDisconnected),
              }}
            />
            <span style={{ flex: 1, color: colors.text }}>
              {isLoading ? 'Generating...' :
               isConnected ? 'Ready' : 'Not connected'}
            </span>
            {hasChanges && (
              <span style={{ color: colors.accent, fontSize: '11px' }}>
                Changes ready
              </span>
            )}
          </div>
          
          {/* Error display */}
          {error && (
            <div style={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner} />
              <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                Analyzing changes and generating guidance...
              </span>
              <button
                style={{ ...styles.generateButton, backgroundColor: 'transparent', border: `1px solid ${colors.border}`, color: colors.text }}
                onClick={() => setIsLoading(false)}
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Response display with confirmation */}
          {response && !isLoading && (
            <AIConfirmation
              response={response}
              onConfirm={handleConfirm}
              onDismiss={handleDismiss}
              onRegenerate={handleRegenerate}
            />
          )}
          
          {/* Generate button */}
          {!response && !isLoading && (
            <>
              <button
                style={{
                  ...styles.generateButton,
                  ...(!canGenerate ? styles.buttonDisabled : {}),
                }}
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                <AppIcon name="command" size={16} />
                Generate Implementation Guide
              </button>
              
              {!hasCredentials && (
                <div style={styles.hint}>
                  Configure your AI API key above to enable AI assistance.
                </div>
              )}
              
              {hasCredentials && !hasChanges && (
                <div style={styles.hint}>
                  Make some visual changes to generate implementation guidance.
                </div>
              )}
            </>
          )}
        </div>
      </Section>
      
      {/* Inject spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
