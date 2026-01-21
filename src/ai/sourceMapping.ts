/**
 * Source Mapping (G-004)
 * 
 * Implements source mapping from Phase 5:
 * - Maps runtime DOM elements to source code locations
 * - Uses allowed signals: unique class, data-attribute, source map, file naming
 * - Detects ambiguity and triggers STOP protocol when mapping is uncertain
 */

import type { RepoContext, SourceLocation } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Reliability level of a mapping signal
 */
export type SignalReliability = 'high' | 'medium' | 'low';

/**
 * A mapping signal used to identify source location
 */
export interface MappingSignal {
  type: MappingSignalType;
  value: string;
  reliability: SignalReliability;
  notes?: string;
}

export type MappingSignalType =
  | 'unique-class'      // Class name unique in codebase
  | 'data-attribute'    // data-testid, data-component, etc.
  | 'source-map'        // Direct source map mapping
  | 'component-name'    // Component structure matching
  | 'file-naming'       // Predictable naming convention
  | 'usage-search';     // Grep-style search (high false-positive risk)

/**
 * Result of source mapping attempt
 */
export interface SourceMappingResult {
  success: boolean;
  /** Source location if uniquely identified */
  location?: SourceLocation;
  /** Multiple candidate locations if ambiguous */
  candidates?: SourceCandidate[];
  /** Signals used to determine the mapping */
  signals: MappingSignal[];
  /** Ambiguity type if mapping failed */
  ambiguity?: AmbiguityType;
  /** Human-readable explanation */
  explanation: string;
}

/**
 * A candidate source location when ambiguous
 */
