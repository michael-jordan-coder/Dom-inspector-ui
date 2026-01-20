import React, { useCallback } from 'react';
import { colors, spacing, transitions, typography } from '../tokens';
import { Check } from '../icons';

interface ToggleProps {
  /** Label text */
  label: string;
  /** Current checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    cursor: 'pointer',
    userSelect: 'none',
  } as React.CSSProperties,
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    borderRadius: 4,
    border: `1.5px solid ${colors.border}`,
    backgroundColor: 'transparent',
    color: 'transparent',
    transition: `all ${transitions.fast}`,
    flexShrink: 0,
  } as React.CSSProperties,
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    color: colors.text,
  } as React.CSSProperties,
  label: {
    fontSize: typography.xs,
    color: colors.text,
    lineHeight: 1,
  } as React.CSSProperties,
  focused: {
    boxShadow: '0 0 0 var(--ring-width) var(--ring-color)',
  } as React.CSSProperties,
  disabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  } as React.CSSProperties,
};

/**
 * Toggle - A checkbox with label.
 * Matches Figma's toggle/checkbox style.
 */
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: ToggleProps): React.ReactElement {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          onChange(!checked);
        }
      }
    },
    [disabled, checked, onChange]
  );

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      style={{
        ...styles.container,
        ...(disabled ? styles.disabled : {}),
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          ...styles.checkbox,
          ...(checked ? styles.checkboxChecked : {}),
        }}
      >
        {checked && <Check size={12} strokeWidth={2.5} />}
      </div>
      <span style={styles.label}>{label}</span>
    </div>
  );
}
