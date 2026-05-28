/**
 * Main Application Logic
 * Handles player communication, UI events, and animation loop
 */
class MusicVisualizerApp {
  constructor() {
    // DOM elements
    this.platformSelect = document.getElementById('platform-select');
    this.urlInput = document.getElementById('url-input');
    this.loadBtn = document.getElementById('load-btn');
    this.playerIframe = document.getElementById('player-iframe');
    this.sensitivitySlider = document.getElementById('sensitivity');
    this.sensitivityValue = document.getElementById('sensitivity-value');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    
    // Initialize components
    this.synth = new VirtualSynth();
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
    // Load button
    this.loadBtn.addEventListener('click', () => this.loadVideo());
    
    // URL input enter key
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.loadVideo();
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
    }, { once: true });
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
    // Support various YouTube URL formats
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
    
    // If it looks like a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    
    return null;
  }

  extractBilibiliId(url) {
    const pattern = /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/;
    const match = url.match(pattern);
    if (match) return match[1];
    
    // If it looks like a BV ID
    if (/^BV[a-zA-Z0-9]+/.test(url)) return url;
    
    return null;
  }

  handleMessage(event) {
    // Handle YouTube iframe messages
    if (event.data && typeof event.data === 'object') {
      if (event.data.event === 'ready') {
        this.isPlayerReady = true;
        console.log('Player ready');
      }
      
      if (event.data.event === 'stateChange') {
        const state = event.data.info;
        // YT.PlayerState: -1(unstarted), 0(ended), 1(playng), 2(paused), 3(buffering), 5(cued)
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
    // Generate spectrum data
    this.synth.generateFrame(performance.now());
    
    // Get frequency data and render
    const spectrumData = this.synth.getFrequencyData();
    this.visualizer.render(spectrumData);
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MusicVisualizerApp();
});
