/**
 * ColorPopover
 * 
 * Compact popover for color selection with:
 * - CSS variable tokens from :root
 * - Recent colors
 * - Manual hex input
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { colors, radii, spacing } from '../tokens';
import {
  getRecentColors,
  addRecentColor,
  isValidHex,
  normalizeHex,
  colorToHex
} from '../features/color/colorUtils';
import { AppIcon } from './AppIcon';

interface ColorPopoverProps {
  /** Currently selected color value */
  value: string;
  /** Callback when color is selected */
  onSelect: (value: string) => void;
  /** Close popover callback */
  onClose: () => void;
  /** CSS variables available in current context */
  tokens?: Array<{ name: string; value: string }>;
  /** Position anchor */
  anchorRect: DOMRect;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
  },
  container: {
    position: 'fixed' as const,
    zIndex: 1001,
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  } as React.CSSProperties,
  section: {
    padding: spacing[2],
    borderBottom: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  sectionLast: {
    padding: spacing[2],
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: spacing[2],
  } as React.CSSProperties,
  tokenList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    maxHeight: 120,
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  tokenItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: '4px 6px',
    borderRadius: radii.sm,
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  } as React.CSSProperties,
  tokenSwatch: {
    width: 14,
    height: 14,
    borderRadius: '3px',
    border: `1px solid ${colors.border}`,
    flexShrink: 0,
  } as React.CSSProperties,
  tokenName: {
    flex: 1,
    fontSize: '11px',
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '4px',
  } as React.CSSProperties,
  recentSwatch: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: 'transform 0.1s, border-color 0.1s',
  } as React.CSSProperties,
  hexInput: {
    display: 'flex',
    gap: spacing[2],
  } as React.CSSProperties,
  input: {
    flex: 1,
    height: 28,
    padding: '0 8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.sm,
    outline: 'none',
  } as React.CSSProperties,
  inputError: {
    borderColor: colors.error,
  } as React.CSSProperties,
  applyBtn: {
    height: 28,
    padding: '0 8px',
    fontSize: '11px',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.accent,
    border: 'none',
    borderRadius: radii.sm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
};

export function ColorPopover({
  value,
  onSelect,
  onClose,
  tokens = [],
  anchorRect,
}: ColorPopoverProps): React.ReactElement {
  const [hexInput, setHexInput] = useState(colorToHex(value).toUpperCase());
  const [inputError, setInputError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const recentColors = getRecentColors();

  // Position popover below anchor, within viewport
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const containerWidth = 200;
    const containerHeight = 280; // Approximate max height

    let top = anchorRect.bottom + 4;
    let left = anchorRect.left;

    // Keep within viewport
    if (left + containerWidth > window.innerWidth - 8) {
      left = window.innerWidth - containerWidth - 8;
    }
    if (top + containerHeight > window.innerHeight - 8) {
      top = anchorRect.top - containerHeight - 4;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  const handleTokenClick = useCallback((tokenName: string, tokenValue: string) => {
    addRecentColor(tokenValue);
    onSelect(`var(${tokenName})`);
    onClose();
  }, [onSelect, onClose]);

  const handleRecentClick = useCallback((color: string) => {
    addRecentColor(color);
    onSelect(color);
    onClose();
  }, [onSelect, onClose]);

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexInput(newValue);
    setInputError(newValue.length > 0 && !isValidHex(newValue.startsWith('#') ? newValue : `#${newValue}`));
  }, []);

  const handleHexSubmit = useCallback(() => {
    const normalized = normalizeHex(hexInput);
    if (isValidHex(normalized)) {
      addRecentColor(normalized);
      onSelect(normalized);
      onClose();
    } else {
      setInputError(true);
    }
  }, [hexInput, onSelect, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHexSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleHexSubmit, onClose]);

  const currentHex = colorToHex(value);

  return (
    <>
      {/* Overlay to catch clicks outside */}
      <div style={styles.overlay} onClick={onClose} />

      <div
        ref={containerRef}
        style={{
          ...styles.container,
          top: position.top,
          left: position.left,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tokens section */}
        {tokens.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Design Tokens</div>
            <div style={styles.tokenList}>
              {tokens.map((token) => (
                <div
                  key={token.name}
                  style={styles.tokenItem}
                  onClick={() => handleTokenClick(token.name, token.value)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surfaceRaised;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      ...styles.tokenSwatch,
                      backgroundColor: token.value
                    }}
                  />
                  <span style={styles.tokenName}>{token.name}</span>
                  {colorToHex(token.value) === currentHex && (
                    <AppIcon name="check" size={12} color={colors.accent} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent colors section */}
        {recentColors.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Recent</div>
            <div style={styles.recentGrid}>
              {recentColors.map((color, i) => (
                <div
                  key={`${color}-${i}`}
                  style={{
                    ...styles.recentSwatch,
                    backgroundColor: color,
                    borderColor: color === currentHex ? colors.accent : colors.border,
                  }}
                  onClick={() => handleRecentClick(color)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Hex input section */}
        <div style={styles.sectionLast}>
          <div style={styles.sectionTitle}>Hex Value</div>
          <div style={styles.hexInput}>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(inputError ? styles.inputError : {})
              }}
              value={hexInput}
              onChange={handleHexChange}
              onKeyDown={handleKeyDown}
              placeholder="#000000"
              autoFocus
            />
            <button
              style={styles.applyBtn}
              onClick={handleHexSubmit}
              disabled={inputError}
            >
              <AppIcon name="check" size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
