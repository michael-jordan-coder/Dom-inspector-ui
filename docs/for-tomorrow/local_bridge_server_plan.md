# Implementation Plan: Local Repository Bridge Server

## 1. Overview
The **Local Bridge Server** is a standalone Node.js CLI tool designed to give the Chrome UI Inspector "eyes" into the local development repository. It bridges the gap between the runtime DOM (seen by the extension) and the source code (stored on the developer's machine).

## 2. Architecture

```mermaid
graph TD
    A[Chrome Extension] -- HTTP/WebSocket --> B[Local Bridge Server (localhost:3000)]
    B -- fs/glob --> C[Local File System]
    B -- git --> D[Git History/Diffs]
```

### Components
1.  **CLI Tool (`@inspector/cli`)**: Runs in the developer's terminal inside their project root.
2.  **API Server**: Exposes endpoints for the extension to query.
3.  **Extension Client**: New module in the extension to communicate with the local server.

## 3. Core Features

### 3.1 Context Resolution
-   **Input**: The extension sends a component name (e.g., `Header`), CSS class (`.btn-primary`), or text content.
-   **Process**: The server searches the local workspace.
-   **Output**: Returns exact file paths (`src/components/Header.tsx`) and line numbers.

### 3.2 Source Retrieval
-   Allows the AI to "read" the relevant source file to understand the current implementation before suggesting changes.

### 3.3 Safety Validation (Optional)
-   Could verify if the file has uncommitted changes before the AI suggests edits.

## 4. Implementation Phases

### Phase 1: The CLI Scaffold
*   **Goal**: Run a simple server that responses to "ping".
*   **Tech Stack**: Node.js, `express` or `fastify`, `commander` (for CLI args).
*   **Task**:
    -   Create `packages/cli` (or a separate repo/folder).
    -   Implement `npx inspector-bridge start`.
    -   Start HTTP server on `localhost:2121` (or user defined port).
    -   Implement `/health` endpoint.

### Phase 2: Extension Integration
*   **Goal**: The extension detects if the bridge is running.
*   **Task**:
    -   Add `LocalStorage` setting in Extension: "Enable Local Bridge".
    -   Implement polling mechanism in `serviceWorker.ts` or `AIPage.tsx` to check connection.
    -   Show status indicator in UI (🟢 Connected to Repo).

### Phase 3: "Locate File" Capability
*   **Goal**: Find the file definition for a selected element.
*   **Task**:
    -   **Server**: Implement `/search` endpoint using `ripgrep` (via `vscode-ripgrep` or `fast-glob`).
    -   **Client**: When user selects an element, send `tagName` + `className` to server.
    -   **AI Prompt**: Update AI context to include: "Source File: `src/components/MyButton.tsx` (Lines 20-50)".

### Phase 4: AI Context Injection
*   **Goal**: Inject actual source code into the prompt.
*   **Task**:
    -   **Server**: Implement `/read` endpoint (safelisted extensions only: .ts, .tsx, .css, etc.).
    -   **Client**: Fetch source content for the identified file.
    -   **Prompt**: "Here is the ACTUAL source code for this component. Write the patch based on this."

## 5. Security & Constraints
*   **Localhost Only**: Server must bind strictly to `127.0.0.1`.
*   **Read-Only Default**: Initially, the bridge should only *read* files. Writing changes should be a separate, explicit permission or handled manually by the user pasting code.
*   **CORS**: Allow origin `chrome-extension://<id>`.

## 6. Success Criteria
*   User runs `npx inspector-bridge`.
*   Extension shows "Connected".
*   When asking AI "Change this button color", the AI responds: "I see this is defined in `Button.tsx`. Here is the updated code..." instead of generic CSS.
