/**
 * Prompt Handoff Export Utilities
 *
 * Functions for generating the structured JSON payload that transfers
 * visual changes from the Chrome Extension to an AI coding agent.
 * 
 * Conforms to Export Schema v1 (Phase 2 Contract).
 */

import type {
  ElementMetadata,
  StylePatch,
  SelectorResolutionStatus,
  StabilitySignals,
  HandoffStylePatch,
  PromptHandoffExport,
  VisualUIInspectorExport,
  FinalPatch,
  SelectorConfidence,
  ExportWarning,
  Viewport,
} from './types';
import { EXPORT_SCHEMA_VERSION } from './types';

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
  return /:nth-(of-type|child|last-of-type|last-child|first-child|first-of-type)\(/i.test(selector);
}

/**
 * Check if a selector has a unique ID.
 */
export function hasUniqueId(selector: string): boolean {
  return /#[a-zA-Z][a-zA-Z0-9_-]*(?:\s|$|>|\+|~|\[|:|\.|,)/.test(selector + ' ') ||
    /^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(selector);
}

/**
 * Check if a selector uses data-testid or similar stable attributes.
 */
export function hasStableDataAttribute(selector: string): boolean {
  return /\[data-(testid|test-id|cy|id)/.test(selector);
}

// ============================================================================
// Selector Confidence Computation (F-002)
// ============================================================================

/**
 * Compute the selector confidence level based on selector characteristics.
 * 
 * - high: Unique ID or stable data attributes (data-testid, etc.)
 * - medium: Class-based or tag combinations without positional selectors
 * - low: Positional or structural selectors (:nth-child, :first-child, etc.)
 * 
 * @param selector - The CSS selector to analyze
 * @param matchCount - Number of elements matching the selector (1 = unique)
 * @returns SelectorConfidence level
 */
export function computeSelectorConfidence(
  selector: string,
  matchCount: number = 1
): SelectorConfidence {
  // Multiple matches = low confidence regardless of selector type
  if (matchCount > 1) {
    return 'low';
  }

  // Positional selectors are always low confidence
  if (usesPositionalSelector(selector)) {
    return 'low';
  }

  // Unique ID or stable data attribute = high confidence
  if (hasUniqueId(selector) || hasStableDataAttribute(selector)) {
    return 'high';
  }

  // Class-based selectors without positional = medium confidence
  if (selector.includes('.') || selector.includes('[')) {
    return 'medium';
  }

  // Tag-only selectors = low confidence (too generic)
  return 'low';
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
// Patch Collapsing (Noise Reduction)
// ============================================================================

/**
 * Collapse patch history into FinalPatches (one per selector+property).
 * removes intermediate steps (e.g. slider drag values) and no-op changes.
 */
function collapsePatches(patches: StylePatch[]): StylePatch[] {
  const grouped = new Map<string, StylePatch[]>();

  // Group by "selector|property"
  for (const p of patches) {
    const key = `${p.selector}|${String(p.property)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const finalPatches: StylePatch[] = [];

  for (const group of grouped.values()) {
    // 1. Sort by timestamp (asc) to find chronological order
    group.sort((a, b) => a.timestamp - b.timestamp);

    // 2. Identify baseline and final
    const first = group[0];
    const last = group[group.length - 1];

    // 3. Normalize values for no-op check
    const fromVal = (first.previousValue || '').trim().replace(/\s+/g, ' ');
    const toVal = (last.value || '').trim().replace(/\s+/g, ' ');

    if (fromVal === toVal) {
      continue; // Drop no-op
    }

    // 4. Construct collapsed patch
    // We use 'last' as base to keep latest metadata (timestamp, identity)
    // But we overwrite previousValue with the earliest baseline.
    const collapsed: StylePatch & { stepsCollapsed: number } = {
      ...last,
      previousValue: first.previousValue,
      value: last.value,
      // @ts-ignore: Adding ad-hoc property for export payload
      stepsCollapsed: Math.max(0, group.length - 1)
    };

    finalPatches.push(collapsed);
  }

  // Sort by timestamp for consistent output
  finalPatches.sort((a, b) => a.timestamp - b.timestamp);

  return finalPatches;
}

// ============================================================================
// CSS Property Formatting
// ============================================================================

/**
 * Convert camelCase property name to kebab-case CSS property.
 */
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// ============================================================================
// Export Schema v1 Generation
// ============================================================================

/**
 * Convert internal HandoffStylePatch to Export Schema v1 FinalPatch.
 */
export function toFinalPatch(
  patch: HandoffStylePatch,
  selectorConfidence: SelectorConfidence
): FinalPatch {
  return {
    selector: patch.selector,
    property: toKebabCase(String(patch.property)),
    originalValue: patch.previousValue || null,
    finalValue: patch.value,
    selectorConfidence,
    capturedAt: new Date(patch.timestamp).toISOString(),
  };
}

/**
 * Create a VisualUIInspectorExport conforming to Export Schema v1.
 * This is the canonical export format for external consumers.
 * 
 * @param pageUrl - The URL of the page where changes were made
 * @param viewport - Viewport dimensions at capture time
 * @param patches - Array of internal style patches
 * @param selectorStatus - Resolution status of the selector
 * @param matchCount - Number of elements matching the selector
 * @param identityMatch - Whether element identity matches patches
 * @returns Complete VisualUIInspectorExport
 */
export function createExportSchemaV1(
  pageUrl: string,
  viewport: Viewport,
  patches: StylePatch[],
  selectorStatus: SelectorResolutionStatus,
  matchCount: number,
  identityMatch: boolean
): VisualUIInspectorExport {
  const now = new Date().toISOString();
  // Collapse patches first to remove noise, then filter for validity
  const collapsedPatches = collapsePatches(patches);
  const validPatches = filterValidPatches(collapsedPatches);

  // Compute confidence for each patch's selector
  const finalPatches: FinalPatch[] = validPatches.map((patch) => {
    const confidence = computeSelectorConfidence(patch.selector, matchCount);
    return toFinalPatch(patch, confidence);
  });

  // Generate warnings based on conditions
  const warnings = generateWarnings(
    validPatches.map(p => p.selector),
    selectorStatus,
    matchCount,
    identityMatch,
    viewport
  );

  return {
    exportVersion: EXPORT_SCHEMA_VERSION,
    capturedAt: now,
    pageUrl,
    viewport,
    patches: finalPatches,
    warnings,
  };
}

/**
 * Generate warnings based on export conditions.
 * Warnings are attached to the export as structured objects.
 * AI consumers MUST NOT ignore warnings.
 */
export function generateWarnings(
  selectors: string[],
  selectorStatus: SelectorResolutionStatus,
  matchCount: number,
  identityMatch: boolean,
  viewport: Viewport
): ExportWarning[] {
  const warnings: ExportWarning[] = [];

  // Check each selector for positional usage
  const positionalSelectors = selectors.filter(usesPositionalSelector);
  if (positionalSelectors.length > 0) {
    warnings.push({
      code: 'SELECTOR_POSITIONAL',
      message: 'Selector uses positional matching (:nth-child). It may break if DOM order changes.',
      affectedSelectors: positionalSelectors,
    });
  }

  // Check for selectors without ID
  const noIdSelectors = selectors.filter(s => !hasUniqueId(s) && !hasStableDataAttribute(s));
  if (noIdSelectors.length > 0) {
    warnings.push({
      code: 'SELECTOR_NO_ID',
      message: 'No ID or stable data attribute was available. Consider adding a data-testid or unique ID for reliability.',
      affectedSelectors: noIdSelectors,
    });
  }

  // Check for multiple elements matched
  if (matchCount > 1 || selectorStatus === 'AMBIGUOUS') {
    warnings.push({
      code: 'MULTIPLE_ELEMENTS_MATCHED',
      message: `Selector matched ${matchCount} elements at capture time. Output would be ambiguous.`,
      affectedSelectors: selectors,
    });
  }

  // Check for element not found
  if (selectorStatus === 'NOT_FOUND') {
    warnings.push({
      code: 'ELEMENT_NOT_FOUND',
      message: 'Element could not be re-queried at export time. The export may be stale.',
      affectedSelectors: selectors,
    });
  }

  // Check for identity mismatch
  if (!identityMatch) {
    warnings.push({
      code: 'IDENTITY_MISMATCH',
      message: 'Element identity does not match the recorded patches. The element may have changed.',
      affectedSelectors: selectors,
    });
  }

  // Check for viewport mismatch (common breakpoints: 320, 375, 768, 1024, 1280, 1440, 1920)
  const commonWidths = [320, 375, 768, 1024, 1280, 1440, 1920];
  const isNearCommonBreakpoint = commonWidths.some(
    width => Math.abs(viewport.width - width) < 50
  );
  if (!isNearCommonBreakpoint) {
    warnings.push({
      code: 'VIEWPORT_MISMATCH',
      message: `Captured viewport (${viewport.width}x${viewport.height}) differs from common breakpoints. Changes may be media-query dependent.`,
    });
  }

  return warnings;
}

// ============================================================================
// Legacy Export Generation (Internal Use)
// ============================================================================

/**
 * Create a complete Prompt Handoff export payload.
 * @deprecated Use createExportSchemaV1 for external exports
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
  // Collapse patches first to remove noise, then filter for validity
  const collapsedPatches = collapsePatches(patches);
  const validPatches = filterValidPatches(collapsedPatches);

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
 * Format a VisualUIInspectorExport as a pretty-printed JSON string.
 * Suitable for clipboard copy or file export.
 */
export function formatExportJSON(exportData: VisualUIInspectorExport): string {
  return JSON.stringify(exportData, null, 2);
}

/**
 * Format a VisualUIInspectorExport as a compact JSON string.
 * Suitable for programmatic transmission.
 */
export function formatExportJSONCompact(exportData: VisualUIInspectorExport): string {
  return JSON.stringify(exportData);
}

/**
 * Format a PromptHandoffExport as a pretty-printed JSON string.
 * @deprecated Use formatExportJSON with VisualUIInspectorExport
 */
export function formatHandoffJSON(handoff: PromptHandoffExport): string {
  return JSON.stringify(handoff, null, 2);
}

/**
 * Format a PromptHandoffExport as a compact JSON string.
 * @deprecated Use formatExportJSONCompact with VisualUIInspectorExport
 */
export function formatHandoffJSONCompact(handoff: PromptHandoffExport): string {
  return JSON.stringify(handoff);
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Create and format a handoff export in a single call.
 * @deprecated Use createExportSchemaV1 + formatExportJSON
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

/**
 * Generate a complete Export Schema v1 JSON string.
 * This is the preferred method for creating exports.
 */
export function generateExportSchemaV1JSON(
  pageUrl: string,
  viewport: Viewport,
  patches: StylePatch[],
  selectorStatus: SelectorResolutionStatus,
  matchCount: number,
  identityMatch: boolean
): string {
  const exportData = createExportSchemaV1(
    pageUrl,
    viewport,
    patches,
    selectorStatus,
    matchCount,
    identityMatch
  );
  return formatExportJSON(exportData);
}

// ============================================================================
// CSS Diff Generation
// ============================================================================

/**
 * Generate a CSS diff string showing property changes.
 * Format: selector { property: value; }
 */
export function generateCSSDiff(patches: FinalPatch[]): string {
  if (patches.length === 0) {
    return '/* No changes */';
  }

  // Group patches by selector
  const bySelector = new Map<string, FinalPatch[]>();
  for (const patch of patches) {
    const existing = bySelector.get(patch.selector) || [];
    existing.push(patch);
    bySelector.set(patch.selector, existing);
  }

  const lines: string[] = [];
  for (const [selector, selectorPatches] of bySelector) {
    lines.push(`${selector} {`);
    for (const patch of selectorPatches) {
      lines.push(`  ${patch.property}: ${patch.finalValue};`);
    }
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Generate a human-readable summary of changes.
 */
export function generateChangeSummary(patches: FinalPatch[]): string {
  if (patches.length === 0) return 'No changes';
  if (patches.length === 1) {
    const p = patches[0];
    return `${p.property}: ${p.originalValue ?? 'unset'} → ${p.finalValue}`;
  }
  return `${patches.length} property changes`;
}
