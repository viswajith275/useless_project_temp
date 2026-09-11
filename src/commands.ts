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
        void vscode.window.showInformationMessage('Dusty: ചൂല് റെഡി! പൊട്ടിയ സിന്റാക്സ് തൂത്തുവാരാൻ തുടങ്ങി.');
        chaosEngine.scheduleDiagnosticCheck(100);
      } else {
        void vscode.window.showInformationMessage('Dusty: ചൂല് വിശ്രമത്തിലാണ്. പോയി വേറെ വല്ല പണിയും നോക്ക്.');
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
      const msg = isMuted ? 'Dusty: ശബ്ദം ഓഫ് ചെയ്തു. നിശബ്ദമായി അടിച്ചുവാരാം.' : 'Dusty: ശബ്ദം ഓൺ ചെയ്തു. സൗണ്ട് കേട്ട് ഞെട്ടിക്കോ!';
      void vscode.window.showInformationMessage(msg);
    })
  );

  // 6. Reset Bag
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.resetBag', () => {
      stateStore.resetBag();
      viewProvider.playSound('victory');
      void vscode.window.showInformationMessage('Dusty: മുറം കാലിയാക്കി 0/5.');
    })
  );

  // 7. Test Sound
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.testSound', () => {
      viewProvider.playSound('suction');
      viewProvider.shake(1);
      void vscode.window.showInformationMessage('Dusty: ചൂലിന്റെ സ്വീപ്പ് ശബ്ദം ടെസ്റ്റ് ചെയ്യുന്നു!');
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
        void vscode.window.showWarningMessage('Dusty: ആദ്യം ഒരു എഡിറ്റർ തുറക്ക്, എന്നിട്ട് വേണം എനിക്ക് കലിപ്പ് മൂത്ത് കോഡ് തൂത്തുവാരാൻ!');
      }
    })
  );
}
