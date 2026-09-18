import * as mock from './mockVscode';

// Intercept module loading for 'vscode'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
const originalLoad = Module._load;

process.env.NODE_ENV = 'test';

export const onDidSaveTextDocumentEmitter = new mock.EventEmitter<unknown>();
export const onDidChangeActiveTextEditorEmitter = new mock.EventEmitter<unknown>();

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
    onDidChangeActiveTextEditor: onDidChangeActiveTextEditorEmitter.event,
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
      get: <T>(_key: string, defaultValue: T): T => defaultValue,
      update: async (_key: string, _value: unknown, _target?: unknown) => {}
    }),
    onDidChangeConfiguration: new mock.EventEmitter<unknown>().event,
    onDidChangeTextDocument: new mock.EventEmitter<unknown>().event,
    onDidSaveTextDocument: onDidSaveTextDocumentEmitter.event
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  }
};

Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'vscode') {
    return mockVscode;
  }
  return originalLoad.apply(this, [request, parent, isMain]);
};

export { mockVscode };
