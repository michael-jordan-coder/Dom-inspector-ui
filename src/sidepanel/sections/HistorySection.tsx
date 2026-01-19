/**
 * History Section
 * 
 * Compact undo/redo controls.
 */

import React, { useCallback } from 'react';
import { Undo2, Redo2 } from '../icons';
import { undo, redo } from '../messaging/sidepanelBridge';
import { colors, spacing, radii } from '../tokens';

interface HistorySectionProps {
  canUndo: boolean;
  canRedo: boolean;
}

const styles = {
  container: {
    display: 'flex',
    gap: spacing[1],
    flexShrink: 0,
    width: '100%',
  } as React.CSSProperties,
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: `6px ${spacing[2]}`,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  } as React.CSSProperties,
};

export function HistorySection({
  canUndo,
  canRedo,
}: HistorySectionProps): React.ReactElement {
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
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={14} />
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
        <Redo2 size={14} />
        Redo
      </button>
    </div>
  );
}
