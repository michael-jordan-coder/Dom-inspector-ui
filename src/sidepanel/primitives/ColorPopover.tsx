/**
 * ColorPopover
 * 
 * Enhanced popover for color selection with:
 * - CSS variable tokens from :root
 * - Recent colors
 * - Manual hex input
 * - Native eyedropper (Chrome 95+)
 * - WCAG contrast checker
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { colors, radii, spacing } from '../tokens';
import {
  getRecentColors,
  addRecentColor,
  isValidHex,
  normalizeHex,
  colorToHex
} from '../features/color/colorUtils';
import { AppIcon } from './AppIcon';

// Type for EyeDropper API (Chrome 95+)
interface EyeDropperResult {
  sRGBHex: string;
}

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<EyeDropperResult>;
    };
  }
}

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
  /** Background color for contrast calculation */
  contrastBackground?: string;
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
    width: 220,
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  hexInputRow: {
    display: 'flex',
    gap: spacing[1],
    alignItems: 'center',
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
  iconBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.sm,
    cursor: 'pointer',
    color: colors.textMuted,
    transition: 'all 0.1s',
    flexShrink: 0,
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
    flexShrink: 0,
  } as React.CSSProperties,
  contrastSection: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} 0`,
  } as React.CSSProperties,
  contrastPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
    borderRadius: radii.sm,
    fontSize: '10px',
    fontWeight: 600,
  } as React.CSSProperties,
  contrastInfo: {
    flex: 1,
    fontSize: '11px',
    color: colors.text,
  } as React.CSSProperties,
  contrastBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: radii.sm,
    fontSize: '9px',
    fontWeight: 600,
    marginLeft: spacing[1],
  } as React.CSSProperties,
  badgePass: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
  } as React.CSSProperties,
  badgeFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
  } as React.CSSProperties,
};

/**
 * Parse hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get WCAG compliance level
 */
function getWCAGLevel(ratio: number): { aa: boolean; aaa: boolean; aaLarge: boolean; aaaLarge: boolean } {
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}

export function ColorPopover({
  value,
  onSelect,
  onClose,
  tokens = [],
  anchorRect,
  contrastBackground = '#ffffff',
}: ColorPopoverProps): React.ReactElement {
  const [hexInput, setHexInput] = useState(colorToHex(value).toUpperCase());
  const [inputError, setInputError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const recentColors = getRecentColors();
  
  // Check if EyeDropper API is available
  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  // Position popover below anchor, within viewport
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const containerWidth = 220;
    const containerHeight = 340; // Approximate max height

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

  // Calculate contrast ratio
  const currentHex = colorToHex(value);
  const contrastRatio = useMemo(() => {
    return getContrastRatio(currentHex, contrastBackground);
  }, [currentHex, contrastBackground]);
  
  const wcagLevel = useMemo(() => {
    return getWCAGLevel(contrastRatio);
  }, [contrastRatio]);

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

  const handleEyeDropper = useCallback(async () => {
    if (!window.EyeDropper) return;
    
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex.toUpperCase();
      setHexInput(hex);
      addRecentColor(hex);
      onSelect(hex);
      onClose();
    } catch {
      // User cancelled or error
    }
  }, [onSelect, onClose]);

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
        {/* Contrast checker section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Contrast</div>
          <div style={styles.contrastSection}>
            <div
              style={{
                ...styles.contrastPreview,
                backgroundColor: contrastBackground,
                color: currentHex,
              }}
            >
              Aa
            </div>
            <div style={styles.contrastInfo}>
              <span>{contrastRatio.toFixed(2)}:1</span>
              {wcagLevel.aa ? (
                <span style={{ ...styles.contrastBadge, ...styles.badgePass }}>AA</span>
              ) : wcagLevel.aaLarge ? (
                <span style={{ ...styles.contrastBadge, ...styles.badgePass }}>AA Large</span>
              ) : (
                <span style={{ ...styles.contrastBadge, ...styles.badgeFail }}>Fail</span>
              )}
              {wcagLevel.aaa && (
                <span style={{ ...styles.contrastBadge, ...styles.badgePass }}>AAA</span>
              )}
            </div>
          </div>
        </div>

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

        {/* Hex input section with eyedropper */}
        <div style={styles.sectionLast}>
          <div style={styles.sectionTitle}>
            Hex Value
            {hasEyeDropper && (
              <button
                style={styles.iconBtn}
                onClick={handleEyeDropper}
                title="Pick color from screen"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surfaceRaised;
                  e.currentTarget.style.color = colors.textMuted;
                }}
              >
                <AppIcon name="selector" size={14} />
              </button>
            )}
          </div>
          <div style={styles.hexInputRow}>
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
