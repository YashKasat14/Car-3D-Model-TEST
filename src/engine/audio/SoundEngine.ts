/**
 * Web Audio API Mechanical & Haptic UI Sound Synthesizer
 * Generates crisp, subtle procedural auditory feedback for 3D interactions:
 * button clicks, part selection, detachments, magnetic snaps, deletions, camera transitions, and alerts.
 * (Vehicle engine acoustics removed per user requirements).
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private listeners: Array<() => void> = [];

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.volume;
    }
    this.notify();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
    this.notify();
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  /**
   * Mechanical button tick
   */
  public playUiClick() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }

  /**
   * Component selection ping
   */
  public playSelect() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  /**
   * Component extraction unlatch & mechanical slide
   */
  public playDetach() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  }

  /**
   * Component reassembly magnetic snap
   */
  public playSnap() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  /**
   * Component deletion / remove whoosh
   */
  public playRemove() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.16);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  }

  /**
   * Exploded view slider expansion sweep
   */
  public playExplodeSweep(percent: number) {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const targetFreq = 160 + (percent / 100) * 440;
      osc.frequency.setValueAtTime(targetFreq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  /**
   * Camera preset teleport / view change
   */
  public playCameraView() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(520, t);
      osc1.frequency.exponentialRampToValueAtTime(780, t + 0.1);
      osc2.frequency.setValueAtTime(260, t);
      osc2.frequency.exponentialRampToValueAtTime(390, t + 0.1);
      gain1.gain.setValueAtTime(0.12, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      gain2.gain.setValueAtTime(0.08, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t + 0.02);
      osc2.stop(t + 0.14);
    } catch (e) {}
  }

  /**
   * Warning or prerequisite violation alert
   */
  public playWarning() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.setValueAtTime(220, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
