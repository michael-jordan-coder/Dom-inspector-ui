import type { TimelineEvent } from '../../devtools-shared/events';
import type { TimelineRow } from './types';

export function normalizeEvents(events: TimelineEvent[]): TimelineRow[] {
  if (events.length === 0) return [];
  const minTs = Math.min(...events.map((e) => e.ts));
  return [...events]
    .sort((a, b) => a.ts - b.ts)
    .map((e) => ({
      ...e,
      relativeMs: e.ts - minTs,
    }));
}
