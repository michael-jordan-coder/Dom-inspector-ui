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
import {
  initOverlay,
  showHoverOverlay,
  hideHoverOverlay,
  showSelectedOverlay,
  hideSelectedOverlay,
  updateSelectedOverlay,
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
} from './history';

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

function extractElementMetadata(element: Element): ElementMetadata {
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

  return {
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

  // Select the element
  selectElement(target);
  
  // Stop picker mode
  stopPicker();
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
  document.removeEventListener('keydown', handleKeyDown, true);
  
  // Hide hover overlay
  hideHoverOverlay();
  
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
  const result = applyStylePatch(selector, property, value);
  
  const patch: StylePatch = {
    selector,
    property,
    value,
    previousValue: result.previousValue || previousValue,
    timestamp: Date.now(),
  };
  
  if (result.success) {
    // Add to history
    pushPatch(patch);
    
    // Update selected overlay position (element might have moved)
    const element = findElementBySelector(selector);
    if (element) {
      updateSelectedOverlay(element);
      const updatedStyles = getComputedStylesSnapshot(element);
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
  
  const success = revertStylePatch(patch);
  
  // Get updated styles
  const element = findElementBySelector(patch.selector);
  const updatedStyles = element ? getComputedStylesSnapshot(element) : null;
  
  // Update overlay
  if (element) {
    updateSelectedOverlay(element);
  }
  
  return {
    success,
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
  
  const success = reapplyStylePatch(patch);
  
  // Get updated styles
  const element = findElementBySelector(patch.selector);
  const updatedStyles = element ? getComputedStylesSnapshot(element) : null;
  
  // Update overlay
  if (element) {
    updateSelectedOverlay(element);
  }
  
  return {
    success,
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
          const element = findElementBySelector(state.selectedSelector);
          if (element) {
            state.selectedElement = element;
            selectedMetadata = extractElementMetadata(element);
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
