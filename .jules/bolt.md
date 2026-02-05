# Bolt's Journal

## 2024-05-22 - [Initial Entry]
**Learning:** Performance optimizations should be driven by measurements.
**Action:** Always verify with benchmarks or profiling.

## 2024-05-22 - [DOM Traversal Allocation]
**Learning:** `Array.from(parent.children)` is an O(N) allocation trap in DOM traversal hot paths. Linked-list traversal (`previousElementSibling`) is allocation-free and O(K).
**Action:** Use `previousElementSibling` loops for index calculation and sibling traversal.
