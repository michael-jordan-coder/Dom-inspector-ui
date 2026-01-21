/**
 * Overlay Module
 * 
 * Handles the visual overlay for element highlighting during picker mode.
 * Creates a non-interactive overlay that shows a blue border around hovered elements.
 * Also supports spacing visualization (padding/margin guides).
 */

const OVERLAY_ID = '__ui_inspector_overlay__';
const SELECTED_OVERLAY_ID = '__ui_inspector_selected_overlay__';
const PADDING_OVERLAY_ID = '__ui_inspector_padding_overlay__';
const MARGIN_OVERLAY_ID = '__ui_inspector_margin_overlay__';
const SPACING_LABEL_ID = '__ui_inspector_spacing_label__';

interface OverlayState {
  hoverOverlay: HTMLElement | null;
  selectedOverlay: HTMLElement | null;
  paddingOverlay: HTMLElement | null;
  marginOverlay: HTMLElement | null;
  spacingLabel: HTMLElement | null;
  spacingVisualizationEnabled: boolean;
  currentElement: Element | null;
}

const state: OverlayState = {
  hoverOverlay: null,
  selectedOverlay: null,
  paddingOverlay: null,
  marginOverlay: null,
  spacingLabel: null,
  spacingVisualizationEnabled: false,
  currentElement: null,
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
 * Create a spacing overlay (for padding or margin visualization)
 */
function createSpacingOverlay(id: string, color: string, dashed = false): HTMLElement {
  const existing = document.getElementById(id);
  if (existing) {
    return existing;
  }

  const overlay = document.createElement('div');
  overlay.id = id;
  
  Object.assign(overlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483646',
    border: dashed ? `1px dashed ${color}` : 'none',
    backgroundColor: `${color}15`, // 8% opacity
    boxSizing: 'border-box',
    display: 'none',
    transition: 'all 0.1s ease-out',
  });

  document.documentElement.appendChild(overlay);
  return overlay;
}

/**
 * Create a label element for showing dimension values
 */
function createSpacingLabel(): HTMLElement {
  const existing = document.getElementById(SPACING_LABEL_ID);
  if (existing) {
    return existing;
  }

  const label = document.createElement('div');
  label.id = SPACING_LABEL_ID;
  
  Object.assign(label.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    padding: '2px 6px',
    fontSize: '10px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: '3px',
    display: 'none',
    whiteSpace: 'nowrap',
  });

  document.documentElement.appendChild(label);
  return label;
}

/**
 * Initialize the overlay system.
 */
export function initOverlay(): void {
  state.hoverOverlay = createOverlayElement(OVERLAY_ID, '#3b82f6'); // Blue
  state.selectedOverlay = createOverlayElement(SELECTED_OVERLAY_ID, '#10b981'); // Green
  state.paddingOverlay = createSpacingOverlay(PADDING_OVERLAY_ID, '#3b82f6'); // Blue for padding
  state.marginOverlay = createSpacingOverlay(MARGIN_OVERLAY_ID, '#f97316', true); // Orange dashed for margin
  state.spacingLabel = createSpacingLabel();
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
  
  state.currentElement = element;
  
  // Update spacing visualization if enabled
  if (state.spacingVisualizationEnabled) {
    showSpacingVisualization(element);
  }
}

/**
 * Toggle spacing visualization for the current element.
 */
export function toggleSpacingVisualization(enabled: boolean): void {
  state.spacingVisualizationEnabled = enabled;
  
  if (enabled && state.currentElement) {
    showSpacingVisualization(state.currentElement);
  } else {
    hideSpacingVisualization();
  }
}

/**
 * Show padding and margin visualization for an element.
 */
