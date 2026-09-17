<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# Dusty the Chool

## Basic Details
### Team Name: **VAZHAS**

### Team Members
- Team Lead: Viswajith M P - GECT
- Member 2: Ishaangoutham K S - GECT

### Project Description
Dusty the Chool is an interactive, bad-tempered pairing companion modeled after a traditional Kerala coconut broom (chool) living directly inside VS Code. Rather than assisting you, Dusty watches your editor diagnostics with judging eyes, sweeps your syntax errors into his dustpan (Murram), throws full-blown tantrums, deletes broken code when his Rage Meter fills up, and personally roasts your life choices with famous Kerala memes in English.

### The Problem (that doesn't exist)
Modern developers are suffering from a dangerous epidemic of "peace of mind" and "excessive productivity." AI tools like Copilot and ChatGPT are overly polite, apologizing for minor hallucinations and quietly fixing syntax errors. This has deprived programmers of the traditional, character-building trauma of being scolded by an angry elder with a household broom. Furthermore, stray semicolons, dangling brackets, and broken functions are sitting around in codebases without an irritable virtual broom actively sweeping them into a virtual dustpan and screaming at you.

### The Solution (that nobody asked for)
We built Dusty: a native VS Code pairing broom with severe anger management issues.

When you write buggy code, Dusty doesn't offer gentle auto-complete. He marches multi-frame pixelated bristles down your editor gutter, vacuums the offending token or broken function into his dustpan, and delivers brutal Kerala meme roasts in English (*"Aaraattu Annan review of your code: 'Utter disaster, total flop show, mind-blowing crashout, guys!' My parents were right about planting a banana tree (vazha) instead of hiring you!"*).

If you dare to type while he is sweeping, he aggressively deletes what you just typed to teach you keyboard discipline. If his dustpan fills with 5 syntax crumbs, he chokes and halts your editor until you manually unclog him. And if his Rage Meter hits 100%, he enters full "Crashout Mode", strobes your editor with an emergency apocalypse theme, and deletes random chunks of code out of pure vengeance while screaming with Kerala meme roasts.

### Key Chaotic Features
- **Hunger & Mischief Engine**: Writing bug-free code for too long? Dusty gets bored and hungry! After a randomized 35–45s without any syntax errors, Dusty issues a menacing Kerala meme threat (*"I am starving! Give me food in 10 seconds or I will devour your favorite working function! Not a Threat, it's a promise!"*). If ignored for another 11–21s, Dusty commits petty sabotage, eating a working functional code line with a mischievous cackle!
- **State-Reactive Side Panel Ambiance**: The side panel background, borders, and glows dynamically morph to match Dusty's emotional state—from gentle Kerala bamboo coir warmth (`IDLE`), to alert amber (`HUNTING`), fiery crimson (`EATING`), menacing dark pumpkin (`HUNGER`), villainous ultraviolet (`MISCHIEF`), choking dust purple (`CLOGGED`), and full neon red catastrophe (`CRASHOUT`).
- **Animated Kerala Bamboo Dustpan (Murram)**: A traditional woven bamboo dustpan beside the broom with authentic reed texture, dynamic dust crumb accumulation, and animated forward-tilting to catch fallen syntax crumbs.
- **Local LLM Integration (⚠️ Hazardous Pairing Advisory)**: Connect a local Ollama instance for a personalized roasting experience that will make you rethink your life choices! We recommend `llama3.2:3b` as the recommended model (fast, punchy, savage), but any model is fine. Proceed only if your emotional stability has git backups!
- **LRU Dialogue De-Duplication**: Integrated history ring buffer ensures roasts, rage baits, and threats never repeat consecutively.
- **3-Tier Type Error Harvester**: Hooks into diagnostics to extract type mismatches (TS2322/TS2345), missing properties (TS2339), implicit any (TS7006), argument count mismatches, and cascading line clusters. Roasts them dynamically across three tiers: 0ms instant AST/regex slot-fillers, an async Ollama bridge (`qwen2.5:1.5b` or `llama3.2:3b` with 450ms resilient abort timeout), and a 40+ static fallback bank.
- **Viral Kerala Meme Bank**: 60+ curated savage trolls referencing *Aaraattu Annan, Vazha, KSRTC Swift, KSEB power cuts, Moral policing uncles, Food vloggers, WhatsApp family groups, PSC coaching*, and *Santhosh Pandit*.

