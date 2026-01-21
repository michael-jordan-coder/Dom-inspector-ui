/**
 * Prompt Template for Handoff Export
 *
 * Generates the execution prompt that instructs an AI coding agent
 * how to apply verified visual changes to source code.
 */

import type { VisualUIInspectorExport, FinalPatch } from './types';



/**
 * Format patches as human-readable delta list.
 */
function formatPatchDeltas(patches: FinalPatch[]): string {
  return patches
    .map((p) => `- ${p.property}: ${p.originalValue ?? 'null'} → ${p.finalValue}`)
    .join('\n');
}

/**
 * Generate the full execution prompt for an AI coding agent.
 */
export function generateExecutionPrompt(exportData: VisualUIInspectorExport): string {
  const { patches, warnings } = exportData;
  const targetSelector = patches.length > 0 ? patches[0].selector : '(no-selector)';

  // Format the JSON export
  const jsonExport = JSON.stringify(exportData, null, 2);

  // Build stability warning if needed
  let stabilityWarning = '';
  if (warnings.length > 0) {
    const warningText = warnings.map(w => `⚠️ ${w.code}: ${w.message}`).join('\n');
    stabilityWarning = `\nWARNINGS:\n${warningText}\n`;
  }

  // Derive simple hints from selector if possible
  const idMatch = targetSelector.match(/#([a-zA-Z0-9_-]+)/);
  const classMatch = targetSelector.match(/\.([a-zA-Z0-9_-]+)/g);
  const idHint = idMatch ? `ID: #${idMatch[1]}` : '';
  const classHint = classMatch ? `Classes: ${classMatch.map(c => c.substring(1)).join(', ')}` : '';

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

Apply these deltas to the source code styles of the target element (${targetSelector}):
${formatPatchDeltas(patches)}

Everything else should remain unchanged.

==================================================
EXECUTION INSTRUCTIONS
==================================================

1) Locate the element in the repo:
   - Search for selector: ${targetSelector}
   - ${idHint}
   - ${classHint}

2) Identify where its styling comes from:
   - CSS file, Tailwind utilities, styled-components, CSS Modules, or inline styles
   - If a shared component exists, prefer updating its tokens/variants ONLY if it maps directly to this element

3) Implement changes without inline styles:
   - Update CSS / tokens / Tailwind class composition to produce the exact values

4) Verify:
   - Run the project
   - Confirm computed styles for ${targetSelector} match exactly
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
export function generateChangeSummary(patches: FinalPatch[]): string {
  if (patches.length === 0) return 'No changes';
  if (patches.length === 1) {
    const p = patches[0];
    return `${p.property}: ${p.originalValue ?? 'unset'} → ${p.finalValue}`;
  }
  return `${patches.length} changes`;
}
