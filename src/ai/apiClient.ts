/**
 * AI API Client
 * 
 * Executes actual API calls to AI providers (OpenAI, Anthropic).
 * Per Phase 4 contract:
 * - Credentials transmitted directly to provider (no intermediary)
 * - Supports abort for cancellation
 * - Returns structured response matching Output Contract
 */

import type {
  AICredentials,
  AIProvider,
  AIResponse,
  AIExecutionError,
  AIErrorCode,
} from './types';

// ============================================================================
// API Endpoints
// ============================================================================

const API_ENDPOINTS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
};

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4.1',
  anthropic: 'claude-3.5-opus',
};

// ============================================================================
// Request Building
// ============================================================================

interface AIRequestOptions {
  credentials: AICredentials;
  systemPrompt: string;
  userMessage: string;
  abortSignal?: AbortSignal;
}

function buildOpenAIRequest(options: AIRequestOptions): RequestInit {
  const { credentials, systemPrompt, userMessage } = options;

  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${credentials.apiKey}`,
    },
    body: JSON.stringify({
      model: credentials.model || DEFAULT_MODELS.openai,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal: options.abortSignal,
  };
}

function buildAnthropicRequest(options: AIRequestOptions): RequestInit {
  const { credentials, systemPrompt, userMessage } = options;

  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': credentials.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: credentials.model || DEFAULT_MODELS.anthropic,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
    }),
    signal: options.abortSignal,
  };
}

// ============================================================================
// Response Parsing
// ============================================================================

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

interface AnthropicResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  error?: {
    message: string;
  };
}

function extractOpenAIContent(response: OpenAIResponse): string {
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.choices?.[0]?.message?.content || '';
}

function extractAnthropicContent(response: AnthropicResponse): string {
  if (response.error) {
    throw new Error(response.error.message);
  }
  const textBlock = response.content?.find(c => c.type === 'text');
  return textBlock?.text || '';
}

// ============================================================================
// Response Validation (Phase 3 Output Contract)
// ============================================================================

function parseAIResponse(raw: string): AIResponse {
  const sections = {
    summary: extractSection(raw, 'Summary'),
    implementationGuidance: extractSection(raw, 'Implementation Guidance') ||
      extractSection(raw, 'Implementation'),
    selectorDetails: extractSection(raw, 'Selector Details') ||
      extractSection(raw, 'Selectors'),
    warnings: extractSection(raw, 'Warnings'),
    verificationSteps: extractSection(raw, 'Verification Steps') ||
      extractSection(raw, 'Verification'),
    refusalNotice: extractSection(raw, 'Unable to Proceed') ||
      extractSection(raw, 'Refusal'),
  };

  // Check if this is a refusal
  const isRefusal = !!sections.refusalNotice ||
    raw.toLowerCase().includes('cannot proceed') ||
    raw.toLowerCase().includes('unable to proceed');

  // Validate required sections (unless refusal)
  const validationErrors: string[] = [];
  if (!isRefusal) {
    if (!sections.summary && !sections.implementationGuidance) {
      validationErrors.push('Missing Summary or Implementation Guidance section');
    }
  }

  return {
    raw,
    sections,
    isRefusal,
    isValid: validationErrors.length === 0,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  };
}

function extractSection(text: string, sectionName: string): string | undefined {
  // Try to find section with ## or ** markers
  const patterns = [
    new RegExp(`##\\s*${sectionName}[\\s\\S]*?(?=##|$)`, 'i'),
    new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*|##|$)`, 'i'),
    new RegExp(`${sectionName}:[\\s]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0]?.replace(/^##\s*\w+\s*/, '').trim();
    }
  }

  return undefined;
}

// ============================================================================
// Error Handling
// ============================================================================

function mapHttpError(status: number, message?: string): AIExecutionError {
  const errorMap: Record<number, { code: AIErrorCode; message: string }> = {
    401: { code: 'AUTH_ERROR', message: 'Invalid API key. Please check your credentials.' },
    403: { code: 'AUTH_ERROR', message: 'Access denied. Check API key permissions.' },
    429: { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please wait and try again.' },
    500: { code: 'SERVER_ERROR', message: 'AI provider server error. Please try again.' },
    502: { code: 'SERVER_ERROR', message: 'AI provider unavailable. Please try again.' },
    503: { code: 'SERVER_ERROR', message: 'AI provider temporarily unavailable.' },
  };

  const mapped = errorMap[status];
  if (mapped) {
    return { ...mapped, details: { status, originalMessage: message } };
  }

  return {
    code: 'NETWORK_ERROR',
    message: message || `Request failed with status ${status}`,
    details: { status },
  };
}

// ============================================================================
// Main API Call Function
// ============================================================================

export interface CallAIOptions {
  credentials: AICredentials;
  systemPrompt: string;
  userMessage: string;
  abortSignal?: AbortSignal;
  timeoutMs?: number;
}

export interface CallAIResult {
  success: boolean;
  response?: AIResponse;
  error?: AIExecutionError;
}

/**
 * Execute an AI API call.
 * 
 * @param options - Call options including credentials and prompts
 * @returns Promise resolving to CallAIResult
 */
export async function callAI(options: CallAIOptions): Promise<CallAIResult> {
  const { credentials, systemPrompt, userMessage, abortSignal, timeoutMs = 60000 } = options;
  const provider = credentials.provider;
  const endpoint = credentials.baseUrl || API_ENDPOINTS[provider];

  // Create timeout abort if not provided
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Combine signals if abort signal provided
  const signal = abortSignal
    ? combineAbortSignals(abortSignal, timeoutController.signal)
    : timeoutController.signal;

  try {
    // Build request based on provider
    const requestInit = provider === 'openai'
      ? buildOpenAIRequest({ credentials, systemPrompt, userMessage, abortSignal: signal })
      : buildAnthropicRequest({ credentials, systemPrompt, userMessage, abortSignal: signal });

    console.log(`[AI] Calling ${provider} API...`);
    console.log(`[AI] Payload size: ${userMessage.length} chars. Preview: ${userMessage.substring(0, 200)}...`);
    const response = await fetch(endpoint, requestInit);

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let errorMessage: string | undefined;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorJson.message;
      } catch {
        errorMessage = errorBody;
      }

      const error = mapHttpError(response.status, errorMessage);
      console.error(`[AI] API error:`, error);
      return { success: false, error };
    }

    // Parse response
    const responseBody = await response.json();
    const content = provider === 'openai'
      ? extractOpenAIContent(responseBody as OpenAIResponse)
      : extractAnthropicContent(responseBody as AnthropicResponse);

    if (!content) {
      return {
        success: false,
        error: {
          code: 'RESPONSE_INVALID',
          message: 'AI returned empty response',
        },
      };
    }

    // Parse and validate response structure
    const aiResponse = parseAIResponse(content);
    console.log(`[AI] Response received, isRefusal: ${aiResponse.isRefusal}`);

    return {
      success: true,
      response: aiResponse,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      // Check if aborted
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'ABORTED',
            message: 'Request was aborted',
          },
        };
      }

      // Network error
      console.error(`[AI] Network error:`, error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Network error: ${error.message}`,
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unknown error occurred',
        details: error,
      },
    };
  }
}

/**
 * Test API credentials by making a minimal call.
 */
export async function testCredentials(credentials: AICredentials): Promise<CallAIResult> {
  return callAI({
    credentials,
    systemPrompt: 'You are a helpful assistant.',
    userMessage: 'Reply with exactly: "OK"',
    timeoutMs: 15000,
  });
}

// ============================================================================
// Helpers
// ============================================================================

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}
