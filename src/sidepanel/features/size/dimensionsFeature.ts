/**
 * Dimensions Feature
 * 
 * Controls width and height of the selected element.
 * Parses computed width/height to display and edit.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

/**
 * Parse a CSS dimension value to a number.
 * Handles 'auto', '%', and pixel values.
 */
function parseDimension(value: string): number {
  if (!value || value === 'auto' || value === 'none') {
    return 0;
  }
  return parseFloat(value) || 0;
}

// =============================================================================
// Width
// =============================================================================

export const widthFeature: Feature<number> = {
  id: 'width',
  label: 'W',

  isApplicable: () => true,

  getState: (styles: ComputedStylesSnapshot): number => {
    return parseDimension(styles.width);
  },

  createPatch: (value: number) => ({
    property: 'width',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'width', size: 16 }),
    min: 0,
    max: 9999,
    step: 1,
    width: 80,
  } as FeatureUINumber,
};

// =============================================================================
// Height
// =============================================================================

export const heightFeature: Feature<number> = {
  id: 'height',
  label: 'H',

  isApplicable: () => true,

  getState: (styles: ComputedStylesSnapshot): number => {
    return parseDimension(styles.height);
  },

  createPatch: (value: number) => ({
    property: 'height',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'height', size: 16 }),
    min: 0,
    max: 9999,
    step: 1,
    width: 80,
  } as FeatureUINumber,
};
