export class SoundSynth {
  private context: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      return this.context;
    } catch {
      return null;
    }
  }

  play(type: 'shot' | 'hit' | 'kill' | 'pickup' | 'deploy'): void {
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    const now = context.currentTime;
    const settings = {
      shot: { from: 118, to: 48, length: 0.07, volume: 0.035, wave: 'square' as OscillatorType },
      hit: { from: 330, to: 190, length: 0.05, volume: 0.025, wave: 'triangle' as OscillatorType },
      kill: { from: 220, to: 520, length: 0.12, volume: 0.04, wave: 'sawtooth' as OscillatorType },
      pickup: { from: 420, to: 760, length: 0.1, volume: 0.025, wave: 'sine' as OscillatorType },
      deploy: { from: 160, to: 250, length: 0.14, volume: 0.03, wave: 'triangle' as OscillatorType },
    }[type];
    oscillator.type = settings.wave;
    oscillator.frequency.setValueAtTime(settings.from, now);
    oscillator.frequency.exponentialRampToValueAtTime(settings.to, now + settings.length * 0.8);
    gain.gain.setValueAtTime(settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + settings.length);
    oscillator.start(now);
    oscillator.stop(now + settings.length);
  }
}
