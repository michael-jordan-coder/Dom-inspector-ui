/**
 * Alignment Feature
 * 
 * Controls justify-content and align-items for flex/grid containers.
 */

import React from 'react';
import type { Feature, FeatureUISegmented } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

// =============================================================================
// Horizontal Alignment (justify-content)
// =============================================================================

type JustifyValue = 'flex-start' | 'center' | 'flex-end' | 'space-between';

function isFlexOrGrid(styles: ComputedStylesSnapshot): boolean {
  return (
    styles.display === 'flex' ||
    styles.display === 'inline-flex' ||
    styles.display === 'grid' ||
    styles.display === 'inline-grid'
  );
}

function parseJustify(value: string): JustifyValue {
  if (value === 'start' || value === 'flex-start' || value === 'normal') {
    return 'flex-start';
  }
  if (value === 'end' || value === 'flex-end') {
    return 'flex-end';
  }
  if (value === 'center') {
    return 'center';
  }
  if (value === 'space-between') {
    return 'space-between';
  }
  return 'flex-start';
}

export const justifyContentFeature: Feature<JustifyValue> = {
  id: 'justifyContent',
  label: 'Justify',

  isApplicable: isFlexOrGrid,

  getState: (styles: ComputedStylesSnapshot): JustifyValue => {
    return parseJustify(styles.justifyContent);
  },

  createPatch: (value: JustifyValue) => ({
    property: 'justifyContent',
    value,
  }),

  ui: {
    type: 'segmented',
    options: [
      {
        value: 'flex-start' as JustifyValue,
        icon: React.createElement(AppIcon, { name: 'alignLeft', size: 16 }),
        title: 'Align start',
      },
      {
        value: 'center' as JustifyValue,
        icon: React.createElement(AppIcon, { name: 'alignCenter', size: 16 }),
        title: 'Align center',
      },
      {
        value: 'flex-end' as JustifyValue,
        icon: React.createElement(AppIcon, { name: 'alignRight', size: 16 }),
        title: 'Align end',
      },
    ],
  } as FeatureUISegmented<JustifyValue>,
};

// =============================================================================
// Vertical Alignment (align-items)
// =============================================================================

type AlignValue = 'flex-start' | 'center' | 'flex-end' | 'stretch';

function parseAlign(value: string): AlignValue {
  if (value === 'start' || value === 'flex-start') {
    return 'flex-start';
  }
  if (value === 'end' || value === 'flex-end') {
    return 'flex-end';
  }
  if (value === 'center') {
    return 'center';
  }
  if (value === 'stretch' || value === 'normal') {
    return 'stretch';
  }
  return 'stretch';
}

export const alignItemsFeature: Feature<AlignValue> = {
  id: 'alignItems',
  label: 'Align',

  isApplicable: isFlexOrGrid,

  getState: (styles: ComputedStylesSnapshot): AlignValue => {
    return parseAlign(styles.alignItems);
  },

  createPatch: (value: AlignValue) => ({
    property: 'alignItems',
    value,
  }),

  ui: {
    type: 'segmented',
    options: [
      {
        value: 'flex-start' as AlignValue,
        icon: React.createElement(AppIcon, { name: 'alignTop', size: 16 }),
        title: 'Align top',
      },
      {
        value: 'center' as AlignValue,
        icon: React.createElement(AppIcon, { name: 'alignCenter', size: 16 }),
        title: 'Align center',
      },
      {
        value: 'flex-end' as AlignValue,
        icon: React.createElement(AppIcon, { name: 'alignBottom', size: 16 }),
        title: 'Align bottom',
      },
    ],
  } as FeatureUISegmented<AlignValue>,
};
