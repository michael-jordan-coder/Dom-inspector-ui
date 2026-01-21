# 🎯 Overlay Toolbar & Element Hierarchy Navigation

> **Objective**: Implement an in-page overlay toolbar and element hierarchy navigation system that allows users to quickly edit selected elements and drill down into child elements.

---

## 📋 Feature Overview

### What We're Building

1. **Overlay Toolbar** — A floating toolbar that appears directly on/near the selected element on the page
2. **Element Hierarchy Navigation** — Breadcrumb + children list in the sidepanel + keyboard/click navigation
3. **Parent/Child Selection** — Ability to drill down into nested elements and navigate up to parents

### Architecture Split

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Overlay Toolbar | **Content Script** (injected into page) | Quick edit controls on the element |
| Hierarchy Breadcrumb | **Side Panel** | Show current path, click to navigate |
| Children List | **Side Panel** | List child elements, click to select |
| Navigation Logic | **Side Panel + Content Script** | Handle parent/child/sibling navigation |

---

## 🏗️ Implementation Specification

### Part 1: Overlay Toolbar (Content Script)

#### 1.1 Toolbar Structure

```tsx
interface OverlayToolbarProps {
  element: HTMLElement;
  position: 'above' | 'below' | 'auto';
  onNavigateParent: () => void;
  onNavigateChild: (index: number) => void;
  onPropertyChange: (property: string, value: string) => void;
  onClose: () => void;
}
```

#### 1.2 Toolbar Controls (Context-Aware)

**Always Visible:**
```
┌────────────────────────────────────────────────────────────────────┐
│ [↑][↓] │ <element.tag> │ [🎨 Fill] [✎ Stroke] │ [⛶ Expand] │ [✕]  │
└────────────────────────────────────────────────────────────────────┘
```

**For Text Elements (has textContent):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [↑][↓] │ Font ▾ │ ■ Color │ −[16]+  │ B I U │ ≡ Align ▾ │ ↔ Spacing │ [⛶] │
└─────────────────────────────────────────────────────────────────────────────┘
```

**For Container Elements (has children):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [↑][↓] │ Display ▾ │ Gap −[12]+ │ Padding −[16]+ │ ■ Fill │ ⌗ Radius │ [⛶] │
└──────────────────────────────────────────────────────────────────────────┘
```

**For Image Elements:**
```
┌────────────────────────────────────────────────────────────────────┐
│ [↑][↓] │ Fit ▾ │ W −[200]+ │ H −[150]+ │ Opacity │ ⌗ Radius │ [⛶] │
└────────────────────────────────────────────────────────────────────┘
```

#### 1.3 Positioning Logic

```typescript
function calculateToolbarPosition(
  element: HTMLElement,
  toolbarHeight: number = 44
): { top: number; left: number; position: 'above' | 'below' } {
  const rect = element.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  
  // Prefer below the element
  let top = rect.bottom + 8;
  let position: 'above' | 'below' = 'below';
  
  // If not enough space below, position above
  if (top + toolbarHeight > viewport.height - 20) {
    top = rect.top - toolbarHeight - 8;
    position = 'above';
  }
  
  // If still not visible (element at very top), position below anyway
  if (top < 20) {
    top = rect.bottom + 8;
    position = 'below';
  }
  
  // Center horizontally, but keep within viewport
  let left = rect.left + (rect.width / 2);
  const toolbarWidth = 400; // Approximate
  left = Math.max(toolbarWidth / 2 + 10, Math.min(left, viewport.width - toolbarWidth / 2 - 10));
  
  return { top, left, position };
}
```

#### 1.4 Style Isolation (Shadow DOM)

```typescript
function createToolbarContainer(): HTMLElement {
  const host = document.createElement('div');
  host.id = 'ui-inspector-overlay';
  host.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    pointer-events: none;
  `;
  
  const shadow = host.attachShadow({ mode: 'closed' });
  
  // Inject toolbar styles
  const style = document.createElement('style');
  style.textContent = getToolbarStyles();
  shadow.appendChild(style);
  
  // Toolbar container
  const toolbar = document.createElement('div');
  toolbar.className = 'overlay-toolbar';
  toolbar.style.pointerEvents = 'auto';
  shadow.appendChild(toolbar);
  
  document.body.appendChild(host);
  return toolbar;
}
```

#### 1.5 Toolbar Styles

```css
.overlay-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #1f1f23;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  font-size: 12px;
  color: #e5e5e5;
  transform: translateX(-50%);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.toolbar-btn.active {
  background: #6366f1;
  color: white;
}

