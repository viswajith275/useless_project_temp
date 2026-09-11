import * as vscode from 'vscode';

export type DustyState =
  | 'idle'
  | 'hunting'
  | 'approaching'
  | 'eating'
  | 'recovering'
  | 'clogged'
  | 'regurgitating'
  | 'graffiti'
  | 'hungerStrike'
  | 'tantrum'
  | 'disabled';

export type DustyConfidence = 'high' | 'medium' | 'low';

export type ChaosIntensity = 'calm' | 'normal' | 'feral';

export type SoundName = 'suction' | 'error' | 'clog' | 'victory' | 'tantrum' | 'idle';

export interface DustyDiagnosticTarget {
  uri: vscode.Uri;
  range: vscode.Range;
  severity: vscode.DiagnosticSeverity;
  source?: string;
  code?: string | number | { value: string | number; target: vscode.Uri };
  message: string;
  documentVersion: number;
  fingerprint: string;
  confidence: DustyConfidence;
  safeDisposableToken?: string;
}

export interface SerializableTarget {
  fsPath: string;
  line: number;
  character: number;
  endCharacter: number;
  message: string;
  confidence: DustyConfidence;
  safeDisposableToken?: string;
}

export interface DustyStateSnapshot {
  state: DustyState;
  bagCount: number;
  bagCapacity: number;
  enabled: boolean;
  muted: boolean;
  chaosIntensity: ChaosIntensity;
  lastRoast?: string;
  currentTarget?: SerializableTarget;
}

export type HostToWebviewMessage =
  | { type: 'state'; state: DustyStateSnapshot }
  | { type: 'roast'; text: string }
  | { type: 'target'; target?: SerializableTarget }
  | { type: 'bag'; value: number; capacity: number }
  | { type: 'sound'; name: SoundName }
  | { type: 'shake'; intensity: number }
  | { type: 'graffiti'; text: string }
  | { type: 'reducedMotion'; enabled: boolean };

export type WebviewToHostMessage =
  | { type: 'toggleEngine' }
  | { type: 'unclog' }
  | { type: 'feed' }
  | { type: 'insult' }
  | { type: 'mute' }
  | { type: 'openProblems' }
  | { type: 'testSound' }
  | { type: 'ready' };
