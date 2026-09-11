import * as vscode from 'vscode';
import { DustyConfidence } from './types';

export interface ParseResult {
  confidence: DustyConfidence;
  safeDisposableToken?: string;
  reason: string;
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
  // Gate 1: Must be an Error
  if (diagnostic.severity !== vscode.DiagnosticSeverity.Error) {
    return {
      confidence: 'low',
      reason: 'Only Error severity diagnostics can be ingested.'
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
    return {
      confidence: 'high',
      safeDisposableToken: tokenText,
      reason: `High confidence: Stray syntax punctuation "${tokenText}".`
    };
  }

  // Pattern B: Duplicate semicolon specifically
  if (tokenText === ';' && lineText.substring(0, range.start.character).trimEnd().endsWith(';')) {
    return {
      confidence: 'high',
      safeDisposableToken: tokenText,
      reason: 'High confidence: Redundant consecutive semicolon.'
    };
  }

  // Otherwise medium or low
  if (isSyntaxDiagnostic) {
    return {
      confidence: 'medium',
      reason: `Syntax diagnostic detected but token "${tokenText}" requires manual user review.`
    };
  }

  return {
    confidence: 'low',
    reason: `Low confidence: "${tokenText}" does not match safe ingestion profiles.`
  };
}
