import React, { useCallback, useState } from 'react';
import { colors, radii, transitions, sizes } from '../tokens';

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
 * - Rounded corners with focus ring
 */
export function IconButton({
  icon,
  onClick,
  active = false,
  disabled = false,
  title,
  size = 'md',
}: IconButtonProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const buttonSize = size === 'sm' ? sizes.iconLg + 8 : sizes.iconLg + 12; // 28 : 32

  const showHoverState = isHovered && !disabled && !active;
  const showFocusRing = isFocused && !disabled;

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: buttonSize,
    height: buttonSize,
    padding: 0,
    border: 'none',
    borderRadius: radii.md,
    backgroundColor: active || showHoverState ? colors.surfaceRaised : 'transparent',
    color: active || showHoverState ? colors.text : colors.textMuted,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: `all ${transitions.fast}`,
    outline: 'none',
    boxShadow: showFocusRing ? '0 0 0 var(--ring-width) var(--ring-color)' : 'none',
  };

  return (
    <button
      type="button"
      style={baseStyle}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {icon}
    </button>
  );
}
