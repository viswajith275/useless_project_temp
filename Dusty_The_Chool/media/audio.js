/**
 * Zero-asset Web Audio Synthesizer for Dusty.
 * Synthesizes retro vacuum cleaner effects procedurally.
 * Handles auto-play policies and graceful degradation.
 */
class VacuumAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.hasUnlocked = false;
    this.soundsBaseUri = null;
    this.customSoundMap = new Map();
    this.bufferCache = new Map();
  }

  setSoundsBaseUri(baseUri) {
    this.soundsBaseUri = baseUri;
    this.bufferCache.clear();
  }

  initCustomSounds(baseUri, files) {
    if (baseUri) {
      this.soundsBaseUri = baseUri.replace(/\/+$/, '');
    }
    this.customSoundMap.clear();
    this.bufferCache.clear();
    if (Array.isArray(files) && this.soundsBaseUri) {
      for (const f of files) {
        const dot = f.lastIndexOf('.');
        if (dot > 0) {
          const key = f.substring(0, dot).toLowerCase();
          this.customSoundMap.set(key, `${this.soundsBaseUri}/${f}`);
        }
      }
    }
  }

  getCustomSoundUrl(name) {
    if (!name || this.customSoundMap.size === 0) {
      return null;
    }
    const key = name.toLowerCase();
    if (this.customSoundMap.has(key)) {
      return this.customSoundMap.get(key);
    }
    if (key === 'suction' && this.customSoundMap.has('sweep')) {
      return this.customSoundMap.get('sweep');
    }
    if (key === 'sweep' && this.customSoundMap.has('suction')) {
      return this.customSoundMap.get('suction');
    }
    if ((key === 'siren' || key === 'apocalypse') && this.customSoundMap.has('crashout')) {
      return this.customSoundMap.get('crashout');
    }
    return null;
  }

  ensureContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          return null;
        }
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
  }

  async loadCustomSoundBuffer(ctx, name, url) {
    if (this.bufferCache.has(name)) {
      return this.bufferCache.get(name);
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);
        if (audioBuf) {
          this.bufferCache.set(name, audioBuf);
          return audioBuf;
        }
      }
    } catch {
      // Fall through to procedural
    }
    return null;
  }

  async play(name) {
    if (this.isMuted) {
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. If custom sound file is known to exist, play it via Web Audio
    const customUrl = this.getCustomSoundUrl(name);
    if (customUrl) {
      const buffer = await this.loadCustomSoundBuffer(ctx, name, customUrl);
      if (buffer) {
        try {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const gain = ctx.createGain();
          gain.gain.value = 0.85;
          source.connect(gain);
          gain.connect(ctx.destination);
          source.start(0);
          return;
        } catch {
          // Playback failed, fallback to procedural
        }
      }
    }

    // 2. Fallback directly to procedural retro Web Audio synthesizer
    this.playProcedural(name);
  }

  playProcedural(name) {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      switch (name) {
        case 'sweep':
          this.playSweep(ctx);
          break;
        case 'suction':
          this.playSuction(ctx);
          break;
        case 'error':
          this.playError(ctx);
          break;
        case 'clog':
          this.playClog(ctx);
          break;
        case 'victory':
          this.playVictory(ctx);
          break;
        case 'tantrum':
          this.playTantrum(ctx);
          break;
        case 'hunger':
          this.playHunger(ctx);
          break;
        case 'mischief':
          this.playMischief(ctx);
          break;
        case 'idle':
          this.playIdleHum(ctx);
          break;
        case 'gobble':
          this.playGobble(ctx);
          break;
        case 'crashout':
          this.playCrashout(ctx);
          break;
        case 'siren':
        case 'apocalypse':
          this.playSiren(ctx);
          break;
        default:
          this.playSweep(ctx);
          break;
      }
    } catch {
      // Audio errors fail silently to protect editor experience
    }
  }

  /**
   * Filtered scratch/brush noise simulating a broom sweeping
   */
  playSweep(ctx) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.22);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.2);
    filter.Q.value = 2.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  /**
   * Filtered white noise + pitch glide simulating vacuum suction
   */
  playSuction(ctx) {
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.35);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.4);
  }

  /**
   * Displeased chirp / buzzer
   */
  playError(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * Low frequency damped thunk
   */
  playClog(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  /**
   * Happy arpeggio fanfare (C5 -> E5 -> G5)
   */
  playVictory(ctx) {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  /**
   * High-energy buzzing tantrum
   */
  playTantrum(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playIdleHum(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playGobble(ctx) {
    // Repeated gulping drops
    [0, 0.09, 0.18].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + delay + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.08);
    });
  }

  playCrashout(ctx) {
    // Violent crash screech and distortion
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.5);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  }

  playSiren(ctx) {
    // Alternating two-tone emergency alarm
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(587, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    osc.frequency.setValueAtTime(587, ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }

  /**
   * Menacing hunger grumble followed by ominous two-tone warning chime
   */
  playHunger(ctx) {
    const t0 = ctx.currentTime;
    // 1. Low rumbling growl
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t0);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.35, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.36);

    // 2. Ominous warning chime
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(330, t0 + 0.15);
    chime.frequency.setValueAtTime(260, t0 + 0.28);

    chimeGain.gain.setValueAtTime(0.001, t0 + 0.15);
    chimeGain.gain.linearRampToValueAtTime(0.25, t0 + 0.18);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);

    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(t0 + 0.15);
    chime.stop(t0 + 0.46);
  }

  /**
   * Sneaky mischievous cartoon cackle: 4 staccato hopping blips with pitch bend
   */
  playMischief(ctx) {
    const t0 = ctx.currentTime;
    const notes = [520, 440, 370, 640];
    notes.forEach((freq, idx) => {
      const noteTime = t0 + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, noteTime + 0.06);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.07);
    });
  }
}

window.vacuumAudio = new VacuumAudio();
