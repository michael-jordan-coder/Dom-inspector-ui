import React from 'react';
import { spacing } from '../tokens';

interface RowProps {
  children: React.ReactNode;
  /** Gap between items. Defaults to spacing[2] (8px) */
  gap?: string;
  /** Whether to wrap items */
  wrap?: boolean;
  /** Align items vertically */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify content horizontally */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Optional custom style overrides */
  style?: React.CSSProperties;
}

const alignMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const justifyMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
};

/**
 * Row - A horizontal flex container for laying out controls.
 * Used throughout the inspector for inline controls.
 */
export function Row({
  children,
  gap = spacing[2],
  wrap = false,
  align = 'center',
  justify = 'start',
  style,
}: RowProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        gap,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
