import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * BackgroundColorIcon - Paint bucket / filled square
 * Figma-style icon for background color control
 */
export function BackgroundColorIcon({
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
      {/* Filled square with corner */}
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Inner fill indicator */}
      <rect
        x="4"
        y="4"
        width="8"
        height="8"
        rx="1"
        fill={color}
        opacity="0.3"
      />
    </svg>
  );
}
