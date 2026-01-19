import React, { useCallback } from 'react';
import { colors, radii } from '../tokens';

export interface SegmentedOption<T extends string> {
  value: T;
  icon: React.ReactNode;
  title?: string;
}

interface SegmentedProps<T extends string> {
  /** Available options */
  options: SegmentedOption<T>[];
  /** Current selected value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Whether the entire control is disabled */
  disabled?: boolean;
  /** Gap between buttons. Set to 0 for connected pills */
  gap?: number;
  /** Whether buttons should be visually connected (pill style) */
  connected?: boolean;
  /** Whether to stretch to fill available width */
  stretch?: boolean;
}

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    padding: 2,
  } as React.CSSProperties,
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 36, // 36px + 2px padding each side = 40px total
    padding: 0,
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: colors.textMuted,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  } as React.CSSProperties,
  buttonActive: {
    backgroundColor: colors.surface,
    color: colors.text,
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  } as React.CSSProperties,
};

/**
 * Segmented - A group of mutually exclusive icon buttons.
 * Matches Figma's segmented control style.
 * 
 * Used for alignment, flow direction, etc.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  gap = 0,
  connected = true,
  stretch = false,
}: SegmentedProps<T>): React.ReactElement {
  const handleClick = useCallback(
    (optionValue: T) => {
      if (!disabled) {
        onChange(optionValue);
      }
    },
    [disabled, onChange]
  );

  return (
    <div
      role="radiogroup"
      style={{
        ...styles.container,
        gap,
        ...(connected ? {} : { backgroundColor: 'transparent', padding: 0 }),
        ...(stretch ? { flex: 1, display: 'flex' } : {}),
      }}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            style={{
              ...styles.button,
              ...(isActive ? styles.buttonActive : {}),
              ...(disabled ? styles.buttonDisabled : {}),
              ...(stretch ? { flex: 1 } : {}),
            }}
            onClick={() => handleClick(option.value)}
            disabled={disabled}
            title={option.title}
            onMouseEnter={(e) => {
              if (!disabled && !isActive) {
                e.currentTarget.style.color = colors.text;
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isActive) {
                e.currentTarget.style.color = colors.textMuted;
              }
            }}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
