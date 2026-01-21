# Tasks for Tomorrow

## 1. Local Bridge Server (See `local_bridge_server_plan.md`)
- [ ] Scaffold the CLI tool.
- [ ] Implement basic "ping" server.

## 2. Refactor: Separate Empty State Component
- [ ] Create a new file: `src/sidepanel/components/InspectorEmptyState.tsx`.
- [ ] Extract the "Empty State" UI code (currently inline in `src/sidepanel/App.tsx`, lines ~497-522) into this new component.
- [ ] Move the relevant styles (`emptyState`, `emptyIcon`, `emptyTitle`, `emptyDescription`, `emptyAction`) from `App.tsx`'s `styles` object to `src/sidepanel/components/components.css`.
- [ ] Update `App.tsx` to import and use `<InspectorEmptyState />`.
- [ ] **Goal**: Keep `App.tsx` clean and ensure clear separation between "Inspector Active" and "Inspector Idle" states.
