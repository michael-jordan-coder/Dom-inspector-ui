import React, { useCallback } from 'react';
import { undo, redo } from '../messaging/sidepanelBridge';

interface HistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 'var(--space-2)',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--fs-sm)',
    fontWeight: 500,
    color: 'var(--text)',
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  icon: {
    width: 16,
    height: 16,
  },
};

export function HistoryControls({
  canUndo,
  canRedo,
}: HistoryControlsProps): React.ReactElement {
  const handleUndo = useCallback(async () => {
    if (!canUndo) return;
    try {
      await undo();
    } catch (e) {
      console.error('Undo failed:', e);
    }
  }, [canUndo]);

  const handleRedo = useCallback(async () => {
    if (!canRedo) return;
    try {
      await redo();
    } catch (e) {
      console.error('Redo failed:', e);
    }
  }, [canRedo]);

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.button,
          ...(canUndo ? {} : styles.buttonDisabled),
        }}
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo last change (Ctrl+Z)"
      >
        <svg
          style={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
          />
        </svg>
        Undo
      </button>

      <button
        style={{
          ...styles.button,
          ...(canRedo ? {} : styles.buttonDisabled),
        }}
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg
          style={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
          />
        </svg>
        Redo
      </button>
    </div>
  );
}
