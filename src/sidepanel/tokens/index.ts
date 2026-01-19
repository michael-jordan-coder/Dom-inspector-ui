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
// Component Sizes (Figma-style compact controls)
// =============================================================================
export const sizes = {
  iconSm: 14,
  icon: 16,
  iconLg: 20,
  controlHeight: 32,
  buttonHeight: 36,
  sectionPadding: spacing[3],
  controlGap: spacing[2],
} as const;

// =============================================================================
// Stroke width for icons (consistent with Figma style)
// =============================================================================
export const iconStroke = 1.5;
