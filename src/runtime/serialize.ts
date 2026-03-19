export function safeSummary(value: unknown, depth = 0, seen?: WeakSet<object>): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return '[Function]';
  if (depth > 1) return '[Object]';

  if (typeof value === 'object') {
    const s = seen ?? new WeakSet<object>();
    if (s.has(value as object)) return '[Circular]';
    s.add(value as object);

    if (Array.isArray(value)) {
      return `[${value.slice(0, 5).map((v) => safeSummary(v, depth + 1, s)).join(', ')}${value.length > 5 ? ', ...' : ''}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>).slice(0, 5);
    return `{${entries.map(([k, v]) => `${k}: ${safeSummary(v, depth + 1, s)}`).join(', ')}${Object.keys(value as object).length > 5 ? ', ...' : ''}}`;
  }

  return '[Unserializable]';
}
