## 2026-01-21 - Content Script Idle Performance
**Learning:** Content scripts matching `<all_urls>` run on every page. Event listeners (like `scroll`) must have an immediate early return if the feature is inactive to prevent unnecessary Main Thread overhead (e.g., RAF scheduling) on unrelated pages.
**Action:** Always verify "idle state" CPU usage for content scripts and add guard clauses at the very top of high-frequency event handlers.
