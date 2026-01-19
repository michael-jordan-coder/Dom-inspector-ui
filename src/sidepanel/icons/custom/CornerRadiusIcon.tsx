import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Corner radius icon - shows a rounded corner
 * Matches Figma's corner radius control icon
 */
export function CornerRadiusIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* L-shaped corner with rounded inner edge */}
      <path d="M4 20V12C4 7.58172 7.58172 4 12 4H20" />
      {/* Small corner indicator marks */}
      <path d="M4 20H6" />
      <path d="M20 4V6" />
    </svg>
  );
}
