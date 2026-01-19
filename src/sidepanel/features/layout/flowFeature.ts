/**
 * Flow Feature
 * 
 * Controls flex-direction and display mode.
 * TODO: Full implementation pending - currently a stub.
 */

import type { Feature, FeatureUISegmented } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';
import {
  FlowRowIcon,
  FlowColumnIcon,
  FlowWrapIcon,
  FlowGridIcon,
} from '../../icons';
import React from 'react';

type FlowValue = 'row' | 'column' | 'wrap' | 'grid';

function parseFlow(styles: ComputedStylesSnapshot): FlowValue {
  if (styles.display === 'grid' || styles.display === 'inline-grid') {
    return 'grid';
  }
  // TODO: Check flex-wrap for 'wrap' value
  // For now, use flex-direction
  if (styles.display === 'flex' || styles.display === 'inline-flex') {
    // Default to row, would need flexDirection in ComputedStylesSnapshot
    return 'row';
  }
  return 'row';
}

export const flowFeature: Feature<FlowValue> = {
  id: 'flow',
  label: 'Flow',

  // Only applicable to flex/grid containers
  isApplicable: (styles: ComputedStylesSnapshot): boolean => {
    return (
      styles.display === 'flex' ||
      styles.display === 'inline-flex' ||
      styles.display === 'grid' ||
      styles.display === 'inline-grid'
    );
  },

  getState: parseFlow,

  // TODO: This needs to set multiple properties depending on value
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
        icon: React.createElement(FlowRowIcon, { size: 16 }),
        title: 'Row',
      },
      {
        value: 'column' as FlowValue,
        icon: React.createElement(FlowColumnIcon, { size: 16 }),
        title: 'Column',
      },
      {
        value: 'wrap' as FlowValue,
        icon: React.createElement(FlowWrapIcon, { size: 16 }),
        title: 'Wrap',
      },
      {
        value: 'grid' as FlowValue,
        icon: React.createElement(FlowGridIcon, { size: 16 }),
        title: 'Grid',
      },
    ],
  } as FeatureUISegmented<FlowValue>,
};
