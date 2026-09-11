import * as vscode from 'vscode';
import { DustyConfidence } from './types';

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
    '💥 Eda mone... Rangannan paranja pole: "Ini oru compromise-um illa!" Ninte vrithiketta code thinnu thinnu choolinte eerkili vare odinju! DELETING RANDOM CODE OUT OF REVENGE!',
    '🔥 Pavanayi shavamaayi... ninte function shavamaayi! Kalippu 100%! Choolum compilero-um orumichu panimudakki! File-ile code njan chool eduthu thalachoottil adichu parathuva!',
    '🌪️ Manichitrathazh-ile Nagavalli alanjadiya pole kalippu moothu! CODEBASE PURGE ACTIVATED! Ninte functions motham choolukond thoothu kalanju!',
    '💀 Kindi vecha logic kandu ente samashani thetti! Njan choolalla, ini Yamadharman aanu! Ee koothara code njan random aayi delete cheyyunnu!',
    '💥 Aavesham mode ON! Eda mone, ninakku vattaano ithu type cheyyan? Random deletion activated, ippo thanne file kathikkum!'
  ],
  brutal_personal: [
    'Are you coding with your feet? Kaalukondano ee code type cheyyunne? Engil athoru excuse enkilum aakkaamaayirunnu. Ithenthu durantham manushya!',
    'Verumoru virtual chool aaya enikku polum ninte code kandu thalayil mundittu nadakkenda gathikedayi! Git blame nokki veettukaar polum ninne thallipparayum!',
    'Laptop adachu vechu purathu poyi oru marathodu "Sorry" para... Nee ingane jeevichu ee koothara code adichu oxygen waste cheyyunnathinu!',
    '-47 vote kitti kashamitta StackOverflow answer copy adichathano? CID Moosa-yile Moolamkuzhiyil Sahadevan polum ithilum nalla logic undakkum!',
    'Sandesham cinemayile Shankaradi chodicha pole chodikuva: "Thanikku vere paniyille hey?" Ithilum bhedam valla thattukadayo lottery kachavadamo thudangunathaayirunnu!',
    'Ninte coding kandu chool eduthu swantham mughathu adikkaan thonnunnu! Naaleyenkilum resignation koduthu valla kappayo vazhayo vekkeda!',
    'Ee code production-il poyaal server alla, ninte career-um company-um onnake kathiyamarum! Close cheythu podey!',
    'Sachin bro... immathiri code kandal Reenu poyittu ninte company-ile security polum ninne mind cheyyilla!',
    'Shammi hero aada hero... pakshe ninte code verum zero! Tholviyude poorna roopamaanu thaan!'
  ],
  python: [
    'Python-il randu karyame ullu: maryadakku indent cheyyuka, thenditharam ezhuthathirikkuka. Nee randum kulamakki!',
    'Urakkathil 30 second TikTok tutorial kandittaano Python padikkan irangiyathu? Poyi valla pappadavum kaacheda!',
    'IndentationError: Ninte thalachoril oru alignment-um illa, pinneyalle Python code! Chool eduthu thallanam ninne!',
    'Python syntax kandu Guido van Rossum swantham kayyile coffee cup eduthu thalayil ozhikkum!'
  ],
  rust: [
    'Rust-inte borrow checker ninte code mathramalla, ninte jeevitham thanne reject cheythu!',
    'Oru unsafe block-num ninte ee kolapathaka code-il ninnu compilere rakshikkan pattilla! Rust kandu karayunnu!',
    'Panic at the syntax level: Kurachenkilum chinthikkathe code adichaal Rust alla, daivam thampurante achan vannaalum rekshayilla!'
  ],
  go: [
    '`if err != nil`? Go-yil ivideyulla ore oru error ninakku repo-yil write access thanna manager aanu!',
    'Go undakkiyathu junior developers system pottikkathe irikkanaanu. Ennittum nee ithenthu koothara code aaneda ezhuthiye!',
    'GOPATH enne deprecated aayi, ingane code adichaal software rangathu ninte bhaviyum udan deprecated aakum!'
  ],
  cpp: [
    'Ninte ee pointer kali kandal OS kernel panic aayi karayum. CID Moosa-yile vedi poleyaanu ninte Memory leak!',
    'Segmentation fault (core dumped): Ninte logic pandaramadangi! Poyi valla kappeem chakkem thinnedaa!',
    'C++ ezhuthaan ariyillengil poyi thuni alakkeda! Ee Pointer vechu nee aarude thalayottiyaanu pottikkaan nokkunne?'
  ],
  java: [
    'AbstractSingletonProxyFactoryBean kondu vannaalum ee durantham encapsulate cheyyan pattilla! Java kandu James Gosling karayunnundaavum!',
    'NullPointerException: Ninte thalachorinekkal shoonnyathayaanu ninte variables-il!',
    'Enterprise grade alla, ithu LKG level tholviyaanu! Poyi valla tuition-um poda!'
  ],
  eat_success: [
    'Choolukond adichuvaari! Dustpan-ilekku poya thettu kandu ninte project manager polum aashwasikkum!',
    'Swaha! Aa pottiya syntax njan chool eduthu murathil aakki!',
    'Thoothu-vaari kalanju! Ninte PR reject aavaathe njan rekshichathaa... nandi parayeda!',
    'Eda mone... nee thettukal adikkunna speed-il thoothuvaaraan enikku pathu choolu vaangendi varum!',
    'Dasa... oru thettu koodi Pavanayiye pole shavamaayi!',
    'Jimson-odu Mahesh paranja pole: Chambikko! Chool eduthu njan angottu chambi!'
  ],
  eat_aborted: [
    'Maryadhayillatha swabhaavam! Njan choolukond vaaran varumbolzhekkum file maattunno?',
    'Oodi rekshapedaam ennu karuthenda! Ninte pottiya code choolinu erinju thannittu poda pedithonda!',
    'Murathil kayaraan poya syntax-ine thattiyedukkunno? Enthu thendi kaanippaanithu!',
    'Bhayanju oodi olikkaan nokkenda! Ninte chavaru code njan evideyano avide vannu chool eduthu thoothuvaariyirikkum!'
  ],
  typed_while_cleaning: [
    'Eda! Njan choolukond CLEAN cheyyumpol KEYBOARD-il thodunnoda? Aa TYPE cheythathum njan choolukond NOM NOM thinnu theerthu!',
    'Maryadakku KEYBOARD-il ninnu kayyedukkada! Njan choolu vechu CLEAN aakkumbol TYPE cheythal baaki code-um koodi thoothuvaari kalayum! NOM!',
    'VACUUM poyi choolu vannalum nee padikkillalle? CLEAN cheyyumpol veendum TYPE cheyyunnu! NOM NOM kalanju!',
    'Ente choolinte munnil vannu KEYBOARD thattunno? Aa adicha aksharam njan thinnu theerthu! NOM!',
    'Thodaruthu KEYBOARD-il! Adichuvaarumpol veendum TYPE cheythal file motham njan adichumaattum! NOM!'
  ],
  apocalypse: [
    '🚨 ATHYAHITHAM: SYNTAX PRALAYAM! SARVANAASHAM VITHACHU CODE THAKARUNNU! 🚨',
    '💥 AYYOO... CODE POTTITHERICHU! CHOOLINUM THAANGAN PATTATHA MAHADURANTHAM! 💥',
    'Siren muzhakku! Naadu vitto! Codebase ini nere paathaalathilekku!',
    'Deivame... ivante kayyil keyboard kodutha aa maha paapiye chool eduthu thallanam!'
  ],
  clogged: [
    'Chardhikkaan varunnu! 5 thettukal vaari vaari muram niranju thulumbi!',
    'Muram niranju! Vegam muram ozhikku (UNCLOG), allenkil ee chavaru motham ninte thalayil thattum!',
    'Pottiya semicolons-um ninte thakarnna swapnangalum kond muram niranju! Unclog cheyyeda!',
    'Choolu kuzhanju veenu... ithrayum valiya waste code ithinumnpu thoothittilla!'
  ],
  unsafe: [
    'Ithrayum valiya kuttichoolu polum ee van durantham vaaraan thikayilla! Njan crumbs mathrame vaaru, ninte architectural kolapathakam alla!',
    'Njan verum oru chool aanu, allathe ninte pottiya logic thiruthanaayi vanna senior architect alla!',
    'Ithu syntax thettalla, type error aanu! Ninte jeevitham pole aake confused aaya error!',
    'Apadakara mekhala! Ithil thottaal file kathiyamarum! Dhairyamundenkil manually vaariyedukku!'
  ],
  hunger_strike: [
    'Njan panimudakkilaanu! Ee vrithiketta code vaaraan enne kittilla! Nokku... onnangottu nokku!',
    'Samaram! Maryadakku indentation thannale njan ini chool thodullu!',
    'Oru linter enthaanennu nee padikkunnathu vare njan ivide niraahaaram kidakkum!',
    'Union contract prakaaram manikkooril 3 thette vaaraan paadullu. Nee noorennam adichu contract langhichu!'
  ],
  tantrum: [
    'Sshedaa! Ithenthu saadhanaam?! Kannu thurannu vechu type cheyyada manushya!',
    'Ente eerkili viraykkunnu! SYNTAX OVERLOAD! Sahikkaan pattunnilla!',
    'Mechanical keyboard-il poocha moothramozhichaal polum ithilum nalla output varum!',
    'Compiler bathroom-il poyi karayunnu, koode njanum!'
  ],
  useless: [
    'Njan aa line-inte aduthu vare poyi, sookshichu nokki, onnum cheyyaathe thirichu ponnu. Enganeyund?',
    'Njan onnum shariyaakiyilla, engilum enikku bhayangara abhimanam thonnunnu!',
    'Aa thettu vaaraan poyatha, pakshe veruthe kidanna oru whitespace kandu ente shradha poyi.',
    'Veruthe thirakku abhinayichu choolukond kaattil adikkukayaanu... ninakku manassilaakumaayirikkum!'
  ],
  general: [
    'Ninte code modern art poleyaanu: aarkkum onnum manassilaavilla, kondu nadakkanaano bhayangara chilavum!',
    'Oru semicolon ivide, oru bracket avide... Romancham cinemayile pole prethathe vilichu varuthukayaano?',
    'Oro thavana save cheyyumpolum compiler nenjathadichu nilavilikkunnu!',
    'Thalachoru onnu off cheythittu on cheythu nokkiyaalo? Valla maattavum undaavumo ennu nokkaam.',
    'Enthaanu thettiyathennu paranju tharaan aagrahathund, pakshe parser polum bodhamkettu veenu!',
    'Monitor-ilekku nokkaathe code adikkunna ninte aa oru dhairyam... sammathikkanam!',
    'Njan verum oru chool aanu, ennittum ninnekkaal ethrayo bhedhamaanu ente budhi ennu thonnunnu!',
    'Shammi hero aada hero... pakshe ninte code verum zero! Close cheythu podey!',
    'Sachin bro... immathiri code kandal company-ile attender polum mind cheyyilla!',
    'Franky paranja pole: "Ee kudumbam nannaavan ponilla", ninte ee project-um!',
    'Vijaya... nammude kanjiyil paatta veenu! Ee code kandaal client flight eduthu naadu vidum!'
  ]
};

