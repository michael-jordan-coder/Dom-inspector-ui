/**
 * AI Module Types
 * 
 * Types for AI connection and execution per Phase 4 contract.
 */

// ============================================================================
// AI Connection States (Phase 4)
// ============================================================================

/**
 * AI Connection State Machine States
 * The system must be in exactly one of these states at any time during an AI flow.
 */
export type AIConnectionState =
  | 'DISCONNECTED'      // No credentials configured, or credentials revoked
  | 'CONNECTED_IDLE'    // Credentials valid, no AI action in progress
  | 'READY'             // User initiated action, gates passed, payload assembled
  | 'GENERATING'        // AI call in progress
  | 'REVIEW_REQUIRED'   // AI response received, awaiting user review
  | 'CONFIRMED'         // User confirmed output
  | 'ABORTED'           // User aborted during GENERATING
  | 'FAILED';           // Gate failed, AI error, or validation failed

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic';

/**
 * AI credentials stored in chrome.storage.local
 */
export interface AICredentials {
  /** AI provider */
  provider: AIProvider;
  /** API key (stored encrypted by browser) */
  apiKey: string;
  /** Model to use (e.g., 'gpt-4', 'claude-3-opus') */
  model?: string;
  /** Custom API base URL (for proxies) */
  baseUrl?: string;
  /** When credentials were last validated */
  lastValidated?: string;
  /** Whether credentials are marked as invalid */
  isInvalid?: boolean;
}

/**
 * Gate check result
 */
export interface GateCheckResult {
  passed: boolean;
  gate: GateName;
  message?: string;
}

/**
 * Safe-Run Gate names (Phase 4)
 */
export type GateName =
  | 'EXPORT_SCHEMA_VALID'      // Gate 1: Export conforms to schema
  | 'PATCHES_EXIST'            // Gate 2: patches.length > 0
  | 'STABILITY_ACKNOWLEDGED'   // Gate 3: User ack for low confidence
  | 'MODE_COMPATIBLE'          // Gate 4: Repo-connected requires context
  | 'CREDENTIALS_VALID'        // Gate 5: Credentials exist and not invalid
  | 'NO_CONCURRENT_EXECUTION'; // Gate 6: Not already generating

/**
 * AI execution mode
 */
export type AIMode = 'universal' | 'repo-connected';

/**
 * AI execution context
 */
export interface AIExecutionContext {
  mode: AIMode;
  exportPayload: unknown; // VisualUIInspectorExport
  userNotes?: string;
  repoContext?: RepoContext;
  stabilityAcknowledged: boolean;
}

/**
 * Repository context for Repo-Connected Mode (Phase 5)
 */
export interface RepoContext {
  /** Root path of the repository */
  rootPath: string;
  /** Available file paths */
  filePaths: string[];
  /** Source map data if available */
  sourceMap?: SourceMapData;
  /** Detected styling system */
  stylingSystem?: StylingSystem;
}

/**
 * Source map data
 */
export interface SourceMapData {
  mappings: Record<string, SourceLocation>;
}

/**
 * Source location
 */
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * Detected styling system
 */
export type StylingSystem =
  | 'css-modules'
  | 'tailwind'
  | 'styled-components'
  | 'emotion'
  | 'vanilla-css'
  | 'unknown';

/**
 * AI response structure (matches Phase 3 Output Contract)
 */
export interface AIResponse {
  /** Raw response text */
  raw: string;
  /** Parsed sections */
  sections: {
    summary?: string;
    implementationGuidance?: string;
    selectorDetails?: string;
    warnings?: string;
    verificationSteps?: string;
    refusalNotice?: string;
  };
  /** Whether this is a refusal */
  isRefusal: boolean;
  /** Validation result */
  isValid: boolean;
  /** Validation errors if any */
  validationErrors?: string[];
}

/**
 * AI execution result
 */
export interface AIExecutionResult {
  success: boolean;
  response?: AIResponse;
  error?: AIExecutionError;
}

/**
 * AI execution error
 */
export interface AIExecutionError {
  code: AIErrorCode;
  message: string;
  details?: unknown;
}

/**
 * AI error codes
 */
export type AIErrorCode =
  | 'GATE_FAILED'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'        // 401
  | 'RATE_LIMIT'        // 429
  | 'SERVER_ERROR'      // 5xx
  | 'TIMEOUT'
  | 'RESPONSE_INVALID'
  | 'ABORTED';

// ============================================================================
// Storage Keys
// ============================================================================

export const AI_STORAGE_KEYS = {
  CREDENTIALS: 'ai_credentials',
  LAST_PROVIDER: 'ai_last_provider',
} as const;
