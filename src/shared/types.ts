/**
 * Shared types for the UI Inspector Chrome Extension.
 * All message types and data structures used across content script,
 * service worker, and side panel.
 */

// ============================================================================
// Element Data
// ============================================================================

export interface ElementMetadata {
  tagName: string;
  id: string | null;
  classList: string[];
  role: string | null;
  ariaLabel: string | null;
  textPreview: string;
  selector: string;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyles: ComputedStylesSnapshot;
  /** Base64-encoded screenshot of the element (data URL) */
  screenshot?: string;
  /** Element hierarchy info (populated when selected) */
  hierarchy?: ElementHierarchy;
}

// ============================================================================
// Element Hierarchy
// ============================================================================

export interface ElementHierarchy {
  /** Parent element summary (null if at body/root) */
  parent: ElementSummary | null;
  /** Direct children of current element */
  children: ElementSummary[];
  /** Breadcrumb path from body to current element */
  breadcrumb: BreadcrumbItem[];
  /** Index among siblings (0-based) */
  siblingIndex: number;
  /** Total number of siblings including self */
  siblingCount: number;
}

export interface ElementSummary {
  /** Unique selector for this element */
  selector: string;
  /** Tag name (div, span, p, etc.) */
  tagName: string;
  /** Human-readable label (e.g., "div.card" or "span#title") */
  label: string;
  /** Text content preview (first ~40 chars of direct text) */
  textPreview?: string;
  /** Number of child elements */
  childCount: number;
}

export interface BreadcrumbItem {
  /** Selector to navigate to this element */
  selector: string;
  /** Human-readable label */
  label: string;
}

export interface ComputedStylesSnapshot {
  // Layout
  display: string;
  justifyContent: string;
  alignItems: string;
  gap: string;
  // Dimensions
  width: string;
  height: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  // Spacing
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  // Appearance
  opacity: string;
  borderRadius: string;
  backgroundColor: string;
  color: string;
  borderColor: string;
  // Typography
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  /** Raw style value (preserves var() references) */
  rawStyles?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
  };
}

// ============================================================================
// Selector Resolution
// ============================================================================

export type SelectorResolutionStatus =
  | 'OK'
  | 'NOT_FOUND'
  | 'AMBIGUOUS'
  | 'INVALID_SELECTOR';

export interface SelectorResolutionResult {
  status: SelectorResolutionStatus;
  element: Element | null;
  matchCount?: number; // For AMBIGUOUS status
  error?: string; // Human-readable error message
}

// ============================================================================
// Element Identity
// ============================================================================

export interface ElementIdentity {
  tagName: string;
  textPreview: string; // First 50 chars of text content
  classList: string;   // Sorted class list as string
  parentTag: string;   // Parent element tag name
}

// ============================================================================
// Style Patch
// ============================================================================

export interface StylePatch {
  selector: string;
  property: keyof CSSStyleDeclaration | string;
  value: string;
  previousValue: string;
  timestamp: number;
  identityToken?: ElementIdentity; // Optional for backwards compat
}

// ============================================================================
// Patch Errors
// ============================================================================

export type PatchErrorCode =
  | 'ELEMENT_NOT_FOUND'
  | 'ELEMENT_AMBIGUOUS'
  | 'IDENTITY_MISMATCH'
  | 'INVALID_SELECTOR';

export interface PatchError {
  code: PatchErrorCode;
  message: string;
  matchCount?: number;
}

// ============================================================================
// Prompt Handoff Export
// ============================================================================

/**
 * Stability signals for selector confidence.
 * Helps the AI coding agent assess targeting reliability.
 */
export interface StabilitySignals {
  /** Result of resolving the selector at export time */
  selectorResolution: {
    /** Resolution status: OK, NOT_FOUND, AMBIGUOUS, or INVALID_SELECTOR */
    status: SelectorResolutionStatus;
    /** Number of elements matching the selector */
    matchCount: number;
  };
  /** Whether the current element identity matches the patch identity tokens */
  identityMatch: boolean;
  /** Whether the selector uses :nth-of-type (position-dependent, fragile) */
  usesNthOfType: boolean;
}

