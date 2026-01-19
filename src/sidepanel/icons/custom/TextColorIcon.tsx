import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * TextColorIcon - Letter A with color bar underneath
 * Figma-style icon for text color control
 */
export function TextColorIcon({
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
      {/* Letter A */}
      <path
        d="M8 2L4 11H5.5L6.25 9H9.75L10.5 11H12L8 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6.75 7.5L8 4.5L9.25 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Color bar */}
      <rect
        x="3"
        y="13"
        width="10"
        height="2"
        rx="0.5"
        fill={color}
      />
    </svg>
  );
}
