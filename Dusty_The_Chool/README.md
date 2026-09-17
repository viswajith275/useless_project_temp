# Dusty the Chool 🧹

[![Visual Studio Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue.svg)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A chaotic, delightfully useless Kerala pairing broom living in your sidebar that sweeps syntax errors into his dustpan (Murram), throws tantrums, and personally roasts your life choices with famous Kerala memes in English.

---

## Meet Dusty

**Dusty the Chool** is modeled after a traditional Kerala coconut broom (*chool*). Rather than helping you like ordinary polite AI assistants, Dusty watches your editor diagnostics with judging eyes, sweeps stray syntax errors into his woven bamboo dustpan, chokes when full, and roasts you with famous viral Kerala memes in English (*"Aaraattu Annan review of your code: 'Utter disaster, total flop show, mind-blowing crashout, guys!' My parents were right about planting a banana tree (vazha) instead of hiring you!"*).

---

## Screenshots

### Secondary Sidebar View
![Dusty Sidebar](media/icons/idle.png)
*Dusty resting in the sidebar with live state badge, speech bubble, bamboo dustpan capacity (murram), and rage meter.*

### Editor Gutter Sweep & CodeLens
![Editor Gutter Sweep](media/icons/eating.png)
*Multi-frame pixel-art broom bristles marching down the editor gutter toward a syntax error with native `Feed Dusty` CodeLens.*

### Crashout Apocalypse Mode
![Crashout Mode](media/icons/clogged.png)
*Dusty reaching 100% Rage, triggering emergency screen strobes and entering full revenge code-deletion mode.*

---

## ⚡ Key Features

- 🧹 **Error Sweeper & Safe Ingestion**: Safely targets and sweeps small, disposable syntax errors (stray duplicate semicolons, trailing brackets) into his dustpan with animated pixel-art gutter bristles.
- 🎯 **Multi-Tier Type Error Harvester**: Detects type mismatches (TS2322/TS2345), missing properties (TS2339), implicit any (TS7006), argument count errors, and compounding line clusters—roasting them via a 3-tier hybrid engine (0ms instant regex slot-filler, 450ms resilient Ollama bridge, and 40+ static roasts).
- 🧺 **Animated Bamboo Dustpan (Murram)**: Authentic woven bamboo dustpan beside the broom that catches fallen syntax crumbs and chokes when reaching capacity (5 crumbs).
- 🍖 **Hunger & Mischief Engine**: If you write clean code without syntax errors for too long (35–45s), Dusty grows restless and hungry, threatening to eat your working code if not fed!
- 💥 **100% Rage & Crashout Apocalypse**: Overwhelming Dusty or typing while he is sweeping fills his Rage Meter. At 100% rage, Dusty triggers full emergency apocalypse strobes and deletes code out of pure spite!
- 🌶️ **English Kerala Meme Roasts**: 60+ curated savage trolls referencing *Aaraattu Annan, Vazha (banana tree), KSRTC Swift, KSEB load shedding, Moral policing uncles, Food vloggers, WhatsApp family groups, PSC coaching*, and *Santhosh Pandit*.
- 🦙 **Local Ollama 3B Integration**: Optionally connect a local Ollama instance (`llama3.2:3b`) to generate real-time AI roasts tailored to your specific file and error. Offline fallback is 100% self-contained.
- 🔊 **Zero-Dependency Procedural Audio**: Built-in 8-bit procedural sound synthesizer powered by the Web Audio API (with support for custom `.mp3`/`.wav` drops in `media/sounds/`).
- 📊 **Actionable Status Bar & CodeLens**: Real-time status bar indicator showing current state and rage percentage, plus native `🧹 Feed Dusty` and `🔥 Roast Me` editor CodeLens actions.

---

## ⌨️ Keybindings & Commands

| Command | Title | Default Shortcut (Mac / Win/Linux) |
|---|---|---|
| `dusty.unclog` | **Unclog Dust Bag** | `Cmd+Alt+U C` / `Ctrl+Alt+U C` (when clogged) |
| `dusty.insultMe` | **Roast Me** | `Cmd+Alt+D R` / `Ctrl+Alt+D R` |
| `dusty.toggleEngine` | **Toggle Engine** | `Cmd+Alt+D T` / `Ctrl+Alt+D T` |
| `dusty.feedManually` | **Feed Dusty** | *Via Command Palette or CodeLens* |
| `dusty.muteAudio` | **Toggle Audio** | *Via Sidebar Title or Command Palette* |
| `dusty.resetBag` | **Reset Dust Bag** | *Via Command Palette* |
| `dusty.crashout` | **Trigger Crashout** | *Via Command Palette* |

---

## ⚙️ Configuration Settings

Customize Dusty's behavior in VS Code Settings (`Cmd+,` or `Ctrl+,` -> search `dusty`):

| Setting | Default | Description |
|---|---|---|
| `dusty.enabled` | `true` | Enable or disable Dusty the Chool. |
| `dusty.chaosIntensity` | `"normal"` | `calm`, `normal`, or `feral` chaos frequency. |
| `dusty.autoIngest` | `true` | Automatically sweep small disposable syntax errors. |
| `dusty.hungerMischief` | `true` | Enable hunger threats and mischievous clean-code deletion. |
| `dusty.muteAudio` | `false` | Mute all procedural audio effects. |
| `dusty.diagnosticDelayMs` | `2500` | Delay after user stops typing before targeting errors. |
| `dusty.ingestDelayMs` | `1200` | Gutter approach animation duration before sweep. |
| `dusty.enableLLM` | `true` | Use local Ollama instance for dynamic AI roasts. |
| `dusty.ollamaEndpoint` | `"http://127.0.0.1:11434"` | Local Ollama API endpoint. |
| `dusty.ollamaModel` | `"llama3.2:3b"` | Model tag for Ollama roast generation. |
| `dusty.checkOnSaveOnly` | `false` | Only sweep errors when explicitly saving documents. |

---

## 📦 Zero-Dependency Architecture

Dusty is built to be ultra-lightweight and respects your system:
- **No React, Webpack, or Esbuild**: Compiles cleanly with standard TypeScript `tsc`.
- **No External Image/Audio Assets Required**: Sprites and gutter icons are procedurally generated SVG data URIs, and audio uses the native Web Audio API.
- **Strict Safety Gate**: Revalidates document versions and diagnostics before performing atomic edits—never deletes valid statements or comments.

---

## 📄 License

MIT License © 2026 Viswajith M P & Ishaangoutham K S (Team Vazhas).
