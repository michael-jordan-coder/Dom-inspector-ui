# UI Inspector - Chrome Extension

A Cursor-like visual UI inspector Chrome extension that allows you to inspect and manipulate DOM styles on any website.

## Features

- **Element Picker**: Click to select any element on the page with visual highlighting
- **Design Inspector Controls**:
  - Layout: display, flex alignment, gap
  - Spacing: padding and margin (all sides)
  - Appearance: opacity, border-radius, background-color
- **Element Summary**: Tag name, ID, classes, ARIA role, text preview, stable selector
- **Live Manipulation**: Changes apply immediately via inline styles
- **Undo/Redo History**: Revert or reapply style changes
- **Works on any website**: Uses `<all_urls>` permissions

## Tech Stack

- **Manifest V3** Chrome Extension
- **React 18 + TypeScript** for the side panel UI
- **Vite** as the build tool
- **Chrome Side Panel API** for the sidebar
- **Content Script** for DOM interaction
- **Service Worker** as message bridge

## Quick Start

```bash
# 1. Navigate to the extension folder
cd chrome-ui-inspector-ext

# 2. Install dependencies
pnpm install
# or: npm install

# 3. Build the extension
pnpm build
# or: npm run build

# 4. Load in Chrome:
#    - Open chrome://extensions/
#    - Enable "Developer mode" (top-right toggle)
#    - Click "Load unpacked"
#    - Select the `dist` folder
```

## Usage

1. Navigate to any website (e.g., `https://example.com`)
2. Click the extension icon in the toolbar
3. The side panel opens on the right
4. Click **Pick Element** button
5. Hover over elements to see the blue highlight
6. Click an element to select it
7. Use the controls to modify styles:
   - **Layout**: Change display mode, flex alignment, gap
   - **Spacing**: Adjust padding and margin
   - **Appearance**: Modify opacity, border-radius, background color
8. Click **Undo** to revert the last change

## Architecture

```
chrome-ui-inspector-ext/
├── manifest.json             # Extension manifest (MV3)
├── src/
│   ├── shared/
│   │   ├── types.ts          # Shared TypeScript types & messages
│   │   └── selector.ts       # Stable selector generator
│   ├── background/
│   │   └── serviceWorker.ts  # Message bridge & lifecycle
│   ├── content/
│   │   ├── contentScript.ts  # Main content script entry
│   │   ├── overlay.ts        # Visual overlay for picker
│   │   ├── domPatch.ts       # Apply/revert style patches
│   │   └── history.ts        # Undo/redo history stack
│   └── sidepanel/
│       ├── index.html        # Side panel HTML entry
│       ├── main.tsx          # React entry point
│       ├── App.tsx           # Main App component
│       ├── components/       # UI components
│       └── messaging/        # Side panel bridge
├── vite.config.ts            # Vite build config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

## Message Flow

```
┌─────────────┐     ┌────────────────┐     ┌────────────────┐
│  Side Panel │ ──▶ │ Service Worker │ ──▶ │ Content Script │
│   (React)   │ ◀── │   (Bridge)     │ ◀── │    (DOM)       │
└─────────────┘     └────────────────┘     └────────────────┘
```

1. Side Panel sends commands (e.g., `START_PICK`, `APPLY_STYLE_PATCH`)
2. Service Worker routes to the active tab's content script
3. Content Script executes DOM operations
4. Results are sent back via the same chain

## Stable Selector Strategy

The extension generates stable CSS selectors with this priority:

1. `data-testid`, `data-test`, or similar test attributes
2. Unique `#id`
3. DOM path using `tagName:nth-of-type(n)` chain

## Development

```bash
# Watch mode for development
pnpm dev
# or: npm run dev
```

Then reload the extension in `chrome://extensions/` after each change.

## Known Limitations

| Limitation | Reason |
|------------|--------|
| Same-origin frames | Cannot inspect elements inside cross-origin iframes |
| Shadow DOM | Limited support for elements inside shadow roots |
| Dynamic pages | Selector may become invalid if DOM changes |
| Chrome pages | Cannot run on `chrome://` or `chrome-extension://` URLs |

## Troubleshooting

**"Cannot inspect this page"**
- Extension cannot run on Chrome internal pages
- Try on a regular website like `https://example.com`

**Side panel doesn't open**
- Make sure you're on a regular webpage
- Click the extension icon in the toolbar

**Element not found after refresh**
- The page DOM changed and the selector is no longer valid
- Pick the element again

## License

MIT
