/**
 * Content Script - Main Entry Point
 * 
 * Handles DOM interaction for the UI Inspector extension.
 * - Picker mode (hover highlight + click select)
 * - Element metadata extraction
 * - Style manipulation via DOM patches
 * - Undo/Redo support
 */

import type {
  ElementMetadata,
  ExtensionMessage,
  StylePatch,
  ComputedStylesSnapshot,
} from '../shared/types';
import { MessageType, createMessage } from '../shared/types';
import { getStableSelector, findElementBySelector } from '../shared/selector';
import { computeIdentity } from '../shared/identity';
import {
  initOverlay,
  showHoverOverlay,
  hideHoverOverlay,
  showSelectedOverlay,
  hideSelectedOverlay,
  updateSelectedOverlay,
  isTextEditable,
  showTextEditor,
  hideTextEditor,
  isTextEditingActive,
} from './overlay';
import {
  applyStylePatch,
  revertStylePatch,
  reapplyStylePatch,
  getComputedStylesSnapshot,
} from './domPatch';
import {
  pushPatch,
  popUndo,
  popRedo,
  canUndo,
  canRedo,
  getAllPatches,
} from './history';
import { createExportSchemaV1 } from '../shared/handoff';
import type { VisualUIInspectorExport } from '../shared/types';
import {
  extractHierarchy,
  getNavigableParent,
  getChildAtIndex,
  getSibling,
} from './hierarchy';

// ============================================================================
// State
// ============================================================================


interface ContentScriptState {
  isPickerActive: boolean;
  selectedElement: Element | null;
  selectedSelector: string | null;
  hoveredElement: Element | null;
}

const state: ContentScriptState = {
  isPickerActive: false,
  selectedElement: null,
  selectedSelector: null,
  hoveredElement: null,
};

// ============================================================================
// Element Metadata Extraction
// ============================================================================

function extractElementMetadata(element: Element, includeHierarchy = true): ElementMetadata {
  const rect = element.getBoundingClientRect();
  const computedStyles = getComputedStylesSnapshot(element);

  // Get text preview from aria-label or textContent
  let textPreview = '';
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    textPreview = ariaLabel;
  } else if (element.textContent) {
    textPreview = element.textContent.trim().replace(/\s+/g, ' ');
  }
  // Truncate to 60 chars
  if (textPreview.length > 60) {
    textPreview = textPreview.substring(0, 57) + '...';
  }

  const metadata: ElementMetadata = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    classList: Array.from(element.classList).slice(0, 5), // Limit to 5 classes
    role: element.getAttribute('role'),
    ariaLabel: ariaLabel,
    textPreview,
    selector: getStableSelector(element),
    boundingRect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
    computedStyles,
  };

  // Include hierarchy information for navigation
  if (includeHierarchy) {
    metadata.hierarchy = extractHierarchy(element);
  }

  return metadata;
}

// ============================================================================
// Picker Mode Handlers
// ============================================================================

function handleMouseMove(e: MouseEvent): void {
  if (!state.isPickerActive) return;

  const target = e.target as Element;

  // Skip our own overlay elements
  if (target.id?.startsWith('__ui_inspector')) return;

  if (target !== state.hoveredElement) {
    state.hoveredElement = target;
    const rect = target.getBoundingClientRect();
    showHoverOverlay(rect);
  }
}

function handleClick(e: MouseEvent): void {
  if (!state.isPickerActive) return;

  const target = e.target as Element;

  // Skip our own overlay elements
  if (target.id?.startsWith('__ui_inspector')) return;

  // Prevent default behavior and stop propagation
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  // Select the element - picker stays active for continued selection
  selectElement(target);

  // NOTE: Do NOT call stopPicker() here - live selection mode
  // User must press Esc or use UI toggle to exit picking mode
}

function handleDoubleClick(e: MouseEvent): void {
  // Only works in picker mode
  if (!state.isPickerActive) return;

  handleDoubleClickEdit(e);
}

/**
 * Handle double-click for inline text editing (works with or without picker).
 */
function handleDoubleClickEdit(e: MouseEvent): void {
  // Skip if text editing is already active
  if (isTextEditingActive()) return;

  const target = e.target as Element;

  // Skip our own overlay elements
  if (target.id?.startsWith('__ui_inspector')) return;

  // Check if we have a selected element and the double-click is on it
  // or if the target itself is text-editable (during picker mode)
  let elementToEdit: Element | null = null;

  if (state.selectedElement && state.selectedElement.contains(target as Node)) {
    elementToEdit = state.selectedElement;
  } else if (state.isPickerActive) {
    elementToEdit = target;
  }

  if (!elementToEdit) return;

  // Only allow text editing on appropriate elements
  if (!isTextEditable(elementToEdit)) return;

  // Prevent default text selection
  e.preventDefault();
  e.stopPropagation();

  // Show inline text editor
  showTextEditor(elementToEdit, (newText) => {
    if (newText !== null && elementToEdit) {
      // Apply text change
      applyTextContent(elementToEdit, newText);
    }
  });
}

