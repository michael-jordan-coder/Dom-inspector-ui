import React from 'react';
import type { ElementMetadata } from '../../shared/types';
import { AppIcon } from '../primitives';

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
};

export function SelectedSummary({
  element,
}: SelectedSummaryProps): React.ReactElement {

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


    </div>
  );
}
