/**
 * Corner Radius Feature
 * 
 * Controls the border-radius of the selected element.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

function parseBorderRadius(value: string): number {
  const firstValue = value.split(' ')[0];
  return parseInt(firstValue) || 0;
}

export const cornerRadiusFeature: Feature<number> = {
  id: 'cornerRadius',
  label: 'Corner radius',

  isApplicable: () => true,

  getState: (styles: ComputedStylesSnapshot): number => {
    return parseBorderRadius(styles.borderRadius);
  },

  createPatch: (value: number) => ({
    property: 'borderRadius',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'cornerRadius', size: 16 }),
    min: 0,
    max: 999,
    step: 1,
  } as FeatureUINumber,
};
