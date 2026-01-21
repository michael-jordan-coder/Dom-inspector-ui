/**
 * AI Settings Component (B-001)
 * 
 * BYOK (Bring Your Own Key) credential entry for AI integration.
 * Per Phase 4 contract:
 * - Credentials stored in chrome.storage.local (encrypted by browser)
 * - Never displayed in full after initial entry (masked)
 * - Transmitted directly to AI provider (no intermediary server)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Section } from '../primitives';
import { AppIcon } from '../primitives/AppIcon';
import type { AIProvider, AICredentials } from '../../ai/types';
import { AI_STORAGE_KEYS } from '../../ai/types';


// ============================================================================
// Styles
// ============================================================================

import './components.css';




// ============================================================================
// Helpers
// ============================================================================

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

const PROVIDER_OPTIONS: { value: AIProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
];

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4-turbo-preview',
  anthropic: 'claude-3-opus-20240229',
};

// ============================================================================
// Component
// ============================================================================

interface AISettingsProps {
  onCredentialsChange?: (hasCredentials: boolean) => void;
}

export function AISettings({
  onCredentialsChange,
}: AISettingsProps): React.ReactElement {
  // State
  const [credentials, setCredentials] = useState<AICredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  // Load credentials on mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await chrome.storage.local.get(AI_STORAGE_KEYS.CREDENTIALS);
      const stored = result[AI_STORAGE_KEYS.CREDENTIALS] as AICredentials | undefined;
      setCredentials(stored || null);
      onCredentialsChange?.(!!stored && !stored.isInvalid);
    } catch (e) {
      console.error('Failed to load AI credentials:', e);
    } finally {
      setIsLoading(false);
    }
  }, [onCredentialsChange]);

  const saveCredentials = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const newCredentials: AICredentials = {
        provider,
        apiKey: apiKey.trim(),
        model: model.trim() || DEFAULT_MODELS[provider],
        lastValidated: new Date().toISOString(),
        isInvalid: false,
      };

      await chrome.storage.local.set({
        [AI_STORAGE_KEYS.CREDENTIALS]: newCredentials,
      });

      setCredentials(newCredentials);
      setIsEditing(false);
      setApiKey('');
      setSuccess('Credentials saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      onCredentialsChange?.(true);
    } catch (e) {
      console.error('Failed to save AI credentials:', e);
      setError('Failed to save credentials');
    } finally {
      setIsLoading(false);
    }
  }, [provider, apiKey, model, onCredentialsChange]);

  const clearCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      await chrome.storage.local.remove(AI_STORAGE_KEYS.CREDENTIALS);
      setCredentials(null);
      setIsEditing(false);
      setSuccess('Credentials cleared');
      setTimeout(() => setSuccess(null), 3000);
      onCredentialsChange?.(false);
    } catch (e) {
      console.error('Failed to clear AI credentials:', e);
      setError('Failed to clear credentials');
    } finally {
      setIsLoading(false);
    }
  }, [onCredentialsChange]);

  const startEditing = useCallback(() => {
    if (credentials) {
      setProvider(credentials.provider);
      setModel(credentials.model || '');
    }
    setApiKey('');
    setIsEditing(true);
    setError(null);
  }, [credentials]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setApiKey('');
    setError(null);
  }, []);

  // Connection status
  const status = !credentials
    ? 'disconnected'
    : credentials.isInvalid
      ? 'invalid'
      : 'connected';

  const statusLabel = {
    disconnected: 'Not configured',
    invalid: 'Invalid credentials',
    connected: 'Connected',
  }[status];

  return (
    <Section
      id="ai-settings"
      title="AI Connection"
      collapsible
      defaultCollapsed={!!credentials && !credentials.isInvalid}
    >
      <div className="ai-settings-container">
        {/* Status indicator */}
        <div className="ai-settings-status-row">
          <div
            className={`ai-settings-status-dot ${status === 'connected' ? 'is-connected' :
              status === 'disconnected' ? 'is-disconnected' :
                status === 'invalid' ? 'is-invalid' : ''
              }`}
          />
          <span className="ai-settings-status-text">{statusLabel}</span>
          {credentials && !isEditing && (
            <button
              className="ai-settings-button ai-settings-edit-button"
              onClick={startEditing}
            >
              <AppIcon name="settings" size={14} />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && <div className="ai-settings-error">{error}</div>}

        {/* Success message */}
        {success && <div className="ai-settings-success">{success}</div>}

        {/* Configured state (not editing) */}
        {credentials && !isEditing && (
          <div className="ai-settings-container">
            <div className="ai-settings-field-group">
              <span className="ai-settings-label">Provider</span>
              <div className="ai-settings-masked-key">
                {PROVIDER_OPTIONS.find(p => p.value === credentials.provider)?.label}
              </div>
            </div>

            <div className="ai-settings-field-group">
              <span className="ai-settings-label">API Key</span>
              <div className="ai-settings-masked-key">
                <AppIcon name="eye" size={14} />
                {maskApiKey(credentials.apiKey)}
              </div>
            </div>

            {credentials.model && (
              <div className="ai-settings-field-group">
                <span className="ai-settings-label">Model</span>
                <div className="ai-settings-masked-key">{credentials.model}</div>
              </div>
            )}

            <div className="ai-settings-button-row">
              <button
                className="ai-settings-button is-danger"
                onClick={clearCredentials}
                disabled={isLoading}
              >
                <AppIcon name="close" size={14} />
                Clear Credentials
              </button>
            </div>
          </div>
        )}

        {/* Edit/Add form */}
        {(isEditing || !credentials) && (
          <div className="ai-settings-form">
            <div className="ai-settings-field-group">
              <label className="ai-settings-label">Provider</label>
              <select
                className="ai-settings-select"
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                disabled={isLoading}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ai-settings-field-group">
              <label className="ai-settings-label">API Key</label>
              <input
                type="password"
                className="ai-settings-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                disabled={isLoading}
                autoComplete="off"
              />
              <span className="ai-settings-hint">
                Your key is stored locally and sent directly to {provider === 'openai' ? 'OpenAI' : 'Anthropic'}. We never see or store it on any server.
              </span>
            </div>

            <div className="ai-settings-field-group">
              <label className="ai-settings-label">Model (optional)</label>
              <input
                type="text"
                className="ai-settings-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_MODELS[provider]}
                disabled={isLoading}
              />
            </div>

            <div className="ai-settings-button-row">
              {credentials && (
                <button
                  className="ai-settings-button"
                  onClick={cancelEditing}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              )}
              <button
                className="ai-settings-button is-primary"
                onClick={saveCredentials}
                disabled={isLoading || !apiKey.trim()}
              >
                <AppIcon name="check" size={14} />
                {credentials ? 'Update' : 'Save'} Credentials
              </button>
            </div>
          </div>
        )}

        {/* Privacy notice */}
        <div className="ai-settings-hint">
          AI features are optional. The extension works fully without AI connection.
          Your credentials are stored in your browser only and never transmitted to us.
        </div>
      </div>
    </Section>
  );

}
