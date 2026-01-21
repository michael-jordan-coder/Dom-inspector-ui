/**
 * History Module
 * 
 * Manages undo/redo history for style patches.
 * Stores patches in memory with support for Chrome storage persistence.
 */

import type { StylePatch } from '../shared/types';

interface HistoryState {
  undoStack: StylePatch[];
  redoStack: StylePatch[];
  maxHistorySize: number;
}

const state: HistoryState = {
  undoStack: [],
  redoStack: [],
  maxHistorySize: 100, // Reasonable limit to prevent memory issues
};

/**
 * Push a new patch to the history.
 * Clears the redo stack as we're creating a new branch.
 */
export function pushPatch(patch: StylePatch): void {
  state.undoStack.push(patch);
  state.redoStack = []; // Clear redo stack on new action
  
  // Trim if exceeding max size
  if (state.undoStack.length > state.maxHistorySize) {
    state.undoStack.shift();
  }
}

/**
 * Pop the last patch from the undo stack.
 * Returns null if there's nothing to undo.
 */
export function popUndo(): StylePatch | null {
  const patch = state.undoStack.pop();
  if (patch) {
    state.redoStack.push(patch);
    return patch;
  }
  return null;
}

/**
 * Pop from the redo stack.
 * Returns null if there's nothing to redo.
 */
export function popRedo(): StylePatch | null {
  const patch = state.redoStack.pop();
  if (patch) {
    state.undoStack.push(patch);
    return patch;
  }
  return null;
}

/**
 * Check if undo is available.
 */
export function canUndo(): boolean {
  return state.undoStack.length > 0;
}

/**
 * Check if redo is available.
 */
export function canRedo(): boolean {
  return state.redoStack.length > 0;
}

/**
 * Get the current undo stack size.
 */
export function getUndoCount(): number {
  return state.undoStack.length;
}

/**
 * Get the current redo stack size.
 */
export function getRedoCount(): number {
  return state.redoStack.length;
}

/**
 * Clear all history.
 */
export function clearHistory(): void {
  state.undoStack = [];
  state.redoStack = [];
}

/**
 * Get all patches for a specific selector (for cleanup purposes).
 */
export function getPatchesForSelector(selector: string): StylePatch[] {
  return state.undoStack.filter(p => p.selector === selector);
}

/**
 * Get a copy of the entire undo stack (all applied patches).
 * Used for generating export data.
 */
export function getAllPatches(): StylePatch[] {
  return [...state.undoStack];
}

/**
 * Persist history to Chrome storage (optional, for session persistence).
 */
export async function persistHistory(): Promise<void> {
  try {
    await chrome.storage.local.set({
      uiInspectorHistory: {
        undoStack: state.undoStack,
        redoStack: state.redoStack,
      },
    });
  } catch (e) {
    console.warn('[UI Inspector] Failed to persist history:', e);
  }
}

/**
 * Restore history from Chrome storage.
 */
export async function restoreHistory(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('uiInspectorHistory');
    if (result.uiInspectorHistory) {
      state.undoStack = result.uiInspectorHistory.undoStack || [];
      state.redoStack = result.uiInspectorHistory.redoStack || [];
    }
  } catch (e) {
    console.warn('[UI Inspector] Failed to restore history:', e);
  }
}
