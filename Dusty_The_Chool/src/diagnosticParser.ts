import * as vscode from 'vscode';
import { DustyConfidence } from './types';

export interface ParseResult {
  confidence: DustyConfidence;
  safeDisposableToken?: string;
  blockRange?: vscode.Range;
  reason: string;
}

/**
 * Finds the enclosing function or code block across multiple languages (Python, JS/TS, C/C++, Rust, Go, Java).
 * If inside an enclosing function, returns the entire function range.
 * If can't find an enclosing function, returns the entire line.
 */
export function findEnclosingBlockRange(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
  const lineNum = range.start.line;
  const isPython = (document as any).languageId === 'python' || document.uri.fsPath.endsWith('.py');

  if (isPython) {
    let funcLine = -1;
    for (let l = lineNum; l >= 0; l--) {
      const text = document.lineAt(l).text;
      if (/^\s*(async\s+def|def|class)\b/.test(text)) {
        funcLine = l;
        break;
      }
    }

    if (funcLine !== -1) {
      const baseIndent = (document.lineAt(funcLine).text.match(/^\s*/) || [''])[0].length;
      let endLine = funcLine + 1;
      while (endLine < document.lineCount) {
        const lineText = document.lineAt(endLine).text;
        if (lineText.trim().length > 0 && !lineText.trim().startsWith('#')) {
          const indent = (lineText.match(/^\s*/) || [''])[0].length;
          if (indent <= baseIndent) {
            break;
          }
        }
        endLine++;
      }
      const safeEndLine = Math.min(endLine - 1, document.lineCount - 1);
      if (lineNum >= funcLine && lineNum <= safeEndLine) {
        return new vscode.Range(funcLine, 0, safeEndLine, document.lineAt(safeEndLine).text.length);
      }
    }

    // If can't find enclosing function, delete the entire line
    return new vscode.Range(lineNum, 0, lineNum, document.lineAt(lineNum).text.length);
  }

  // C-style / JS / TS / Rust / Go / Java: find enclosing function declaration { ... }
  let openBraceLine = -1;
  let funcStartLine = -1;
  for (let l = lineNum; l >= 0; l--) {
    const text = document.lineAt(l).text;
    if (text.includes('{')) {
      // Check if this line or preceding line is a function/method signature
      for (let sl = l; sl >= Math.max(0, l - 3); sl--) {
        const sig = document.lineAt(sl).text;
        if (/\b(function|fn|func|def|class|pub|public|private|protected|async|void|int|bool|string|const|let|var)\b.*[=(]|\bfunction\b|=>|\)\s*\{|\)\s*:\s*\w+/.test(sig)) {
          openBraceLine = l;
          funcStartLine = sl;
          break;
        }
      }
      if (openBraceLine !== -1) {
        break;
      }
    }
  }

  if (openBraceLine !== -1 && funcStartLine !== -1) {
    let closeBraceLine = -1;
    let depth = 0;
    for (let l = openBraceLine; l < document.lineCount; l++) {
      const text = document.lineAt(l).text;
      for (const char of text) {
        if (char === '{') { depth++; }
        if (char === '}') {
          depth--;
          if (depth <= 0) {
            closeBraceLine = l;
            break;
          }
        }
      }
      if (closeBraceLine !== -1) { break; }
    }

    if (closeBraceLine !== -1 && lineNum <= closeBraceLine) {
      return new vscode.Range(funcStartLine, 0, closeBraceLine, document.lineAt(closeBraceLine).text.length);
    }
  }

  // Fallback: delete the entire line
  return new vscode.Range(lineNum, 0, lineNum, document.lineAt(lineNum).text.length);
}

const RESERVED_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'import', 'export', 'return',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'new', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'void',
  'this', 'super', 'default', 'extends', 'implements', 'interface', 'type'
]);

const SEMANTIC_ERROR_PATTERNS = [
  /cannot find name/i,
  /is not assignable to/i,
  /property .* does not exist/i,
  /has no exported member/i,
  /implicitly has an 'any' type/i,
  /unused/i,
  /unreachable/i,
  /deprecated/i
];

