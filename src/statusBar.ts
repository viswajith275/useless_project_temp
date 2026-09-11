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
      this.item.text = '$(debug-disconnect) Dusty: Off (വിശ്രമം)';
      this.item.tooltip = 'ചൂല് ഓഫ് ആണ്. ക്ലിക്ക് ചെയ്ത് ഓൺ ചെയ്യുക.';
      this.item.command = 'dusty.toggleEngine';
      this.item.backgroundColor = undefined;
      return;
    }

    if (snapshot.state === 'clogged') {
      this.item.text = `$(warning) Dusty: മുറം നിറഞ്ഞു! (${snapshot.bagCount}/${snapshot.bagCapacity})`;
      this.item.tooltip = 'മുറം നിറഞ്ഞു തുളുമ്പി! ക്ലിക്ക് ചെയ്ത് മുറം ഒഴിക്ക് (Cmd/Ctrl+Alt+U C).';
      this.item.command = 'dusty.unclog';
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }

    if (snapshot.muted) {
      this.item.text = '$(mute) Dusty: Muted (ശബ്ദമില്ല)';
      this.item.tooltip = 'ശബ്ദം ഓഫ് ആണ്. സൈഡ്ബാർ തുറക്കാൻ ക്ലിക്ക് ചെയ്യുക.';
      this.item.command = 'dusty.openSidebar';
      this.item.backgroundColor = undefined;
      return;
    }

    switch (snapshot.state) {
      case 'hunting':
        this.item.text = '$(search) Dusty: Hunting... (തിരയുന്നു)';
        this.item.tooltip = 'തൂത്തുവാരാൻ സിന്റാക്സ് തെറ്റ് തിരയുന്നു...';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'approaching':
      case 'eating':
        this.item.text = '$(flame) Dusty: Sweeping! (വാരിയെടുക്കുന്നു)';
        this.item.tooltip = 'ചൂല് തെറ്റിനെ ലക്ഷ്യമിട്ട് അടിച്ചുവാരുന്നു!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'hungerStrike':
        this.item.text = '$(stop) Dusty: സമരം (Strike)';
        this.item.tooltip = 'വൃത്തികെട്ട കോഡ് കണ്ട് ചൂല് പണിമുടക്കിലാണ്!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'tantrum':
        this.item.text = '$(zap) Dusty: കലിപ്പ് ഇളകി!';
        this.item.tooltip = 'സിന്റാക്സ് തെറ്റ് കണ്ട് ചൂലിന് ഭ്രാന്ത് പിടിച്ചു!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      case 'crashout':
        this.item.text = '$(flame) Dusty: CRASHOUT! (100%)';
        this.item.tooltip = 'ചൂലിന് കലിപ്പ് 100%! ഫയൽ തച്ചുടയ്ക്കാൻ ഇറങ്ങിയിരിക്കുന്നു!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      default:
        // Idle
        const rageLabel = snapshot.rageMeter > 0 ? ` [കലിപ്പ്: ${snapshot.rageMeter}%]` : '';
        this.item.text = `🧹 Dusty: Idle (${snapshot.bagCount}/${snapshot.bagCapacity})${rageLabel}`;
        this.item.tooltip = `ചൂല് റെഡിയാണ്. മുറം: ${snapshot.bagCount}/${snapshot.bagCapacity}. കലിപ്പ്: ${snapshot.rageMeter}%. സൈഡ്ബാർ തുറക്കാൻ ക്ലിക്ക് ചെയ്യുക.`;
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
