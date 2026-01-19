import React, { useCallback } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { applyStylePatch } from '../messaging/sidepanelBridge';

interface ControlsLayoutProps {
  selector: string;
  styles: ComputedStylesSnapshot;
  onStylesUpdated: (styles: ComputedStylesSnapshot) => void;
}

const componentStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  title: {
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 'var(--space-1)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  label: {
    fontSize: 'var(--fs-xs)',
    fontWeight: 500,
    color: 'var(--text-muted)',
    minWidth: 80,
  },
  select: {
    flex: 1,
    padding: 'var(--space-2)',
    fontSize: 'var(--fs-sm)',
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    cursor: 'pointer',
    outline: 'none',
  },
  sliderContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  slider: {
    flex: 1,
    height: 4,
    WebkitAppearance: 'none',
    appearance: 'none',
    backgroundColor: 'var(--border)',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: 'var(--fs-xs)',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    minWidth: 40,
    textAlign: 'right',
  },
  flexControls: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-2)',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--border)',
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
};

const DISPLAY_OPTIONS = ['block', 'inline-block', 'flex', 'grid', 'inline', 'none'];
const JUSTIFY_OPTIONS = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
const ALIGN_OPTIONS = ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'];

export function ControlsLayout({
  selector,
  styles,
}: ControlsLayoutProps): React.ReactElement {
  // Parse gap value to number (remove 'px')
  const gapValue = parseInt(styles.gap) || 0;
  const isFlex = styles.display === 'flex' || styles.display === 'inline-flex';
  const isGrid = styles.display === 'grid' || styles.display === 'inline-grid';

  const handleChange = useCallback(
    async (property: string, value: string) => {
      try {
        await applyStylePatch(selector, property, value, styles[property as keyof ComputedStylesSnapshot]);
        // Update will come via message callback
      } catch (e) {
        console.error('Failed to apply patch:', e);
      }
    },
    [selector, styles]
  );

  return (
    <div style={componentStyles.card}>
      <h3 style={componentStyles.title}>Layout</h3>

      {/* Display */}
      <div style={componentStyles.row}>
        <span style={componentStyles.label}>Display</span>
        <select
          style={componentStyles.select}
          value={styles.display}
          onChange={(e) => handleChange('display', e.target.value)}
        >
          {DISPLAY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Flex/Grid specific controls */}
      {(isFlex || isGrid) && (
        <div style={componentStyles.flexControls}>
          <div style={componentStyles.flexRow}>
            <span style={componentStyles.label}>Justify Content</span>
            <select
              style={componentStyles.select}
              value={styles.justifyContent}
              onChange={(e) => handleChange('justifyContent', e.target.value)}
            >
              {JUSTIFY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div style={componentStyles.flexRow}>
            <span style={componentStyles.label}>Align Items</span>
            <select
              style={componentStyles.select}
              value={styles.alignItems}
              onChange={(e) => handleChange('alignItems', e.target.value)}
            >
              {ALIGN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Gap */}
      <div style={componentStyles.row}>
        <span style={componentStyles.label}>Gap</span>
        <div style={componentStyles.sliderContainer}>
          <input
            type="range"
            style={componentStyles.slider}
            min={0}
            max={64}
            value={gapValue}
            onChange={(e) => handleChange('gap', `${e.target.value}px`)}
          />
          <span style={componentStyles.sliderValue as React.CSSProperties}>{gapValue}px</span>
        </div>
      </div>

      {/* Inject slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: var(--accent);
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