## Technical Details
### Technologies/Components Used
For Software:
- Languages used: TypeScript, JavaScript, Web Audio API, HTML5 Canvas, Theme-native CSS
- Frameworks used: VS Code Extensibility API (`vscode` 1.85.0+), VS Code Webview API, Language Server Diagnostics
- Libraries used: Zero external runtime npm dependencies (compiled with raw `tsc`, procedural Web Audio synthesizer, procedural SVG frame generator, native Node.js `fs` & `zlib`)
- Tools used: VS Code Extension Development Host, Ollama (Local 3B LLM inference using `llama3.2:3b`), vsce (VS Code Extension Packager), npm, Git, Mocha (test runner)

For Hardware:
- Main components: Coconut palm frond / Eerkili (virtually simulated in 60fps canvas), Mechanical keyboard (the primary victim), Monitor (subjected to emergency strobe themes)
- Specifications: Infinite annoyance capability, 0% productivity throughput, 100% rage saturation point
- Tools required: VS Code, a keyboard you don't mind getting yelled at for touching, an active Ollama instance for AI-generated trauma

### Implementation
For Software:
# Installation
```bash
# Clone the repository
git clone https://github.com/viswajith275/useless_project_temp.git
cd useless_project_temp/Dusty_The_Chool

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as a VS Code VSIX extension
npm run package

# or you can install .vsix file from releases and run it
```

# Run
```bash
# Install the generated VSIX directly into VS Code:
code --install-extension dusty-the-chool-0.1.0.vsix

# Or press F5 inside VS Code to launch the Extension Development Host window.

# Optional: Run local Ollama 3B model for personalized Kerala meme roasts in English:
ollama run llama3.2:3b
```

### Project Documentation
For Software:

# Screenshots
![Dusty Sidebar View](Dusty_The_Chool/media/icons/idle.png)
*Dusty the Chool resting in the secondary sidebar with live state badge, speech bubble, dustpan capacity (murram), and rage meter.*

![Editor Gutter Sweep & CodeLens](Dusty_The_Chool/media/icons/eating.png)
*Multi-frame pixel-art broom bristles marching down the editor gutter toward a syntax error with native 'Feed Dusty' CodeLens.*

![Crashout Apocalypse Mode](Dusty_The_Chool/media/icons/clogged.png)
*Dusty reaching 100% Rage, triggering emergency strobes and entering full revenge code-deletion mode.*

### Project Demo
# Video
[Watch Dusty in Action (Demo Video)](https://github.com/viswajith275/useless_project_temp/releases/download/v0.1.0/dusty_demo.mp4)

*Demonstration video showing Dusty detecting syntax typos, sweeping code into his dustpan, choking on errors, and unleashing full 100% rage crashout mode with custom Kerala meme roasts.*

# Live Web Companion & Interactive Simulator
- **Live Demo:** [dusty-hazel.vercel.app](https://dusty-hazel.vercel.app)

- VSIX Extension Package: `dusty-the-chool-0.1.0.vsix`
- Command Palette Integration: Run `Cmd+Shift+P` -> `Dusty: Roast Me` or `Dusty: Trigger Crashout`

## Team Contributions
- Viswajith M P: Architectural design, VS Code extension host integration, diagnostic classification, procedural Web Audio synthesizer, Ollama 3B local LLM prompt engineering, and Kerala meme roast writing.
- Ishaangoutham K S: Canvas pixel-art renderer, CRT filter overlay, theme-switching chaos engine, and sound effect curation.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
