import * as vscode from 'vscode';
import { DustyDiagnosticTarget, DustyConfidence } from './types';
import { analyzeDiagnosticSpan } from './diagnosticParser';

export function createDiagnosticFingerprint(
  uri: vscode.Uri,
  range: vscode.Range,
  code?: string | number | { value: string | number; target: vscode.Uri },
  source?: string,
  message?: string
): string {
  const normMsg = (message || '').trim().toLowerCase();
  const codeStr = typeof code === 'object' && code !== null && 'value' in code ? String(code.value) : String(code ?? '');
  return `${uri.toString()}#${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}#${codeStr}#${source ?? ''}#${normMsg}`;
}

export class DiagnosticTargetSelector {
  private recentTargets = new Map<string, number>();
  private readonly suppressionDurationMs: number;

  constructor(suppressionDurationMs = 8000) {
    this.suppressionDurationMs = suppressionDurationMs;
  }

  public clearHistory(): void {
    this.recentTargets.clear();
  }

  public markTargeted(fingerprint: string, timestamp = Date.now()): void {
    this.recentTargets.set(fingerprint, timestamp);
    // Cleanup old entries
    for (const [fp, time] of this.recentTargets.entries()) {
      if (timestamp - time > this.suppressionDurationMs * 2) {
        this.recentTargets.delete(fp);
      }
    }
  }

  public isSuppressed(fingerprint: string, now = Date.now()): boolean {
    const lastTime = this.recentTargets.get(fingerprint);
    if (!lastTime) {
      return false;
    }
    return now - lastTime < this.suppressionDurationMs;
  }

  /**
   * Selects the single best diagnostic target across the workspace or active editor.
   */
  public selectTarget(
    activeEditor: vscode.TextEditor | undefined,
    allDiagnostics: [vscode.Uri, vscode.Diagnostic[]][],
    now = Date.now()
  ): DustyDiagnosticTarget | undefined {
    if (!activeEditor || activeEditor.document.isClosed) {
      return undefined;
    }

    const document = activeEditor.document;
    const activeUri = document.uri;

    // Find diagnostics for the active editor first
    const activeEntry = allDiagnostics.find(([uri]) => uri.toString() === activeUri.toString());
    const diagnostics = activeEntry ? activeEntry[1] : [];

    // Filter to errors and warnings
    const candidates = diagnostics.filter(
      d => d.severity === vscode.DiagnosticSeverity.Error || d.severity === vscode.DiagnosticSeverity.Warning
    );
    if (candidates.length === 0) {
      return undefined;
    }

    // Determine editor viewport center for distance ranking
    const visibleRanges = activeEditor.visibleRanges;
    const centerLine = visibleRanges.length > 0
      ? Math.floor((visibleRanges[0].start.line + visibleRanges[0].end.line) / 2)
      : 0;

    interface ScoredDiagnostic {
      diag: vscode.Diagnostic;
      fingerprint: string;
      confidence: DustyConfidence;
      safeDisposableToken?: string;
      score: number;
    }

    const scored: ScoredDiagnostic[] = [];

    for (const diag of candidates) {
      const fp = createDiagnosticFingerprint(activeUri, diag.range, diag.code, diag.source, diag.message);
      const isSuppressed = this.isSuppressed(fp, now);
      const parseResult = analyzeDiagnosticSpan(diag, document);

      // Score components:
      // - Higher score is better
      // - High confidence: +1000
      // - Error severity: +300
      // - Visible range: +500
      // - Proximity to center: -(distance in lines)
      // - Suppressed: -2000
      let score = 0;
      if (parseResult.confidence === 'high') {
        score += 1000;
      } else if (parseResult.confidence === 'medium') {
        score += 300;
      }

      if (diag.severity === vscode.DiagnosticSeverity.Error) {
        score += 300;
      }

      const isVisible = visibleRanges.some(r => r.contains(diag.range.start));
      if (isVisible) {
        score += 500;
      }

      const lineDistance = Math.abs(diag.range.start.line - centerLine);
      score -= Math.min(lineDistance * 2, 400);

      if (isSuppressed) {
        score -= 2000;
      }

      scored.push({
        diag,
        fingerprint: fp,
        confidence: parseResult.confidence,
        safeDisposableToken: parseResult.safeDisposableToken,
        score
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // If even the best is severely negative from suppression, allow it only if confidence is high
    if (best.score < -1500 && best.confidence !== 'high') {
      return undefined;
    }

    return {
      uri: activeUri,
      range: best.diag.range,
      severity: best.diag.severity,
      source: best.diag.source,
      code: best.diag.code,
      message: best.diag.message,
      documentVersion: document.version,
      fingerprint: best.fingerprint,
      confidence: best.confidence,
      safeDisposableToken: best.safeDisposableToken
    };
  }

  /**
   * Revalidates whether the target is still present, untouched, and safe to edit immediately before action.
   */
  public validateTargetStillValid(
    target: DustyDiagnosticTarget,
    document: vscode.TextDocument,
    activeDiagnostics: readonly vscode.Diagnostic[]
  ): boolean {
    // Check 1: Document must match URI
    if (document.uri.toString() !== target.uri.toString()) {
      return false;
    }

    // Check 2: Document version must not have changed
    if (document.version !== target.documentVersion) {
      return false;
    }

    // Check 3: Document must not be closed or disposed
    if (document.isClosed) {
      return false;
    }

    // Check 4: Diagnostic must still be present in active diagnostics
    const matchingDiag = activeDiagnostics.find(d => {
      if (d.severity !== vscode.DiagnosticSeverity.Error && d.severity !== vscode.DiagnosticSeverity.Warning) {
        return false;
      }
      const fp = createDiagnosticFingerprint(target.uri, d.range, d.code, d.source, d.message);
      return fp === target.fingerprint;
    });

    if (!matchingDiag) {
      return false;
    }

    // Check 5: Range must still be within document bounds
    if (target.range.start.line >= document.lineCount) {
      return false;
    }
    const line = document.lineAt(target.range.start.line).text;
    if (target.range.end.character > line.length) {
      return false;
    }

    return true;
  }
}
