/**
 * useCycleUnit Hook
 * 
 * Enables unit cycling for numeric CSS values (px → % → vw → rem → px)
 * Stores original value for lossless conversions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type CSSUnit = 'px' | '%' | 'vw' | 'vh' | 'rem' | 'em';

const UNIT_CYCLE: CSSUnit[] = ['px', '%', 'vw', 'rem'];

interface UseCycleUnitOptions {
  /** Current numeric value */
  value: number;
  /** Current unit */
  unit: CSSUnit;
  /** Callback when unit changes (receives new value and unit) */
  onChange: (value: number, unit: CSSUnit) => void;
  /** Container width for % calculations (optional) */
  containerWidth?: number;
  /** Viewport width for vw calculations (defaults to window.innerWidth) */
  viewportWidth?: number;
  /** Root font size for rem calculations (defaults to 16) */
  rootFontSize?: number;
}

interface UseCycleUnitReturn {
  /** Current display value */
  displayValue: number;
  /** Current unit */
  currentUnit: CSSUnit;
  /** Handler to cycle to next unit */
  cycleUnit: () => void;
  /** Available units for cycling */
  availableUnits: CSSUnit[];
}

/**
 * Convert value between CSS units
 */
function convertValue(
  value: number,
  fromUnit: CSSUnit,
  toUnit: CSSUnit,
  options: {
    containerWidth?: number;
    viewportWidth: number;
    rootFontSize: number;
  }
): number {
  const { containerWidth = 0, viewportWidth, rootFontSize } = options;

  // First convert to px (base unit)
  let pxValue: number;
  switch (fromUnit) {
    case 'px':
      pxValue = value;
      break;
    case '%':
      pxValue = (value / 100) * containerWidth;
      break;
    case 'vw':
      pxValue = (value / 100) * viewportWidth;
      break;
    case 'vh':
      pxValue = (value / 100) * window.innerHeight;
      break;
    case 'rem':
      pxValue = value * rootFontSize;
      break;
    case 'em':
      pxValue = value * rootFontSize; // Simplified, using root font size
      break;
    default:
      pxValue = value;
  }

  // Then convert from px to target unit
  let result: number;
  switch (toUnit) {
    case 'px':
      result = pxValue;
      break;
    case '%':
      result = containerWidth > 0 ? (pxValue / containerWidth) * 100 : 0;
      break;
    case 'vw':
      result = (pxValue / viewportWidth) * 100;
      break;
    case 'vh':
      result = (pxValue / window.innerHeight) * 100;
      break;
    case 'rem':
      result = pxValue / rootFontSize;
      break;
    case 'em':
      result = pxValue / rootFontSize;
      break;
    default:
      result = pxValue;
  }

  // Round to 2 decimal places
  return Math.round(result * 100) / 100;
}

export function useCycleUnit({
  value,
  unit,
  onChange,
  containerWidth,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920,
  rootFontSize = 16,
}: UseCycleUnitOptions): UseCycleUnitReturn {
  const [currentUnit, setCurrentUnit] = useState<CSSUnit>(unit);
  
  // Store original px value for lossless conversion
  const originalPxValueRef = useRef<number>(
    convertValue(value, unit, 'px', { containerWidth, viewportWidth, rootFontSize })
  );

  // Update original px value when external value changes
  useEffect(() => {
    originalPxValueRef.current = convertValue(value, currentUnit, 'px', {
      containerWidth,
      viewportWidth,
      rootFontSize,
    });
  }, [value, currentUnit, containerWidth, viewportWidth, rootFontSize]);

  // Sync unit if external unit prop changes
  useEffect(() => {
    if (unit !== currentUnit) {
      setCurrentUnit(unit);
    }
  }, [unit]);

  const cycleUnit = useCallback(() => {
    const currentIndex = UNIT_CYCLE.indexOf(currentUnit);
    const nextIndex = (currentIndex + 1) % UNIT_CYCLE.length;
    const nextUnit = UNIT_CYCLE[nextIndex];

    // Convert from original px value to new unit (lossless)
    const newValue = convertValue(originalPxValueRef.current, 'px', nextUnit, {
      containerWidth,
      viewportWidth,
      rootFontSize,
    });

    setCurrentUnit(nextUnit);
    onChange(newValue, nextUnit);
  }, [currentUnit, onChange, containerWidth, viewportWidth, rootFontSize]);

  const displayValue = value;

  return {
    displayValue,
    currentUnit,
    cycleUnit,
    availableUnits: UNIT_CYCLE,
  };
}

/**
 * Parse a CSS value string into value and unit
 */
export function parseCSSValue(cssValue: string): { value: number; unit: CSSUnit } {
  const match = cssValue.match(/^(-?[\d.]+)(px|%|vw|vh|rem|em)?$/);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: (match[2] as CSSUnit) || 'px',
    };
  }
  return { value: 0, unit: 'px' };
}

/**
 * Format a value with unit
 */
export function formatCSSValue(value: number, unit: CSSUnit): string {
  return `${value}${unit}`;
}
