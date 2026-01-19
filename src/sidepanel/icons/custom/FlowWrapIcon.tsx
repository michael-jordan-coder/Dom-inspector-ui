import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Flow wrap icon - wrapping layout indicator
 */
export function FlowWrapIcon({ size = 16, className }: IconProps): React.ReactElement {
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
      {/* Top row - three small boxes */}
      <rect x="4" y="4" width="4" height="4" rx="0.5" />
      <rect x="10" y="4" width="4" height="4" rx="0.5" />
      <rect x="16" y="4" width="4" height="4" rx="0.5" />
      {/* Bottom row - two boxes (wrapped) */}
      <rect x="4" y="12" width="4" height="4" rx="0.5" />
      <rect x="10" y="12" width="4" height="4" rx="0.5" />
      {/* Wrap arrow */}
      <path d="M20 8 L20 10 C20 11 19 12 18 12 L16 12" />
    </svg>
  );
}
