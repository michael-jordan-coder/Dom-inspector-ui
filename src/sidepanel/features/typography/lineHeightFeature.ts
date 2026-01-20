/**
 * Line Height Feature
 * 
 * Controls the line-height of the selected element.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

function parseLineHeight(value: string, fontSize: string): number {
    // line-height can be unitless (multiplier), px, or "normal"
    if (value === 'normal') {
        return 1.5; // Default browser line-height
    }
    const num = parseFloat(value);
    if (value.endsWith('px')) {
        // Convert px to multiplier relative to font-size
        const fontSizePx = parseFloat(fontSize) || 16;
        return Math.round((num / fontSizePx) * 100) / 100;
    }
    return num || 1.5;
}

export const lineHeightFeature: Feature<number> = {
    id: 'lineHeight',
    label: 'Line Height',

    isApplicable: () => true,

    getState: (styles: ComputedStylesSnapshot): number => {
        return parseLineHeight(styles.lineHeight, styles.fontSize);
    },

    createPatch: (value: number) => ({
        property: 'lineHeight',
        value: String(value), // Unitless multiplier
    }),

    ui: {
        type: 'number',
        icon: React.createElement('span', {
            style: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }
        }, 'LH'),
        min: 0.5,
        max: 4,
        step: 0.1,
    } as FeatureUINumber,
};
