/**
 * Overlay Module
 * 
 * Handles the visual overlay for element highlighting during picker mode.
 * Creates a non-interactive overlay that shows a blue border around hovered elements.
 */

const OVERLAY_ID = '__ui_inspector_overlay__';
const SELECTED_OVERLAY_ID = '__ui_inspector_selected_overlay__';

interface OverlayState {
  hoverOverlay: HTMLElement | null;
  selectedOverlay: HTMLElement | null;
}

const state: OverlayState = {
  hoverOverlay: null,
  selectedOverlay: null,
};

/**
 * Create and inject the overlay element into the DOM.
 */
function createOverlayElement(id: string, color: string): HTMLElement {
  const existing = document.getElementById(id);
  if (existing) {
    return existing;
  }

  const overlay = document.createElement('div');
  overlay.id = id;
  
  // Use inline styles to avoid conflicts with page styles
  Object.assign(overlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647', // Maximum z-index
    border: `2px solid ${color}`,
    borderRadius: '2px',
    backgroundColor: `${color}20`, // 12% opacity fill
    boxSizing: 'border-box',
    display: 'none',
    transition: 'all 0.05s ease-out',
  });

  // Inject into document
  document.documentElement.appendChild(overlay);
  
  return overlay;
}

/**
 * Initialize the overlay system.
 */
export function initOverlay(): void {
  state.hoverOverlay = createOverlayElement(OVERLAY_ID, '#3b82f6'); // Blue
  state.selectedOverlay = createOverlayElement(SELECTED_OVERLAY_ID, '#10b981'); // Green
}

/**
 * Show the hover overlay on a specific element.
 */
export function showHoverOverlay(rect: DOMRect): void {
  if (!state.hoverOverlay) {
    initOverlay();
  }
  
  const overlay = state.hoverOverlay!;
  
  Object.assign(overlay.style, {
    display: 'block',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
}

/**
 * Hide the hover overlay.
 */
export function hideHoverOverlay(): void {
  if (state.hoverOverlay) {
    state.hoverOverlay.style.display = 'none';
  }
}

/**
 * Show the selected element overlay.
 */
export function showSelectedOverlay(rect: DOMRect): void {
  if (!state.selectedOverlay) {
    initOverlay();
  }
  
  const overlay = state.selectedOverlay!;
  
  Object.assign(overlay.style, {
    display: 'block',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
}

/**
 * Hide the selected element overlay.
 */
export function hideSelectedOverlay(): void {
  if (state.selectedOverlay) {
    state.selectedOverlay.style.display = 'none';
  }
}

/**
 * Update the selected overlay position (e.g., after DOM changes).
 */
export function updateSelectedOverlay(element: Element): void {
  const rect = element.getBoundingClientRect();
  showSelectedOverlay(rect);
}

/**
 * Clean up all overlays.
 */
export function destroyOverlays(): void {
  if (state.hoverOverlay) {
    state.hoverOverlay.remove();
    state.hoverOverlay = null;
  }
  if (state.selectedOverlay) {
    state.selectedOverlay.remove();
    state.selectedOverlay = null;
  }
}