/**
 * Global double-click handler for selected elements (works without picker mode).
 */
function handleGlobalDoubleClick(e: MouseEvent): void {
  // Skip if picker is active (picker has its own handler)
  if (state.isPickerActive) return;

  // Only proceed if we have a selected element
  if (!state.selectedElement) return;

  handleDoubleClickEdit(e);
}

/**
 * Apply new text content to an element.
 */
function applyTextContent(element: Element, newText: string): void {
  // Store original for potential undo
  const originalText = element.textContent || '';

  // Find and update direct text nodes, or set textContent if simple
  const textNodes = Array.from(element.childNodes).filter(
    node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );

  if (textNodes.length === 1) {
    // Simple case: single text node
    textNodes[0].textContent = newText;
  } else if (textNodes.length === 0 && element.childNodes.length === 0) {
    // Empty element: just set textContent
    element.textContent = newText;
  } else {
    // Complex case: element has mixed content
    // Replace first meaningful text node or prepend
    const firstTextNode = textNodes[0];
    if (firstTextNode) {
      firstTextNode.textContent = newText;
    } else {
      // Prepend text node
      element.insertBefore(document.createTextNode(newText), element.firstChild);
    }
  }

  // Update selected overlay (element size may have changed)
  if (state.selectedElement === element) {
    updateSelectedOverlay(element);
  }

  // Send notification about text change
  sendMessage(createMessage<import('../shared/types').TextContentChangedMessage>(
    MessageType.TEXT_CONTENT_CHANGED,
    {
      selector: state.selectedSelector || getStableSelector(element),
      previousText: originalText,
      newText,
    }
  ));

  // Re-extract and send updated metadata
  if (state.selectedElement) {
    const metadata = extractElementMetadata(state.selectedElement);
    sendMessage(createMessage<import('../shared/types').ElementSelectedMessage>(
      MessageType.ELEMENT_SELECTED,
      metadata
    ));
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!state.isPickerActive) return;

  // Allow escape to cancel picker
  if (e.key === 'Escape') {
    stopPicker();
    sendMessage(createMessage(MessageType.PICK_CANCELLED));
  }
}

function startPicker(): void {
  if (state.isPickerActive) return;

  state.isPickerActive = true;
  state.hoveredElement = null;

  // Initialize overlay
  initOverlay();

  // Add event listeners with capture to get events before page
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('dblclick', handleDoubleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);

  // Add cursor style
  document.body.style.cursor = 'crosshair';
}

function stopPicker(): void {
  if (!state.isPickerActive) return;

  state.isPickerActive = false;
  state.hoveredElement = null;

  // Remove event listeners
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('dblclick', handleDoubleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);

  // Hide overlays
  hideHoverOverlay();
  hideTextEditor();

  // Restore cursor
  document.body.style.cursor = '';
}

function selectElement(element: Element): void {
  state.selectedElement = element;
  state.selectedSelector = getStableSelector(element);

  // Show selected overlay
  const rect = element.getBoundingClientRect();
  showSelectedOverlay(rect);

  // Extract and send metadata
  const metadata = extractElementMetadata(element);
  sendMessage(createMessage<import('../shared/types').ElementSelectedMessage>(
    MessageType.ELEMENT_SELECTED,
    metadata
  ));
}

// ============================================================================
// Style Patch Handlers
// ============================================================================

function handleApplyStylePatch(
  selector: string,
  property: string,
  value: string,
  previousValue: string
): { success: boolean; patch: StylePatch; updatedStyles: ComputedStylesSnapshot | null } {
  // First resolve the element to compute its identity
  const resolution = findElementBySelector(selector);
  const identityToken = resolution.status === 'OK' && resolution.element
    ? computeIdentity(resolution.element)
    : undefined;

  // Apply the patch with identity validation
  const result = applyStylePatch(selector, property, value, identityToken);

  const patch: StylePatch = {
    selector,
    property,
    value,
    previousValue: result.previousValue || previousValue,
    timestamp: Date.now(),
    identityToken  // Store for future undo/redo validation
  };

  if (result.success) {
    // Add to history
    pushPatch(patch);

    // Update selected overlay position (element might have moved)
    if (resolution.status === 'OK' && resolution.element) {
      updateSelectedOverlay(resolution.element);
      const updatedStyles = getComputedStylesSnapshot(resolution.element);
      return { success: true, patch, updatedStyles };
    }
  }

  return { success: result.success, patch, updatedStyles: null };
}


