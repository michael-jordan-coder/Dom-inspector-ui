import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Opacity icon - grid pattern indicating transparency
 */
export function OpacityIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Checkerboard pattern (transparency indicator) */}
      <rect x="4" y="4" width="16" height="16" rx="2" />
      {/* Diagonal lines suggesting transparency */}
      <path d="M4 12 L12 4" />
      <path d="M4 20 L20 4" />
      <path d="M12 20 L20 12" />
    </svg>
  );
}
