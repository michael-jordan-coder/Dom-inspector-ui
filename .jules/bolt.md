## 2026-01-22 - [DOM Collection Iteration]
**Learning:** `Array.from()` on `HTMLCollection` or `NodeList` allocates an array for all items, even if we only need a few or iterate sequentially. This is O(N) memory and time.
**Action:** Use direct property access (`element.children[i]`), `previousElementSibling` loop, or iterate `childNodes` directly with early exit for performance-critical DOM traversal.
