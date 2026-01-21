/**
 * Side Panel Message Bridge
 * 
 * Handles communication between the side panel and the content script
 * via the service worker.
 */

import type {
  ExtensionMessage,
  ElementMetadata,
  ComputedStylesSnapshot,
  StylePatch,
  VisualUIInspectorExport,
  Viewport,
} from '../../shared/types';
import { MessageType, createMessage, isExtensionMessage } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

export interface BridgeCallbacks {
  onElementSelected?: (metadata: ElementMetadata) => void;
  onPickCancelled?: () => void;
  onStylePatchApplied?: (patch: StylePatch, styles: ComputedStylesSnapshot) => void;
  onUndoApplied?: (result: {
    success: boolean;
    patch: StylePatch | null;
    updatedStyles: ComputedStylesSnapshot | null;
    canUndo: boolean;
    canRedo: boolean;
  }) => void;
  onRedoApplied?: (result: {
    success: boolean;
    patch: StylePatch | null;
    updatedStyles: ComputedStylesSnapshot | null;
    canUndo: boolean;
    canRedo: boolean;
  }) => void;
  onTabChanged?: () => void;
  onError?: (error: string) => void;
}

// ============================================================================
// Bridge Implementation
// ============================================================================

let callbacks: BridgeCallbacks = {};

/**
 * Initialize the message bridge with callbacks.
 */
export function initBridge(cbs: BridgeCallbacks): () => void {
  callbacks = cbs;

  // Listen for messages from service worker
  const messageListener = (message: ExtensionMessage) => {
    if (!isExtensionMessage(message)) {
      // Handle non-standard messages (tab events)
      const msg = message as { type: string };
      if (msg.type === 'TAB_UPDATED' || msg.type === 'TAB_ACTIVATED') {
        callbacks.onTabChanged?.();
      }
      return;
    }

    switch (message.type) {
      case MessageType.ELEMENT_SELECTED:
        callbacks.onElementSelected?.(message.payload);
        break;

      case MessageType.PICK_CANCELLED:
        callbacks.onPickCancelled?.();
        break;

      case MessageType.STYLE_PATCH_APPLIED:
        if (message.payload.success) {
          callbacks.onStylePatchApplied?.(
            message.payload.patch,
            message.payload.updatedStyles
          );
        }
        break;

      case MessageType.UNDO_APPLIED:
        callbacks.onUndoApplied?.(message.payload);
        break;

      case MessageType.REDO_APPLIED:
        callbacks.onRedoApplied?.(message.payload);
        break;
    }
  };

  chrome.runtime.onMessage.addListener(messageListener);

  // Return cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(messageListener);
  };
}

/**
 * Send a message to the content script via the service worker.
 */
async function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    // Set timeout for message response
    const timeout = setTimeout(() => {
      reject(new Error('Message timeout - content script may not be loaded. Try refreshing the page.'));
    }, 5000);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timeout);

      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || '';
        // Provide more helpful error messages
        if (errorMsg.includes('Receiving end does not exist')) {
          reject(new Error('Content script not loaded. Please refresh the page and try again.'));
        } else {
          reject(new Error(errorMsg || 'Unknown error'));
        }
        return;
      }

      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response as T);
    });
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Start element picker mode.
 */
