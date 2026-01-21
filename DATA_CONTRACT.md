# Visual UI Inspector — Phase 2: Data Model & Export Contract (v1)

This document is the **single source of truth** for all data produced by Visual UI Inspector. All AI prompts, UX decisions, and engineering implementations must reference this contract verbatim. Changes require versioning (e.g., `Export Schema v2`).

---

## Data Principles

These principles are **non-negotiable** and govern all data produced by the system.

### 1. Final State, Not History
The system exports **final intended values**, not the sequence of interactions that produced them. If a user changes `margin-top` from `10px` to `20px` to `15px`, the export contains only `15px`. History may exist internally for undo/redo but is **never exported**.

### 2. Determinism Over Inference
Every value in the export must be **directly observed or computed**, never inferred. If a value cannot be determined, it is marked as `null` or omitted—never guessed.

### 3. Lossy by Design
The export intentionally discards:
- Intermediate states
- User hesitation / backtracking
- Tool-internal identifiers
- Session metadata

This is a feature, not a bug. The export is a **specification**, not a replay log.

### 4. Runtime Truth, Not Source Truth
All values represent the **rendered, computed state** at the moment of capture. The system makes no claims about:
- What the original source code intended
- What framework produced the DOM
- What the "correct" value should be

The export says: *"This is what the browser showed, and this is what the user changed it to."*

### 5. Uncertainty is Data
If the system cannot guarantee something (e.g., selector stability), that uncertainty **must be encoded explicitly** in the export. Omitting uncertainty is a contract violation.

### 6. Export is Immutable
Once an export is generated, it represents a point-in-time snapshot. It does not update. If the DOM changes after export, the export is stale—not wrong.

---

## Patch Lifecycle

A visual change progresses through four distinct stages:

### Stage 1: Raw Interaction (Internal Only)
- **What:** A user manipulates a control (e.g., drags a slider, types a value).
- **Where:** Exists only in the UI layer.
- **Persistence:** None. Discarded immediately after Stage 2.
- **User-Facing:** No.

### Stage 2: Intermediate Patch (Internal Only)
- **What:** A transient record of a property change, including the element reference, property name, and new value.
- **Where:** Stored in session memory. Used for live preview and undo stack.
- **Persistence:** Session-scoped. Lost on page reload.
- **User-Facing:** Indirectly (user sees the visual effect, not the data).

### Stage 3: Final Patch (Source of Truth)
- **What:** The **last intended value** for a given `(selector, property)` pair, after all experimentation is discarded. Includes stability and confidence metadata.
- **Where:** Computed on-demand from the Intermediate Patch stack when user requests Handoff.
- **Persistence:** Exists only as long as the session. Exported to become permanent.
- **User-Facing:** Yes. This is what the user reviews in the Handoff State.

### Stage 4: Exported Patch (Canonical Output)
- **What:** A serialized, portable representation of the Final Patch. Conforms to `Export Schema v1`.
- **Where:** Clipboard, file download, or sent to an AI consumer.
- **Persistence:** Permanent (outside the system).
- **User-Facing:** Yes. This is the deliverable.

### Source of Truth
**Stage 3 (Final Patch)** is the source of truth within the system. **Stage 4 (Exported Patch)** is the source of truth outside the system. They must be semantically identical.

---

## FinalPatch Definition

A **FinalPatch** is the atomic unit of trust in the system. It represents a single, intentional visual change to a single CSS property on a single element.

### Properties of a FinalPatch

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `selector` | `string` | Yes | The CSS selector used to identify the target element at export time. |
| `property` | `string` | Yes | The CSS property name (e.g., `margin-top`, `background-color`). |
| `originalValue` | `string \| null` | Yes | The computed value of the property *before* any changes. `null` if not captured. |
| `finalValue` | `string` | Yes | The user's final intended value for the property. |
| `selectorConfidence` | `"high" \| "medium" \| "low"` | Yes | A signal indicating the reliability of the selector. See Stability Signals. |
| `capturedAt` | `string` (ISO 8601) | Yes | Timestamp of when the FinalPatch was frozen for export. |

### Canonical FinalPatch Schema (JSON)

```json
{
  "selector": "string",
  "property": "string",
  "originalValue": "string | null",
  "finalValue": "string",
  "selectorConfidence": "high | medium | low",
  "capturedAt": "string (ISO 8601)"
}
```

### What a FinalPatch Guarantees
- The `selector` matched **exactly one element** at `capturedAt` time.
- The `finalValue` is the **last value the user confirmed**, not an intermediate experiment.
- The `selectorConfidence` is an honest assessment, not an optimistic guess.

### What a FinalPatch Does NOT Guarantee
- That the `selector` will match the same element in the future.
- That the `originalValue` is the "correct" or "intended" value from source code.
- That the `finalValue` is a "good" design decision.

---

## Export Schema v1

This is the **canonical JSON schema** for all exports from Visual UI Inspector. This schema is the only allowed interface between the tool and any external consumer (developer, AI, or other system).

