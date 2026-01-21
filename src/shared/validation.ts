/**
 * Export Schema v1 Validation
 * 
 * Validates exports against the canonical JSON schema defined in Phase 2.
 * This validation is used by Safe-Run Gates before AI consumption.
 */

import type {
  VisualUIInspectorExport,
  SelectorConfidence,
  ExportWarningCode,
} from './types';
import { EXPORT_SCHEMA_VERSION } from './types';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// Type Guards
// ============================================================================

const VALID_CONFIDENCE_VALUES: SelectorConfidence[] = ['high', 'medium', 'low'];
const VALID_WARNING_CODES: ExportWarningCode[] = [
  'SELECTOR_POSITIONAL',
  'SELECTOR_NO_ID',
  'MULTIPLE_ELEMENTS_MATCHED',
  'ELEMENT_NOT_FOUND',
  'VIEWPORT_MISMATCH',
  'IDENTITY_MISMATCH',
];

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSelectorConfidence(value: unknown): value is SelectorConfidence {
  return isString(value) && VALID_CONFIDENCE_VALUES.includes(value as SelectorConfidence);
}

function isValidWarningCode(value: unknown): value is ExportWarningCode {
  return isString(value) && VALID_WARNING_CODES.includes(value as ExportWarningCode);
}

function isValidISODate(value: unknown): boolean {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
}

