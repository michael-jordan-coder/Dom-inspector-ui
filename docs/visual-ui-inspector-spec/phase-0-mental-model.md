# Visual UI Inspector — Phase 0: System Rules & Mental Model

This document serves as the **Source of Truth** for the Visual UI Inspector's product definition, capabilities, and operational boundaries. All UX, AI, and Engineering decisions must align with these rules.

---

## 1. Mental Model (The "Why" & "How")

**Visual UI Inspector is a tool for visual intent definition and precise specification, not direct visual programming or site building.**

It solves the friction of "pixel-pushing" in code by allowing developers to manipulate the live browser state to define exactly how an element *should* look, shifting the tactical burden of CSS trial-and-error from the IDE to the Browser. Visual editing here is distinct from code editing because it operates on the *rendered output* (DOM/CSS) rather than the *source abstraction* (React/Vue/etc).

**Core Philosophy:** The tool produces a truthful "destination state" handoff. The developer—not the tool—is responsible for architecting that state into the permanent codebase.

---

## 2. Capability Boundaries

### What This Product DOES (Always True)
- **Manipulate live DOM elements** and CSS computed styles in real-time.
- **Generate strict, neutral "Handoff Artifacts"** (JSON/CSS diffs) representing the changes.
- **Persist visual overrides locally** across page reloads for the current user.
- **Work instantly on any accessible URL** without prior configuration.

### What This Product DOES NOT (Never Promised)
- **Write, modify, or execute server-side code** or business logic.
- **"Decompile" production websites** back into their original framework source code (e.g., React/Vue internals).
- **Bypass browser security policies** (CORS, CSP, iframe restrictions).
- **Commit code to Git** or modify files on the filesystem by default.

---

## 3. Operational Modes

### Mode 1: Universal Mode (Default)
*The default state for casual inspection, debugging, and external sites.*

- **Purpose:** Rapid prototyping, visual debugging, and creating visual tickets on production/staging sites.
- **Inputs:** DOM Nodes, Computed Styles, Screen pixels, User interactions.
- **Outputs:** Visual Diffs, Pure CSS Snippets, JSON Handoffs.
- **AI Constraints:** 
  - AI is **"Codebase Blind"**. 
  - It analyzes only the rendered DOM and visual relationships. 
  - It creates generic, framework-agnostic solutions.

### Mode 2: Repo-Connected Mode (Explicit, Optional)
*An advanced state for active local development.*

- **Purpose:** Accelerating the "tweak-to-code" loop during local development.
- **Inputs:** Universal inputs + Source Maps, Local File Structure, connected Git repository.
- **Outputs:** Component-aware suggestions, Paste-ready framework code (JSX/Vue), Potential direct file patches (strictly if authorized).
- **AI Constraints:** 
  - AI has **"Read-Limited"** access to mapped directories. 
  - It works to correlate a DOM node to a source file.
  - It must **explicitly verify intent** before suggesting destructive edits.
