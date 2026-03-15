# Verification Checklist (Thin Vertical Slices)

## Slice 1: Error capture + ring buffer
- [x] Global `error` + `unhandledrejection` listeners installed in runtime client.
- [x] Error emits include a 5-second preceding-event snapshot.
- Limitation: React render-phase exceptions are most reliably captured via `DemoErrorBoundary`.

## Slice 2: User events
- [x] Runtime captures `click`, `input`, `submit` at capture phase.
- [x] Events include action summary and target tag metadata.
- Limitation: high-frequency input can be noisy (currently no debounce/sampling).

## Slice 3: Render detection
- [x] Babel instrumentation injects `trackComponentRender(...)` in named function components.
- Limitation: anonymous/indirect component patterns may not be auto-instrumented.

## Slice 4: State-update instrumentation
- [x] Babel rewrites common `useState` and `useReducer` call patterns to tracked wrappers.
- [x] Timeline rows include safe changed-value summaries.
- Limitation: custom hooks and complex alias patterns are not fully covered in MVP.

## Slice 5: DevTools panel UI
- [x] Added custom DevTools panel entry: **React Error Timeline**.
- [x] Panel receives bridged runtime events and renders ordered timeline rows.
- Limitation: panel keeps local rolling history only; no persistent storage across reopen.

## Slice 6: Demo flow (intentional crash)
- [x] Added React + Vite demo with reproducible interaction chain and intentional throw.
- [x] Demo error boundary records thrown errors into the runtime timeline.

## Manual test steps
1. `npm install`
2. `npm run build` (build extension)
3. Load `dist/` as unpacked extension in Chrome.
4. `npm run dev` and open `http://localhost:5173`.
5. Open Chrome DevTools on the demo tab and switch to **React Error Timeline** panel.
6. In the app: type in input → click **Advance** → click **Trigger final step**.
7. Confirm timeline shows the sequence and error with preceding ~5 seconds.
