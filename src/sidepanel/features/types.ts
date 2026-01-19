/**
 * Feature Module Types
 * 
 * Defines the interface that all feature modules must implement.
 * Features encapsulate:
 * - Applicability detection (when controls should be enabled)
 * - State extraction from computed styles
 * - Patch generation for applying changes
 * - UI configuration (control type, icons, labels)
 */

import type { ComputedStylesSnapshot } from '../../shared/types';
import type React from 'react';

// =============================================================================
// Control Types
// =============================================================================

export type ControlType = 
  | 'number'        // NumberField
  | 'slider'        // Slider with numeric value
  | 'segmented'     // Segmented icon buttons
  | 'toggle'        // Checkbox toggle
  | 'color'         // Color picker
  | 'select';       // Dropdown select

// =============================================================================
// UI Configuration
// =============================================================================

export interface FeatureUINumber {
  type: 'number';
  icon?: React.ReactNode;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  width?: number | string;
  showDropdown?: boolean;
}

export interface FeatureUISlider {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
}

export interface FeatureUISegmented<T extends string> {
  type: 'segmented';
  options: Array<{
    value: T;
    icon: React.ReactNode;
    title?: string;
  }>;
}

export interface FeatureUIToggle {
  type: 'toggle';
  label: string;
}

export interface FeatureUIColor {
  type: 'color';
  /** Property being controlled (for token extraction context) */
  property: 'color' | 'backgroundColor' | 'borderColor';
  /** Show hex input in popover (default: true) */
  showHexInput?: boolean;
  /** Show recent colors in popover (default: true) */
  showRecent?: boolean;
  /** Show CSS variable tokens (default: true) */
  showTokens?: boolean;
}

export type FeatureUI<T = unknown> = 
  | FeatureUINumber
  | FeatureUISlider
  | FeatureUISegmented<T extends string ? T : never>
  | FeatureUIToggle
  | FeatureUIColor;

// =============================================================================
// Feature Interface
// =============================================================================

export interface Feature<T> {
  /** Unique identifier for this feature */
  id: string;
  
  /** Display label */
  label: string;
  
  /**
   * Check if this feature's controls should be enabled.
   * E.g., alignment controls only apply to flex/grid containers.
   */
  isApplicable: (styles: ComputedStylesSnapshot) => boolean;
  
  /**
   * Extract the current state/value from computed styles.
   */
  getState: (styles: ComputedStylesSnapshot) => T;
  
  /**
   * Generate a CSS patch to apply a new value.
   * Returns the CSS property name and value to set.
   */
  createPatch: (value: T) => { property: string; value: string };
  
  /**
   * UI configuration for rendering the control.
   */
  ui: FeatureUI<T>;
}

// =============================================================================
// Feature Group
// =============================================================================

/**
 * A group of related features displayed together.
 * E.g., "Alignment" containing justify and align features.
 */
export interface FeatureGroup {
  id: string;
  label: string;
  features: Feature<unknown>[];
}
