/**
 * ColorField
 * 
 * Compact color control with swatch preview and value display.
 * Clicking opens a ColorPopover for token selection and manual input.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { colors, radii, sizes } from '../tokens';
import { parseColor, colorToHex } from '../features/color/colorUtils';
import { ColorPopover } from './ColorPopover';

// Animation class names
const ANIM_COLOR_CHANGE = 'animate-color-change';

/** Indicator state for showing property modification status */
export type IndicatorState = 'modified' | 'recent' | 'inherited' | 'none';

interface ColorFieldProps {
  /** Current color value (computed or raw) */
  value: string;
  /** Raw style value (preserves var() references) */
  rawValue?: string;
  /** Callback when color is changed */
  onChange: (value: string) => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** CSS tokens available for this property */
  tokens?: Array<{ name: string; value: string }>;
  /** Accessible label */
  ariaLabel?: string;
  /** Indicator state for showing modification status */
  indicator?: IndicatorState;
  /** Tooltip text for inherited value */
  inheritedTooltip?: string;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    height: sizes.controlHeight, // Consistent field height
    backgroundColor: colors.surfaceColorField, // Darker for color fields
    borderRadius: radii.sm,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'background-color 0.12s',
  } as React.CSSProperties,
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.controlIconWidth,
    height: '100%',
    color: colors.textMuted,
    flexShrink: 0,
    padding: 6,
  } as React.CSSProperties,
  swatch: {
    width: 16,
    height: 16,
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
    marginLeft: 6,
    flexShrink: 0,
    position: 'relative' as const,
  } as React.CSSProperties,
  // Checkerboard pattern for transparent colors
  swatchBg: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 'inherit',
    background: `
      linear-gradient(45deg, #808080 25%, transparent 25%),
      linear-gradient(-45deg, #808080 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #808080 75%),
      linear-gradient(-45deg, transparent 75%, #808080 75%)
    `,
    backgroundSize: '6px 6px',
    backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
    zIndex: 0,
  } as React.CSSProperties,
  swatchColor: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 'inherit',
    zIndex: 1,
  } as React.CSSProperties,
  value: {
    flex: 1,
    padding: '0 6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  tokenValue: {
    color: colors.accent,
  } as React.CSSProperties,
  disabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  indicator: {
    position: 'absolute' as const,
    left: 3,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
    cursor: 'help',
    zIndex: 2,
  } as React.CSSProperties,
  indicatorModified: {
    backgroundColor: 'var(--indicator-modified)',
  } as React.CSSProperties,
  indicatorRecent: {
    backgroundColor: 'var(--indicator-recent)',
  } as React.CSSProperties,
  indicatorInherited: {
    backgroundColor: 'var(--indicator-inherited)',
  } as React.CSSProperties,
  containerRelative: {
    position: 'relative' as const,
  } as React.CSSProperties,
};

export function ColorField({
  value,
  rawValue,
  onChange,
  disabled = false,
  icon,
  tokens = [],
  ariaLabel = 'Color',
  indicator = 'none',
  inheritedTooltip,
}: ColorFieldProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [animClass, setAnimClass] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<string>(value);

  const parsed = parseColor(value, rawValue);
  const hex = colorToHex(value);

  // Trigger animation when color changes
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setAnimClass(ANIM_COLOR_CHANGE);
      prevValueRef.current = value;
    }
  }, [value]);

  // Clear animation class after animation completes
  useEffect(() => {
    if (animClass) {
      const timer = setTimeout(() => {
        setAnimClass(null);
      }, 150); // Match --duration-fast
      return () => clearTimeout(timer);
    }
  }, [animClass]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleSelect = useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const anchorRect = containerRef.current?.getBoundingClientRect() ?? new DOMRect();

  return (
    <>
      <div
        ref={containerRef}
        style={{
          ...styles.container,
          ...(disabled ? styles.disabled : {}),
          ...(indicator !== 'none' ? styles.containerRelative : {}),
        }}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--neutral-700)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.surfaceColorField;
        }}
      >
        {/* Indicator dot */}
        {indicator !== 'none' && (
          <div
            style={{
              ...styles.indicator,
              ...(indicator === 'modified' ? styles.indicatorModified : {}),
              ...(indicator === 'recent' ? styles.indicatorRecent : {}),
              ...(indicator === 'inherited' ? styles.indicatorInherited : {}),
            }}
            title={
              indicator === 'modified' 
                ? 'Modified from default' 
                : indicator === 'recent' 
                  ? 'Recently changed' 
                  : inheritedTooltip || 'Inherited value'
            }
          />
        )}
        {icon && <div style={{...styles.icon, ...(indicator !== 'none' ? { paddingLeft: 10 } : {})}}>{icon}</div>}

        {/* Color swatch with transparency support */}
        <div style={styles.swatch} className={animClass || undefined}>
          <div style={styles.swatchBg} />
          <div style={{ ...styles.swatchColor, backgroundColor: hex }} />
        </div>

        {/* Value display */}
        <span
          style={{
            ...styles.value,
            ...(parsed.isToken ? styles.tokenValue : {}),
          }}
        >
          {parsed.display}
        </span>
      </div>

      {/* Popover */}
      {isOpen && containerRef.current && (
        <ColorPopover
          value={value}
          onSelect={handleSelect}
          onClose={handleClose}
          tokens={tokens}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
}
