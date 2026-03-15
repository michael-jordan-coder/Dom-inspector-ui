import type { TimelineEvent } from '../devtools-shared/events';
import { emitEvent } from './transport';
import { RingBuffer } from './ringBuffer';
import { safeSummary } from './serialize';

const buffer = new RingBuffer<TimelineEvent>(300);

function now(): number {
  return Date.now();
}

function mkEvent(partial: Omit<TimelineEvent, 'id' | 'ts'>): TimelineEvent {
  return {
    id: `${now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: now(),
    ...partial,
  };
}

function pushAndEmit(event: TimelineEvent): void {
  buffer.push(event);
  emitEvent(event);
}

function emitErrorSnapshot(errorEvent: TimelineEvent): void {
  const windowStart = errorEvent.ts - 5000;
  const precedingEvents = buffer.values().filter((e) => e.ts >= windowStart && e.ts <= errorEvent.ts);

  window.postMessage(
    {
      source: 'dom-inspector-runtime',
      kind: 'error_snapshot',
      errorEvent,
      precedingEvents,
    },
    '*'
  );
}

export function trackUserEvent(action: string, component?: string, file?: string, meta?: Record<string, unknown>): void {
  pushAndEmit(mkEvent({ type: 'user_event', action, component, file, summary: action, meta }));
}

export function trackRender(component: string, file?: string): void {
  pushAndEmit(mkEvent({ type: 'render', component, file, summary: `render(${component})` }));
}

export function trackStateUpdate(component: string, file: string | undefined, stateLabel: string, prev: unknown, next: unknown): void {
  pushAndEmit(
    mkEvent({
      type: 'state_update',
      component,
      file,
      action: stateLabel,
      summary: `${stateLabel}: ${safeSummary(prev)} → ${safeSummary(next)}`,
    })
  );
}

export function trackError(error: unknown, file?: string, component?: string): void {
  const message = error instanceof Error ? error.message : safeSummary(error);
  const event = mkEvent({ type: 'error', file, component, summary: message, meta: { stack: error instanceof Error ? error.stack : undefined } });
  pushAndEmit(event);
  emitErrorSnapshot(event);
}

export function installGlobalTracking(): void {
  const handler = (ev: Event) => {
    const target = ev.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase() ?? 'unknown';
    trackUserEvent(`${ev.type}:${tag}`, undefined, undefined, { tag });
  };

  ['click', 'input', 'submit'].forEach((type) => {
    window.addEventListener(type, handler, { capture: true, passive: true });
  });

  window.addEventListener('error', (ev) => {
    trackError(ev.error ?? ev.message ?? 'Unknown error');
  });

  window.addEventListener('unhandledrejection', (ev) => {
    trackError(ev.reason ?? 'Unhandled rejection');
  });
}
