export type TimelineEventType = 'user_event' | 'state_update' | 'render' | 'error';

export interface TimelineEvent {
  id: string;
  ts: number;
  type: TimelineEventType;
  component?: string;
  file?: string;
  action?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}

export interface RuntimeEnvelope {
  source: 'dom-inspector-runtime';
  tabHintUrl?: string;
  event: TimelineEvent;
}

export interface TimelineSnapshot {
  source: 'dom-inspector-runtime';
  kind: 'error_snapshot';
  errorEvent: TimelineEvent;
  precedingEvents: TimelineEvent[];
}

export function isRuntimeEnvelope(value: unknown): value is RuntimeEnvelope {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<RuntimeEnvelope>;
  return v.source === 'dom-inspector-runtime' && !!v.event;
}
