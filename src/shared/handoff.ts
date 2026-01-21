/**
 * Prompt Handoff Export Utilities
 *
 * Functions for generating the structured JSON payload that transfers
 * visual changes from the Chrome Extension to an AI coding agent.
 */

import type {
  ElementMetadata,
  StylePatch,
  SelectorResolutionStatus,
  StabilitySignals,
  HandoffStylePatch,
  PromptHandoffExport,
} from './types';

// ============================================================================
// Selector Analysis
// ============================================================================

/**
 * Check if a CSS selector uses :nth-of-type pseudo-class.
 * These selectors are position-dependent and fragile to DOM changes.
 */
export function usesNthOfType(selector: string): boolean {
  return /:nth-of-type\(/i.test(selector);
}

/**
 * Check if a CSS selector uses any positional pseudo-class.
 * Extended check for other fragile selectors.
 */
export function usesPositionalSelector(selector: string): boolean {
  return /:nth-(of-type|child|last-of-type|last-child)\(/i.test(selector);
}

// ============================================================================
// Patch Validation
// ============================================================================

/**
 * Validate that a StylePatch has all required fields for handoff export.
 * Returns true if the patch has an identity token.
 */
export function isValidHandoffPatch(patch: StylePatch): patch is HandoffStylePatch {
  return patch.identityToken !== undefined;
}

/**
 * Filter patches to only those valid for handoff (with identity tokens).
 * Logs a warning for any patches missing identity tokens.
 */
export function filterValidPatches(patches: StylePatch[]): HandoffStylePatch[] {
  const valid: HandoffStylePatch[] = [];
  const invalid: StylePatch[] = [];

  for (const patch of patches) {
    if (isValidHandoffPatch(patch)) {
      valid.push(patch);
    } else {
      invalid.push(patch);
    }
  }

  if (invalid.length > 0) {
    console.warn(
      `[Handoff] ${invalid.length} patch(es) missing identity tokens and will be excluded:`,
      invalid.map((p) => `${String(p.property)}: ${p.previousValue} → ${p.value}`)
    );
  }

  return valid;
}

// ============================================================================
// Export Generation
// ============================================================================

/**
 * Create a complete Prompt Handoff export payload.
 *
 * @param element - The selected element metadata
 * @param patches - Array of style patches (will filter to valid ones)
 * @param selectorStatus - Result of resolving the element's selector
 * @param matchCount - Number of elements matching the selector
 * @param identityMatch - Whether current element matches patch identity tokens
 * @returns Complete PromptHandoffExport ready for JSON serialization
 */
export function createHandoffExport(
  element: ElementMetadata,
  patches: StylePatch[],
  selectorStatus: SelectorResolutionStatus,
  matchCount: number,
  identityMatch: boolean
): PromptHandoffExport {
  const validPatches = filterValidPatches(patches);

  const stability: StabilitySignals = {
    selectorResolution: {
      status: selectorStatus,
      matchCount,
    },
    identityMatch,
    usesNthOfType: usesNthOfType(element.selector),
  };

  return {
    selectedElement: element,
    patches: validPatches,
    stability,
  };
}

// ============================================================================
// JSON Formatting
// ============================================================================

/**
 * Format a PromptHandoffExport as a pretty-printed JSON string.
 * Suitable for clipboard copy or file export.
 */
export function formatHandoffJSON(handoff: PromptHandoffExport): string {
  return JSON.stringify(handoff, null, 2);
}

/**
 * Format a PromptHandoffExport as a compact JSON string.
 * Suitable for programmatic transmission.
 */
export function formatHandoffJSONCompact(handoff: PromptHandoffExport): string {
  return JSON.stringify(handoff);
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Create and format a handoff export in a single call.
 * Returns pretty-printed JSON string ready for clipboard.
 */
export function generateHandoffJSON(
  element: ElementMetadata,
  patches: StylePatch[],
  selectorStatus: SelectorResolutionStatus,
  matchCount: number,
  identityMatch: boolean
): string {
  const handoff = createHandoffExport(
    element,
    patches,
    selectorStatus,
    matchCount,
    identityMatch
  );
  return formatHandoffJSON(handoff);
}
