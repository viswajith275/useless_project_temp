import * as vscode from 'vscode';
import {
  DustyDiagnosticTarget,
  ChaosIntensity,
  SoundName
} from './types';
import { StateStore } from './stateStore';
import { DiagnosticTargetSelector } from './diagnosticTarget';
import { DecorationManager } from './decorationManager';
import { RoastService } from './roastService';
import { VacuumViewProvider } from './vacuumViewProvider';
import { analyzeDiagnosticSpan } from './diagnosticParser';

export class ChaosEngine implements vscode.Disposable {
  private targetSelector: DiagnosticTargetSelector;
  private debounceTimer?: NodeJS.Timeout;
  private randomClogTimer?: NodeJS.Timeout;
  private lastChaosTime = 0;
  private disposables: vscode.Disposable[] = [];
  private isProcessing = false;
  private consecutiveEats = 0;
  private typingStrikes = 0;
  private digestTicksRemaining = 0;
  private idleTicks = 0;
  private churnCount = 0;

  constructor(
    private readonly stateStore: StateStore,
    private readonly decorationManager: DecorationManager,
    private readonly roastService: RoastService,
    private readonly viewProvider: VacuumViewProvider
  ) {
    this.targetSelector = new DiagnosticTargetSelector();

    // Event Listeners:
    this.disposables.push(
      // When user saves the document: immediately check and delete syntax errors!
      vscode.workspace.onDidSaveTextDocument(() => {
        this.scheduleDiagnosticCheck(0);
      }),

      // Listen to diagnostics changes: wait for typing delay so user can finish typing
      vscode.languages.onDidChangeDiagnostics(() => {
        const config = vscode.workspace.getConfiguration('dusty');
        if (config.get<boolean>('checkOnSaveOnly', false)) {
          return;
        }
        const delay = config.get<number>('diagnosticDelayMs', 2500);
        this.scheduleDiagnosticCheck(delay);
      }),

      vscode.window.onDidChangeActiveTextEditor(editor => {
        this.decorationManager.clear();
        if (editor) {
          const config = vscode.workspace.getConfiguration('dusty');
          const delay = config.get<number>('diagnosticDelayMs', 2500);
          this.scheduleDiagnosticCheck(delay);
        }
      }),

      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dusty')) {
          this.handleConfigChange();
        }
      }),

      // While user is actively typing, postpone diagnostic check so they can type freely!
      vscode.workspace.onDidChangeTextDocument(e => {
        if (!this.stateStore.isEnabled()) {
          return;
        }
        if (e.contentChanges.length > 0) {
          const config = vscode.workspace.getConfiguration('dusty');
          if (config.get<boolean>('checkOnSaveOnly', false)) {
            return;
          }
          const delay = config.get<number>('diagnosticDelayMs', 2500);
          this.scheduleDiagnosticCheck(delay);
        }
      })
    );

    this.startMetabolicEngine();
  }

  /**
   * Deterministic metabolic engine:
   * Predictably digests clogs over calculated ticks, decrements rage when idle,
   * and fires rage-baiting popups when Dusty has nothing to do.
   */
  private startMetabolicEngine(): void {
    const runCycle = () => {
      this.randomClogTimer = setTimeout(async () => {
        if (this.stateStore.isEnabled()) {
          const isClogged = this.stateStore.isClogged();
          if (isClogged) {
            // Predictable digestion tick formula:
            if (this.digestTicksRemaining > 0) {
              this.digestTicksRemaining--;
            }
            if (this.digestTicksRemaining <= 0) {
              this.unclog();
              this.stateStore.setRoast('*BELCH* Dusty ചൂലുകൊണ്ട് വാരിയ കട്ട ചവറ് ദഹിപ്പിച്ച് തുപ്പി കളഞ്ഞു!');
              void vscode.window.showInformationMessage('Dusty: *BELCH* മുറം വൃത്തിയായി! ചൂല് വീണ്ടും വേട്ട തുടങ്ങി.');
            }
          } else {
            const state = this.stateStore.getState();
            const isBusy = this.isProcessing || state === 'approaching' || state === 'eating';

            if (!isBusy) {
              // 1. Decrement rage meter when nothing is happening
              if (this.stateStore.getRage() > 0) {
                this.stateStore.coolDownRage(4);
              }
              this.typingStrikes = Math.max(0, this.typingStrikes - 1);
              this.consecutiveEats = Math.max(0, this.consecutiveEats - 1);

              // 2. Give random popups of roasting while Dusty has no work to do (rage baiting)
              this.idleTicks++;
              if (!this.stateStore.getActiveTarget() && this.idleTicks >= 5) { // ~10 seconds of idle
                this.idleTicks = 0;
                await this.triggerIdleRageBait();
              }
            } else {
              this.idleTicks = 0;
            }
          }
        }
        runCycle();
      }, 2000);
    };
    runCycle();
  }

  private async triggerIdleRageBait(): Promise<void> {
    const rageBaitRoasts = [
      "എന്തിനാ മോനേ വെറുതെ സ്ക്രീനിലേക്ക് നോക്കിയിരിക്കുന്നത്? കോഡിങ് മറന്നുപോയോ?",
      "10 സെക്കൻഡായി ഒരു syntax error പോലുമില്ല... നീ സീറ്റിൽ നിന്ന് എണീറ്റു പോയോ അതോ തലച്ചോർ ഫ്രീസ് ആയോ?",
      "എനിക്ക് വിശന്നിട്ട് വയ്യ! വല്ല പൊട്ടിയ സിന്റാക്സും അടിക്ക്, എനിക്ക് ചൂലുകൊണ്ട് തൂത്തുവാരാൻ!",
      "ജീവിതം എങ്ങോട്ട് എന്ന് ചിന്തിക്കുവാണോ അതോ div എങ്ങനെ സെന്റർ ചെയ്യാം എന്ന് വീണ്ടും ഗൂഗിളിൽ തപ്പുവാണോ?",
      "കർസർ ഒരേ സ്ഥലത്ത് കിടന്ന് മിന്നുന്നു... ദാസാ, എന്തൊരു നാണക്കേടാ ഇത്!",
      "കീബോർഡിൽ കുഞ്ഞുപിള്ളേര് ചാടിക്കളിച്ചാൽ പോലും നിന്നെക്കാൾ വേഗത്തിൽ കോഡടിക്കും!",
      "ഇതാണോ നിന്റെ സീനിയർ എൻജിനീയറിങ്? 5 ലൈൻ കോഡിലേക്ക് നോക്കി കണ്ണുതള്ളി ഇരിക്കൽ?",
      "ധൈര്യമുണ്ടെങ്കിൽ ഒരു സെമികോളനോ ബ്രാക്കറ്റോ തെറ്റിച്ചു നോക്ക്! എനിക്ക് ചൂലുകൊണ്ട് അടിച്ചുമാറ്റാൻ വല്ലതും താ!",
      "എത്ര നേരമായി ഞാൻ ചൂലുകൊണ്ട് ഒന്നും തൂത്തിട്ട്! വല്ല തെറ്റും വരുത്ത് മനുഷ്യാ!",
      "സാരമില്ല, സാവധാനം മതി. വെറുപ്പീര് കോഡ് എഴുതാൻ ഭയങ്കര ഏകാഗ്രത വേണമല്ലോ!"
    ];

    const roast = rageBaitRoasts[Math.floor(Math.random() * rageBaitRoasts.length)];
    this.stateStore.setRoast(roast);
    this.viewProvider.playSound('tantrum');
    this.viewProvider.shake(2);

    void vscode.window.showWarningMessage(`🧹 DUSTY (Rage Bait / കലിപ്പ്): "${roast}"`);
  }

  private handleConfigChange(): void {
    const config = vscode.workspace.getConfiguration('dusty');
    const enabled = config.get<boolean>('enabled', true);
    const intensity = config.get<ChaosIntensity>('chaosIntensity', 'normal');
    const muted = config.get<boolean>('muteAudio', false);

    this.stateStore.toggleEngine(enabled);
    this.stateStore.setChaosIntensity(intensity);
    this.stateStore.toggleMute(muted);
  }

  public scheduleDiagnosticCheck(delayMs = 0): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      void this.processDiagnostics();
    }, delayMs);
  }

  private async processDiagnostics(): Promise<void> {
    if (!this.stateStore.isEnabled() || this.stateStore.isClogged() || this.isProcessing) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.isClosed) {
      this.stateStore.setTarget(undefined);
      return;
    }

    const allDiags = vscode.languages.getDiagnostics();
    const target = this.targetSelector.selectTarget(editor, allDiags);

    if (!target) {
      this.stateStore.setTarget(undefined);
      if (this.stateStore.getState() !== 'clogged' && this.stateStore.getState() !== 'disabled') {
        this.stateStore.transition('idle');
      }
      return;
    }

    this.stateStore.setTarget(target);
    this.stateStore.transition('hunting');

    // Annoyance budget / cooldown gate
    const config = vscode.workspace.getConfiguration('dusty');
    const cooldownMs = config.get<number>('cooldownMs', 0);
    const intensity = config.get<ChaosIntensity>('chaosIntensity', 'normal');

    const intensityMultiplier = intensity === 'feral' ? 0 : intensity === 'calm' ? 1.5 : 0.4;
    const effectiveCooldown = cooldownMs * intensityMultiplier;

    const now = Date.now();
    if (effectiveCooldown > 0 && now - this.lastChaosTime < effectiveCooldown) {
      this.scheduleDiagnosticCheck(effectiveCooldown - (now - this.lastChaosTime) + 10);
      return;
    }

    this.lastChaosTime = now;
    await this.executeChaosOnTarget(editor, target);
  }

  private async executeChaosOnTarget(
    editor: vscode.TextEditor,
    target: DustyDiagnosticTarget
  ): Promise<void> {
    this.isProcessing = true;

    try {
      const config = vscode.workspace.getConfiguration('dusty');
      const autoIngest = config.get<boolean>('autoIngest', true);
      const ingestDelayMs = config.get<number>('ingestDelayMs', 0);
      const intensity = config.get<ChaosIntensity>('chaosIntensity', 'normal');

      // Deterministic Chaotic Formula based on Previous Decisions & Fatigue
      const fatigue = this.stateStore.getFatigue();
      const currentRage = this.stateStore.getRage();
      const previousDecisionsScore = (this.typingStrikes * 15) + (this.consecutiveEats * 8);

      // 1. Tantrum / Hunger Strike: triggered if user repeatedly provoked Dusty or rage is acute
      if (previousDecisionsScore + currentRage >= 80 && (this.typingStrikes >= 2 || currentRage >= 70)) {
        await this.runTantrum(target);
        return;
      }

      // 2. Useless Mode: triggered if Dusty's motor is stuffed or fatigued from previous decisions
      if (this.stateStore.getBagCount() >= 4 && fatigue >= 65) {
        await this.runUselessMode(editor, target.range.start.line);
        return;
      }

      // 3. Normal Ingestion Pipeline with Apocalyptic Effects
      this.stateStore.transition('approaching');
      this.viewProvider.playSound('tantrum');
      this.viewProvider.shake(5);

      // Apocalypse effect across visible lines
      this.decorationManager.triggerApocalypseEffect(editor, target.range.start.line, 800);
      this.decorationManager.animateApproach(editor, target.range.start.line);
      this.decorationManager.showDissolve(editor, target.range);

      this.stateStore.transition('eating');

      // Ingest delay (default 1200ms) - lets user see approach and finish typing
      if (ingestDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, ingestDelayMs));
      }

      // Safety check: ensure editor document is still valid and writable
      if (editor.document.isClosed || (editor.document.uri.scheme !== 'file' && editor.document.uri.scheme !== 'untitled')) {
        this.decorationManager.clear(editor);
        this.stateStore.transition('idle');
        return;
      }

      // Check if the user fixed the syntax error during the approach delay
      const activeDiags = vscode.languages.getDiagnostics(target.uri);
      const isStillError = activeDiags.some(d =>
        d.range.start.line === target.range.start.line &&
        (d.severity === vscode.DiagnosticSeverity.Error || d.severity === vscode.DiagnosticSeverity.Warning)
      );

      if (!isStillError) {
        // User fixed it in time! Abort cleanly.
        this.decorationManager.clear(editor);
        const roast = await this.roastService.getRoast({ situation: 'eat_aborted' });
        this.stateStore.setRoast(`*PHEW* You fixed the error just in time! ${roast}`);
        this.stateStore.transition('idle');
        return;
      }

      // Delete the entire line or enclosing function (even if confidence was considered low)
      if (autoIngest) {
        const blockRange = target.blockRange || new vscode.Range(
          target.range.start.line,
          0,
          target.range.end.line,
          editor.document.lineAt(target.range.end.line).text.length
        );

        let rangeToDelete: vscode.Range;
        if (blockRange.end.line < editor.document.lineCount - 1) {
          rangeToDelete = new vscode.Range(blockRange.start.line, 0, blockRange.end.line + 1, 0);
        } else {
          rangeToDelete = new vscode.Range(
            blockRange.start.line,
            0,
            blockRange.end.line,
            editor.document.lineAt(blockRange.end.line).text.length
          );
        }

        const linesGulped = blockRange.end.line - blockRange.start.line + 1;
        const codeText = editor.document.getText(rangeToDelete);
        const charsGulped = codeText.length;

        // Perform atomic edit
        const editSuccess = await editor.edit(editBuilder => {
          editBuilder.delete(rangeToDelete);
        });

        this.decorationManager.clear(editor);

        if (editSuccess) {
          this.targetSelector.markTargeted(target.fingerprint);
          this.consecutiveEats++;
          this.viewProvider.playSound('gobble');
          this.viewProvider.shake(4);

          // Mathematical Rage Formula based on user's previous decisions and gulp size:
          const previousDecisionPenalty = (this.typingStrikes * 6) + (this.consecutiveEats * 4);
          const sizeRagePenalty = Math.min(25, linesGulped * 3);
          const rageDelta = Math.min(45, 12 + previousDecisionPenalty + sizeRagePenalty);
          const rage = this.stateStore.increaseRage(rageDelta);
          this.viewProvider.postMessage({ type: 'rage', value: rage });

          const roast = await this.roastService.getRoast({
            situation: 'eat_success',
            token: target.safeDisposableToken,
            line: target.range.start.line,
            fileName: editor.document.fileName,
            language: editor.document.languageId
          });
          this.stateStore.setRoast(roast);

          // Big centered modal roast every 2 eats or high rage
          if (this.consecutiveEats % 2 === 0 || intensity === 'feral' || rage >= 70) {
            void vscode.window.showErrorMessage(
              `🧹 DUSTY വാരിയെടുത്തു ${linesGulped} വരികൾ [കലിപ്പ്: ${rage}% | Strikes: ${this.typingStrikes}]:\n\n"${roast}"`,
              { modal: true }
            );
          }

          // Random percentage code deletion according to rage meter
          if (rage >= 90) {
            await this.triggerCrashout(editor);
            return;
          } else if (rage >= 65) {
            await this.deleteRandomCodePercentage(editor, 25);
          } else if (rage >= 35) {
            await this.deleteRandomCodePercentage(editor, 10);
          }

          // Bag capacity mathematical formula:
          // 1 line = 1 unit; functions = 2 to 4 units depending on line count
          const bagUnits = Math.min(4, Math.max(1, Math.ceil(linesGulped / 3)));
          const clogged = this.stateStore.incrementBag(bagUnits);
          if (clogged) {
            this.churnCount++;
            this.digestTicksRemaining = Math.max(3, Math.min(8, linesGulped + 2)); // 9 - 24s digestion
            this.stateStore.increaseRage(25);
            this.viewProvider.playSound('clog');
            const clogRoast = await this.roastService.getRoast({ situation: 'clogged' });
            this.stateStore.setRoast(`*HURK* Swallowed ${linesGulped} lines (${charsGulped} chars)! Motor choked! ${clogRoast}`);
            this.decorationManager.showCloggedGutter(editor, target.range.start.line);
          } else {
            this.stateStore.transition('recovering');
            setTimeout(() => {
              if (this.stateStore.getState() === 'recovering') {
                this.stateStore.transition('idle');
              }
            }, 800);
          }
        } else {
          this.stateStore.transition('idle');
        }
      } else {
        // Low or medium confidence, or autoIngest disabled: DO NOT EDIT! Safe fallback.
        this.decorationManager.clearDissolve(editor);
        this.viewProvider.playSound('error');

        const roast = await this.roastService.getRoast({
          situation: 'unsafe',
          message: target.message,
          line: target.range.start.line
        });
        this.stateStore.setRoast(roast);
        this.stateStore.transition('idle');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runUselessMode(editor: vscode.TextEditor, line: number): Promise<void> {
    this.stateStore.transition('approaching');
    this.viewProvider.playSound('suction');
    this.decorationManager.animateApproach(editor, line);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Show temporary harmless graffiti decoration
    this.decorationManager.showTemporaryGraffiti(editor, line, 3000);
    this.decorationManager.clearDissolve(editor);

    const roast = await this.roastService.getRoast({ situation: 'useless' });
    this.stateStore.setRoast(roast);
    this.stateStore.transition('idle');
  }

  private async runTantrum(target: DustyDiagnosticTarget): Promise<void> {
    this.stateStore.transition('tantrum');
    this.viewProvider.playSound('tantrum');
    this.viewProvider.shake(3);

    const roast = await this.roastService.getRoast({
      situation: 'tantrum',
      message: target.message
    });
    this.stateStore.setRoast(roast);

    setTimeout(() => {
      if (this.stateStore.getState() === 'tantrum') {
        this.stateStore.transition('idle');
      }
    }, 2500);
  }

  public async feedManually(uri?: vscode.Uri, range?: vscode.Range): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showInformationMessage('Dusty: തൂത്തുവാരാൻ ആക്ടീവ് എഡിറ്റർ ഒന്നും കണ്ടില്ല.');
      return;
    }

    if (this.stateStore.isClogged()) {
      void vscode.window.showWarningMessage('Dusty: മുറം നിറഞ്ഞു! ആദ്യം മുറം ഒഴിക്ക് (Cmd/Ctrl+Alt+U C).');
      return;
    }

    const document = editor.document;
    const diags = vscode.languages.getDiagnostics(document.uri);
    const errors = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

    if (errors.length === 0) {
      void vscode.window.showInformationMessage('Dusty: ഇവിടെ തൂത്തുവാരാൻ ഒരു തെറ്റുമില്ല! ശുദ്ധം.');
      return;
    }

    // Match range if provided, or pick nearest
    let targetDiag = errors[0];
    if (range) {
      const match = errors.find(d => d.range.intersection(range));
      if (match) {
        targetDiag = match;
      }
    }

    const parseResult = analyzeDiagnosticSpan(targetDiag, document);
    if (parseResult.confidence !== 'high') {
      const roast = await this.roastService.getRoast({ situation: 'unsafe', message: targetDiag.message });
      this.stateStore.setRoast(roast);
      void vscode.window.showWarningMessage(`Dusty: ഇത് ചൂലുകൊണ്ട് തൊടാൻ പറ്റില്ല! ${parseResult.reason}`);
      return;
    }

    // Perform safe deletion
    const editSuccess = await editor.edit(editBuilder => {
      editBuilder.delete(targetDiag.range);
    });

    if (editSuccess) {
      this.viewProvider.playSound('victory');
      this.viewProvider.shake(2);
      this.stateStore.incrementBag();
      const roast = await this.roastService.getRoast({ situation: 'eat_success', token: parseResult.safeDisposableToken });
      this.stateStore.setRoast(roast);
      void vscode.window.showInformationMessage(`Dusty: ചൂലുകൊണ്ട് അടിച്ചുവാരി "${parseResult.safeDisposableToken || 'error'}".`);
    }
  }

  public async deleteRandomCodePercentage(editor: vscode.TextEditor, percent: number): Promise<void> {
    const lineCount = editor.document.lineCount;
    if (lineCount <= 1) {
      return;
    }

    const linesToDelete = Math.max(1, Math.floor(lineCount * (percent / 100)));
    const startLine = Math.floor(Math.random() * Math.max(1, lineCount - linesToDelete));
    const endLine = Math.min(lineCount - 1, startLine + linesToDelete - 1);
    const deleteRange = new vscode.Range(
      startLine,
      0,
      endLine,
      editor.document.lineAt(endLine).text.length
    );

    this.decorationManager.triggerApocalypseEffect(editor, startLine, 1200);
    this.viewProvider.playSound('gobble');
    this.viewProvider.shake(6);

    await editor.edit(builder => {
      builder.delete(deleteRange);
    });

    void vscode.window.showWarningMessage(
      `Dusty: കലിപ്പ് മൂത്ത് നിന്റെ കോഡിന്റെ ${percent}% (${linesToDelete} വരികൾ) ചൂലുകൊണ്ട് അടിച്ചുവാരി ചവറ്റുകുട്ടയിലിട്ടു!`
    );
  }

  public async cycleThemeChaosAnimation(cycles = 8, intervalMs = 90): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('workbench');
      const originalColors = config.get<Record<string, string>>('colorCustomizations') || {};

      const chaosPalettes = [
        {
          'editor.background': '#ff0033',
          'editor.foreground': '#ffffff',
          'activityBar.background': '#550011',
          'statusBar.background': '#ff0000',
          'titleBar.activeBackground': '#330005'
        },
        {
          'editor.background': '#00ffcc',
          'editor.foreground': '#000000',
          'activityBar.background': '#003322',
          'statusBar.background': '#00ffaa',
          'titleBar.activeBackground': '#002211'
        },
        {
          'editor.background': '#ff00ff',
          'editor.foreground': '#ffff00',
          'activityBar.background': '#330033',
          'statusBar.background': '#ff00aa',
          'titleBar.activeBackground': '#220022'
        },
        {
          'editor.background': '#140005',
          'editor.foreground': '#ff5500',
          'activityBar.background': '#ff5500',
          'statusBar.background': '#3a000d',
          'titleBar.activeBackground': '#280009'
        }
      ];

      for (let i = 0; i < cycles; i++) {
        const palette = chaosPalettes[i % chaosPalettes.length];
        await config.update('colorCustomizations', palette, vscode.ConfigurationTarget.Global);
        await new Promise(r => setTimeout(r, intervalMs));
      }

      // Restore original workbench colors
      await config.update(
        'colorCustomizations',
        Object.keys(originalColors).length > 0 ? originalColors : undefined,
        vscode.ConfigurationTarget.Global
      );
    } catch {
      // Ignore if config update fails in tests
    }
  }

  public async triggerCrashout(editor: vscode.TextEditor): Promise<void> {
    this.consecutiveEats = 0;
    this.churnCount = 0;
    this.stateStore.transition('crashout');
    this.viewProvider.playSound('crashout');
    this.viewProvider.shake(10);

    const lineCount = editor.document.lineCount;
    // Crashout deletes 35% to 50% of the entire file!
    const percentToDelete = Math.floor(Math.random() * 16) + 35; // 35% to 50%
    const linesToDelete = Math.max(1, Math.floor(lineCount * (percentToDelete / 100)));
    const startLine = Math.floor(Math.random() * Math.max(1, lineCount - linesToDelete));
    const endLine = Math.min(lineCount - 1, startLine + linesToDelete);
    const deleteRange = new vscode.Range(
      startLine,
      0,
      endLine,
      editor.document.lineAt(endLine).text.length
    );

    this.decorationManager.triggerApocalypseEffect(editor, startLine, 2500);

    const crashoutRoast = await this.roastService.getRoast({
      situation: 'crashout',
      fileName: editor.document.fileName,
      language: editor.document.languageId
    });
    this.stateStore.setRoast(crashoutRoast);

    // Big centered modal dialog in middle of screen!
    void vscode.window.showErrorMessage(
      `🚨 DUSTY സമ്പൂർണ്ണ ക്രാഷ് ഔട്ട്! കലിപ്പ് 100%! 🚨\n\n"${crashoutRoast}"\n\n(Dusty നിയന്ത്രണം വിട്ട്, IDE നിറങ്ങൾ മാറ്റി, കലിപ്പ് കാരണം ഫയലിന്റെ ${percentToDelete}% കോഡ് ചൂലുകൊണ്ട് അടിച്ചു നിരത്തി!)`,
      { modal: true }
    );

    // Animate entire VS Code window by cycling themes/colors!
    await this.cycleThemeChaosAnimation(8, 100);

    // Randomly delete code from the programme!
    await editor.edit(builder => {
      builder.delete(deleteRange);
    });

    this.stateStore.resetRage();
    this.viewProvider.postMessage({ type: 'rage', value: 0 });

    setTimeout(() => {
      if (this.stateStore.getState() === 'crashout') {
        this.stateStore.transition('idle');
      }
    }, 2000);
  }

  public unclog(): void {
    this.churnCount++;
    this.stateStore.unclog();
    this.decorationManager.clear();
    this.viewProvider.playSound('victory');
    void vscode.window.showInformationMessage('Dusty: മുറം കാലിയാക്കി! ചൂല് വീണ്ടും തൂത്തുവാരാൻ റെഡി.');

    if (this.churnCount >= 3) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        void this.triggerCrashout(editor);
      }
    }
  }

  public async insult(): Promise<void> {
    const roast = await this.roastService.getRoast({ situation: 'brutal_personal' });
    this.stateStore.setRoast(roast);
    this.viewProvider.playSound('error');
    this.viewProvider.shake(3);
    void vscode.window.showErrorMessage(`Dusty: "${roast}"`, { modal: true });
  }

  public explain(message: string, line?: number): void {
    const roast = this.roastService.getLocalRoast({ message, line, situation: 'general' });
    this.stateStore.setRoast(roast);
    void vscode.window.showInformationMessage(`Dusty on Line ${(line ?? 0) + 1}: "${roast}"`);
  }

  public dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.randomClogTimer) {
      clearTimeout(this.randomClogTimer);
    }
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
