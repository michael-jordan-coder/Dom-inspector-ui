/**
 * Hierarchy Utilities
 * 
 * Extract parent/children/breadcrumb information from a DOM element.
 * Performance target: <10ms for typical pages.
 */

import { getStableSelector, getElementDescription } from '../shared/selector';
import type { ElementHierarchy, ElementSummary, BreadcrumbItem } from '../shared/types';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of children to include in hierarchy */
const MAX_CHILDREN = 20;

/** Maximum length for text preview */
const TEXT_PREVIEW_LENGTH = 40;

// ============================================================================
// Main Export
// ============================================================================

/**
 * Extract complete hierarchy information for an element.
 * 
 * @param element - The DOM element to extract hierarchy from
 * @returns ElementHierarchy with parent, children, breadcrumb, and sibling info
 */
export function extractHierarchy(element: Element): ElementHierarchy {
  return {
    parent: extractParentSummary(element.parentElement),
    children: extractChildrenSummaries(element),
    breadcrumb: extractBreadcrumb(element),
    siblingIndex: getSiblingIndex(element),
    siblingCount: getSiblingCount(element),
  };
}

// ============================================================================
// Parent Extraction
// ============================================================================

/**
 * Extract summary info for parent element.
 */
function extractParentSummary(parent: Element | null): ElementSummary | null {
  // Don't include body or html as navigable parents
  if (!parent || parent === document.documentElement || parent === document.body) {
    return null;
  }
  return createElementSummary(parent);
}

// ============================================================================
// Children Extraction
// ============================================================================

/**
 * Extract summaries for direct child elements.
 * Limited to MAX_CHILDREN for performance.
 */
function extractChildrenSummaries(element: Element): ElementSummary[] {
  const summaries: ElementSummary[] = [];
  const children = element.children;
  const count = Math.min(children.length, MAX_CHILDREN);

  for (let i = 0; i < count; i++) {
    summaries.push(createElementSummary(children[i]));
  }
  return summaries;
}

// ============================================================================
// Breadcrumb Extraction
// ============================================================================

/**
 * Extract breadcrumb path from body to current element.
 */
function extractBreadcrumb(element: Element): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.documentElement) {
    if (current === document.body) {
      path.unshift({ selector: 'body', label: 'body' });
      break;
    }
    
    path.unshift({
      selector: getStableSelector(current),
      label: getElementDescription(current),
    });
    
    current = current.parentElement;
  }
  
  return path;
}

// ============================================================================
// Sibling Utilities
// ============================================================================

/**
 * Get 0-based index of element among its siblings.
 */
function getSiblingIndex(element: Element): number {
  const parent = element.parentElement;
  if (!parent) return 0;

  const children = parent.children;
  const len = children.length;

  for (let i = 0; i < len; i++) {
    if (children[i] === element) return i;
  }
  return -1;
}

/**
 * Get total number of siblings (including self).
 */
function getSiblingCount(element: Element): number {
  return element.parentElement?.children.length ?? 1;
}

// ============================================================================
// Element Summary Creation
// ============================================================================

/**
 * Create a summary object for an element.
 */
function createElementSummary(element: Element): ElementSummary {
  return {
    selector: getStableSelector(element),
    tagName: element.tagName.toLowerCase(),
    label: getElementDescription(element),
    textPreview: getDirectTextPreview(element),
    childCount: element.children.length,
  };
}

/**
 * Get a preview of direct text content (not from nested elements).
 */
function getDirectTextPreview(element: Element): string | undefined {
  const textNodes = Array.from(element.childNodes)
    .filter((node): node is Text => 
      node.nodeType === Node.TEXT_NODE && 
      Boolean(node.textContent?.trim())
    )
    .map(node => node.textContent?.trim())
    .filter((text): text is string => Boolean(text));
  
  if (textNodes.length === 0) return undefined;
  
  const combined = textNodes.join(' ');
  if (combined.length <= TEXT_PREVIEW_LENGTH) {
    return combined;
  }
  
  return combined.slice(0, TEXT_PREVIEW_LENGTH) + '…';
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Get the parent element if navigable (not body/html).
 */
export function getNavigableParent(element: Element): Element | null {
  const parent = element.parentElement;
  if (!parent || parent === document.body || parent === document.documentElement) {
    return null;
  }
  return parent;
}

/**
 * Get child element at index.
 */
export function getChildAtIndex(element: Element, index: number): Element | null {
  const children = element.children;
  if (index < 0 || index >= children.length) {
    return null;
  }
  return children[index];
}

/**
 * Get sibling element in direction.
 */
export function getSibling(element: Element, direction: 'prev' | 'next'): Element | null {
  return direction === 'prev'
    ? element.previousElementSibling
    : element.nextElementSibling;
}

/**
 * Check if element can navigate to parent.
 */
export function canNavigateToParent(element: Element): boolean {
  return getNavigableParent(element) !== null;
}

/**
 * Check if element has children to navigate to.
 */
export function canNavigateToChild(element: Element): boolean {
  return element.children.length > 0;
}

/**
 * Check if element can navigate to sibling in direction.
 */
export function canNavigateToSibling(element: Element, direction: 'prev' | 'next'): boolean {
  return getSibling(element, direction) !== null;
}
