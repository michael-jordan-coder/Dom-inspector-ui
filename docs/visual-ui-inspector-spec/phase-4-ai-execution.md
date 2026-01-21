# Visual UI Inspector — Phase 4: AI Connection & Safe Execution

This document is the **canonical AI execution contract** for Visual UI Inspector. No AI call may be executed unless it conforms to this phase. All states, gates, and confirmation flows are mandatory and non-bypassable.

---

## AI Connection Model

### Design Principle
AI connection is a **capability**, not a dependency. The product must deliver full value (Pick → Edit → Handoff) without any AI connection. AI is an optional accelerator.

### Bring Your Own Key (BYOK)

| Aspect | Specification |
| :--- | :--- |
| **Ownership** | The user provides and owns their AI credentials. The product does not provide, manage, or bill for AI access. |
| **Scope** | Credentials are scoped to the user's browser profile. No server-side storage. No cross-device sync. |
| **Storage** | Credentials are stored in `chrome.storage.local` (encrypted at rest by the browser). Never in `localStorage`, cookies, or plain text. |
| **Visibility** | Credentials are never displayed in full after initial entry. Masked display only (e.g., `sk-...abc`). |
| **Transmission** | Credentials are transmitted directly from the browser to the AI provider. No intermediary server. |

### Connection Lifecycle

| State | Description |
| :--- | :--- |
| **Not Configured** | No credentials exist. AI features are hidden or clearly disabled. |
| **Configured** | Credentials exist in storage. AI features are available but **not active**. |
| **Active Session** | User has explicitly invoked an AI action in the current session. Credentials are in memory. |

### Revocation Behavior

| Trigger | System Response |
| :--- | :--- |
| User clears credentials via settings | Credentials are deleted from storage. State returns to "Not Configured." Any in-progress AI session is aborted. |
| User clears browser data | Credentials are lost. State returns to "Not Configured." |
| Credential validation fails (e.g., 401) | State remains "Configured" but session action fails. User is prompted to re-enter credentials. No automatic retry. |

### No Background Calls
AI is **never invoked automatically**. There are no:
- Pre-fetching of suggestions
- Background analysis of DOM
- Periodic "health checks" to the AI provider

Every AI call requires an explicit user action.

---

## Execution State Machine

The following states define the complete lifecycle of an AI-assisted action. The system must be in exactly one of these states at any time during an AI flow.

---

### State: DISCONNECTED

**Entry Condition:**  
- No AI credentials are configured, OR
- Credentials have been revoked.

**Allowed Actions:**  
- Configure AI credentials (transitions to CONNECTED_IDLE).
- Use all non-AI features (Pick, Edit, Handoff).

**Forbidden Actions:**  
- Invoke any AI-assisted action.
- Display AI-related prompts or suggestions.

**Exit Condition:**  
- User successfully configures credentials → CONNECTED_IDLE.

---

### State: CONNECTED_IDLE

**Entry Condition:**  
- AI credentials are configured and valid.
- No AI action is in progress.

**Allowed Actions:**  
- Initiate an AI-assisted action (e.g., "Generate Implementation Plan").
- View AI availability status.
- Revoke credentials (transitions to DISCONNECTED).

**Forbidden Actions:**  
- Execute AI without user initiation.
- Send any data to the AI provider.

**Exit Condition:**  
- User initiates an AI action → READY (if gates pass) or FAILED (if gates fail).

---

### State: READY

**Entry Condition:**  
- User has initiated an AI action.
- All Safe-Run Gates have passed.
- Input payload (Export Schema v1) is assembled and validated.

**Allowed Actions:**  
- Execute the AI call ("Generate" button enabled).
- Cancel and return to CONNECTED_IDLE.
- Review assembled input before execution.

**Forbidden Actions:**  
- Auto-execute without explicit user confirmation.
- Modify the Export payload after validation.

**Exit Condition:**  
- User confirms execution → GENERATING.
- User cancels → CONNECTED_IDLE.
- Validation retroactively fails → FAILED.

---

### State: GENERATING

**Entry Condition:**  
- User has confirmed execution.
- AI call is in progress.

**Allowed Actions:**  
- Display loading/progress indicator.
- Allow abort (cancel the in-flight request).