function isValidURL(value: unknown): boolean {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Schema Validators
// ============================================================================

/**
 * Validate a FinalPatch object.
 */
function validateFinalPatch(patch: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `patches[${index}]`;

  if (!isObject(patch)) {
    errors.push({ path, message: 'Patch must be an object', value: patch });
    return errors;
  }

  // Required: selector (string)
  if (!isString(patch.selector)) {
    errors.push({
      path: `${path}.selector`,
      message: 'selector must be a string',
      value: patch.selector,
    });
  }

  // Required: property (string)
  if (!isString(patch.property)) {
    errors.push({
      path: `${path}.property`,
      message: 'property must be a string',
      value: patch.property,
    });
  }

  // Required: originalValue (string | null)
  if (patch.originalValue !== null && !isString(patch.originalValue)) {
    errors.push({
      path: `${path}.originalValue`,
      message: 'originalValue must be a string or null',
      value: patch.originalValue,
    });
  }

  // Required: finalValue (string)
  if (!isString(patch.finalValue)) {
    errors.push({
      path: `${path}.finalValue`,
      message: 'finalValue must be a string',
      value: patch.finalValue,
    });
  }

  // Required: selectorConfidence (high | medium | low)
  if (!isValidSelectorConfidence(patch.selectorConfidence)) {
    errors.push({
      path: `${path}.selectorConfidence`,
      message: 'selectorConfidence must be "high", "medium", or "low"',
      value: patch.selectorConfidence,
    });
  }

  // Required: capturedAt (ISO 8601 date-time)
  if (!isValidISODate(patch.capturedAt)) {
    errors.push({
      path: `${path}.capturedAt`,
      message: 'capturedAt must be a valid ISO 8601 date-time string',
      value: patch.capturedAt,
    });
  }

  return errors;
}

/**
 * Validate an ExportWarning object.
 */
function validateWarning(warning: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `warnings[${index}]`;

  if (!isObject(warning)) {
    errors.push({ path, message: 'Warning must be an object', value: warning });
    return errors;
  }

  // Required: code (ExportWarningCode)
  if (!isValidWarningCode(warning.code)) {
    errors.push({
      path: `${path}.code`,
      message: `code must be one of: ${VALID_WARNING_CODES.join(', ')}`,
      value: warning.code,
    });
  }

  // Required: message (string)
  if (!isString(warning.message)) {
    errors.push({
      path: `${path}.message`,
      message: 'message must be a string',
      value: warning.message,
    });
  }

  // Optional: affectedSelectors (array of strings)
  if (warning.affectedSelectors !== undefined) {
    if (!isArray(warning.affectedSelectors)) {
      errors.push({
        path: `${path}.affectedSelectors`,
        message: 'affectedSelectors must be an array',
        value: warning.affectedSelectors,
      });
    } else {
      for (let i = 0; i < warning.affectedSelectors.length; i++) {
        if (!isString(warning.affectedSelectors[i])) {
          errors.push({
            path: `${path}.affectedSelectors[${i}]`,
            message: 'affectedSelectors items must be strings',
            value: warning.affectedSelectors[i],
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate viewport object.
 */
function validateViewport(viewport: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = 'viewport';

  if (!isObject(viewport)) {
    errors.push({ path, message: 'viewport must be an object', value: viewport });
    return errors;
  }

  // Required: width (integer)
  if (!isInteger(viewport.width)) {
    errors.push({
      path: `${path}.width`,
      message: 'width must be an integer',
      value: viewport.width,
    });
  }

  // Required: height (integer)
  if (!isInteger(viewport.height)) {
    errors.push({
      path: `${path}.height`,
      message: 'height must be an integer',
      value: viewport.height,
    });
  }

  return errors;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a VisualUIInspectorExport against Export Schema v1.
 * 
 * This is the primary validation function used by Safe-Run Gate 1.
 * Returns a ValidationResult with all errors found.
 * 
 * @param data - The data to validate
 * @returns ValidationResult with valid flag and list of errors
 */
export function validateExportSchemaV1(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Must be an object
  if (!isObject(data)) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Export must be an object', value: data }],
    };
  }

  // Required: exportVersion (must match current version)
  if (data.exportVersion !== EXPORT_SCHEMA_VERSION) {
    errors.push({
      path: 'exportVersion',
      message: `exportVersion must be "${EXPORT_SCHEMA_VERSION}"`,
      value: data.exportVersion,
    });
  }

  // Required: capturedAt (ISO 8601 date-time)
  if (!isValidISODate(data.capturedAt)) {
    errors.push({
      path: 'capturedAt',
      message: 'capturedAt must be a valid ISO 8601 date-time string',
      value: data.capturedAt,
    });
  }

  // Required: pageUrl (valid URI)
  if (!isValidURL(data.pageUrl)) {
    errors.push({
      path: 'pageUrl',
      message: 'pageUrl must be a valid URL',
      value: data.pageUrl,
    });
  }

  // Required: viewport (object with width and height)
  if (data.viewport === undefined) {
    errors.push({
      path: 'viewport',
      message: 'viewport is required',
      value: undefined,
    });
  } else {
    errors.push(...validateViewport(data.viewport));
  }

  // Required: patches (array of FinalPatch)
  if (!isArray(data.patches)) {
    errors.push({
      path: 'patches',
      message: 'patches must be an array',
      value: data.patches,
    });
  } else {
    for (let i = 0; i < data.patches.length; i++) {
      errors.push(...validateFinalPatch(data.patches[i], i));
    }
  }

  // Required: warnings (array of ExportWarning)
  if (!isArray(data.warnings)) {
    errors.push({
      path: 'warnings',
      message: 'warnings must be an array',
      value: data.warnings,
    });
  } else {
    for (let i = 0; i < data.warnings.length; i++) {
      errors.push(...validateWarning(data.warnings[i], i));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard to check if data is a valid VisualUIInspectorExport.
 * Use this for runtime type checking before using the data.
 */
export function isValidExport(data: unknown): data is VisualUIInspectorExport {
  return validateExportSchemaV1(data).valid;
}

/**
 * Assert that data is a valid export, throwing if validation fails.
 * Use this when you need to ensure validity and want an error on failure.
 */
export function assertValidExport(data: unknown): asserts data is VisualUIInspectorExport {
  const result = validateExportSchemaV1(data);
  if (!result.valid) {
    const errorMessages = result.errors.map(e => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Export Schema v1 validation failed: ${errorMessages}`);
  }
}

/**
 * Format validation errors as a human-readable string.
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return 'No errors';
  return errors.map(e => {
    const path = e.path || '(root)';
    return `- ${path}: ${e.message}`;
  }).join('\n');
}
