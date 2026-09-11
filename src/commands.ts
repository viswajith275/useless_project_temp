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
        void vscode.window.showInformationMessage('Dusty: Engine ON! Scanning for crunchy syntax errors.');
        chaosEngine.scheduleDiagnosticCheck(100);
      } else {
        void vscode.window.showInformationMessage('Dusty: Engine OFF. Dusty has gone to sleep.');
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
      const msg = isMuted ? 'Dusty: Audio muted. Sneak mode active.' : 'Dusty: Audio unmuted. Ready to make noise!';
      void vscode.window.showInformationMessage(msg);
    })
  );

  // 6. Reset Bag
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.resetBag', () => {
      stateStore.resetBag();
      viewProvider.playSound('victory');
      void vscode.window.showInformationMessage('Dusty: Dust bag reset to 0/5.');
    })
  );

  // 7. Test Sound
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.testSound', () => {
      viewProvider.playSound('suction');
      viewProvider.shake(1);
      void vscode.window.showInformationMessage('Dusty: Testing synthesizer vacuum whoosh!');
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
        void vscode.window.showWarningMessage('Dusty: Open an editor first so I can crash out and delete code!');
      }
    })
  );
}
