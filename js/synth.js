/**
 * Virtual Spectrum Generator
 * Uses Web Audio API oscillators to simulate audio frequency data
 */
class VirtualSynth {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.oscillators = [];
    this.gainNode = null;
    this.isPlaying = false;
    this.sensitivity = 1.5;
    this.time = 0;
    this.fftData = new Uint8Array(128);
  }

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.analyser);
    // Don't connect to destination to avoid actual sound
  }

  start() {
    if (!this.audioContext) {
      this.init();
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.gainNode.gain.setTargetAtTime(0.3, this.audioContext.currentTime, 0.1);
  }

  stop() {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    }
    this.isPlaying = false;
  }

  // Generate virtual spectrum data (core algorithm)
  generateFrame(timestamp) {
    this.time = (timestamp || performance.now()) / 1000;

    for (let i = 0; i < this.fftData.length; i++) {
      let value = 0;

      // Bass frequencies (low indices) - strong pulsing beat
      if (i < 20) {
        const beat = Math.sin(this.time * Math.PI * 2 * 2) * 0.5;
        const sub = Math.sin(this.time * Math.PI * 2 * 1.5) * 0.3;
        value = (beat + sub) * this.sensitivity;
      }
      // Mid frequencies
      else if (i < 60) {
        const mid = Math.sin(this.time * Math.PI * 2 * (4 + i * 0.1)) * 0.4;
        const harmony = Math.cos(this.time * Math.PI * 2 * (6 + i * 0.05)) * 0.2;
        value = (mid + harmony) * this.sensitivity;
      }
      // High frequencies
      else {
        const high = (Math.random() - 0.5) * 0.3;
        const shimmer = Math.sin(this.time * Math.PI * 2 * (10 + i * 0.2)) * 0.1;
        value = (high + shimmer) * this.sensitivity;
      }

      // Add randomness for realism
      value += (Math.random() - 0.5) * 0.1;

      // Normalize to 0-255 range
      this.fftData[i] = Math.max(0, Math.min(255, (value + 1) * 127.5));
    }
  }

  // Get current frequency data
  getFrequencyData() {
    return this.fftData;
  }

  // Set sensitivity multiplier
  setSensitivity(value) {
    this.sensitivity = parseFloat(value);
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
