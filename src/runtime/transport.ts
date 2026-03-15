import type { RuntimeEnvelope, TimelineEvent } from '../devtools-shared/events';

export function emitEvent(event: TimelineEvent): void {
  const envelope: RuntimeEnvelope = {
    source: 'dom-inspector-runtime',
    tabHintUrl: window.location.href,
    event,
  };
  window.postMessage(envelope, '*');
}
