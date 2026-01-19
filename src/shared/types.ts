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
}

export interface ComputedStylesSnapshot {
  display: string;
  justifyContent: string;
  alignItems: string;
  gap: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  opacity: string;
  borderRadius: string;
  backgroundColor: string;
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
  
  // Connection
  PING = 'PING',
  PONG = 'PONG',
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
  | PongMessage;

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
