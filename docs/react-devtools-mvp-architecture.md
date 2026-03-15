# React DevTools Timeline MVP Architecture

## Architecture Summary

This MVP adds a **DevTools-only timeline pipeline** with strict module boundaries:

1. **Instrumentation (demo build-time)**
   - Vite + Babel plugin rewrites common `useState` / `useReducer` hook calls to tracked runtime hooks.
   - Babel plugin injects a render trace call at the top of function components where safely detectable.
2. **Runtime Client (in instrumented app)**
   - Captures events for user interactions, state updates, render traces, and errors.
   - Emits normalized runtime events to `window.postMessage`.
3. **Transport Bridge**
   - Content script listens to app `window.postMessage` events and forwards to extension background.
   - Service worker fans out events to connected DevTools panel ports keyed by inspected tab.
4. **Buffer / Storage**
   - Runtime maintains a fixed-size rolling ring buffer for the latest ~5s window source events.
   - DevTools panel keeps its own local rolling event list for display.
5. **Timeline Normalization**
   - Runtime serializes values safely and normalizes event payload contracts.
   - Panel re-normalizes with relative time and display metadata.
6. **DevTools UI**
   - Custom Chrome DevTools panel shows ordered timeline events and error markers.
7. **Demo App**
   - React + Vite app intentionally throws after a short user interaction chain.

## Event Schema

```ts
interface TimelineEvent {
  id: string;
  ts: number; // epoch ms
  type: 'user_event' | 'state_update' | 'render' | 'error';
  component?: string;
  file?: string;
  action?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}
```

## Buffering Strategy

- Runtime uses a ring buffer sized for low overhead (`maxEvents` default 300).
- Event fetch on error returns `events.filter(e.ts >= errorTs - 5000)`.
- Serialized payloads are stringified with depth/key limits to avoid heavy traversal.

## Source Mapping Strategy

- Babel instrumentation includes source file and line (`file:line`) where hook usage is transformed.
- Component names come from function declaration names or nearest fallback.
- If precise resolution fails, runtime marks `component` / `file` as `unknown`.

## Dev Attach Flow (Local)

1. Start demo dev server (`npm run dev`).
2. Build/load extension (`npm run build`, load `dist/` in Chrome).
3. Open demo app in tab.
4. Open Chrome DevTools on that tab and select **React Error Timeline** panel.
5. Trigger demo error flow to view the preceding timeline.

## Concrete File Tree (new files)

```text
src/devtools/
  devtoolsPage.html
  devtoolsPage.ts
  panel.html
  panel/main.tsx
  panel/App.tsx
  panel/types.ts
  panel/normalize.ts
src/content/devtoolsBridge.ts
src/devtools-shared/events.ts

src/runtime/
  eventTypes.ts
  ringBuffer.ts
  serialize.ts
  transport.ts
  client.ts
  reactTracking.ts

demo/
  index.html
  vite.config.ts
  src/main.tsx
  src/App.tsx
  src/ThrowingDemo.tsx
  src/errorBoundary.tsx
```

## Risk List

- **Instrumentation coverage risk:** non-standard hook usage patterns are not transformed.
- **Component/file attribution risk:** anonymous components or transformed code may degrade labels.
- **Cross-context bridge risk:** if the page blocks scripts or changes CSP/runtime context assumptions, message bridging may degrade.
- **DevTools lifecycle risk:** panel disconnect/reconnect can drop in-flight events (acceptable for MVP).
- **Performance risk:** high-frequency input events can be noisy; currently sampled by event type and lightweight serialization.
