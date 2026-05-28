/**
 * Main Application Logic
 * Handles mode switching, player communication, UI events, and animation loop
 */
class MusicVisualizerApp {
  constructor() {
    // DOM elements
    this.platformSelect = document.getElementById('platform-select');
    this.urlInput = document.getElementById('url-input');
    this.loadBtn = document.getElementById('load-btn');
    this.playerContainer = document.getElementById('player-container');
    this.playerIframe = document.getElementById('player-iframe');
    this.localAudioContainer = document.getElementById('local-audio-container');
    this.dropZone = document.getElementById('drop-zone');
    this.audioFileInput = document.getElementById('audio-file-input');
    this.audioInfo = document.getElementById('audio-info');
    this.audioFileName = document.getElementById('audio-file-name');
    this.removeAudioBtn = document.getElementById('remove-audio-btn');
    this.sensitivitySlider = document.getElementById('sensitivity');
    this.sensitivityValue = document.getElementById('sensitivity-value');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    
    // Initialize components
    this.synth = new VirtualSynth();
    this.analyzer = new RealAudioAnalyzer();
    this.currentMode = 'virtual'; // virtual, local, iframe
    
    this.canvas = document.getElementById('visualizer');
    this.visualizer = new Visualizer(this.canvas);
    
    // State
    this.isPlayerReady = false;
    this.isPlaying = false;
    
    // Bind events
    this.bindEvents();
    
    // Start animation loop
    this.animate();
  }

  bindEvents() {
    // Mode toggle buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchMode(btn.dataset.mode);
      });
    });
    
    // URL input enter key
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.loadVideo();
    });
    
    // Load button (for iframe mode)
    this.loadBtn.addEventListener('click', () => this.loadVideo());
    
    // Drag & drop for local audio
    this.dropZone.addEventListener('click', () => {
      this.audioFileInput.click();
    });
    
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.style.borderColor = 'var(--accent)';
    });
    
    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.style.borderColor = '';
    });
    
    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        this.loadLocalAudio(file);
      }
    });
    
    this.audioFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadLocalAudio(file);
      }
    });
    
    this.removeAudioBtn.addEventListener('click', () => {
      this.analyzer.destroy();
      this.dropZone.style.display = '';
      this.audioInfo.style.display = 'none';
    });
    
    // Effect buttons
    document.querySelectorAll('.effect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.visualizer.setEffect(btn.dataset.effect);
      });
    });
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.visualizer.setTheme(btn.dataset.theme);
        
        // Update CSS variable
        const themeColors = {
          'neon-purple': '#a855f7',
          'flame-orange': '#f97316',
          'ocean-blue': '#0ea5e9',
          'aurora-green': '#22c55e'
        };
        document.documentElement.style.setProperty('--accent', themeColors[btn.dataset.theme]);
      });
    });
    
    // Sensitivity slider
    this.sensitivitySlider.addEventListener('input', (e) => {
      const value = e.target.value;
      this.sensitivityValue.textContent = value;
      this.synth.setSensitivity(value);
    });
    
    // Fullscreen button
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    // Listen for iframe messages
    window.addEventListener('message', (e) => this.handleMessage(e));
    
    // Initialize audio context on first user interaction
    document.addEventListener('click', () => {
      this.synth.init();
      this.analyzer.init();
    }, { once: true });
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    // Hide all containers
    this.playerContainer.style.display = 'none';
    this.localAudioContainer.style.display = 'none';
    this.urlInput.parentElement.style.display = 'none';
    
    switch(mode) {
      case 'virtual':
        // Virtual mode: math-generated spectrum
        this.analyzer.destroy();
        break;
        
      case 'local':
        // Local audio mode: real FFT analysis
        this.localAudioContainer.style.display = '';
        this.dropZone.style.display = '';
        this.audioInfo.style.display = 'none';
        break;
        
      case 'iframe':
        // iframe mode: show player + virtual spectrum synced with playback
        this.playerContainer.style.display = '';
        this.urlInput.parentElement.style.display = '';
        break;
    }
  }

  async loadLocalAudio(file) {
    try {
      await this.analyzer.loadAudio(file);
      this.analyzer.play();
      
      // Update UI
      this.audioFileName.textContent = file.name;
      this.dropZone.style.display = 'none';
      this.audioInfo.style.display = 'flex';
    } catch(e) {
      console.error('Failed to load audio:', e);
      alert('音频加载失败，请尝试其他格式');
    }
  }

  loadVideo() {
    const url = this.urlInput.value.trim();
    if (!url) return;
    
    const platform = this.platformSelect.value;
    
    if (platform === 'youtube') {
      const videoId = this.extractYouTubeId(url);
      if (videoId) {
        this.playerIframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.origin}`;
      }
    } else if (platform === 'bilibili') {
      const bvId = this.extractBilibiliId(url);
      if (bvId) {
        this.playerIframe.src = `https://player.bilibili.com/player.html?bvid=${bvId}&autoplay=0`;
      }
    }
  }

  extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^\&\?\/]+)/,
      /(?:youtu\.be\/)([^\&\?\/]+)/,
      /(?:youtube\.com\/embed\/)([^\&\?\/]+)/,
      /(?:youtube\.com\/v\/)([^\&\?\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    
    return null;
  }

  extractBilibiliId(url) {
    const pattern = /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/;
    const match = url.match(pattern);
    if (match) return match[1];
    
    if (/^BV[a-zA-Z0-9]+/.test(url)) return url;
    
    return null;
  }

  handleMessage(event) {
    if (event.data && typeof event.data === 'object') {
      if (event.data.event === 'ready') {
        this.isPlayerReady = true;
        console.log('Player ready');
      }
      
      if (event.data.event === 'stateChange') {
        const state = event.data.info;
        if (state === 1) {
          this.isPlaying = true;
          this.synth.start();
        } else if (state === 0 || state === 2 || state === -1) {
          this.isPlaying = false;
          this.synth.stop();
        }
      }
    }
  }

  toggleFullscreen() {
    const canvasContainer = document.querySelector('.canvas-container');
    
    if (!document.fullscreenElement) {
      canvasContainer.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  animate() {
    let spectrumData;
    
    if (this.currentMode === 'local' && this.analyzer.isConnected) {
      // Real audio analysis mode
      spectrumData = this.analyzer.getFrequencyData();
    } else {
      // Virtual mode or iframe mode
      this.synth.generateFrame(performance.now());
      spectrumData = this.synth.getFrequencyData();
    }
    
    this.visualizer.render(spectrumData);
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MusicVisualizerApp();
});
