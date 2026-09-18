import * as vscode from 'vscode';
import * as fs from 'fs';
import {
  HostToWebviewMessage,
  WebviewToHostMessage,
  SoundName,
  DustyStateSnapshot
} from './types';
import { StateStore } from './stateStore';

export class VacuumViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = 'dusty.characterView';

  private view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly stateStore: StateStore,
    private readonly onWebviewMessage: (msg: WebviewToHostMessage) => void
  ) {
    this.disposables.push(
      this.stateStore.onDidChangeState(snapshot => {
        this.postMessage({ type: 'state', state: snapshot });
        this.postMessage({ type: 'bag', value: snapshot.bagCount, capacity: snapshot.bagCapacity });
        this.postMessage({ type: 'rage', value: snapshot.rageMeter });
        if (snapshot.lastRoast) {
          this.postMessage({ type: 'roast', text: snapshot.lastRoast });
        }
      })
    );

    if (typeof vscode.workspace.createFileSystemWatcher === 'function') {
      try {
        const pattern = new vscode.RelativePattern(vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds'), '*');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        const sync = () => this.syncCustomSounds();
        watcher.onDidCreate(sync, null, this.disposables);
        watcher.onDidChange(sync, null, this.disposables);
        watcher.onDidDelete(sync, null, this.disposables);
        this.disposables.push(watcher);
      } catch {
        // Ignore watcher errors in restricted environments
      }
    }
  }

  public getCustomSoundsMap(webview: vscode.Webview): Record<string, string> {
    const map: Record<string, string> = {};
    try {
      const soundsDiskDir = vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds').fsPath;
      if (fs.existsSync(soundsDiskDir)) {
        const files = fs.readdirSync(soundsDiskDir).filter(f => /\.(mp3|wav|ogg|m4a|aac)$/i.test(f));
        for (const file of files) {
          const dot = file.lastIndexOf('.');
          if (dot > 0) {
            const key = file.substring(0, dot).toLowerCase();
            const fileUri = vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds', file);
            map[key] = webview.asWebviewUri(fileUri).toString();
          }
        }
      }
    } catch {}
    return map;
  }

  public syncCustomSounds(): void {
    if (this.view) {
      const soundsUri = this.view.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds'));
      this.postMessage({
        type: 'customSounds',
        files: this.getCustomSoundFiles(),
        soundsBaseUri: soundsUri.toString(),
        soundsMap: this.getCustomSoundsMap(this.view.webview)
      });
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'media')
      ]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((rawMsg: unknown) => {
      if (this.isValidWebviewMessage(rawMsg)) {
        if (rawMsg.type === 'ready') {
          const soundsUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds'));
          this.postMessage({
            type: 'customSounds',
            files: this.getCustomSoundFiles(),
            soundsBaseUri: soundsUri.toString(),
            soundsMap: this.getCustomSoundsMap(webviewView.webview)
          });
        }
        this.onWebviewMessage(rawMsg);
      }
    }, null, this.disposables);

    // Push initial state
    const snapshot = this.stateStore.getSnapshot();
    this.postMessage({ type: 'state', state: snapshot });
    this.postMessage({ type: 'bag', value: snapshot.bagCount, capacity: snapshot.bagCapacity });
    this.postMessage({ type: 'rage', value: snapshot.rageMeter });
    const soundsUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds'));
    this.postMessage({
      type: 'customSounds',
      files: this.getCustomSoundFiles(),
      soundsBaseUri: soundsUri.toString(),
      soundsMap: this.getCustomSoundsMap(webviewView.webview)
    });
  }

  public postMessage(message: HostToWebviewMessage): void {
    if (this.view) {
      void this.view.webview.postMessage(message);
    }
  }

  public playSound(name: SoundName): void {
    this.postMessage({ type: 'sound', name });
  }

  public shake(intensity = 1): void {
    this.postMessage({ type: 'shake', intensity });
  }

  public postRoast(text: string): void {
    this.postMessage({ type: 'roast', text });
  }

  private isValidWebviewMessage(msg: unknown): msg is WebviewToHostMessage {
    if (typeof msg !== 'object' || msg === null) {
      return false;
    }
    const type = (msg as { type?: unknown }).type;
    const validTypes = ['toggleEngine', 'unclog', 'feed', 'insult', 'mute', 'openProblems', 'testSound', 'ready', 'toggleLanguage', 'setLanguage'];
    return typeof type === 'string' && validTypes.includes(type);
  }

  public getCustomSoundFiles(): string[] {
    try {
      const soundsDiskDir = vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds').fsPath;
      if (fs.existsSync(soundsDiskDir)) {
        return fs.readdirSync(soundsDiskDir).filter(f => /\.(mp3|wav|ogg|m4a|aac)$/i.test(f));
      }
    } catch {
      // Ignore read errors
    }
    return [];
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'style.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js'));
    const audioUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'audio.js'));
    const soundsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds'));
    const customSoundFiles = this.getCustomSoundFiles();
    const nonce = this.getNonce();

    const isManglish = this.stateStore.getLanguage() === 'manglish';
    const initialGreeting = isManglish
      ? 'Chool ready aanu! Valla pottiya syntax-um undenkil kaani, ippo thanne thoothu-vaari kalayam!'
      : 'Broom is ready! Show me some broken syntax and I\'ll sweep it into the dustpan!';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; media-src ${webview.cspSource} https: data: blob:; connect-src ${webview.cspSource} https: data: blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet" />
  <title>Dusty the Broom</title>
