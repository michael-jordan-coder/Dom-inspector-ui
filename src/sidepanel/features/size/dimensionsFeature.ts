/**
 * Dimensions Feature
 * 
 * Controls width and height of the selected element.
 * Always applicable but shows computed values (read-only for now).
 * 
 * TODO: Full implementation would allow setting width/height.
 * Currently a stub showing the architecture.
 */

import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

// Note: We need to extend ComputedStylesSnapshot to include 'width' and 'height'
// For now, these are stubs

// =============================================================================
// Width
// =============================================================================

export const widthFeature: Feature<number> = {
  id: 'width',
  label: 'W',

  isApplicable: () => true,

  // TODO: Need 'width' in ComputedStylesSnapshot
  getState: (_styles: ComputedStylesSnapshot): number => {
    // Stub: would parse computed width
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'width',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    min: 0,
    max: 9999,
    step: 1,
    width: 80,
    showDropdown: true,
  } as FeatureUINumber,
};

// =============================================================================
// Height
// =============================================================================

export const heightFeature: Feature<number> = {
  id: 'height',
  label: 'H',

  isApplicable: () => true,

  // TODO: Need 'height' in ComputedStylesSnapshot
  getState: (_styles: ComputedStylesSnapshot): number => {
    // Stub: would parse computed height
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'height',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    min: 0,
    max: 9999,
    step: 1,
    width: 80,
    showDropdown: true,
  } as FeatureUINumber,
};
