## 2026-01-21 - [DOM Collection Allocation]
**Learning:** `Array.from(element.children)` or `Array.from(element.childNodes)` is heavily used in hot paths (`hierarchy.ts`, `selector.ts`). This allocates O(N) arrays even for small operations (taking first 20 items or checking siblings).
**Action:** Prefer `element.children[i]` loop or `previousElementSibling` traversal. This avoids array allocation and provided a ~234x speedup in `extractChildrenSummaries` benchmark.
