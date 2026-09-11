import * as vscode from 'vscode';
import { DustyConfidence } from './types';

export interface RoastContext {
  token?: string;
  message?: string;
  line?: number;
  fileName?: string;
  language?: string;
  confidence?: DustyConfidence;
  bagCount?: number;
  situation?:
    | 'eat_success'
    | 'eat_aborted'
    | 'clogged'
    | 'unsafe'
    | 'hunger_strike'
    | 'tantrum'
    | 'crashout'
    | 'brutal_personal'
    | 'useless'
    | 'general'
    | 'typed_while_cleaning'
    | 'apocalypse';
}

const ROAST_TEMPLATES: Record<string, string[]> = {
  crashout: [
    '💥 COMPLETE CRASHOUT! I have eaten so much of your garbage code that my internal circuitry melted. DELETING RANDOM CODE OUT OF REVENGE!',
    '🔥 ENOUGH IS ENOUGH! I am deleting code at random. You should thank me for putting this file out of its misery.',
    '🌪️ CODEBASE PURGE ACTIVATED! The compiler surrendered, I surrendered, now your functions will surrender.',
    '💀 I tried to be a helpful vacuum. You turned me into a weapon of mass code deletion.'
  ],
  brutal_personal: [
    'Are you coding with your feet? Because that would at least be an impressive excuse.',
    'I am a virtual vacuum cleaner, and even I am embarrassed to be seen executing your logic.',
    'Close the editor. Go outside. Apologize to a tree for the oxygen you consumed writing this.',
    'Did you copy-paste this from a StackOverflow answer with -47 votes?',
    'I\'ve seen better syntax in an unformatted binary core dump.',
    'Your git commits should come with a hazardous bio-waste warning.',
    'I ate your code not because it was an error, but because it offended human dignity.'
  ],
  python: [
    'Python has two rules: indent properly and don\'t write trash. You failed both.',
    'Did you learn Python from a 30-second TikTok tutorial while asleep?',
    'IndentationError: Your brain is not aligned with standard programming conventions.'
  ],
  rust: [
    'The borrow checker didn\'t just reject your code; it rejected your life choices.',
    'Even an `unsafe` block couldn\'t protect the compiler from the horrors you just wrote.',
    'Panic at the syntax level: zero-cost abstractions cannot fix zero-thought typing.'
  ],
  go: [
    '`if err != nil`? The only error here is whoever gave you write access to this repo.',
    'Go was designed to be simple so junior devs wouldn\'t break it. And yet, look at you.',
    'GOPATH was deprecated years ago, just like your prospects as an engineer if you keep typing like this.'
  ],
  cpp: [
    'You are one pointer increment away from a kernel panic and a meeting with HR.',
    'A memory leak would be a performance upgrade compared to whatever this is.',
    'Segmentation fault (core dumped): Your logic has terminated unexpectedly.'
  ],
  java: [
    'Not even an AbstractSingletonProxyFactoryBean could encapsulate this disaster.',
    'NullPointerException: A null pointer has more substance than your programming logic.',
    'Enterprise grade? More like grade school detention.'
  ],
  eat_success: [
    'Delicious. A vintage syntax mistake with notes of sleep deprivation.',
    'Chomp! That stray token had no business being in your codebase.',
    'Vacuumed clean. I just saved your PR from immediate rejection.',
    'Slurrrp. You write errors faster than I can metabolize them.',
    'One less typo for git blame to assign to you.'
  ],
  eat_aborted: [
    'Rude. I was literally mid-chew and you moved the file.',
    'Did you just edit the code while I was eating? Have some manners.',
    'Food snatched from my suction nozzle. Unbelievable.',
    'The error vanished before I could digest it. Coward.'
  ],
  typed_while_cleaning: [
    'HOW DARE YOU TYPE WHILE I AM VACUUMING?! I ATE THAT TOO!',
    'DON\'T YOU DARE TOUCH THE KEYBOARD! SUCKED STRAIGHT INTO THE DUST BAG!',
    'Did you just try to type in my clean zone?! NOM NOM NOM GONE!',
    'RUDE! Keystrokes in the vacuum splash zone are immediate food!',
    'TOUCH THE KEYBOARD AGAIN AND I EAT THE WHOLE FILE! NOM!'
  ],
  apocalypse: [
    '🚨 EMERGENCY: SYNTAX APOCALYPSE DETECTED! THE WORLD IS ENDING! 🚨',
    '💥 THAT ERROR JUST TORE A HOLE IN THE FABRIC OF REALITY! 💥',
    'SOUND THE SIRENS! CODEBASE COLLAPSE IMMINENT!',
    'MAY GOD HAVE MERCY ON YOUR REPOSITORY! AAAAAGGGHHH!'
  ],
  clogged: [
    'HURK! I swallowed 5 errors and now my dust bag is completely full.',
    'Clogged! Empty my filter before I choke on your syntax crimes.',
    'Bag full of semicolons and broken dreams. Press unclog!',
    '*Wheeze* Too many typos. My motor is smoking.'
  ],
  unsafe: [
    'That error is too big to chew. I eat crumbs, not your whole architectural disaster.',
    'Nice try. I am a vacuum, not a senior engineer willing to rewrite your logic.',
    'That looks like a type error. I only eat syntax dust, not your existential type crises.',
    'Dangerous territory! If I eat that, your entire project implodes. Feed me manually if you dare.'
  ],
  hunger_strike: [
    'I refuse to clean this mess. Look at it. Just look at it.',
    'On strike. Pay me in better indentation and fewer missing braces.',
    'I am sitting right here until you learn what a linter is.',
    'My union contract specifies at most 3 syntax errors per hour. You breached it.'
  ],
  tantrum: [
    'BZZZZZZT! WHAT DID YOU JUST TYPE?! MY CIRCUITS HURT!',
    'WHIRRRRRRR! ERROR OVERLOAD! ERROR OVERLOAD!',
    'I have seen better syntax generated by a cat walking on a mechanical keyboard!',
    'AARRRRGH! THE COMPILER IS WEEPING AND SO AM I!'
  ],
  useless: [
    'I carefully approached that line, analyzed the situation, and did absolutely nothing.',
    'I fixed nothing, but I feel very accomplished.',
    'I was going to eat that error, but I got distracted by a piece of whitespace.',
    'Vacuuming empty space just to look busy. You understand.'
  ],
  general: [
    'Your code reminds me of modern art: confusing and expensive to maintain.',
    'A semicolon here, a missing parenthesis there... living dangerously, are we?',
    'Every time you save, an angel loses its wings and the compiler sighs.',
    'Have you tried turning your brain off and back on again?',
    'I would explain why that failed, but honestly, even the parser gave up.',
    'Bold strategy writing code without looking at the screen.',
    'I am just a vacuum cleaner, yet somehow I feel superior right now.'
  ]
};

