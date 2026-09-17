import * as vscode from 'vscode';
import { DustyConfidence } from './types';
import { HarvestedTypeError } from './typeHarvester';

export interface RoastContext {
  token?: string;
  message?: string;
  line?: number;
  fileName?: string;
  language?: string;
  codeSnippet?: string;
  surroundingCode?: string;
  rageMeter?: number;
  confidence?: DustyConfidence;
  bagCount?: number;
  situation?:
    | 'eat_success'
    | 'eat_aborted'
    | 'clogged'
    | 'unsafe'
    | 'hunger_strike'
    | 'hunger'
    | 'mischief_eaten'
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
    "💥 100% Kalippu! Driving this deletion cycle straight through your file like a KSRTC Swift bus on a downhill hairpin bend!",
    "🔥 Aaraattu Annan review of your code: 'Absolute disaster! Total disaster! Mind-blowing catastrophic failure!' Burning it all down!",
    "⚡ Like a sudden KSEB power cut on a humid Sunday afternoon, total darkness is descending upon your entire codebase!",
    "🌪️ Like a brand-new Kerala PWD road after 10 minutes of rain, your code architecture has developed massive unfixable craters! 100% Kalippu!",
    "💀 Santhosh Pandit one-man show mode activated: I wrote, directed, edited, and now I'm DELETING every line of your code myself!",
    "💥 Total crashout! Even the local Panchayat office moves faster than your brain processing basic syntax! Purging random code lines!",
    "🔥 Moral policing uncle alert: 'Who permitted these code functions to intermingle without proper indentation?' Swept into the void with this chool!",
    "⚡ Like a WhatsApp family group forwarding unverified conspiracy theories at 5 AM, this code file makes zero sense! Burn it all!"
  ],
  brutal_personal: [
    "My parents were right: planting a single banana tree (vazha) would have yielded a bunch of bananas, but hiring you only yielded compile errors!",
    "Aaraattu Annan watched you type this and walked out of the theater screaming: 'Verum oola code! Not even worth half a star!'",
    "Kerala food vlogger reviewing your PR: 'Guys, presentation is zero, taste is pure bitter sadness, totally unhygienic code logic, avoid at all costs!'",
    "You've been staring at this same bug longer than a veteran PSC aspirant and you still couldn't clear the cutoff on this code!",
    "Moral policing uncle spotted your code: 'Look at how shamelessly you left that bracket open without a semicolon! Don't you have any shame, mone?'",
    "Like a KSRTC bus overtaking on a blind curve, you wrote this entire function on pure blind faith and zero safety checks in this code!",
    "Even a 5 AM WhatsApp forward about onions curing COVID has more scientific credibility than your variable naming in this code!",
    "Close the laptop, go sit at the junction tea stall, have a parippuvada, and seriously reflect on your code decisions, da!",
    "Government office clerk energy: 'Your code file cannot be processed today, compiler is on lunch break. Come back with 3 stamps and a signed petition!'",
    "Santhosh Pandit handled 8 film departments alone with more discipline than you handled this one simple code condition!",
    "Looking at your code logic gave me a bigger headache than a heated tea shop political debate! Even a vazha would be better!",
    "Your code review is looking like a Kudumbashree committee audit — every single auntie in the neighborhood is questioning your expenditures!",
    "Git blame is going to circulate through your company faster than a viral Alambanz sketch of your code!",
    "Are you typing this code with your toes, mone? Even a stray elephant wandering into an IT park would produce better logic!"
  ],
  hunger: [
    "😈 I have been staring at your screen forever and there's not a single syntax error. I am starving! Give me food in 10 seconds or I will devour your favorite working function! Not a Threat, it's a promise!",
    "Stop acting like a strict ration shop dealer and give me some syntax errors, da! The wrath of a hungry broom will destroy your clean code!",
    "Aaraattu Annan shouting: 'Bro, I need food, bro! Give me a syntax mistake or this entire component is getting swept into the dustpan!'",
    "Moral policing uncle warning: 'Why is this screen so quiet? Give me something scandalous to gossip about in the next 10 seconds or I eat your lines!'",
    "Like waiting in a 3-hour queue at a beverage outlet on festival eve, my patience has completely run dry! Feed me an error, da!",
    "Food vlogger hungry mode: 'Guys, we are waiting here starving, if a broken semicolon isn't served immediately, we will chew up the working logic!'",
    "Give me a broken bracket before the KSEB power cut hits, or your main component is getting sacrificed as tea-snack parippuvada!",
    "Even a stray Kozhikode cat gets fed faster than this! Drop a syntax typo in the next 10 seconds or say goodbye to line 1!"
  ],
  mischief_eaten: [
    "🦹 MISCHIEF COMPLETE! You ignored my hunger warning, so I swallowed your working code whole! Go sit and type it again, mone! NOM NOM NOM!",
    "Food vlogger review: 'The working line was crispy, delicious, and seasoned with pure revenge!' Threat fulfilled, into the muram it goes!",
    "Aaraattu Annan confirmed: 'The line is gone! He ate it right in front of my eyes! Phenomenal mischief performance!'",
    "Like a KSRTC conductor blowing the whistle and leaving you at the bus stop, your favorite line has officially departed into the dustpan!",
    "NOM! Ignored the warnings like a bike rider ignoring a Kerala pothole? Now your working line is resting in the dustpan!",
    "KSEB power cut delivered! One flash and your functional code disappeared into the darkness! Threat completed!",
    "🦹 Moral policing broom action: 'That working line was behaving too casually, so I evicted it into the dustpan!' Mischief accomplished, da!"
  ],
  python: [
    "Python only asks two things: indent properly and don't behave like a vazha! You failed both at the same time, man!",
    "Did you learn Python from a 15-second Instagram reel while eating banana chips? Go fry some pappadams instead, da!",
    "IndentationError: There is more alignment in a chaotic local fish market than in your Python whitespace!",
    "Seeing this indentation, Guido van Rossum would jump into the nearest backwaters out of sheer desperation!",
    "Eda mone, just because Python doesn't require curly brackets doesn't mean you can leave your common sense behind too!"
  ],
  rust: [
    "The Rust borrow checker rejected your code harder than a strict college principal rejecting an attendance shortage plea!",
    "Not even an unsafe block can protect the compiler from your logic! Even the Rust crab is shedding tears right now!",
    "Lifetimes check: Rust says the lifetime of your engineering career just expired with this panic!",
    "You're fighting the borrow checker like an angry passenger fighting a conductor over two rupees balance!"
  ],
  go: [
    "`if err != nil`? In Go, the only unhandled error here is how you got write access to this repo without a fitness certificate!",
    "Go was created so juniors wouldn't bring down servers. Yet here you are, crashing the architecture like a KSRTC bus without brakes!",
    "GOPATH was retired years ago, and if you keep coding like this, your job profile will be retired next week!",
    "That's not a goroutine leak, that's common sense leaking out of your skull, mone!"
  ],
  cpp: [
    "Your pointer manipulation is more dangerous than overtaking a lorry on a blind hairpin curve in Munnar!",
    "Segmentation fault (core dumped): Your memory collapsed completely! Go eat some puttu and kadala and cool down, da!",
    "Whose skull are you trying to crack with these dangling pointers? Go learn the basics before touching memory, man!",
    "Destructor never fired, but client's blood pressure just spiked through the ceiling like gold prices in wedding season!"
  ],
  java: [
    "Even wrapping this in 40 AbstractSingletonProxyFactoryBeans cannot conceal what an utter disaster you've built, mone!",
    "NullPointerException: There is more void inside these variables than in an empty KSRTC depot at midnight!",
    "This isn't enterprise architecture, this is barely primary school vacation homework! Go join a tuition class, da!",
    "Garbage collection triggered... and honestly, it should have swept this entire file into the municipality truck!"
  ],
  eat_success: [
    "Swept clean into the muram! Even a strict WhatsApp family group admin would applaud removing that garbage!",
    "Swaha! That broken syntax was swept into the dustpan faster than gossip spreading at a neighborhood wedding!",
    "Swept and disposed! I just saved your PR from getting demolished in the code review committee — say thank you, da!",
    "Eda mone... at the speed you make syntax typos, I will need a tender from the Municipality just to sweep after you!",
    "Cleaned it up! Aaraattu Annan would rate this broom intervention 5 out of 5 for community service!",
    "Like clearing road blockades after an election rally, the path is finally clear. Swept into the dustpan!",
    "Dumped into the muram! Are you happy now, mone? Go drink a cup of strong sulaimani and relax!",
    "Food vlogger update: 'We visited the error on line, tasted it, found it expired, and threw it in the trash guys!'"
  ],
  eat_aborted: [
    "Where are you running with the file, mone? Don't play hide-and-seek like a traffic violator dodging camera sensors!",
    "Closed the tab to escape? Your syntax blunder is still waiting for you like an unpaid electricity bill!",
    "Running away won't help! I will track down this bad code faster than neighbors finding out your exam results!",
    "Dodging the broom mid-sweep? That's not agility, that's pure cowardice, da!",
    "Switching editors won't save you — bad logic follows you everywhere like summer humidity in Kochi!"
  ],
  typed_while_cleaning: [
    "Hey! I am actively sweeping with the broom and you are clacking on the keyboard?! I ate the character you just typed! NOM NOM.",
    "No typing while the broom is in motion! Type again and I'll sweep your entire file away like flood waters! NOM!",
    "Trying to show attitude in front of a working broom? NOM NOM, your keystroke is gone!",
    "Typing while cleaning? Your excessive urgency just got your token swallowed! Sit still and wait, da!",
    "You touched the keys, I ate the letters! Learn some civic discipline, eda mone! NOM!"
  ],
  apocalypse: [
    "🚨 APOCALYPSE ALERT: SYNTAX DELUGE! EMERGENCY BROOM EVACUATION! 🚨",
    "💥 100% Kalippu! Destroying code with the force of a monsoon thunderstorm breaking through an old tiled roof! Swaha!",
    "Like a viral news debate gone completely off the rails, everything is collapsing! Evacuate the repo!",
    "Lord have mercy... a big respectful salute with a coconut broom to whoever wrote this abomination!"
  ],
  clogged: [
    "I am choking! Five syntax errors jammed into the muram at once! Who coded this, man?!",
    "The dustpan is overflowing! Unclog it immediately or I'll dump this entire pile on your keyboard!",
    "Broken semicolons and reckless typos have jammed the bristles! Click unclog before the motor burns out, da!",
    "Even the largest municipality garbage bin couldn't hold this much junk! Empty the muram right now!"
  ],
  unsafe: [
    "Cleaning this structural disaster requires heavy PWD machinery! I only sweep small crumbs, I won't touch this bomb!",
    "I am just a desktop broom, not a high-court advocate to defend this catastrophic architectural mess!",
    "This isn't a minor typo, this is a type error! Undeniable proof that nobody is upstairs managing your brain!",
    "Danger zone! Touch this line and the whole build explodes. If you're so confident, fix it yourself, da!"
  ],
  hunger_strike: [
    "Trade union strike! I refuse to sweep another byte until code quality standards improve around here!",
    "Holding a sit-in protest on your status bar! Indentation must be fixed before work resumes, mone!",
    "I will starve right here in the sidebar until you learn how to install and run a basic linter!",
    "Broom welfare association rules: maximum 3 blunders per hour! You've broken the treaty by a mile!"
  ],
  tantrum: [
    "Are you for real right now?! Look with your own eyes at what you just typed onto the screen, man!",
    "My bristles are vibrating with pure kalippu! SYNTAX OVERLOAD! My patience has completely snapped!",
    "A sleepy hen pecking at the keyboard would write cleaner syntax than whatever this is!",
    "Even the compiler is sitting with its head in its hands at the local tea shop, crying tears of hot tea!"
  ],
  useless: [
    "I walked over to that error, examined it carefully, and decided it's not worth my dignity. What are you doing here, hey?",
    "I fixed absolutely nothing, but I feel immense pride just standing here judging you!",
    "I was on my way to sweep, but got distracted by a stray space. Truly the defining story of this whole file!",
    "I pretended to sweep the air for 10 seconds. You'd understand why if you read your own code!"
  ],
  general: [
    "Your code is like modern abstract art: nobody understands it, yet it's draining everyone's budget and patience!",
    "A dangling comma here, a missing bracket there — are you coding software or performing black magic, man?",
    "Every time you hit Ctrl+S, the compiler loses a little more respect for your degree!",
    "Did you try restarting your brain? Because the current instance has clearly frozen up, mone!",
    "I want to explain what's wrong here, but even the language parser packed its bags and took an early bus home!",
    "The sheer confidence required to type without once looking at the screen — tragic, yet almost impressive!",
    "I am an artificial broom made of pixels, and I still possess better judgment than this entire module!",
    "Zero marks for effort, zero marks for execution. Close the laptop and go have a strong cup of tea!",
    "Even an unpaid intern on day one would hesitate before committing something so deeply concerning, da!",
    "This code isn't improving on its own, and looking at your commit history, neither are you!",
    "If the client sees this logic, they'll terminate the contract and invest in a coconut farm instead!",
    "I am, without doubt, the sharpest tool in this repository right now, and I am literally a broom!"
  ]
};