export async function startPicker(): Promise<void> {
  try {
    await sendMessage(createMessage(MessageType.START_PICK));
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

/**
 * Stop element picker mode.
 */
export async function stopPicker(): Promise<void> {
  try {
    await sendMessage(createMessage(MessageType.STOP_PICK));
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

/**
 * Apply a style patch to the selected element.
 */
export async function applyStylePatch(
  selector: string,
  property: string,
  value: string,
  previousValue: string = ''
): Promise<void> {
  try {
    await sendMessage(
      createMessage<import('../../shared/types').ApplyStylePatchMessage>(
        MessageType.APPLY_STYLE_PATCH,
        { selector, property, value, previousValue }
      )
    );
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

/**
 * Undo the last style change.
 */
export async function undo(): Promise<void> {
  try {
    await sendMessage(createMessage(MessageType.UNDO));
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

/**
 * Redo the last undone style change.
 */
export async function redo(): Promise<void> {
  try {
    await sendMessage(createMessage(MessageType.REDO));
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

/**
 * Get the current state from the content script.
 */
export async function getCurrentState(): Promise<{
  isPickerActive: boolean;
  selectedElement: ElementMetadata | null;
  canUndo: boolean;
  canRedo: boolean;
}> {
  try {
    return await sendMessage(createMessage(MessageType.GET_CURRENT_STATE));
  } catch {
    // Content script might not be loaded yet
    return {
      isPickerActive: false,
      selectedElement: null,
      canUndo: false,
      canRedo: false,
    };
  }
}

/**
 * Clear the current selection and hide overlay.
 */
export async function clearSelection(): Promise<void> {
  try {
    await sendMessage(createMessage(MessageType.CLEAR_SELECTION));
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

/**
 * Toggle spacing visualization overlay on the page.
 */
export async function toggleSpacingVisualization(enabled: boolean): Promise<void> {
  try {
    await sendMessage(
      createMessage(MessageType.TOGGLE_SPACING_VISUALIZATION, { enabled })
    );
  } catch (e) {
    callbacks.onError?.(String(e));
    throw e;
  }
}

// ============================================================================
// Hierarchy Navigation
// ============================================================================

/**
 * Navigate to parent element.
 */
export async function navigateToParent(): Promise<boolean> {
  try {
    const result = await sendMessage<{ success: boolean }>(
      createMessage(MessageType.NAVIGATE_TO_PARENT)
    );
    return result.success;
  } catch (e) {
    callbacks.onError?.(String(e));
    return false;
  }
}

/**
 * Navigate to child element at index.
 */
export async function navigateToChild(index: number = 0): Promise<boolean> {
  try {
    const result = await sendMessage<{ success: boolean }>(
      createMessage<import('../../shared/types').NavigateToChildMessage>(
        MessageType.NAVIGATE_TO_CHILD,
        { index }
      )
    );
    return result.success;
  } catch (e) {
    callbacks.onError?.(String(e));
    return false;
  }
}

/**
 * Navigate to element by selector.
 */
export async function navigateToSelector(selector: string): Promise<boolean> {
  try {
    const result = await sendMessage<{ success: boolean }>(
      createMessage<import('../../shared/types').NavigateToSelectorMessage>(
        MessageType.NAVIGATE_TO_SELECTOR,
        { selector }
      )
    );
    return result.success;
  } catch (e) {
    callbacks.onError?.(String(e));
    return false;
  }
}

/**
 * Navigate to sibling element.
 */
export async function navigateToSibling(direction: 'prev' | 'next'): Promise<boolean> {
  try {
    const result = await sendMessage<{ success: boolean }>(
      createMessage<import('../../shared/types').NavigateToSiblingMessage>(
        MessageType.NAVIGATE_TO_SIBLING,
        { direction }
      )
    );
    return result.success;
  } catch (e) {
    callbacks.onError?.(String(e));
    return false;
  }
}

// ============================================================================
// Export Data (Schema v1)
// ============================================================================

/**
 * Get export data in Export Schema v1 format.
 * Returns the validated export with all patches, warnings, and stability signals.
 */
export async function getExportData(): Promise<{
  exportData: VisualUIInspectorExport | null;
  patchCount: number;
  pageUrl: string;
  viewport: Viewport;
}> {
  try {
    return await sendMessage<{
      exportData: VisualUIInspectorExport | null;
      patchCount: number;
      pageUrl: string;
      viewport: Viewport;
    }>(createMessage(MessageType.GET_EXPORT_DATA));
  } catch {
    return {
      exportData: null,
      patchCount: 0,
      pageUrl: '',
      viewport: { width: 0, height: 0 },
    };
  }
}
