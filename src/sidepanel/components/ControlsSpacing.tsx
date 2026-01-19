import React, { useCallback, useState } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { applyStylePatch } from '../messaging/sidepanelBridge';

interface ControlsSpacingProps {
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
    gap: 'var(--space-4)',
  },
  title: {
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    color: 'var(--text)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 'var(--fs-xs)',
    fontWeight: 500,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-1) var(--space-2)',
    fontSize: 'var(--fs-xs)',
    color: 'var(--text-muted)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  linkButtonActive: {
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: 'var(--text)',
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-2)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: '10px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: 'var(--space-2)',
    fontSize: 'var(--fs-sm)',
    fontFamily: 'monospace',
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    textAlign: 'center',
    outline: 'none',
  },
};

type Side = 'Top' | 'Right' | 'Bottom' | 'Left';
const SIDES: Side[] = ['Top', 'Right', 'Bottom', 'Left'];

export function ControlsSpacing({
  selector,
  styles,
}: ControlsSpacingProps): React.ReactElement {
  const [linkPadding, setLinkPadding] = useState(false);
  const [linkMargin, setLinkMargin] = useState(false);

  // Parse pixel values
  const parseValue = (val: string): number => parseInt(val) || 0;

  const paddingValues = {
    Top: parseValue(styles.paddingTop),
    Right: parseValue(styles.paddingRight),
    Bottom: parseValue(styles.paddingBottom),
    Left: parseValue(styles.paddingLeft),
  };

  const marginValues = {
    Top: parseValue(styles.marginTop),
    Right: parseValue(styles.marginRight),
    Bottom: parseValue(styles.marginBottom),
    Left: parseValue(styles.marginLeft),
  };

  const handleChange = useCallback(
    async (property: string, value: string) => {
      try {
        await applyStylePatch(selector, property, value, styles[property as keyof ComputedStylesSnapshot]);
      } catch (e) {
        console.error('Failed to apply patch:', e);
      }
    },
    [selector, styles]
  );

  const handlePaddingChange = useCallback(
    async (side: Side, value: string) => {
      const numValue = parseInt(value) || 0;
      const pxValue = `${numValue}px`;

      if (linkPadding) {
        // Apply to all sides
        for (const s of SIDES) {
          await handleChange(`padding${s}`, pxValue);
        }
      } else {
        await handleChange(`padding${side}`, pxValue);
      }
    },
    [linkPadding, handleChange]
  );

  const handleMarginChange = useCallback(
    async (side: Side, value: string) => {
      const numValue = parseInt(value) || 0;
      const pxValue = `${numValue}px`;

      if (linkMargin) {
        // Apply to all sides
        for (const s of SIDES) {
          await handleChange(`margin${s}`, pxValue);
        }
      } else {
        await handleChange(`margin${side}`, pxValue);
      }
    },
    [linkMargin, handleChange]
  );

  return (
    <div style={componentStyles.card}>
      <h3 style={componentStyles.title}>Spacing</h3>

      {/* Padding */}
      <div style={componentStyles.section}>
        <div style={componentStyles.sectionHeader}>
          <span style={componentStyles.sectionTitle}>Padding</span>
          <button
            style={{
              ...componentStyles.linkButton,
              ...(linkPadding ? componentStyles.linkButtonActive : {}),
            }}
            onClick={() => setLinkPadding(!linkPadding)}
            title="Link all padding values"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {linkPadding ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              )}
            </svg>
            All
          </button>
        </div>
        <div style={componentStyles.inputGrid}>
          {SIDES.map((side) => (
            <div key={side} style={componentStyles.inputGroup}>
              <span style={componentStyles.inputLabel}>{side[0]}</span>
              <input
                type="number"
                style={componentStyles.input}
                value={paddingValues[side]}
                min={0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePaddingChange(side, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div style={componentStyles.section}>
        <div style={componentStyles.sectionHeader}>
          <span style={componentStyles.sectionTitle}>Margin</span>
          <button
            style={{
              ...componentStyles.linkButton,
              ...(linkMargin ? componentStyles.linkButtonActive : {}),
            }}
            onClick={() => setLinkMargin(!linkMargin)}
            title="Link all margin values"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            All
          </button>
        </div>
        <div style={componentStyles.inputGrid}>
          {SIDES.map((side) => (
            <div key={side} style={componentStyles.inputGroup}>
              <span style={componentStyles.inputLabel}>{side[0]}</span>
              <input
                type="number"
                style={componentStyles.input}
                value={marginValues[side]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMarginChange(side, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
