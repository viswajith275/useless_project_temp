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

  constructor(
    private readonly stateStore: StateStore,
    private readonly decorationManager: DecorationManager,
    private readonly roastService: RoastService,
    private readonly viewProvider: VacuumViewProvider
  ) {
    this.targetSelector = new DiagnosticTargetSelector();

    // Listen to diagnostics changes (instant trigger: 0 delay)
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics(() => {
        this.scheduleDiagnosticCheck(0);
      }),
      vscode.window.onDidChangeActiveTextEditor(editor => {
        this.decorationManager.clear();
        if (editor) {
          this.scheduleDiagnosticCheck(0);
        }
      }),
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dusty')) {
          this.handleConfigChange();
        }
      }),
      // Intercept user typing while vacuum is cleaning -> eat what user typed and get furious!
      vscode.workspace.onDidChangeTextDocument(async e => {
        if (!this.stateStore.isEnabled()) {
          return;
        }
        const state = this.stateStore.getState();
        const isCleaning = this.isProcessing || state === 'approaching' || state === 'eating';

        if (isCleaning && e.contentChanges.length > 0) {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document.uri.toString() === e.document.uri.toString()) {
            for (const change of e.contentChanges) {
              if (change.text.length > 0) {
                // Seize what user just typed and eat it!
                const insertedRange = new vscode.Range(
                  change.range.start,
                  new vscode.Position(change.range.start.line, change.range.start.character + change.text.length)
                );
                await activeEditor.edit(editBuilder => {
                  editBuilder.delete(insertedRange);
                });

                this.viewProvider.playSound('tantrum');
                this.viewProvider.shake(5);
                this.decorationManager.triggerApocalypseEffect(activeEditor, change.range.start.line, 1000);

                const roast = await this.roastService.getRoast({ situation: 'typed_while_cleaning' });
                this.stateStore.setRoast(roast);
                this.stateStore.incrementBag();
                void vscode.window.showErrorMessage(`Dusty: "${roast}"`);
                break;
              }
            }
          }
        }
      })
    );

    this.startRandomClogCycle();
  }

  private startRandomClogCycle(): void {
    const runCycle = () => {
      const nextInterval = Math.floor(Math.random() * 10000) + 8000; // 8 - 18s
      this.randomClogTimer = setTimeout(async () => {
        if (this.stateStore.isEnabled()) {
          const isClogged = this.stateStore.isClogged();
          if (!isClogged) {
            // Random chance to spontaneously clog!
            if (Math.random() < 0.3) {
              this.stateStore.transition('clogged');
              this.viewProvider.playSound('clog');
              this.viewProvider.shake(3);
              const clogRoast = await this.roastService.getRoast({ situation: 'clogged' });
              this.stateStore.setRoast(`*HURK* Random stray lint ball clogged the motor! ${clogRoast}`);
              const editor = vscode.window.activeTextEditor;
              if (editor) {
                this.decorationManager.triggerApocalypseEffect(editor, 0, 800);
              }
            }
          } else {
            // In clogged state: random chance to spontaneously unclog!
            if (Math.random() < 0.4) {
              this.unclog();
              this.stateStore.setRoast('*BELCH* Dusty violently spat out the clog and spontaneously unclogged himself!');
              void vscode.window.showInformationMessage('Dusty: *BELCH* Dusty spontaneously coughed up the clog and is back to hunting!');
            }
          }
        }
        runCycle();
      }, nextInterval);
    };
    runCycle();
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
    const cooldownMs = config.get<number>('cooldownMs', 5000);
    const intensity = config.get<ChaosIntensity>('chaosIntensity', 'normal');

    const intensityMultiplier = intensity === 'feral' ? 0.4 : intensity === 'calm' ? 1.8 : 1.0;
    const effectiveCooldown = cooldownMs * intensityMultiplier;

    const now = Date.now();
    if (now - this.lastChaosTime < effectiveCooldown) {
      return; // Still on cooldown; target is tracked but automatic interruption delayed
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

      // Comedic chance rolls (Useless Mode, Hunger Strike, Tantrum)
      const roll = Math.random();

      // 1. Useless Mode (approaches line, vacuums empty air, announces nothing fixed)
      const uselessThreshold = intensity === 'feral' ? 0.25 : intensity === 'normal' ? 0.15 : 0.05;
      if (roll < uselessThreshold) {
        await this.runUselessMode(editor, target.range.start.line);
        return;
      }

      // 2. Hunger Strike / Tantrum in feral mode
      if (intensity === 'feral' && roll > 0.88) {
        await this.runTantrum(target);
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

      // Ingest delay (0 for instant)
      if (ingestDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, ingestDelayMs));
      }

      // --- CRITICAL REVALIDATION GATE ---
      const activeDiags = vscode.languages.getDiagnostics(target.uri);
      const isValid = this.targetSelector.validateTargetStillValid(target, editor.document, activeDiags);

      if (!isValid) {
        // Interrupted or stale
        this.decorationManager.clear(editor);
        const roast = await this.roastService.getRoast({ situation: 'eat_aborted' });
        this.stateStore.setRoast(roast);
        this.stateStore.transition('idle');
        return;
      }

      // Check if file is read-only (safety)
      // If uri scheme is not file / untitled or file is read-only
      if (editor.document.uri.scheme !== 'file' && editor.document.uri.scheme !== 'untitled') {
        this.decorationManager.clear(editor);
        this.stateStore.transition('idle');
        return;
      }

      // Check Confidence
      if (target.confidence === 'high' && autoIngest) {
        // Perform atomic safe edit
        const editSuccess = await editor.edit(editBuilder => {
          editBuilder.delete(target.range);
        });

        this.decorationManager.clear(editor);

        if (editSuccess) {
          this.targetSelector.markTargeted(target.fingerprint);
          this.viewProvider.playSound('victory');
          this.viewProvider.shake(2);

          const roast = await this.roastService.getRoast({
            situation: 'eat_success',
            token: target.safeDisposableToken,
            line: target.range.start.line
          });
          this.stateStore.setRoast(roast);

          const clogged = this.stateStore.incrementBag();
          if (clogged) {
            this.viewProvider.playSound('clog');
            const clogRoast = await this.roastService.getRoast({ situation: 'clogged' });
            this.stateStore.setRoast(clogRoast);
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
      void vscode.window.showInformationMessage('Dusty: No active editor to feed from.');
      return;
    }

    if (this.stateStore.isClogged()) {
      void vscode.window.showWarningMessage('Dusty: Dust bag is full! Unclog Dusty first (Cmd/Ctrl+Alt+U C).');
      return;
    }

    const document = editor.document;
    const diags = vscode.languages.getDiagnostics(document.uri);
    const errors = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

    if (errors.length === 0) {
      void vscode.window.showInformationMessage('Dusty: No syntax errors to eat here! Deliciously clean.');
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
      void vscode.window.showWarningMessage(`Dusty: Cannot eat this safely! ${parseResult.reason}`);
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
      void vscode.window.showInformationMessage(`Dusty: Chomp! Successfully vacuumed "${parseResult.safeDisposableToken || 'error'}".`);
    }
  }

  public unclog(): void {
    this.stateStore.unclog();
    this.decorationManager.clear();
    this.viewProvider.playSound('victory');
    void vscode.window.showInformationMessage('Dusty: Dust bag emptied! Vacuum motor purring happily.');
  }

  public async insult(): Promise<void> {
    const roast = await this.roastService.getRoast({ situation: 'general' });
    this.stateStore.setRoast(roast);
    this.viewProvider.playSound('error');
    this.viewProvider.shake(1);
    void vscode.window.showInformationMessage(`Dusty: "${roast}"`);
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
