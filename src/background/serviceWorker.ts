/**
 * Service Worker - Background Script
 * 
 * Acts as a message bridge between the side panel and content scripts.
 * Also handles extension lifecycle events and AI credential management.
 */

import type { ExtensionMessage, ElementMetadata } from '../shared/types';
import { MessageType, isExtensionMessage, createMessage } from '../shared/types';
import type { AICredentials } from '../ai/types';
import { AI_STORAGE_KEYS } from '../ai/types';

// ============================================================================
// Screenshot Capture
// ============================================================================

/**
 * Capture a screenshot of a specific element by cropping the visible tab.
 */
async function captureElementScreenshot(
  _tabId: number,
  boundingRect: ElementMetadata['boundingRect']
): Promise<string | undefined> {
  try {
    // If element is completely off-screen or has no size, skip
    if (boundingRect.width <= 0 || boundingRect.height <= 0) {
      return undefined;
    }

    // Capture the visible portion of the current window's active tab
    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: 'png',
    });

    // Create an offscreen document to crop the image
    // We'll use a simpler approach: return the full screenshot and crop client-side
    // For now, we crop using an OffscreenCanvas (available in service workers)
    
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    // Get device pixel ratio for accurate cropping (default to 1 if unknown)
    // Service workers don't have access to window.devicePixelRatio
    // We'll estimate based on common values or use 1
    const dpr = 2; // Common for modern displays, could be made dynamic

    // Calculate crop dimensions, accounting for device pixel ratio
    const cropX = Math.max(0, Math.floor(boundingRect.x * dpr));
    const cropY = Math.max(0, Math.floor(boundingRect.y * dpr));
    const cropWidth = Math.min(
      Math.ceil(boundingRect.width * dpr),
      imageBitmap.width - cropX
    );
    const cropHeight = Math.min(
      Math.ceil(boundingRect.height * dpr),
      imageBitmap.height - cropY
    );

    // Validate crop dimensions
    if (cropWidth <= 0 || cropHeight <= 0 || cropX >= imageBitmap.width || cropY >= imageBitmap.height) {
      // Element might be off-screen
      return undefined;
    }

    // Create cropped image using OffscreenCanvas
    const canvas = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    ctx.drawImage(
      imageBitmap,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    // Convert to blob then to data URL
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(undefined);
      };
      reader.readAsDataURL(croppedBlob);
    });
  } catch (error) {
    console.error('[UI Inspector] Screenshot capture failed:', error);
    return undefined;
  }
}

// ============================================================================
// Side Panel Setup
// ============================================================================

// Enable the side panel to open when the action icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[UI Inspector] Failed to set panel behavior:', error));

// ============================================================================
// Message Routing
// ============================================================================

// Forward messages from side panel to content script
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    return false;
  }

  // Messages from side panel (no sender.tab means from extension pages)
  if (!sender.tab) {
    // Forward to active tab's content script
    forwardToContentScript(message, sendResponse);
    return true; // Async response
  }

  // Messages from content script - forward to side panel
  // For ELEMENT_SELECTED, capture screenshot first
  if (message.type === MessageType.ELEMENT_SELECTED && sender.tab?.id) {
    const tabId = sender.tab.id;
    const metadata = message.payload;
    
    // Capture screenshot asynchronously and forward with it
    captureElementScreenshot(tabId, metadata.boundingRect)
      .then((screenshot) => {
        const enrichedMessage = {
          ...message,
          payload: {
            ...metadata,
            screenshot,
          },
        };
        chrome.runtime.sendMessage(enrichedMessage).catch(() => {
          // Side panel might not be open
        });
      })
      .catch(() => {
        // If screenshot fails, forward original message
        chrome.runtime.sendMessage(message).catch(() => {});
      });
    
    return false;
  }

  // Other messages from content script - forward directly to side panel
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might not be open, ignore
  });

  return false;
});

/**
 * Forward a message to the content script in the active tab.
 */
async function forwardToContentScript(
  message: ExtensionMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab?.id) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    // Check if we can inject scripts (not chrome:// or extension pages)
    const url = activeTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) {
      sendResponse({ error: 'Cannot inspect this page' });
      return;
    }

    // Ensure content script is injected
    try {
      await ensureContentScriptInjected(activeTab.id);
    } catch (error) {
      console.error('[UI Inspector] Failed to ensure content script:', error);
      sendResponse({ error: 'Failed to load content script. Please refresh the page.' });
      return;
    }

    // Send message to content script with timeout
    const response = await Promise.race([
      chrome.tabs.sendMessage(activeTab.id, message),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Message timeout')), 5000)
      )
    ]) as unknown;
    
    sendResponse(response);
  } catch (error) {
    console.error('[UI Inspector] Error forwarding message:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendResponse({ error: errorMessage });
  }
}

/**
 * Ensure content script is injected in the tab.
 * This handles cases where the extension was reloaded or installed on an existing tab.
 */