.toolbar-number {
  display: flex;
  align-items: center;
  background: #2a2a2e;
  border-radius: 6px;
  overflow: hidden;
}

.toolbar-number button {
  width: 24px;
  height: 26px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}

.toolbar-number button:hover {
  background: rgba(99, 102, 241, 0.2);
  color: white;
}

.toolbar-number span {
  min-width: 32px;
  text-align: center;
  font-size: 12px;
  color: #e5e5e5;
  font-weight: 500;
}

.toolbar-color {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: border-color 0.15s;
}

.toolbar-color:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.toolbar-select {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #2a2a2e;
  border: none;
  border-radius: 6px;
  color: #e5e5e5;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.toolbar-select:hover {
  background: #3a3a3e;
}

.toolbar-tag {
  font-size: 11px;
  color: #818cf8;
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 4px;
}
```

---

### Part 2: Element Hierarchy Navigation (Side Panel)

#### 2.1 Data Structures

```typescript
// Add to shared/types.ts
interface ElementHierarchy {
  /** Current element info */
  current: ElementMetadata;
  
  /** Parent element (null if at root, e.g., body) */
  parent: ElementMetadata | null;
  
  /** Direct children of current element */
  children: ChildElementSummary[];
  
  /** Breadcrumb path from root to current */
  breadcrumb: BreadcrumbItem[];
}

interface ChildElementSummary {
  /** Unique selector for this child */
  selector: string;
  /** Tag name (div, span, p, etc.) */
  tagName: string;
  /** Class name preview (first class or id) */
  classPreview: string;
  /** Text content preview (for text elements) */
  textPreview?: string;
  /** Whether this child has nested children */
  hasChildren: boolean;
  /** Number of children */
  childCount: number;
}

interface BreadcrumbItem {
  selector: string;
  tagName: string;
  label: string; // "div.card" or "body"
}
```

#### 2.2 Hierarchy Extraction (Content Script)

```typescript
// content/hierarchyUtils.ts

export function extractHierarchy(element: HTMLElement): ElementHierarchy {
  return {
    current: extractElementMetadata(element),
    parent: element.parentElement ? extractParentSummary(element.parentElement) : null,
    children: extractChildrenSummaries(element),
    breadcrumb: extractBreadcrumb(element),
  };
}

function extractChildrenSummaries(element: HTMLElement): ChildElementSummary[] {
  const children = Array.from(element.children) as HTMLElement[];
  
  return children.slice(0, 20).map((child, index) => ({
    selector: generateSelector(child),
    tagName: child.tagName.toLowerCase(),
    classPreview: child.className?.split(' ')[0] || child.id ? `#${child.id}` : '',
    textPreview: getTextPreview(child),
    hasChildren: child.children.length > 0,
    childCount: child.children.length,
  }));
}

function getTextPreview(element: HTMLElement): string | undefined {
  // Only return text if element has direct text content (not just child elements)
  const textNodes = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent?.trim())
    .filter(Boolean);
  
  if (textNodes.length === 0) return undefined;
  
  const text = textNodes.join(' ').slice(0, 40);
  return text.length === 40 ? text + '...' : text;
}

function extractBreadcrumb(element: HTMLElement): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body.parentElement) {
    path.unshift({
      selector: generateSelector(current),
      tagName: current.tagName.toLowerCase(),
      label: getBreadcrumbLabel(current),
    });
    current = current.parentElement;
  }
  
  return path;
}

function getBreadcrumbLabel(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  if (element.id) return `${tag}#${element.id}`;
  if (element.className) {
    const firstClass = element.className.split(' ')[0];
    return `${tag}.${firstClass}`;
  }
  return tag;
}
```

#### 2.3 Side Panel Breadcrumb Component

```tsx
// sidepanel/components/ElementBreadcrumb.tsx

interface ElementBreadcrumbProps {
  breadcrumb: BreadcrumbItem[];
  onSelect: (selector: string) => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  canNavigateUp: boolean;
  canNavigateDown: boolean;
}

