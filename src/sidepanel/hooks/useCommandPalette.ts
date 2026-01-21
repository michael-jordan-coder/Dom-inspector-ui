/**
 * useCommandPalette Hook
 * 
 * Manages command palette state and fuzzy search functionality.
 */

import { useState, useCallback, useMemo } from 'react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
  keywords?: string[];
  action: () => void;
}

/**
 * Simple fuzzy search implementation
 */
function fuzzyMatch(query: string, text: string): { matches: boolean; score: number } {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Empty query matches everything
  if (!query) return { matches: true, score: 0 };
  
  // Exact match
  if (textLower === queryLower) return { matches: true, score: 100 };
  
  // Contains
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower);
    // Score higher for matches at start
    return { matches: true, score: 80 - index };
  }
  
  // Fuzzy match: all query chars must appear in order
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      score += consecutiveMatches * 2; // Bonus for consecutive matches
    } else {
      consecutiveMatches = 0;
    }
  }
  
  if (queryIndex === queryLower.length) {
    return { matches: true, score: Math.min(score, 60) };
  }
  
  return { matches: false, score: 0 };
}

export interface UseCommandPaletteOptions {
  commands: Command[];
  recentCommandIds?: string[];
  onCommandExecute?: (command: Command) => void;
}

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (query: string) => void;
  filteredCommands: Command[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  executeCommand: (command: Command) => void;
  executeSelected: () => void;
  selectNext: () => void;
  selectPrevious: () => void;
}

export function useCommandPalette({
  commands,
  recentCommandIds = [],
  onCommandExecute,
}: UseCommandPaletteOptions): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    if (!query) {
      // Show recent commands first, then all commands
      const recent = recentCommandIds
        .map(id => commands.find(c => c.id === id))
        .filter((c): c is Command => c !== undefined);
      const others = commands.filter(c => !recentCommandIds.includes(c.id));
      return [...recent, ...others];
    }

    // Filter by fuzzy search
    const results = commands
      .map(command => {
        // Search in label, description, and keywords
        const labelMatch = fuzzyMatch(query, command.label);
        const descMatch = command.description ? fuzzyMatch(query, command.description) : { matches: false, score: 0 };
        const keywordMatches = (command.keywords || []).map(kw => fuzzyMatch(query, kw));
        const bestKeywordMatch = keywordMatches.reduce(
          (best, match) => (match.score > best.score ? match : best),
          { matches: false, score: 0 }
        );

        const matches = labelMatch.matches || descMatch.matches || bestKeywordMatch.matches;
        const score = Math.max(labelMatch.score, descMatch.score * 0.8, bestKeywordMatch.score * 0.6);

        return { command, matches, score };
      })
      .filter(r => r.matches)
      .sort((a, b) => b.score - a.score)
      .map(r => r.command);

    return results;
  }, [commands, query, recentCommandIds]);

  // Reset selection when results change
  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const executeCommand = useCallback((command: Command) => {
    command.action();
    onCommandExecute?.(command);
    close();
  }, [onCommandExecute, close]);

  const executeSelected = useCallback(() => {
    if (filteredCommands.length > 0 && selectedIndex < filteredCommands.length) {
      executeCommand(filteredCommands[selectedIndex]);
    }
  }, [filteredCommands, selectedIndex, executeCommand]);

  const selectNext = useCallback(() => {
    setSelectedIndex(prev => 
      prev < filteredCommands.length - 1 ? prev + 1 : 0
    );
  }, [filteredCommands.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex(prev => 
      prev > 0 ? prev - 1 : filteredCommands.length - 1
    );
  }, [filteredCommands.length]);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery: handleSetQuery,
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    executeCommand,
    executeSelected,
    selectNext,
    selectPrevious,
  };
}

/**
 * Pre-defined commands for common actions
 */
export function createDefaultCommands(handlers: {
  onSetPadding?: (value: number) => void;
  onSetMargin?: (value: number) => void;
  onSetFontSize?: (value: number) => void;
  onSetOpacity?: (value: number) => void;
  onTogglePicker?: () => void;
  onCopyCSS?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}): Command[] {
  const commands: Command[] = [];

  if (handlers.onTogglePicker) {
    commands.push({
      id: 'toggle-picker',
      label: 'Toggle Element Picker',
      description: 'Start or stop picking elements',
      keywords: ['select', 'inspect', 'pick'],
      category: 'Navigation',
      action: handlers.onTogglePicker,
    });
  }

  if (handlers.onCopyCSS) {
    commands.push({
      id: 'copy-css',
      label: 'Copy CSS',
      description: 'Copy styles as CSS to clipboard',
      keywords: ['clipboard', 'export', 'styles'],
      category: 'Actions',
      action: handlers.onCopyCSS,
    });
  }

  if (handlers.onUndo) {
    commands.push({
      id: 'undo',
      label: 'Undo',
      description: 'Undo last change',
      keywords: ['revert', 'back'],
      category: 'History',
      action: handlers.onUndo,
    });
  }

  if (handlers.onRedo) {
    commands.push({
      id: 'redo',
      label: 'Redo',
      description: 'Redo last undone change',
      keywords: ['forward'],
      category: 'History',
      action: handlers.onRedo,
    });
  }

  // Quick set commands
  const spacingValues = [0, 8, 16, 24, 32];
  
  if (handlers.onSetPadding) {
    spacingValues.forEach(v => {
      commands.push({
        id: `set-padding-${v}`,
        label: `Set padding to ${v}px`,
        keywords: ['spacing', 'padding'],
        category: 'Quick Set',
        action: () => handlers.onSetPadding!(v),
      });
    });
  }

  if (handlers.onSetMargin) {
    spacingValues.forEach(v => {
      commands.push({
        id: `set-margin-${v}`,
        label: `Set margin to ${v}px`,
        keywords: ['spacing', 'margin'],
        category: 'Quick Set',
        action: () => handlers.onSetMargin!(v),
      });
    });
  }

  if (handlers.onSetFontSize) {
    [12, 14, 16, 18, 24, 32].forEach(v => {
      commands.push({
        id: `set-font-size-${v}`,
        label: `Set font size to ${v}px`,
        keywords: ['text', 'typography', 'size'],
        category: 'Quick Set',
        action: () => handlers.onSetFontSize!(v),
      });
    });
  }

  if (handlers.onSetOpacity) {
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      commands.push({
        id: `set-opacity-${v}`,
        label: `Set opacity to ${v * 100}%`,
        keywords: ['transparency', 'visibility'],
        category: 'Quick Set',
        action: () => handlers.onSetOpacity!(v),
      });
    });
  }

  return commands;
}
