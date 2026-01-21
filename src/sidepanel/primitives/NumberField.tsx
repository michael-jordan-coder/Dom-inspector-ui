import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { colors, radii, sizes, transitions, typography } from '../tokens';
import { AppIcon } from './AppIcon';
import { useScrubbable } from '../hooks/useScrubbable';
import { PresetPopover } from './PresetPopover';
import { useRecentValues, getPresetsForProperty } from '../hooks/useRecentValues';
import { evaluateMathExpression, isMathExpression, formatComputedPreview } from '../utils/mathParser';

// Animation class names
const ANIM_SUCCESS = 'animate-value-success';
const ANIM_ERROR = 'animate-value-error';

/** Indicator state for showing property modification status */
export type IndicatorState = 'modified' | 'recent' | 'inherited' | 'none';

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
  /** Custom content to render at the end */
  suffix?: React.ReactNode;
  /** Enable unit cycling on click */
  cyclableUnit?: boolean;
  /** Callback when unit is cycled (receives new unit) */
  onUnitCycle?: (unit: string) => void;
  /** Property type for preset suggestions (e.g., 'padding', 'fontSize') */
  propertyType?: string;
  /** Show preset popover on focus */
  showPresets?: boolean;
  /** Indicator state for showing modification status */
  indicator?: IndicatorState;
  /** Tooltip text for inherited value */
  inheritedTooltip?: string;
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
    transition: 'color 0.1s ease',
  } as React.CSSProperties,
  unitClickable: {
    cursor: 'pointer',
    borderRadius: '2px',
    padding: '2px 4px',
    marginRight: 2,
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
  ghostText: {
    position: 'absolute' as const,
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: typography.xs,
    color: colors.textMuted,
    opacity: 0.6,
    pointerEvents: 'none' as const,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  inputWrapper: {
    position: 'relative' as const,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  } as React.CSSProperties,
  indicator: {
    position: 'absolute' as const,
    left: 2,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
    pointerEvents: 'auto' as const,
    cursor: 'help',
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
  suffix,
  cyclableUnit = false,
  onUnitCycle,
  propertyType,
  showPresets = false,
  indicator = 'none',
  inheritedTooltip,
}: NumberFieldProps): React.ReactElement {
  const [localValue, setLocalValue] = useState(String(value));
  const [animClass, setAnimClass] = useState<string | null>(null);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<number>(value);
  const isUserEditingRef = useRef(false);

  // Get presets and recent values for this property type
  const effectivePropertyType = propertyType || 'default';
  const presets = getPresetsForProperty(effectivePropertyType);
  const { recentValues, addRecentValue } = useRecentValues(effectivePropertyType);

  // Compute ghost text for math expressions
  const ghostText = useMemo(() => {
    if (!isMathExpression(localValue)) return '';
    const result = evaluateMathExpression(localValue, value);
    return formatComputedPreview(result);
  }, [localValue, value]);

  // Scrubbing support for drag-to-adjust
  const scrubHandlers = useScrubbable({
    value,
    onChange,
    min,
    max,
    step,
    decimals: step < 1,
  });

  // Sync local value when external value changes and trigger animation
  useEffect(() => {
    setLocalValue(String(value));
    
    // Trigger success animation if value changed (not during user editing)
    if (prevValueRef.current !== value && !isUserEditingRef.current) {
      setAnimClass(ANIM_SUCCESS);
    }
    prevValueRef.current = value;
  }, [value]);

  // Clear animation class after animation completes
  useEffect(() => {
    if (animClass) {
      const timer = setTimeout(() => {
        setAnimClass(null);
      }, 250); // Match --duration-normal
      return () => clearTimeout(timer);
    }
  }, [animClass]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      isUserEditingRef.current = true;
    },
    []
  );

  const handleFocus = useCallback(() => {
    isUserEditingRef.current = true;
    setIsFocused(true);
    if (showPresets && !disabled) {
      setIsPresetOpen(true);
    }
  }, [showPresets, disabled]);

  const handleBlur = useCallback(() => {
    isUserEditingRef.current = false;
    setIsFocused(false);
    // Delay closing preset to allow click events to fire
    setTimeout(() => setIsPresetOpen(false), 150);
    
    let numValue: number;

    // Check if it's a math expression
    if (isMathExpression(localValue)) {
      const result = evaluateMathExpression(localValue, value);
      if (result.isValid) {
        numValue = result.value;
      } else {
        numValue = value; // Revert to previous value
        setAnimClass(ANIM_ERROR);
        setLocalValue(String(value));
        return;
      }
    } else {
      numValue = parseFloat(localValue);
      if (isNaN(numValue)) {
        numValue = value; // Revert to previous value
        setAnimClass(ANIM_ERROR); // Shake on invalid
        setLocalValue(String(value));
        return;
      }
    }

    // Clamp to min/max
    if (min !== undefined && numValue < min) numValue = min;
    if (max !== undefined && numValue > max) numValue = max;

    setLocalValue(String(numValue));
    if (numValue !== value) {
      prevValueRef.current = numValue; // Update ref to prevent double animation
      setAnimClass(ANIM_SUCCESS);
      addRecentValue(numValue);
      onChange(numValue);
    }
  }, [localValue, value, min, max, onChange, addRecentValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleBlur();
        inputRef.current?.blur();
        // Move focus to next field
        const form = inputRef.current?.closest('form');
        if (form) {
          const inputs = Array.from(form.querySelectorAll('input:not([disabled])'));
          const index = inputs.indexOf(inputRef.current!);
          if (index < inputs.length - 1) {
            (inputs[index + 1] as HTMLInputElement).focus();
          }
        }
      } else if (e.key === 'Escape') {
        // Revert to original value
        setLocalValue(String(value));
        inputRef.current?.blur();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowUp' ? step : -step;
        // Shift = 10x, Alt = 0.1x, default = 1x
        let multiplier = 1;
        if (e.shiftKey) multiplier = 10;
        if (e.altKey) multiplier = 0.1;
        
        let newValue = value + delta * multiplier;

        // Round to avoid floating point issues
        newValue = Math.round(newValue * 1000) / 1000;

        if (min !== undefined && newValue < min) newValue = min;
        if (max !== undefined && newValue > max) newValue = max;

        setLocalValue(String(newValue));
        prevValueRef.current = newValue;
        setAnimClass(ANIM_SUCCESS);
        onChange(newValue);
      }
    },
    [handleBlur, step, value, min, max, onChange]
  );

  return (
    <div
      ref={containerRef}
      className={animClass || undefined}
      style={{
        ...styles.container,
        ...(width === 'auto' ? { flex: 1 } : { width }),
        ...(disabled ? styles.disabled : {}),
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
      {icon && (
        <div
          style={{
            ...styles.icon,
            ...(indicator !== 'none' ? { paddingLeft: 10 } : {}),
          }}
          onPointerDown={disabled ? undefined : scrubHandlers.onPointerDown}
          title="Drag to adjust"
        >
          {icon}
        </div>
      )}
      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          style={styles.input}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
        />
        {/* Ghost text for math expression preview */}
        {ghostText && isFocused && (
          <span style={styles.ghostText}>{ghostText}</span>
        )}
      </div>
      {unit && (
        <span
          style={{
            ...styles.unit,
            ...(cyclableUnit && onUnitCycle ? styles.unitClickable : {}),
          }}
          onPointerDown={disabled || (cyclableUnit && onUnitCycle) ? undefined : scrubHandlers.onPointerDown}
          onClick={cyclableUnit && onUnitCycle && !disabled ? (e) => {
            e.stopPropagation();
            onUnitCycle(unit);
          } : undefined}
          onMouseEnter={cyclableUnit && onUnitCycle ? (e) => {
            e.currentTarget.style.color = colors.accent;
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
          } : undefined}
          onMouseLeave={cyclableUnit && onUnitCycle ? (e) => {
            e.currentTarget.style.color = colors.textMuted;
            e.currentTarget.style.backgroundColor = 'transparent';
          } : undefined}
          title={cyclableUnit && onUnitCycle ? "Click to cycle unit" : "Drag to adjust"}
        >
          {unit}
        </span>
      )}
      {suffix}
      {showDropdown && !suffix && (
        <div style={styles.dropdown}>
          <AppIcon name="chevronDown" size={12} />
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

      {/* Preset Popover */}
      {isPresetOpen && showPresets && containerRef.current && (
        <PresetPopover
          presets={presets}
          recentValues={recentValues}
          currentValue={value}
          unit={unit}
          onSelect={(selectedValue) => {
            setLocalValue(String(selectedValue));
            prevValueRef.current = selectedValue;
            setAnimClass(ANIM_SUCCESS);
            addRecentValue(selectedValue);
            onChange(selectedValue);
            setIsPresetOpen(false);
          }}
          onClose={() => setIsPresetOpen(false)}
          anchorRect={containerRef.current.getBoundingClientRect()}
        />
      )}
    </div>
  );
}
