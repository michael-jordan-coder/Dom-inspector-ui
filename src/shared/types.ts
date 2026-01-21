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
// Export Schema v1 (Phase 2 Contract)
// ============================================================================

/** Current export schema version */
export const EXPORT_SCHEMA_VERSION = '1.0.0' as const;

/**
 * Selector confidence level indicating reliability of the selector.
 * - high: Unique ID or highly specific, stable attributes. Unlikely to break.
 * - medium: Class names or tag combinations. May break if CSS/HTML is refactored.
 * - low: Positional or structural matching. Likely to break.
 */
export type SelectorConfidence = 'high' | 'medium' | 'low';

/**
 * Warning codes that indicate potential issues with the export.
 * AI consumers MUST NOT ignore warnings.
 */
export type ExportWarningCode =
  | 'SELECTOR_POSITIONAL'      // Selector uses :nth-child, :first-child, etc.
  | 'SELECTOR_NO_ID'           // No ID was available on the element
  | 'MULTIPLE_ELEMENTS_MATCHED' // Selector matched more than one element
  | 'ELEMENT_NOT_FOUND'        // Element could not be re-queried at export time
  | 'VIEWPORT_MISMATCH'        // Captured viewport differs from common breakpoints
  | 'IDENTITY_MISMATCH';       // Element identity doesn't match patch identity tokens

/**
 * Warning object attached to exports. Machine-readable codes with human messages.
 */
export interface ExportWarning {
  /** Machine-readable warning code */
  code: ExportWarningCode;
  /** Human-readable warning message */
  message: string;
  /** Selectors affected by this warning (if applicable) */
  affectedSelectors?: string[];
}

/**
 * FinalPatch - The atomic unit of trust in the system.
 * Represents a single, intentional visual change to a single CSS property
 * on a single element. Conforms to Export Schema v1.
 */
export interface FinalPatch {
  /** CSS selector used to identify the target element at export time */
  selector: string;
  /** CSS property name (e.g., margin-top, background-color) */
  property: string;
  /** Computed value of the property BEFORE any changes. null if not captured. */
  originalValue: string | null;
  /** User's final intended value for the property */
  finalValue: string;
  /** Signal indicating the reliability of the selector */
  selectorConfidence: SelectorConfidence;
  /** ISO 8601 timestamp of when the FinalPatch was frozen for export */
  capturedAt: string;
}

/**
 * Viewport dimensions at capture time.
 */
export interface Viewport {
  width: number;
  height: number;
}

/**
 * VisualUIInspectorExport - Export Schema v1
 * The canonical JSON schema for all exports from Visual UI Inspector.
 * This is the ONLY allowed interface between the tool and any external consumer.
 */
export interface VisualUIInspectorExport {
  /** Schema version. Consumers must check this before parsing. */
  exportVersion: typeof EXPORT_SCHEMA_VERSION;
  /** ISO 8601 timestamp of when this export was generated */
  capturedAt: string;
  /** URL of the page where changes were made */
  pageUrl: string;
  /** Viewport dimensions at capture time */
  viewport: Viewport;
  /** List of FinalPatches representing all visual changes */
  patches: FinalPatch[];
  /** Human-readable warnings about this export. Consumers should surface these. */
  warnings: ExportWarning[];
}

// ============================================================================
// Internal Types (used during processing)
// ============================================================================

/**
 * Style patch with required identity token for internal processing.
 * Used during export generation before converting to FinalPatch.
 */
export interface HandoffStylePatch extends Omit<StylePatch, 'identityToken'> {
  /** Required identity token for element verification */
  identityToken: ElementIdentity;
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
  payload: VisualUIInspectorExport | null;
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
