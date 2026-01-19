/**
 * DOM Patch Module
 * 
 * Handles applying and reverting style changes to DOM elements.
 * Uses inline styles for MVP (most reliable for overriding existing styles).
 */

import type { ComputedStylesSnapshot, StylePatch } from '../shared/types';
import { findElementBySelector } from '../shared/selector';

/**
 * Map of CSS property names (camelCase to kebab-case).
 */
const CSS_PROPERTY_MAP: Record<string, string> = {
  justifyContent: 'justify-content',
  alignItems: 'align-items',
  paddingTop: 'padding-top',
  paddingRight: 'padding-right',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  marginTop: 'margin-top',
  marginRight: 'margin-right',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  borderRadius: 'border-radius',
  backgroundColor: 'background-color',
  borderColor: 'border-color',
};

/**
 * Convert camelCase property to kebab-case.
 */
function toKebabCase(property: string): string {
  return CSS_PROPERTY_MAP[property] || property.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Apply a style patch to the DOM.
 * Returns the actual previous value (from computed styles).
 */
export function applyStylePatch(
  selector: string,
  property: string,
  value: string
): { success: boolean; previousValue: string } {
  const element = findElementBySelector(selector);
  
  if (!element || !(element instanceof HTMLElement)) {
    console.warn(`[UI Inspector] Element not found for selector: ${selector}`);
    return { success: false, previousValue: '' };
  }

  // Get the current computed value before applying
  const computedStyle = window.getComputedStyle(element);
  const previousValue = computedStyle.getPropertyValue(toKebabCase(property));

  // Apply the new value using inline style (highest specificity)
  element.style.setProperty(toKebabCase(property), value, 'important');

  return { success: true, previousValue };
}

/**
 * Revert a style patch by applying the previous value.
 */
export function revertStylePatch(patch: StylePatch): boolean {
  const element = findElementBySelector(patch.selector);
  
  if (!element || !(element instanceof HTMLElement)) {
    console.warn(`[UI Inspector] Element not found for selector: ${patch.selector}`);
    return false;
  }

  const kebabProperty = toKebabCase(String(patch.property));

  if (patch.previousValue === '') {
    // If there was no previous value, remove the property
    element.style.removeProperty(kebabProperty);
  } else {
    // Restore the previous value
    element.style.setProperty(kebabProperty, patch.previousValue, 'important');
  }

  return true;
}

/**
 * Re-apply a style patch (for redo).
 */
export function reapplyStylePatch(patch: StylePatch): boolean {
  const result = applyStylePatch(patch.selector, String(patch.property), patch.value);
  return result.success;
}

/**
 * Extract raw style value from element's style attribute or matched rules.
 * This preserves var() references that computed styles resolve.
 */
function getRawStyleValue(element: Element, property: string): string | undefined {
  // First check inline style (highest priority)
  if (element instanceof HTMLElement && element.style) {
    const inlineValue = element.style.getPropertyValue(toKebabCase(property));
    if (inlineValue) return inlineValue;
  }
  
  // For a more complete solution, we'd need to walk matched CSS rules
  // but that's complex and may have performance implications.
  // For MVP, we only check inline styles for var() preservation.
  return undefined;
}

/**
 * Get the computed styles snapshot for an element.
 */
export function getComputedStylesSnapshot(element: Element): ComputedStylesSnapshot {
  const computedStyle = window.getComputedStyle(element);
  
  return {
    display: computedStyle.display,
    justifyContent: computedStyle.justifyContent,
    alignItems: computedStyle.alignItems,
    gap: computedStyle.gap,
    paddingTop: computedStyle.paddingTop,
    paddingRight: computedStyle.paddingRight,
    paddingBottom: computedStyle.paddingBottom,
    paddingLeft: computedStyle.paddingLeft,
    marginTop: computedStyle.marginTop,
    marginRight: computedStyle.marginRight,
    marginBottom: computedStyle.marginBottom,
    marginLeft: computedStyle.marginLeft,
    opacity: computedStyle.opacity,
    borderRadius: computedStyle.borderRadius,
    backgroundColor: computedStyle.backgroundColor,
    color: computedStyle.color,
    borderColor: computedStyle.borderColor,
    // Preserve raw values for color properties (to detect var() usage)
    rawStyles: {
      backgroundColor: getRawStyleValue(element, 'backgroundColor'),
      color: getRawStyleValue(element, 'color'),
      borderColor: getRawStyleValue(element, 'borderColor'),
    },
  };
}

/**
 * Get computed styles for a selector (convenience function).
 */
export function getComputedStylesForSelector(selector: string): ComputedStylesSnapshot | null {
  const element = findElementBySelector(selector);
  if (!element) {
    return null;
  }
  return getComputedStylesSnapshot(element);
}
