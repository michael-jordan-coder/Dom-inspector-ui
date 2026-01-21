/**
 * Math Parser Utility
 * 
 * Evaluates simple math expressions in number inputs.
 * Supports: +, -, *, /, parentheses, and relative operations (+8, -4).
 */

/**
 * Result of parsing a math expression
 */
export interface MathParseResult {
  /** Whether the expression is valid */
  isValid: boolean;
  /** The computed numeric value (if valid) */
  value: number;
  /** Error message (if invalid) */
  error?: string;
  /** Whether this is a relative operation (+8, -4) */
  isRelative: boolean;
}

/**
 * Tokenize a math expression string
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let current = '';
  
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    
    if (char === ' ') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    
    if ('+-*/()'.includes(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    } else if (/[\d.]/.test(char)) {
      current += char;
    } else {
      // Invalid character
      return [];
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

/**
 * Check if a token is a number
 */
function isNumber(token: string): boolean {
  return !isNaN(parseFloat(token)) && isFinite(parseFloat(token));
}

/**
 * Evaluate a simple math expression using recursive descent parser
 * Handles operator precedence: * / before + -
 */
function evaluate(tokens: string[]): number {
  let pos = 0;
  
  function parseExpression(): number {
    let left = parseTerm();
    
    while (pos < tokens.length) {
      const op = tokens[pos];
      if (op !== '+' && op !== '-') break;
      pos++;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    
    return left;
  }
  
  function parseTerm(): number {
    let left = parseFactor();
    
    while (pos < tokens.length) {
      const op = tokens[pos];
      if (op !== '*' && op !== '/') break;
      pos++;
      const right = parseFactor();
      if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left = left / right;
      } else {
        left = left * right;
      }
    }
    
    return left;
  }
  
  function parseFactor(): number {
    const token = tokens[pos];
    
    if (token === '(') {
      pos++;
      const result = parseExpression();
      if (tokens[pos] !== ')') throw new Error('Missing closing parenthesis');
      pos++;
      return result;
    }
    
    if (token === '-') {
      pos++;
      return -parseFactor();
    }
    
    if (token === '+') {
      pos++;
      return parseFactor();
    }
    
    if (isNumber(token)) {
      pos++;
      return parseFloat(token);
    }
    
    throw new Error(`Unexpected token: ${token}`);
  }
  
  const result = parseExpression();
  
  if (pos < tokens.length) {
    throw new Error('Unexpected tokens at end');
  }
  
  return result;
}

/**
 * Parse and evaluate a math expression
 * 
 * @param expression - The expression string to evaluate
 * @param currentValue - The current value (for relative operations like +8, -4)
 * @returns Parse result with value or error
 */
export function evaluateMathExpression(
  expression: string,
  currentValue: number = 0
): MathParseResult {
  const trimmed = expression.trim();
  
  // Empty string
  if (!trimmed) {
    return { isValid: false, value: 0, error: 'Empty expression', isRelative: false };
  }
  
  // Check for percentage (convert to value)
  if (trimmed.endsWith('%')) {
    const percentValue = parseFloat(trimmed.slice(0, -1));
    if (!isNaN(percentValue)) {
      return { isValid: true, value: percentValue, isRelative: false };
    }
  }
  
  // Check for relative operations (+8, -4)
  const isRelative = /^[+-]\d/.test(trimmed);
  
  try {
    const tokens = tokenize(trimmed);
    
    if (tokens.length === 0) {
      return { isValid: false, value: 0, error: 'Invalid characters', isRelative: false };
    }
    
    let value: number;
    
    if (isRelative) {
      // For relative ops, prepend current value
      const relativeTokens = [String(currentValue), ...tokens];
      value = evaluate(relativeTokens);
    } else {
      value = evaluate(tokens);
    }
    
    // Round to avoid floating point precision issues
    value = Math.round(value * 10000) / 10000;
    
    return { isValid: true, value, isRelative };
  } catch (err) {
    return {
      isValid: false,
      value: currentValue,
      error: err instanceof Error ? err.message : 'Invalid expression',
      isRelative: false,
    };
  }
}

/**
 * Check if a string looks like a math expression (not just a plain number)
 */
export function isMathExpression(value: string): boolean {
  const trimmed = value.trim();
  
  // Plain number
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    return false;
  }
  
  // Contains operators or parentheses
  return /[+\-*/()]/.test(trimmed) || trimmed.endsWith('%');
}

/**
 * Format a computed result for ghost text display
 */
export function formatComputedPreview(result: MathParseResult): string {
  if (!result.isValid) return '';
  
  const value = result.value;
  
  // Format with appropriate precision
  if (Number.isInteger(value)) {
    return `= ${value}`;
  }
  
  return `= ${value.toFixed(2)}`;
}