### Schema Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "VisualUIInspectorExport",
  "version": "1.0.0",
  "type": "object",
  "required": ["exportVersion", "capturedAt", "pageUrl", "patches"],
  "properties": {
    "exportVersion": {
      "type": "string",
      "const": "1.0.0",
      "description": "Schema version. Consumers must check this before parsing."
    },
    "capturedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of when this export was generated."
    },
    "pageUrl": {
      "type": "string",
      "format": "uri",
      "description": "The URL of the page where changes were made. May be sanitized."
    },
    "viewport": {
      "type": "object",
      "description": "The viewport dimensions at capture time.",
      "properties": {
        "width": { "type": "integer" },
        "height": { "type": "integer" }
      },
      "required": ["width", "height"]
    },
    "patches": {
      "type": "array",
      "description": "The list of FinalPatches representing all visual changes.",
      "items": {
        "type": "object",
        "required": ["selector", "property", "originalValue", "finalValue", "selectorConfidence", "capturedAt"],
        "properties": {
          "selector": { "type": "string" },
          "property": { "type": "string" },
          "originalValue": { "type": ["string", "null"] },
          "finalValue": { "type": "string" },
          "selectorConfidence": { "type": "string", "enum": ["high", "medium", "low"] },
          "capturedAt": { "type": "string", "format": "date-time" }
        }
      }
    },
    "warnings": {
      "type": "array",
      "description": "Human-readable warnings about this export. Consumers should surface these.",
      "items": {
        "type": "object",
        "required": ["code", "message"],
        "properties": {
          "code": { "type": "string" },
          "message": { "type": "string" },
          "affectedSelectors": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### Example Export (Illustrative)

```json
{
  "exportVersion": "1.0.0",
  "capturedAt": "2026-01-21T21:40:00Z",
  "pageUrl": "https://example.com/dashboard",
  "viewport": { "width": 1440, "height": 900 },
  "patches": [
    {
      "selector": "#main-header",
      "property": "padding-bottom",
      "originalValue": "16px",
      "finalValue": "24px",
      "selectorConfidence": "high",
      "capturedAt": "2026-01-21T21:39:50Z"
    },
    {
      "selector": ".card-container > .card:nth-child(2)",
      "property": "border-radius",
      "originalValue": "4px",
      "finalValue": "12px",
      "selectorConfidence": "low",
      "capturedAt": "2026-01-21T21:39:55Z"
    }
  ],
  "warnings": [
    {
      "code": "SELECTOR_POSITIONAL",
      "message": "Selector uses positional matching (:nth-child). It may break if DOM order changes.",
      "affectedSelectors": [".card-container > .card:nth-child(2)"]
    }
  ]
}
```

---

## Stability & Confidence Signals

These signals encode **what the system knows about its own reliability**. They are machine-readable and human-readable. They must be surfaced in UX and respected by AI consumers.

### Signal: `selectorConfidence`

Indicates how reliably the `selector` will match the intended element in the future.

| Value | Meaning | Example Selectors | UX Treatment |
| :--- | :--- | :--- | :--- |
| `high` | Selector uses a unique ID or highly specific, stable attributes. Unlikely to break. | `#user-profile-card`, `[data-testid="submit-btn"]` | Green indicator. No warning. |
| `medium` | Selector uses class names or tag combinations. May break if CSS/HTML is refactored. | `.header .nav-item.active`, `main > section.hero` | Yellow indicator. Caution notice. |
| `low` | Selector relies on positional or structural matching. Likely to break. | `div > div:nth-child(3) > span`, `body > :first-child` | Red indicator. Explicit warning. |

### Signal: Warning Codes

Warnings are attached to the export as structured objects. AI consumers **must not ignore warnings**.

| Code | Meaning | Consumer Action |
| :--- | :--- | :--- |
| `SELECTOR_POSITIONAL` | Selector uses `:nth-child`, `:first-child`, or similar. | Flag as fragile. Suggest manual verification. |
| `SELECTOR_NO_ID` | No ID was available on the element. | Inform user that a data-attribute or ID would improve reliability. |
| `MULTIPLE_ELEMENTS_MATCHED` | Selector matched more than one element at capture time. | Treat as unreliable. Do not auto-apply. |
| `ELEMENT_NOT_FOUND` | Element could not be re-queried at export time. | Export is stale. Advise re-capture. |
| `VIEWPORT_MISMATCH` | Captured viewport differs significantly from common breakpoints. | Warn that changes may be media-query dependent. |

### How Signals Block Operations

In later phases (AI, Repo-Connected Mode), these signals **must gate behavior**:

- An AI **may not claim certainty** about a patch with `selectorConfidence: "low"`.
- A repo-connected write operation **must require explicit user confirmation** if any patch has `selectorConfidence: "low"` or a `MULTIPLE_ELEMENTS_MATCHED` warning.
- UX **must not hide** any warning from the user.

---

## Contract Summary

| Concept | Definition |
| :--- | :--- |
| **FinalPatch** | The atomic unit of a visual change. One selector, one property, one final value. |
| **Export** | A versioned, timestamped collection of FinalPatches with warnings. |
| **selectorConfidence** | A signal indicating how stable the selector is. |
| **Warnings** | Machine-readable codes that must be surfaced to users and AI. |
| **Source of Truth** | FinalPatch (internal), Exported Patch (external). |

This contract is **v1.0.0**. Any changes require a version increment and migration notes.
