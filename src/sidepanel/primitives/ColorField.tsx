/**
 * ColorField
 * 
 * Compact color control with swatch preview and value display.
 * Clicking opens a ColorPopover for token selection and manual input.
 */

import React, { useState, useCallback, useRef } from 'react';
import { colors, radii, sizes } from '../tokens';
import { parseColor, colorToHex } from '../features/color/colorUtils';
import { ColorPopover } from './ColorPopover';

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
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    height: sizes.controlHeight, // Consistent field height
    backgroundColor: 'var(--surface-color-field)', // Darker for color fields
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
};

export function ColorField({
  value,
  rawValue,
  onChange,
  disabled = false,
  icon,
  tokens = [],
  ariaLabel = 'Color',
}: ColorFieldProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parseColor(value, rawValue);
  const hex = colorToHex(value);

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
          e.currentTarget.style.backgroundColor = colors.surfaceRaised;
        }}
      >
        {icon && <div style={styles.icon}>{icon}</div>}

        {/* Color swatch with transparency support */}
        <div style={styles.swatch}>
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
