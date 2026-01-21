/**
 * Prompt Template for Handoff Export
 *
 * Generates the execution prompt that instructs an AI coding agent
 * how to apply verified visual changes to source code.
 */

import type { PromptHandoffExport, HandoffStylePatch } from './types';

/**
 * Convert camelCase CSS property to kebab-case.
 */
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Format patches as human-readable delta list.
 */
function formatPatchDeltas(patches: HandoffStylePatch[]): string {
  return patches
    .map((p) => `- ${toKebabCase(String(p.property))}: ${p.previousValue} → ${p.value}`)
    .join('\n');
}

/**
 * Generate the full execution prompt for an AI coding agent.
 */
export function generateExecutionPrompt(exportData: PromptHandoffExport): string {
  const { selectedElement, patches, stability } = exportData;

  // Format the JSON export
  const jsonExport = JSON.stringify(exportData, null, 2);

  // Build stability warning if needed
  let stabilityWarning = '';
  if (stability.selectorResolution.status !== 'OK') {
    stabilityWarning = `
⚠️ SELECTOR WARNING: Status is ${stability.selectorResolution.status}
   The selector may not reliably identify this element in the codebase.
   Recommend adding a stable identifier (data-testid, unique ID, etc.)
`;
  } else if (stability.usesNthOfType) {
    stabilityWarning = `
⚠️ FRAGILE SELECTOR: Uses :nth-of-type positioning
   This selector depends on DOM position and may break if siblings change.
   Recommend adding a stable identifier (data-testid, unique ID, etc.)
`;
  } else if (!stability.identityMatch) {
    stabilityWarning = `
⚠️ IDENTITY MISMATCH: Element may have changed since patches were recorded
   Verify the target element matches the expected identity before applying changes.
`;
  }

  return `You are a SENIOR CONTEXT-AWARE CODING AGENT with FULL REPOSITORY ACCESS.

Your job:
Implement the Visual UI Inspector's captured UI changes into the project's SOURCE CODE (not inline styles), using the repo you have open.

You MUST treat the provided visual deltas as IMMUTABLE TRUTH:
- Do not redesign
- Do not change values
- Do not "improve"
- Do not apply inline styles
- Do not use !important
- Do not broaden scope unless the repo already uses a shared abstraction that is the clear correct home

You MUST:
- Locate where this element is defined/styled in the repo
- Apply the changes using the project's existing styling approach (Tailwind / CSS Modules / styled-components / plain CSS / design tokens), based on what you detect in the repo
- Keep the narrowest correct scope (ideally the component or style definition that controls this element)
- Verify by running the app and checking computed styles match exactly

If anything is ambiguous (multiple candidates, selector not helpful, element appears in multiple places):
- STOP and report the ambiguity
- Provide 2–3 likely locations and a recommended next step to disambiguate
- Do NOT guess

==================================================
VISUAL INSPECTOR EXPORT (SOURCE OF TRUTH)
==================================================

${jsonExport}
${stabilityWarning}
==================================================
REQUIRED VISUAL OUTCOME (EXACT)
==================================================

Apply these deltas to the source code styles of the target element (${selectedElement.selector}):
${formatPatchDeltas(patches)}

Everything else should remain unchanged.

==================================================
EXECUTION INSTRUCTIONS
==================================================

1) Locate the element in the repo:
   - Search for selector: ${selectedElement.selector}
   - Search for text: "${selectedElement.textPreview}"
   - Tag: <${selectedElement.tagName}>
   - Classes: ${selectedElement.classList.join(', ') || '(none)'}

2) Identify where its styling comes from:
   - CSS file, Tailwind utilities, styled-components, CSS Modules, or inline styles
   - If a shared component exists, prefer updating its tokens/variants ONLY if it maps directly to this element

3) Implement changes without inline styles:
   - Update CSS / tokens / Tailwind class composition to produce the exact values

4) Verify:
   - Run the project
   - Confirm computed styles for ${selectedElement.selector} match exactly
   - Confirm no other elements were unintentionally affected

5) Output:
   - List modified files
   - Provide a brief explanation of the scope choice
   - Provide verification steps and results

BEGIN NOW.
`;
}

/**
 * Generate a compact summary of changes for display.
 */
export function generateChangeSummary(patches: HandoffStylePatch[]): string {
  if (patches.length === 0) return 'No changes';
  if (patches.length === 1) {
    const p = patches[0];
    return `${toKebabCase(String(p.property))}: ${p.previousValue} → ${p.value}`;
  }
  return `${patches.length} changes`;
}
