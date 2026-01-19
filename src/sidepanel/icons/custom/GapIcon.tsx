import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Gap icon - spacing between elements
 */
export function GapIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Two rectangles with gap between */}
      <rect x="4" y="6" width="6" height="12" rx="1" />
      <rect x="14" y="6" width="6" height="12" rx="1" />
      {/* Gap indicator arrows */}
      <line x1="10" y1="12" x2="14" y2="12" />
      <polyline points="11,10 10,12 11,14" />
      <polyline points="13,10 14,12 13,14" />
    </svg>
  );
}
