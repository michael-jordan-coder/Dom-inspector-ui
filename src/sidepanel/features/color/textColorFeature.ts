/**
 * Text Color Feature
 * 
 * Controls the foreground (text) color of the selected element.
 * Preserves CSS variable references when detected.
 */

import type { Feature, FeatureUIColor } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

export const textColorFeature: Feature<string> = {
  id: 'textColor',
  label: 'Text',

  // Text color is applicable to elements that can contain text
  // For simplicity, we enable it for all elements
  isApplicable: () => true,

  // Extract current color value
  getState: (styles: ComputedStylesSnapshot): string => {
    return styles.color || 'inherit';
  },

  // Generate CSS patch
  createPatch: (value: string) => ({
    property: 'color',
    value,
  }),

  // UI configuration
  ui: {
    type: 'color',
    property: 'color',
    showHexInput: true,
    showRecent: true,
    showTokens: true,
  } as FeatureUIColor,
};
