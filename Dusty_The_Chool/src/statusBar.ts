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
    this.item.name = 'Dusty the Chool';

    this.disposables.push(
      this.stateStore.onDidChangeState((snapshot: DustyStateSnapshot) => {
        this.update(snapshot);
      })
    );

    this.update(this.stateStore.getSnapshot());
    this.item.show();
  }

  private update(snapshot: DustyStateSnapshot): void {
    const isM = snapshot.language === 'manglish';

    if (!snapshot.enabled) {
      this.item.text = isM ? '$(debug-disconnect) Dusty: Nirthi (Off)' : '$(debug-disconnect) Dusty: Off (Rest)';
      this.item.tooltip = isM ? 'Chool urakkathilaanu. Thudangaan click cheyyu.' : 'Dusty is resting. Click to start sweeping.';
      this.item.command = 'dusty.toggleEngine';
      this.item.backgroundColor = undefined;
      return;
    }

    if (snapshot.state === 'clogged') {
      this.item.text = isM
        ? `$(warning) Dusty: Murram Niranju! (${snapshot.bagCount}/${snapshot.bagCapacity})`
        : `$(warning) Dusty: Dustpan Full! (${snapshot.bagCount}/${snapshot.bagCapacity})`;
      this.item.tooltip = isM ? 'Murram niranju kavinju! Kaaliyaakkaan click cheyyu.' : 'Dustpan is overflowing! Click to unclog (Cmd/Ctrl+Alt+U C).';
      this.item.command = 'dusty.unclog';
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }

    if (snapshot.muted) {
      this.item.text = isM ? '$(mute) Dusty: Mounam (Muted)' : '$(mute) Dusty: Muted (Silent)';
      this.item.tooltip = isM ? 'Sabdam nirthi vechirikkunnu. Sidebar thuraan click cheyyu.' : 'Sound is muted. Click to open sidebar.';
      this.item.command = 'dusty.openSidebar';
      this.item.backgroundColor = undefined;
      return;
    }

    switch (snapshot.state) {
      case 'hunting':
        this.item.text = isM ? '$(search) Dusty: Thedunnu...' : '$(search) Dusty: Hunting...';
        this.item.tooltip = isM ? 'Thoothuvaaraan pottiya syntax thedunnu...' : 'Hunting for broken syntax to sweep...';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'approaching':
      case 'eating':
        this.item.text = isM ? '$(flame) Dusty: Vaarunnu!' : '$(flame) Dusty: Sweeping!';
        this.item.tooltip = isM ? 'Target kitti! Syntax murrathilekku adichuvaarunnu!' : 'Target locked! Sweeping error into dustpan!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'hungerStrike':
        this.item.text = isM ? '$(stop) Dusty: Samaram (Strike)' : '$(stop) Dusty: Strike (Trade Union)';
        this.item.tooltip = isM ? 'Oola code kaaranam Dusty samaram thudangi!' : 'Dusty went on strike due to terrible code quality!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = undefined;
        break;

      case 'hunger':
        this.item.text = isM ? '$(flame) Dusty: Vishappu! (Starving)' : '$(flame) Dusty: Starving (Hungry)!';
        this.item.tooltip = isM ? 'Choolinu bhayangara vishappu! Vegam syntax thettukal thaa!' : 'Dusty is starving! Provide syntax errors or working code gets eaten!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        break;

      case 'mischief':
        this.item.text = isM ? '$(zap) Dusty: Kothukki Kalanju!' : '$(zap) Dusty: Mischief Eating!';
        this.item.tooltip = isM ? 'Vishanna chool working line vizhungi!' : 'Hungry Dusty ate a working code line!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      case 'tantrum':
        this.item.text = isM ? '$(zap) Dusty: Kalippu Moothu!' : '$(zap) Dusty: Tantrum (Kalippu)!';
        this.item.tooltip = isM ? 'Thettukal kandu choolinte kalippu moothu!' : 'Syntax errors caused the broom to lose its mind!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      case 'crashout':
        this.item.text = isM ? '$(flame) Dusty: CRASHOUT! (100% Kalippu)' : '$(flame) Dusty: CRASHOUT! (100%)';
        this.item.tooltip = isM ? '100% Kalippu! Dusty code delete cheythu prathikarikunnu!' : '100% Kalippu! Dusty is on a rampage deleting code!';
        this.item.command = 'dusty.openSidebar';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      default:
        // Idle
        const rageLabel = snapshot.rageMeter > 0 ? ` [${isM ? 'Kalippu' : 'Rage'}: ${snapshot.rageMeter}%]` : '';
        this.item.text = isM
          ? `🧹 Dusty: Urakkam (${snapshot.bagCount}/${snapshot.bagCapacity})${rageLabel}`
          : `🧹 Dusty: Idle (${snapshot.bagCount}/${snapshot.bagCapacity})${rageLabel}`;
        this.item.tooltip = isM
          ? `Dusty ready aanu. Murram: ${snapshot.bagCount}/${snapshot.bagCapacity}. Kalippu: ${snapshot.rageMeter}%. Click to open sidebar.`
          : `Dusty is ready. Dustpan: ${snapshot.bagCount}/${snapshot.bagCapacity}. Kalippu: ${snapshot.rageMeter}%. Click to open sidebar.`;
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
