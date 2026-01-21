import React, { useMemo } from 'react';
import type { ElementMetadata, SelectorConfidence } from '../../shared/types';
import { AppIcon } from '../primitives';
import { computeSelectorConfidence } from '../../shared/selector';
import { colors, spacing, radii } from '../tokens';

export interface SelectedSummaryProps {
  element: ElementMetadata;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minWidth: 0,
    flexShrink: 0,
    boxShadow: 'var(--shadow-sm)',
  },
  screenshotContainer: {
    position: 'relative',
    backgroundColor: 'var(--surface-raised)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    maxHeight: 180,
    overflow: 'hidden',
  },
  screenshot: {
    maxWidth: '100%',
    maxHeight: 180,
    objectFit: 'contain',
    display: 'block',
  },
  screenshotPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    color: 'var(--text-muted)',
    fontSize: 'var(--fs-xs)',
    gap: 'var(--space-2)',
  },
  infoContainer: {
    padding: spacing[3],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    borderTop: '1px solid var(--border)',
  },
  elementInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  },
  tagName: {
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
  },
  idBadge: {
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    fontSize: '11px',
    color: colors.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: '2px 6px',
    borderRadius: radii.sm,
  },
  classList: {
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    fontSize: '11px',
    color: colors.textMuted,
    lineHeight: 1.4,
    wordBreak: 'break-all',
  },
  selectorRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: spacing[1],
  },
  selectorLabel: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  },
  selector: {
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    fontSize: '10px',
    color: colors.textMuted,
    backgroundColor: 'var(--surface-raised)',
    padding: '4px 6px',
    borderRadius: radii.sm,
    wordBreak: 'break-all',
    lineHeight: 1.4,
  },
  confidenceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  confidenceLabel: {
    fontSize: '11px',
    color: colors.textMuted,
  },
  confidenceHigh: {
    backgroundColor: '#22c55e',
  },
  confidenceMedium: {
    backgroundColor: '#fbbf24',
  },
  confidenceLow: {
    backgroundColor: '#ef4444',
  },
};

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

  return (
    <div style={styles.card}>
      {/* Screenshot Preview */}
      <div style={styles.screenshotContainer}>
        {element.screenshot ? (
          <img
            src={element.screenshot}
            alt={`Screenshot of ${element.tagName} element`}
            style={styles.screenshot}
          />
        ) : (
          <div style={styles.screenshotPlaceholder}>
            <AppIcon name="image" size={24} state="muted" />
            <span>No preview available</span>
          </div>
        )}
      </div>

      {/* Element Info */}
      <div style={styles.infoContainer}>
        <div style={styles.elementInfo}>
          {/* Tag + ID */}
          <div style={styles.tagRow}>
            <span style={styles.tagName}>&lt;{element.tagName}&gt;</span>
            {element.id && (
              <span style={styles.idBadge}>#{element.id}</span>
            )}
          </div>

          {/* Class list */}
          {element.classList.length > 0 && (
            <div style={styles.classList}>
              .{element.classList.join(' .')}
            </div>
          )}
        </div>

        {/* Selector */}
        <div style={styles.selectorRow}>
          <span style={styles.selectorLabel}>Selector</span>
          <div style={styles.selector}>{element.selector}</div>
        </div>

        {/* Selector Confidence Indicator (M-002) */}
        <div
          style={styles.confidenceRow}
          title={confidenceTooltips[confidence]}
        >
          <div
            style={{
              ...styles.confidenceDot,
              ...(confidence === 'high' ? styles.confidenceHigh : {}),
              ...(confidence === 'medium' ? styles.confidenceMedium : {}),
              ...(confidence === 'low' ? styles.confidenceLow : {}),
            }}
          />
          <span style={styles.confidenceLabel}>
            {confidenceLabels[confidence]}
          </span>
        </div>
      </div>
    </div>
  );
}
