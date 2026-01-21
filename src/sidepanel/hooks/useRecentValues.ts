/**
 * useRecentValues Hook
 * 
 * Track and persist recently used values per property type.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'ui-inspector-recent-values';
const MAX_RECENT = 5;

interface RecentValuesStore {
  [propertyType: string]: number[];
}

/**
 * Get recent values from localStorage
 */
function getStoredValues(): RecentValuesStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save recent values to localStorage
 */
function saveStoredValues(values: RecentValuesStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to manage recent values for a property type
 */
export function useRecentValues(propertyType: string): {
  recentValues: number[];
  addRecentValue: (value: number) => void;
  clearRecentValues: () => void;
} {
  const [recentValues, setRecentValues] = useState<number[]>(() => {
    const stored = getStoredValues();
    return stored[propertyType] || [];
  });

  // Sync with localStorage
  useEffect(() => {
    const stored = getStoredValues();
    setRecentValues(stored[propertyType] || []);
  }, [propertyType]);

  const addRecentValue = useCallback((value: number) => {
    setRecentValues((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((v) => v !== value);
      // Add to front, limit to MAX_RECENT
      const updated = [value, ...filtered].slice(0, MAX_RECENT);
      
      // Persist to localStorage
      const stored = getStoredValues();
      stored[propertyType] = updated;
      saveStoredValues(stored);
      
      return updated;
    });
  }, [propertyType]);

  const clearRecentValues = useCallback(() => {
    setRecentValues([]);
    const stored = getStoredValues();
    delete stored[propertyType];
    saveStoredValues(stored);
  }, [propertyType]);

  return {
    recentValues,
    addRecentValue,
    clearRecentValues,
  };
}

/**
 * Predefined presets for different property types
 */
export const PRESETS: Record<string, number[]> = {
  // Spacing scale (4px base)
  padding: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  margin: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  gap: [0, 4, 8, 12, 16, 24, 32],
  
  // Typography scale
  fontSize: [10, 12, 14, 16, 18, 20, 24, 32, 48, 64],
  lineHeight: [1, 1.2, 1.4, 1.5, 1.6, 1.75, 2],
  
  // Border radius
  borderRadius: [0, 2, 4, 6, 8, 12, 16, 24, 9999],
  
  // Opacity
  opacity: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1],
  
  // Dimensions
  width: [100, 200, 300, 400, 500],
  height: [100, 200, 300, 400, 500],
};

/**
 * Get presets for a property type
 */
export function getPresetsForProperty(propertyType: string): number[] {
  // Check for exact match first
  if (PRESETS[propertyType]) {
    return PRESETS[propertyType];
  }
  
  // Check for partial match (e.g., "paddingH" matches "padding")
  const lowerType = propertyType.toLowerCase();
  for (const [key, values] of Object.entries(PRESETS)) {
    if (lowerType.includes(key.toLowerCase())) {
      return values;
    }
  }
  
  // Default spacing scale
  return [0, 4, 8, 12, 16, 24, 32, 48, 64];
}