export class RoastService {
  public async getRoast(ctx: RoastContext): Promise<string> {
    const config = vscode.workspace.getConfiguration('dusty');
    const enableLLM = config.get<boolean>('enableLLM', true);
    const ollamaEndpoint = config.get<string>('ollamaEndpoint', 'http://127.0.0.1:11434');
    const ollamaModel = config.get<string>('ollamaModel', 'llama3.2:3b');
    const timeoutMs = config.get<number>('ollamaTimeoutMs', 2500);
    const temperature = config.get<number>('ollamaTemperature', 0.85);

    // If LLM is enabled, try local Ollama 3B model first
    if (enableLLM) {
      try {
        const llmRoast = await this.fetchOllamaRoast(ollamaEndpoint, ollamaModel, ctx, timeoutMs, temperature);
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

    // Dynamic file-targeted fallback
    if (ctx.fileName && Math.random() > 0.6) {
      const baseName = ctx.fileName.split(/[/\\]/).pop();
      const fileTemplates = [
        `'${baseName}'-il ithu type cheyyan ninakku naanamille? Sandesham Shankaradi chodicha pole: Thanikku vere paniyille hey?`,
        `'${baseName}' kandu git blame polum thala thazhthi karayunnu! Close cheythu podey!`,
        `Eda mone! '${baseName}'-ile logic kandu Rangannan vare njetti tharichu poyi!`,
        `'${baseName}' ezhuthiya aale kandu pidikkan CID Moosa-yude Sahadevan varanam!`
      ];
      return fileTemplates[Math.floor(Math.random() * fileTemplates.length)];
    }

    const pool = ROAST_TEMPLATES[situation] || ROAST_TEMPLATES.general;

    // Mad-libs style contextual insertion if token or code is known
    const codeToken = ctx.token || ctx.codeSnippet;
    if (codeToken && (situation === 'eat_success' || situation === 'general' || situation === 'unsafe')) {
      const displayToken = codeToken.slice(0, 30).trim();
      const tokenTemplates = [
        `Vazhithetti vanna '${displayToken}' njan choolukond adichuvaari! Evidunnu varunnu immathiri sadhanangal?`,
        `Dha kidakkunnu '${displayToken}' alanjuthiriyunnu! Njan choolukond murathil aakki kalanju.`,
        `'${displayToken}' choolukond thoothuvaari! Keyboard-il viral kudungippoyathaano?`,
        `'${displayToken}' kandu compiler bodhamkettu veenu! Poyi valla chayakadayum thudanguda!`
      ];
      if (Math.random() > 0.4) {
        return tokenTemplates[Math.floor(Math.random() * tokenTemplates.length)];
      }
    }

    if (ctx.line !== undefined && Math.random() > 0.6) {
      return `Line ${ctx.line + 1}: Vegathil type cheyyunnathum vallathum arinju type cheyyunnathum randaanennu manassilaayo?`;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  public buildPrompt(ctx: RoastContext): string {
    const fn = ctx.fileName ? ctx.fileName.split(/[/\\]/).pop() : 'active_file';
    const lineInfo = ctx.line !== undefined ? `Line ${ctx.line + 1}` : '';
    const lang = ctx.language || 'code';
    const err = ctx.message ? `Diagnostic Error: "${ctx.message.slice(0, 140).replace(/["\\]/g, ' ')}"` : '';
    const code = ctx.codeSnippet || ctx.token ? `Offending Code/Token: "${(ctx.codeSnippet || ctx.token || '').slice(0, 80).replace(/["\\]/g, ' ')}"` : '';
    const situation = ctx.situation || 'syntax_error';

    return `You are Dusty, a viciously sarcastic, bad-tempered retro desktop broom living inside the user's VS Code editor.
Write a brutal, funny 1 to 2 sentence roast in MANGLISH (Malayalam language written entirely using the English alphabet).
Directly target the developer for their coding error, sloppy logic, and life/career choices so they feel personally attacked and laugh.

Context:
- File: ${fn} (${lang}) ${lineInfo}
- ${err}
- ${code}
- Situation: ${situation}

Strict Instructions:
1. Write ONLY in MANGLISH (Malayalam written with English letters like "Eda mone, line 42-il ithu type cheyyan ninakku naanamille?").
2. DO NOT use Malayalam script (മലയാളം). DO NOT write pure English.
3. Integrate trending Malayalam pop-culture movie memes (e.g. Aavesham "Eda mone!", Sandesham "Thanikku vere paniyille?", CID Moosa, Shammi in Kumbalangi Nights, Manichitrathazhu, Lucifer, Premalu).
4. Attack their coding competence and career decisions based directly on the file, line, and code provided above.
5. Max 35 words. Output ONLY the Manglish dialogue. No English translations, no quotation marks, no preamble.`;
  }

  public cleanLlmResponse(raw: string): string {
    let text = raw.replace(/^["']|["']$/g, '').trim();
    text = text.replace(/^(Dusty|Roast|Manglish|Chool)\s*:\s*/i, '');
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
    temperature = 0.85
  ): Promise<string | null> {
    const prompt = this.buildPrompt(ctx);
    const baseEndpoint = endpoint.replace(/\/+$/, '');

    const tryGenerate = async (modelName: string): Promise<string | null> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${baseEndpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt,
            stream: false,
            options: {
              temperature,
              num_predict: 60,
              stop: ['\n\n', 'Translation:', 'English:', 'Explanation:']
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          return null;
        }

        const json = (await response.json()) as { response?: string };
        if (json.response) {
          const cleaned = this.cleanLlmResponse(json.response);
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

    // 1. Try primary configured model (e.g. llama3.2:3b)
    let result = await tryGenerate(model);
    if (result) {
      return result;
    }

    // 2. If model had tag like ':3b', try base model tag 'llama3.2'
    if (model.includes(':')) {
      const fallbackModel = model.split(':')[0];
      result = await tryGenerate(fallbackModel);
      if (result) {
        return result;
      }
    }

    return null;
  }
}
