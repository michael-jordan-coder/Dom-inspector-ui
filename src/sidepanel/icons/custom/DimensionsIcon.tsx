import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Dimensions icon - width/height measurement
 */
export function DimensionsIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Rectangle outline */}
      <rect x="6" y="6" width="12" height="12" rx="1" />
      {/* Width dimension line */}
      <line x1="6" y1="21" x2="18" y2="21" />
      <line x1="6" y1="20" x2="6" y2="22" />
      <line x1="18" y1="20" x2="18" y2="22" />
      {/* Height dimension line */}
      <line x1="21" y1="6" x2="21" y2="18" />
      <line x1="20" y1="6" x2="22" y2="6" />
      <line x1="20" y1="18" x2="22" y2="18" />
    </svg>
  );
}
