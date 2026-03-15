import { useEffect, useMemo, useState } from 'react';
import type { RuntimeEnvelope, TimelineEvent, TimelineSnapshot } from '../../devtools-shared/events';
import { normalizeEvents } from './normalize';

export function App() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const port = chrome.runtime.connect({ name: `devtools-panel:${tabId}` });

    const onMessage = (message: { payload?: unknown }) => {
      const payload = message.payload;
      if (!payload || typeof payload !== 'object') return;

      const maybeSnapshot = payload as Partial<TimelineSnapshot>;
      if (maybeSnapshot.kind === 'error_snapshot' && Array.isArray(maybeSnapshot.precedingEvents) && maybeSnapshot.errorEvent) {
        setEvents([...maybeSnapshot.precedingEvents, maybeSnapshot.errorEvent as TimelineEvent]);
        return;
      }

      const maybeEnvelope = payload as Partial<RuntimeEnvelope>;
      if (maybeEnvelope.source === 'dom-inspector-runtime' && maybeEnvelope.event) {
        setEvents((prev) => [...prev.slice(-299), maybeEnvelope.event as TimelineEvent]);
      }
    };

    port.onMessage.addListener(onMessage);
    return () => {
      port.onMessage.removeListener(onMessage);
      port.disconnect();
    };
  }, []);

  const rows = useMemo(() => normalizeEvents(events), [events]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: 10 }}>
      <h2 style={{ marginTop: 0 }}>React Error Timeline (last ~5s)</h2>
      <p style={{ opacity: 0.7, marginTop: 0 }}>Events: {rows.length}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row) => (
          <div key={row.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8, background: row.type === 'error' ? '#ffe9e9' : 'white' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>+{row.relativeMs}ms · {row.type}</div>
            <div><strong>{row.summary ?? row.action ?? row.type}</strong></div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{row.component ?? 'unknown component'} {row.file ? `(${row.file})` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
