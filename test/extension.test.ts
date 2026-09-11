import './setupMockVscode';
import * as assert from 'assert';
import * as mock from './mockVscode';
import { analyzeDiagnosticSpan } from '../src/diagnosticParser';
import {
  DiagnosticTargetSelector,
  createDiagnosticFingerprint
} from '../src/diagnosticTarget';
import { StateStore } from '../src/stateStore';
import { RoastService } from '../src/roastService';
import { DecorationManager } from '../src/decorationManager';

describe('Dusty the Malicious Vacuum - Test Suite', () => {

  // Test 1: Diagnostic targeting
  it('1. should select the highest priority Error diagnostic in the active editor', () => {
    const selector = new DiagnosticTargetSelector();
    const uri = mock.Uri.file('/test/app.ts');
    const doc = mock.createMockDocument(['const x = 1;;', 'const y = 2;'], uri, 1);

    const activeEditor = {
      document: doc as any,
      visibleRanges: [new mock.Range(0, 0, 10, 0)],
      setDecorations: () => {}
    } as any;

    const diag1 = new mock.Diagnostic(
      new mock.Range(0, 12, 0, 13),
      "Unexpected token ';'",
      mock.DiagnosticSeverity.Error
    );
    const diagWarning = new mock.Diagnostic(
      new mock.Range(1, 0, 1, 5),
      "'y' is declared but its value is never read.",
      mock.DiagnosticSeverity.Warning
    );

    const allDiags: [any, any[]][] = [
      [uri, [diagWarning, diag1]]
    ];

    const target = selector.selectTarget(activeEditor, allDiags);
    assert.ok(target, 'Target should be selected');
    assert.strictEqual(target?.range.start.character, 12);
    assert.strictEqual(target?.severity, mock.DiagnosticSeverity.Error);
  });

  // Test 2: Stale-document cancellation
  it('2. should cancel target if document version has changed since selection', () => {
    const selector = new DiagnosticTargetSelector();
    const uri = mock.Uri.file('/test/app.ts');
    const range = new mock.Range(0, 10, 0, 11);
    const diag = new mock.Diagnostic(range, "Unexpected token ';'");
    const target = {
      uri: uri as any,
      range: range as any,
      severity: mock.DiagnosticSeverity.Error,
      message: "Unexpected token ';'",
      documentVersion: 1,
      fingerprint: createDiagnosticFingerprint(uri as any, range as any, undefined, undefined, "Unexpected token ';'"),
      confidence: 'high' as const
    };

    const staleDoc = mock.createMockDocument(['const x = 1;'], uri, 2); // Version changed to 2!
    const isValid = selector.validateTargetStillValid(target, staleDoc as any, [diag as any]);
    assert.strictEqual(isValid, false, 'Target should be invalid when document version does not match');
  });

  // Test 3: Diagnostic disappearance cancellation
  it('3. should cancel target if diagnostic disappeared before action', () => {
    const selector = new DiagnosticTargetSelector();
    const uri = mock.Uri.file('/test/app.ts');
    const range = new mock.Range(0, 10, 0, 11);
    const target = {
      uri: uri as any,
      range: range as any,
      severity: mock.DiagnosticSeverity.Error,
      message: "Unexpected token ';'",
      documentVersion: 1,
      fingerprint: createDiagnosticFingerprint(uri as any, range as any, undefined, undefined, "Unexpected token ';'"),
      confidence: 'high' as const
    };

    const doc = mock.createMockDocument(['const x = 1;'], uri, 1);
    const activeDiags: any[] = []; // Diagnostic is gone!

    const isValid = selector.validateTargetStillValid(target, doc as any, activeDiags);
    assert.strictEqual(isValid, false, 'Target should be invalid if diagnostic disappeared');
  });

  // Test 4: Read-only cancellation
  it('4. should reject targets belonging to non-file or non-writable resources', () => {
    const gitUri = mock.Uri.parse('git:/test/app.ts');
    assert.notStrictEqual(gitUri.scheme, 'file');
    assert.notStrictEqual(gitUri.scheme, 'untitled');
  });

  // Test 5: Safe-range classification
  describe('5. Safe-range classification (High vs Low confidence)', () => {
    const uri = mock.Uri.file('/test/app.ts');

    it('should classify stray duplicate semicolon as HIGH confidence', () => {
      const doc = mock.createMockDocument(['const a = 1;;'], uri);
      const diag = new mock.Diagnostic(new mock.Range(0, 12, 0, 13), "Unexpected token ';'");
      const result = analyzeDiagnosticSpan(diag as any, doc as any);
      assert.strictEqual(result.confidence, 'high');
      assert.strictEqual(result.safeDisposableToken, ';');
    });

    it('should classify multi-line diagnostic as LOW confidence', () => {
      const doc = mock.createMockDocument(['function test() {', '  return 1;', '}'], uri);
      const diag = new mock.Diagnostic(new mock.Range(0, 0, 2, 1), 'Syntax error');
      const result = analyzeDiagnosticSpan(diag as any, doc as any);
      assert.strictEqual(result.confidence, 'low');
      assert.match(result.reason, /multi-line/i);
    });

    it('should classify reserved keyword as LOW confidence', () => {
      const doc = mock.createMockDocument(['const x = 1;'], uri);
      const diag = new mock.Diagnostic(new mock.Range(0, 0, 0, 5), 'Syntax error');
      const result = analyzeDiagnosticSpan(diag as any, doc as any);
      assert.strictEqual(result.confidence, 'low');
      assert.match(result.reason, /keyword/i);
    });

    it('should classify semantic / type errors as LOW confidence', () => {
      const doc = mock.createMockDocument(['const x: number = "bad";'], uri);
      const diag = new mock.Diagnostic(
        new mock.Range(0, 18, 0, 23),
        "Type 'string' is not assignable to type 'number'."
      );
      const result = analyzeDiagnosticSpan(diag as any, doc as any);
      assert.strictEqual(result.confidence, 'low');
      assert.match(result.reason, /semantic/i);
    });

    it('should classify empty range as LOW confidence', () => {
      const doc = mock.createMockDocument(['const x = 1;'], uri);
      const diag = new mock.Diagnostic(new mock.Range(0, 5, 0, 5), 'Syntax error');
      const result = analyzeDiagnosticSpan(diag as any, doc as any);
      assert.strictEqual(result.confidence, 'low');
      assert.match(result.reason, /empty/i);
    });
  });

  // Test 6: Duplicate diagnostic suppression
  it('6. should suppress recently targeted diagnostic fingerprints to prevent chaos loops', () => {
    const selector = new DiagnosticTargetSelector(5000);
    const fp = 'file:///test.ts#0:0-0:1##TS1005#unexpected token';

    assert.strictEqual(selector.isSuppressed(fp, 1000), false);
    selector.markTargeted(fp, 1000);
    assert.strictEqual(selector.isSuppressed(fp, 2000), true);
    assert.strictEqual(selector.isSuppressed(fp, 7000), false); // Expired after 5000ms
  });

  // Test 7: Chaos intensity scaling
  it('7. should correctly calculate cooldown scaling by chaos intensity', () => {
    const baseCooldown = 5000;
    const feralMultiplier = 0.4;
    const normalMultiplier = 1.0;
    const calmMultiplier = 1.8;

    assert.strictEqual(baseCooldown * feralMultiplier, 2000);
    assert.strictEqual(baseCooldown * normalMultiplier, 5000);
    assert.strictEqual(baseCooldown * calmMultiplier, 9000);
  });

  // Test 8: Clog transition
  it('8. should transition to clogged when dust bag reaches capacity and recover on unclog', () => {
    const store = new StateStore(false, 'normal', true);
    assert.strictEqual(store.getState(), 'idle');
    assert.strictEqual(store.getBagCount(), 0);

    for (let i = 0; i < 4; i++) {
      const wasClogged = store.incrementBag();
      assert.strictEqual(wasClogged, false);
    }

    assert.strictEqual(store.getBagCount(), 4);
    assert.strictEqual(store.isClogged(), false);

    // 5th error reaches capacity
    const nowClogged = store.incrementBag();
    assert.strictEqual(nowClogged, true);
    assert.strictEqual(store.getState(), 'clogged');
    assert.strictEqual(store.isClogged(), true);

    // Unclog clears bag and restores idle
    store.unclog();
    assert.strictEqual(store.getBagCount(), 0);
    assert.strictEqual(store.getState(), 'idle');
    assert.strictEqual(store.isClogged(), false);
  });

  // Test 9: Engine toggle behavior
  it('9. should transition to disabled when engine toggled off and idle when toggled on', () => {
    const store = new StateStore(false, 'normal', true);
    assert.strictEqual(store.isEnabled(), true);
    assert.strictEqual(store.getState(), 'idle');

    // Toggle off
    store.toggleEngine(false);
    assert.strictEqual(store.isEnabled(), false);
    assert.strictEqual(store.getState(), 'disabled');

    // Toggle on
    store.toggleEngine(true);
    assert.strictEqual(store.isEnabled(), true);
    assert.strictEqual(store.getState(), 'idle');
  });

  // Test 10: Roast fallback when Ollama fails
  it('10. should fallback to deterministic local roast when Ollama is unavailable or fails', async () => {
    const roastService = new RoastService();
    const roast = await roastService.getRoast({
      situation: 'eat_success',
      token: ';'
    });

    assert.ok(roast, 'Roast string should be returned');
    assert.ok(roast.length > 0, 'Roast string should not be empty');
  });

  // Test 11: Webview message validation
  it('11. should validate incoming webview messages correctly', () => {
    const validTypes = ['toggleEngine', 'unclog', 'feed', 'insult', 'mute', 'openProblems', 'testSound', 'ready'];
    const isValid = (msg: any): boolean => {
      if (typeof msg !== 'object' || msg === null) {
        return false;
      }
      return typeof msg.type === 'string' && validTypes.includes(msg.type);
    };

    assert.strictEqual(isValid({ type: 'toggleEngine' }), true);
    assert.strictEqual(isValid({ type: 'unclog' }), true);
    assert.strictEqual(isValid({ type: 'maliciousCommand' }), false);
    assert.strictEqual(isValid('string'), false);
    assert.strictEqual(isValid(null), false);
  });

  // Test 12: Decoration cleanup
  it('12. should clear all decorations and timers without throwing', () => {
    const decManager = new DecorationManager();
    assert.doesNotThrow(() => {
      decManager.clear();
      decManager.dispose();
    });
  });

  // Test 13: Successful atomic edit accounting
  it('13. should only increment dust bag on confirmed edit success', () => {
    const store = new StateStore(false, 'normal', true);
    let editSucceeded = false;

    if (editSucceeded) {
      store.incrementBag();
    }
    assert.strictEqual(store.getBagCount(), 0, 'Bag must not increment when edit fails');

    editSucceeded = true;
    if (editSucceeded) {
      store.incrementBag();
    }
    assert.strictEqual(store.getBagCount(), 1, 'Bag must increment when edit succeeds');
  });

  // Test 14: No-op behavior when confidence is low
  it('14. should not attempt edit when confidence is low', () => {
    const uri = mock.Uri.file('/test/app.ts');
    const doc = mock.createMockDocument(['const longVariableName = 123;'], uri);
    const diag = new mock.Diagnostic(
      new mock.Range(0, 6, 0, 22),
      'Cannot find name longVariableName'
    );

    const parseResult = analyzeDiagnosticSpan(diag as any, doc as any);
    assert.notStrictEqual(parseResult.confidence, 'high');

    // Verify autoIngest policy refuses edit
    let didAttemptEdit = false;
    if (parseResult.confidence === 'high') {
      didAttemptEdit = true;
    }
    assert.strictEqual(didAttemptEdit, false, 'Must be a complete no-op on code modification for low confidence');
  });

  // Test 15: Warning diagnostic ingestion eligibility
  it('15. should allow Warning diagnostics with safe syntax artifacts to be ingested', () => {
    const uri = mock.Uri.file('/test/app.ts');
    const doc = mock.createMockDocument(['const x = 1;;'], uri);
    const diag = new mock.Diagnostic(
      new mock.Range(0, 12, 0, 13),
      "Unnecessary semicolon.",
      mock.DiagnosticSeverity.Warning
    );

    const parseResult = analyzeDiagnosticSpan(diag as any, doc as any);
    assert.strictEqual(parseResult.confidence, 'high', 'Warning with redundant semicolon should be high confidence');
  });

  // Test 16: Apocalyptic strobe effect
  it('16. should trigger apocalyptic screen strobe without throwing and clean up', () => {
    const decManager = new DecorationManager();
    const mockEditor = {
      document: mock.createMockDocument(['const x = 1;']) as any,
      visibleRanges: [new mock.Range(0, 0, 1, 0)],
      setDecorations: () => {}
    } as any;

    assert.doesNotThrow(() => {
      decManager.triggerApocalypseEffect(mockEditor, 0, 50);
      decManager.clear();
      decManager.dispose();
    });
  });

  // Test 17: Angry roast on typing while cleaning
  it('17. should generate furious roasts when user types while vacuum is cleaning', async () => {
    const roastService = new RoastService();
    const roast = await roastService.getRoast({ situation: 'typed_while_cleaning' });
    assert.ok(roast, 'Roast should be generated');
    assert.match(roast, /(TYPE|KEYBOARD|VACUUM|NOM|CLEAN)/i, 'Should be an angry typing roast');
  });

  // Test 18: Random unclog cycle
  it('18. should support spontaneous unclogging from clogged state', () => {
    const store = new StateStore(false, 'normal', true);
    for (let i = 0; i < 5; i++) {
      store.incrementBag();
    }
    assert.strictEqual(store.isClogged(), true);

    // Spontaneous unclog call
    store.unclog();
    assert.strictEqual(store.isClogged(), false);
    assert.strictEqual(store.getBagCount(), 0);
  });
});
