/**
 * CommandPalette
 * 
 * Fuzzy search command palette (Cmd+K / Ctrl+K).
 * Provides quick access to all actions and property settings.
 */

import React, { useEffect, useRef } from 'react';
import { colors, radii, spacing, typography } from '../tokens';
import type { Command } from '../hooks/useCommandPalette';
import { AppIcon } from '../primitives';

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  commands: Command[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecute: (command: Command) => void;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '10vh',
    animation: 'fadeIn 0.1s ease-out',
  } as React.CSSProperties,
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    animation: 'slideDown 0.15s ease-out',
  } as React.CSSProperties,
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: spacing[3],
    borderBottom: `1px solid ${colors.border}`,
    gap: spacing[2],
  } as React.CSSProperties,
  searchIcon: {
    color: colors.textMuted,
    flexShrink: 0,
  } as React.CSSProperties,
  searchInput: {
    flex: 1,
    height: 32,
    fontSize: typography.sm,
    fontFamily: 'inherit',
    fontWeight: 400,
    color: colors.text,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
  } as React.CSSProperties,
  results: {
    maxHeight: 300,
    overflowY: 'auto' as const,
    padding: spacing[1],
  } as React.CSSProperties,
  category: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: `${spacing[2]} ${spacing[3]}`,
    marginTop: spacing[1],
  } as React.CSSProperties,
  commandItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: radii.sm,
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  } as React.CSSProperties,
  commandItemSelected: {
    backgroundColor: colors.accent,
  } as React.CSSProperties,
  commandItemHover: {
    backgroundColor: colors.surfaceRaised,
  } as React.CSSProperties,
  commandIcon: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textMuted,
    flexShrink: 0,
  } as React.CSSProperties,
  commandContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  commandLabel: {
    fontSize: typography.sm,
    fontWeight: 500,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  commandDescription: {
    fontSize: typography.xs,
    color: colors.textMuted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginTop: 2,
  } as React.CSSProperties,
  shortcut: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.textMuted,
    backgroundColor: colors.surfaceRaised,
    padding: '2px 6px',
    borderRadius: radii.sm,
    flexShrink: 0,
  } as React.CSSProperties,
  empty: {
    padding: spacing[4],
    textAlign: 'center' as const,
    color: colors.textMuted,
    fontSize: typography.sm,
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[2]} ${spacing[3]}`,
    borderTop: `1px solid ${colors.border}`,
    fontSize: '10px',
    color: colors.textMuted,
  } as React.CSSProperties,
  footerHint: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  } as React.CSSProperties,
  footerKey: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    padding: '0 4px',
    backgroundColor: colors.surfaceRaised,
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 500,
  } as React.CSSProperties,
};

// CSS keyframes for animations
const keyframes = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export function CommandPalette({
  isOpen,
  query,
  onQueryChange,
  commands,
  selectedIndex,
  onSelectIndex,
  onExecute,
  onClose,
}: CommandPaletteProps): React.ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && commands.length > 0) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, commands.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onSelectIndex(selectedIndex < commands.length - 1 ? selectedIndex + 1 : 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : commands.length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (commands[selectedIndex]) {
            onExecute(commands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, commands, selectedIndex, onSelectIndex, onExecute, onClose]);

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = commands.reduce((groups, command) => {
    const category = command.category || 'Actions';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  let globalIndex = 0;

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.container} onClick={(e) => e.stopPropagation()}>
          {/* Search input */}
          <div style={styles.searchWrapper}>
            <div style={styles.searchIcon}>
              <AppIcon name="search" size={16} />
            </div>
            <input
              ref={inputRef}
              type="text"
              style={styles.searchInput}
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Results */}
          <div ref={resultsRef} style={styles.results}>
            {commands.length === 0 ? (
              <div style={styles.empty}>No commands found</div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <div style={styles.category}>{category}</div>
                  {categoryCommands.map((command) => {
                    const index = globalIndex++;
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <div
                        key={command.id}
                        data-index={index}
                        style={{
                          ...styles.commandItem,
                          ...(isSelected ? styles.commandItemSelected : {}),
                        }}
                        onClick={() => onExecute(command)}
                        onMouseEnter={() => onSelectIndex(index)}
                      >
                        {command.icon && (
                          <div style={styles.commandIcon}>{command.icon}</div>
                        )}
                        <div style={styles.commandContent}>
                          <div style={styles.commandLabel}>{command.label}</div>
                          {command.description && (
                            <div style={styles.commandDescription}>
                              {command.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer with hints */}
          <div style={styles.footer}>
            <div style={styles.footerHint}>
              <span style={styles.footerKey}>↑↓</span> Navigate
            </div>
            <div style={styles.footerHint}>
              <span style={styles.footerKey}>↵</span> Select
            </div>
            <div style={styles.footerHint}>
              <span style={styles.footerKey}>Esc</span> Close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
