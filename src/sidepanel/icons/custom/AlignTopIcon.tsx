import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Vertical align top icon - rectangle aligned to top edge
 */
export function AlignTopIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Top edge line */}
      <line x1="4" y1="4" x2="20" y2="4" />
      {/* Centered rectangle aligned to top */}
      <rect x="9" y="4" width="6" height="12" rx="1" />
    </svg>
  );
}
