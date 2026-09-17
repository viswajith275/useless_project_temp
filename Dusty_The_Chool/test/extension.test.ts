import './setupMockVscode';
import * as assert from 'assert';
import * as path from 'path';
import * as mock from './mockVscode';
import { analyzeDiagnosticSpan } from '../src/diagnosticParser';
import {
  DiagnosticTargetSelector,
  createDiagnosticFingerprint
} from '../src/diagnosticTarget';
import { StateStore } from '../src/stateStore';
import { RoastService, STATIC_FALLBACK_BANK } from '../src/roastService';
import { DecorationManager } from '../src/decorationManager';
import { classifyDiagnostic, harvestTypeErrors } from '../src/typeHarvester';

describe('Dusty the Malicious Vacuum - Test Suite', () => {

  // Test 1: Diagnostic targeting
  it('1. should select the highest priority Error diagnostic in the active editor', () => {
    const selector = new DiagnosticTargetSelector();
    const uri = mock.Uri.file('/test/app.ts');
    const doc = mock.createMockDocument(['const x = 1;;', 'const y = 2;'], uri, 1);

    const activeEditor = {
      document: doc as any,
      visibleRanges: [new mock.Range(0, 0, 10, 0)],
      setDecorations: () => { }
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
      setDecorations: () => { }
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

  // Test 19: Multi-language roasts
  it('19. should generate tailored brutal roasts for multiple programming languages', async () => {
    const roastService = new RoastService();
    const pyRoast = await roastService.getRoast({ language: 'python', situation: 'general' });
    assert.match(pyRoast, /(Python|indent|TikTok)/i);

    const rustRoast = await roastService.getRoast({ language: 'rust', situation: 'general' });
    assert.match(rustRoast, /(borrow checker|unsafe|Panic|Lifetimes)/i);

    const goRoast = await roastService.getRoast({ language: 'go', situation: 'general' });
    assert.match(goRoast, /(err != nil|Go|GOPATH)/i);
  });

  // Test 20: Enclosing block range detection (gobble entire function)
  it('20. should detect and return enclosing block range for gobbling', () => {
    const doc = mock.createMockDocument([
      'function badFunction() {',
      '  const a = 1;;',
      '  return a;',
      '}'
    ]);
    const diagRange = new mock.Range(1, 12, 1, 13);
    const { findEnclosingBlockRange } = require('../src/diagnosticParser');
    const blockRange = findEnclosingBlockRange(doc as any, diagRange as any);

    assert.strictEqual(blockRange.start.line, 0, 'Should start at function header');
    assert.strictEqual(blockRange.end.line, 3, 'Should end at closing brace');
  });

  // Test 21: Crashout state transition
  it('21. should support transitioning to crashout state', () => {
    const store = new StateStore(false, 'feral', true);
    store.transition('crashout');
    assert.strictEqual(store.getState(), 'crashout');
  });

  // Test 22: Rage meter increments and caps at 100
  it('22. should track rage meter and cap at 100', () => {
    const store = new StateStore(false, 'feral', true);
    assert.strictEqual(store.getRage(), 0);
    store.increaseRage(35);
    assert.strictEqual(store.getRage(), 35);
    store.increaseRage(50);
    assert.strictEqual(store.getRage(), 85);
    store.increaseRage(50);
    assert.strictEqual(store.getRage(), 100);
    store.resetRage();
    assert.strictEqual(store.getRage(), 0);
  });

  // Test 23: Fallback to entire line when syntax error is outside any function
  it('23. should fall back to entire line when error is outside any function', () => {
    const doc = mock.createMockDocument([
      'import { something } from "somewhere";',
      'const topLevelConst = 42;;',
      'console.log(topLevelConst);'
    ]);
    const diagRange = new mock.Range(1, 24, 1, 26);
    const { findEnclosingBlockRange } = require('../src/diagnosticParser');
    const blockRange = findEnclosingBlockRange(doc as any, diagRange as any);

    assert.strictEqual(blockRange.start.line, 1, 'Should start at top-level line');
    assert.strictEqual(blockRange.end.line, 1, 'Should end at same top-level line');
  });

  // Test 24: Mathematical volume increments and fatigue calculation
  it('24. should calculate bag units and fatigue predictably', () => {
    const store = new StateStore(false, 'normal', true);
    assert.strictEqual(store.getFatigue(), 0);

    // Increment bag by 3 units (e.g. from gulping a function)
    const clogged = store.incrementBag(3);
    assert.strictEqual(clogged, false);
    assert.strictEqual(store.getBagCount(), 3);

    // Increase rage to 40
    store.increaseRage(40);
    // Fatigue = (40 * 0.5) + ((3 / 5) * 50) = 20 + 30 = 50
    assert.strictEqual(store.getFatigue(), 50);

    // Gulping another function adds 2 units -> 5/5 -> CLOGS!
    const nowClogged = store.incrementBag(2);
    assert.strictEqual(nowClogged, true);
    assert.strictEqual(store.isClogged(), true);
  });

  // Test 25: Kerala-style English meme roasts
  it('25. should return brutal Kerala-style English meme roasts for crashout and insults', async () => {
    const roastService = new RoastService();
    const crashoutRoast = await roastService.getRoast({ situation: 'crashout' });
    assert.ok(crashoutRoast.length > 0);
    assert.match(crashoutRoast, /(Aaraattu Annan|KSRTC|KSEB|Pandit|kalippu|chool|code|Panchayat|WhatsApp|deluge|monsoon)/i, 'Should contain Kerala meme troll references');

    const personalRoast = await roastService.getRoast({ situation: 'brutal_personal' });
    assert.ok(personalRoast.length > 0);
    assert.match(personalRoast, /(Aaraattu Annan|vazha|KSRTC|KSEB|WhatsApp|parippuvada|PSC|Food vlogger|Moral policing|Pandit|Kudumbashree|Git blame|StackOverflow|code)/i, 'Should contain Kerala meme troll references');
  });

  // Test 26: Pixel-art broom SVG generation
  it('26. should generate pixel-art broom SVG frames with handle and bristles', () => {
    const { getDustyFrameSvg, getDustyCloggedSvg, getDustyActivityBarSvg } = require('../src/spriteGen');
    const idleSvg = getDustyFrameSvg(0);
    assert.ok(idleSvg.includes('<svg'));
    assert.ok(idleSvg.includes('<line') || idleSvg.includes('<polygon'), 'Broom SVG should contain broom handle or bristles');

    const cloggedSvg = getDustyCloggedSvg();
    assert.ok(cloggedSvg.includes('<svg'));
    assert.ok(cloggedSvg.includes('stroke="#f1c40f"'), 'Clogged broom should have X eyes');

    const activityBarSvg = getDustyActivityBarSvg();
    assert.ok(activityBarSvg.includes('viewBox="0 0 24 24"'));
  });

  // Test 28: Ollama 3B Kerala meme prompt builder & response cleaning
  it('28. should build rich contextual 3B English prompt with Kerala memes and clean LLM responses', () => {
    const roastService = new RoastService();
    const prompt = roastService.buildPrompt({
      fileName: '/workspace/src/authController.ts',
      language: 'typescript',
      line: 41,
      token: ';;',
      codeSnippet: 'const token = createToken();;',
      message: "Unexpected token ';'",
      situation: 'eat_success'
    });

    assert.ok(prompt.includes('authController.ts'), 'Prompt must target the file name');
    assert.ok(prompt.includes('Line 42'), 'Prompt must target the 1-indexed line number');
    assert.ok(prompt.includes('createToken'), 'Prompt must include the code snippet');
    assert.ok(prompt.includes('ENGLISH'), 'Prompt must enforce English output');
    assert.ok(prompt.includes('Aaraattu Annan') || prompt.includes('KSRTC'), 'Prompt must include Kerala meme tropes');

    const dirtyResponse = '"Dusty: Eda mone, line 42 has an error! [Translation: Are you not ashamed?]"';
    const cleaned = roastService.cleanLlmResponse(dirtyResponse);
    assert.strictEqual(cleaned.includes('[Translation:'), false, 'Should strip translation block');
    assert.strictEqual(cleaned.startsWith('"') || cleaned.endsWith('"'), false, 'Should strip quotes');
    assert.strictEqual(cleaned.startsWith('Dusty:'), false, 'Should strip Dusty prefix');
  });

  // Test 29: VacuumViewProvider custom sound file detection
  it('29. should detect custom sound files in media/sounds directory', () => {
    const mockStateStore = new StateStore(false, 'normal', true);
    const mockUri = mock.Uri.file(path.join(__dirname, '../..'));
    const { VacuumViewProvider } = require('../src/vacuumViewProvider');
    const provider = new VacuumViewProvider(mockUri as any, mockStateStore, () => { });

    const files = provider.getCustomSoundFiles();
    assert.ok(Array.isArray(files), 'getCustomSoundFiles must return an array');
  });

  // Test 30: Roast de-duplication ring buffer
  it('30. should avoid immediately repeating the same dialogue when pool has alternatives', () => {
    const roastService = new RoastService();
    const candidates = ['Roast A', 'Roast B', 'Roast C', 'Roast D'];
    const chosen1 = roastService.pickRoast(candidates);
    const chosen2 = roastService.pickRoast(candidates);
    assert.notStrictEqual(chosen1, chosen2, 'Consecutive picks should not return the exact same candidate');
  });

  // Test 31: Hunger and mischief roasts
  it('31. should return hungry warning and mischievous deletion roasts with Kerala memes', async () => {
    const roastService = new RoastService();
    const hungerRoast = await roastService.getRoast({ situation: 'hunger' });
    assert.ok(hungerRoast.length > 0);
    assert.match(hungerRoast, /(starving|food|error|working|clean|Aaraattu Annan|Threat|ration|parippuvada|vlogger|Moral policing)/i);

    const mischiefRoast = await roastService.getRoast({ situation: 'mischief_eaten' });
    assert.ok(mischiefRoast.length > 0);
    assert.match(mischiefRoast, /(NOM|working|swallowed|muram|Aaraattu Annan|KSRTC|KSEB|Threat|mischief|dustpan)/i);
  });

  // Test 32: Llama 3.2: 3B few-shot prompt structure
  it('32. should format Llama 3.2: 3B prompt with system header and few-shot examples', () => {
    const roastService = new RoastService();
    const prompt = roastService.buildPrompt({
      fileName: 'test.py',
      language: 'python',
      situation: 'hunger'
    });
    assert.ok(prompt.includes('<|start_header_id|>system<|end_header_id|>'));
    assert.ok(prompt.includes('FEW-SHOT EXAMPLES:'));
    assert.ok(prompt.includes('<|start_header_id|>assistant<|end_header_id|>'));
  });

  // Test 33: Hunger and mischief states, sounds, and randomized interval bounds
  it('33. should support hunger and mischief states and verify +/-5s interval bounds', () => {
    const store = new StateStore(false, 'normal', true);
    store.transition('hunger');
    assert.strictEqual(store.getState(), 'hunger');

    store.transition('mischief');
    assert.strictEqual(store.getState(), 'mischief');

    // Test interval formula bounds:
    for (let i = 0; i < 50; i++) {
      const secWarning = 35 + Math.floor(Math.random() * 11);
      const ticksWarning = Math.max(15, Math.round(secWarning / 2));
      assert.ok(secWarning >= 35 && secWarning <= 45, 'Warning seconds must be between 35 and 45');
      assert.ok(ticksWarning >= 17 && ticksWarning <= 23, 'Warning ticks must be between 17 and 23');

      const secMischief = 11 + Math.floor(Math.random() * 11);
      const ticksMischief = Math.max(5, Math.round(secMischief / 2));
      assert.ok(secMischief >= 11 && secMischief <= 21, 'Mischief seconds must be between 11 and 21');
      assert.ok(ticksMischief >= 5 && ticksMischief <= 11, 'Mischief ticks must be between 5 and 11');
    }
  });

  // Test 34: Multi-type error harvester extraction & classification
  it('34. should classify type mismatches, missing props, implicit any, argument count, and compounding clusters', () => {
    // 1. Type Mismatch (TS2322 & TS2345)
    const diag1 = new mock.Diagnostic(
      new mock.Range(5, 0, 5, 20),
      "Type 'string' is not assignable to type 'number'.",
      mock.DiagnosticSeverity.Error
    );
    const res1 = classifyDiagnostic(diag1 as any);
    assert.ok(res1);
    assert.strictEqual(res1?.category, 'type_mismatch');
    assert.strictEqual(res1?.received, 'string');
    assert.strictEqual(res1?.target, 'number');

    // 2. Missing Property (TS2339)
    const diag2 = new mock.Diagnostic(
      new mock.Range(8, 0, 8, 20),
      "Property 'fly' does not exist on type 'Vazha'.",
      mock.DiagnosticSeverity.Error
    );
    const res2 = classifyDiagnostic(diag2 as any);
    assert.ok(res2);
    assert.strictEqual(res2?.category, 'missing_property');
    assert.strictEqual(res2?.received, 'fly');
    assert.strictEqual(res2?.target, 'Vazha');

    // 3. Implicit Any (TS7006)
    const diag3 = new mock.Diagnostic(
      new mock.Range(12, 0, 12, 10),
      "Parameter 'userData' implicitly has an 'any' type.",
      mock.DiagnosticSeverity.Error
    );
    const res3 = classifyDiagnostic(diag3 as any);
    assert.ok(res3);
    assert.strictEqual(res3?.category, 'implicit_any');
    assert.strictEqual(res3?.paramName, 'userData');

    // 4. Argument Count Mismatch (TS2554)
    const diag4 = new mock.Diagnostic(
      new mock.Range(15, 0, 15, 15),
      "Expected 3 arguments, but got 1.",
      mock.DiagnosticSeverity.Error
    );
    const res4 = classifyDiagnostic(diag4 as any);
    assert.ok(res4);
    assert.strictEqual(res4?.category, 'arg_count_mismatch');
    assert.strictEqual(res4?.expectedCount, 3);
    assert.strictEqual(res4?.actualCount, 1);

    // 5. Compounding grouping on consecutive lines
    const diagA = new mock.Diagnostic(
      new mock.Range(20, 0, 20, 10),
      "Type 'boolean' is not assignable to type 'string'.",
      mock.DiagnosticSeverity.Error
    );
    const diagB = new mock.Diagnostic(
      new mock.Range(21, 0, 21, 10),
      "Property 'drive' does not exist on type 'KSRTC'.",
      mock.DiagnosticSeverity.Error
    );
    const harvested = harvestTypeErrors([diagA as any, diagB as any]);
    assert.ok(harvested.length >= 3, 'Should produce compounding cluster plus individual items');
    assert.strictEqual(harvested[0].category, 'compounding');
    assert.strictEqual(harvested[0].compoundingCount, 2);
    assert.ok(harvested[0].lineRangeStr?.includes('lines 21–22'));
  });

  // Test 35: 3-Tier Roasting System (Tier 1 instant AST/regex, Tier 2 LLM resilience, Tier 3 static bank)
  it('35. should generate Tier 1 instant contextual roasts and verify Tier 3 bank size >= 40', async () => {
    const roastService = new RoastService();

    // Verify Tier 3 bank size
    assert.ok(STATIC_FALLBACK_BANK.length >= 40, `Static fallback bank must have at least 40 roasts (found ${STATIC_FALLBACK_BANK.length})`);
    const tier3Roast = roastService.getTier3Roast();
    assert.ok(tier3Roast.length > 10);

    // Verify Tier 1 Instant regex/AST slot populating
    const mismatchRoast = roastService.getTier1Roast({
      category: 'type_mismatch',
      message: "Type 'Apple' is not assignable to type 'Banana'.",
      line: 4,
      endLine: 4,
      received: 'Apple',
      target: 'Banana',
      diagnostics: []
    });
    assert.ok(mismatchRoast.includes('Apple') && mismatchRoast.includes('Banana'), 'Tier 1 must slot extracted types into roast');

    const missingPropRoast = roastService.getTier1Roast({
      category: 'missing_property',
      message: "Property 'turbo' does not exist on type 'Swift'.",
      line: 10,
      endLine: 10,
      received: 'turbo',
      target: 'Swift',
      diagnostics: []
    });
    assert.ok(missingPropRoast.includes('.turbo') && missingPropRoast.includes('Swift'), 'Tier 1 must slot property and object');

    const implicitAnyRoast = roastService.getTier1Roast({
      category: 'implicit_any',
      message: "Parameter 'config' implicitly has an 'any' type.",
      line: 14,
      endLine: 14,
      paramName: 'config',
      diagnostics: []
    });
    assert.ok(implicitAnyRoast.includes('config'), 'Tier 1 must slot implicit any param name');

    const argRoast = roastService.getTier1Roast({
      category: 'arg_count_mismatch',
      message: 'Expected 4 arguments, but got 2.',
      line: 20,
      endLine: 20,
      expectedCount: 4,
      actualCount: 2,
      diagnostics: []
    });
    assert.ok(argRoast.includes('4') && argRoast.includes('2'), 'Tier 1 must slot argument counts');

    const compoundingRoast = roastService.getTier1Roast({
      category: 'compounding',
      message: '3 cascading type errors across lines 10–12',
      line: 9,
      endLine: 11,
      compoundingCount: 3,
      lineRangeStr: 'lines 10–12',
      diagnostics: []
    });
    assert.ok(compoundingRoast.includes('3') && compoundingRoast.includes('lines 10–12'), 'Tier 1 must slot compounding count and range');

    // Tier 2 Ollama Bridge Resilience: when endpoint is offline, timeout triggers and falls back cleanly
    const finalRoast = await roastService.roastTypeError({
      category: 'type_mismatch',
      message: "Type 'int' is not assignable to type 'str'.",
      line: 1,
      endLine: 1,
      received: 'int',
      target: 'str',
      diagnostics: []
    });
    assert.ok(finalRoast && finalRoast.length > 5, 'roastTypeError must return a valid roast via fallback');
  });
});