**Forbidden Actions:**  
- Accept new user input that modifies the request.
- Display partial or streaming output as final.

**Exit Condition:**  
- AI response received successfully → REVIEW_REQUIRED.
- AI response fails or times out → FAILED.
- User aborts → ABORTED.

---

### State: REVIEW_REQUIRED

**Entry Condition:**  
- AI response has been received.
- Response has passed structural validation (see Output Contract in Phase 3).

**Allowed Actions:**  
- Display full AI output for user review.
- Allow user to copy, dismiss, or proceed.
- Allow user to provide feedback (optional).

**Forbidden Actions:**  
- Automatically apply AI output to any system.
- Hide warnings present in the output.
- Treat output as "confirmed" without user action.

**Exit Condition:**  
- User explicitly confirms output → CONFIRMED.
- User dismisses output → CONNECTED_IDLE.
- User requests regeneration → READY.

---

### State: CONFIRMED

**Entry Condition:**  
- User has explicitly confirmed the AI output.

**Allowed Actions:**  
- Mark output as "accepted" for this session.
- Enable downstream actions (e.g., copy to clipboard, apply to repo in Repo-Connected Mode).
- Log confirmation for audit (if applicable).

**Forbidden Actions:**  
- None specific. This is a terminal success state for the AI flow.

**Exit Condition:**  
- Flow complete. System returns to CONNECTED_IDLE.

---

### State: ABORTED

**Entry Condition:**  
- User explicitly cancelled during GENERATING.

**Allowed Actions:**  
- Display "Aborted" status.
- Allow retry (return to READY or CONNECTED_IDLE).

**Forbidden Actions:**  
- Display any partial AI output.
- Treat the aborted request as successful.

**Exit Condition:**  
- User acknowledges → CONNECTED_IDLE.

---

### State: FAILED

**Entry Condition:**  
- A gate check failed, OR
- AI call returned an error, OR
- Response validation failed.

**Allowed Actions:**  
- Display clear error message with reason.
- Suggest resolution (e.g., "Re-export", "Check credentials").
- Allow retry (return to READY or CONNECTED_IDLE).

**Forbidden Actions:**  
- Silently recover.
- Display partial or corrupt output.
- Auto-retry without user consent.

**Exit Condition:**  
- User acknowledges → CONNECTED_IDLE.
- User retries → READY (if gates now pass).

---

## Safe-Run Gates

Before any AI execution is allowed (before transitioning from CONNECTED_IDLE to READY), the following gates **must pass**. These gates are deterministic, explicit, and non-bypassable.

### Gate 1: Export Schema Validation
- **Check:** The assembled payload conforms to Export Schema v1.
- **Failure:** Missing or malformed fields.
- **Response:** Block execution. Display: "Export data is invalid. Please re-export from Visual UI Inspector."

### Gate 2: At Least One Patch Exists
- **Check:** `patches.length > 0`.
- **Failure:** No patches in the export.
- **Response:** Block execution. Display: "No visual changes to process. Make edits before invoking AI."

### Gate 3: Stability Acknowledgment (Conditional)
- **Check:** If any patch has `selectorConfidence: "low"` OR any warning with code `SELECTOR_POSITIONAL` or `MULTIPLE_ELEMENTS_MATCHED` exists, the user must have acknowledged instability.
- **Failure:** User has not acknowledged.
- **Response:** Block execution. Display: "Some selectors are unstable. Review warnings and confirm to proceed."

### Gate 4: Mode Compatibility
- **Check:** If `mode: "repo-connected"` is requested, repository context must be present in the input.
- **Failure:** Mode mismatch.
- **Response:** Block execution. Display: "Repo-Connected Mode requires repository context. Provide file paths or switch to Universal Mode."

### Gate 5: Credentials Valid
- **Check:** AI credentials exist and have not been marked invalid by a previous failure.
- **Failure:** Credentials missing or previously rejected.
- **Response:** Block execution. Display: "AI credentials are missing or invalid. Please reconfigure."

### Gate 6: No Concurrent Execution
- **Check:** No other AI action is currently in GENERATING state.
- **Failure:** Concurrent request attempted.
- **Response:** Block execution. Display: "An AI action is already in progress. Wait or abort the current action."

