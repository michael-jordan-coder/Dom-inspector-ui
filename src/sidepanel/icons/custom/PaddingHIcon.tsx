import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Horizontal padding icon - left/right padding indicator
 */
export function PaddingHIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      <rect x="4" y="6" width="16" height="12" rx="1" />
      {/* Left padding indicator */}
      <line x1="7" y1="9" x2="7" y2="15" />
      {/* Right padding indicator */}
      <line x1="17" y1="9" x2="17" y2="15" />
      {/* Horizontal arrows */}
      <line x1="8" y1="12" x2="16" y2="12" />
      <polyline points="10,10 8,12 10,14" />
      <polyline points="14,10 16,12 14,14" />
    </svg>
  );
}
