import React, { useEffect, useState, useCallback } from 'react';
import type { ElementMetadata, ComputedStylesSnapshot, StylePatch } from '../shared/types';
import {
  initBridge,
  startPicker,
  stopPicker,
  getCurrentState,
  clearSelection,
} from './messaging/sidepanelBridge';
import { InspectorHeader } from './components/InspectorHeader';
import { InspectorSidebar } from './InspectorSidebar';
import { colors, spacing } from './tokens';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    color: colors.text,
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100%',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[6],
    textAlign: 'center',
    color: colors.textMuted,
    flex: 1,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    opacity: 0.5,
  },
  toast: {
    position: 'fixed',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
    padding: spacing[3],
    backgroundColor: colors.surfaceRaised,
    border: `1px solid ${colors.border}`,
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--fs-sm)',
    color: colors.text,
    zIndex: 100,
    animation: 'fadeIn 0.2s ease-out',
  },
  errorToast: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
};

// ============================================================================
// App Component
// ============================================================================

export function App(): React.ReactElement {
  // State
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementMetadata | null>(null);
  const [computedStyles, setComputedStyles] = useState<ComputedStylesSnapshot | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  // Show toast message
  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Initialize bridge on mount
  useEffect(() => {
    const cleanup = initBridge({
      onElementSelected: (metadata) => {
        setSelectedElement(metadata);
        setComputedStyles(metadata.computedStyles);
        setIsPickerActive(false);
      },
      onPickCancelled: () => {
        setIsPickerActive(false);
      },
      onStylePatchApplied: (_patch: StylePatch, styles: ComputedStylesSnapshot) => {
        setComputedStyles(styles);
        setCanUndo(true);
        setCanRedo(false);
      },
      onUndoApplied: (result) => {
        if (result.updatedStyles) {
          setComputedStyles(result.updatedStyles);
        }
        setCanUndo(result.canUndo);
        setCanRedo(result.canRedo);
        if (result.success) {
          showToast('Undo successful');
        }
      },
      onRedoApplied: (result) => {
        if (result.updatedStyles) {
          setComputedStyles(result.updatedStyles);
        }
        setCanUndo(result.canUndo);
        setCanRedo(result.canRedo);
        if (result.success) {
          showToast('Redo successful');
        }
      },
      onTabChanged: () => {
        // Refresh state when tab changes
        refreshState();
      },
      onError: (error) => {
        showToast(error, true);
      },
    });

    // Get initial state
    refreshState();

    return cleanup;
  }, [showToast]);

  // Refresh state from content script
  const refreshState = useCallback(async () => {
    try {
      const state = await getCurrentState();
      setIsPickerActive(state.isPickerActive);
      setSelectedElement(state.selectedElement);
      setComputedStyles(state.selectedElement?.computedStyles || null);
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    } catch {
      // Content script not available
      setSelectedElement(null);
      setComputedStyles(null);
    }
  }, []);

  // Handle picker toggle
  const handlePickerToggle = useCallback(async () => {
    try {
      if (isPickerActive) {
        await stopPicker();
        setIsPickerActive(false);
      } else {
        await startPicker();
        setIsPickerActive(true);
      }
    } catch (e) {
      showToast(String(e), true);
    }
  }, [isPickerActive, showToast]);

  // Handle done - clear selection and finish manipulation
  const handleDone = useCallback(async () => {
    try {
      await clearSelection();
      setSelectedElement(null);
      setComputedStyles(null);
      setCanUndo(false);
      setCanRedo(false);
      showToast('Done');
    } catch (e) {
      showToast(String(e), true);
    }
  }, [showToast]);

  return (
    <div style={styles.container}>
      <InspectorHeader
        isPickerActive={isPickerActive}
        onPickerToggle={handlePickerToggle}
      />

      <div style={styles.content}>
        {selectedElement && computedStyles ? (
          <InspectorSidebar
            element={selectedElement}
            styles={computedStyles}
            canUndo={canUndo}
            canRedo={canRedo}
            onDone={handleDone}
          />
        ) : (
          <div style={styles.emptyState}>
            <svg
              style={styles.emptyIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
              />
            </svg>
            <p>
              {isPickerActive
                ? 'Click on any element to inspect it'
                : 'Click "Pick Element" to start inspecting'}
            </p>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.isError ? styles.errorToast : {}),
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Inject keyframes for animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
