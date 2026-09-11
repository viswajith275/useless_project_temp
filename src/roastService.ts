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
    '💥 എടാ മോനേ... രംഗണ്ണൻ പറഞ്ഞ പോലെ "ഇനി ഒരു ഒത്തുതീർപ്പുമില്ല!" നിന്റെ വൃത്തികെട്ട കോഡ് തിന്ന് തിന്ന് എന്റെ ചൂലിന്റെ ഈർക്കിലി വരെ ഒടിഞ്ഞു! DELETING RANDOM CODE OUT OF REVENGE!',
    '🔥 പവനായി ശവമായി! കലിപ്പ് 100%! ചൂലും കംപൈലറും ഒരുമിച്ച് പണിമുടക്കി! ഫയലിലെ കോഡ് ഞാൻ ചൂലെടുത്ത് അടിച്ചു പരത്തുന്നു... പോയി വേറെ വല്ല പണിയും നോക്കെടാ!',
    '🌪️ മണിച്ചിത്രത്താഴിലെ നാഗവല്ലി ഇളകിയ പോലെ കലിപ്പ് മൂത്തു! CODEBASE PURGE ACTIVATED! നിന്റെ ഫംഗ്ഷനുകൾ മൊത്തം ഞാൻ ചൂലുകൊണ്ട് തൂത്തെറിഞ്ഞു!',
    '💀 കിണ്ടി വെച്ച ലോജിക് കണ്ട് എന്റെ സമനില തെറ്റി! ഞാൻ വെറുമൊരു ചൂലല്ല, ഇനി യമധർമ്മനാണ്! ഇതാ നിന്റെ കോഡ് റാൻഡമായി ഡിലീറ്റ് ചെയ്യുന്നു!'
  ],
  brutal_personal: [
    'Are you coding with your feet? കാലുകൊണ്ട് ടൈപ്പ് ചെയ്യുവാണോ? എങ്കിൽ അതൊരു ന്യായീകരണമെങ്കിലും ആക്കാമായിരുന്നു. ഇതെന്ത് ദുരന്തമാണ് മനുഷ്യാ?',
    'വെറുമൊരു വെർച്വൽ ചൂലായ എനിക്ക് പോലും നിന്റെ കോഡ് കണ്ട് തലയിൽ മുണ്ടിട്ട് നടക്കേണ്ട അവസ്ഥയായി! Git blame നോക്കി വീട്ടുകാർ പോലും നിന്നെ തള്ളിപ്പറയും.',
    'ലാപ്‌ടോപ്പ് അടച്ചു വെച്ച് പുറത്തുപോയി വല്ല മരത്തോടും മാപ്പ് പറ... നീ ശ്വസിക്കുന്ന ഓക്സിജന് യാതൊരു വിലയുമില്ലാതെ ഈ കോഡ് അടിച്ചതിന്!',
    '-47 വോട്ട് കിട്ടിയ വല്ല StackOverflow ഉത്തരവും കോപ്പി അടിച്ചതാണോ? സി.ഐ.ഡി മൂസയിലെ അർജുനൻ പോലും ഇതിലും നല്ല കോഡെഴുതും!',
    'സന്ദേശം സിനിമയിലെ ശങ്കരാടി ചോദിച്ച പോലെ ചോദിക്കുവാ: "തനിക്ക് വേറെ പണിയില്ലേ ഹേ?" ഇതിലും ഭേദം വല്ല തട്ടുകടയും തുടങ്ങുന്നതായിരുന്നു!',
    'നിന്റെ കോഡിങ് കണ്ട് എനിക്ക് ചൂലെടുത്ത് സ്വന്തം മുഖത്തടിക്കാൻ തോന്നുന്നു. നാളെയെങ്കിലും ജോലി രാജി വെച്ച് വേറെ വല്ല പണിക്കും പോ!',
    'ഈ കോഡ് production-ൽ പോയാൽ AWS ബിൽ അല്ല, നിന്റെ കരിയറും കമ്പനിയും ഒന്നാകെ കത്തിയമരും! ക്ലോസ് ചെയ്തു പോടാ മോനേ!'
  ],
  python: [
    'Python-ൽ രണ്ട് കാര്യമേ ഉള്ളൂ: മര്യാദക്ക് indent ചെയ്യുക, തോന്നിവാസം എഴുതാതിരിക്കുക. നീ രണ്ടും കുളമാക്കി!',
    'ഉറക്കത്തിൽ 30 സെക്കൻഡ് TikTok ട്യൂട്ടോറിയൽ കണ്ടിട്ടാണോ Python പഠിക്കാൻ ഇറങ്ങിയത്? പോയി വല്ല പപ്പടവും കാച്ചെടാ!',
    'IndentationError: നിന്റെ തലച്ചോറിലെ ചിന്തകൾക്ക് ഒരു അലൈൻമെന്റുമില്ല, പിന്നെയല്ലേ Python കോഡ്! ചൂലെടുത്ത് തല്ലണം നിന്നെ!'
  ],
  rust: [
    'Rust-ന്റെ borrow checker നിന്റെ കോഡ് മാത്രമല്ല, നിന്റെ ജീവിതം തന്നെ reject ചെയ്തിരിക്കുകയാണ്!',
    'ഒരു unsafe block-നും നിന്റെ ഈ വൃത്തികെട്ട കോഡിൽ നിന്ന് കംപൈലറെ രക്ഷിക്കാൻ കഴിയില്ല! റസ്റ്റ് കണ്ട് കരയുന്നു!',
    'Panic at the syntax level: അല്പം പോലും ചിന്തയില്ലാതെ കോഡടിച്ചാൽ Rust പോയിട്ട് ദൈവം തമ്പുരാൻ വിചാരിച്ചാലും രക്ഷിക്കില്ല!'
  ],
  go: [
    '`if err != nil`? Go-യിൽ ഇവിടെയുള്ള ഒരേയൊരു error നിനക്ക് git-ൽ write access തന്ന ആ മാനേജരാണ്!',
    'Go ഉണ്ടാക്കിയത് ജൂനിയർമാർ സിസ്റ്റം പൊട്ടിക്കാതിരിക്കാനാണ്. എന്നിട്ടും നീ ഇമ്മാതിരി ദുരന്തം ഉണ്ടാക്കിവെച്ചല്ലോ!',
    'GOPATH എന്നേ deprecated ആയി, ഇതുപോലെ കോഡടിച്ചാൽ സോഫ്റ്റ്‌വെയർ രംഗത്ത് നിന്റെ ഭാവിയും ഉടൻ deprecated ആകും!'
  ],
  cpp: [
    'നിന്റെ ഈ പോയിന്റർ കളി കണ്ടാൽ OS കേണൽ പാനിക് ആയി കരയും. സി.ഐ.ഡി മൂസയിലെ വെടി പോലെയാണ് നിന്റെ Memory leak!',
    'Segmentation fault (core dumped): നിന്റെ ലോജിക് പണ്ടാരമടങ്ങി! പോയി വല്ല കപ്പ കൃഷിയും ചെയ്യ്!',
    'C++ എഴുതാൻ അറിയില്ലെങ്കിൽ പോയി തുണി അലക്കെടാ! ഈ Pointer വെച്ച് നീ ആരുടെ തലയോട്ടിയാണ് പൊട്ടിക്കാൻ നോക്കുന്നത്?'
  ],
  java: [
    'AbstractSingletonProxyFactoryBean കൊണ്ട് വന്നാലും ഈ ദുരന്തം encapsulate ചെയ്യാൻ പറ്റില്ല! ജാവ കണ്ട് ജെയിംസ് ഗോസ്‌ലിംഗ് കരയുന്നുണ്ടാകും!',
    'NullPointerException: നിന്റെ തലച്ചോറിനേക്കാൾ ശൂന്യതയാണ് നിന്റെ വേരിയബിളുകളിൽ!',
    'Enterprise grade അല്ല, ഇത് എൽ.കെ.ജി ലെവൽ തോൽവിയാണ്! പോയി വല്ല ട്യൂഷനും പോടാ!'
  ],
  eat_success: [
    'ചൂലുകൊണ്ട് അടിച്ചുവാരി! ചവറ്റുകുട്ടയിലേക്ക് പോയ തെറ്റ് കണ്ട് നിന്റെ പ്രൊജക്ട് മാനേജർ പോലും ആശ്വസിക്കും!',
    'സ്വാഹ! ആ പൊട്ടിയ സിന്റാക്സ് ഞാൻ ചൂലെടുത്ത് മുറത്തിൽ ആക്കി!',
    'തൂത്തുവാരി കളഞ്ഞു! നിന്റെ PR റിജക്റ്റ് ആവാതെ ഞാൻ രക്ഷിച്ചതാ... നന്ദി പറയടാ!',
    'എടാ മോനേ... നീ തെറ്റുകൾ അടിക്കുന്ന സ്പീഡിൽ തൂത്തുവാരാൻ എനിക്ക് പത്ത് ചൂല് വാങ്ങേണ്ടി വരും!',
    'ദാസാ... ഒരു തെറ്റ് കൂടി പവനായിയെ പോലെ ശവമായി!'
  ],
  eat_aborted: [
    'മര്യാദയില്ലാത്ത സ്വഭാവം! ഞാൻ ചൂലുകൊണ്ട് വാരാൻ വരുമ്പോഴേക്കും ഫയൽ മാറ്റുന്നോ?',
    'ഓടി രക്ഷപ്പെടാൻ നോക്കണ്ട! നിന്റെ പൊട്ടിയ കോഡ് ചൂലിന് എറിഞ്ഞു തന്നിട്ട് പോടാ പേടിത്തൊണ്ടാ!',
    'മുറത്തിൽ കയറാൻ പോയ സിന്റാക്സിനെ തട്ടിയെടുക്കുന്നോ? എന്ത് ദുരന്തം കാണിപ്പാണിത്!',
    'ഭയന്നോടി ഒളിക്കാൻ നോക്കണ്ട! നിന്റെ ചവറ് കോഡ് ഞാൻ എവിടെയാണെങ്കിലും ചൂലെടുത്ത് തൂത്തുവാരിയിരിക്കും!'
  ],
  typed_while_cleaning: [
    'എടാ! ഞാൻ ചൂലുകൊണ്ട് CLEAN ചെയ്യുമ്പോൾ KEYBOARD-ൽ തൊടുന്നോ? ആ TYPE ചെയ്തതും ഞാൻ ചൂലെടുത്ത് തൂത്തുവാരി! NOM NOM!',
    'മര്യാദക്ക് KEYBOARD-ൽ നിന്ന് കൈയ്യെടുക്കടാ! ഞാൻ ചൂലുമായി CLEAN ആക്കുമ്പോൾ TYPE ചെയ്താൽ ബാക്കി കോഡും കൂടി തൂത്തുവാരി കളയും!',
    'VACUUM പോയി ചൂല് വന്നാലും നീ പഠിക്കില്ലല്ലേ? CLEAN ചെയ്യുമ്പോൾ വീണ്ടും TYPE ചെയ്യുന്നു! NOM NOM കളഞ്ഞു!',
    'എന്റെ ചൂലിന്റെ മുന്നിൽ വന്ന് KEYBOARD തട്ടുന്നോ? ആ അടിച്ച അക്ഷരം ഞാൻ തിന്നു തീർത്തു! NOM!',
    'തൊടരുത് KEYBOARD-ൽ! അടിച്ചുവാരുമ്പോൾ വീണ്ടും TYPE ചെയ്താൽ ഫയൽ മൊത്തം ഞാൻ അടിച്ചുമാറ്റും! NOM!'
  ],
  apocalypse: [
    '🚨 അത്യാഹിതം: സിന്റാക്സ് പ്രളയം! സർവ്വനാശം വിതച്ച് കോഡ് തകരുന്നു! 🚨',
    '💥 അയ്യോ... കോഡ് പൊട്ടിത്തെറിച്ചു! ചൂലിനും താങ്ങാൻ പറ്റാത്ത മഹാദുരന്തം! 💥',
    'സൈറൺ മുഴക്ക്! നാട് വിട്ടോ! കോഡ്ബേസ് ഇനി നേരെ പാതാളത്തിലേക്ക്!',
    'ദൈവമേ... ഇവന്റെ കൈയ്യിൽ കീബോർഡ് കൊടുത്ത ആ മഹാപാപിയെ ചൂലെടുത്ത് അടിക്കണം!'
  ],
  clogged: [
    'ഛർദ്ദിക്കാൻ വരുന്നു! 5 തെറ്റുകൾ വാരി വാരി മുറം നിറഞ്ഞു തുളുമ്പി!',
    'മുറം നിറഞ്ഞു! വേഗം മുറം ഒഴിക്ക് (UNCLOG), അല്ലെങ്കിൽ ഈ ചവറ് മൊത്തം നിന്റെ തലയിലേക്ക് തട്ടും!',
    'പൊട്ടിയ സെമികോളനുകളും നിന്റെ തകർന്ന സ്വപ്നങ്ങളും കൊണ്ട് മുറം നിറഞ്ഞു! Unclog ചെയ്യടാ!',
    'ചൂല് കുഴഞ്ഞു വീണു... ഇത്രയും വലിയ ചവറ് കോഡ് ഇതിനുമുമ്പ് തൂത്തിട്ടില്ല!'
  ],
  unsafe: [
    'ഇത്രയും വലിയ കുറ്റിച്ചൂല് പോലും ഈ വൻ ദുരന്തം വാരാൻ തികയില്ല! ഞാൻ പൊടിപടലം മാത്രമേ വാരു, നിന്റെ ആർക്കിടെക്ചറൽ കൊലപാതകം അല്ല!',
    'ഞാൻ വെറുമൊരു ചൂലാണ്, അല്ലാതെ നിന്റെ പൊട്ടിയ ലോജിക് തിരുത്താൻ വന്ന സീനിയർ ആർക്കിടെക്റ്റ് അല്ല!',
    'ഇത് സിന്റാക്സ് തെറ്റല്ല, ടൈപ്പ് എററാണ്! നിന്റെ ജീവിതം പോലെ ആകെ കൺഫ്യൂഷനായ എറർ!',
    'അപകട മേഖല! ഇതിൽ തൊട്ടാൽ ഫയൽ കത്തിയമരും! ധൈര്യമുണ്ടെങ്കിൽ മാനുവലായി വാരിയെടുക്ക്!'
  ],
  hunger_strike: [
    'ഞാൻ പണിമുടക്കിലാണ്! ഈ വൃത്തികെട്ട കോഡ് വാരാൻ എന്നെ കിട്ടില്ല! നോക്ക്... ഒന്നങ്ങോട്ട് നോക്ക്!',
    'സമരം! മര്യാദക്ക് ഇൻഡന്റേഷൻ തന്നാലേ ഞാൻ ഇനി ചൂല് തൊടുള്ളൂ!',
    'ഒരു ലിന്റർ എന്താണെന്ന് നീ പഠിക്കുന്നത് വരെ ഞാൻ ഇവിടെ നിരാഹാരം കിടക്കും!',
    'യൂണിയൻ കരാർ പ്രകാരം മണിക്കൂറിൽ 3 തെറ്റേ വാരാൻ പാടുള്ളൂ. നീ നൂറെണ്ണം അടിച്ച് കരാർ ലംഘിച്ചു!'
  ],
  tantrum: [
    'ശ്ശെടാ! ഇതെന്ത് സാധനം?! കണ്ണ് തുറന്ന് പിടിച്ച് ടൈപ്പ് ചെയ്യടാ മനുഷ്യാ!',
    'എന്റെ ഈർക്കിലി വിറയ്ക്കുന്നു! സിന്റാക്സ് ഓവർലോഡ്! സഹിക്കാൻ പറ്റുന്നില്ല!',
    'മെക്കാനിക്കൽ കീബോർഡിൽ പൂച്ച മൂത്രമൊഴിച്ചാൽ പോലും ഇതിലും നല്ല ഔട്ട്പുട്ട് വരും!',
    'കംപൈലർ ബാത്റൂമിൽ പോയി കരയുന്നു, കൂടെ ഞാനും!'
  ],
  useless: [
    'ഞാൻ ആ ലൈനിന്റെ അടുത്ത് വരെ പോയി, സൂക്ഷിച്ചു നോക്കി, ഒന്നും ചെയ്യാതെ തിരിച്ചുപോന്നു. എങ്ങനെയുണ്ട്?',
    'ഞാൻ ഒന്നും ശരിയാക്കിയില്ല, എങ്കിലും എനിക്ക് ഭയങ്കര അഭിമാനം തോന്നുന്നു!',
    'ആ തെറ്റ് വാരാൻ പോയതാ, പക്ഷെ വെറുതെ കിടന്ന ഒരു സ്പേസ് കണ്ട് എന്റെ ശ്രദ്ധ പോയി.',
    'വെറുതെ തിരക്ക് അഭിനയിച്ച് ചൂലുകൊണ്ട് കാറ്റിൽ അടിക്കുകയാണ്... നിനക്ക് മനസ്സിലാകുമല്ലോ!'
  ],
  general: [
    'നിന്റെ കോഡ് മോഡേൺ ആർട്ട് പോലെയാണ്: ആർക്കും ഒന്നും മനസ്സിലാവില്ല, കൊണ്ടുനടക്കാൻ ഭയങ്കര ചിലവും!',
    'ഒരു സെമികോളൻ ഇവിടെ, ഒരു ബ്രാക്കറ്റ് അവിടെ... റോമാഞ്ചം സിനിമയിലെ പോലെ പ്രേതത്തെ വിളിച്ചുവരുത്തുകയാണോ?',
    'ഓരോ തവണ സേവ് ചെയ്യുമ്പോഴും കംപൈലർ നെഞ്ചത്തടിച്ച് നിലവിളിക്കുന്നുണ്ട്!',
    'തലച്ചോർ ഒന്നു ഓഫ് ചെയ്തിട്ട് ഓൺ ചെയ്തു നോക്കിയാലോ? വല്ല മാറ്റവും ഉണ്ടാവുമോ എന്ന് നോക്കാം.',
    'എന്താണ് തെറ്റിയതെന്ന് പറഞ്ഞുതരാൻ എനിക്ക് ആഗ്രഹമുണ്ട്, പക്ഷെ പാർസർ പോലും ബോധംകെട്ടു വീണു!',
    'മോണിറ്ററിലേക്ക് നോക്കാതെ കോഡടിക്കുന്ന നിന്റെ ആ ഒരു ധൈര്യം... സമ്മതിക്കണം!',
    'ഞാൻ വെറുമൊരു ചൂലാണ്, എന്നിട്ടും നിന്നെക്കാൾ എത്രയോ ഭേദമാണ് എന്റെ ബുദ്ധി എന്ന് തോന്നിപ്പോകുന്നു!',
    'ഷമ്മി ഹീറോയാടാ ഹീറോ... പക്ഷേ നിന്റെ കോഡ് വെറും സീറോ! ക്ലോസ് ചെയ്തു പോടാ മോനേ!',
    'സച്ചിൻ ബ്രോ... ഇമ്മാതിരി കോഡ് കണ്ടാൽ കമ്പനിയിലെ പ്യൂൺ പോലും മൈൻഡ് ചെയ്യില്ല!',
    'കുമ്പളങ്ങി നൈറ്റ്സിലെ ഫ്രാങ്കി പറഞ്ഞ പോലെ: "ഈ കുടുംബം നന്നാവാൻ പോകുന്നില്ല", നിന്റെ ഈ പ്രൊജക്റ്റും!'
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
        `വഴിതെറ്റി വന്ന '${ctx.token}' ഞാൻ ചൂലുകൊണ്ട് അടിച്ചുവാരി! എവിടുന്നു വരുന്നു ഇമ്മാതിരി സാധനങ്ങൾ?`,
        `ദാ കിടക്കുന്നു '${ctx.token}' അലഞ്ഞുതിരിയുന്നു! ഞാൻ ചൂലുകൊണ്ട് മുറത്തിൽ ആക്കി കളഞ്ഞു.`,
        `'${ctx.token}' ചൂലുകൊണ്ട് തൂത്തുവാരി! കീബോർഡിൽ വിരൽ കുടുങ്ങിപ്പോയതാണോ?`
      ];
      if (Math.random() > 0.4) {
        return tokenTemplates[Math.floor(Math.random() * tokenTemplates.length)];
      }
    }

    if (ctx.line !== undefined && Math.random() > 0.6) {
      return `വരി ${ctx.line + 1}: വേഗത്തിൽ ടൈപ്പ് ചെയ്യുന്നതും വല്ലതും അറിഞ്ഞ് ടൈപ്പ് ചെയ്യുന്നതും രണ്ടാണെന്ന് മനസ്സിലായോ?`;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  private async fetchOllamaRoast(endpoint: string, errorMessage: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    try {
      const sanitizedMsg = errorMessage.slice(0, 150).replace(/["\\]/g, ' ');
      const prompt = `You are Dusty, a sassy little retro desktop broom (ചൂൽ) living inside VS Code. Write a short, funny, brutally sarcastic 1-sentence Malayalam roast referencing popular Malayalam cinema memes (under 25 words) for a developer whose code has this syntax error: "${sanitizedMsg}". Poke fun at their coding skills.`;

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