/**
 * Style patch with required identity token for handoff export.
 * Enforces identity token presence for reliable targeting.
 */
export interface HandoffStylePatch extends Omit<StylePatch, 'identityToken'> {
  /** Required identity token for element verification */
  identityToken: ElementIdentity;
}

/**
 * Complete export payload for Prompt Handoff.
 * Contains all information needed for an AI coding agent to implement
 * verified visual changes in source code.
 */
export interface PromptHandoffExport {
  /** Target element with full DOM context */
  selectedElement: ElementMetadata;
  /** Visual changes with before/after values */
  patches: HandoffStylePatch[];
  /** Confidence signals for selector targeting */
  stability: StabilitySignals;
}

// ============================================================================
// Messages
// ============================================================================

export const MESSAGE_VERSION = '1.0.0';

// Message types enum for type safety
export enum MessageType {
  // Picker control
  START_PICK = 'START_PICK',
  STOP_PICK = 'STOP_PICK',
  PICK_CANCELLED = 'PICK_CANCELLED',

  // Element selection
  ELEMENT_SELECTED = 'ELEMENT_SELECTED',
  ELEMENT_HOVERED = 'ELEMENT_HOVERED',
  CLEAR_SELECTION = 'CLEAR_SELECTION',

  // Style manipulation
  APPLY_STYLE_PATCH = 'APPLY_STYLE_PATCH',
  STYLE_PATCH_APPLIED = 'STYLE_PATCH_APPLIED',

  // History
  UNDO = 'UNDO',
  REDO = 'REDO',
  UNDO_APPLIED = 'UNDO_APPLIED',
  REDO_APPLIED = 'REDO_APPLIED',

  // State sync
  GET_CURRENT_STATE = 'GET_CURRENT_STATE',
  CURRENT_STATE = 'CURRENT_STATE',

  // Visualization
  TOGGLE_SPACING_VISUALIZATION = 'TOGGLE_SPACING_VISUALIZATION',

  // Text content
  TEXT_CONTENT_CHANGED = 'TEXT_CONTENT_CHANGED',

  // Hierarchy navigation
  NAVIGATE_TO_PARENT = 'NAVIGATE_TO_PARENT',
  NAVIGATE_TO_CHILD = 'NAVIGATE_TO_CHILD',
  NAVIGATE_TO_SELECTOR = 'NAVIGATE_TO_SELECTOR',
  NAVIGATE_TO_SIBLING = 'NAVIGATE_TO_SIBLING',

  // Connection
  PING = 'PING',
  PONG = 'PONG',

  // Prompt Handoff Export
  GET_EXPORT_DATA = 'GET_EXPORT_DATA',
  EXPORT_DATA = 'EXPORT_DATA',
}

// Base message interface
interface BaseMessage {
  version: typeof MESSAGE_VERSION;
  timestamp: number;
}

// Specific message payloads
export interface StartPickMessage extends BaseMessage {
  type: MessageType.START_PICK;
}

export interface StopPickMessage extends BaseMessage {
  type: MessageType.STOP_PICK;
}

export interface PickCancelledMessage extends BaseMessage {
  type: MessageType.PICK_CANCELLED;
}

export interface ElementSelectedMessage extends BaseMessage {
  type: MessageType.ELEMENT_SELECTED;
  payload: ElementMetadata;
}

export interface ElementHoveredMessage extends BaseMessage {
  type: MessageType.ELEMENT_HOVERED;
  payload: {
    boundingRect: ElementMetadata['boundingRect'];
  } | null;
}

export interface ClearSelectionMessage extends BaseMessage {
  type: MessageType.CLEAR_SELECTION;
}

export interface ApplyStylePatchMessage extends BaseMessage {
  type: MessageType.APPLY_STYLE_PATCH;
  payload: Omit<StylePatch, 'timestamp'>;
}

export interface StylePatchAppliedMessage extends BaseMessage {
  type: MessageType.STYLE_PATCH_APPLIED;
  payload: {
    success: boolean;
    patch: StylePatch;
    updatedStyles: ComputedStylesSnapshot;
  };
}

