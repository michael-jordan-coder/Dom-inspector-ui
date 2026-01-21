/**
 * SegmentedTabs - Text-based tab switcher
 * 
 * A pill-style segment controller for switching between main views.
 */

import React, { useCallback } from 'react';
import { colors, radii, spacing, transitions } from '../tokens';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  badge?: number;
}

interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    padding: 3,
    gap: 2,
  } as React.CSSProperties,
  
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    flex: 1,
    padding: `8px ${spacing[3]}`,
    border: 'none',
    borderRadius: `calc(${radii.md} - 2px)`,
    backgroundColor: 'transparent',
    color: colors.textMuted,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    outline: 'none',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  
  tabActive: {
    backgroundColor: colors.surface,
    color: colors.text,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  
  tabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  
  badge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    backgroundColor: colors.accent,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 600,
  } as React.CSSProperties,
};

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedTabsProps<T>): React.ReactElement {
  const handleClick = useCallback(
    (optionValue: T) => {
      if (!disabled) {
        onChange(optionValue);
      }
    },
    [disabled, onChange]
  );

  return (
    <div role="tablist" style={styles.container}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {}),
              ...(disabled ? styles.tabDisabled : {}),
            }}
            onClick={() => handleClick(option.value)}
            disabled={disabled}
            onMouseEnter={(e) => {
              if (!disabled && !isActive) {
                e.currentTarget.style.color = colors.text;
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isActive) {
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {option.label}
            {option.badge !== undefined && option.badge > 0 && (
              <span style={styles.badge}>{option.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
