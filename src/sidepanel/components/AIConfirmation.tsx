/**
 * AI Confirmation Component (B-012)
 * 
 * Implements the User Confirmation Contract from Phase 4:
 * - Explicit confirmation required before AI output is "confirmed"
 * - User acknowledges: DOM ephemerality, selector risk, AI limits, responsibility transfer
 * - Single, explicit action (button click)
 * - Positioned after full output is visible
 */

import React, { useState, useCallback, useMemo } from 'react';
import { AppIcon } from '../primitives/AppIcon';
import { colors } from '../tokens';
import type { AIResponse } from '../../ai/types';
import './components.css';

// ============================================================================
// Styles
// ============================================================================




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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const allAcknowledged = ACKNOWLEDGMENT_ITEMS.every(item => acknowledged[item.id]);

  // Check if we have any parsed sections
  const hasParsedSections = useMemo(() => {
    const { sections } = response;
    return !!(
      sections.summary ||
      sections.implementationGuidance ||
      sections.selectorDetails ||
      sections.warnings ||
      sections.verificationSteps
    );
  }, [response]);

  const handleCheckboxChange = useCallback((id: string) => {
    setAcknowledged(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleCopyResponse = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(response.raw);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [response.raw]);

  // If this is a refusal, show refusal UI
  if (response.isRefusal) {
    return (
      <div className="ai-confirmation-container">
        <div className="ai-confirmation-refusal">
          <div className="ai-confirmation-refusal-title">
            <AppIcon name="alertTriangle" size={18} color="#fcd34d" />
            Unable to Proceed
          </div>
          <div className="ai-confirmation-refusal-content">
            {response.sections.refusalNotice || response.raw}
          </div>
        </div>

        <div className="ai-confirmation-button-row">
          <button className="ai-confirmation-button" onClick={onDismiss}>
            <AppIcon name="close" size={14} />
            Dismiss
          </button>
          {onRegenerate && (
            <button className="ai-confirmation-button" onClick={onRegenerate}>
              <AppIcon name="reset" size={14} />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-confirmation-container">
      {/* Output Header with Copy Button */}
      <div className="ai-confirmation-output-header-row">
        <div className="ai-confirmation-output-header">
          <AppIcon name="check" size={18} color={colors.success} />
          AI Response Received
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {copyFeedback ? (
            <span className="ai-confirmation-copy-feedback">
              <AppIcon name="check" size={12} color={colors.success} />
              {copyFeedback}
            </span>
          ) : (
            <button className="ai-confirmation-copy-button" onClick={handleCopyResponse}>
              <AppIcon name="copy" size={12} />
              Copy
            </button>
          )}
        </div>
      </div>

      {/* Output Content */}
      <div className="ai-confirmation-output-container">
        {/* Show parsed sections if available */}
        {hasParsedSections && !showRaw && (
          <>
            {response.sections.summary && (
              <div>
                <div className="ai-confirmation-section-label">
                  SUMMARY
                </div>
                <div className="ai-confirmation-output-content is-summary">
                  {response.sections.summary}
                </div>
              </div>
            )}

            {response.sections.implementationGuidance && (
              <div>
                <div className="ai-confirmation-section-label">
                  IMPLEMENTATION GUIDANCE
                </div>
                <div className="ai-confirmation-output-content">
                  {response.sections.implementationGuidance}
                </div>
              </div>
            )}

            {/* Warnings Section - Custom color overrides */}
            {response.sections.warnings && (
              <div>
                <div className="ai-confirmation-section-label is-warning">
                  WARNINGS
                </div>
                <div className="ai-confirmation-output-content is-warning">
                  {response.sections.warnings}
                </div>
              </div>
            )}

            {response.sections.verificationSteps && (
              <div>
                <div className="ai-confirmation-section-label">
                  VERIFICATION
                </div>
                <div className="ai-confirmation-output-content is-verification">
                  {response.sections.verificationSteps}
                </div>
              </div>
            )}
          </>
        )}

        {/* Show raw response as fallback or when toggled */}
        {(!hasParsedSections || showRaw) && (
          <div>
            <div className="ai-confirmation-section-label">
              {hasParsedSections ? 'RAW RESPONSE' : 'AI RESPONSE'}
            </div>
            <div className={`ai-confirmation-output-content ${!hasParsedSections ? 'is-raw' : ''}`}>
              {response.raw}
            </div>
          </div>
        )}

        {/* Toggle between parsed and raw when sections exist */}
        {hasParsedSections && (
          <button className="ai-confirmation-section-toggle" onClick={() => setShowRaw(!showRaw)}>
            <AppIcon name={showRaw ? 'chevronUp' : 'chevronDown'} size={12} />
            {showRaw ? 'Show Parsed Sections' : 'Show Raw Response'}
          </button>
        )}
      </div>

      {/* Acknowledgment Section */}
      <div className="ai-confirmation-acknowledgment-section">
        <div className="ai-confirmation-acknowledgment-title">
          Before confirming, please acknowledge:
        </div>
        <div className="ai-confirmation-acknowledgment-list">
          {ACKNOWLEDGMENT_ITEMS.map((item) => (
            <label key={item.id} className="ai-confirmation-acknowledgment-item">
              <input
                type="checkbox"
                className="ai-confirmation-checkbox"
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
      <div className="ai-confirmation-button-row">
        <button className="ai-confirmation-button" onClick={onDismiss}>
          <AppIcon name="close" size={14} />
          {isConfirmed ? 'Close' : 'Dismiss'}
        </button>
        {onRegenerate && (
          <button className="ai-confirmation-button" onClick={onRegenerate}>
            <AppIcon name="reset" size={14} />
            Regenerate
          </button>
        )}
        <button
          className={`ai-confirmation-button is-success ${(!allAcknowledged && !isConfirmed) ? 'is-disabled' : ''
            } ${isConfirmed ? 'is-confirmed' : ''}`}
          onClick={isConfirmed ? undefined : onConfirm}
          disabled={!allAcknowledged && !isConfirmed}
          title={isConfirmed ? 'Response confirmed' : allAcknowledged ? 'Confirm output' : 'Please acknowledge all items first'}
        >
          <AppIcon name="check" size={14} />
          {isConfirmed ? 'Confirmed' : 'I Understand & Confirm'}
        </button>
      </div>

      {/* Helper text */}
      <div className="ai-confirmation-helper-text">
        Confirmation is per-session, per-output. Each AI generation requires its own confirmation.
      </div>
    </div>
  );
}
