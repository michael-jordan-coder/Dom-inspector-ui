import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * BorderColorIcon - Square outline with emphasis on border
 * Figma-style icon for border color control
 */
export function BorderColorIcon({
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.5,
}: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer square with thick border */}
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="1.5"
        stroke={color}
        strokeWidth={strokeWidth * 1.5}
        fill="none"
      />
      {/* Inner dashed to suggest border-only */}
      <rect
        x="5"
        y="5"
        width="6"
        height="6"
        rx="0.5"
        stroke={color}
        strokeWidth={0.75}
        strokeDasharray="1.5 1.5"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
