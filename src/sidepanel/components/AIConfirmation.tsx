/**
 * AI Confirmation Component (B-012)
 * 
 * Implements the User Confirmation Contract from Phase 4:
 * - Explicit confirmation required before AI output is "confirmed"
 * - User acknowledges: DOM ephemerality, selector risk, AI limits, responsibility transfer
 * - Single, explicit action (button click)
 * - Positioned after full output is visible
 */

import React, { useState, useCallback } from 'react';
import { AppIcon } from '../primitives/AppIcon';
import { colors, spacing, radii } from '../tokens';
import type { AIResponse } from '../../ai/types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
  } as React.CSSProperties,

  // Output display
  outputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  } as React.CSSProperties,
  outputHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  outputContent: {
    padding: spacing[3],
    backgroundColor: 'var(--neutral-900)',
    borderRadius: radii.md,
    fontSize: '12px',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    color: colors.text,
    maxHeight: '400px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  } as React.CSSProperties,

  // Refusal display
  refusal: {
    padding: spacing[3],
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: radii.md,
  } as React.CSSProperties,
  refusalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontSize: '13px',
    fontWeight: 600,
    color: '#fcd34d',
    marginBottom: spacing[2],
  } as React.CSSProperties,
  refusalContent: {
    fontSize: '12px',
    color: colors.text,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  } as React.CSSProperties,

  // Acknowledgment section
  acknowledgmentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: 'var(--surface-raised)',
    borderRadius: radii.md,
    marginTop: spacing[2],
  } as React.CSSProperties,
  acknowledgmentTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: spacing[1],
  } as React.CSSProperties,
  acknowledgmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    fontSize: '11px',
    color: colors.textMuted,
    lineHeight: 1.4,
  } as React.CSSProperties,
  acknowledgmentItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[2],
  } as React.CSSProperties,
  checkbox: {
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: colors.accent,
  } as React.CSSProperties,

  // Buttons
  buttonRow: {
    display: 'flex',
    gap: spacing[2],
    marginTop: spacing[2],
  } as React.CSSProperties,
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: `10px ${spacing[3]}`,
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: colors.accent,
    color: '#fff',
  } as React.CSSProperties,
  buttonSuccess: {
    backgroundColor: '#22c55e',
    color: '#fff',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,

  // Helper text
  helperText: {
    fontSize: '11px',
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  } as React.CSSProperties,
};

// ============================================================================
// Acknowledgment Items (Per Phase 4 Contract)
// ============================================================================

const ACKNOWLEDGMENT_ITEMS = [
  {
    id: 'ephemeral',
    text: 'I understand these changes were made to a live, runtime DOM, not source code.',
  },
  {
    id: 'selector',
    text: 'I have reviewed any selector warnings and accept the risk that selectors may break.',
  },
  {
    id: 'limitations',
    text: 'I understand that AI output is guidance, not guaranteed correctness.',
  },
  {
    id: 'responsibility',
    text: 'I am responsible for verification. From this point, I own the implementation.',
  },
];

// ============================================================================
// Component Props
// ============================================================================

interface AIConfirmationProps {
  /** AI response to display */
  response: AIResponse;
  /** Called when user confirms the output */
  onConfirm: () => void;
  /** Called when user dismisses the output */
  onDismiss: () => void;
  /** Called when user requests regeneration */
  onRegenerate?: () => void;
  /** Whether the response has been confirmed */
  isConfirmed?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function AIConfirmation({
  response,
  onConfirm,
  onDismiss,
  onRegenerate,
  isConfirmed = false,
}: AIConfirmationProps): React.ReactElement {
  // Track acknowledgment state
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const allAcknowledged = ACKNOWLEDGMENT_ITEMS.every(item => acknowledged[item.id]);

  const handleCheckboxChange = useCallback((id: string) => {
    setAcknowledged(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // If this is a refusal, show refusal UI
  if (response.isRefusal) {
    return (
      <div style={styles.container}>
        <div style={styles.refusal}>
          <div style={styles.refusalTitle}>
            <AppIcon name="alertTriangle" size={18} color="#fcd34d" />
            Unable to Proceed
          </div>
          <div style={styles.refusalContent}>
            {response.sections.refusalNotice || response.raw}
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.button} onClick={onDismiss}>
            <AppIcon name="close" size={14} />
            Dismiss
          </button>
          {onRegenerate && (
            <button style={styles.button} onClick={onRegenerate}>
              <AppIcon name="reset" size={14} />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Output Header */}
      <div style={styles.outputHeader}>
        <AppIcon name="check" size={18} color={colors.success} />
        AI Response Received
      </div>

      {/* Output Content */}
      <div style={styles.outputContainer}>
        {response.sections.summary && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: colors.textMuted, marginBottom: spacing[1] }}>
              SUMMARY
            </div>
            <div style={{ ...styles.outputContent, maxHeight: '100px' }}>
              {response.sections.summary}
            </div>
          </div>
        )}

        {response.sections.implementationGuidance && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: colors.textMuted, marginBottom: spacing[1] }}>
              IMPLEMENTATION GUIDANCE
            </div>
            <div style={styles.outputContent}>
              {response.sections.implementationGuidance}
            </div>
          </div>
        )}

        {response.sections.warnings && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#fcd34d', marginBottom: spacing[1] }}>
              WARNINGS
            </div>
            <div style={{ ...styles.outputContent, borderColor: 'rgba(251, 191, 36, 0.3)' }}>
              {response.sections.warnings}
            </div>
          </div>
        )}

        {response.sections.verificationSteps && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: colors.textMuted, marginBottom: spacing[1] }}>
              VERIFICATION
            </div>
            <div style={{ ...styles.outputContent, maxHeight: '150px' }}>
              {response.sections.verificationSteps}
            </div>
          </div>
        )}
      </div>

      {/* Acknowledgment Section */}
      <div style={styles.acknowledgmentSection}>
        <div style={styles.acknowledgmentTitle}>
          Before confirming, please acknowledge:
        </div>
        <div style={styles.acknowledgmentList}>
          {ACKNOWLEDGMENT_ITEMS.map((item) => (
            <label key={item.id} style={styles.acknowledgmentItem}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={!!acknowledged[item.id] || isConfirmed}
                onChange={() => handleCheckboxChange(item.id)}
                disabled={isConfirmed}
              />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonRow}>
        <button style={styles.button} onClick={onDismiss}>
          <AppIcon name="close" size={14} />
          {isConfirmed ? 'Close' : 'Dismiss'}
        </button>
        {onRegenerate && (
          <button style={styles.button} onClick={onRegenerate}>
            <AppIcon name="reset" size={14} />
            Regenerate
          </button>
        )}
        <button
          style={{
            ...styles.button,
            ...styles.buttonSuccess,
            ...(allAcknowledged || isConfirmed ? {} : styles.buttonDisabled),
            ...(isConfirmed ? { opacity: 0.8, cursor: 'default' } : {}),
          }}
          onClick={isConfirmed ? undefined : onConfirm}
          disabled={!allAcknowledged && !isConfirmed}
          title={isConfirmed ? 'Response confirmed' : allAcknowledged ? 'Confirm output' : 'Please acknowledge all items first'}
        >
          <AppIcon name="check" size={14} />
          {isConfirmed ? 'Confirmed' : 'I Understand & Confirm'}
        </button>
      </div>

      {/* Helper text */}
      <div style={styles.helperText}>
        Confirmation is per-session, per-output. Each AI generation requires its own confirmation.
      </div>
    </div>
  );
}
