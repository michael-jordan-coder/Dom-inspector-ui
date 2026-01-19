/**
 * Padding Feature
 * 
 * Controls horizontal and vertical padding.
 * Always applicable to any element.
 * 
 * TODO: Currently simplified to horizontal/vertical pairs.
 * Full implementation would support individual sides.
 */

import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { PaddingHIcon, PaddingVIcon } from '../../icons';
import React from 'react';

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
    // Average of left and right, or just left
    const left = parsePadding(styles.paddingLeft);
    const right = parsePadding(styles.paddingRight);
    return left === right ? left : left;
  },

  // TODO: This should set both paddingLeft and paddingRight
  createPatch: (value: number) => ({
    property: 'paddingLeft',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(PaddingHIcon, { size: 14 }),
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

  // TODO: This should set both paddingTop and paddingBottom
  createPatch: (value: number) => ({
    property: 'paddingTop',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(PaddingVIcon, { size: 14 }),
    min: 0,
    max: 200,
    step: 1,
    width: 80,
  } as FeatureUINumber,
};
