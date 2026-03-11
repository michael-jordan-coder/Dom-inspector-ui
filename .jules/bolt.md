## 2024-05-23 - DOM Traversal Performance
**Learning:** `Array.from(element.children)` creates an O(N) memory allocation and iterates the entire collection, which is expensive for large DOM trees (e.g. 5000+ items).
**Action:** Use direct loop iteration on `HTMLCollection` or `previousElementSibling` linked-list traversal for hot paths to keep memory O(1).
