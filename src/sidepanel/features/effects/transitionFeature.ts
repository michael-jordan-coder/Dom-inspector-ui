/**
 * Transition Feature
 * 
 * Controls CSS transition properties.
 */

import type { Feature, FeatureUINumber } from '../types';
import type { ComputedStylesSnapshot } from '../../../shared/types';

// Common easing functions
export const EASING_PRESETS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'Smooth' },
  { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Bounce' },
  { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: 'Back' },
];

// Common transition properties
export const TRANSITION_PROPERTIES = [
  { value: 'all', label: 'All' },
  { value: 'opacity', label: 'Opacity' },
  { value: 'transform', label: 'Transform' },
  { value: 'background-color', label: 'Background' },
  { value: 'color', label: 'Color' },
  { value: 'border-color', label: 'Border' },
  { value: 'box-shadow', label: 'Shadow' },
  { value: 'width', label: 'Width' },
  { value: 'height', label: 'Height' },
  { value: 'padding', label: 'Padding' },
  { value: 'margin', label: 'Margin' },
];

/**
 * Parse transition duration from computed style (e.g., "0.3s" -> 300)
 * Reserved for future use when parsing computed transition values.
 */
export function parseTransitionDuration(value: string): number {
  if (!value || value === 'none' || value === '0s') return 0;
  const match = value.match(/^([\d.]+)(s|ms)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return match[2] === 's' ? num * 1000 : num;
}

/**
 * Parse transition delay
 * Reserved for future use when parsing computed transition values.
 */
export function parseTransitionDelay(value: string): number {
  return parseTransitionDuration(value);
}

// =============================================================================
// Transition Duration Feature
// =============================================================================

export const transitionDurationFeature: Feature<number> = {
  id: 'transitionDuration',
  label: 'Duration',

  isApplicable: () => true,

  getState: (_styles: ComputedStylesSnapshot): number => {
    // Computed styles don't include transition, so we default to 0
    // In a real implementation, we'd track this separately
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'transitionDuration',
    value: `${value}ms`,
  }),

  ui: {
    type: 'number',
    min: 0,
    max: 2000,
    step: 50,
    unit: 'ms',
  } as FeatureUINumber,
};

// =============================================================================
// Transition Delay Feature
// =============================================================================

export const transitionDelayFeature: Feature<number> = {
  id: 'transitionDelay',
  label: 'Delay',

  isApplicable: () => true,

  getState: (): number => {
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'transitionDelay',
    value: `${value}ms`,
  }),

  ui: {
    type: 'number',
    min: 0,
    max: 2000,
    step: 50,
    unit: 'ms',
  } as FeatureUINumber,
};

// =============================================================================
// Transform Features
// =============================================================================

export const transformRotateFeature: Feature<number> = {
  id: 'transformRotate',
  label: 'Rotate',

  isApplicable: () => true,

  getState: (): number => {
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'transform',
    value: `rotate(${value}deg)`,
  }),

  ui: {
    type: 'number',
    min: -360,
    max: 360,
    step: 1,
    unit: '°',
  } as FeatureUINumber,
};

export const transformScaleFeature: Feature<number> = {
  id: 'transformScale',
  label: 'Scale',

  isApplicable: () => true,

  getState: (): number => {
    return 1;
  },

  createPatch: (value: number) => ({
    property: 'transform',
    value: `scale(${value})`,
  }),

  ui: {
    type: 'number',
    min: 0,
    max: 3,
    step: 0.1,
  } as FeatureUINumber,
};

export const transformTranslateXFeature: Feature<number> = {
  id: 'transformTranslateX',
  label: 'Translate X',

  isApplicable: () => true,

  getState: (): number => {
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'transform',
    value: `translateX(${value}px)`,
  }),

  ui: {
    type: 'number',
    min: -500,
    max: 500,
    step: 1,
    unit: 'px',
  } as FeatureUINumber,
};

export const transformTranslateYFeature: Feature<number> = {
  id: 'transformTranslateY',
  label: 'Translate Y',

  isApplicable: () => true,

  getState: (): number => {
    return 0;
  },

  createPatch: (value: number) => ({
    property: 'transform',
    value: `translateY(${value}px)`,
  }),

  ui: {
    type: 'number',
    min: -500,
    max: 500,
    step: 1,
    unit: 'px',
  } as FeatureUINumber,
};
