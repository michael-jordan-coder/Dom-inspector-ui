import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Clip content icon - overflow hidden indicator
 */
export function ClipContentIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Outer container */}
      <rect x="4" y="4" width="16" height="16" rx="2" />
      {/* Content that overflows (dashed to show clipping) */}
      <rect x="8" y="8" width="14" height="14" rx="1" strokeDasharray="2 2" />
      {/* Scissors icon or clip indicator */}
      <line x1="20" y1="4" x2="20" y2="8" />
      <line x1="16" y1="4" x2="20" y2="4" />
    </svg>
  );
}
