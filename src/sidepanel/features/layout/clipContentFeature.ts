/**
 * Clip Content Feature
 * 
 * Controls overflow: hidden (clip content).
 * Always applicable to any element.
 */

import type { Feature, FeatureUIToggle } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

// Note: We need to extend ComputedStylesSnapshot to include 'overflow'
// For now, this is a stub that will always return false

export const clipContentFeature: Feature<boolean> = {
  id: 'clipContent',
  label: 'Clip content',

  isApplicable: () => true,

  // TODO: Need 'overflow' in ComputedStylesSnapshot
  getState: (_styles: ComputedStylesSnapshot): boolean => {
    // Stub: would check if overflow === 'hidden'
    return false;
  },

  createPatch: (value: boolean) => ({
    property: 'overflow',
    value: value ? 'hidden' : 'visible',
  }),

  ui: {
    type: 'toggle',
    label: 'Clip content',
  } as FeatureUIToggle,
};
