/**
 * Font Weight Feature
 * 
 * Controls the font-weight of the selected element.
 */

import React from 'react';
import type { Feature, FeatureUISegmented } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

// Map common weight values to segments
type FontWeightValue = 'normal' | 'medium' | 'semibold' | 'bold';

function normalizeWeight(value: string): FontWeightValue {
    const num = parseInt(value);
    if (num <= 400) return 'normal';
    if (num <= 500) return 'medium';
    if (num <= 600) return 'semibold';
    return 'bold';
}

export const fontWeightFeature: Feature<FontWeightValue> = {
    id: 'fontWeight',
    label: 'Weight',

    isApplicable: () => true,

    getState: (styles: ComputedStylesSnapshot): FontWeightValue => {
        return normalizeWeight(styles.fontWeight);
    },

    createPatch: (value: FontWeightValue) => {
        const weights: Record<FontWeightValue, string> = {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        };
        return {
            property: 'fontWeight',
            value: weights[value],
        };
    },

    ui: {
        type: 'segmented',
        options: [
            {
                value: 'normal',
                icon: React.createElement('span', { style: { fontSize: 11, fontWeight: 400 } }, 'Aa'),
                title: 'Normal (400)'
            },
            {
                value: 'medium',
                icon: React.createElement('span', { style: { fontSize: 11, fontWeight: 500 } }, 'Aa'),
                title: 'Medium (500)'
            },
            {
                value: 'semibold',
                icon: React.createElement('span', { style: { fontSize: 11, fontWeight: 600 } }, 'Aa'),
                title: 'Semibold (600)'
            },
            {
                value: 'bold',
                icon: React.createElement('span', { style: { fontSize: 11, fontWeight: 700 } }, 'Aa'),
                title: 'Bold (700)'
            },
        ],
    } as FeatureUISegmented<FontWeightValue>,
};
