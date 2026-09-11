import * as vscode from 'vscode';
import {
  getDustyFrameUri,
  getDustyCloggedUri,
  getDustyDisabledUri
} from './spriteGen';

export class DecorationManager implements vscode.Disposable {
  private frameDecorations: vscode.TextEditorDecorationType[] = [];
  private cloggedDecoration: vscode.TextEditorDecorationType;
  private disabledDecoration: vscode.TextEditorDecorationType;
  private dissolveDecoration: vscode.TextEditorDecorationType;
  private graffitiDecoration: vscode.TextEditorDecorationType;
  private strobeDecorations: vscode.TextEditorDecorationType[];

  private currentAnimationTimer?: NodeJS.Timeout;
  private apocalypseInterval?: NodeJS.Timeout;
  private activeEditor?: vscode.TextEditor;

  constructor() {
    // Pre-create the 4 animation frame decoration types with gutter icons
    for (let i = 0; i < 4; i++) {
      const uri = vscode.Uri.parse(getDustyFrameUri(i as 0 | 1 | 2 | 3));
      this.frameDecorations.push(
        vscode.window.createTextEditorDecorationType({
          gutterIconPath: uri,
          gutterIconSize: 'contain'
        })
      );
    }

    this.cloggedDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.parse(getDustyCloggedUri()),
      gutterIconSize: 'contain'
    });

    this.disabledDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.parse(getDustyDisabledUri()),
      gutterIconSize: 'contain'
    });

    // Visual dissolve / suction highlight for the error span
    this.dissolveDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(231, 76, 60, 0.25)',
      border: '1px dashed rgba(243, 156, 18, 0.8)',
      borderRadius: '2px',
      textDecoration: 'line-through'
    });

    // Harmless visual graffiti decoration (virtual overlay, zero file modification)
    this.graffitiDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: ' 🧹 [DUSTY WAS HERE - FIXED NOTHING]',
        color: 'rgba(241, 196, 15, 0.7)',
        fontStyle: 'italic',
        fontWeight: 'bold'
      }
    });

    // Apocalyptic strobe decoration types (screen shake / color-changing chaos)
    this.strobeDecorations = [
      vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.45)',
        isWholeLine: true,
        after: {
          contentText: ' 🚨🚨 THE END IS NIGH! SYNTAX APOCALYPSE! 🚨🚨',
          color: '#ff2222',
          fontWeight: '900'
        }
      }),
      vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 140, 0, 0.5)',
        isWholeLine: true,
        after: {
          contentText: ' ⚡⚡ CRITICAL CODE MELTDOWN! WHY DID YOU DO THIS?! ⚡⚡',
          color: '#ffbb00',
          fontWeight: '900'
        }
      }),
      vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 128, 0.45)',
        isWholeLine: true,
        after: {
          contentText: ' 💥💥 ALL HOPE IS LOST! DUSTY IS UNSTABLE! 💥💥',
          color: '#ff00ee',
          fontWeight: '900'
        }
      })
    ];
  }

  /**
   * Clears all decorations on the specified editor or the current active editor.
   */
  public clear(editor?: vscode.TextEditor): void {
    if (this.currentAnimationTimer) {
      clearTimeout(this.currentAnimationTimer);
      this.currentAnimationTimer = undefined;
    }
    if (this.apocalypseInterval) {
      clearInterval(this.apocalypseInterval);
      this.apocalypseInterval = undefined;
    }

    const targetEditor = editor || this.activeEditor || vscode.window.activeTextEditor;
    if (!targetEditor) {
      return;
    }

    for (const dec of this.frameDecorations) {
      targetEditor.setDecorations(dec, []);
    }
    for (const dec of this.strobeDecorations) {
      targetEditor.setDecorations(dec, []);
    }
    targetEditor.setDecorations(this.cloggedDecoration, []);
    targetEditor.setDecorations(this.disabledDecoration, []);
    targetEditor.setDecorations(this.dissolveDecoration, []);
    targetEditor.setDecorations(this.graffitiDecoration, []);
  }

  /**
   * Highlights the target error span with visual suction / dissolve styling.
   */
  public showDissolve(editor: vscode.TextEditor, range: vscode.Range): void {
    this.activeEditor = editor;
    editor.setDecorations(this.dissolveDecoration, [range]);
  }

  public clearDissolve(editor?: vscode.TextEditor): void {
    const targetEditor = editor || this.activeEditor || vscode.window.activeTextEditor;
    if (targetEditor) {
      targetEditor.setDecorations(this.dissolveDecoration, []);
    }
  }

  /**
   * Runs the 4-frame gutter animation on a specific line.
   * Frame 0 (idle approach) -> Frame 1 (mouth opens) -> Frame 2 (chomping) -> Frame 3 (satisfied puff)
   */
  public animateApproach(
    editor: vscode.TextEditor,
    line: number,
    onComplete?: () => void
  ): void {
    this.clear(editor);
    this.activeEditor = editor;

    if (line < 0 || line >= editor.document.lineCount) {
      return;
    }

    const lineRange = new vscode.Range(line, 0, line, 0);
    const frameIntervalMs = 160;
    let currentFrame = 0;

    const showFrame = (frameIndex: number) => {
      if (editor.document.isClosed) {
        this.clear(editor);
        return;
      }

      for (let i = 0; i < this.frameDecorations.length; i++) {
        if (i === frameIndex) {
          editor.setDecorations(this.frameDecorations[i], [lineRange]);
        } else {
          editor.setDecorations(this.frameDecorations[i], []);
        }
      }

      currentFrame++;
      if (currentFrame < this.frameDecorations.length) {
        this.currentAnimationTimer = setTimeout(() => showFrame(currentFrame), frameIntervalMs);
      } else {
        this.currentAnimationTimer = setTimeout(() => {
          this.clear(editor);
          if (onComplete) {
            onComplete();
          }
        }, frameIntervalMs);
      }
    };

    showFrame(0);
  }

  /**
   * Shows temporary visual graffiti on a line. Disappears after durationMs.
   */
  public showTemporaryGraffiti(editor: vscode.TextEditor, line: number, durationMs = 3000): void {
    if (line < 0 || line >= editor.document.lineCount) {
      return;
    }
    const lineRange = new vscode.Range(line, 0, line, 0);
    editor.setDecorations(this.graffitiDecoration, [lineRange]);

    setTimeout(() => {
      if (!editor.document.isClosed) {
        editor.setDecorations(this.graffitiDecoration, []);
      }
    }, durationMs);
  }

  public showCloggedGutter(editor: vscode.TextEditor, line: number): void {
    this.clear(editor);
    this.activeEditor = editor;
    if (line >= 0 && line < editor.document.lineCount) {
      editor.setDecorations(this.cloggedDecoration, [new vscode.Range(line, 0, line, 0)]);
    }
  }

  /**
   * Chaotic end-of-the-world apocalyptic screen effect:
   * Flashes chaotic strobe colors across visible editor lines.
   */
  public triggerApocalypseEffect(editor: vscode.TextEditor, line: number, durationMs = 1200): void {
    this.clear(editor);
    this.activeEditor = editor;

    if (editor.document.isClosed) {
      return;
    }

    const visibleRanges = editor.visibleRanges;
    const targetRanges = visibleRanges.length > 0 ? visibleRanges : [new vscode.Range(line, 0, line, 0)];

    let strobeStep = 0;
    this.apocalypseInterval = setInterval(() => {
      if (editor.document.isClosed) {
        this.clear(editor);
        return;
      }
      for (let i = 0; i < this.strobeDecorations.length; i++) {
        if (i === (strobeStep % this.strobeDecorations.length)) {
          editor.setDecorations(this.strobeDecorations[i], targetRanges);
        } else {
          editor.setDecorations(this.strobeDecorations[i], []);
        }
      }
      strobeStep++;
    }, 110);

    setTimeout(() => {
      if (this.apocalypseInterval) {
        clearInterval(this.apocalypseInterval);
        this.apocalypseInterval = undefined;
      }
      for (const dec of this.strobeDecorations) {
        editor.setDecorations(dec, []);
      }
    }, durationMs);
  }

  public dispose(): void {
    this.clear();
    for (const dec of this.frameDecorations) {
      dec.dispose();
    }
    for (const dec of this.strobeDecorations) {
      dec.dispose();
    }
    this.cloggedDecoration.dispose();
    this.disabledDecoration.dispose();
    this.dissolveDecoration.dispose();
    this.graffitiDecoration.dispose();
  }
}
