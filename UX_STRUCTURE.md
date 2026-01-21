# Visual UI Inspector — Phase 1: UX Structure & Flow

This document defines the user-facing experience and flow. It is independent of AI or repository access and serves as the UX source of truth.

---

## Primary User Flow

### Canonical Happy-Path: Opening Extension → Exporting Handoff

**1. User Opens Side Panel**
- **Sees:** Empty State with a single, prominent "Pick Element" button. No clutter.
- **Understands:** The tool is passive until I take action. Nothing is happening on the page.
- **System Guarantees:** No scripts are actively running on the page. No DOM is being modified.

**2. User Activates Element Picker**
- **Sees:** Cursor changes. Elements highlight on hover. A tooltip shows the tag name of the hovered element.
- **Understands:** I am in a selection mode. Clicking will lock my choice.
- **System Guarantees:** Hover highlighting is purely visual (pseudo-elements or overlays). No page state is modified.

**3. User Clicks an Element**
- **Sees:** The side panel transitions to **Inspecting State**. A visual preview and key metadata (tag, classes, dimensions) appear. The page element has a persistent, subtle outline.
- **Understands:** This element is now "locked" for inspection. The tool has identified it.
- **System Guarantees:** A selector has been generated. The element reference is live.

**4. User Reviews Element & Initiates Editing**
- **Sees:** Computed style properties displayed (spacing, color, sizing). An "Edit" or direct property control appears.
- **Understands:** I can now change how this element looks. These changes are temporary.
- **System Guarantees:** No changes have been applied yet.

**5. User Makes Visual Edits**
- **Sees:** A properties panel with controls for margin, padding, color, border-radius, etc. Changes apply live to the page. A "Changes" badge or counter increments.
- **Understands:** My changes are visual and temporary. They are applied to the live DOM.
- **System Guarantees:** All changes are reverted on page reload. An undo stack exists.

**6. User Completes Editing Session**
- **Sees:** A summary of all changes made to the selected element(s). A "View Handoff" or "Export" action becomes available.
- **Understands:** My work is ready to be packaged for implementation.
- **System Guarantees:** All changes are recorded and can be represented as CSS diffs.

**7. User Enters Handoff State**
- **Sees:** A dedicated Handoff view with: the original state, the modified state, a CSS diff, and a JSON export option. Clear warnings about selector stability are visible.
- **Understands:** This is the output I give to myself or my team. The tool's job is done here.
- **System Guarantees:** The export is a neutral, framework-agnostic representation of the visual delta.

---

## Pages & States

### Empty State

**Purpose:** Ground the user. Communicate passivity and safety. Invite first action.

**Entry Condition:**
- Extension side panel is opened.
- No element is currently selected.
- No pending changes exist from a previous session.

**Exit Condition:**
- User activates the "Pick Element" mode.

**Shown Information:**
- Visual UI Inspector logo/title.
- A single, clear call-to-action: "Pick an Element".
- A subtle footer: "Changes are visual and temporary."

**Allowed Actions:**
- Activate Element Picker.
- Access Settings (if applicable).

**Disabled Actions:**
- All editing controls are absent (not greyed out—non-existent).
- Handoff/Export is not visible.

---

### Inspecting State

**Purpose:** Confirm the selected element. Build user confidence before editing. Surface potential instability.

**Entry Condition:**
- User has clicked on an element via the picker.
- A valid selector has been generated.

**Exit Condition:**
- User initiates editing on the element.
- User picks a new element (re-enters this state).
- User clears selection (returns to Empty State).

**Shown Information:**
- **Element Preview:** A thumbnail or highlighted view of the element.
- **Element Identity:** Tag name, class list, ID (if any).
- **Computed Dimensions:** Width, Height.
- **Selector Confidence Indicator:** A simple signal (e.g., green/yellow/red dot) indicating selector uniqueness.
  - *Green:* Unique ID or highly stable selector.
  - *Yellow:* Class-based selector, likely stable.
  - *Red:* Complex or positional selector, may break.

**Allowed Actions:**
- Begin editing (transition to Editing State).
- Pick a different element.
- Navigate element hierarchy (parent/children).
- Clear selection.

**Disabled Actions:**
- Handoff/Export (no changes have been made).

---

### Editing State

**Purpose:** Enable visual manipulation. Make all changes feel reversible and trackable.

**Entry Condition:**
- User has an inspected element and interacts with an edit control.

**Exit Condition:**
- User explicitly finishes editing (proceeds to Handoff).
- User picks a new element.
- User clears all changes (returns to Inspecting or Empty).