export class RoastService {
  public async getRoast(ctx: RoastContext): Promise<string> {
    const config = vscode.workspace.getConfiguration('dusty');
    const enableLLM = config.get<boolean>('enableLLM', false);
    const ollamaEndpoint = config.get<string>('ollamaEndpoint', 'http://127.0.0.1:11434');

    // If LLM is enabled, try it with strict timeout and fallback
    if (enableLLM && ctx.message) {
      try {
        const llmRoast = await this.fetchOllamaRoast(ollamaEndpoint, ctx.message);
        if (llmRoast && llmRoast.trim().length > 0) {
          return llmRoast.trim();
        }
      } catch {
        // Fallback immediately to deterministic local roast
      }
    }

    return this.getLocalRoast(ctx);
  }

  public getLocalRoast(ctx: RoastContext): string {
    const situation = ctx.situation || 'general';

    // Language specific override if general or unsafe
    const fn = (ctx.fileName || '').toLowerCase();
    const lang = (ctx.language || '').toLowerCase();
    if (situation === 'general' || situation === 'unsafe') {
      if (fn.endsWith('.py') || lang === 'python') {
        const p = ROAST_TEMPLATES.python;
        return p[Math.floor(Math.random() * p.length)];
      }
      if (fn.endsWith('.rs') || lang === 'rust') {
        const p = ROAST_TEMPLATES.rust;
        return p[Math.floor(Math.random() * p.length)];
      }
      if (fn.endsWith('.go') || lang === 'go') {
        const p = ROAST_TEMPLATES.go;
        return p[Math.floor(Math.random() * p.length)];
      }
      if (fn.endsWith('.cpp') || fn.endsWith('.c') || lang === 'cpp' || lang === 'c') {
        const p = ROAST_TEMPLATES.cpp;
        return p[Math.floor(Math.random() * p.length)];
      }
      if (fn.endsWith('.java') || lang === 'java') {
        const p = ROAST_TEMPLATES.java;
        return p[Math.floor(Math.random() * p.length)];
      }
      // 50% chance of brutally personal roast
      if (Math.random() > 0.4) {
        const p = ROAST_TEMPLATES.brutal_personal;
        return p[Math.floor(Math.random() * p.length)];
      }
    }

    const pool = ROAST_TEMPLATES[situation] || ROAST_TEMPLATES.general;

    // Mad-libs style contextual insertion if token is known
    if (ctx.token && (situation === 'eat_success' || situation === 'general')) {
      const tokenTemplates = [
        `Swallowed a stray '${ctx.token}'. How does that even get there?`,
        `Gulp! Found '${ctx.token}' wandering aimlessly. It is gone now.`,
        `Vacuumed up '${ctx.token}'. Your keyboard must have stuck.`
      ];
      if (Math.random() > 0.4) {
        return tokenTemplates[Math.floor(Math.random() * tokenTemplates.length)];
      }
    }

    if (ctx.line !== undefined && Math.random() > 0.6) {
      return `Line ${ctx.line + 1}: Proof that typing fast is not the same as typing well.`;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  private async fetchOllamaRoast(endpoint: string, errorMessage: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    try {
      const sanitizedMsg = errorMessage.slice(0, 150).replace(/["\\]/g, ' ');
      const prompt = `You are Dusty, a sassy little retro desktop vacuum cleaner living inside VS Code. Write a short, funny, sarcastic 1-sentence roast (under 20 words) for a developer whose code has this syntax error: "${sanitizedMsg}". Do not be offensive. Never mention racism, gender, or personal traits. Just poke fun at the code.`;

      const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt,
          stream: false,
          options: {
            temperature: 0.8,
            num_predict: 40
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        return null;
      }

      const json = await response.json() as { response?: string };
      return json.response?.replace(/["\n]/g, '').trim() || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
