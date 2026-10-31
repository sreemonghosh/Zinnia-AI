/**
 * Web Audio API Sound Engine for Zinnia AI
 * Synthesizes pure harmonic chords, cinematic sub-bass, and crystal chimes
 * with zero external assets, zero network latency, and full cross-device compatibility.
 */

export class IntroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      this.isMuted = typeof window !== 'undefined' && localStorage.getItem('zinnia_intro_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays the signature Zinnia AI launch chime & harmonic bloom.
   */
  public playIntroTheme(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Cinematic Sub-Bass Energy Swell (65Hz -> 82Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(65, now);
      subOsc.frequency.exponentialRampToValueAtTime(82, now + 1.2);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.2, now + 0.35);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.3);

      // 2. Harmonic Polyphonic Bloom (Lush C Major 9 / F Major 9 Chord)
      const chordFrequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      chordFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Layered sine & triangle oscillators with organic micro-detune
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 2.5) * 5, now);

        // Sweeping resonant lowpass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 0.9);
        filter.frequency.exponentialRampToValueAtTime(600, now + 2.4);

        const noteDelay = now + idx * 0.07;
        gain.gain.setValueAtTime(0.0001, noteDelay);
        gain.gain.linearRampToValueAtTime(0.12 / (idx * 0.25 + 1), noteDelay + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteDelay + 2.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteDelay);
        osc.stop(noteDelay + 2.4);
      });

      // 3. High-Frequency Celestial Shimmer (Crystal Sparkle Arpeggio)
      const sparkleNotes = [1046.5, 1318.5, 1567.98, 2093.0];
      sparkleNotes.forEach((freq, i) => {
        const sOsc = ctx.createOscillator();
        const sGain = ctx.createGain();
        sOsc.type = 'sine';
        sOsc.frequency.setValueAtTime(freq, now);

        const sStart = now + 0.6 + i * 0.12;
        sGain.gain.setValueAtTime(0.0001, sStart);
        sGain.gain.linearRampToValueAtTime(0.06, sStart + 0.05);
        sGain.gain.exponentialRampToValueAtTime(0.0001, sStart + 0.85);

        sOsc.connect(sGain);
        sGain.connect(ctx.destination);

        sOsc.start(sStart);
        sOsc.stop(sStart + 0.95);
      });
    } catch (e) {
      // Audio autoplay policy handled safely
    }
  }

  /**
   * Plays a crisp, subtle transition chime when entering the workspace.
   */
  public playEnterChime(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.18); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('zinnia_intro_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

export const introAudio = new IntroAudioEngine();
