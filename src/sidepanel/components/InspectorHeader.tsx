/**
 * Inspector Header
 * 
 * Top action bar with global controls: Pick Element, Copy CSS, Reset.
 */

import React, { useState } from 'react';
import { colors, spacing, radii, transitions } from '../tokens';

export interface InspectorHeaderProps {
  isPickerActive: boolean;
  onPickerToggle: () => void;
  hasSelection: boolean;
  hasChanges: boolean;
  onCopyCSS: () => void;
  onReset: () => void;
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

// Icons
const PickIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

const ResetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function InspectorHeader({
  isPickerActive,
  onPickerToggle,
  hasSelection,
  hasChanges,
  onCopyCSS,
  onReset,
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
        {/* Reset - only visible when changes exist */}
        {hasChanges && (
          <ActionButton
            icon={<ResetIcon />}
            label="Reset"
            onClick={onReset}
            variant="danger"
            title="Reset to original styles"
          />
        )}

        {/* Copy CSS - only visible when element selected */}
        {hasSelection && (
          <ActionButton
            icon={<CopyIcon />}
            label="Copy"
            onClick={onCopyCSS}
            variant="default"
            title="Copy all styles as CSS"
          />
        )}

        {/* Pick Element toggle */}
        <ActionButton
          icon={isPickerActive ? <StopIcon /> : <PickIcon />}
          label={isPickerActive ? 'Stop' : 'Pick'}
          onClick={onPickerToggle}
          variant={isPickerActive ? 'active' : 'primary'}
          title={isPickerActive ? 'Stop picking (Esc)' : 'Pick an element'}
        />
      </div>
    </header>
  );
}
