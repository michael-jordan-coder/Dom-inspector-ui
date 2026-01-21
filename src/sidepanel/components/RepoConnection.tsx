/**
 * Repository Connection Component (G-001)
 * 
 * Implements Repo-Connected Mode UI from Phase 5:
 * - Explicit repository connection flow
 * - Connection is intentional and scoped (never automatic)
 * - Displays repository context when connected
 * - Each code-modification action requires its own confirmation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Section } from '../primitives';
import { AppIcon } from '../primitives/AppIcon';
import { colors, spacing, radii } from '../tokens';
import type { RepoContext, StylingSystem } from '../../ai/types';

// ============================================================================
// Storage Keys
// ============================================================================

const REPO_STORAGE_KEY = 'repo_connection';

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
  
  contextDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  } as React.CSSProperties,
  contextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  } as React.CSSProperties,
  contextLabel: {
    color: colors.textMuted,
  } as React.CSSProperties,
  contextValue: {
    color: colors.text,
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    fontSize: '11px',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  
  warning: {
    display: 'flex',
    gap: spacing[2],
    padding: spacing[2],
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: radii.md,
    fontSize: '11px',
    color: '#fcd34d',
    lineHeight: 1.4,
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
// Styling System Options
// ============================================================================

const STYLING_SYSTEMS: { value: StylingSystem; label: string }[] = [
  { value: 'tailwind', label: 'Tailwind CSS' },
  { value: 'css-modules', label: 'CSS Modules' },
  { value: 'styled-components', label: 'styled-components' },
  { value: 'emotion', label: 'Emotion' },
  { value: 'vanilla-css', label: 'Vanilla CSS' },
  { value: 'unknown', label: 'Unknown / Other' },
];

// ============================================================================
// Component Props
// ============================================================================

interface RepoConnectionProps {
  /** Called when repository context changes */
  onContextChange?: (context: RepoContext | null) => void;
}

// ============================================================================
// Component
// ============================================================================

export function RepoConnection({
  onContextChange,
}: RepoConnectionProps): React.ReactElement {
  // State
  const [repoContext, setRepoContext] = useState<RepoContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [rootPath, setRootPath] = useState('');
  const [stylingSystem, setStylingSystem] = useState<StylingSystem>('unknown');
  
  // Load saved context on mount
  useEffect(() => {
    loadContext();
  }, []);
  
  const loadContext = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await chrome.storage.local.get(REPO_STORAGE_KEY);
      const stored = result[REPO_STORAGE_KEY] as RepoContext | undefined;
      setRepoContext(stored || null);
      onContextChange?.(stored || null);
    } catch (e) {
      console.error('Failed to load repo context:', e);
    } finally {
      setIsLoading(false);
    }
  }, [onContextChange]);
  
  const saveContext = useCallback(async () => {
    if (!rootPath.trim()) {
      setError('Repository path is required');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const newContext: RepoContext = {
        rootPath: rootPath.trim(),
        filePaths: [], // Would be populated by actual file system access
        stylingSystem,
      };
      
      await chrome.storage.local.set({
        [REPO_STORAGE_KEY]: newContext,
      });
      
      setRepoContext(newContext);
      setIsEditing(false);
      setSuccess('Repository connected');
      setTimeout(() => setSuccess(null), 3000);
      onContextChange?.(newContext);
    } catch (e) {
      console.error('Failed to save repo context:', e);
      setError('Failed to save repository connection');
    } finally {
      setIsLoading(false);
    }
  }, [rootPath, stylingSystem, onContextChange]);
  
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      await chrome.storage.local.remove(REPO_STORAGE_KEY);
      setRepoContext(null);
      setRootPath('');
      setIsEditing(false);
      setSuccess('Repository disconnected');
      setTimeout(() => setSuccess(null), 3000);
      onContextChange?.(null);
    } catch (e) {
      console.error('Failed to disconnect repo:', e);
      setError('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  }, [onContextChange]);
  
  const startEditing = useCallback(() => {
    if (repoContext) {
      setRootPath(repoContext.rootPath);
      setStylingSystem(repoContext.stylingSystem || 'unknown');
    }
    setIsEditing(true);
    setError(null);
  }, [repoContext]);
  
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setRootPath('');
    setError(null);
  }, []);
  
  const isConnected = repoContext !== null;

  return (
    <Section
      id="repo-connection"
      title="Repository"
      collapsible
      defaultCollapsed={!isConnected}
    >
      <div style={styles.container}>
        {/* Status indicator */}
        <div style={styles.statusRow}>
          <div
            style={{
              ...styles.statusDot,
              ...(isConnected ? styles.statusConnected : styles.statusDisconnected),
            }}
          />
          <span style={styles.statusText}>
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
          {repoContext && !isEditing && (
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
        
        {/* Connected state (not editing) */}
        {repoContext && !isEditing && (
          <div style={styles.container}>
            <div style={styles.contextDisplay}>
              <div style={styles.contextRow}>
                <span style={styles.contextLabel}>Path</span>
                <span style={styles.contextValue} title={repoContext.rootPath}>
                  {repoContext.rootPath}
                </span>
              </div>
              <div style={styles.contextRow}>
                <span style={styles.contextLabel}>Styling</span>
                <span style={styles.contextValue}>
                  {STYLING_SYSTEMS.find(s => s.value === repoContext.stylingSystem)?.label || 'Unknown'}
                </span>
              </div>
              {repoContext.filePaths.length > 0 && (
                <div style={styles.contextRow}>
                  <span style={styles.contextLabel}>Files</span>
                  <span style={styles.contextValue}>
                    {repoContext.filePaths.length} indexed
                  </span>
                </div>
              )}
            </div>
            
            {/* Phase 5 warning */}
            <div style={styles.warning}>
              <AppIcon name="alertTriangle" size={14} />
              <div>
                Repo-Connected Mode enables source code suggestions. Each modification requires explicit confirmation.
              </div>
            </div>
            
            <div style={styles.buttonRow}>
              <button
                style={{ ...styles.button, ...styles.buttonDanger }}
                onClick={disconnect}
                disabled={isLoading}
              >
                <AppIcon name="unlink" size={14} />
                Disconnect
              </button>
            </div>
          </div>
        )}
        
        {/* Connection form */}
        {(isEditing || !repoContext) && (
          <div style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Repository Path</label>
              <input
                type="text"
                style={styles.input}
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                placeholder="/path/to/your/project"
                disabled={isLoading}
              />
              <span style={styles.hint}>
                The root path of your local repository. This is used to map visual changes to source files.
              </span>
            </div>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Styling System</label>
              <select
                style={styles.select}
                value={stylingSystem}
                onChange={(e) => setStylingSystem(e.target.value as StylingSystem)}
                disabled={isLoading}
              >
                {STYLING_SYSTEMS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span style={styles.hint}>
                The styling approach used in your project. Helps generate accurate code suggestions.
              </span>
            </div>
            
            <div style={styles.buttonRow}>
              {repoContext && (
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
                  ...(isLoading || !rootPath.trim() ? styles.buttonDisabled : {}),
                }}
                onClick={saveContext}
                disabled={isLoading || !rootPath.trim()}
              >
                <AppIcon name="link" size={14} />
                {repoContext ? 'Update' : 'Connect'} Repository
              </button>
            </div>
          </div>
        )}
        
        {/* Privacy/scope notice */}
        <div style={styles.hint}>
          Repository connection is stored locally in your browser. The tool reads file paths for source mapping but does not modify files without explicit confirmation.
        </div>
      </div>
    </Section>
  );
}
