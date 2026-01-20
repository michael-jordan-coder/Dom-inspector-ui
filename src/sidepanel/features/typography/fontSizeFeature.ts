/**
 * Font Size Feature
 * 
 * Controls the font-size of the selected element.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

function parseFontSize(value: string): number {
    return parseFloat(value) || 16;
}

export const fontSizeFeature: Feature<number> = {
    id: 'fontSize',
    label: 'Size',

    isApplicable: () => true,

    getState: (styles: ComputedStylesSnapshot): number => {
        return parseFontSize(styles.fontSize);
    },

    createPatch: (value: number) => ({
        property: 'fontSize',
        value: `${value}px`,
    }),

    ui: {
        type: 'number',
        icon: React.createElement('span', {
            style: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }
        }, 'Aa'),
        min: 8,
        max: 200,
        step: 1,
        unit: 'px',
    } as FeatureUINumber,
};