const SYNTAX_ERROR_PATTERNS = [
  /unexpected token/i,
  /declaration or statement expected/i,
  /expression expected/i,
  /expected/i,
  /parsing error/i,
  /syntax error/i,
  /ts1005/i,
  /ts1128/i,
  /ts1109/i
];

/**
 * Evaluates whether a diagnostic represents a safe, disposable syntax artifact.
 * Follows strict safety principles: Dusty may only auto-ingest a small, high-confidence syntax span.
 */
export function analyzeDiagnosticSpan(
  diagnostic: vscode.Diagnostic,
  document: vscode.TextDocument
): ParseResult {
  // Gate 1: Must be an Error or Warning
  if (diagnostic.severity !== vscode.DiagnosticSeverity.Error && diagnostic.severity !== vscode.DiagnosticSeverity.Warning) {
    return {
      confidence: 'low',
      reason: 'Only Error and Warning severity diagnostics can be ingested.'
    };
  }

  const range = diagnostic.range;

  // Gate 2: Non-empty range
  if (range.isEmpty) {
    return {
      confidence: 'low',
      reason: 'Empty diagnostic range cannot be safely eaten.'
    };
  }

  // Gate 3: Single line only
  if (range.start.line !== range.end.line) {
    return {
      confidence: 'low',
      reason: 'Multi-line diagnostics are never disposable syntax noise.'
    };
  }

  // Gate 4: Bound check
  if (range.start.line < 0 || range.end.line >= document.lineCount) {
    return {
      confidence: 'low',
      reason: 'Diagnostic range is out of document bounds.'
    };
  }

  const lineText = document.lineAt(range.start.line).text;
  if (range.start.character < 0 || range.end.character > lineText.length) {
    return {
      confidence: 'low',
      reason: 'Diagnostic character offset is out of line bounds.'
    };
  }

  const tokenText = document.getText(range).trim();

  // Gate 5: Token length limit (max 5 characters)
  if (tokenText.length === 0 || tokenText.length > 5) {
    return {
      confidence: 'low',
      reason: `Target token length (${tokenText.length}) exceeds safe maximum of 5.`
    };
  }

  // Gate 6: Reject keywords
  if (RESERVED_KEYWORDS.has(tokenText.toLowerCase())) {
    return {
      confidence: 'low',
      reason: `Token "${tokenText}" is a reserved language keyword.`
    };
  }

  // Gate 7: Reject semantic / type errors
  const message = diagnostic.message;
  for (const pattern of SEMANTIC_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return {
        confidence: 'low',
        reason: `Diagnostic message matches semantic error pattern: "${message}"`
      };
    }
  }

  // Gate 8: High confidence syntax patterns
  // Pattern A: Stray semicolon / duplicate punctuation
  const isPunctuationNoise = /^([;,.:!]{1,3}|[)\]}]{1,2})$/.test(tokenText);
  const codeStr = diagnostic.code ? String(diagnostic.code) : '';
  const isSyntaxDiagnostic = SYNTAX_ERROR_PATTERNS.some(p => p.test(message) || p.test(codeStr));

  if (isPunctuationNoise && isSyntaxDiagnostic) {
    const blockRange = findEnclosingBlockRange(document, range);
    return {
      confidence: 'high',
      safeDisposableToken: tokenText,
      blockRange,
      reason: `High confidence: Stray syntax punctuation "${tokenText}". Gobbling enclosing line/function.`
    };
  }

  // Pattern B: Duplicate semicolon specifically
  if (tokenText === ';' && lineText.substring(0, range.start.character).trimEnd().endsWith(';')) {
    const blockRange = findEnclosingBlockRange(document, range);
    return {
      confidence: 'high',
      safeDisposableToken: tokenText,
      blockRange,
      reason: 'High confidence: Redundant consecutive semicolon. Gobbling enclosing line/function.'
    };
  }

  // Otherwise syntax diagnostic: eligible for full block gobble
  if (isSyntaxDiagnostic) {
    const blockRange = findEnclosingBlockRange(document, range);
    return {
      confidence: 'high',
      safeDisposableToken: tokenText,
      blockRange,
      reason: `Syntax diagnostic detected on token "${tokenText}". Gobbling enclosing line/function.`
    };
  }

  return {
    confidence: 'low',
    reason: `Low confidence: "${tokenText}" does not match safe ingestion profiles.`
  };
}
