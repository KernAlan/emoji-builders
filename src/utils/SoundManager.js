// Sound manager using Web Audio API - no audio files needed!

export default class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioContext = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Play a simple tone
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Catch sound - short happy blip
  catch() {
    if (!this.enabled) return;
    this.init();
    this.playTone(600, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(800, 0.1, 'sine', 0.2), 50);
  }

  // Success sound - happy ascending melody
  success() {
    if (!this.enabled) return;
    this.init();
    this.playTone(523, 0.15, 'sine', 0.3); // C
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 100); // E
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 200); // G
    setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.3), 300); // High C
  }

  // Fail sound - descending buzz
  fail() {
    if (!this.enabled) return;
    this.init();
    this.playTone(300, 0.15, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(200, 0.25, 'sawtooth', 0.2), 100);
  }

  // Win fanfare!
  win() {
    if (!this.enabled) return;
    this.init();
    const notes = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
    const durations = [0.15, 0.15, 0.15, 0.15, 0.3, 0.15, 0.15, 0.15, 0.5];
    let time = 0;

    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, durations[i], 'sine', 0.3), time);
      time += durations[i] * 600;
    });
  }

  // Menu select blip
  select() {
    if (!this.enabled) return;
    this.init();
    this.playTone(440, 0.08, 'sine', 0.2);
  }

  // Countdown beep
  countdown() {
    if (!this.enabled) return;
    this.init();
    this.playTone(440, 0.1, 'square', 0.15);
  }

  // Block spawn subtle sound
  spawn() {
    if (!this.enabled) return;
    this.init();
    this.playTone(200, 0.05, 'sine', 0.1);
  }
}

// Global singleton
export const soundManager = new SoundManager();
