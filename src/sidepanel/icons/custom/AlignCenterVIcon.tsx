import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Vertical align center icon - rectangle centered vertically
 */
export function AlignCenterVIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Horizontal center line */}
      <line x1="4" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="20" y2="12" />
      {/* Centered rectangle */}
      <rect x="9" y="6" width="6" height="12" rx="1" />
    </svg>
  );
}
