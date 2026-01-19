/**
 * Corner Radius Feature
 * 
 * Controls the border-radius of the selected element.
 * Always applicable to any element.
 */

import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { CornerRadiusIcon } from '../../icons';
import React from 'react';

/**
 * Parse border-radius value (e.g., "8px", "0px") to number
 */
function parseBorderRadius(value: string): number {
  // Handle complex values like "8px 8px 8px 8px" by taking first value
  const firstValue = value.split(' ')[0];
  return parseInt(firstValue) || 0;
}

export const cornerRadiusFeature: Feature<number> = {
  id: 'cornerRadius',
  label: 'Corner radius',

  // Border radius is always applicable
  isApplicable: () => true,

  // Extract current radius value in pixels
  getState: (styles: ComputedStylesSnapshot): number => {
    return parseBorderRadius(styles.borderRadius);
  },

  // Generate CSS patch
  createPatch: (value: number) => ({
    property: 'borderRadius',
    value: `${value}px`,
  }),

  // UI configuration
  ui: {
    type: 'number',
    icon: React.createElement(CornerRadiusIcon, { size: 14 }),
    min: 0,
    max: 999,
    step: 1,
  } as FeatureUINumber,
};
