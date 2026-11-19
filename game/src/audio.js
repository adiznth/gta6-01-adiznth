// Solmar Nights — sound: everything is synthesized with WebAudio, so the
// game ships no audio files at all. Engine hum, sirens, gunshots, cash
// chimes and a lazy synthwave pad are all oscillators and noise.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.padOn = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  blip(freq, dur, type, gain) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  noise(dur, gain, lowpass) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const g = this.ctx.createGain();
    g.gain.value = gain || 0.15;
    src.connect(filter).connect(g).connect(this.ctx.destination);
    src.start(t);
  }

  shoot() { this.noise(0.12, 0.22, 2600); this.blip(180, 0.08, 'square', 0.1); }
  cash() { this.blip(880, 0.1, 'sine', 0.12); setTimeout(() => this.blip(1320, 0.14, 'sine', 0.12), 90); }
  crash() { this.noise(0.3, 0.3, 500); }
  mission() { this.blip(523, 0.12, 'triangle', 0.12); setTimeout(() => this.blip(659, 0.12, 'triangle', 0.12), 120); setTimeout(() => this.blip(784, 0.2, 'triangle', 0.14), 240); }
  fail() { this.blip(220, 0.25, 'sawtooth', 0.1); setTimeout(() => this.blip(165, 0.35, 'sawtooth', 0.1), 200); }
  pickup() { this.blip(660, 0.08, 'sine', 0.1); }

  // Two-tone police siren, called on a timer while wanted.
  siren() {
    if (!this.ctx || this.muted) return;
    this.blip(760, 0.4, 'sine', 0.05);
    setTimeout(() => this.blip(980, 0.4, 'sine', 0.05), 420);
  }

  // A soft looping synthwave pad for the title screen and driving.
  startPad() {
    if (!this.ctx || this.muted || this.padOn) return;
    this.padOn = true;
    const notes = [110, 164.8, 220, 261.6];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (i % 2) * 6 - 3;
      g.gain.value = 0.025;
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = 0.08 + i * 0.03;
      lg.gain.value = 0.012;
      lfo.connect(lg).connect(g.gain);
      osc.connect(g).connect(this.ctx.destination);
      osc.start();
      lfo.start();
    });
  }
}
