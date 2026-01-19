/**
 * Opacity Feature
 * 
 * Controls the opacity/transparency of the selected element.
 * Always applicable to any element.
 */

import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { OpacityIcon } from '../../icons';
import React from 'react';

/**
 * Parse opacity string (e.g., "1", "0.5") to percentage (0-100)
 */
function parseOpacity(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 100;
  return Math.round(num * 100);
}

export const opacityFeature: Feature<number> = {
  id: 'opacity',
  label: 'Opacity',

  // Opacity is always applicable
  isApplicable: () => true,

  // Extract current opacity as percentage (0-100)
  getState: (styles: ComputedStylesSnapshot): number => {
    return parseOpacity(styles.opacity);
  },

  // Generate CSS patch - convert percentage to decimal
  createPatch: (value: number) => ({
    property: 'opacity',
    value: (value / 100).toFixed(2),
  }),

  // UI configuration
  ui: {
    type: 'number',
    icon: React.createElement(OpacityIcon, { size: 14 }),
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    width: 100,
  } as FeatureUINumber,
};