**Shown Information:**
- **Active Element Preview:** Live-updating as changes are made.
- **Property Controls:** Grouped logically (Spacing, Sizing, Colors, Typography, Effects).
- **Change Log/Counter:** A persistent indicator of how many properties have been modified.
- **Undo/Redo Controls:** Always visible.
- **Original Value Hint:** For each modified property, show the original computed value.

**Allowed Actions:**
- Modify any supported visual property (margin, padding, width, height, color, border-radius, font-size, etc.).
- Undo/Redo individual changes.
- Reset all changes on the current element.
- Proceed to Handoff.
- Pick a new element (changes are preserved in session).

**Disabled Actions:**
- Modifying non-visual properties (event handlers, data attributes, content text — out of scope).

---

### Handoff State

**Purpose:** Package the user's work into a portable, trustworthy artifact. Clearly transfer responsibility to the developer.

**Entry Condition:**
- At least one visual change exists.
- User explicitly navigates to "View Handoff" or "Export".

**Exit Condition:**
- User copies/exports the handoff.
- User closes the handoff view to continue editing.

**Shown Information:**
- **Visual Diff:** Side-by-side or overlay showing original vs. modified.
- **CSS Diff:** A clean, copy-able block of CSS representing the changes.
- **JSON Export:** A structured object containing selector, property changes, and stability metadata.
- **Stability Warnings (Critical):**
  - If selector confidence is Yellow/Red, display a clear, non-dismissable warning: *"The selector for this element is not unique. It may not match after page changes."*
  - List specific risks (e.g., "Relies on `:nth-child(3)`").

**Allowed Actions:**
- Copy CSS to clipboard.
- Copy JSON to clipboard.
- Download as file.
- Return to Editing State.

**Disabled Actions:**
- Directly applying to source code (this is Universal Mode; no repo is connected).

---

## Empty State Strategy

The Empty State is the most critical moment for user trust and product positioning.

### Design Principles

1.  **Communicate Passivity:** The user must understand that opening the extension does *nothing* to the page until they act. The tool is dormant.

2.  **Single, Clear CTA:** The only action available is "Pick an Element." This funnels user attention and prevents confusion. There is no settings panel, no AI chat, no secondary options competing for attention on first load.

3.  **De-emphasize AI (Intentionally):** AI features (like the Prompt Bar or Chat) should **not** be visible in the Empty State. This is critical.
    - **Justification:** If AI is visible before element selection, users may perceive AI as the *core* of the product. It is not. The core value is the visual editing loop (`Pick → Edit → Handoff`). AI is an *accelerant*, not a requirement.
    - **Implication:** The AI Prompt Bar or chat interface should only appear *after* an element is selected (Inspecting State or later). This frames AI as a "power-up" for an existing workflow, not the entry point.

4.  **Prevent "Broken" Perception:** An Empty State with greyed-out buttons or "Connect AI to continue" messaging would imply the tool is incomplete. Instead, the Empty State should feel like a calm, ready-to-use starting point.

### Summary
The Empty State says: *"I am ready when you are. Pick something, and we'll work on it together."* It does not say: *"Connect your AI/Repo to unlock features."*

---

## Handoff Entry Point

The Handoff is the **moment of trust transfer**. The tool is declaring: "My job is done. Here is what I produced. The rest is on you."

### When Handoff Becomes Available
- The "View Handoff" or "Export" action becomes **available and visible** only when `changes.length > 0`.
- It should appear as a distinct button in the Editing State UI, separate from individual property controls.

### Minimum Conditions to Enter Handoff
1.  At least one element has at least one modified property.
2.  The selector for that element has been generated.

### Warnings Surfaced Before/Upon Entry

Upon clicking "View Handoff," the user is presented with the Handoff State view. Before they can copy/export, the following warnings **must be visible** (not as a blocking modal, but as inline, persistent UI):

| Condition | Warning Text |
| :--- | :--- |
| Selector Confidence is Yellow | ⚠️ **Selector may be unstable.** It relies on class names that could change. |
| Selector Confidence is Red | 🔴 **Selector is fragile.** It uses positional or structural selectors that are likely to break. Review carefully. |
| Multiple elements were edited with mixed confidence | ⚠️ **Some selectors in this handoff are unstable.** Expand details to review. |

### What the User Understands Upon Entering
- "This is the final output of my visual work."
- "The CSS/JSON I copy is what I need to implement manually."
- "The tool is warning me about parts that might not work reliably."
- "I am now responsible for translating this into my codebase."

The Handoff State is **not a deployment mechanism**. It is a **specification document**.