async function ensureContentScriptInjected(tabId: number): Promise<void> {
  // First, check if content script is already loaded
  try {
    await chrome.tabs.sendMessage(tabId, createMessage(MessageType.PING));
    // Content script is loaded
    return;
  } catch {
    // Content script not loaded, continue to injection
  }

  // Get tab info to verify we can inject
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url) {
    throw new Error('Tab URL not available');
  }

  // Check if we can inject scripts (not chrome:// or extension pages)
  if (tab.url.startsWith('chrome://') || 
      tab.url.startsWith('chrome-extension://') || 
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:')) {
    throw new Error('Cannot inject content script on this page type');
  }

  // Check if page is ready (complete or loading)
  if (tab.status === 'loading') {
    // Wait a bit for page to finish loading
    await new Promise(resolve => setTimeout(resolve, 500));
    // Re-check tab status
    const updatedTab = await chrome.tabs.get(tabId);
    if (updatedTab.status === 'loading') {
      throw new Error('Page is still loading. Please wait and try again.');
    }
  }

  // Content script not loaded, inject it
  console.log('[UI Inspector] Injecting content script into tab', tabId);
  
  try {
    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript.js'],
    });
    
    // Wait for script to initialize and verify it's loaded
    // Try multiple times with increasing delays
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      const delay = 100 * (attempts + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        await chrome.tabs.sendMessage(tabId, createMessage(MessageType.PING));
        console.log('[UI Inspector] Content script verified after', attempts + 1, 'attempts');
        return; // Success!
      } catch (pingError) {
        // Continue to next attempt
      }
      
      attempts++;
    }
    
    throw new Error('Content script injected but did not respond to ping');
  } catch (error) {
    console.error('[UI Inspector] Failed to inject content script:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load content script: ${errorMessage}`);
  }
}

// ============================================================================
// Tab Events
// ============================================================================

// Listen for tab updates to re-inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // Content script will be auto-injected via manifest,
    // but we can notify side panel about potential state reset
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      payload: { tabId },
    }).catch(() => {
      // Side panel might not be open
    });
  }
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Notify side panel about tab change
  chrome.runtime.sendMessage({
    type: 'TAB_ACTIVATED',
    payload: { tabId: activeInfo.tabId },
  }).catch(() => {
    // Side panel might not be open
  });
});

// ============================================================================
// Extension Install/Update
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[UI Inspector] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Could show welcome page or instructions
    console.log('[UI Inspector] First install - welcome!');
  }
});

// ============================================================================
// AI Credential Management (B-002)
// ============================================================================

/**
 * Save AI credentials to chrome.storage.local.
 * Per Phase 4 contract: stored encrypted at rest by the browser.
 */
export async function saveAICredentials(credentials: AICredentials): Promise<void> {
  try {
    await chrome.storage.local.set({
      [AI_STORAGE_KEYS.CREDENTIALS]: credentials,
    });
    console.log('[UI Inspector] AI credentials saved');
  } catch (error) {
    console.error('[UI Inspector] Failed to save AI credentials:', error);
    throw error;
  }
}

/**
 * Get stored AI credentials from chrome.storage.local.
 * Returns null if no credentials are stored.
 */
export async function getAICredentials(): Promise<AICredentials | null> {
  try {
    const result = await chrome.storage.local.get(AI_STORAGE_KEYS.CREDENTIALS);
    return result[AI_STORAGE_KEYS.CREDENTIALS] || null;
  } catch (error) {
    console.error('[UI Inspector] Failed to get AI credentials:', error);
    return null;
  }
}

/**
 * Clear AI credentials from chrome.storage.local.
 * Per Phase 4 contract: revocation deletes credentials from storage.
 */
export async function clearAICredentials(): Promise<void> {
  try {
    await chrome.storage.local.remove(AI_STORAGE_KEYS.CREDENTIALS);
    console.log('[UI Inspector] AI credentials cleared');
  } catch (error) {
    console.error('[UI Inspector] Failed to clear AI credentials:', error);
    throw error;
  }
}

/**
 * Mark AI credentials as invalid (e.g., after 401 response).
 * Per Phase 4 contract: credentials are not auto-cleared, user must re-enter.
 */
export async function markAICredentialsInvalid(): Promise<void> {
  try {
    const credentials = await getAICredentials();
    if (credentials) {
      await saveAICredentials({
        ...credentials,
        isInvalid: true,
      });
      console.log('[UI Inspector] AI credentials marked as invalid');
    }
  } catch (error) {
    console.error('[UI Inspector] Failed to mark AI credentials invalid:', error);
    throw error;
  }
}

/**
 * Check if AI credentials are configured and valid.
 */
export async function hasValidAICredentials(): Promise<boolean> {
  const credentials = await getAICredentials();
  return credentials !== null && !credentials.isInvalid;
}

console.log('[UI Inspector] Service worker loaded');
