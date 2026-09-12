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
      this.item.tooltip = 'Choolu off aanu. Click cheythu on aakkuka.';
      this.item.command = 'dusty.toggleEngine';
      this.item.backgroundColor = undefined;
      return;
    }

    if (snapshot.state === 'clogged') {
      this.item.text = `$(warning) Dusty: Muram niranju! (${snapshot.bagCount}/${snapshot.bagCapacity})`;
      this.item.tooltip = 'Muram niranju thulumbi! Click cheythu muram ozhikku (Cmd/Ctrl+Alt+U C).';
      this.item.command = 'dusty.unclog';
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }

    if (snapshot.muted) {
      this.item.text = '$(mute) Dusty: Muted (Silent)';
      this.item.tooltip = 'Sound off aanu. Sidebar thurakkaan click cheyyuka.';
      this.item.command = 'dusty.openSidebar';
      this.item.backgroundColor = undefined;
      return;
    }

    switch (snapshot.state) {
      case 'hunting':
        this.item.text = '$(search) Dusty: Hunting... (Thirayunnu)';
        this.item.tooltip = 'Thoothuvaaraan syntax thettukal thirayunnu...';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'approaching':
      case 'eating':
        this.item.text = '$(flame) Dusty: Sweeping! (Vaariyedukkunnu)';
        this.item.tooltip = 'Choolu thettine lakshyamittu adichuvaarunnu!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'hungerStrike':
        this.item.text = '$(stop) Dusty: Strike (Samaram)';
        this.item.tooltip = 'Vrithiketta code kandu choolu panimudakkilaanu!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'tantrum':
        this.item.text = '$(zap) Dusty: Kalippu Ilaki!';
        this.item.tooltip = 'Syntax thettu kandu choolinte samashani thetti!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      case 'crashout':
        this.item.text = '$(flame) Dusty: CRASHOUT! (100%)';
        this.item.tooltip = 'Choolinu kalippu 100%! File thachudaykkaan irangiyirikkunnu!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      default:
        // Idle
        const rageLabel = snapshot.rageMeter > 0 ? ` [Kalippu: ${snapshot.rageMeter}%]` : '';
        this.item.text = `🧹 Dusty: Idle (${snapshot.bagCount}/${snapshot.bagCapacity})${rageLabel}`;
        this.item.tooltip = `Choolu ready aanu. Muram: ${snapshot.bagCount}/${snapshot.bagCapacity}. Kalippu: ${snapshot.rageMeter}%. Sidebar thurakkaan click cheyyuka.`;
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
