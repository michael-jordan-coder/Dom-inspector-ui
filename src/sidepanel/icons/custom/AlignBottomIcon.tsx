import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Vertical align bottom icon - rectangle aligned to bottom edge
 */
export function AlignBottomIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Bottom edge line */}
      <line x1="4" y1="20" x2="20" y2="20" />
      {/* Centered rectangle aligned to bottom */}
      <rect x="9" y="8" width="6" height="12" rx="1" />
    </svg>
  );
}
