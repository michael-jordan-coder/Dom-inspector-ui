/**
 * useLocalStorage Hook
 * 
 * Persist state to localStorage with automatic serialization.
 */

import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'ui-inspector-';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const prefixedKey = `${STORAGE_PREFIX}${key}`;

  // Get initial value from localStorage or use provided initial
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(prefixedKey);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(prefixedKey, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Failed to save to localStorage: ${prefixedKey}`, error);
      }
    },
    [prefixedKey, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Hook specifically for section collapse state
 */
export function useSectionCollapse(sectionId: string): [boolean, () => void] {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    `section-${sectionId}-collapsed`,
    false
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  return [collapsed, toggle];
}
