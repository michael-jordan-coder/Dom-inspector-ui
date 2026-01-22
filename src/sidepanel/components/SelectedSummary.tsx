import React, { useMemo, useState, useCallback } from 'react';
import type { ElementMetadata, SelectorConfidence } from '../../shared/types';
import { AppIcon } from '../primitives';
import { computeSelectorConfidence } from '../../shared/selector';


export interface SelectedSummaryProps {
  element: ElementMetadata;
}

// ============================================================================
// Styles
// ============================================================================

import './components.css';

const confidenceLabels: Record<SelectorConfidence, string> = {
  high: 'Stable (ID-based)',
  medium: 'Moderate (class-based)',
  low: 'Fragile (positional)',
};

const confidenceTooltips: Record<SelectorConfidence, string> = {
  high: 'Selector uses unique ID or data-testid. Unlikely to break.',
  medium: 'Selector uses class names. May break if CSS/HTML is refactored.',
  low: 'Selector uses positional matching. Likely to break on DOM changes.',
};

export function SelectedSummary({
  element,
}: SelectedSummaryProps): React.ReactElement {
  // Compute selector confidence
  const confidence = useMemo((): SelectorConfidence => {
    return computeSelectorConfidence(element.selector, 1);
  }, [element.selector]);

  // Copy feedback state
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(element.selector);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [element.selector]);

  return (
    <div className="selected-summary-card">
      {/* Screenshot Preview */}
      <div className="selected-summary-screenshot-container">
        {element.screenshot ? (
          <img
            src={element.screenshot}
            alt={`Screenshot of ${element.tagName} element`}
            className="selected-summary-screenshot"
          />
        ) : (
          <div className="selected-summary-screenshot-placeholder">
            <AppIcon name="image" size={24} state="muted" />
            <span>No preview available</span>
          </div>
        )}
      </div>

      {/* Element Info */}
      <div className="selected-summary-info-container">
        <div className="selected-summary-element-info">
          {/* Tag + ID */}
          <div className="selected-summary-tag-row">
            <span className="selected-summary-tag-name">&lt;{element.tagName}&gt;</span>
            {element.id && (
              <span className="selected-summary-id-badge">#{element.id}</span>
            )}
          </div>

          {/* Class list */}
          {element.classList.length > 0 && (
            <div className="selected-summary-class-list">
              .{element.classList.join(' .')}
            </div>
          )}
        </div>

        {/* Selector */}
        <div className="selected-summary-selector-row">
          <div className="selected-summary-selector-header">
            <span className="selected-summary-selector-label">Selector</span>
            <button
              className="selected-summary-copy-button"
              onClick={handleCopy}
              aria-label="Copy selector"
              title="Copy selector"
            >
              <AppIcon name={copied ? 'check' : 'copy'} size={12} />
            </button>
          </div>
          <div className="selected-summary-selector">{element.selector}</div>
        </div>

        {/* Selector Confidence Indicator (M-002) */}
        <div
          className="selected-summary-confidence-row"
          title={confidenceTooltips[confidence]}
        >
          <div className={`selected-summary-confidence-dot confidence-${confidence}`} />
          <span className="selected-summary-confidence-label">
            {confidenceLabels[confidence]}
          </span>
        </div>
      </div>
    </div>
  );
}
