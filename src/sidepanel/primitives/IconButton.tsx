import React, { useCallback } from 'react';
import { colors, radii } from '../tokens';

interface IconButtonProps {
  /** The icon component to render */
  icon: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Whether button is in active/selected state */
  active?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Accessible label */
  title?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * IconButton - A small icon-only button.
 * Matches Figma's compact icon button style.
 * 
 * - 32x32 for md (default), 28x28 for sm
 * - Subtle hover/active states
 * - Rounded corners
 */
export function IconButton({
  icon,
  onClick,
  active = false,
  disabled = false,
  title,
  size = 'md',
}: IconButtonProps): React.ReactElement {
  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const buttonSize = size === 'sm' ? 28 : 32;

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: buttonSize,
    height: buttonSize,
    padding: 0,
    border: 'none',
    borderRadius: radii.md,
    backgroundColor: active ? colors.surfaceRaised : 'transparent',
    color: active ? colors.text : colors.textMuted,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.12s ease',
  };

  return (
    <button
      type="button"
      style={baseStyle}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = colors.surfaceRaised;
          e.currentTarget.style.color = colors.text;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.textMuted;
        }
      }}
    >
      {icon}
    </button>
  );
}