---

## User Confirmation Contract

Before AI output is considered usable (transition from REVIEW_REQUIRED to CONFIRMED), the user must explicitly confirm. This confirmation is a **trust handoff moment**.

### What the User Confirms

By clicking "Confirm" (or equivalent action), the user acknowledges:

| Acknowledgment | Meaning |
| :--- | :--- |
| **Ephemeral DOM Nature** | "I understand that these changes were made to a live, runtime DOM, not source code." |
| **Selector Instability** | "I have reviewed any selector warnings and accept the risk that selectors may break." |
| **AI Limitations** | "I understand that AI output is guidance, not guaranteed correctness. I am responsible for verification." |
| **Responsibility Transfer** | "From this point, I own the implementation. The tool's job is done." |

### Confirmation Mechanics

- Confirmation requires a **single, explicit action** (button click, keyboard shortcut).
- Confirmation is **not** implied by dismissing, scrolling, or time elapsed.
- Confirmation is **per-session, per-output**. Each AI generation requires its own confirmation.

### Confirmation UI (Behavioral Spec, Not Implementation)

The confirmation action must be:
- Visually distinct (not a subtle link).
- Labeled clearly (e.g., "I Understand & Confirm" or "Confirm Output").
- Positioned after the full output is visible (not above or before).

### Post-Confirmation State

Once confirmed:
- The AI output is considered "accepted" for this session.
- Downstream actions (copy, export, apply) are unblocked.
- No further confirmation is required for the same output.

---

## Failure & Abort Handling

All failure and abort scenarios must be handled **loudly, clearly, and safely**. Silent failure is forbidden. Partial state corruption is forbidden.

### Failure Scenarios

| Scenario | System Response |
| :--- | :--- |
| **Gate check fails** | Transition to FAILED. Display specific gate failure message. Do not attempt AI call. |
| **AI call returns error (4xx, 5xx)** | Transition to FAILED. Display: "AI request failed: [error summary]. Check credentials or try again." |
| **AI call times out** | Transition to FAILED. Display: "AI request timed out. The provider may be unavailable." Allow retry. |
| **Response validation fails** | Transition to FAILED. Display: "AI response was malformed or violated output contract. Please retry or report." |
| **Response contains refusal** | Transition to REVIEW_REQUIRED. Display the refusal as the output. User reviews the refusal. No downstream actions enabled. |

### Abort Scenarios

| Scenario | System Response |
| :--- | :--- |
| **User aborts during GENERATING** | Attempt to cancel the in-flight request (best effort). Transition to ABORTED. Display: "Request aborted." No output displayed. |
| **User dismisses during REVIEW_REQUIRED** | Transition to CONNECTED_IDLE. Output is discarded. No trace remains. |

### Recovery Principles

1. **No Silent Failure:** Every failure must produce a visible, human-readable message.
2. **Clear Explanation:** The message must explain *what* failed and *why*.
3. **Safe Recovery Path:** The user must have a clear next step (retry, reconfigure, re-export).
4. **No Partial State:** If a flow fails, all in-progress data for that flow is discarded. The system returns to a clean state (CONNECTED_IDLE or DISCONNECTED).
5. **Audit Trail (Optional):** Failures may be logged locally for debugging. Logs must not contain credentials or full AI responses.

---

## Contract Summary

| Concept | Definition |
| :--- | :--- |
| **BYOK** | User provides AI credentials. No product-managed AI. |
| **Connection Scope** | Browser profile, `chrome.storage.local`. No server. |
| **State Machine** | 8 states: Disconnected, Connected_Idle, Ready, Generating, Review_Required, Confirmed, Aborted, Failed. |
| **Safe-Run Gates** | 6 gates: Schema valid, patches exist, stability acknowledged, mode compatible, credentials valid, no concurrency. |
| **User Confirmation** | Explicit, per-output, acknowledges DOM ephemerality + selector risk + AI limits + responsibility transfer. |
| **Failure Handling** | Loud, clear, safe. No silent failure. No partial state. |

This contract is **v1.0.0**. Any changes require a version increment and migration notes.
