/**
 * Color Utilities
 * 
 * Parsing, conversion, and token detection for color values.
 * Handles hex, rgb, rgba, named colors, and CSS variables.
 */

// =============================================================================
// Types
// =============================================================================

export interface ParsedColor {
  /** The display value (token name or formatted color) */
  display: string;
  /** The computed hex value (for swatch) */
  hex: string;
  /** Whether this is a CSS variable reference */
  isToken: boolean;
  /** Original raw value */
  raw: string;
  /** Alpha channel (0-1) */
  alpha: number;
}

export interface ColorToken {
  name: string;
  value: string;
  hex: string;
}

// =============================================================================
// Named Colors (subset for common use)
// =============================================================================

const NAMED_COLORS: Record<string, string> = {
  transparent: 'rgba(0,0,0,0)',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  yellow: '#ffff00',
  purple: '#800080',
  pink: '#ffc0cb',
  cyan: '#00ffff',
  magenta: '#ff00ff',
};

// =============================================================================
// Color Parsing
// =============================================================================

/**
 * Convert RGB/RGBA to hex (without alpha)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse any CSS color value to a hex string (for swatch display)
 */
export function colorToHex(color: string): string {
  if (!color) return '#ffffff';
  
  const trimmed = color.trim().toLowerCase();
  
  // Already hex
  if (trimmed.startsWith('#')) {
    // Expand shorthand (#fff → #ffffff)
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    // Handle 8-digit hex (with alpha) - return first 7 chars
    if (trimmed.length === 9) {
      return trimmed.slice(0, 7);
    }
    return trimmed;
  }
  
  // RGB/RGBA
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return rgbToHex(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    );
  }
  
  // Named color
  if (NAMED_COLORS[trimmed]) {
    return colorToHex(NAMED_COLORS[trimmed]);
  }
  
  // Fallback
  return '#ffffff';
}

/**
 * Extract alpha value from color string
 */
export function extractAlpha(color: string): number {
  if (!color) return 1;
  
  const trimmed = color.trim().toLowerCase();
  
  // 8-digit hex (RRGGBBAA)
  if (trimmed.startsWith('#') && trimmed.length === 9) {
    const alpha = parseInt(trimmed.slice(7, 9), 16);
    return alpha / 255;
  }
  
  // RGBA
  const rgbaMatch = trimmed.match(/rgba\s*\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/);
  if (rgbaMatch) {
    return parseFloat(rgbaMatch[1]);
  }
  
  // Transparent
  if (trimmed === 'transparent') {
    return 0;
  }
  
  return 1;
}

/**
 * Check if a value is a CSS variable reference
 */
export function isCssVariable(value: string): boolean {
  return value.trim().startsWith('var(');
}

/**
 * Extract variable name from var() reference
 * e.g., "var(--primary-500)" → "--primary-500"
 */
export function extractVariableName(value: string): string | null {
  const match = value.match(/var\s*\(\s*(--[^,)]+)/);
  return match ? match[1].trim() : null;
}

/**
 * Parse a color value (raw or computed) into structured format
 */
export function parseColor(
  computedValue: string,
  rawValue?: string
): ParsedColor {
  const raw = rawValue || computedValue;
  const hex = colorToHex(computedValue);
  const alpha = extractAlpha(computedValue);
  
  // Check if raw value is a CSS variable
  if (rawValue && isCssVariable(rawValue)) {
    const varName = extractVariableName(rawValue);
    return {
      display: varName || rawValue,
      hex,
      isToken: true,
      raw,
      alpha,
    };
  }
  
  // Format computed value for display
  const display = formatColorForDisplay(computedValue);
  
  return {
    display,
    hex,
    isToken: false,
    raw,
    alpha,
  };
}

/**
 * Format a color value for compact display
 */
export function formatColorForDisplay(color: string): string {
  if (!color) return 'none';
  
  const trimmed = color.trim().toLowerCase();
  
  // Already hex - uppercase for consistency
  if (trimmed.startsWith('#')) {
    return trimmed.toUpperCase();
  }
  
  // RGB/RGBA - convert to hex for display
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    const hex = rgbToHex(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    );
    const alpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
    if (alpha < 1) {
      return `${hex.toUpperCase()} ${Math.round(alpha * 100)}%`;
    }
    return hex.toUpperCase();
  }
  
  // Named color - return as-is
  if (NAMED_COLORS[trimmed]) {
    return trimmed;
  }
  
  // Transparent
  if (trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)') {
    return 'transparent';
  }
  
  return color;
}

/**
 * Validate a hex color string
 */
export function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value.trim());
}

/**
 * Normalize hex to 6-digit format
 */
export function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  if (!trimmed.startsWith('#')) return `#${trimmed}`;
  
  // Expand shorthand
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  
  return trimmed;
}

// =============================================================================
// Recent Colors Storage
// =============================================================================

const RECENT_COLORS_KEY = 'inspector_recent_colors';
const MAX_RECENT_COLORS = 8;

export function getRecentColors(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentColor(color: string): void {
  try {
    const hex = normalizeHex(colorToHex(color));
    const recent = getRecentColors().filter(c => c !== hex);
    recent.unshift(hex);
    localStorage.setItem(
      RECENT_COLORS_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_COLORS))
    );
  } catch {
    // Ignore storage errors
  }
}

// =============================================================================
// Default Color Tokens (shadcn neutral palette)
// =============================================================================

/**
 * Default color tokens based on shadcn neutral palette.
 * These serve as a starting point when page tokens aren't available.
 */
export const DEFAULT_COLOR_TOKENS: ColorToken[] = [
  { name: '--neutral-50', value: '#fafafa', hex: '#fafafa' },
  { name: '--neutral-100', value: '#f5f5f5', hex: '#f5f5f5' },
  { name: '--neutral-200', value: '#e5e5e5', hex: '#e5e5e5' },
  { name: '--neutral-300', value: '#d4d4d4', hex: '#d4d4d4' },
  { name: '--neutral-400', value: '#a3a3a3', hex: '#a3a3a3' },
  { name: '--neutral-500', value: '#737373', hex: '#737373' },
  { name: '--neutral-600', value: '#525252', hex: '#525252' },
  { name: '--neutral-700', value: '#404040', hex: '#404040' },
  { name: '--neutral-800', value: '#262626', hex: '#262626' },
  { name: '--neutral-900', value: '#171717', hex: '#171717' },
  { name: '--neutral-950', value: '#0a0a0a', hex: '#0a0a0a' },
];

/**
 * Get default color tokens for the color picker.
 */
export function getDefaultColorTokens(): ColorToken[] {
  return DEFAULT_COLOR_TOKENS;
}