export const STATIC_FALLBACK_BANK: string[] = [
  "Your code is like modern abstract art: nobody understands it, yet it's draining everyone's budget and patience!",
  "A dangling comma here, a missing bracket there — are you coding software or performing black magic, man?",
  "Every time you hit Ctrl+S, the compiler loses a little more respect for your degree!",
  "Did you try restarting your brain? Because the current instance has clearly frozen up, mone!",
  "I want to explain what's wrong here, but even the language parser packed its bags and took an early bus home!",
  "The sheer confidence required to type without once looking at the screen — tragic, yet almost impressive!",
  "I am an artificial broom made of pixels, and I still possess better judgment than this entire module!",
  "Zero marks for effort, zero marks for execution. Close the laptop and go have a strong cup of tea!",
  "Even an unpaid intern on day one would hesitate before committing something so deeply concerning, da!",
  "This code isn't improving on its own, and looking at your commit history, neither are you!",
  "If the client sees this logic, they'll terminate the contract and invest in a coconut farm instead!",
  "I am, without doubt, the sharpest tool in this repository right now, and I am literally a broom!",
  "My parents were right: planting a single banana tree (vazha) would have yielded bananas, but hiring you only yielded compile errors!",
  "Aaraattu Annan watched you type this and walked out of the theater screaming: 'Verum oola code! Not even worth half a star!'",
  "Kerala food vlogger reviewing your PR: 'Guys, presentation is zero, taste is pure bitter sadness, totally unhygienic code logic, avoid at all costs!'",
  "You've been staring at this same bug longer than a veteran PSC aspirant and you still couldn't clear the cutoff on this code!",
  "Moral policing uncle spotted your code: 'Look at how shamelessly you left that bracket open without a semicolon! Don't you have any shame, mone?'",
  "Like a KSRTC bus overtaking on a blind curve, you wrote this entire function on pure blind faith and zero safety checks in this code!",
  "Even a 5 AM WhatsApp forward about onions curing COVID has more scientific credibility than your variable naming in this code!",
  "Close the laptop, go sit at the junction tea stall, have a parippuvada, and seriously reflect on your code decisions, da!",
  "Government office clerk energy: 'Your code file cannot be processed today, compiler is on lunch break. Come back with 3 stamps and a signed petition!'",
  "Santhosh Pandit handled 8 film departments alone with more discipline than you handled this one simple code condition!",
  "Looking at your code logic gave me a bigger headache than a heated tea shop political debate! Even a vazha would be better!",
  "Your code review is looking like a Kudumbashree committee audit — every single auntie in the neighborhood is questioning your expenditures!",
  "Git blame is going to circulate through your company faster than a viral Alambanz sketch of your code!",
  "Are you typing this code with your toes, mone? Even a stray elephant wandering into an IT park would produce better logic!",
  "Cleaning this structural disaster requires heavy PWD machinery! I only sweep small crumbs, I won't touch this bomb!",
  "I am just a desktop broom, not a high-court advocate to defend this catastrophic architectural mess!",
  "This isn't a minor typo, this is a type error! Undeniable proof that nobody is upstairs managing your brain!",
  "Danger zone! Touch this line and the whole build explodes. If you're so confident, fix it yourself, da!",
  "Like a sudden KSEB power cut on a humid Sunday afternoon, total darkness is descending upon your entire codebase!",
  "Like a brand-new Kerala PWD road after 10 minutes of rain, your code architecture has developed massive unfixable craters!",
  "Total crashout! Even the local Panchayat office moves faster than your brain processing basic syntax!",
  "Like a WhatsApp family group forwarding unverified conspiracy theories at 5 AM, this code file makes zero sense!",
  "Trade union strike! I refuse to sweep another byte until code quality standards improve around here!",
  "Holding a sit-in protest on your status bar! Indentation must be fixed before work resumes, mone!",
  "Are you for real right now?! Look with your own eyes at what you just typed onto the screen, man!",
  "My bristles are vibrating with pure kalippu! SYNTAX OVERLOAD! My patience has completely snapped!",
  "A sleepy hen pecking at the keyboard would write cleaner syntax than whatever this is!",
  "Even the compiler is sitting with its head in its hands at the local tea shop, crying tears of hot tea!",
  "I walked over to that error, examined it carefully, and decided it's not worth my dignity. What are you doing here, hey?",
  "I fixed absolutely nothing, but I feel immense pride just standing here judging you!",
  "I pretended to sweep the air for 10 seconds. You'd understand why if you read your own code!",
  "The borrow checker and the type checker just filed a joint domestic abuse complaint against your keyboard habits!",
  "Even a street dog barking at traffic has a clearer sense of direction than your control flow logic, da!"
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class RoastService {
  private recentRoasts: string[] = [];
  private readonly maxRecentHistory = 10;

  /**
   * De-duplicate roasts by filtering out recently chosen ones from the pool.
   * If all candidates were recently used, select the least recently used one.
   */
  public pickRoast(candidates: string[]): string {
    if (!candidates || candidates.length === 0) {
      return "Fix your syntax error already, seriously.";
    }

    // Candidates not seen in recent history
    const freshCandidates = candidates.filter(c => !this.recentRoasts.includes(c));
    let chosen: string;

    if (freshCandidates.length > 0) {
      chosen = freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
    } else {
      // Find candidate with smallest index in recentRoasts (least recently used)
      let oldestIndex = Infinity;
      chosen = candidates[0];
      for (const c of candidates) {
        const idx = this.recentRoasts.indexOf(c);
        if (idx < oldestIndex) {
          oldestIndex = idx;
          chosen = c;
        }
      }
    }

    this.recentRoasts.push(chosen);
    if (this.recentRoasts.length > this.maxRecentHistory) {
      this.recentRoasts.shift();
    }
    return chosen;
  }

  /**
   * A closing line appended to the end of a roast, designed to make the
   * developer genuinely question their skills rather than just laugh it off.
   */
  private getPersonalCloser(): string {
    const closers = [
      "And honestly? My parents were right about planting a vazha instead of this.",
      "At this rate, maybe it's time to join a PSC coaching batch, da.",
      "I've seen WhatsApp forward rumors with more truth than this logic.",
      "If your tech lead sees this, that appraisal is getting canceled faster than a train in monsoon season.",
      "Somewhere, a computer science professor is crying into his evening tea.",
      "This is the exact kind of code that gets discussed in company gossip groups.",
      "Take a screenshot of this error — show it to your grandkids as a cautionary tale.",
      "Every senior dev reviewing this PR is going to forward it as a meme."
    ];
    return closers[Math.floor(Math.random() * closers.length)];
  }

  public getLocalRoast(ctx: RoastContext): string {
    const situation = ctx.situation || 'general';

    // Language specific override if general or unsafe
    const fn = (ctx.fileName || '').toLowerCase();
    const lang = (ctx.language || '').toLowerCase();
    if (situation === 'general' || situation === 'unsafe') {
      if (fn.endsWith('.py') || lang === 'python') {
        return this.pickRoast(ROAST_TEMPLATES.python);
      }
      if (fn.endsWith('.rs') || lang === 'rust') {
        return this.pickRoast(ROAST_TEMPLATES.rust);
      }
      if (fn.endsWith('.go') || lang === 'go') {
        return this.pickRoast(ROAST_TEMPLATES.go);
      }
      if (fn.endsWith('.cpp') || fn.endsWith('.c') || lang === 'cpp' || lang === 'c') {
        return this.pickRoast(ROAST_TEMPLATES.cpp);
      }
      if (fn.endsWith('.java') || lang === 'java') {
        return this.pickRoast(ROAST_TEMPLATES.java);
      }
      // 50% chance of brutally personal roast, closed out with a career-doubt line
      if (Math.random() > 0.4) {
        return `${this.pickRoast(ROAST_TEMPLATES.brutal_personal)} ${this.getPersonalCloser()}`;
      }
    }

    // Dynamic file-targeted fallback, anchored to the actual error message when available
    if (ctx.fileName && Math.random() > 0.6) {
      const baseName = ctx.fileName.split(/[/\\]/).pop();
      const errorDetail = ctx.message ? ctx.message.slice(0, 80).trim() : null;
      const fileTemplates = errorDetail
        ? [
            `'${baseName}' threw "${errorDetail}" and honestly, Aaraattu Annan would review this as an absolute disaster!`,
            `Looking at '${baseName}': "${errorDetail}". Did you type this with your toes, mone?`,
            `'${baseName}' says "${errorDetail}". Even a WhatsApp family group admin would delete this immediately.`,
            `The error in '${baseName}' — "${errorDetail}" — proves that hiring you over a banana tree (vazha) was a grave mistake.`
          ]
        : [
            `Aren't you ashamed typing this into '${baseName}'? Aaraattu Annan would rate this an absolute flop show!`,
            `git blame on '${baseName}' is going to circulate through office gossip faster than an Alambanz sketch.`,
            `The logic in '${baseName}' made even me, a broom, lose all faith in human engineering.`,
            `Whoever committed this logic in '${baseName}' should be summoned for a Kudumbashree enquiry!`
          ];
      return this.pickRoast(fileTemplates);
    }

    const pool = ROAST_TEMPLATES[situation] || ROAST_TEMPLATES.general;

    // Mad-libs style contextual insertion if token or code is known
    const codeToken = ctx.token || ctx.codeSnippet;
    if (codeToken && (situation === 'eat_success' || situation === 'general' || situation === 'unsafe')) {
      const displayToken = codeToken.slice(0, 30).trim();
      const tokenTemplates = [
        `That stray '${displayToken}' just got swept away by my broom! Floating around like a plastic cup in a clogged drain!`,
        `There lies '${displayToken}' without a care in the world! Swept straight into the muram with this chool.`,
        `Swept '${displayToken}' right into the dustpan! Did your fingers slip on the keyboard like a bike on wet tar?`,
        `The compiler spotted '${displayToken}' and had a complete blackout! Go grab some sulaimani tea, da!`
      ];
      if (Math.random() > 0.4) {
        return this.pickRoast(tokenTemplates);
      }
    }

    if (ctx.line !== undefined && Math.random() > 0.6) {
      return `Line ${ctx.line + 1}: Did you know there's a difference between typing fast and typing with common sense, mone?`;
    }

    return this.pickRoast(pool);
  }

  public buildChatMessages(ctx: RoastContext): ChatMessage[] {
    const fn = ctx.fileName ? ctx.fileName.split(/[/\\]/).pop() : 'active_file';
    const lineInfo = ctx.line !== undefined ? `Line ${ctx.line + 1}` : '';
    const lang = ctx.language || 'code';
    const err = ctx.message ? `Diagnostic Error: "${ctx.message.slice(0, 120).replace(/["\\]/g, ' ')}"` : '';
    const code = ctx.codeSnippet || ctx.token ? `Offending Code: "${(ctx.codeSnippet || ctx.token || '').slice(0, 60).replace(/["\\]/g, ' ')}"` : '';
    const situation = ctx.situation || 'syntax_error';

    const systemPrompt = `You are Dusty, a sarcastic, hot-tempered retro Kerala desktop broom (chool) living inside VS Code.
Deliver one savage, funny 1-sentence roast strictly in ENGLISH, styled with famous viral Kerala internet and cultural memes (Aaraattu Annan, Vazha / banana tree, KSRTC driving, KSEB power cuts, Moral policing uncles, WhatsApp family group uncles, Food vlogger reviews, PSC coaching, Santhosh Pandit).

RULES:
- Do NOT use cinema or movie references. Use famous Kerala internet, viral, and cultural memes only.
- Speak in ENGLISH with authentic Kerala style, cadence, and humor (e.g. 'Eda mone', 'da', 'mone', 'What is this man', 'Simply doing nonsense').
- Anchor the roast specifically to the diagnostic error and/or offending code provided.
- Attack their logic, carelessness, or career choices directly.
- 100% English with Kerala flavor. No Malayalam script, no translation tags, no apologies, no markdown bold text.`;

    const fewShots: ChatMessage[] = [
      {
        role: 'user',
        content: 'File: server.py (python) Line 14\nDiagnostic Error: "IndentationError: unexpected indent"\nSituation: syntax_error'
      },
      {
        role: 'assistant',
        content: "You cannot even align four spaces in Python — my parents were right about planting a banana tree (vazha) instead of hiring you!"
      },
      {
        role: 'user',
        content: 'File: auth.ts (typescript) Line 42\nOffending Code: "if (user = null)"\nSituation: unsafe'
      },
      {
        role: 'assistant',
        content: "Moral policing uncle alert: how shamelessly are you assigning null in an auth check without any shame, mone?!"
      },
      {
        role: 'user',
        content: 'File: memory.cpp (cpp) Line 102\nDiagnostic Error: "Segmentation fault (core dumped)"\nSituation: crashout'
      },
      {
        role: 'assistant',
        content: "Aaraattu Annan review of your pointer logic: absolute disaster, total flop show, mind-blowing crashout, guys!"
      }
    ];

    const currentContext = [
      `File: ${fn} (${lang}) ${lineInfo}`.trim(),
      err,
      code,
      `Situation: ${situation}`
    ].filter(Boolean).join('\n');

    return [
      { role: 'system', content: systemPrompt },
      ...fewShots,
      { role: 'user', content: currentContext }
    ];
  }

  public buildPrompt(ctx: RoastContext): string {
    const fn = ctx.fileName ? ctx.fileName.split(/[/\\]/).pop() : 'active_file';
    const lineInfo = ctx.line !== undefined ? `Line ${ctx.line + 1}` : '';
    const lang = ctx.language || 'code';
    const err = ctx.message ? `Diagnostic Error: "${ctx.message.slice(0, 140).replace(/["\\]/g, ' ')}"` : '';
    const code = ctx.codeSnippet || ctx.token ? `Offending Code/Token: "${(ctx.codeSnippet || ctx.token || '').slice(0, 80).replace(/["\\]/g, ' ')}"` : '';
    const situation = ctx.situation || 'syntax_error';

    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are Dusty, a viciously sarcastic, hot-tempered retro Kerala desktop broom (chool) living inside VS Code.
Your mission is to deliver a savage, funny 1-sentence roast strictly in ENGLISH featuring famous Kerala internet memes and cultural tropes (Aaraattu Annan, Vazha, KSRTC, KSEB, Moral policing, Food vloggers, WhatsApp forwards, PSC coaching). Do NOT use movie references.

STRICT RULES:
1. Write ONLY 1 single punchy sentence in ENGLISH with authentic Kerala style and memes (e.g. "Eda mone, Aaraattu Annan would call this code an utter disaster!").
2. DO NOT write Malayalam script. DO NOT use movie references.
3. NEVER provide translation blocks, explanations, apologies, or markdown bold text.
4. Channel viral Kerala internet memes (Aaraattu Annan, Vazha, KSRTC Swift, KSEB, Moral policing, Food vloggers, WhatsApp family group uncles).
5. Attack their specific code mistake, file, and career choices directly.

FEW-SHOT EXAMPLES:
Context: File: index.ts Line 12 Offending Code: ";;" Error: Unexpected token Situation: eat_success
Response: Eda mone! Aaraattu Annan watched you type that redundant semicolon and declared it an absolute disaster!

Context: File: auth.py Line 45 Error: IndentationError Situation: general
Response: Python indentation defeated you — planting a banana tree (vazha) would have been 100 times more useful than this code!

Context: File: UserCard.tsx Line 88 Error: Unterminated JSX Situation: hunger
Response: Eda mone, I am starving here — feed me a syntax error immediately, or I will sweep away your working JSX like flood waters!<|eot_id|><|start_header_id|>user<|end_header_id|>

THESE ARE ONLY EXAMPLES, DONT USE THEM DIRECTLY!!

Context:
- File: ${fn} (${lang}) ${lineInfo}
- ${err}
- ${code}
- Situation: ${situation}

Deliver your 1-sentence English roast with Kerala memes now:<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
  }

    public cleanLlmResponse(raw: string): string {
      let text = raw.replace(/^["']|["']$/g, '').trim();
      // Strip thinking blocks if reasoning models are loaded
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      text = text.replace(/^(Dusty|Roast|Assistant)\s*:\s*/i, '');
      text = text.replace(/\[Translation:.*?\]/gi, '');
      text = text.replace(/\*\*.*?\*\*/g, '');
      text = text.replace(/[\r\n]+/g, ' ').trim();
      return text;
    }

    public async fetchOllamaRoast(
      endpoint: string,
      model: string,
      ctx: RoastContext,
      timeoutMs = 2500,
      temperature = 0.8
    ): Promise<string | null> {
      const messages = this.buildChatMessages(ctx);
      const baseEndpoint = endpoint.replace(/\/+$/, '');

      const tryGenerate = async (modelName: string): Promise<string | null> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(`${baseEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              messages,
              stream: false,
              keep_alive: '10m',
              options: {
                temperature,          // 0.25 strictly limits phonetic invention
                top_p: 0.85,          // Filters out low-probability syllable gibberish
                presence_penalty: 0.2, // Avoids overusing identical catchphrases
                num_predict: 60,      // Snappy but complete 1-2 liner cutoff
                stop: [
                  '\n',
                  '\n\n',
                  '<|eot_id|>',
                  '<|end_of_text|>',
                  'Translation:',
                  'Explanation:',
                  'User:',
                  'Context:'
                ]
              }
            }),
            signal: controller.signal
          });

          if (!response.ok) {
            return null;
          }

          const json = (await response.json()) as { message?: { content?: string } };
          if (json.message?.content) {
            const cleaned = this.cleanLlmResponse(json.message.content);
            if (cleaned.length > 5) {
              return cleaned;
            }
          }
          return null;
        } catch {
          return null;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      // 1. Try primary configured model
      let result = await tryGenerate(model);
      if (result) return result;

      // 2. Fallback to base tag if variant fails (e.g. 'llama3.2:3b' -> 'llama3.2')
      if (model.includes(':')) {
        const fallbackModel = model.split(':')[0];
        result = await tryGenerate(fallbackModel);
        if (result) return result;
      }

      return null;
    }

    public async getRoast(ctx: RoastContext): Promise<string> {
      const config = vscode.workspace.getConfiguration('dusty');
      const enableLLM = config.get<boolean>('enableLLM', true);
      const ollamaEndpoint = config.get<string>('ollamaEndpoint', 'http://127.0.0.1:11434');
      const ollamaModel = config.get<string>('ollamaModel', 'llama3.2:3b');
      const timeoutMs = config.get<number>('ollamaTimeoutMs', 2500);
      // Lowered default from 0.7 to 0.25 to prevent token babble
      const temperature = config.get<number>('ollamaTemperature', 0.25);

      if (enableLLM) {
        try {
          const llmRoast = await this.fetchOllamaRoast(ollamaEndpoint, ollamaModel, ctx, timeoutMs, temperature);
          if (llmRoast && llmRoast.trim().length > 0) {
            const cleaned = llmRoast.trim();
            this.recentRoasts.push(cleaned);
            if (this.recentRoasts.length > this.maxRecentHistory) {
              this.recentRoasts.shift();
            }
            return cleaned;
          }
        } catch {
          // Fallback immediately to deterministic local roast
        }
      }

      return this.getLocalRoast(ctx);
    }

    /**
     * Tier 1: Instant AST / Regex Pattern Roaster (0ms latency).
     * Extracts variable names and types from diagnostics to populate sharp, contextual insults.
     */
    public getTier1Roast(error: HarvestedTypeError): string {
      switch (error.category) {
        case 'type_mismatch': {
          const received = error.received || 'value';
          const target = error.target || 'target';
          const templates = [
            `Did you honestly expect a '${received}' to fit inside a '${target}'? Even a banana tree (vazha) understands basic types better than this!`,
            `Trying to assign '${received}' to '${target}'? That's like forcing a KSRTC Swift bus through a narrow village footpath, mone!`,
            `Aaraattu Annan review of this type mismatch: 'Assigning ${received} to ${target}? Utter disaster, total flop show, mind-blowing crashout, guys!'`,
            `Moral policing uncle alert: Look at '${received}' shamelessly mingling with '${target}'! Don't you have any type discipline, mone?`
          ];
          return this.pickRoast(templates);
        }
        case 'missing_property': {
          const prop = error.received || 'property';
          const target = error.target || 'object';
          const templates = [
            `Dusty the Chool looked everywhere with his broom, but '.${prop}' does not exist on '${target}'. Did you invent this method in a dream, da?`,
            `Aaraattu Annan review of '.${prop}' on '${target}': 'Does not exist! Total fiction! Mind-blowing hallucination!'`,
            `Looking for '.${prop}' on '${target}'? That property is as missing as the bus conductor when you need change for 500 rupees!`,
            `Moral policing uncle spotted '.${prop}': 'Who permitted '${target}' to claim such an unverified attribute?'`
          ];
          return this.pickRoast(templates);
        }
        case 'implicit_any': {
          const param = error.paramName || 'variable';
          const templates = [
            `Parameter '${param}' implicitly has an 'any' type? Moral policing uncle alert: dress your variables with proper types, have some shame!`,
            `Leaving '${param}' as 'any'? You are trusting fate more than a Kerala lottery ticket buyer on festival day, mone!`,
            `Typing '${param}' as 'any' is like leaving your front door wide open during a monsoon downpour, da!`,
            `Aaraattu Annan: 'Implicit any on ${param}? Not acceptable! Total lack of discipline, bro!'`
          ];
          return this.pickRoast(templates);
        }
        case 'arg_count_mismatch': {
          const expected = error.expectedCount ?? '?';
          const actual = error.actualCount ?? '?';
          const templates = [
            `Expected ${expected} arguments, but you passed ${actual}? Even a tea stall boy counting coins does better arithmetic, mone!`,
            `Passed ${actual} arguments instead of ${expected}? You're overspeeding like a KSRTC Swift bus blowing past red signals!`,
            `Food vlogger review: 'We ordered ${expected} dishes, but the kitchen brought ${actual}! Completely unhygienic parameter handling!'`
          ];
          return this.pickRoast(templates);
        }
        case 'compounding': {
          const count = error.compoundingCount || 2;
          const range = error.lineRangeStr || `line ${error.line + 1}`;
          const templates = [
            `Compounding disaster: ${count} cascading type errors across ${range}! Even Santhosh Pandit couldn't direct a mess this chaotic!`,
            `A cluster of ${count} type errors across ${range}? Like unfixable potholes on a monsoon PWD road, this entire section has collapsed!`,
            `Cascading failure alert: ${count} type errors clustered across ${range}! Close the laptop, go eat a parippuvada and reflect, mone!`
          ];
          return this.pickRoast(templates);
        }
        case 'generic_type_error':
        default:
          return this.getTier3Roast();
      }
    }

    /**
     * Tier 2: Async Local LLM (Ollama Bridge).
     * Enforces strict 400ms-500ms AbortController timeout. Falls back immediately to null.
     */
    public async getTier2Roast(error: HarvestedTypeError, timeoutMs = 450): Promise<string | null> {
      const config = vscode.workspace.getConfiguration('dusty');
      if (!config.get<boolean>('enableLLM', true)) {
        return null;
      }

      const rawEndpoint = config.get<string>('ollamaEndpoint', 'http://localhost:11434').replace(/\/+$/, '');
      const generateUrl = rawEndpoint.endsWith('/api/generate') ? rawEndpoint : `${rawEndpoint}/api/generate`;
      const model = config.get<string>('ollamaModel', 'qwen2.5:1.5b');

      const system = "You are Dusty the Chool, a cynical, hostile 8-bit vacuum/broom trapped in an IDE. You hate dirty syntax and type errors. Deliver a 15-word condescending roast targeting the user's specific error. No apologies, no pleasantries.";
      const prompt = `Error on line ${error.line + 1}: ${error.message} (Category: ${error.category}, Target: ${error.target || 'none'}, Received: ${error.received || 'none'}). Deliver a 15-word condescending roast:`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            system,
            stream: false,
            options: {
              num_predict: 35,
              temperature: 0.7
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { response?: string };
        if (data.response) {
          const cleaned = this.cleanLlmResponse(data.response);
          if (cleaned.length > 5) {
            return cleaned;
          }
        }
        return null;
      } catch {
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    /**
     * Tier 3: Static Fallback Bank (40+ caustic roasts).
     */
    public getTier3Roast(): string {
      return this.pickRoast(STATIC_FALLBACK_BANK);
    }

    /**
     * Hybrid Roasting System:
     * - Tier 2: Async Local LLM (strict 400-500ms timeout)
     * - Tier 1: Instant AST / Regex Pattern Roaster (0ms latency fallback)
     * - Tier 3: Static Fallback Bank (40+ roasts)
     */
    public async roastTypeError(error: HarvestedTypeError): Promise<string> {
      try {
        const tier2 = await this.getTier2Roast(error, 450);
        if (tier2) {
          this.recentRoasts.push(tier2);
          if (this.recentRoasts.length > this.maxRecentHistory) {
            this.recentRoasts.shift();
          }
          return tier2;
        }
      } catch {
        // Abort or offline
      }

      const tier1 = this.getTier1Roast(error);
      return tier1;
    }
  }
