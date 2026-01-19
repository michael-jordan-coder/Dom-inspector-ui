/**
 * Background Color Feature
 * 
 * Controls the background color of the selected element.
 * Preserves CSS variable references when detected.
 */

import type { Feature, FeatureUIColor } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

export const backgroundColorFeature: Feature<string> = {
  id: 'backgroundColor',
  label: 'Background',

  // Background color is always applicable
  isApplicable: () => true,

  // Extract current background color value
  getState: (styles: ComputedStylesSnapshot): string => {
    return styles.backgroundColor || 'transparent';
  },

  // Generate CSS patch
  createPatch: (value: string) => ({
    property: 'backgroundColor',
    value,
  }),

  // UI configuration
  ui: {
    type: 'color',
    property: 'backgroundColor',
    showHexInput: true,
    showRecent: true,
    showTokens: true,
  } as FeatureUIColor,
};
