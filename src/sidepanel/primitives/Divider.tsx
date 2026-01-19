import React from 'react';
import { colors, spacing } from '../tokens';

interface DividerProps {
  /** Vertical margin around divider */
  margin?: string;
}

/**
 * Divider - A horizontal separator line.
 * Matches Figma's section divider.
 */
export function Divider({ margin = spacing[4] }: DividerProps): React.ReactElement {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginTop: margin,
        marginBottom: margin,
      }}
    />
  );
}
