/**
 * Design Tokens
 * 
 * Exported constants matching CSS variables defined in index.html.
 * Use these for TypeScript type safety and consistency.
 */

// =============================================================================
// Spacing Scale (4px base)
// =============================================================================
export const spacing = {
  1: 'var(--space-1)',   // 4px
  2: 'var(--space-2)',   // 8px
  3: 'var(--space-3)',   // 12px
  4: 'var(--space-4)',   // 16px
  5: 'var(--space-5)',   // 20px
  6: 'var(--space-6)',   // 24px
} as const;

// =============================================================================
// Border Radii
// =============================================================================
export const radii = {
  sm: 'var(--radius-sm)',     // 6px
  md: 'var(--radius-md)',     // 8px
  lg: 'var(--radius-lg)',     // 12px
  full: 'var(--radius-full)', // pill
} as const;

// =============================================================================
// Colors (semantic)
// =============================================================================
export const colors = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceRaised: 'var(--surface-raised)',
  border: 'var(--border)',
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  accent: 'var(--accent)',
  accentHover: 'var(--accent-hover)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
} as const;

// =============================================================================
// Typography
// =============================================================================
export const typography = {
  fontFamily: 'var(--font-family)',
  xs: 'var(--fs-xs)',     // 12px
  sm: 'var(--fs-sm)',     // 14px
  base: 'var(--fs-base)', // 16px
  lg: 'var(--fs-lg)',     // 18px
} as const;

// =============================================================================
// Transitions
// =============================================================================
export const transitions = {
  fast: 'var(--transition-fast)',   // 0.1s ease
  base: 'var(--transition-base)',   // 0.15s ease
  slow: 'var(--transition-slow)',   // 0.25s ease
} as const;

// =============================================================================
// Shadows
// =============================================================================
export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

// =============================================================================
// Focus Ring
// =============================================================================
export const focusRing = {
  color: 'var(--ring-color)',
  width: 'var(--ring-width)',
  offset: 'var(--ring-offset)',
} as const;

// =============================================================================
// Component Sizes (Figma-style compact controls)
// =============================================================================
export const sizes = {
  iconXs: 12,
  iconSm: 14,
  icon: 16,
  iconLg: 20,
  controlHeight: 'var(--control-height)',
  controlHeightSm: 'var(--control-height-sm)',
  controlIconWidth: 'var(--control-icon-width)',
  controlMinWidth: 'var(--control-min-width)',
  buttonHeight: 36,
  sectionPadding: spacing[3],
  controlGap: spacing[2],
} as const;

// =============================================================================
// Stroke width for icons (consistent with Figma style)
// =============================================================================
export const iconStroke = 1.5;

// =============================================================================
// Shared Styles (for reuse across components)
// =============================================================================
import type React from 'react';

export const sharedStyles = {
  /** Standard label style for control fields */
  label: {
    fontSize: typography.xs,
    fontWeight: 500,
    color: colors.textMuted,
    marginBottom: spacing[1],
  } as React.CSSProperties,

  /** Focus ring box-shadow (apply on :focus-visible) */
  focusRingStyle: `0 0 0 var(--ring-width) var(--ring-color)`,
} as const;

