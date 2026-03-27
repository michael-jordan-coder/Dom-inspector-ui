## 2024-05-22 - HTMLCollection to Array Performance
**Learning:** `Array.from(element.children)` is a significant performance bottleneck when the element has many children, especially if we only need a subset or an index. Allocating the array is expensive.
**Action:** Prefer direct iteration (e.g., `previousElementSibling` for index, `for` loop over `children` collection) when possible to avoid O(N) allocation.
