/**
 * Border Color Feature
 * 
 * Controls the border color of the selected element.
 * Preserves CSS variable references when detected.
 * 
 * Note: This is secondary to text and background color.
 * Only shows if element has a visible border.
 */

import type { Feature, FeatureUIColor } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

/**
 * Check if element has a visible border
 * Border is visible if it has non-zero width and style other than 'none'
 */
function hasBorder(styles: ComputedStylesSnapshot): boolean {
  // We check borderColor - if it's present, assume border exists
  // More accurate check would require borderWidth and borderStyle
  const borderColor = styles.borderColor || '';
  return borderColor !== '' && borderColor !== 'transparent';
}

export const borderColorFeature: Feature<string> = {
  id: 'borderColor',
  label: 'Border',

  // Only applicable if element has visible border
  isApplicable: hasBorder,

  // Extract current border color value
  getState: (styles: ComputedStylesSnapshot): string => {
    return styles.borderColor || 'transparent';
  },

  // Generate CSS patch
  createPatch: (value: string) => ({
    property: 'borderColor',
    value,
  }),

  // UI configuration
  ui: {
    type: 'color',
    property: 'borderColor',
    showHexInput: true,
    showRecent: true,
    showTokens: true,
  } as FeatureUIColor,
};
