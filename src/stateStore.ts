import * as vscode from 'vscode';
import {
  DustyState,
  ChaosIntensity,
  DustyDiagnosticTarget,
  DustyStateSnapshot,
  SerializableTarget
} from './types';

export class StateStore implements vscode.Disposable {
  private state: DustyState = 'idle';
  private bagCount = 0;
  private bagCapacity = 5;
  private enabled = true;
  private muted = false;
  private chaosIntensity: ChaosIntensity = 'normal';
  private lastRoast?: string;
  private activeTarget?: DustyDiagnosticTarget;

  private readonly _onDidChangeState = new vscode.EventEmitter<DustyStateSnapshot>();
  public readonly onDidChangeState = this._onDidChangeState.event;

  constructor(initialMuted = false, initialIntensity: ChaosIntensity = 'normal', initialEnabled = true) {
    this.muted = initialMuted;
    this.chaosIntensity = initialIntensity;
    this.enabled = initialEnabled;
    this.state = initialEnabled ? 'idle' : 'disabled';
    this.syncContextKeys();
  }

  public getSnapshot(): DustyStateSnapshot {
    let serializableTarget: SerializableTarget | undefined;
    if (this.activeTarget) {
      serializableTarget = {
        fsPath: this.activeTarget.uri.fsPath,
        line: this.activeTarget.range.start.line,
        character: this.activeTarget.range.start.character,
        endCharacter: this.activeTarget.range.end.character,
        message: this.activeTarget.message,
        confidence: this.activeTarget.confidence,
        safeDisposableToken: this.activeTarget.safeDisposableToken
      };
    }

    return {
      state: this.state,
      bagCount: this.bagCount,
      bagCapacity: this.bagCapacity,
      enabled: this.enabled,
      muted: this.muted,
      chaosIntensity: this.chaosIntensity,
      lastRoast: this.lastRoast,
      currentTarget: serializableTarget
    };
  }

  public getState(): DustyState {
    return this.state;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public isClogged(): boolean {
    return this.state === 'clogged' || this.bagCount >= this.bagCapacity;
  }

  public getBagCount(): number {
    return this.bagCount;
  }

  public getBagCapacity(): number {
    return this.bagCapacity;
  }

  public getActiveTarget(): DustyDiagnosticTarget | undefined {
    return this.activeTarget;
  }

  public transition(newState: DustyState): void {
    if (!this.enabled && newState !== 'disabled') {
      return;
    }

    if (this.state === newState) {
      return;
    }

    // Guard: Once clogged, can only transition to recovering, idle (via unclog), or disabled
    if (this.state === 'clogged' && newState !== 'recovering' && newState !== 'idle' && newState !== 'disabled') {
      return;
    }

    this.state = newState;
    this.syncContextKeys();
    this._onDidChangeState.fire(this.getSnapshot());
  }

  public setTarget(target: DustyDiagnosticTarget | undefined): void {
    this.activeTarget = target;
    this.syncContextKeys();
    this._onDidChangeState.fire(this.getSnapshot());
  }

  public incrementBag(): boolean {
    this.bagCount++;
    if (this.bagCount >= this.bagCapacity) {
      this.transition('clogged');
      return true; // Now clogged
    }
    this._onDidChangeState.fire(this.getSnapshot());
    return false;
  }

  public unclog(): void {
    this.bagCount = 0;
    this.transition('idle');
    this.syncContextKeys();
  }

  public resetBag(): void {
    this.bagCount = 0;
    if (this.state === 'clogged') {
      this.transition('idle');
    } else {
      this._onDidChangeState.fire(this.getSnapshot());
    }
  }

  public toggleEngine(forceState?: boolean): boolean {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    if (!this.enabled) {
      this.state = 'disabled';
      this.activeTarget = undefined;
    } else {
      this.state = this.bagCount >= this.bagCapacity ? 'clogged' : 'idle';
    }
    this.syncContextKeys();
    this._onDidChangeState.fire(this.getSnapshot());
    return this.enabled;
  }

  public toggleMute(forceMute?: boolean): boolean {
    this.muted = forceMute !== undefined ? forceMute : !this.muted;
    this.syncContextKeys();
    this._onDidChangeState.fire(this.getSnapshot());
    return this.muted;
  }

  public setChaosIntensity(intensity: ChaosIntensity): void {
    this.chaosIntensity = intensity;
    this._onDidChangeState.fire(this.getSnapshot());
  }

  public setRoast(roast: string): void {
    this.lastRoast = roast;
    this._onDidChangeState.fire(this.getSnapshot());
  }

  private syncContextKeys(): void {
    void vscode.commands.executeCommand('setContext', 'dusty.enabled', this.enabled);
    void vscode.commands.executeCommand('setContext', 'dusty.state', this.state);
    void vscode.commands.executeCommand('setContext', 'dusty.hasTarget', !!this.activeTarget);
    void vscode.commands.executeCommand('setContext', 'dusty.clogged', this.isClogged());
    void vscode.commands.executeCommand('setContext', 'dusty.muted', this.muted);
  }

  public dispose(): void {
    this._onDidChangeState.dispose();
  }
}
