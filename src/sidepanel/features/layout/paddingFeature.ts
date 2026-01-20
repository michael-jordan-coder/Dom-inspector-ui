/**
 * Padding Feature
 * 
 * Controls horizontal and vertical padding.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

function parsePadding(value: string): number {
  return parseInt(value) || 0;
}

// =============================================================================
// Horizontal Padding (left + right)
// =============================================================================

export const paddingHFeature: Feature<number> = {
  id: 'paddingH',
  label: 'Padding X',

  isApplicable: () => true,

  getState: (styles: ComputedStylesSnapshot): number => {
    const left = parsePadding(styles.paddingLeft);
    const right = parsePadding(styles.paddingRight);
    return left === right ? left : left;
  },

  createPatch: (value: number) => ({
    property: 'paddingLeft',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'paddingH', size: 16 }),
    min: 0,
    max: 200,
    step: 1,
    width: 80,
  } as FeatureUINumber,
};

// =============================================================================
// Vertical Padding (top + bottom)
// =============================================================================

export const paddingVFeature: Feature<number> = {
  id: 'paddingV',
  label: 'Padding Y',

  isApplicable: () => true,

  getState: (styles: ComputedStylesSnapshot): number => {
    const top = parsePadding(styles.paddingTop);
    const bottom = parsePadding(styles.paddingBottom);
    return top === bottom ? top : top;
  },

  createPatch: (value: number) => ({
    property: 'paddingTop',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'paddingV', size: 16 }),
    min: 0,
    max: 200,
    step: 1,
    width: 80,
  } as FeatureUINumber,
};
