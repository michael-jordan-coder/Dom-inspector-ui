# Bolt's Journal

## 2024-05-22 - Initial Setup
**Learning:** Performance optimization requires a holistic view. Starting fresh.
**Action:** Always verify current state before optimizing.

## 2026-01-21 - DOM Traversal Optimizations
**Learning:** `Array.from(parent.children)` is a significant hidden cost (O(N) memory & CPU) when checking sibling indices or slicing early children in deep/wide DOM trees.
**Action:** Use `previousElementSibling` loops for index calculation and direct loop iteration for slicing children to achieve O(1) memory usage.
