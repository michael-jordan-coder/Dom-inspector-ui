## 2024-05-22 - DOM Traversal Optimization
**Learning:** `Array.from(element.children)` forces immediate iteration and allocation of all children, which is disastrous for large DOM nodes (e.g., 5000+ children) even if you slice it later.
**Action:** Use `for` loop over `element.children` with an index limit, or walk `previousElementSibling` for index calculation to avoid O(N) allocation.