export function ElementBreadcrumb({
  breadcrumb,
  onSelect,
  onNavigateUp,
  onNavigateDown,
  canNavigateUp,
  canNavigateDown,
}: ElementBreadcrumbProps): React.ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.path}>
        {breadcrumb.map((item, index) => (
          <React.Fragment key={item.selector}>
            {index > 0 && <span style={styles.separator}>›</span>}
            <button
              style={{
                ...styles.item,
                ...(index === breadcrumb.length - 1 ? styles.itemCurrent : {}),
              }}
              onClick={() => onSelect(item.selector)}
              title={item.selector}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      
      <div style={styles.navButtons}>
        <button
          style={styles.navBtn}
          onClick={onNavigateUp}
          disabled={!canNavigateUp}
          title="Select parent (↑)"
        >
          ↑
        </button>
        <button
          style={styles.navBtn}
          onClick={onNavigateDown}
          disabled={!canNavigateDown}
          title="Select first child (↓)"
        >
          ↓
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: colors.surfaceRaised,
    borderBottom: `1px solid ${colors.border}`,
    gap: spacing[2],
  } as React.CSSProperties,
  
  path: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
    overflowX: 'auto',
    fontSize: 12,
  } as React.CSSProperties,
  
  separator: {
    color: colors.textMuted,
    flexShrink: 0,
  } as React.CSSProperties,
  
  item: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    padding: '4px 8px',
    borderRadius: radii.sm,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: transitions.fast,
    fontSize: 12,
  } as React.CSSProperties,
  
  itemCurrent: {
    backgroundColor: colors.accent,
    color: colors.text,
  } as React.CSSProperties,
  
  navButtons: {
    display: 'flex',
    gap: 2,
    flexShrink: 0,
  } as React.CSSProperties,
  
  navBtn: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: colors.surface,
    color: colors.textMuted,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
};
```

#### 2.4 Children List Component

```tsx
// sidepanel/components/ChildrenList.tsx

interface ChildrenListProps {
  children: ChildElementSummary[];
  onSelect: (selector: string) => void;
}