export interface SourceCandidate {
  location: SourceLocation;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Types of ambiguity that trigger STOP protocol
 */
export type AmbiguityType =
  | 'multiple-sources'      // Same class/style defined in 2+ files
  | 'dynamic-generation'    // CSS-in-JS with hash-based names
  | 'shared-styling'        // Class used by multiple unrelated components
  | 'inheritance-unclear'   // Cascading makes correct location unclear
  | 'opaque-system';        // Unknown styling system

// ============================================================================
// STOP Protocol (G-006)
// ============================================================================

/**
 * STOP Protocol result - returned when source mapping cannot proceed safely
 */
export interface StopProtocolResult {
  stopped: true;
  reason: string;
  ambiguityType: AmbiguityType;
  candidates: SourceCandidate[];
  recommendation: string;
}

/**
 * Generate a STOP protocol result with formatted message
 */
export function createStopResult(
  ambiguityType: AmbiguityType,
  candidates: SourceCandidate[],
  context?: string
): StopProtocolResult {
  const reasons: Record<AmbiguityType, string> = {
    'multiple-sources': 'Multiple source locations found for the target element.',
    'dynamic-generation': 'Element appears to be dynamically generated. Source mapping not possible.',
    'shared-styling': 'This class is shared across multiple elements. Changing it would affect all of them.',
    'inheritance-unclear': 'The computed style is a result of cascading and the correct location to modify is unclear.',
    'opaque-system': 'Styling system not recognized. Cannot safely determine where to apply changes.',
  };

  const recommendations: Record<AmbiguityType, string> = {
    'multiple-sources': 'Confirm which file is the intended owner of this style. If both apply, consider consolidating before applying changes.',
    'dynamic-generation': 'Add a unique class name or data-testid attribute to the element and re-inspect.',
    'shared-styling': 'Apply changes to each element individually or create a new class for this specific use case.',
    'inheritance-unclear': 'Specify which level of the cascade should receive the change.',
    'opaque-system': 'Manually identify the source file and provide it explicitly.',
  };

  return {
    stopped: true,
    reason: reasons[ambiguityType] + (context ? ` ${context}` : ''),
    ambiguityType,
    candidates,
    recommendation: recommendations[ambiguityType],
  };
}

/**
 * Format STOP result as human-readable message
 */
export function formatStopMessage(result: StopProtocolResult): string {
  const lines: string[] = [
    '## Cannot Modify Source Code',
    '',
    `**Reason:** ${result.reason}`,
    '',
  ];

  if (result.candidates.length > 0) {
    lines.push('**Candidates:**');
    result.candidates.forEach((candidate, i) => {
      lines.push(`${i + 1}. \`${candidate.location.file}:${candidate.location.line}\` — ${candidate.reasoning}`);
    });
    lines.push('');
  }

  lines.push(`**Recommendation:** ${result.recommendation}`);

  return lines.join('\n');
}

// ============================================================================
// Source Mapping Implementation
// ============================================================================

/**
 * Attempt to map a DOM element to its source code location.
 * 
 * Uses allowed signals from Phase 5:
 * - Unique class name (high reliability)
 * - Data attribute like data-testid (high reliability)
 * - Source map if available (high reliability)
 * - Component structure matching (medium reliability)
 * - File naming convention (medium reliability)
 * - Usage pattern search (low reliability)
 * 
 * @param selector - CSS selector of the element
 * @param classList - Element's class list
 * @param dataAttributes - Element's data attributes
 * @param repoContext - Repository context with file paths and styling system
 * @returns SourceMappingResult indicating success or ambiguity
 */
export function mapToSource(
  selector: string,
  classList: string[],
  dataAttributes: Record<string, string>,
  repoContext: RepoContext
): SourceMappingResult {
  const signals: MappingSignal[] = [];
  const candidates: SourceCandidate[] = [];

  // =========================================================================
  // Signal 1: Data Attributes (High Reliability)
  // =========================================================================
  
  const dataSignals = checkDataAttributes(dataAttributes, repoContext);
  signals.push(...dataSignals);
  
  const dataCandidate = dataSignals.find(s => s.reliability === 'high');
  if (dataCandidate) {
    // Found high-reliability data attribute, search for it
    const matches = searchForAttribute(dataCandidate.value, repoContext);
    if (matches.length === 1) {
      return {
        success: true,
        location: matches[0].location,
        signals,
        explanation: `Found unique match via ${dataCandidate.type}: ${dataCandidate.value}`,
      };
    } else if (matches.length > 1) {
      candidates.push(...matches);
    }
  }

  // =========================================================================
  // Signal 2: Unique Class Name (High Reliability if unique)
  // =========================================================================
  
  const classSignals = checkClassNames(classList, repoContext);
  signals.push(...classSignals);
  
  const uniqueClass = classSignals.find(s => s.reliability === 'high');
  if (uniqueClass) {
    const matches = searchForClass(uniqueClass.value, repoContext);
    if (matches.length === 1) {
      return {
        success: true,
        location: matches[0].location,
        signals,
        explanation: `Found unique match via class: ${uniqueClass.value}`,
      };
    } else if (matches.length > 1) {
      candidates.push(...matches);
    }
  }

  // =========================================================================
  // Signal 3: Source Map (High Reliability)
  // =========================================================================
  
  if (repoContext.sourceMap) {
    const sourceMapSignal = checkSourceMap(selector, repoContext);
    if (sourceMapSignal) {
      signals.push(sourceMapSignal);
      if (sourceMapSignal.reliability === 'high') {
        const location = repoContext.sourceMap.mappings[selector];
        if (location) {
          return {
            success: true,
            location,
            signals,
            explanation: 'Mapped directly via source map',
          };
        }
      }
    }
  }

  // =========================================================================
  // Signal 4: Component Structure (Medium Reliability)
  // =========================================================================
  
  const componentSignals = checkComponentStructure(classList, repoContext);
  signals.push(...componentSignals);
  
  for (const signal of componentSignals) {
    if (signal.reliability === 'medium') {
      const matches = searchForComponent(signal.value, repoContext);
      candidates.push(...matches);
    }
  }

  // =========================================================================
  // Signal 5: File Naming Convention (Medium Reliability)
  // =========================================================================
  
  const namingSignals = checkFileNaming(classList, repoContext);
  signals.push(...namingSignals);
  
  for (const signal of namingSignals) {
    if (signal.reliability === 'medium') {
      const matches = searchByNaming(signal.value, repoContext);
      candidates.push(...matches);
    }
  }

  // =========================================================================
  // Determine Result
  // =========================================================================

  // Deduplicate candidates
  const uniqueCandidates = deduplicateCandidates(candidates);

  // No candidates found
  if (uniqueCandidates.length === 0) {
    return {
      success: false,
      signals,
      ambiguity: 'opaque-system',
      candidates: [],
      explanation: 'Cannot identify source location for this element.',
    };
  }

  // Single candidate with sufficient confidence
  if (uniqueCandidates.length === 1 && uniqueCandidates[0].confidence >= 0.8) {
    return {
      success: true,
      location: uniqueCandidates[0].location,
      signals,
      explanation: uniqueCandidates[0].reasoning,
    };
  }

  // Multiple candidates - ambiguous
  const ambiguityType = detectAmbiguityType(uniqueCandidates, repoContext);
  return {
    success: false,
    signals,
    ambiguity: ambiguityType,
    candidates: uniqueCandidates,
    explanation: `Found ${uniqueCandidates.length} possible source locations. Cannot determine correct target.`,
  };
}

// ============================================================================
// Signal Checking Functions
// ============================================================================

function checkDataAttributes(
  attributes: Record<string, string>,
  _repoContext: RepoContext
): MappingSignal[] {
  const signals: MappingSignal[] = [];
  const highPriorityAttrs = ['data-testid', 'data-test-id', 'data-cy', 'data-component', 'data-id'];

  for (const attr of highPriorityAttrs) {
    if (attributes[attr]) {
      signals.push({
        type: 'data-attribute',
        value: `[${attr}="${attributes[attr]}"]`,
        reliability: 'high',
        notes: `Found ${attr} attribute`,
      });
    }
  }

  return signals;
}

function checkClassNames(
  classList: string[],
  _repoContext: RepoContext
): MappingSignal[] {
  const signals: MappingSignal[] = [];

  for (const className of classList) {
    // Skip utility classes (Tailwind-like)
    if (isUtilityClass(className)) {
      signals.push({
        type: 'unique-class',
        value: className,
        reliability: 'low',
        notes: 'Utility class, likely shared',
      });
      continue;
    }

    // CSS Module-style classes (with hash suffix)
    if (isCSSModuleClass(className)) {
      signals.push({
        type: 'unique-class',
        value: className,
        reliability: 'high',
        notes: 'CSS Module hash-based class',
      });
      continue;
    }

    // BEM-style or component-scoped classes
    if (isBEMClass(className)) {
      signals.push({
        type: 'unique-class',
        value: className,
        reliability: 'medium',
        notes: 'BEM-style class',
      });
      continue;
    }

    // Generic class
    signals.push({
      type: 'unique-class',
      value: className,
      reliability: 'low',
      notes: 'Generic class name',
    });
  }

  return signals;
}

function checkSourceMap(
  selector: string,
  repoContext: RepoContext
): MappingSignal | null {
  if (!repoContext.sourceMap) return null;
  
  if (repoContext.sourceMap.mappings[selector]) {
    return {
      type: 'source-map',
      value: selector,
      reliability: 'high',
      notes: 'Direct source map mapping available',
    };
  }
  
  return null;
}

function checkComponentStructure(
  classList: string[],
  _repoContext: RepoContext
): MappingSignal[] {
  const signals: MappingSignal[] = [];

  // Extract component name from class (e.g., "Button_root__abc123" -> "Button")
  for (const className of classList) {
    const match = className.match(/^([A-Z][a-zA-Z]+)_/);
    if (match) {
      signals.push({
        type: 'component-name',
        value: match[1],
        reliability: 'medium',
        notes: `Component name extracted: ${match[1]}`,
      });
    }
  }

  return signals;
}

function checkFileNaming(
  classList: string[],
  repoContext: RepoContext
): MappingSignal[] {
  const signals: MappingSignal[] = [];

  // Check if styling system uses predictable naming
  if (repoContext.stylingSystem === 'css-modules') {
    for (const className of classList) {
      const baseName = className.split('_')[0];
      if (baseName) {
        signals.push({
          type: 'file-naming',
          value: `${baseName}.module.css`,
          reliability: 'medium',
          notes: `Predicted file: ${baseName}.module.css`,
        });
      }
    }
  }

  return signals;
}

// ============================================================================
// Search Functions (Simulated - would integrate with actual file system)
// ============================================================================

function searchForAttribute(
  _attributeSelector: string,
  _repoContext: RepoContext
): SourceCandidate[] {
  // In a real implementation, this would search the file system
  // For now, return empty as a placeholder
  return [];
}

function searchForClass(
  _className: string,
  _repoContext: RepoContext
): SourceCandidate[] {
  // In a real implementation, this would grep for the class in CSS/JS files
  return [];
}

function searchForComponent(
  _componentName: string,
  _repoContext: RepoContext
): SourceCandidate[] {
  // In a real implementation, this would search for component definitions
  return [];
}

function searchByNaming(
  _fileName: string,
  _repoContext: RepoContext
): SourceCandidate[] {
  // In a real implementation, this would find files matching the pattern
  return [];
}

// ============================================================================
// Helper Functions
// ============================================================================

function isUtilityClass(className: string): boolean {
  // Common Tailwind patterns
  const utilityPatterns = [
    /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-/,
    /^(w|h|min-w|max-w|min-h|max-h)-/,
    /^(flex|grid|block|inline|hidden)/,
    /^(text|bg|border|rounded)-/,
    /^(justify|items|content|self)-/,
    /^(gap|space)-/,
    /^(font|leading|tracking)-/,
    /^(opacity|z)-/,
  ];
  return utilityPatterns.some(p => p.test(className));
}

function isCSSModuleClass(className: string): boolean {
  // CSS Modules typically append a hash
  return /_[a-zA-Z0-9]{5,}$/.test(className);
}

function isBEMClass(className: string): boolean {
  // BEM: block__element--modifier
  return /__/.test(className) || /--/.test(className);
}

function detectAmbiguityType(
  candidates: SourceCandidate[],
  repoContext: RepoContext
): AmbiguityType {
  // Check for multiple files defining same style
  const files = new Set(candidates.map(c => c.location.file));
  if (files.size > 1) {
    return 'multiple-sources';
  }

  // Check for shared styling
  if (candidates.some(c => c.reasoning.includes('shared'))) {
    return 'shared-styling';
  }

  // Check for dynamic generation
  if (repoContext.stylingSystem === 'styled-components' || 
      repoContext.stylingSystem === 'emotion') {
    return 'dynamic-generation';
  }

  // Default to inheritance unclear
  return 'inheritance-unclear';
}

function deduplicateCandidates(candidates: SourceCandidate[]): SourceCandidate[] {
  const seen = new Set<string>();
  const unique: SourceCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.location.file}:${candidate.location.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(candidate);
    }
  }

  // Sort by confidence descending
  return unique.sort((a, b) => b.confidence - a.confidence);
}

// Re-export SourceLocation for convenience
export type { SourceLocation };