</head>
<body class="dusty-body" data-sounds-uri="${soundsUri}" data-custom-sounds="${customSoundFiles.join(',')}">
  <div class="crt-overlay" aria-hidden="true"></div>

  <div class="container" id="appContainer">
    <!-- Character Stage -->
    <div class="stage" id="stage" role="region" aria-label="Dusty broom character animation">
      <div class="vacuum-canvas-wrap">
        <canvas id="dustyCanvas" width="160" height="120" role="img" aria-label="Dusty the pixelated broom"></canvas>
      </div>
      <div class="state-badge" id="stateBadge" aria-live="polite">IDLE</div>
    </div>

    <!-- Speech Bubble / Roast Monitor -->
    <div class="bubble-wrap">
      <div class="speech-bubble" id="speechBubble" role="status" aria-live="polite">
        "${initialGreeting}"
      </div>
    </div>

    <!-- Dustpan / Bag Meter -->
    <div class="meter-section" role="region" aria-label="Dustpan capacity">
      <div class="meter-header">
        <span class="meter-title" id="meterTitleBag">${isManglish ? '🧹 MURRAM' : '🧹 DUSTPAN'}</span>
        <span class="meter-value" id="bagValue">0 / 5</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" id="bagBar" style="width: 0%;"></div>
      </div>
    </div>

    <!-- Rage Meter -->
    <div class="meter-section rage-section" role="region" aria-label="Dusty rage meter">
      <div class="meter-header">
        <span class="meter-title" id="meterTitleRage">${isManglish ? '🔥 KALIPPU METER' : '🔥 RAGE METER'}</span>
        <span class="meter-value" id="rageValue">0%</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill rage-fill" id="rageBar" style="width: 0%;"></div>
      </div>
    </div>

    <!-- Quick Target Indicator -->
    <div class="target-card" id="targetCard" style="display: none;">
      <div class="target-title" id="targetTitle">${isManglish ? '🎯 THEETTA KURI' : '🎯 ACTIVE TARGET'}</div>
      <div class="target-desc" id="targetDesc">None</div>
    </div>

    <!-- Actions Control Panel -->
    <div class="controls-grid" role="group" aria-label="Dusty broom action controls">
      <button class="btn btn-primary" id="btnEngine" title="Start or Stop broom sweeping engine">
        <span class="btn-icon">🧹</span>
        <span id="btnEngineText">${isManglish ? 'NIRTHU' : 'STOP'}</span>
      </button>

      <button class="btn btn-danger" id="btnUnclog" title="Empty the dustpan and clean the broom">
        <span class="btn-icon">🗑️</span>
        <span id="btnUnclogText">${isManglish ? 'MURRAM KAALIAAKKU' : 'CLEAN DUSTPAN'}</span>
      </button>

      <button class="btn btn-secondary" id="btnFeed" title="Feed active syntax error to Dusty">
        <span class="btn-icon">🍂</span>
        <span id="btnFeedText">${isManglish ? 'THETTU THEETIKKU' : 'SWEEP ERROR'}</span>
      </button>

      <button class="btn btn-secondary" id="btnInsult" title="Ask Dusty to roast your code with Kerala memes">
        <span class="btn-icon">🔥</span>
        <span id="btnInsultText">${isManglish ? 'THARIPPAAKKU' : 'ROAST ME'}</span>
      </button>

      <button class="btn btn-secondary" id="btnMute" title="Mute or unmute synthesized broom sounds">
        <span class="btn-icon" id="muteIcon">🔊</span>
        <span id="btnMuteText">${isManglish ? 'SABDAM OFF' : 'MUTE'}</span>
      </button>

      <button class="btn btn-secondary" id="btnLanguage" title="Switch language between English and Manglish">
        <span class="btn-icon">🌐</span>
        <span id="btnLanguageText">${isManglish ? 'ML' : 'EN'}</span>
      </button>

      <button class="btn btn-secondary" id="btnProblems" title="Focus the native VS Code Problems panel">
        <span class="btn-icon">⚠️</span>
        <span id="btnProblemsText">${isManglish ? 'PRASHNANGAL' : 'PROBLEMS'}</span>
      </button>
    </div>
  </div>

  <script nonce="${nonce}" src="${audioUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
