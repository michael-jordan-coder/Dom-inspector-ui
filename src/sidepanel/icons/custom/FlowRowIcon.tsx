import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Flow row icon - horizontal layout with right arrow
 */
export function FlowRowIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Two side-by-side rectangles */}
      <rect x="4" y="7" width="4" height="10" rx="1" />
      <rect x="16" y="7" width="4" height="10" rx="1" />
      {/* Right arrow between them */}
      <line x1="9" y1="12" x2="15" y2="12" />
      <polyline points="12,9 15,12 12,15" />
    </svg>
  );
}
