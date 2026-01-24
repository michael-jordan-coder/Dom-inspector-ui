## 2026-01-24 - Missing Dependency Blocking Optimization
**Learning:** `src/sidepanel/primitives/AnimatedIcons.tsx` imported `framer-motion` which was not in `package.json`. This prevented building and verifying performance changes.
**Action:** When a heavy UI library is missing and causing build failures, replacing it with existing lightweight alternatives (like `@tabler/icons-react`) is a dual-win: fixes the build and optimizes bundle size.
