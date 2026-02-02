# Bolt's Journal

## 2026-01-21 - Avoid Array.from on HTMLCollection
**Learning:** `Array.from(element.children)` allocates an O(N) array. For large lists (e.g., 10k items), this is expensive memory-wise even if we only need the first 20 items or are searching for an index.
**Action:** Use direct `for` loop iteration on `HTMLCollection` and `NodeList` when slicing or finding indices, especially in hot paths like DOM hierarchy extraction.
