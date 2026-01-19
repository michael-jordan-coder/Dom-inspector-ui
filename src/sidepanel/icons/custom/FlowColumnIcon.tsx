import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Flow column icon - vertical stack with down arrow
 */
export function FlowColumnIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Two stacked rectangles */}
      <rect x="7" y="4" width="10" height="4" rx="1" />
      <rect x="7" y="16" width="10" height="4" rx="1" />
      {/* Down arrow between them */}
      <line x1="12" y1="9" x2="12" y2="15" />
      <polyline points="9,12 12,15 15,12" />
    </svg>
  );
}