function handleUndo(): {
  success: boolean;
  patch: StylePatch | null;
  updatedStyles: ComputedStylesSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
} {
  const patch = popUndo();

  if (!patch) {
    return {
      success: false,
      patch: null,
      updatedStyles: null,
      canUndo: canUndo(),
      canRedo: canRedo(),
    };
  }

  const result = revertStylePatch(patch);

  // Get updated styles
  const resolution = findElementBySelector(patch.selector);
  const updatedStyles = (resolution.status === 'OK' && resolution.element)
    ? getComputedStylesSnapshot(resolution.element)
    : null;

  // Update overlay
  if (resolution.status === 'OK' && resolution.element) {
    updateSelectedOverlay(resolution.element);
  }

  return {
    success: result.success,
    patch,
    updatedStyles,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}

function handleRedo(): {
  success: boolean;
  patch: StylePatch | null;
  updatedStyles: ComputedStylesSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
} {
  const patch = popRedo();

  if (!patch) {
    return {
      success: false,
      patch: null,
      updatedStyles: null,
      canUndo: canUndo(),
      canRedo: canRedo(),
    };
  }

  const result = reapplyStylePatch(patch);

  // Get updated styles
  const resolution = findElementBySelector(patch.selector);
  const updatedStyles = (resolution.status === 'OK' && resolution.element)
    ? getComputedStylesSnapshot(resolution.element)
    : null;

  // Update overlay
  if (resolution.status === 'OK' && resolution.element) {
    updateSelectedOverlay(resolution.element);
  }

  return {
    success: result.success,
    patch,
    updatedStyles,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}

// ============================================================================
// Messaging
// ============================================================================

function sendMessage(message: ExtensionMessage): void {
  chrome.runtime.sendMessage(message).catch((e) => {
    // Extension might be reloading, ignore errors
    console.debug('[UI Inspector] Message send failed:', e);
  });
}


// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {

  if (!message || !message.type) {
    return false;
  }

  switch (message.type) {
    case MessageType.START_PICK:
      startPicker();
      sendResponse({ success: true });
      break;

    case MessageType.STOP_PICK:
      stopPicker();
      sendResponse({ success: true });
      break;

    case MessageType.APPLY_STYLE_PATCH:
      {
        const { selector, property, value, previousValue } = message.payload;
        const result = handleApplyStylePatch(selector, String(property), value, previousValue);
        sendResponse(result);

        // Also send updated state to sidepanel
        sendMessage(createMessage<import('../shared/types').StylePatchAppliedMessage>(
          MessageType.STYLE_PATCH_APPLIED,
          {
            success: result.success,
            patch: result.patch,
            updatedStyles: result.updatedStyles!,
          }
        ));
      }
      break;

    case MessageType.UNDO:
      {
        const result = handleUndo();
        sendResponse(result);

        sendMessage(createMessage<import('../shared/types').UndoAppliedMessage>(
          MessageType.UNDO_APPLIED,
          result
        ));
      }
      break;

    case MessageType.REDO:
      {
        const result = handleRedo();
        sendResponse(result);

        sendMessage(createMessage<import('../shared/types').RedoAppliedMessage>(
          MessageType.REDO_APPLIED,
          result
        ));
      }
      break;

    case MessageType.GET_CURRENT_STATE:
      {
        let selectedMetadata: ElementMetadata | null = null;
        if (state.selectedElement && document.contains(state.selectedElement)) {
          selectedMetadata = extractElementMetadata(state.selectedElement);
        } else if (state.selectedSelector) {
          // Try to find by selector if element reference is stale
          const resolution = findElementBySelector(state.selectedSelector);
          if (resolution.status === 'OK' && resolution.element) {
            state.selectedElement = resolution.element;
            selectedMetadata = extractElementMetadata(resolution.element);
          }
        }

        sendResponse({
          isPickerActive: state.isPickerActive,
          selectedElement: selectedMetadata,
          canUndo: canUndo(),
          canRedo: canRedo(),
        });
      }
      break;

    case MessageType.CLEAR_SELECTION:
      // Clear selection state and hide overlay
      state.selectedElement = null;
      state.selectedSelector = null;
      hideSelectedOverlay();
      sendResponse({ success: true });
      break;

    case MessageType.PING:
      sendResponse({ type: MessageType.PONG });
      break;

    // ========================================================================
    // Hierarchy Navigation
    // ========================================================================

    case MessageType.NAVIGATE_TO_PARENT:
      {
        if (!state.selectedElement) {
          sendResponse({ success: false, error: 'No element selected' });
          break;
        }
        const parent = getNavigableParent(state.selectedElement);
        if (!parent) {
          sendResponse({ success: false, error: 'No parent to navigate to' });
          break;
        }
        selectElement(parent);
        sendResponse({ success: true });
      }
      break;

    case MessageType.NAVIGATE_TO_CHILD:
      {
        if (!state.selectedElement) {
          sendResponse({ success: false, error: 'No element selected' });
          break;
        }
        const { index } = message.payload;
        const child = getChildAtIndex(state.selectedElement, index);
        if (!child) {
          sendResponse({ success: false, error: 'Child not found at index' });
          break;
        }
        selectElement(child);
        sendResponse({ success: true });
      }
      break;

    case MessageType.NAVIGATE_TO_SELECTOR:
      {
        const { selector } = message.payload;
        const resolution = findElementBySelector(selector);
        if (resolution.status !== 'OK' || !resolution.element) {
          sendResponse({ success: false, error: resolution.error || 'Element not found' });
          break;
        }
        selectElement(resolution.element);
        sendResponse({ success: true });
      }
      break;


    case MessageType.NAVIGATE_TO_SIBLING:
      {
        if (!state.selectedElement) {
          sendResponse({ success: false, error: 'No element selected' });
          break;
        }
        const { direction } = message.payload;
        const sibling = getSibling(state.selectedElement, direction);
        if (!sibling) {
          sendResponse({ success: false, error: `No ${direction} sibling` });
          break;
        }
        selectElement(sibling);
        sendResponse({ success: true });
      }
      break;

    // ========================================================================
    // Prompt Handoff Export
    // ========================================================================

    case MessageType.GET_EXPORT_DATA:
      {
        const patches = getAllPatches();
        const pageUrl = window.location.href;
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        // No patches = no export data
        if (patches.length === 0 || !state.selectedElement) {
          sendResponse({ exportData: null, patchCount: 0, pageUrl, viewport });
          break;
        }

        // Get current element metadata
        const elementMetadata = extractElementMetadata(state.selectedElement);

        // Resolve selector to check stability
        const resolution = findElementBySelector(elementMetadata.selector);
        const selectorStatus = resolution.status;
        const matchCount = resolution.matchCount ?? (resolution.status === 'OK' ? 1 : 0);

        // Check identity match for all patches
        const currentIdentity = computeIdentity(state.selectedElement);
        const identityMatch = patches.every(p => {
          if (!p.identityToken) return true;
          return (
            p.identityToken.tagName === currentIdentity.tagName &&
            p.identityToken.textPreview === currentIdentity.textPreview &&
            p.identityToken.classList === currentIdentity.classList &&
            p.identityToken.parentTag === currentIdentity.parentTag
          );
        });

        // Build export using Export Schema v1 directly
        const exportData: VisualUIInspectorExport = createExportSchemaV1(
          pageUrl,
          viewport,
          patches,
          selectorStatus,
          matchCount,
          identityMatch
        );

        sendResponse({
          exportData,
          patchCount: exportData.patches.length,
          pageUrl,
          viewport,
        });
      }
      break;

    default:
      return false;
  }

  return true; // Indicate async response
});

// ============================================================================
// Initialization
// ============================================================================


// Initialize overlay on script load
try {
  initOverlay();

  // Add global double-click handler for inline text editing on selected elements
  document.addEventListener('dblclick', handleGlobalDoubleClick, true);
} catch (e) {
  throw e;
}

// Handle page visibility changes (update overlay when tab becomes visible)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.selectedElement) {
    if (document.contains(state.selectedElement)) {
      updateSelectedOverlay(state.selectedElement);
    } else {
      // Element was removed, clear selection
      state.selectedElement = null;
      state.selectedSelector = null;
      hideSelectedOverlay();
    }
  }
});

// Handle scroll to update overlay positions
let scrollTimeout: number | undefined;
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = window.setTimeout(() => {
    if (state.selectedElement && document.contains(state.selectedElement)) {
      updateSelectedOverlay(state.selectedElement);
    }
  }, 16) as unknown as number; // ~60fps
}, { passive: true });

console.log('[UI Inspector] Content script loaded');