export interface UndoMessage extends BaseMessage {
  type: MessageType.UNDO;
}

export interface RedoMessage extends BaseMessage {
  type: MessageType.REDO;
}

export interface UndoAppliedMessage extends BaseMessage {
  type: MessageType.UNDO_APPLIED;
  payload: {
    success: boolean;
    patch: StylePatch | null;
    updatedStyles: ComputedStylesSnapshot | null;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export interface RedoAppliedMessage extends BaseMessage {
  type: MessageType.REDO_APPLIED;
  payload: {
    success: boolean;
    patch: StylePatch | null;
    updatedStyles: ComputedStylesSnapshot | null;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export interface GetCurrentStateMessage extends BaseMessage {
  type: MessageType.GET_CURRENT_STATE;
}

export interface CurrentStateMessage extends BaseMessage {
  type: MessageType.CURRENT_STATE;
  payload: {
    isPickerActive: boolean;
    selectedElement: ElementMetadata | null;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export interface PingMessage extends BaseMessage {
  type: MessageType.PING;
}

export interface PongMessage extends BaseMessage {
  type: MessageType.PONG;
}

export interface ToggleSpacingVisualizationMessage extends BaseMessage {
  type: MessageType.TOGGLE_SPACING_VISUALIZATION;
  payload: {
    enabled: boolean;
  };
}

export interface TextContentChangedMessage extends BaseMessage {
  type: MessageType.TEXT_CONTENT_CHANGED;
  payload: {
    selector: string;
    previousText: string;
    newText: string;
  };
}

// Navigation messages
export interface NavigateToParentMessage extends BaseMessage {
  type: MessageType.NAVIGATE_TO_PARENT;
}

export interface NavigateToChildMessage extends BaseMessage {
  type: MessageType.NAVIGATE_TO_CHILD;
  payload: {
    /** Index of the child to navigate to (0-based) */
    index: number;
  };
}

export interface NavigateToSelectorMessage extends BaseMessage {
  type: MessageType.NAVIGATE_TO_SELECTOR;
  payload: {
    /** CSS selector of the element to navigate to */
    selector: string;
  };
}

export interface NavigateToSiblingMessage extends BaseMessage {
  type: MessageType.NAVIGATE_TO_SIBLING;
  payload: {
    /** Direction to navigate */
    direction: 'prev' | 'next';
  };
}

// Prompt Handoff Export messages
export interface GetExportDataMessage extends BaseMessage {
  type: MessageType.GET_EXPORT_DATA;
}

export interface ExportDataMessage extends BaseMessage {
  type: MessageType.EXPORT_DATA;
  payload: PromptHandoffExport | null;
}

// Union type of all messages
export type ExtensionMessage =
  | StartPickMessage
  | StopPickMessage
  | PickCancelledMessage
  | ElementSelectedMessage
  | ElementHoveredMessage
  | ClearSelectionMessage
  | ApplyStylePatchMessage
  | StylePatchAppliedMessage
  | UndoMessage
  | RedoMessage
  | UndoAppliedMessage
  | RedoAppliedMessage
  | GetCurrentStateMessage
  | CurrentStateMessage
  | PingMessage
  | PongMessage
  | ToggleSpacingVisualizationMessage
  | TextContentChangedMessage
  | NavigateToParentMessage
  | NavigateToChildMessage
  | NavigateToSelectorMessage
  | NavigateToSiblingMessage
  | GetExportDataMessage
  | ExportDataMessage;

// ============================================================================
// Utility Functions
// ============================================================================

export function createMessage<T extends ExtensionMessage>(
  type: T['type'],
  payload?: T extends { payload: infer P } ? P : never
): T {
  const base: BaseMessage = {
    version: MESSAGE_VERSION,
    timestamp: Date.now(),
  };

  if (payload !== undefined) {
    return { ...base, type, payload } as T;
  }
  return { ...base, type } as T;
}

// Type guard helpers
export function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'version' in msg &&
    (msg as ExtensionMessage).version === MESSAGE_VERSION
  );
}
