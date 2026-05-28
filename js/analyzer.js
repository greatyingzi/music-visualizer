/**
 * Real Audio Analyzer
 * Uses Web Audio API to analyze actual audio file frequency data
 */
class RealAudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.audioElement = null;
    this.fftData = new Uint8Array(128);
    this.isConnected = false;
  }

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  async loadAudio(file) {
    this.init();
    
    // Create audio element
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.remove();
    }
    
    this.audioElement = document.createElement('audio');
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.src = URL.createObjectURL(file);
    this.audioElement.loop = true;
    document.body.appendChild(this.audioElement);
    
    // Connect to analyser
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
    }
    
    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    // Note: we do NOT connect to destination - audio plays through the element itself
    this.isConnected = true;
    
    return new Promise((resolve, reject) => {
      this.audioElement.oncanplaythrough = () => resolve();
      this.audioElement.onerror = reject;
    });
  }

  play() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.audioElement) {
      this.audioElement.play();
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  // Get real frequency data from analyser
  getFrequencyData() {
    if (this.isConnected && this.analyser) {
      // Get full FFT data
      const fullData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(fullData);
      
      // Downsample to 128 bins to match our visualizer expectations
      const binSize = Math.floor(fullData.length / this.fftData.length);
      for (let i = 0; i < this.fftData.length; i++) {
        let sum = 0;
        for (let j = 0; j < binSize; j++) {
          sum += fullData[i * binSize + j];
        }
        this.fftData[i] = Math.floor(sum / binSize);
      }
    }
    return this.fftData;
  }

  destroy() {
    this.stop();
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
      this.source = null;
    }
    if (this.audioElement) {
      this.audioElement.remove();
      this.audioElement = null;
    }
    this.isConnected = false;
  }
}
