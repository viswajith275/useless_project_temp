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
  }

  ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }
      this.ctx = new AudioCtx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
  }

  play(name) {
    if (this.isMuted) {
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') {
      return;
    }

    try {
      switch (name) {
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
        case 'idle':
          this.playIdleHum(ctx);
          break;
      }
    } catch {
      // Audio errors fail silently to protect editor experience
    }
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
}

window.vacuumAudio = new VacuumAudio();
