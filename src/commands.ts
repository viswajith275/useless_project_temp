import * as vscode from 'vscode';
import { StateStore } from './stateStore';
import { ChaosEngine } from './chaosEngine';
import { VacuumViewProvider } from './vacuumViewProvider';

export function registerCommands(
  context: vscode.ExtensionContext,
  stateStore: StateStore,
  chaosEngine: ChaosEngine,
  viewProvider: VacuumViewProvider
): void {
  // 1. Toggle Engine
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.toggleEngine', () => {
      const nowEnabled = stateStore.toggleEngine();
      if (nowEnabled) {
        viewProvider.playSound('suction');
        void vscode.window.showInformationMessage('Dusty: Choolu ready! Pottiya syntax thoothuvaaraan thudangi.');
        chaosEngine.scheduleDiagnosticCheck(100);
      } else {
        void vscode.window.showInformationMessage('Dusty: Choolu rest edukkukayaanu. Poyi vere valla paniyum nokku.');
      }
    })
  );

  // 2. Unclog
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.unclog', () => {
      chaosEngine.unclog();
    })
  );

  // 3. Insult Me (Roast)
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.insultMe', async () => {
      await chaosEngine.insult();
    })
  );

  // 4. Feed Manually
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.feedManually', async (uri?: vscode.Uri, range?: vscode.Range) => {
      await chaosEngine.feedManually(uri, range);
    })
  );

  // 5. Mute Audio
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.muteAudio', () => {
      const isMuted = stateStore.toggleMute();
      const msg = isMuted ? 'Dusty: Sound off cheythu. Silent sweeping mode active.' : 'Dusty: Sound on aakki. Volume kettu njettikko!';
      void vscode.window.showInformationMessage(msg);
    })
  );

  // 6. Reset Bag
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.resetBag', () => {
      stateStore.resetBag();
      viewProvider.playSound('victory');
      void vscode.window.showInformationMessage('Dusty: Muram kaaliyaakki 0/5.');
    })
  );

  // 7. Test Sound
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.testSound', () => {
      viewProvider.playSound('suction');
      viewProvider.shake(1);
      void vscode.window.showInformationMessage('Dusty: Choolinte sweep sound test cheyyunnu!');
    })
  );

  // 8. Open Sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.openSidebar', async () => {
      await vscode.commands.executeCommand('dusty.characterView.focus');
    })
  );

  // 9. Explain Diagnostic
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.explainDiagnostic', (message: string, line?: number) => {
      chaosEngine.explain(message, line);
    })
  );

  // 10. Force Crashout
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.crashout', async () => {
      const ed = vscode.window.activeTextEditor;
      if (ed) {
        await chaosEngine.triggerCrashout(ed);
      } else {
        void vscode.window.showWarningMessage('Dusty: Aadhyam oru editor thurakku, ennittu venam enikku kalippu moothu code adichu thakarkkaan!');
      }
    })
  );
}
