/**
 * Element Identity Utilities
 * 
 * Lightweight identity tokens for validating that a selector still points
 * to the same logical element after DOM mutations.
 */

import type { ElementIdentity } from './types';

/**
 * Compute a lightweight identity token for an element.
 * Used to detect if element has fundamentally changed (not just moved).
 */
export function computeIdentity(element: Element): ElementIdentity {
    const textContent = element.textContent || '';
    const textPreview = textContent.trim().slice(0, 50);
    const classList = Array.from(element.classList).sort().join(' ');
    const parentTag = element.parentElement?.tagName.toLowerCase() || 'none';

    return {
        tagName: element.tagName.toLowerCase(),
        textPreview,
        classList,
        parentTag
    };
}

/**
 * Check if two identity tokens match.
 * Returns true if they represent the same logical element.
 */
export function identitiesMatch(a: ElementIdentity, b: ElementIdentity): boolean {
    return (
        a.tagName === b.tagName &&
        a.textPreview === b.textPreview &&
        a.classList === b.classList &&
        a.parentTag === b.parentTag
    );
}
