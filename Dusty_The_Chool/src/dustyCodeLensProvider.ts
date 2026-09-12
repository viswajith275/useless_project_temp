import * as vscode from 'vscode';
import { StateStore } from './stateStore';

export class DustyCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly stateStore: StateStore) {
    this.disposables.push(
      this.stateStore.onDidChangeState(() => {
        this._onDidChangeCodeLenses.fire();
      }),
      vscode.languages.onDidChangeDiagnostics(() => {
        this._onDidChangeCodeLenses.fire();
      })
    );
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (!this.stateStore.isEnabled()) {
      return [];
    }

    const diags = vscode.languages.getDiagnostics(document.uri);
    const errors = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
    if (errors.length === 0) {
      return [];
    }

    const lenses: vscode.CodeLens[] = [];
    const processedLines = new Set<number>();

    // Cap to at most 3 CodeLenses per document to prevent visual spam
    for (const error of errors) {
      const line = error.range.start.line;
      if (processedLines.has(line)) {
        continue;
      }
      processedLines.add(line);

      const lensRange = new vscode.Range(line, 0, line, 0);

      // Primary action: Sweep with Dusty
      lenses.push(
        new vscode.CodeLens(lensRange, {
          title: '🧹 Vaariyedukku (Sweep)',
          tooltip: 'Dusty choolukond ee syntax thettu adichuvaari kalayatte',
          command: 'dusty.feedManually',
          arguments: [document.uri, error.range]
        })
      );

      // Secondary action: Dusty Roast/Explain
      lenses.push(
        new vscode.CodeLens(lensRange, {
          title: '🔥 Keliyaakku (Roast)',
          tooltip: 'Ee thettine patti Dusty-yude ettinte pani roast kelkkuka',
          command: 'dusty.explainDiagnostic',
          arguments: [error.message, line]
        })
      );

      if (lenses.length >= 6) {
        break;
      }
    }

    return lenses;
  }

  public dispose(): void {
    this._onDidChangeCodeLenses.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
