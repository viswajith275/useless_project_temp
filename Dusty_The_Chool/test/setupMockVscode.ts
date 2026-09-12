import * as mock from './mockVscode';

// Intercept module loading for 'vscode'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
const originalLoad = Module._load;

const mockVscode = {
  Uri: mock.Uri,
  Position: mock.Position,
  Range: mock.Range,
  DiagnosticSeverity: mock.DiagnosticSeverity,
  Diagnostic: mock.Diagnostic,
  EventEmitter: mock.EventEmitter,
  ThemeColor: mock.ThemeColor,
  commands: {
    executeCommand: async (_cmd: string, ..._args: unknown[]): Promise<unknown> => {
      return undefined;
    },
    registerCommand: (_cmd: string, _callback: (...args: unknown[]) => unknown) => {
      return { dispose: () => {} };
    }
  },
  window: {
    activeTextEditor: undefined as unknown,
    createStatusBarItem: (_id?: string, _align?: number, _prio?: number) => {
      return {
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: undefined,
        name: '',
        show: () => {},
        hide: () => {},
        dispose: () => {}
      };
    },
    createTextEditorDecorationType: (_opts: unknown) => {
      return {
        key: 'mock-dec-type',
        dispose: () => {}
      };
    },
    showInformationMessage: async (msg: string): Promise<string> => {
      return msg;
    },
    showWarningMessage: async (msg: string): Promise<string> => {
      return msg;
    },
    showErrorMessage: async (msg: string): Promise<string> => {
      return msg;
    }
  },
  languages: {
    getDiagnostics: (_uri?: unknown): unknown[] => [],
    onDidChangeDiagnostics: new mock.EventEmitter<unknown>().event,
    registerCodeLensProvider: () => ({ dispose: () => {} })
  },
  workspace: {
    getConfiguration: (_section?: string) => ({
      get: <T>(_key: string, defaultValue: T): T => defaultValue
    }),
    onDidChangeConfiguration: new mock.EventEmitter<unknown>().event,
    onDidChangeTextDocument: new mock.EventEmitter<unknown>().event
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  }
};

Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'vscode') {
    return mockVscode;
  }
  return originalLoad.apply(this, [request, parent, isMain]);
};

export { mockVscode };
