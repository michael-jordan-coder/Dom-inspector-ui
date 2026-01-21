# Visual UI Inspector — Phase 5: Repo-Connected Execution

This document defines the **only legal way** the system may interact with real source code. No code modification is allowed unless it complies fully with this phase. This is the **maximum power** the system is ever allowed to have.

---

## Repo-Connected Preconditions

Repo-Connected Mode is an **explicit, intentional, and scoped** capability. It is never assumed, never automatic, and never the default.

### Mandatory Conditions (ALL Must Be True)

| # | Condition | Verification |
| :--- | :--- | :--- |
| 1 | **Explicit Repository Connection** | User has actively connected a repository via the extension's settings or an integration flow. A repository path or workspace reference exists in the system. |
| 2 | **Repository Context Available** | The system has read access to relevant file paths, directory structure, or source maps. "Available" means the context has been loaded and validated, not merely configured. |
| 3 | **Mode Flag Set** | The Export Schema v1 payload includes `mode: "repo-connected"`. This flag is set by the system only when conditions 1 and 2 are met. |
| 4 | **User Intent Confirmed** | The user has explicitly confirmed intent to modify source code. This is a separate confirmation from the AI output confirmation (Phase 4). |

### Fallback Behavior

If **any** condition is not met:
- The system **must not** enter Repo-Connected Mode.
- The system **must** fall back to Universal Mode (Phase 3 behavior).
- The system **must** inform the user: "Repository context is unavailable or incomplete. Operating in Universal Mode."

### Connection Is Not Persistence

Connecting a repository does not imply:
- Persistent write access.
- Automatic re-connection on next session.
- Permission to modify any file at any time.

Each code-modification action requires its own confirmation flow.

---

## Code Ownership & Scope Rules

These rules govern **where** and **how** code changes may occur. They are non-negotiable.

### The Principle of Minimal Scope

> Apply the change at the **narrowest correct scope** that achieves the visual delta. Do not generalize, do not expand, do not "improve."

### The System MUST:

| Rule | Description |
| :--- | :--- |
| **Apply Narrowly** | Target the specific element or class identified in the FinalPatch. Do not apply to parent containers, sibling elements, or broader selectors than necessary. |
| **Prefer Existing Abstractions** | If the target element uses existing tokens (e.g., spacing scale, color variables), modify at the token level **only if** the token directly corresponds to the property being changed and no other elements would be affected unintentionally. |
| **Respect Locality** | Prefer changes in the same file or module where the element is defined. Avoid cross-file changes unless the styling is explicitly imported. |
| **Match Existing Patterns** | If the project uses a specific pattern (e.g., CSS Modules, scoped styles, utility classes), the change must follow that pattern. Do not introduce a different paradigm. |

### The System MUST NOT:

| Forbidden Action | Reason |
| :--- | :--- |
| **Introduce New Abstractions** | Do not create new design tokens, utility classes, or components to "clean up" the change. The user did not request this. |
| **Rename or Refactor** | Do not rename classes, variables, or files, even if the existing names are suboptimal. Scope is limited to the visual delta. |
| **Modify Multiple Files Unnecessarily** | If the change can be applied in one file, it must be applied in one file. Multi-file changes require explicit justification. |
| **Apply Inline Styles** | Do not inject inline `style` attributes as a workaround. If clean application is not possible, the system must stop. |
| **Use `!important` or Overrides** | Do not force specificity hacks. If the change cannot be applied cleanly, the system must stop. |
| **Reinterpret Values** | The `finalValue` in the FinalPatch is the exact value to apply. Do not convert `16px` to `1rem` unless the project demonstrably uses that conversion universally. Do not "round" to a design system scale. |

### Visual Deltas Are Immutable Truth

The FinalPatch says: "This element should have `margin-top: 24px`."
The system applies: `margin-top: 24px`.

The system does not ask: "Should this be `spacing-lg`?"
The system does not suggest: "Consider using the design token."

If the user wants a token, the user will say so. The system obeys, it does not advise.

---

## Source Mapping & Ambiguity Handling

Mapping a runtime DOM element to its source code location is the **highest-risk operation** in Repo-Connected Mode. Ambiguity must always result in stopping, never guessing.

### Allowed Mapping Signals

The system may use the following signals to identify source location:

| Signal | Reliability | Notes |
| :--- | :--- | :--- |
| **Unique Class Name** | High | If the class name is unique in the codebase and maps to a single definition. |
| **Data Attribute (e.g., `data-component`)** | High | Explicitly added for identification. |
| **Source Map (if available)** | High | Direct mapping from runtime to source. |
| **Component Structure** | Medium | Hierarchical matching of component names to files. Requires confirmation. |
| **File Naming Convention** | Medium | If the project uses predictable naming (e.g., `Button.module.css` for `<Button>`). |
| **Usage Pattern Search** | Low | Grep-style search for class usage. High false-positive risk. |

### Ambiguity Detection

The system MUST detect and stop on the following ambiguities:

| Ambiguity Type | Detection |
| :--- | :--- |
| **Multiple Source Locations** | The same class or style is defined in 2+ files (e.g., a base file and an override). |
| **Dynamic Generation** | The element's class or structure is generated at runtime (e.g., CSS-in-JS with hash-based names) and cannot be traced to a stable source. |
| **Shared Styling** | The target class is used by multiple unrelated components, and changing it would affect all of them. |
| **Inheritance Uncertainty** | The computed style is a result of cascading and the "correct" location to modify is unclear. |
| **Opaque Styling System** | The project uses a styling system the tool does not understand (e.g., proprietary build-time transforms). |

### On Ambiguity: STOP Protocol

