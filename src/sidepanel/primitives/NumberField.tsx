import React, { useCallback, useState, useRef, useEffect } from 'react';
import { colors, radii, sizes, transitions, typography } from '../tokens';
import { ChevronDown } from '../icons';
import { useScrubbable } from '../hooks/useScrubbable';

interface NumberFieldProps {
  /** Current numeric value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Optional icon to show before the value */
  icon?: React.ReactNode;
  /** Unit suffix (e.g., "px", "%") */
  unit?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Placeholder when empty */
  placeholder?: string;
  /** Width of the field */
  width?: number | string;
  /** Show dropdown arrow */
  showDropdown?: boolean;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    height: sizes.controlHeight, // Match ColorField visual height
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    overflow: 'hidden',
    transition: `box-shadow ${transitions.fast}`,
  } as React.CSSProperties,
  containerFocused: {
    boxShadow: '0 0 0 var(--ring-width) var(--ring-color)',
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
    cursor: 'ew-resize',
    userSelect: 'none',
  } as React.CSSProperties,
  input: {
    flex: 1,
    height: '100%',
    padding: '0 8px',
    fontSize: typography.sm,
    lineHeight: sizes.controlHeight,
    fontFamily: 'inherit',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    minWidth: 0,
    MozAppearance: 'textfield',
  } as React.CSSProperties,
  unit: {
    fontSize: typography.xs,
    color: colors.textMuted,
    paddingRight: 6,
    flexShrink: 0,
    cursor: 'ew-resize',
    userSelect: 'none',
  } as React.CSSProperties,
  dropdown: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: '100%',
    color: colors.textMuted,
    cursor: 'pointer',
    flexShrink: 0,
    paddingRight: 4,
  } as React.CSSProperties,
  disabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  } as React.CSSProperties,
};

/**
 * NumberField - Compact numeric input with optional icon and dropdown.
 * Matches Figma's dimension/value input style.
 * 
 * Features:
 * - Optional leading icon
 * - Numeric input with min/max/step
 * - Optional unit suffix
 * - Optional dropdown arrow (for preset values)
 */
export function NumberField({
  value,
  onChange,
  icon,
  unit,
  min,
  max,
  step = 1,
  disabled = false,
  placeholder,
  width = 'auto',
  showDropdown = false,
}: NumberFieldProps): React.ReactElement {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Scrubbing support for drag-to-adjust
  const scrubHandlers = useScrubbable({
    value,
    onChange,
    min,
    max,
    step,
    decimals: step < 1,
  });

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
    },
    []
  );

  const handleBlur = useCallback(() => {
    let numValue = parseFloat(localValue);

    if (isNaN(numValue)) {
      numValue = value; // Revert to previous value
    } else {
      // Clamp to min/max
      if (min !== undefined && numValue < min) numValue = min;
      if (max !== undefined && numValue > max) numValue = max;
    }

    setLocalValue(String(numValue));
    if (numValue !== value) {
      onChange(numValue);
    }
  }, [localValue, value, min, max, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleBlur();
        inputRef.current?.blur();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowUp' ? step : -step;
        const multiplier = e.shiftKey ? 10 : 1;
        let newValue = value + delta * multiplier;

        if (min !== undefined && newValue < min) newValue = min;
        if (max !== undefined && newValue > max) newValue = max;

        setLocalValue(String(newValue));
        onChange(newValue);
      }
    },
    [handleBlur, step, value, min, max, onChange]
  );

  return (
    <div
      style={{
        ...styles.container,
        ...(width === 'auto' ? { flex: 1 } : { width }),
        ...(disabled ? styles.disabled : {}),
      }}
    >
      {icon && (
        <div
          style={styles.icon}
          onPointerDown={disabled ? undefined : scrubHandlers.onPointerDown}
          title="Drag to adjust"
        >
          {icon}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        style={styles.input}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
      />
      {unit && (
        <span
          style={styles.unit}
          onPointerDown={disabled ? undefined : scrubHandlers.onPointerDown}
          title="Drag to adjust"
        >
          {unit}
        </span>
      )}
      {showDropdown && (
        <div style={styles.dropdown}>
          <ChevronDown size={12} />
        </div>
      )}
      {/* Hide number input spinners */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
