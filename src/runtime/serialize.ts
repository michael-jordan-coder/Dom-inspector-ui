export function safeSummary(value: unknown, depth = 0): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return '[Function]';
  if (depth > 1) return '[Object]';

  if (Array.isArray(value)) {
    return `[${value.slice(0, 5).map((v) => safeSummary(v, depth + 1)).join(', ')}${value.length > 5 ? ', ...' : ''}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 5);
    return `{${entries.map(([k, v]) => `${k}: ${safeSummary(v, depth + 1)}`).join(', ')}${Object.keys(value as object).length > 5 ? ', ...' : ''}}`;
  }

  return '[Unserializable]';
}