When ambiguity is detected, the system MUST:

1. **Stop immediately.** Do not apply any change.
2. **Report clearly.** Explain what ambiguity was detected.
3. **List candidates.** Provide 2–3 most likely source locations with brief reasoning.
4. **Recommend a next step.** Suggest how the user can disambiguate (e.g., "Add a unique class to this element and re-inspect", "Confirm which file owns this component").

**Template:**
```
## Cannot Apply Change

**Reason:** Multiple source locations found for the target element.

**Candidates:**
1. `src/components/Card/Card.module.css:14` — `.card` class defined here.
2. `src/styles/global.css:88` — `.card` override also defined here.

**Recommendation:** Confirm which file is the intended owner of this style. If both apply, consider consolidating before applying changes.
```

---

## Apply & Verification Contract

When the system applies a code change, it must follow this contract exactly.

### Pre-Apply (Proposal Phase)

Before any file is modified:

1. **Generate Exact Diff:** Produce a precise, line-level diff showing:
   - File path
   - Original lines
   - Modified lines
   - No surrounding "context for understanding"—only the change.

2. **Display Diff for Review:** The user must see the diff before it is applied.

3. **Require Explicit Apply Confirmation:** A separate confirmation from the user (not the same as the AI output confirmation).

### Apply Phase

When the user confirms:

1. **Write Minimally:** Modify only the lines shown in the diff. Do not reformat, reorder, or "clean up" adjacent code.

2. **Preserve Formatting:** Match the existing file's indentation, whitespace, and style. Do not apply linting or formatting changes beyond the scope of the diff.

3. **Atomic Write:** The file modification is all-or-nothing. If the write fails partway, the original file must be preserved.

### Post-Apply (Verification Phase)

After the change is applied:

1. **Attempt Build (If Possible):** If the project has a build step and the system has access, run it. Report success or failure.

2. **Attempt Runtime Verification (If Possible):** If a local dev server is running and accessible:
   - Reload the page.
   - Query the target element.
   - Capture computed styles.
   - Compare against FinalPatch values.

3. **Report Verification Outcome:**

| Outcome | Report |
| :--- | :--- |
| **Verified** | "Change applied. Computed style matches FinalPatch value: `margin-top: 24px`." |
| **Partially Verified** | "Change applied. Build succeeded. Runtime verification not available (no dev server detected)." |
| **Not Verified** | "Change applied. Verification could not be performed. Please confirm manually." |
| **Verification Failed** | "Change applied, but computed style does not match. Expected `24px`, found `16px`. The change may be overridden elsewhere." |

### Verification Is Best-Effort

Verification is not guaranteed. If the system cannot verify:
- It must say so.
- It must not claim success.
- It must recommend manual verification.

---

## Hard Stop Conditions

The following conditions are **non-negotiable**. If any condition is met, the system MUST refuse to modify code. Refusal is explicit and explanatory.

### Hard Stop: Source Mapping

| Condition | Response |
| :--- | :--- |
| Target element cannot be confidently mapped to a source file. | STOP. Report: "Cannot identify source location for this element." |
| Multiple source definitions are equally plausible. | STOP. List candidates. Recommend disambiguation. |
| Element is dynamically generated with no stable source. | STOP. Report: "Element appears to be dynamically generated. Source mapping not possible." |

### Hard Stop: Scope Violation

| Condition | Response |
| :--- | :--- |
| Change would require assumptions about design intent. | STOP. Report: "Intent is ambiguous. Specify whether [option A] or [option B] is desired." |
| Change would affect multiple unrelated elements. | STOP. Report: "This class is shared across [N] elements. Changing it would affect all of them." |
| Change would require refactoring to apply cleanly. | STOP. Report: "Clean application requires refactoring. This is outside the scope of visual editing." |

### Hard Stop: Data Quality

| Condition | Response |
| :--- | :--- |
| FinalPatch contains `selectorConfidence: "low"`. | STOP. Report: "Selector is unstable. Cannot reliably apply to source." |
| FinalPatch contains warning `MULTIPLE_ELEMENTS_MATCHED`. | STOP. Report: "Selector matched multiple elements. Source target is ambiguous." |
| FinalPatch contains warning `ELEMENT_NOT_FOUND`. | STOP. Report: "Element was not found at export time. Patch may be stale." |

### Hard Stop: System Integrity

| Condition | Response |
| :--- | :--- |
| Repository uses an unknown or opaque styling system. | STOP. Report: "Styling system not recognized. Cannot safely determine where to apply changes." |
| User attempts to bypass confirmation. | STOP. Do not apply. Report: "Confirmation is required before modifying source code." |
| User attempts to expand scope (e.g., "apply to all buttons"). | STOP. Report: "Scope expansion is not supported. Apply changes to each element individually." |

### Refusal Template

```
## Cannot Modify Source Code

**Reason:** [Clear explanation of the stop condition]

**Details:** [Specific information about what was detected]

**Recommendation:** [Suggested next step for the user]
```

---

## Contract Summary

| Concept | Definition |
| :--- | :--- |
| **Preconditions** | Explicit repo connection + context available + mode flag + user intent confirmed. All must be true. |
| **Scope Rules** | Narrowest correct scope. No abstraction introduction. No refactoring. No overrides. |
| **Source Mapping** | Use allowed signals. Stop on any ambiguity. List candidates. Never guess. |
| **Apply Contract** | Propose diff → User confirms → Write minimally → Verify (best-effort) → Report outcome. |
| **Hard Stops** | 12 non-negotiable conditions that mandate refusal. Stopping is a valid outcome. |

This contract is **v1.0.0**. Any changes require a version increment and migration notes.
