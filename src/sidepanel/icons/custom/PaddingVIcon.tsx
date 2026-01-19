import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Vertical padding icon - top/bottom padding indicator
 */
export function PaddingVIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Outer frame */}
      <rect x="6" y="4" width="12" height="16" rx="1" />
      {/* Top padding indicator */}
      <line x1="9" y1="7" x2="15" y2="7" />
      {/* Bottom padding indicator */}
      <line x1="9" y1="17" x2="15" y2="17" />
      {/* Vertical arrows */}
      <line x1="12" y1="8" x2="12" y2="16" />
      <polyline points="10,10 12,8 14,10" />
      <polyline points="10,14 12,16 14,14" />
    </svg>
  );
}
