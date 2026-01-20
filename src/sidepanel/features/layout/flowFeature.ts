/**
 * Flow Feature
 * 
 * Controls flex-direction and display mode.
 */

import React from 'react';
import type { Feature, FeatureUISegmented } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import { AppIcon } from '../../primitives/AppIcon';

type FlowValue = 'row' | 'column' | 'wrap' | 'grid';

function parseFlow(styles: ComputedStylesSnapshot): FlowValue {
  if (styles.display === 'grid' || styles.display === 'inline-grid') {
    return 'grid';
  }
  if (styles.display === 'flex' || styles.display === 'inline-flex') {
    return 'row';
  }
  return 'row';
}

export const flowFeature: Feature<FlowValue> = {
  id: 'flow',
  label: 'Flow',

  isApplicable: (styles: ComputedStylesSnapshot): boolean => {
    return (
      styles.display === 'flex' ||
      styles.display === 'inline-flex' ||
      styles.display === 'grid' ||
      styles.display === 'inline-grid'
    );
  },

  getState: parseFlow,

  createPatch: (value: FlowValue) => {
    switch (value) {
      case 'row':
        return { property: 'flexDirection', value: 'row' };
      case 'column':
        return { property: 'flexDirection', value: 'column' };
      case 'wrap':
        return { property: 'flexWrap', value: 'wrap' };
      case 'grid':
        return { property: 'display', value: 'grid' };
      default:
        return { property: 'flexDirection', value: 'row' };
    }
  },

  ui: {
    type: 'segmented',
    options: [
      {
        value: 'row' as FlowValue,
        icon: React.createElement(AppIcon, { name: 'flowRow', size: 18 }),
        title: 'Row',
      },
      {
        value: 'column' as FlowValue,
        icon: React.createElement(AppIcon, { name: 'flowColumn', size: 18 }),
        title: 'Column',
      },
      {
        value: 'wrap' as FlowValue,
        icon: React.createElement(AppIcon, { name: 'flowWrap', size: 18 }),
        title: 'Wrap',
      },
      {
        value: 'grid' as FlowValue,
        icon: React.createElement(AppIcon, { name: 'flowGrid', size: 18 }),
        title: 'Grid',
      },
    ],
  } as FeatureUISegmented<FlowValue>,
};
