/**
 * Opacity Feature
 * 
 * Controls the opacity/transparency of the selected element.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

function parseOpacity(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 100;
  return Math.round(num * 100);
}

export const opacityFeature: Feature<number> = {
  id: 'opacity',
  label: 'Opacity',

  isApplicable: () => true,

  getState: (styles: ComputedStylesSnapshot): number => {
    return parseOpacity(styles.opacity);
  },

  createPatch: (value: number) => ({
    property: 'opacity',
    value: (value / 100).toFixed(2),
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'opacity', size: 16 }),
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
  } as FeatureUINumber,
};
