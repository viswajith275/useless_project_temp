import * as vscode from 'vscode';
import { StateStore } from './stateStore';
import { DecorationManager } from './decorationManager';
import { RoastService } from './roastService';
import { VacuumViewProvider } from './vacuumViewProvider';
import { DustyStatusBar } from './statusBar';
import { DustyCodeLensProvider } from './dustyCodeLensProvider';
import { ChaosEngine } from './chaosEngine';
import { registerCommands } from './commands';
import { ChaosIntensity, WebviewToHostMessage, RoastLanguage } from './types';

let stateStore: StateStore | undefined;
let decorationManager: DecorationManager | undefined;
let chaosEngine: ChaosEngine | undefined;
let statusBar: DustyStatusBar | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('dusty');
  const initialEnabled = config.get<boolean>('enabled', true);
  const initialIntensity = config.get<ChaosIntensity>('chaosIntensity', 'normal');
  const initialMuted = config.get<boolean>('muteAudio', false);
  const initialLanguage = config.get<RoastLanguage>('language', 'english');

  stateStore = new StateStore(initialMuted, initialIntensity, initialEnabled, initialLanguage);
  decorationManager = new DecorationManager();
  const roastService = new RoastService();
  roastService.setLanguage(initialLanguage);

  stateStore.onDidChangeState(snapshot => {
    roastService.setLanguage(snapshot.language);
  });

  // Create view provider with message handler
  const viewProvider = new VacuumViewProvider(
    context.extensionUri,
    stateStore,
    (msg: WebviewToHostMessage) => {
      handleWebviewMessage(msg);
    }
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VacuumViewProvider.viewType, viewProvider)
  );

  // Status Bar
  statusBar = new DustyStatusBar(stateStore);
  context.subscriptions.push(statusBar);

  // CodeLens Provider
  const codeLensProvider = new DustyCodeLensProvider(stateStore);
  context.subscriptions.push(
    codeLensProvider,
    vscode.languages.registerCodeLensProvider([{ scheme: 'file' }, { scheme: 'untitled' }], codeLensProvider)
  );

  // Chaos Engine
  chaosEngine = new ChaosEngine(stateStore, decorationManager, roastService, viewProvider);
  context.subscriptions.push(chaosEngine);

  // Commands
  registerCommands(context, stateStore, chaosEngine, viewProvider);

  context.subscriptions.push(stateStore, decorationManager);

  // Initial diagnostic schedule check
  if (vscode.window.activeTextEditor) {
    chaosEngine.scheduleDiagnosticCheck(500);
  }
}

function handleWebviewMessage(msg: WebviewToHostMessage): void {
  switch (msg.type) {
    case 'toggleEngine':
      void vscode.commands.executeCommand('dusty.toggleEngine');
      break;
    case 'unclog':
      void vscode.commands.executeCommand('dusty.unclog');
      break;
    case 'feed':
      void vscode.commands.executeCommand('dusty.feedManually');
      break;
    case 'insult':
      void vscode.commands.executeCommand('dusty.insultMe');
      break;
    case 'mute':
      void vscode.commands.executeCommand('dusty.muteAudio');
      break;
    case 'toggleLanguage':
      void vscode.commands.executeCommand('dusty.toggleLanguage');
      break;
    case 'setLanguage':
      if (msg.language && stateStore) {
        stateStore.setLanguage(msg.language);
      }
      break;
    case 'openProblems':
      void vscode.commands.executeCommand('workbench.actions.view.problems');
      break;
    case 'testSound':
      void vscode.commands.executeCommand('dusty.testSound');
      break;
    case 'ready':
      break;
  }
}

export function deactivate(): void {
  if (decorationManager) {
    decorationManager.dispose();
  }
  if (chaosEngine) {
    chaosEngine.dispose();
  }
  if (statusBar) {
    statusBar.dispose();
  }
  if (stateStore) {
    stateStore.dispose();
  }
}
