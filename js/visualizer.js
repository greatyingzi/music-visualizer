/**
 * Canvas Visualizer
 * Renders 4 different visualization effects driven by spectrum data
 */
class Visualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effect = 'bars'; // bars, wave, circle, particles
    this.theme = 'neon-purple';
    this.particles = [];
    this.rotation = 0;
    
    // Theme color palettes
    this.themes = {
      'neon-purple': { primary: '#a855f7', secondary: '#ec4899', gradient: ['#a855f7', '#d946ef', '#ec4899'] },
      'flame-orange': { primary: '#f97316', secondary: '#ef4444', gradient: ['#f97316', '#facc15', '#ef4444'] },
      'ocean-blue': { primary: '#0ea5e9', secondary: '#06b6d4', gradient: ['#0ea5e9', '#06b6d4', '#3b82f6'] },
      'aurora-green': { primary: '#22c55e', secondary: '#10b981', gradient: ['#22c55e', '#10b981', '#14b8a6'] }
    };
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = rect.width;
    this.height = rect.height;
  }

  setEffect(effect) {
    this.effect = effect;
    if (effect === 'particles') {
      this.initParticles();
    }
  }

  setTheme(theme) {
    this.theme = theme;
  }

  initParticles() {
    this.particles = [];
    const count = this.width < 768 ? 100 : 200;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        hue: Math.random() * 360
      });
    }
  }

  render(spectrumData) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear with fade effect (progressive trail)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);
    
    switch (this.effect) {
      case 'bars':
        this.renderBars(ctx, w, h, spectrumData);
        break;
      case 'wave':
        this.renderWave(ctx, w, h, spectrumData);
        break;
      case 'circle':
        this.renderCircle(ctx, w, h, spectrumData);
        break;
      case 'particles':
        this.renderParticles(ctx, w, h, spectrumData);
        break;
    }
  }

  renderBars(ctx, w, h, data) {
    const barCount = data.length;
    const barWidth = w / barCount;
    const theme = this.themes[this.theme];

    for (let i = 0; i < barCount; i++) {
      const value = data[i] / 255;
      const barHeight = value * h * 0.8;

      // Gradient color: red (bottom) -> yellow (middle) -> cyan (top)
      const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
      gradient.addColorStop(0, this.hslToRgb(0, 80, 50));    // Red (low freq)
      gradient.addColorStop(0.5, this.hslToRgb(60, 80, 55)); // Yellow (mid freq)
      gradient.addColorStop(1, this.hslToRgb(180, 80, 60));  // Cyan (high freq)

      // Draw bar from bottom with glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = theme.primary;
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);

      // Mirror effect (top reflection - faded)
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(${this.extractRgb(theme.primary)}, 0.3)`;
      ctx.fillRect(i * barWidth, 0, barWidth - 1, barHeight * 0.2);
    }
    ctx.shadowBlur = 0;
  }

  // Helper: extract RGB values from hex color
  extractRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  renderWave(ctx, w, h, data) {
    const theme = this.themes[this.theme];

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = theme.primary;

    // Main wave line
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.primary;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    const sliceWidth = w / (data.length - 1);

    // Smooth curve using quadratic bezier
    ctx.moveTo(0, h / 2);
    for (let i = 0; i < data.length; i++) {
      const value = data[i] / 255;
      const x = i * sliceWidth;
      const y = h / 2 + (value - 0.5) * h * 0.8;

      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        // Smooth interpolation
        const prevX = (i - 1) * sliceWidth;
        const prevValue = data[i - 1] / 255;
        const prevY = h / 2 + (prevValue - 0.5) * h * 0.8;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        if (i === data.length - 1) {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // Fill area under curve (faded)
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `rgba(${this.extractRgb(theme.primary)}, 0.3)`);
    gradient.addColorStop(1, `rgba(${this.extractRgb(theme.primary)}, 0.0)`);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  renderCircle(ctx, w, h, data) {
    const theme = this.themes[this.theme];
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.2;
    
    this.rotation += 0.01;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    
    const bars = data.length;
    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2;
      const value = data[i] / 255;
      const barLength = value * radius * 1.5;
      
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * (radius + barLength);
      const y2 = Math.sin(angle) * (radius + barLength);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      
      const hue = (i / bars) * 360;
      ctx.strokeStyle = this.hslToRgb(hue, 80, 60);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }

  renderParticles(ctx, w, h, data) {
    const theme = this.themes[this.theme];
    
    // Calculate average energy from spectrum
    let energy = 0;
    for (let i = 0; i < data.length; i++) {
      energy += data[i];
    }
    energy = energy / data.length / 255;
    
    // Update and render particles
    for (let p of this.particles) {
      // Speed influenced by music energy
      p.vx += (Math.random() - 0.5) * energy * 2;
      p.vy += (Math.random() - 0.5) * energy * 2;
      
      // Apply slight gravity
      p.vy += 0.05;
      
      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around edges
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      
      // Color based on frequency mapping
      const freqIndex = Math.floor((p.x / w) * data.length);
      const value = data[freqIndex] / 255;
      p.hue = (freqIndex / data.length) * 360;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + energy), 0, Math.PI * 2);
      ctx.fillStyle = this.hslToRgb(p.hue, 80, 60);
      ctx.fill();
    }
  }

  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    };
    return `rgb(${Math.round(f(0) * 255)},${Math.round(f(8) * 255)},${Math.round(f(4) * 255)})`;
  }
}
