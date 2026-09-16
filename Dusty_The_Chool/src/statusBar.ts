import * as vscode from 'vscode';
import { StateStore } from './stateStore';
import { DustyStateSnapshot } from './types';

export class DustyStatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly stateStore: StateStore) {
    this.item = vscode.window.createStatusBarItem(
      'dusty.statusBar',
      vscode.StatusBarAlignment.Right,
      95
    );
    this.item.name = 'Dusty the Vacuum';

    this.disposables.push(
      this.stateStore.onDidChangeState((snapshot: DustyStateSnapshot) => {
        this.update(snapshot);
      })
    );

    this.update(this.stateStore.getSnapshot());
    this.item.show();
  }

  private update(snapshot: DustyStateSnapshot): void {
    if (!snapshot.enabled) {
      this.item.text = '$(debug-disconnect) Dusty: Off (Rest)';
      this.item.tooltip = 'Dusty is resting. Click to start sweeping.';
      this.item.command = 'dusty.toggleEngine';
      this.item.backgroundColor = undefined;
      return;
    }

    if (snapshot.state === 'clogged') {
      this.item.text = `$(warning) Dusty: Dustpan Full! (${snapshot.bagCount}/${snapshot.bagCapacity})`;
      this.item.tooltip = 'Dustpan is overflowing! Click to unclog (Cmd/Ctrl+Alt+U C).';
      this.item.command = 'dusty.unclog';
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }

    if (snapshot.muted) {
      this.item.text = '$(mute) Dusty: Muted (Silent)';
      this.item.tooltip = 'Sound is muted. Click to open sidebar.';
      this.item.command = 'dusty.openSidebar';
      this.item.backgroundColor = undefined;
      return;
    }

    switch (snapshot.state) {
      case 'hunting':
        this.item.text = '$(search) Dusty: Hunting...';
        this.item.tooltip = 'Hunting for broken syntax to sweep...';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'approaching':
      case 'eating':
        this.item.text = '$(flame) Dusty: Sweeping!';
        this.item.tooltip = 'Target locked! Sweeping error into dustpan!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'hungerStrike':
        this.item.text = '$(stop) Dusty: Strike (Trade Union)';
        this.item.tooltip = 'Dusty went on strike due to terrible code quality!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'tantrum':
        this.item.text = '$(zap) Dusty: Tantrum (Kalippu)!';
        this.item.tooltip = 'Syntax errors caused the broom to lose its mind!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      case 'crashout':
        this.item.text = '$(flame) Dusty: CRASHOUT! (100%)';
        this.item.tooltip = '100% Kalippu! Dusty is on a rampage deleting code!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      default:
        // Idle
        const rageLabel = snapshot.rageMeter > 0 ? ` [Kalippu: ${snapshot.rageMeter}%]` : '';
        this.item.text = `🧹 Dusty: Idle (${snapshot.bagCount}/${snapshot.bagCapacity})${rageLabel}`;
        this.item.tooltip = `Dusty is ready. Dustpan: ${snapshot.bagCount}/${snapshot.bagCapacity}. Kalippu: ${snapshot.rageMeter}%. Click to open sidebar.`;
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;
    }
  }

  public dispose(): void {
    this.item.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
