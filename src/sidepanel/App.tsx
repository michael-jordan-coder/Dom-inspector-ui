import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ElementMetadata, ComputedStylesSnapshot, StylePatch } from '../shared/types';
import {
  initBridge,
  startPicker,
  stopPicker,
  getCurrentState,
  undo,
  redo,
  applyStylePatch,
  navigateToParent,
  navigateToChild,
  navigateToSibling,
} from './messaging/sidepanelBridge';
import { InspectorHeader } from './components/InspectorHeader';
import { InspectorSidebar } from './InspectorSidebar';
import { CommandPalette } from './components/CommandPalette';
import { useCommandPalette, createDefaultCommands } from './hooks/useCommandPalette';
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
    boxShadow: 'var(--shadow-md)',
  },
  errorToast: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
};

// ============================================================================
// CSS Generation Utility
// ============================================================================

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function generateCSSFromStyles(selector: string, styles: ComputedStylesSnapshot): string {
  const properties: string[] = [];
  const add = (prop: string, value: string | undefined) => {
    if (value && value !== 'auto' && value !== 'none' && value !== 'normal') {
      properties.push(`  ${toKebabCase(prop)}: ${value};`);
    }
  };

  add('display', styles.display);
  if (styles.display?.includes('flex') || styles.display?.includes('grid')) {
    add('justify-content', styles.justifyContent);
    add('align-items', styles.alignItems);
    add('gap', styles.gap);
  }
  add('width', styles.width);
  add('height', styles.height);
  add('padding-top', styles.paddingTop);
  add('padding-right', styles.paddingRight);
  add('padding-bottom', styles.paddingBottom);
  add('padding-left', styles.paddingLeft);
  add('margin-top', styles.marginTop);
  add('margin-right', styles.marginRight);
  add('margin-bottom', styles.marginBottom);
  add('margin-left', styles.marginLeft);
  if (styles.opacity !== '1') add('opacity', styles.opacity);
  add('border-radius', styles.borderRadius);
  add('background-color', styles.backgroundColor);
  add('color', styles.color);
  add('font-size', styles.fontSize);
  add('font-weight', styles.fontWeight);
  if (styles.lineHeight !== 'normal') add('line-height', styles.lineHeight);

  if (properties.length === 0) return `/* No styles */`;
  return `${selector} {\n${properties.join('\n')}\n}`;
}

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

  // Handle CSS copy
  const handleCopyCSS = useCallback(async () => {
    if (selectedElement && computedStyles) {
      const css = generateCSSFromStyles(selectedElement.selector, computedStyles);
      try {
        await navigator.clipboard.writeText(css);
        showToast('CSS copied!');
      } catch {
        showToast('Failed to copy', true);
      }
    }
  }, [selectedElement, computedStyles, showToast]);

  // Command palette commands
  const commands = useMemo(() => {
    return createDefaultCommands({
      onTogglePicker: handlePickerToggle,
      onCopyCSS: selectedElement ? handleCopyCSS : undefined,
      onUndo: canUndo ? async () => { try { await undo(); } catch {} } : undefined,
      onRedo: canRedo ? async () => { try { await redo(); } catch {} } : undefined,
      onSetPadding: selectedElement ? async (value) => {
        await applyStylePatch(selectedElement.selector, 'padding', `${value}px`, '');
      } : undefined,
      onSetMargin: selectedElement ? async (value) => {
        await applyStylePatch(selectedElement.selector, 'margin', `${value}px`, '');
      } : undefined,
      onSetFontSize: selectedElement ? async (value) => {
        await applyStylePatch(selectedElement.selector, 'fontSize', `${value}px`, '');
      } : undefined,
      onSetOpacity: selectedElement ? async (value) => {
        await applyStylePatch(selectedElement.selector, 'opacity', String(value), '');
      } : undefined,
    });
  }, [handlePickerToggle, handleCopyCSS, selectedElement, canUndo, canRedo]);

  // Command palette hook
  const commandPalette = useCommandPalette({
    commands,
    onCommandExecute: (cmd) => {
      showToast(`Executed: ${cmd.label}`);
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // P: Toggle picker mode (only when not typing)
      if (e.key === 'p' && !modKey && !e.shiftKey && !e.altKey && !isTyping) {
        e.preventDefault();
        try {
          if (isPickerActive) {
            await stopPicker();
            setIsPickerActive(false);
          } else {
            await startPicker();
            setIsPickerActive(true);
          }
        } catch (err) {
          console.error('Picker toggle failed:', err);
        }
        return;
      }

      // Cmd/Ctrl + K: Open command palette
      if (modKey && e.key === 'k') {
        e.preventDefault();
        commandPalette.toggle();
        return;
      }

      // Escape: Cancel picker mode or close command palette
      if (e.key === 'Escape') {
        if (commandPalette.isOpen) {
          // Handled by command palette
          return;
        }
        if (isPickerActive) {
          e.preventDefault();
          try {
            await stopPicker();
            setIsPickerActive(false);
          } catch (err) {
            console.error('Stop picker failed:', err);
          }
        }
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (modKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl/Cmd + Shift + Z = Redo
          if (canRedo) {
            try {
              await redo();
            } catch (err) {
              console.error('Redo failed:', err);
            }
          }
        } else {
          // Ctrl/Cmd + Z = Undo
          if (canUndo) {
            try {
              await undo();
            } catch (err) {
              console.error('Undo failed:', err);
            }
          }
        }
      }
      
      // Ctrl/Cmd + Y: Redo (Windows convention)
      if (modKey && e.key === 'y') {
        e.preventDefault();
        if (canRedo) {
          try {
            await redo();
          } catch (err) {
            console.error('Redo failed:', err);
          }
        }
      }

      // Alt + Arrow keys: Hierarchy navigation (when element is selected and not typing)
      if (e.altKey && !isTyping && selectedElement) {
        // Alt + ↑: Navigate to parent
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          try {
            await navigateToParent();
          } catch (err) {
            console.error('Navigate to parent failed:', err);
          }
          return;
        }

        // Alt + ↓: Navigate to first child
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          try {
            await navigateToChild(0);
          } catch (err) {
            console.error('Navigate to child failed:', err);
          }
          return;
        }

        // Alt + ←: Navigate to previous sibling
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          try {
            await navigateToSibling('prev');
          } catch (err) {
            console.error('Navigate to prev sibling failed:', err);
          }
          return;
        }

        // Alt + →: Navigate to next sibling
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          try {
            await navigateToSibling('next');
          } catch (err) {
            console.error('Navigate to next sibling failed:', err);
          }
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, isPickerActive, commandPalette, selectedElement]);

  return (
    <div style={styles.container}>
      <InspectorHeader
        isPickerActive={isPickerActive}
        onPickerToggle={handlePickerToggle}
        hasSelection={!!selectedElement}
        onCopyCSS={handleCopyCSS}
      />

      <div style={styles.content}>
        {selectedElement && computedStyles ? (
          <InspectorSidebar
            element={selectedElement}
            styles={computedStyles}
            canUndo={canUndo}
            canRedo={canRedo}
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        query={commandPalette.query}
        onQueryChange={commandPalette.setQuery}
        commands={commandPalette.filteredCommands}
        selectedIndex={commandPalette.selectedIndex}
        onSelectIndex={commandPalette.setSelectedIndex}
        onExecute={commandPalette.executeCommand}
        onClose={commandPalette.close}
      />

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
