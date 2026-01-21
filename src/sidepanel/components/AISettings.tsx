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
import { colors, spacing, radii } from '../tokens';
import type { AIProvider, AICredentials } from '../../ai/types';
import { AI_STORAGE_KEYS } from '../../ai/types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  } as React.CSSProperties,
  
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  } as React.CSSProperties,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  } as React.CSSProperties,
  statusConnected: {
    backgroundColor: '#22c55e',
  } as React.CSSProperties,
  statusDisconnected: {
    backgroundColor: '#6b7280',
  } as React.CSSProperties,
  statusInvalid: {
    backgroundColor: '#ef4444',
  } as React.CSSProperties,
  statusText: {
    fontSize: '12px',
    color: colors.text,
    flex: 1,
  } as React.CSSProperties,
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  } as React.CSSProperties,
  
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  } as React.CSSProperties,
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  input: {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    color: colors.text,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  } as React.CSSProperties,
  inputFocus: {
    borderColor: colors.accent,
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
  } as React.CSSProperties,
  
  select: {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: '13px',
    color: colors.text,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  
  maskedKey: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    color: colors.textMuted,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
  } as React.CSSProperties,
  
  buttonRow: {
    display: 'flex',
    gap: spacing[2],
  } as React.CSSProperties,
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: `8px ${spacing[3]}`,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: colors.accent,
    color: '#fff',
  } as React.CSSProperties,
  buttonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#fca5a5',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  
  hint: {
    fontSize: '11px',
    color: colors.textMuted,
    lineHeight: 1.4,
  } as React.CSSProperties,
  
  error: {
    fontSize: '12px',
    color: '#fca5a5',
    padding: spacing[2],
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radii.md,
  } as React.CSSProperties,
  
  success: {
    fontSize: '12px',
    color: '#86efac',
    padding: spacing[2],
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: radii.md,
  } as React.CSSProperties,
};

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
      <div style={styles.container}>
        {/* Status indicator */}
        <div style={styles.statusRow}>
          <div
            style={{
              ...styles.statusDot,
              ...(status === 'connected' ? styles.statusConnected : {}),
              ...(status === 'disconnected' ? styles.statusDisconnected : {}),
              ...(status === 'invalid' ? styles.statusInvalid : {}),
            }}
          />
          <span style={styles.statusText}>{statusLabel}</span>
          {credentials && !isEditing && (
            <button
              style={{ ...styles.button, flex: 'none', padding: `4px ${spacing[2]}` }}
              onClick={startEditing}
            >
              <AppIcon name="settings" size={14} />
            </button>
          )}
        </div>
        
        {/* Error message */}
        {error && <div style={styles.error}>{error}</div>}
        
        {/* Success message */}
        {success && <div style={styles.success}>{success}</div>}
        
        {/* Configured state (not editing) */}
        {credentials && !isEditing && (
          <div style={styles.container}>
            <div style={styles.fieldGroup}>
              <span style={styles.label}>Provider</span>
              <div style={styles.maskedKey}>
                {PROVIDER_OPTIONS.find(p => p.value === credentials.provider)?.label}
              </div>
            </div>
            
            <div style={styles.fieldGroup}>
              <span style={styles.label}>API Key</span>
              <div style={styles.maskedKey}>
                <AppIcon name="eye" size={14} />
                {maskApiKey(credentials.apiKey)}
              </div>
            </div>
            
            {credentials.model && (
              <div style={styles.fieldGroup}>
                <span style={styles.label}>Model</span>
                <div style={styles.maskedKey}>{credentials.model}</div>
              </div>
            )}
            
            <div style={styles.buttonRow}>
              <button
                style={{ ...styles.button, ...styles.buttonDanger }}
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
          <div style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Provider</label>
              <select
                style={styles.select}
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
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>API Key</label>
              <input
                type="password"
                style={styles.input}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                disabled={isLoading}
                autoComplete="off"
              />
              <span style={styles.hint}>
                Your key is stored locally and sent directly to {provider === 'openai' ? 'OpenAI' : 'Anthropic'}. We never see or store it on any server.
              </span>
            </div>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Model (optional)</label>
              <input
                type="text"
                style={styles.input}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_MODELS[provider]}
                disabled={isLoading}
              />
            </div>
            
            <div style={styles.buttonRow}>
              {credentials && (
                <button
                  style={styles.button}
                  onClick={cancelEditing}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              )}
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...(isLoading || !apiKey.trim() ? styles.buttonDisabled : {}),
                }}
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
        <div style={styles.hint}>
          AI features are optional. The extension works fully without AI connection.
          Your credentials are stored in your browser only and never transmitted to us.
        </div>
      </div>
    </Section>
  );
}
