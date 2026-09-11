import * as vscode from 'vscode';
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
        if (snapshot.lastRoast) {
          this.postMessage({ type: 'roast', text: snapshot.lastRoast });
        }
      })
    );
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
        this.onWebviewMessage(rawMsg);
      }
    }, null, this.disposables);

    // Push initial state
    const snapshot = this.stateStore.getSnapshot();
    this.postMessage({ type: 'state', state: snapshot });
    this.postMessage({ type: 'bag', value: snapshot.bagCount, capacity: snapshot.bagCapacity });
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
    const validTypes = ['toggleEngine', 'unclog', 'feed', 'insult', 'mute', 'openProblems', 'testSound', 'ready'];
    return typeof type === 'string' && validTypes.includes(type);
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
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet" />
  <title>Dusty the Vacuum</title>
</head>
<body class="dusty-body">
  <div class="crt-overlay" aria-hidden="true"></div>

  <div class="container" id="appContainer">
    <!-- Character Stage -->
    <div class="stage" id="stage" role="region" aria-label="Dusty vacuum character animation">
      <div class="vacuum-canvas-wrap">
        <canvas id="dustyCanvas" width="160" height="120" role="img" aria-label="Dusty the animated vacuum"></canvas>
      </div>
      <div class="state-badge" id="stateBadge" aria-live="polite">IDLE</div>
    </div>

    <!-- Speech Bubble / Roast Monitor -->
    <div class="bubble-wrap">
      <div class="speech-bubble" id="speechBubble" role="status" aria-live="polite">
        "Purring quietly. Feed me some syntax mistakes."
      </div>
    </div>

    <!-- Bag Meter -->
    <div class="meter-section" role="region" aria-label="Dust bag capacity">
      <div class="meter-header">
        <span class="meter-title">DUST BAG</span>
        <span class="meter-value" id="bagValue">0 / 5</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" id="bagBar" style="width: 0%;"></div>
      </div>
    </div>

    <!-- Quick Target Indicator -->
    <div class="target-card" id="targetCard" style="display: none;">
      <div class="target-title">🎯 ACTIVE TARGET</div>
      <div class="target-desc" id="targetDesc">None</div>
    </div>

    <!-- Actions Control Panel -->
    <div class="controls-grid" role="group" aria-label="Dusty action controls">
      <button class="btn btn-primary" id="btnEngine" title="Start or Stop vacuum suction engine">
        <span class="btn-icon">⚡</span>
        <span id="btnEngineText">IGNITION</span>
      </button>

      <button class="btn btn-danger" id="btnUnclog" title="Empty the clogged dust bag">
        <span class="btn-icon">🧹</span>
        <span>UNCLOG</span>
      </button>

      <button class="btn btn-secondary" id="btnFeed" title="Feed active syntax error to Dusty">
        <span class="btn-icon">🍽️</span>
        <span>FEED</span>
      </button>

      <button class="btn btn-secondary" id="btnInsult" title="Ask Dusty to roast your code">
        <span class="btn-icon">🔥</span>
        <span>ROAST ME</span>
      </button>

      <button class="btn btn-secondary" id="btnMute" title="Mute or unmute synthesized vacuum sounds">
        <span class="btn-icon" id="muteIcon">🔊</span>
        <span id="btnMuteText">AUDIO</span>
      </button>

      <button class="btn btn-secondary" id="btnProblems" title="Focus the native VS Code Problems panel">
        <span class="btn-icon">⚠️</span>
        <span>PROBLEMS</span>
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