export function showSpacingVisualization(element: Element): void {
  if (!state.paddingOverlay || !state.marginOverlay) {
    initOverlay();
  }

  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  
  // Parse padding values
  const paddingTop = parseFloat(computed.paddingTop) || 0;
  const paddingRight = parseFloat(computed.paddingRight) || 0;
  const paddingBottom = parseFloat(computed.paddingBottom) || 0;
  const paddingLeft = parseFloat(computed.paddingLeft) || 0;
  
  // Parse margin values
  const marginTop = parseFloat(computed.marginTop) || 0;
  const marginRight = parseFloat(computed.marginRight) || 0;
  const marginBottom = parseFloat(computed.marginBottom) || 0;
  const marginLeft = parseFloat(computed.marginLeft) || 0;

  // Show padding overlay (inner rectangle)
  const paddingOverlay = state.paddingOverlay!;
  if (paddingTop > 0 || paddingRight > 0 || paddingBottom > 0 || paddingLeft > 0) {
    Object.assign(paddingOverlay.style, {
      display: 'block',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderTop: paddingTop > 0 ? `${paddingTop}px solid rgba(59, 130, 246, 0.25)` : 'none',
      borderRight: paddingRight > 0 ? `${paddingRight}px solid rgba(59, 130, 246, 0.25)` : 'none',
      borderBottom: paddingBottom > 0 ? `${paddingBottom}px solid rgba(59, 130, 246, 0.25)` : 'none',
      borderLeft: paddingLeft > 0 ? `${paddingLeft}px solid rgba(59, 130, 246, 0.25)` : 'none',
      backgroundColor: 'transparent',
    });
  } else {
    paddingOverlay.style.display = 'none';
  }

  // Show margin overlay (outer rectangle)
  const marginOverlay = state.marginOverlay!;
  if (marginTop > 0 || marginRight > 0 || marginBottom > 0 || marginLeft > 0) {
    Object.assign(marginOverlay.style, {
      display: 'block',
      top: `${rect.top - marginTop}px`,
      left: `${rect.left - marginLeft}px`,
      width: `${rect.width + marginLeft + marginRight}px`,
      height: `${rect.height + marginTop + marginBottom}px`,
      borderTop: marginTop > 0 ? `${marginTop}px solid rgba(249, 115, 22, 0.3)` : '1px dashed rgba(249, 115, 22, 0.5)',
      borderRight: marginRight > 0 ? `${marginRight}px solid rgba(249, 115, 22, 0.3)` : '1px dashed rgba(249, 115, 22, 0.5)',
      borderBottom: marginBottom > 0 ? `${marginBottom}px solid rgba(249, 115, 22, 0.3)` : '1px dashed rgba(249, 115, 22, 0.5)',
      borderLeft: marginLeft > 0 ? `${marginLeft}px solid rgba(249, 115, 22, 0.3)` : '1px dashed rgba(249, 115, 22, 0.5)',
      backgroundColor: 'transparent',
    });
  } else {
    marginOverlay.style.display = 'none';
  }

  // Update spacing label
  updateSpacingLabel(rect, {
    paddingTop, paddingRight, paddingBottom, paddingLeft,
    marginTop, marginRight, marginBottom, marginLeft,
  });
}

/**
 * Update the spacing label with dimension values.
 */
function updateSpacingLabel(
  rect: DOMRect,
  spacing: {
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
  }
): void {
  const label = state.spacingLabel;
  if (!label) return;

  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = spacing;
  const { marginTop, marginRight, marginBottom, marginLeft } = spacing;

  // Format spacing info
  const paddingText = `P: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}`;
  const marginText = `M: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft}`;
  
  label.textContent = `${paddingText} | ${marginText}`;
  
  // Position label above the element
  const labelLeft = rect.left;
  const labelTop = Math.max(rect.top - 24, 4);
  
  Object.assign(label.style, {
    display: 'block',
    left: `${labelLeft}px`,
    top: `${labelTop}px`,
  });
}

/**
 * Hide spacing visualization.
 */
export function hideSpacingVisualization(): void {
  if (state.paddingOverlay) {
    state.paddingOverlay.style.display = 'none';
  }
  if (state.marginOverlay) {
    state.marginOverlay.style.display = 'none';
  }
  if (state.spacingLabel) {
    state.spacingLabel.style.display = 'none';
  }
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
  if (state.paddingOverlay) {
    state.paddingOverlay.remove();
    state.paddingOverlay = null;
  }
  if (state.marginOverlay) {
    state.marginOverlay.remove();
    state.marginOverlay = null;
  }
  if (state.spacingLabel) {
    state.spacingLabel.remove();
    state.spacingLabel = null;
  }
  state.currentElement = null;
  state.spacingVisualizationEnabled = false;
}
