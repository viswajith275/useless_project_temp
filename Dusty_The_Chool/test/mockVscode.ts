/**
 * Lightweight mock of the VS Code API for deterministic unit testing outside the VS Code Extension Host.
 */

export class Uri {
  public scheme: string;
  public authority: string;
  public path: string;
  public fsPath: string;

  constructor(scheme: string, authority: string, path: string) {
    this.scheme = scheme;
    this.authority = authority;
    this.path = path;
    this.fsPath = path;
  }

  public static file(path: string): Uri {
    return new Uri('file', '', path);
  }

  public static parse(value: string): Uri {
    const match = value.match(/^([^:]+):(?:\/{1,3})?(.*)$/);
    if (match) {
      return new Uri(match[1], '', match[2]);
    }
    return new Uri('file', '', value);
  }

  public toString(): string {
    return `${this.scheme}://${this.path}`;
  }
}

export class Position {
  constructor(public readonly line: number, public readonly character: number) {}
}

export class Range {
  public readonly start: Position;
  public readonly end: Position;

  constructor(startLine: number, startChar: number, endLine: number, endChar: number);
  constructor(start: Position, end: Position);
  constructor(
    startOrStartLine: Position | number,
    startCharOrEnd: Position | number,
    endLine?: number,
    endChar?: number
  ) {
    if (typeof startOrStartLine === 'number') {
      this.start = new Position(startOrStartLine, startCharOrEnd as number);
      this.end = new Position(endLine!, endChar!);
    } else {
      this.start = startOrStartLine;
      this.end = startCharOrEnd as Position;
    }
  }

  public get isEmpty(): boolean {
    return this.start.line === this.end.line && this.start.character === this.end.character;
  }

  public contains(position: Position): boolean {
    if (position.line < this.start.line || position.line > this.end.line) {
      return false;
    }
    if (position.line === this.start.line && position.character < this.start.character) {
      return false;
    }
    if (position.line === this.end.line && position.character > this.end.character) {
      return false;
    }
    return true;
  }

  public intersection(other: Range): Range | undefined {
    const startLine = Math.max(this.start.line, other.start.line);
    const endLine = Math.min(this.end.line, other.end.line);
    if (startLine > endLine) {
      return undefined;
    }
    const startChar = (startLine === this.start.line ? this.start.character : other.start.character);
    const endChar = (endLine === this.end.line ? this.end.character : other.end.character);
    return new Range(startLine, startChar, endLine, endChar);
  }
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3
}

export class Diagnostic {
  public source?: string;
  public code?: string | number | { value: string | number; target: Uri };

  constructor(
    public range: Range,
    public message: string,
    public severity: DiagnosticSeverity = DiagnosticSeverity.Error
  ) {}
}

export class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];

  public event = (listener: (e: T) => void): Disposable => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const idx = this.listeners.indexOf(listener);
        if (idx >= 0) {
          this.listeners.splice(idx, 1);
        }
      }
    };
  };

  public fire(data: T): void {
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  public dispose(): void {
    this.listeners = [];
  }
}

export interface Disposable {
  dispose(): void;
}

export class ThemeColor {
  constructor(public readonly id: string) {}
}

export interface MockTextDocument {
  uri: Uri;
  version: number;
  lineCount: number;
  isClosed: boolean;
  lineAt(line: number): { text: string };
  getText(range?: Range): string;
}

export function createMockDocument(lines: string[], uri = Uri.file('/test/workspace/file.ts'), version = 1): MockTextDocument {
  return {
    uri,
    version,
    lineCount: lines.length,
    isClosed: false,
    lineAt: (line: number) => ({ text: lines[line] || '' }),
    getText: (range?: Range) => {
      if (!range) {
        return lines.join('\n');
      }
      if (range.start.line === range.end.line) {
        return (lines[range.start.line] || '').substring(range.start.character, range.end.character);
      }
      return '';
    }
  };
}
