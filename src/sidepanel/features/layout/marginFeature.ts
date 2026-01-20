/**
 * Margin Feature
 * 
 * Controls horizontal and vertical margin.
 * Always applicable to any element.
 */

import React from 'react';
import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

function parseMargin(value: string): number {
    return parseInt(value) || 0;
}

// =============================================================================
// Horizontal Margin (left + right)
// =============================================================================

export const marginHFeature: Feature<number> = {
    id: 'marginH',
    label: 'Margin X',

    isApplicable: () => true,

    getState: (styles: ComputedStylesSnapshot): number => {
        const left = parseMargin(styles.marginLeft);
        const right = parseMargin(styles.marginRight);
        return left === right ? left : left;
    },

    createPatch: (value: number) => ({
        property: 'marginLeft',
        value: `${value}px`,
    }),

    ui: {
        type: 'number',
        icon: React.createElement('span', {
            style: { fontSize: 9, fontWeight: 600, color: 'var(--text-muted)' }
        }, 'M↔'),
        min: -200,
        max: 200,
        step: 1,
        width: 80,
    } as FeatureUINumber,
};

// =============================================================================
// Vertical Margin (top + bottom)
// =============================================================================

export const marginVFeature: Feature<number> = {
    id: 'marginV',
    label: 'Margin Y',

    isApplicable: () => true,

    getState: (styles: ComputedStylesSnapshot): number => {
        const top = parseMargin(styles.marginTop);
        const bottom = parseMargin(styles.marginBottom);
        return top === bottom ? top : top;
    },

    createPatch: (value: number) => ({
        property: 'marginTop',
        value: `${value}px`,
    }),

    ui: {
        type: 'number',
        icon: React.createElement('span', {
            style: { fontSize: 9, fontWeight: 600, color: 'var(--text-muted)' }
        }, 'M↕'),
        min: -200,
        max: 200,
        step: 1,
        width: 80,
    } as FeatureUINumber,
};
