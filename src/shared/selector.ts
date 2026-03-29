/**
 * Stable Selector Generator
 * 
 * Generates a deterministic, reasonably stable CSS selector for any DOM element.
 * Priority:
 * 1. data-testid, data-test, or similar test attributes
 * 2. Unique ID
 * 3. DOM path using tagName:nth-of-type chain
 */

import type { SelectorResolutionResult, SelectorConfidence } from './types';

const TEST_ATTRIBUTES = [
  'data-testid',
  'data-test',
  'data-test-id',
  'data-cy',
  'data-e2e',
];

/**
 * Check if a selector uniquely identifies an element in the document.
 */
function isUnique(selector: string, element: Element): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch {
    return false;
  }
}

/**
 * Escape special characters in CSS selectors.
 */
function escapeCSS(str: string): string {
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Get the nth-of-type index for an element among its siblings.
 */
function getNthOfTypeIndex(element: Element): number {
  // Optimization: Traverse previous siblings to avoid array allocation
  let index = 1;
  const tagName = element.tagName;
  let el = element.previousElementSibling;

  while (el) {
    if (el.tagName === tagName) {
      index++;
    }
    el = el.previousElementSibling;
  }

  return index;
}

/**
 * Generate a stable CSS selector for the given element.
 * 
 * @param element - The DOM element to generate a selector for
 * @returns A CSS selector string that uniquely identifies the element
 */
export function getStableSelector(element: Element): string {
  // Skip document or non-element nodes
  if (!element || element === document.documentElement) {
    return 'html';
  }

  if (element === document.body) {
    return 'body';
  }

  // Priority 1: Test attributes
  for (const attr of TEST_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (value) {
      const selector = `[${attr}="${escapeCSS(value)}"]`;
      if (isUnique(selector, element)) {
        return selector;
      }
    }
  }

  // Priority 2: Unique ID
  if (element.id) {
    const selector = `#${escapeCSS(element.id)}`;
    if (isUnique(selector, element)) {
      return selector;
    }
  }

  // Priority 3: Build DOM path
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    const tagName = current.tagName.toLowerCase();
    const nthOfType = getNthOfTypeIndex(current);

    // Try to find a unique identifier at this level
    let segment = `${tagName}:nth-of-type(${nthOfType})`;

    // Check if ID can help make it unique from here
    if (current.id) {
      const idSelector = `#${escapeCSS(current.id)}`;
      const pathWithId = [idSelector, ...path].join(' > ');
      if (isUnique(pathWithId, element)) {
        return pathWithId;
      }
    }

    path.unshift(segment);
    current = current.parentElement;
  }

  // Prepend body for full path
  const fullPath = ['body', ...path].join(' > ');
  return fullPath;
}

/**
 * Find an element by its selector.
 * Returns a structured result with status instead of silently picking first match.
 */
export function findElementBySelector(selector: string): SelectorResolutionResult {
  try {
    const elements = document.querySelectorAll(selector);

    if (elements.length === 0) {
      return {
        status: 'NOT_FOUND',
        element: null,
        error: `No elements match selector: ${selector}`
      };
    }

    if (elements.length > 1) {
      return {
        status: 'AMBIGUOUS',
        element: null,
        matchCount: elements.length,
        error: `Selector matches ${elements.length} elements (expected 1)`
      };
    }

    return {
      status: 'OK',
      element: elements[0],
      matchCount: 1
    };
  } catch (e) {
    return {
      status: 'INVALID_SELECTOR',
      element: null,
      error: `Invalid selector syntax: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}


/**
 * Get a human-readable short description of the element.
 */
export function getElementDescription(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.classList.length > 0
    ? `.${Array.from(element.classList).slice(0, 2).join('.')}`
    : '';

  return `${tag}${id}${classes}`;
}

// ============================================================================
// Selector Confidence (F-002)
// ============================================================================

/**
 * Check if a selector uses positional pseudo-classes.
 * These are fragile and likely to break on DOM changes.
 */
export function usesPositionalSelector(selector: string): boolean {
  return /:nth-(of-type|child|last-of-type|last-child|first-child|first-of-type)\(/i.test(selector);
}

/**
 * Check if a selector contains a unique ID.
 */
export function hasUniqueId(selector: string): boolean {
  // Match #id followed by space, end, combinator, or pseudo
  return /#[a-zA-Z][a-zA-Z0-9_-]*(?:\s|$|>|\+|~|\[|:|\.|,)/.test(selector + ' ') || 
         /^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(selector);
}

/**
 * Check if a selector uses stable data attributes like data-testid.
 */
export function hasStableDataAttribute(selector: string): boolean {
  return /\[data-(testid|test-id|cy|id|test|e2e)/.test(selector);
}

/**
 * Compute the selector confidence level.
 * 
 * Confidence levels (per Phase 2 contract):
 * - high: Unique ID or highly specific, stable attributes. Unlikely to break.
 * - medium: Class names or tag combinations. May break if CSS/HTML is refactored.
 * - low: Positional or structural matching. Likely to break.
 * 
 * @param selector - The CSS selector to analyze
 * @param matchCount - Number of elements the selector matches (1 = unique)
 * @returns SelectorConfidence level
 */
export function computeSelectorConfidence(
  selector: string,
  matchCount: number = 1
): SelectorConfidence {
  // Multiple matches = always low confidence
  if (matchCount > 1) {
    return 'low';
  }

  // Positional selectors = always low confidence
  if (usesPositionalSelector(selector)) {
    return 'low';
  }

  // Unique ID or stable data attribute = high confidence
  if (hasUniqueId(selector) || hasStableDataAttribute(selector)) {
    return 'high';
  }

  // Class-based or attribute selectors = medium confidence
  if (selector.includes('.') || selector.includes('[')) {
    return 'medium';
  }

  // Tag-only or generic selectors = low confidence
  return 'low';
}

/**
 * Compute selector confidence with match count from DOM query.
 * Convenience function that queries the DOM to get match count.
 */
export function computeSelectorConfidenceWithDOM(selector: string): SelectorConfidence {
  try {
    const matchCount = document.querySelectorAll(selector).length;
    return computeSelectorConfidence(selector, matchCount);
  } catch {
    // Invalid selector = low confidence
    return 'low';
  }
}