export function ChildrenList({
  children,
  onSelect,
}: ChildrenListProps): React.ReactElement | null {
  if (children.length === 0) return null;
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Children</span>
        <span style={styles.count}>{children.length}</span>
      </div>
      
      <div style={styles.list}>
        {children.map((child) => (
          <button
            key={child.selector}
            style={styles.item}
            onClick={() => onSelect(child.selector)}
            title={child.selector}
          >
            <span style={styles.tag}>{child.tagName}</span>
            <span style={styles.preview}>
              {child.textPreview || child.classPreview || ''}
            </span>
            {child.hasChildren && (
              <span style={styles.childIndicator}>
                {child.childCount} ›
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### Part 3: Navigation Logic

#### 3.1 Messaging Protocol

```typescript
// Add to shared/messages.ts

interface NavigateToParentMessage {
  type: 'NAVIGATE_PARENT';
}

interface NavigateToChildMessage {
  type: 'NAVIGATE_CHILD';
  payload: { index: number };
}

interface NavigateToSelectorMessage {
  type: 'NAVIGATE_SELECTOR';
  payload: { selector: string };
}

interface HierarchyUpdatedMessage {
  type: 'HIERARCHY_UPDATED';
  payload: ElementHierarchy;
}
```

#### 3.2 Content Script Navigation Handlers

```typescript
// content/navigation.ts

let currentElement: HTMLElement | null = null;

export function navigateToParent(): boolean {
  if (!currentElement || !currentElement.parentElement) return false;
  if (currentElement.parentElement === document.body.parentElement) return false;
  
  selectElement(currentElement.parentElement);
  return true;
}

export function navigateToChild(index: number = 0): boolean {
  if (!currentElement) return false;
  
  const children = Array.from(currentElement.children) as HTMLElement[];
  if (children.length === 0 || index >= children.length) return false;
  
  selectElement(children[index]);
  return true;
}

export function navigateToSibling(direction: 'prev' | 'next'): boolean {
  if (!currentElement || !currentElement.parentElement) return false;
  
  const siblings = Array.from(currentElement.parentElement.children) as HTMLElement[];
  const currentIndex = siblings.indexOf(currentElement);
  
  const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  if (newIndex < 0 || newIndex >= siblings.length) return false;
  
  selectElement(siblings[newIndex]);
  return true;
}

function selectElement(element: HTMLElement): void {
  currentElement = element;
  
  // Update highlight
  updateHighlight(element);
  
  // Extract and send hierarchy
  const hierarchy = extractHierarchy(element);
  sendToSidePanel({ type: 'HIERARCHY_UPDATED', payload: hierarchy });
  
  // Update overlay toolbar position
  updateOverlayToolbar(element);
}
```

#### 3.3 Keyboard Navigation (Side Panel)

```typescript
// Add to App.tsx keyboard handler

// Arrow key navigation (when not in input)
if (!isTyping) {
  // ↑ - Select parent
  if (e.key === 'ArrowUp' && e.altKey) {
    e.preventDefault();
    await navigateToParent();
    return;
  }
  
  // ↓ - Select first child
  if (e.key === 'ArrowDown' && e.altKey) {
    e.preventDefault();
    await navigateToChild(0);
    return;
  }
  
  // ← - Select previous sibling
  if (e.key === 'ArrowLeft' && e.altKey) {
    e.preventDefault();
    await navigateToSibling('prev');
    return;
  }
  
  // → - Select next sibling
  if (e.key === 'ArrowRight' && e.altKey) {
    e.preventDefault();
    await navigateToSibling('next');
    return;
  }
}
```

---

### Part 4: Double-Click Drill-Down

#### 4.1 Content Script Click Handler

```typescript
// content/picker.ts - Modify existing click handler

let clickCount = 0;
let clickTimer: number | null = null;
let lastClickedElement: HTMLElement | null = null;

function handleElementClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.target as HTMLElement;
  
  // Double-click detection
  if (lastClickedElement === target) {
    clickCount++;
  } else {
    clickCount = 1;
    lastClickedElement = target;
  }
  
  if (clickTimer) clearTimeout(clickTimer);
  
  clickTimer = window.setTimeout(() => {
    if (clickCount === 1) {
      // Single click - select this element
      selectElement(target);
    } else if (clickCount >= 2) {
      // Double click - drill down to deepest child under cursor
      const deepestChild = getDeepestElementAtPoint(e.clientX, e.clientY);
      if (deepestChild && deepestChild !== target) {
        selectElement(deepestChild);
      }
    }
    clickCount = 0;
  }, 250); // 250ms to detect double-click
}

function getDeepestElementAtPoint(x: number, y: number): HTMLElement | null {
  // Get all elements at this point
  const elements = document.elementsFromPoint(x, y) as HTMLElement[];
  
  // Filter out our overlay and return the deepest element
  return elements.find(el => 
    !el.closest('#ui-inspector-overlay') && 
    el !== document.body &&
    el !== document.documentElement
  ) || null;
}
```

---

## 📁 File Structure

```
src/
├── content/
│   ├── overlayToolbar.ts       # NEW: Overlay toolbar injection & logic
│   ├── overlayToolbar.css      # NEW: Toolbar styles (or inline in Shadow DOM)
│   ├── hierarchyUtils.ts       # NEW: Extract parent/children/breadcrumb
│   ├── navigation.ts           # NEW: Parent/child/sibling navigation
│   └── picker.ts               # MODIFY: Add double-click drill-down
├── sidepanel/
│   ├── components/
│   │   ├── ElementBreadcrumb.tsx   # NEW: Breadcrumb navigation
│   │   ├── ChildrenList.tsx        # NEW: Children list section
│   │   └── SelectedSummary.tsx     # MODIFY: Add hierarchy preview
│   └── App.tsx                     # MODIFY: Wire up hierarchy state
└── shared/
    ├── types.ts                # MODIFY: Add hierarchy types
    └── messages.ts             # MODIFY: Add navigation messages
```

---

## ✅ Success Criteria

| Feature | Acceptance Criteria |
|---------|---------------------|
| Overlay Toolbar | Appears within 100ms of selection, positioned correctly |
| Position Auto-adjust | Toolbar stays visible even when element is near viewport edge |
| Style Isolation | Toolbar styles don't leak into page, page styles don't affect toolbar |
| Breadcrumb | Shows path from body to current, all items clickable |
| Children List | Shows first 20 children with preview text, click to select |
| ↑↓ Navigation | Works from both toolbar and sidepanel buttons |
| Double-click | Drills down to deepest element under cursor |
| Keyboard Nav | Alt+Arrow keys navigate hierarchy when not in input |
| Performance | Hierarchy extraction < 10ms for typical pages |

---

## 🚀 Implementation Order

### Phase 1: Core Navigation (Side Panel Only)
1. Add `ElementHierarchy` types
2. Implement `extractHierarchy()` in content script
3. Add `ElementBreadcrumb` component
4. Add `ChildrenList` component  
5. Wire up navigation messages
6. Add Alt+Arrow keyboard shortcuts

### Phase 2: Double-Click Drill-Down
7. Modify picker click handler for double-click
8. Implement `getDeepestElementAtPoint()`
9. Test with nested elements

### Phase 3: Overlay Toolbar
10. Create Shadow DOM container
11. Build toolbar component (vanilla JS/TS)
12. Implement positioning logic
13. Add context-aware controls
14. Wire up property changes

### Phase 4: Polish
15. Add animations (slide in/out)
16. Handle edge cases (tiny elements, off-screen)
17. Add "Expand to Side Panel" button
18. Performance optimization

---

## 🎨 Visual Reference

See interactive demo at: `demo/overlay-concepts.html`

---

*This prompt provides complete specifications for implementing the overlay toolbar and hierarchy navigation system.*
