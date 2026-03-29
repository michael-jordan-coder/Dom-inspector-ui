## 2026-01-23 - HTMLCollection Iteration
**Learning:** Using `Array.from()` on `HTMLCollection` (like `element.children`) creates unnecessary O(N) memory allocation. In hot paths like selector generation or hierarchy extraction, this adds up.
**Action:** Use direct `for` loop iteration over `HTMLCollection` and `collection.length`.
