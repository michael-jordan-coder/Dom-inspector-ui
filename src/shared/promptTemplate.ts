/**
 * Prompt Template for Handoff Export
 *
 * Generates the execution prompt that instructs an AI coding agent
 * how to apply verified visual changes to source code.
 */

import type { VisualUIInspectorExport, FinalPatch } from './types';
import { implementationGuidePrompt } from '../ai/prompts/implementationGuidePrompt';



/**
 * Generate the full execution prompt for an AI coding agent.
 */
export function generateExecutionPrompt(exportData: VisualUIInspectorExport): string {
  const jsonExport = JSON.stringify(exportData, null, 2);
  return `${implementationGuidePrompt}\n\nINPUT:\n${jsonExport}`;
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
