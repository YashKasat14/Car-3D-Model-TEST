import { AiSoundProfile } from '../../services/aiSoundAnalyzer';

/**
 * Web Audio API Sound Synthesizer Engine
 * Generates synthetic mechanical, interface, and authentic AI vehicle acoustics.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  
  // Continuous audio oscillators for engine demo / AI acoustics
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Active AI Sound Profile state
  private activeAiProfile: AiSoundProfile | null = null;
  private currentThrottle: number = 0.15; // 0 to 1
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
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.volume;
    }
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  /**
   * Component selection ping
   */
  public playSelect() {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
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
   * Exploded view slider expansion sound
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
   * Warning or prerequisite violation sound
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

  // =========================================================================
  // AI ACOUSTIC SYNTHESIZER ENGINE (Authentic Real-Time Vehicle & Entity Sound)
  // =========================================================================

  /**
   * Starts real-time procedural audio synthesis tailored to the AI-analyzed model profile
   */
  public startAiSound(_profile?: AiSoundProfile): boolean {
    this.stopAiSound();
    return false;
  }

  /**
   * Dynamically adjusts engine throttle / RPM (0.0 = Idle, 1.0 = Max RPM Screamer)
   */
  public setAiThrottle(throttle: number) {
    this.currentThrottle = Math.max(0, Math.min(1, throttle));
    if (!this.isEngineRunning || !this.ctx || !this.activeAiProfile) return;

    try {
      const t = this.ctx.currentTime + 0.05;
      const details = this.activeAiProfile.acousticDetails;
      const minF = details.fundamentalFreq || 80;
      const maxF = details.maxFreq || 320;
      const targetF = minF + (maxF - minF) * this.currentThrottle;

      if (this.engineOsc1) {
        this.engineOsc1.frequency.exponentialRampToValueAtTime(Math.max(20, targetF), t);
      }
      if (this.engineOsc2) {
        this.engineOsc2.frequency.exponentialRampToValueAtTime(Math.max(30, targetF * 1.5), t);
      }
      if (this.engineFilter) {
        const filterCutoff = targetF * 9 + this.currentThrottle * 3000;
        this.engineFilter.frequency.exponentialRampToValueAtTime(Math.max(200, filterCutoff), t);
      }
      if (this.turboOsc && this.turboGain) {
        this.turboOsc.frequency.exponentialRampToValueAtTime(2600 + this.currentThrottle * 5500, t);
        this.turboGain.gain.exponentialRampToValueAtTime(0.03 + this.currentThrottle * 0.08, t);
      }
      this.notify();
    } catch (e) {}
  }

  /**
   * Triggers an authentic burst: Rev Blip, Ship Foghorn Blast, Jet Afterburner, or Primal Roar
   */
  public triggerBurst() {
    if (!this.activeAiProfile) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const profile = this.activeAiProfile;

    // 1. Marine Ship Foghorn Blast
    if (profile.archetype === 'marine_ship') {
      try {
        const hornOsc1 = this.ctx.createOscillator();
        const hornOsc2 = this.ctx.createOscillator();
        const hornGain = this.ctx.createGain();
        hornOsc1.type = 'sawtooth';
        hornOsc2.type = 'triangle';
        // Deep maritime fifth chord
        hornOsc1.frequency.setValueAtTime(65, t);
        hornOsc2.frequency.setValueAtTime(97.5, t);
        hornGain.gain.setValueAtTime(0.001, t);
        hornGain.gain.exponentialRampToValueAtTime(0.45, t + 0.3);
        hornGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
        hornOsc1.connect(hornGain);
        hornOsc2.connect(hornGain);
        hornGain.connect(this.masterGain);
        hornOsc1.start(t);
        hornOsc2.start(t);
        hornOsc1.stop(t + 2.3);
        hornOsc2.stop(t + 2.3);
      } catch (e) {}
      return;
    }

    // 2. Animal / Dinosaur Primal Roar
    if (profile.archetype === 'animal_creature') {
      try {
        const roarOsc = this.ctx.createOscillator();
        const roarGain = this.ctx.createGain();
        const roarFilter = this.ctx.createBiquadFilter();
        roarOsc.type = 'sawtooth';
        roarFilter.type = 'lowpass';
        roarOsc.frequency.setValueAtTime(95, t);
        roarOsc.frequency.exponentialRampToValueAtTime(140, t + 0.4);
        roarOsc.frequency.exponentialRampToValueAtTime(38, t + 1.6);
        roarFilter.frequency.setValueAtTime(350, t);
        roarFilter.frequency.exponentialRampToValueAtTime(900, t + 0.4);
        roarFilter.frequency.exponentialRampToValueAtTime(200, t + 1.6);
        roarGain.gain.setValueAtTime(0.001, t);
        roarGain.gain.exponentialRampToValueAtTime(0.4, t + 0.2);
        roarGain.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
        roarOsc.connect(roarFilter);
        roarFilter.connect(roarGain);
        roarGain.connect(this.masterGain);
        roarOsc.start(t);
        roarOsc.stop(t + 1.7);
      } catch (e) {}
      return;
    }

    // 3. Automotive / F1 Rev Blip & Exhaust Overrun
    if (this.isEngineRunning) {
      const originalThrottle = this.currentThrottle;
      this.setAiThrottle(0.92);
      setTimeout(() => {
        this.setAiThrottle(originalThrottle);
      }, 750);
    } else {
      // One-shot rev burst
      try {
        const burstOsc = this.ctx.createOscillator();
        const burstGain = this.ctx.createGain();
        burstOsc.type = profile.acousticDetails.harmonicType;
        burstOsc.frequency.setValueAtTime(110, t);
        burstOsc.frequency.exponentialRampToValueAtTime(340, t + 0.4);
        burstOsc.frequency.exponentialRampToValueAtTime(90, t + 1.2);
        burstGain.gain.setValueAtTime(0.01, t);
        burstGain.gain.exponentialRampToValueAtTime(0.35, t + 0.2);
        burstGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        burstOsc.connect(burstGain);
        burstGain.connect(this.masterGain);
        burstOsc.start(t);
        burstOsc.stop(t + 1.2);
      } catch (e) {}
    }
  }

  /**
   * Stops continuous AI vehicle acoustic synthesis
   */
  public stopAiSound() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
      }
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.turboOsc?.stop();
          this.lfoOsc?.stop();
          this.noiseNode?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.turboOsc?.disconnect();
          this.lfoOsc?.disconnect();
          this.noiseNode?.disconnect();
          this.engineGain?.disconnect();
          this.engineFilter?.disconnect();
        } catch (e) {}
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.turboOsc = null;
        this.lfoOsc = null;
        this.noiseNode = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.isEngineRunning = false;
        this.notify();
      }, 250);
    } catch (e) {
      this.isEngineRunning = false;
      this.notify();
    }
  }

  public getIsEngineRunning(): boolean {
    return this.isEngineRunning;
  }

  public getActiveAiProfile(): AiSoundProfile | null {
    return this.activeAiProfile;
  }

  public getCurrentThrottle(): number {
    return this.currentThrottle;
  }

  public getCurrentEstimatedRpm(): number {
    if (!this.activeAiProfile) return 0;
    const { idleRpm, maxRpm } = this.activeAiProfile;
    return Math.round(idleRpm + (maxRpm - idleRpm) * this.currentThrottle);
  }

  // Preserved backwards-compatibility method
  public toggleEngineDemo(type: 'f1' | 'jet' = 'f1'): boolean {
    if (this.isEngineRunning) {
      this.stopAiSound();
      return false;
    }
    const mockProfile: AiSoundProfile = {
      hasSound: true,
      archetype: type === 'f1' ? 'f1_turbo_hybrid' : 'jet_turbofan',
      entityName: type === 'f1' ? 'F1 Turbo Hybrid' : 'Turbofan Jet',
      soundTitle: type === 'f1' ? 'Formula 1 1.6L V6 Turbo Engine' : 'Turbofan Jet Spool',
      soundDescription: '',
      engineType: type === 'f1' ? 'V6 Turbo Hybrid' : 'Jet Turbofan',
      idleRpm: type === 'f1' ? 4200 : 2500,
      maxRpm: type === 'f1' ? 15000 : 12000,
      confidenceScore: 0.95,
      acousticDetails: {
        harmonicType: type === 'f1' ? 'sawtooth' : 'sine',
        fundamentalFreq: type === 'f1' ? 85 : 120,
        maxFreq: type === 'f1' ? 310 : 440,
        hasTurboWhistle: type === 'f1',
        hasExhaustBurble: type === 'f1',
        hasPropChop: false,
        hasTurbineWhine: type === 'jet',
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
    return this.startAiSound(mockProfile);
  }

  public stopEngine() {
    this.stopAiSound();
  }
}

export const soundEngine = new SoundEngine();
