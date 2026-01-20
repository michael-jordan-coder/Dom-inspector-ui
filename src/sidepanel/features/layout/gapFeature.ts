/**
 * Gap Feature
 * 
 * Controls the gap between flex/grid items.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

function parseGap(value: string): number {
  const num = parseInt(value);
  return isNaN(num) ? 0 : num;
}

function isFlexOrGrid(styles: ComputedStylesSnapshot): boolean {
  return (
    styles.display === 'flex' ||
    styles.display === 'inline-flex' ||
    styles.display === 'grid' ||
    styles.display === 'inline-grid'
  );
}

export const gapFeature: Feature<number> = {
  id: 'gap',
  label: 'Gap',

  isApplicable: isFlexOrGrid,

  getState: (styles: ComputedStylesSnapshot): number => {
    return parseGap(styles.gap);
  },

  createPatch: (value: number) => ({
    property: 'gap',
    value: `${value}px`,
  }),

  ui: {
    type: 'number',
    icon: React.createElement(AppIcon, { name: 'gap', size: 16 }),
    min: 0,
    max: 200,
    step: 1,
    width: 80,
  } as FeatureUINumber,
};
