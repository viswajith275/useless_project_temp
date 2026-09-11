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
      this.item.text = '$(debug-disconnect) Dusty: Off';
      this.item.tooltip = 'Dusty engine is off. Click to turn on.';
      this.item.command = 'dusty.toggleEngine';
      this.item.backgroundColor = undefined;
      return;
    }

    if (snapshot.state === 'clogged') {
      this.item.text = `$(warning) Dusty: Clogged! (${snapshot.bagCount}/${snapshot.bagCapacity})`;
      this.item.tooltip = 'Dust bag is full! Click to unclog Dusty (or press Cmd/Ctrl+Alt+U C).';
      this.item.command = 'dusty.unclog';
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }

    if (snapshot.muted) {
      this.item.text = '$(mute) Dusty: Muted';
      this.item.tooltip = 'Audio is muted. Click to open sidebar.';
      this.item.command = 'dusty.openSidebar';
      this.item.backgroundColor = undefined;
      return;
    }

    switch (snapshot.state) {
      case 'hunting':
        this.item.text = '$(search) Dusty: Hunting...';
        this.item.tooltip = 'Dusty is scanning for edible syntax errors.';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'approaching':
      case 'eating':
        this.item.text = '$(flame) Dusty: Ingesting!';
        this.item.tooltip = 'Dusty is targeting an error!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'hungerStrike':
        this.item.text = '$(stop) Dusty: On Strike';
        this.item.tooltip = 'Dusty refuses to clean right now. Click to view.';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'tantrum':
        this.item.text = '$(zap) Dusty: Tantrum!';
        this.item.tooltip = 'Dusty is having a syntax breakdown.';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      default:
        // Idle
        this.item.text = `🧹 Dusty: Idle (${snapshot.bagCount}/${snapshot.bagCapacity})`;
        this.item.tooltip = `Dusty is purring quietly. Bag: ${snapshot.bagCount}/${snapshot.bagCapacity}. Click to open sidebar.`;
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
