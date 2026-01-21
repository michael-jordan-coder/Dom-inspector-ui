/**
 * Inspector Header
 * 
 * Top action bar with global controls: Pick Element, Copy CSS.
 */

import React, { useState } from 'react';
import { colors, spacing, radii, transitions } from '../tokens';
import { AppIcon } from '../primitives';

export interface InspectorHeaderProps {
  isPickerActive: boolean;
  onPickerToggle: () => void;
  hasSelection: boolean;
  onCopyCSS: () => void;
}

// Action button component for header
function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'active' | 'danger';
  disabled?: boolean;
  title?: string;
}): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `6px ${spacing[2]}`,
    fontSize: 12,
    fontWeight: 500,
    border: 'none',
    borderRadius: radii.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: transitions.fast,
    opacity: disabled ? 0.5 : 1,
  };

  const variants: Record<string, React.CSSProperties> = {
    default: {
      color: colors.textMuted,
      backgroundColor: 'transparent',
    },
    primary: {
      color: colors.text,
      backgroundColor: colors.accent,
    },
    active: {
      color: colors.text,
      backgroundColor: colors.success,
    },
    danger: {
      color: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...variants[variant],
        transform: isHovered && !disabled ? 'scale(1.02)' : 'none',
      }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      {label}
    </button>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[3]} ${spacing[4]}`,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
    gap: spacing[2],
  } as React.CSSProperties,
  title: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    color: colors.text,
  } as React.CSSProperties,
  logo: {
    width: 18,
    height: 18,
    opacity: 0.7,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
  } as React.CSSProperties,
};



export function InspectorHeader({
  isPickerActive,
  onPickerToggle,
  hasSelection,
  onCopyCSS,
}: InspectorHeaderProps): React.ReactElement {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>
        <svg style={styles.logo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Inspector
      </h1>

      <div style={styles.actions}>

        {/* Copy CSS - only visible when element selected */}
        {hasSelection && (
          <ActionButton
            icon={<AppIcon name="copy" />}
            label="Copy"
            onClick={onCopyCSS}
            variant="primary"
            title="Copy all styles as CSS"
          />
        )}

        {/* Pick Element toggle */}
        <ActionButton
          icon={<AppIcon name={isPickerActive ? 'close' : 'pointer'} />}
          label={isPickerActive ? 'Stop' : 'Pick'}
          onClick={onPickerToggle}
          variant={isPickerActive ? 'active' : 'primary'}
          title={isPickerActive ? 'Stop picking (Esc)' : 'Pick an element'}
        />
      </div>
    </header>
  );
}
