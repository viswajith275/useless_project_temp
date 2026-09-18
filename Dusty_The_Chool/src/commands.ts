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
      const isM = stateStore.getLanguage() === 'manglish';
      if (nowEnabled) {
        viewProvider.playSound('suction');
        void vscode.window.showInformationMessage(
          isM
            ? 'Dusty: Chool ready! Pottiya syntax thoothuvaaraan thudangi.'
            : 'Dusty: Broom ready! Started sweeping away broken syntax.'
        );
        chaosEngine.scheduleDiagnosticCheck(100);
      } else {
        void vscode.window.showInformationMessage(
          isM
            ? 'Dusty: Chool urakkathilaanu. Vere valla paniyum nokkeda.'
            : 'Dusty: Broom is taking rest. Go find some other work, man.'
        );
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
      const isM = stateStore.getLanguage() === 'manglish';
      const msg = isM
        ? (isMuted ? 'Dusty: Sabdam off aakki. Silent sweeping mode active.' : 'Dusty: Sabdam on aakki. Volume kootti choolinte bahalam kelkku!')
        : (isMuted ? 'Dusty: Sound muted. Silent sweeping mode active.' : 'Dusty: Sound unmuted. Volume up for loud broom chaos!');
      void vscode.window.showInformationMessage(msg);
    })
  );

  // 6. Reset Bag
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.resetBag', () => {
      stateStore.resetBag();
      viewProvider.playSound('victory');
      const isM = stateStore.getLanguage() === 'manglish';
      void vscode.window.showInformationMessage(
        isM ? 'Dusty: Murram kaaliyaakki 0/5.' : 'Dusty: Dustpan emptied 0/5.'
      );
    })
  );

  // 7. Test Sound
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.testSound', () => {
      viewProvider.playSound('sweep');
      viewProvider.shake(1);
      const isM = stateStore.getLanguage() === 'manglish';
      void vscode.window.showInformationMessage(
        isM ? 'Dusty: Choolinte sweep sabdam test cheyyunnu!' : 'Dusty: Testing broom sweep sound!'
      );
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
        const isManglish = stateStore.getLanguage() === 'manglish';
        const msg = isManglish
          ? 'Dusty: Editor onnum thurannittilla! Oru file thura, ennit kalippil crashout aavam!'
          : 'Dusty: Open an editor first, then I can crash out and smash code with 100% kalippu!';
        void vscode.window.showWarningMessage(msg);
      }
    })
  );

  // 11. Toggle Language (English <-> Manglish)
  context.subscriptions.push(
    vscode.commands.registerCommand('dusty.toggleLanguage', () => {
      const newLang = stateStore.toggleLanguage();
      const msg = newLang === 'manglish'
        ? '🌐 Dusty: Bhasha Manglish aakki! Ini kalippum roasdum pacha malayalam aksharathil!'
        : '🌐 Dusty: Language switched to English with authentic Kerala memes!';
      void vscode.window.showInformationMessage(msg);
    })
  );
}
