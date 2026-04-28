class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playAmbient() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    // No stop, let it drone if needed or manage refs
  }

  playClick() {
    this.playTone(440, 'sine', 0.1, 0.1);
  }

  playAttack() {
    this.playTone(150, 'sawtooth', 0.2, 0.1);
  }

  playDamage() {
    this.playTone(100, 'square', 0.3, 0.1);
  }

  playHeal() {
    this.playTone(880, 'sine', 0.4, 0.1);
  }

  playVictory() {
    setTimeout(() => this.playTone(523.25, 'sine', 0.2, 0.1), 0);
    setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.1), 200);
    setTimeout(() => this.playTone(783.99, 'sine', 0.4, 0.1), 400);
  }
}

export const sounds = new SoundManager();
