/**
 * CommandPalette
 * 
 * Fuzzy search command palette (Cmd+K / Ctrl+K).
 * Provides quick access to all actions and property settings.
 */

import React, { useEffect, useRef } from 'react';
// ============================================================================
// Styles
// ============================================================================

import type { Command } from '../hooks/useCommandPalette';
import { AppIcon } from '../primitives';
import './components.css';

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
      <div className="command-palette-overlay" onClick={onClose}>
        <div className="command-palette-container" onClick={(e) => e.stopPropagation()}>
          {/* Search input */}
          <div className="command-palette-search-wrapper">
            <div className="command-palette-search-icon">
              <AppIcon name="search" size={16} />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="command-palette-search-input"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Results */}
          <div ref={resultsRef} className="command-palette-results">
            {commands.length === 0 ? (
              <div className="command-palette-empty">No commands found</div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <div className="command-palette-category">{category}</div>
                  {categoryCommands.map((command) => {
                    const index = globalIndex++;
                    const isSelected = index === selectedIndex;

                    return (
                      <div
                        key={command.id}
                        data-index={index}
                        className={`command-palette-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => onExecute(command)}
                        onMouseEnter={() => onSelectIndex(index)}
                      >
                        {command.icon && (
                          <div className="command-palette-item-icon">{command.icon}</div>
                        )}
                        <div className="command-palette-item-content">
                          <div className="command-palette-item-label">{command.label}</div>
                          {command.description && (
                            <div className="command-palette-item-description">
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
          <div className="command-palette-footer">
            <div className="command-palette-footer-hint">
              <span className="command-palette-footer-key">↑↓</span> Navigate
            </div>
            <div className="command-palette-footer-hint">
              <span className="command-palette-footer-key">↵</span> Select
            </div>
            <div className="command-palette-footer-hint">
              <span className="command-palette-footer-key">Esc</span> Close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
