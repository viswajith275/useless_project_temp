# AGENTS.md — Engineering Guidelines for Dusty

This document governs autonomous coding agents working on the `dusty-the-chool` VS Code extension.

---

## 1. Core Architecture

The extension is structured into decoupled, single-responsibility modules under `src/`:

- `src/types.ts`: Core interfaces, state snapshot, diagnostic targets, and message schemas.
- `src/diagnosticParser.ts`: Pure classification logic evaluating diagnostic ranges, severity, and token safety.
- `src/diagnosticTarget.ts`: Centralized targeting selector, viewport ranking, suppression tracking, and pre-edit validation.
- `src/typeHarvester.ts`: Multi-tier type error harvesting, classification, and AST/regex pattern matching.
- `src/stateStore.ts`: Single source of truth for runtime state, bag capacity, context key syncing (`dusty.state`, `dusty.clogged`, etc.).
- `src/decorationManager.ts`: Editor gutter animation types, SVG data URIs, dissolve overlays, and virtual graffiti.
- `src/dustyCodeLensProvider.ts`: Native `🧹 Feed Dusty` and `Dusty: Explain` lenses.
- `src/statusBar.ts`: Actionable status bar indicator.
- `src/vacuumViewProvider.ts`: Secondary sidebar WebviewViewProvider (pixel-art canvas, speech bubble, controls).
- `src/chaosEngine.ts`: Event orchestration, timing, debouncing, safety gate verification, and atomic edits.
- `src/roastService.ts`: 3-tier roast engine (local templates, bank, optional Ollama).
- `src/commands.ts`: VS Code command registrations.
- `src/spriteGen.ts`: Procedural SVG generator for animation frames.
- `media/audio.js`: Zero-asset Web Audio procedural sound synthesizer.
- `media/main.js`: Canvas pixel-art renderer and webview messaging bridge.
- `media/style.css`: Theme-native responsive styling with CRT overlay.

---

## 2. Non-Negotiable Safety Rules

1. **Never Make the Code Worse**:
   - Dusty is allowed to be annoying; he is NEVER allowed to break working user code.
2. **Safe Ingestion Gate**:
   - Dusty may only auto-ingest a small (<= 5 characters), single-line, high-confidence syntax artifact.
   - Never auto-delete statements, function declarations, imports, comments, strings, or type errors.
   - Immediately prior to an atomic `editor.edit()`, revalidate:
     - `document.version === target.documentVersion`
     - Diagnostic is still active in `vscode.languages.getDiagnostics()`
     - Document is open and writable (`file:` or `untitled:` scheme)
3. **Graceful Fallback**:
   - If confidence is low or document changed, abort edit cleanly, clear dissolve decorations, and deliver a witty roast.

---

## 3. Native Integration Rules

- **VS Code First**: Use actual VS Code APIs for diagnostics, gutter decorations, CodeLens, status bar, and walkthroughs.
- **Webview is Only Character Layer**: The webview renders Dusty's face and plays sounds; it does NOT directly modify files or execute arbitrary workspace edits. All actions route through validated host commands.
- **Strict Content Security Policy**: Webview must always enforce nonces and restricted origins.

---

## 4. Build, Test, and Packaging Commands

```bash
# Compile TypeScript
npm run compile

# Run full unit & integration tests
npm test

# Package to VSIX extension file
npm run package
```

---

## 5. Dependency Rules

- **Zero Unnecessary Dependencies**:
  - No React.
  - No Webpack.
  - No Esbuild.
  - No external audio/image assets.
  - Extension compiles with raw `tsc`.
  - Audio runs on native Web Audio API.
  - Sprites are generated procedurally via SVG data URIs.
