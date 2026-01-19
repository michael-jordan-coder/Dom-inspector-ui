# Changelog

## Element Screenshot Preview

### Overview

The inspector now captures and displays a live screenshot of the selected element directly in the sidepanel. This provides immediate visual confirmation of which element is being inspected without needing to look back at the page.

---

### What's New

#### Screenshot Capture

When you select an element using the picker tool, the extension automatically:

1. Captures the visible portion of the current tab
2. Crops the image to the element's exact bounding rectangle
3. Displays the cropped screenshot in the element summary card

The screenshot appears at the top of the summary card with a maximum height of 180px, maintaining the element's aspect ratio.

#### Simplified Element Summary

The element summary card has been streamlined to focus on essential information:

| Before | After |
|--------|-------|
| Tag name | Tag name |
| ID badge | — |
| Role badge | — |
| Class list | — |
| Selector | Selector |

The new layout prioritizes the visual screenshot over textual metadata, reducing cognitive load when inspecting elements.

---

### Technical Details

#### Architecture

```
Content Script                    Service Worker                    Sidepanel
     │                                  │                               │
     │ ── ELEMENT_SELECTED ──────────►  │                               │
     │    (with boundingRect)           │                               │
     │                                  │                               │
     │                    captureVisibleTab()                           │
     │                    OffscreenCanvas crop                          │
     │                                  │                               │
     │                                  │ ── enriched message ────────► │
     │                                  │    (with base64 screenshot)   │
     │                                  │                               │
     │                                  │                    Display in │
     │                                  │                    <img> tag  │
```

#### Implementation

- **`ElementMetadata.screenshot`** — New optional field containing a base64-encoded PNG data URL
- **`captureElementScreenshot()`** — Service worker function that captures and crops the screenshot using `OffscreenCanvas`
- **`SelectedSummary`** — Updated React component with screenshot display area

#### Limitations

- **Viewport only**: Elements outside the visible viewport will show incomplete or no preview
- **Device pixel ratio**: Currently assumes 2x DPR (common on modern displays); may need adjustment for other densities
- **Performance**: Large elements produce larger base64 strings; the image is capped at the element's visible bounds

---

### Files Modified

| File | Change |
|------|--------|
| `src/shared/types.ts` | Added `screenshot?: string` to `ElementMetadata` |
| `src/background/serviceWorker.ts` | Added screenshot capture and crop logic |
| `src/sidepanel/components/SelectedSummary.tsx` | Redesigned with screenshot display, removed badges |

---

### Usage

1. Open the UI Inspector sidepanel
2. Click the picker button to enter selection mode
3. Click any element on the page
4. View the element's screenshot in the summary card

When no screenshot is available (e.g., element off-screen), a placeholder icon is displayed.
