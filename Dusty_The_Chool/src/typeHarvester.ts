import * as vscode from 'vscode';

export type TypeErrorCategory =
  | 'type_mismatch'
  | 'missing_property'
  | 'implicit_any'
  | 'arg_count_mismatch'
  | 'compounding'
  | 'generic_type_error';

export interface HarvestedTypeError {
  category: TypeErrorCategory;
  message: string;
  code?: string | number;
  line: number;
  endLine: number;
  target?: string;       // expected type, target object
  received?: string;     // received type, missing property
  paramName?: string;    // parameter name for implicit any
  expectedCount?: number;
  actualCount?: number;
  compoundingCount?: number;
  lineRangeStr?: string;
  diagnostics: vscode.Diagnostic[];
}

/**
 * Classifies an individual Error diagnostic into a structured type error signature.
 */
export function classifyDiagnostic(diag: vscode.Diagnostic): HarvestedTypeError | undefined {
  if (diag.severity !== vscode.DiagnosticSeverity.Error) {
    return undefined;
  }

  const msg = diag.message;
  const line = diag.range.start.line;
  const endLine = diag.range.end.line;
  const rawCode = typeof diag.code === 'object' ? diag.code?.value : diag.code;
  const code = rawCode !== undefined ? String(rawCode) : undefined;

  // 1. Missing Property / Method (TS2339, TS2551, Python AttributeError)
  const missingProp = msg.match(/Property\s+['"]([^'"]+)['"]\s+does not exist on type\s+['"]([^'"]+)['"]/i);
  if (missingProp) {
    return {
      category: 'missing_property',
      message: msg,
      code,
      line,
      endLine,
      received: missingProp[1],
      target: missingProp[2],
      diagnostics: [diag]
    };
  }
  const pyNoAttr = msg.match(/['"]([^'"]+)['"]\s+object has no attribute\s+['"]([^'"]+)['"]/i);
  if (pyNoAttr) {
    return {
      category: 'missing_property',
      message: msg,
      code,
      line,
      endLine,
      target: pyNoAttr[1],
      received: pyNoAttr[2],
      diagnostics: [diag]
    };
  }

  // 2. Type Mismatches (TS2322, TS2345, Python Mypy/Pyright)
  const typeMismatch = msg.match(/(?:Type|Argument of type)\s+['"]([^'"]+)['"]\s+is not assignable to\s+(?:(?:type|parameter of type)\s+)?['"]([^'"]+)['"]/i);
  if (typeMismatch) {
    return {
      category: 'type_mismatch',
      message: msg,
      code,
      line,
      endLine,
      received: typeMismatch[1],
      target: typeMismatch[2],
      diagnostics: [diag]
    };
  }
  const pyTypeMismatch = msg.match(/Expected type\s+['"]([^'"]+)['"],\s*got\s+['"]([^'"]+)['"]/i);
  if (pyTypeMismatch) {
    return {
      category: 'type_mismatch',
      message: msg,
      code,
      line,
      endLine,
      target: pyTypeMismatch[1],
      received: pyTypeMismatch[2],
      diagnostics: [diag]
    };
  }
  const pyIncompat = msg.match(/expression has type\s+['"]([^'"]+)['"],\s*(?:variable|target)\s+has type\s+['"]([^'"]+)['"]/i);
  if (pyIncompat) {
    return {
      category: 'type_mismatch',
      message: msg,
      code,
      line,
      endLine,
      received: pyIncompat[1],
      target: pyIncompat[2],
      diagnostics: [diag]
    };
  }

  // 3. Implicit Any / Strict Violations (TS7006, TS7005, TS7031)
  const implicitAny = msg.match(/(?:Parameter|Variable|Member|Binding element)\s+['"]([^'"]+)['"]\s+implicitly has an?\s+['"]?any['"]?\s+type/i);
  if (implicitAny) {
    return {
      category: 'implicit_any',
      message: msg,
      code,
      line,
      endLine,
      paramName: implicitAny[1],
      diagnostics: [diag]
    };
  }

  // 4. Argument Count Mismatches (TS2554, TS2555, Python TypeError)
  const argMismatch = msg.match(/Expected(?:\s+at least)?\s+(\d+)\s+arguments?,\s+but got\s+(\d+)/i);
  if (argMismatch) {
    return {
      category: 'arg_count_mismatch',
      message: msg,
      code,
      line,
      endLine,
      expectedCount: Number(argMismatch[1]),
      actualCount: Number(argMismatch[2]),
      diagnostics: [diag]
    };
  }
  const pyArgMismatch = msg.match(/takes\s+(\d+)\s+(?:positional\s+)?arguments?\s+but\s+(\d+)\s+(?:were|was)\s+given/i);
  if (pyArgMismatch) {
    return {
      category: 'arg_count_mismatch',
      message: msg,
      code,
      line,
      endLine,
      expectedCount: Number(pyArgMismatch[1]),
      actualCount: Number(pyArgMismatch[2]),
      diagnostics: [diag]
    };
  }

  // Generic TS/Type error
  if (code && /TS(2\d{3}|7\d{3})/i.test(code)) {
    return {
      category: 'generic_type_error',
      message: msg,
      code,
      line,
      endLine,
      diagnostics: [diag]
    };
  }

  return undefined;
}

/**
 * Extracts and classifies all active document error diagnostics.
 * Groups consecutive or clustered errors into a compounding payload.
 */
export function harvestTypeErrors(diagnostics: readonly vscode.Diagnostic[]): HarvestedTypeError[] {
  const classified: HarvestedTypeError[] = [];

  for (const diag of diagnostics) {
    const item = classifyDiagnostic(diag);
    if (item) {
      classified.push(item);
    }
  }

  if (classified.length === 0) {
    return [];
  }

  // Sort by line order
  classified.sort((a, b) => a.line - b.line);

  // Group multiple errors occurring in the same scope or consecutive lines (within 2 lines)
  const compoundingGroups: HarvestedTypeError[] = [];
  let currentGroup: HarvestedTypeError[] = [classified[0]];

  for (let i = 1; i < classified.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = classified[i];
    if (curr.line - prev.endLine <= 2) {
      currentGroup.push(curr);
    } else {
      if (currentGroup.length >= 2) {
        compoundingGroups.push(createCompoundingPayload(currentGroup));
      }
      currentGroup = [curr];
    }
  }

  if (currentGroup.length >= 2) {
    compoundingGroups.push(createCompoundingPayload(currentGroup));
  }

  // Compounding clusters come first so Dusty prioritizes roasting cascading incompetence
  return [...compoundingGroups, ...classified];
}

function createCompoundingPayload(group: HarvestedTypeError[]): HarvestedTypeError {
  const minLine = group[0].line;
  const maxLine = group[group.length - 1].endLine;
  const rangeStr = minLine === maxLine ? `line ${minLine + 1}` : `lines ${minLine + 1}–${maxLine + 1}`;
  return {
    category: 'compounding',
    message: `${group.length} cascading type errors across ${rangeStr}`,
    line: minLine,
    endLine: maxLine,
    compoundingCount: group.length,
    lineRangeStr: rangeStr,
    diagnostics: group.flatMap(g => g.diagnostics)
  };
}
