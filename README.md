# Dusty the Malicious Vacuum 🧹⚡

A mischievous, chaotic, yet strictly harmless little vacuum cleaner living inside VS Code. Dusty watches your diagnostics, makes noise, roasts your typos, and occasionally "eats" small, disposable syntax errors.

---

## What is Dusty?

Dusty is an interactive pairing pet for VS Code. Rather than acting as a silent, sterile editor tool, Dusty provides character presence in your secondary sidebar and editor gutter.

He is designed to be:
- **Funny & Chaotic**: He whirrs, complains, roasts your code, and occasionally vacuums empty space for no reason ("I fixed nothing").
- **Strictly Harmless**: Dusty will **never** corrupt working code, delete statements, invent new errors, or make your real debugging problem harder. Automatic ingestion is intentionally conservative and constrained to tiny disposable syntax artifacts (like stray duplicate semicolons).

---

## Features

- **Character Sidebar**: A pixel-art canvas vacuum with animated eyes, facial expressions, and dynamic dust bag gauge located in your sidebar.
- **Editor Gutter Animations**: Procedurally generated multi-frame SVG animations marching down your editor gutter toward active errors.
- **Native CodeLens**: `🧹 Feed Dusty` and `Dusty: Explain` lenses appear above lines with active syntax errors.
- **Actionable Status Bar**: Displays current vacuum state (`Idle`, `Hunting`, `Clogged`, `Muted`, or `Off`) with direct click actions.
- **Procedural Synthesizer Audio**: Zero-asset Web Audio synthesizer producing suction whooshes, error chirps, victory arpeggios, and thunks without downloading external sound files.
- **Safe Automatic Ingestion**: When enabled and confident, Dusty vacuums stray syntax tokens atomically using `editor.edit()`. If an error is complex, semantic, or multi-line, Dusty backs away and leaves your code untouched.
- **Clog Mechanic**: After eating 5 errors, Dusty's dust bag becomes clogged! He throws a fit until you unclog him using the obscure shortcut `Cmd/Ctrl + Alt + U C` or the sidebar Unclog button.

---

## Product Principles & Safety Contract

> **Core Safety Rule**: Dusty is allowed to make the coding experience more annoying. He is not allowed to make the coding problem worse.

### What Dusty Can Eat:
- Isolated stray syntax tokens (e.g. redundant `;;` or dangling stray commas).
- Single-line ranges containing <= 5 characters.
- High-confidence parser diagnostics where deleting the token cannot damage program logic.

### What Dusty Will NEVER Touch Automatically:
- Statements, functions, classes, or declarations.
- Semantic and type errors (e.g. TypeScript type mismatches, missing imports).
- Multi-line diagnostic ranges.
- Comments or string literals.
- Any diagnostic whose document version changed during the animation.
- Read-only files.

When in doubt, Dusty executes a safe fallback: he highlights the problem, delivers a roast, offers a CodeLens, and stops.

---

## Commands

All commands are contributed under the `Dusty` category in the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command | Title | Description |
|---|---|---|
| `dusty.toggleEngine` | Toggle Engine | Starts or stops the vacuum engine. |
| `dusty.unclog` | Unclog Dust Bag | Empties the full dust bag (enabled when clogged). |
| `dusty.feedManually` | Feed Dusty | Manually trigger safe ingestion of the active error. |
| `dusty.insultMe` | Roast Me | Solicits a sarcastic roast from Dusty. |
| `dusty.muteAudio` | Toggle Audio | Mutes or unmutes synthesized audio effects. |
| `dusty.resetBag` | Reset Dust Bag | Resets the dust bag counter to 0/5. |
| `dusty.testSound` | Test Vacuum Sound | Plays a procedural vacuum suction sound. |
| `dusty.openSidebar` | Open Dusty in Sidebar | Focuses Dusty's character view. |
| `dusty.explainDiagnostic`| Explain Error | Shows Dusty's commentary on a diagnostic. |

---

## Configuration Settings

Configured under `Settings > Extensions > Dusty the Vacuum`:

- `dusty.enabled` *(boolean, default: `true`)*: Turn Dusty on or off.
- `dusty.chaosIntensity` *(enum: `"calm" | "normal" | "feral"`, default: `"normal"`)*:
  - `calm`: Rare commentary, longer cooldowns, conservative behavior.
  - `normal`: Balanced comedy, standard cooldowns.
  - `feral`: Hyperactive animations, frequent roasts, tantrums. *(Note: Feral mode never bypasses safety gates!)*
- `dusty.autoIngest` *(boolean, default: `true`)*: Allow Dusty to automatically eat high-confidence syntax errors.
- `dusty.muteAudio` *(boolean, default: `false`)*: Mute procedural audio synthesis.
- `dusty.ingestDelayMs` *(number, default: `650`)*: Delay in milliseconds between visual approach and safe atomic ingestion.
- `dusty.cooldownMs` *(number, default: `5000`)*: Cooldown in milliseconds between automatic chaos events.
- `dusty.enableLLM` *(boolean, default: `false`)*: Connects to local Ollama instance for dynamically generated roasts.
- `dusty.ollamaEndpoint` *(string, default: `"http://127.0.0.1:11434"`)*: Local Ollama URL.

---

## Local Ollama Setup (Optional)

Dusty includes a 3-tier roast engine:
1. Deterministic contextual templates.
2. Comprehensive fallback roast bank.
3. Optional local Ollama integration.

To use Ollama:
1. Ensure Ollama is running locally: `ollama run llama3`.
2. Enable `dusty.enableLLM` in VS Code settings.
3. If Ollama is offline or times out (1200ms limit), Dusty falls back immediately to local roasts with zero lag or blocking.

---

## Accessibility & Theme Support

- **Theme Native**: Uses VS Code theme CSS variables (`--vscode-editor-background`, `--vscode-foreground`, etc.).
- **Reduced Motion**: Respects `prefers-reduced-motion` to disable screen shakes, canvas pulsing, and scanlines.
- **ARIA & Keyboard**: All webview controls have descriptive accessible names and focus rings.

---

## Development & Testing

### Build
```bash
npm install
npm run compile
```

### Run Tests
```bash
npm test
```

### Package Extension (.vsix)
```bash
npm run package
```

---

## License

MIT
