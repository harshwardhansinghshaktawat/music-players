// ============================================================
//  TRAP NATION STYLE VISUALIZER - Custom Element
//  Features:
//  - Spectrum analyzer with frequency bars
//  - Particle system reactive to bass/treble
//  - Central logo/album art display
//  - Background pulse effects
//  - Fully customizable colors
//  - Panel controls for all visual settings
// ============================================================

class TrapNationVisualizer extends HTMLElement {
    constructor() {
        super();
        
        // Audio
        this._audio = null;
        this._audioCtx = null;
        this._analyser = null;
        this._dataArray = null;
        this._source = null;
        
        // Playback state
        this._songs = [];
        this._currentIndex = 0;
        this._isPlaying = false;
        this._volume = 0.8;
        
        // Canvases
        this._bgCanvas = null;
        this._spectrumCanvas = null;
        this._particlesCanvas = null;
        this._logoCanvas = null;
        
        // Animation
        this._animationId = null;
        this._particles = [];
        this._maxParticles = 100;
        
        // Visual settings (customizable)
        this._settings = {
            spectrumBars: 64,
            spectrumHeight: 200,
            spectrumGap: 2,
            spectrumGlow: true,
            spectrumMirror: true,
            particlesEnabled: true,
            particleSize: 3,
            particleSpeed: 1,
            backgroundPulse: true,
            logoSize: 200,
            barWidth: 8
        };
    }

    static get observedAttributes() {
        return [
            'player-data',
            'primary-color',
            'secondary-color',
            'accent-color',
            'background-color',
            'spectrum-bars',
            'spectrum-glow',
            'particles-enabled',
            'background-pulse',
            'logo-image'
        ];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;

        if (name === 'player-data' && newVal) {
            try {
                const data = JSON.parse(newVal);
                this._songs = data.songs || [];
                if (this._songs.length > 0) {
                    this._loadSong(0);
                }
            } catch (e) {
                console.error('[TrapViz] Data error:', e);
            }
        } else if (name === 'primary-color') {
            this._colors.primary = newVal || '#ff0050';
        } else if (name === 'secondary-color') {
            this._colors.secondary = newVal || '#00f0ff';
        } else if (name === 'accent-color') {
            this._colors.accent = newVal || '#fff';
        } else if (name === 'background-color') {
            this._colors.background = newVal || '#0a0a0a';
        } else if (name === 'spectrum-bars') {
            this._settings.spectrumBars = parseInt(newVal) || 64;
        } else if (name === 'spectrum-glow') {
            this._settings.spectrumGlow = newVal === 'true';
        } else if (name === 'particles-enabled') {
            this._settings.particlesEnabled = newVal === 'true';
        } else if (name === 'background-pulse') {
            this._settings.backgroundPulse = newVal === 'true';
        } else if (name === 'logo-image') {
            this._updateLogo(newVal);
        }
    }

    connectedCallback() {
        this._colors = {
            primary: '#ff0050',
            secondary: '#00f0ff',
            accent: '#ffffff',
            background: '#0a0a0a'
        };

        this._injectStyles();
        this._buildDOM();
        this._initAudio();
        this._initCanvases();
        this._bindEvents();
        this._initParticles();
        this._startAnimation();
    }

    disconnectedCallback() {
        if (this._animationId) cancelAnimationFrame(this._animationId);
        if (this._audio) this._audio.pause();
        if (this._audioCtx) this._audioCtx.close();
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
trap-nation-visualizer {
    display: block;
    width: 100%;
    height: 600px;
    position: relative;
    background: var(--bg-color, #0a0a0a);
    overflow: hidden;
    font-family: 'Rajdhani', 'Arial Black', sans-serif;
}

.viz-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.viz-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.viz-logo-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
}

.viz-logo {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
    transition: transform 0.1s;
}

.viz-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
    padding: 12px 20px;
    border-radius: 50px;
    backdrop-filter: blur(10px);
}

.viz-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.viz-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.viz-btn.play {
    width: 50px;
    height: 50px;
    background: var(--primary-color, #ff0050);
}

.viz-btn.play:hover {
    background: var(--secondary-color, #00f0ff);
}

.viz-btn svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
}

.viz-info {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 20;
    color: #fff;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.viz-title {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 2px;
    margin-bottom: 8px;
    text-transform: uppercase;
}

.viz-artist {
    font-size: 18px;
    font-weight: 400;
    opacity: 0.8;
}

@keyframes pulse-logo {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.05); }
}

.viz-logo.pulsing {
    animation: pulse-logo 0.3s ease-out;
}
        `;
        this.appendChild(style);
    }

    _buildDOM() {
        const container = document.createElement('div');
        container.className = 'viz-container';
        container.innerHTML = `
            <canvas class="viz-canvas" id="bgCanvas"></canvas>
            <canvas class="viz-canvas" id="particlesCanvas"></canvas>
            <canvas class="viz-canvas" id="spectrumCanvas"></canvas>
            
            <div class="viz-logo-container">
                <img class="viz-logo" id="vizLogo" src="" alt="">
            </div>

            <div class="viz-info">
                <div class="viz-title" id="vizTitle">TRAP NATION</div>
                <div class="viz-artist" id="vizArtist">Music Visualizer</div>
            </div>

            <div class="viz-controls">
                <button class="viz-btn" id="prevBtn" title="Previous">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                
                <button class="viz-btn play" id="playBtn" title="Play">
                    <svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                
                <button class="viz-btn" id="nextBtn" title="Next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
            </div>
        `;
        
        this.appendChild(container);
    }

    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';
        this._audio.volume = this._volume;

        this._audio.addEventListener('play', () => this._onPlay());
        this._audio.addEventListener('pause', () => this._onPause());
        this._audio.addEventListener('ended', () => this._next());

        try {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this._analyser = this._audioCtx.createAnalyser();
            this._analyser.fftSize = 512;
            this._analyser.smoothingTimeConstant = 0.8;
            this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
            
            this._source = this._audioCtx.createMediaElementSource(this._audio);
            this._source.connect(this._analyser);
            this._analyser.connect(this._audioCtx.destination);
        } catch (e) {
            console.warn('[TrapViz] Web Audio unavailable');
        }
    }

    _initCanvases() {
        this._bgCanvas = this.querySelector('#bgCanvas');
        this._particlesCanvas = this.querySelector('#particlesCanvas');
        this._spectrumCanvas = this.querySelector('#spectrumCanvas');

        const resize = () => {
            [this._bgCanvas, this._particlesCanvas, this._spectrumCanvas].forEach(canvas => {
                canvas.width = this.offsetWidth;
                canvas.height = this.offsetHeight;
            });
        };

        resize();
        window.addEventListener('resize', resize);
    }

    _initParticles() {
        for (let i = 0; i < this._maxParticles; i++) {
            this._particles.push({
                x: Math.random() * this.offsetWidth,
                y: Math.random() * this.offsetHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * this._settings.particleSize + 1,
                opacity: Math.random() * 0.5 + 0.2,
                colorIndex: Math.floor(Math.random() * 3)
            });
        }
    }

    _bindEvents() {
        const playBtn = this.querySelector('#playBtn');
        const prevBtn = this.querySelector('#prevBtn');
        const nextBtn = this.querySelector('#nextBtn');

        if (playBtn) playBtn.addEventListener('click', () => this._togglePlay());
        if (prevBtn) prevBtn.addEventListener('click', () => this._prev());
        if (nextBtn) nextBtn.addEventListener('click', () => this._next());
    }

    _loadSong(index) {
        if (!this._songs[index]) return;

        this._currentIndex = index;
        const song = this._songs[index];

        if (this._audio && song.audioFile) {
            this._audio.src = song.audioFile;
            this._audio.load();
        }

        // Update UI
        const title = this.querySelector('#vizTitle');
        const artist = this.querySelector('#vizArtist');
        const logo = this.querySelector('#vizLogo');

        if (title) title.textContent = song.title || 'UNKNOWN';
        if (artist) artist.textContent = song.artist || '—';
        if (logo && song.coverImage) logo.src = song.coverImage;
    }

    _togglePlay() {
        if (!this._audio) return;

        if (this._audio.paused) {
            if (this._audioCtx && this._audioCtx.state === 'suspended') {
                this._audioCtx.resume();
            }
            this._audio.play().catch(e => console.warn('Play error:', e));
        } else {
            this._audio.pause();
        }
    }

    _prev() {
        if (!this._songs.length) return;
        const index = (this._currentIndex - 1 + this._songs.length) % this._songs.length;
        this._loadSong(index);
        if (this._isPlaying) this._audio.play();
    }

    _next() {
        if (!this._songs.length) return;
        const index = (this._currentIndex + 1) % this._songs.length;
        this._loadSong(index);
        if (this._isPlaying) this._audio.play();
    }

    _onPlay() {
        this._isPlaying = true;
        const playIcon = this.querySelector('#playIcon');
        const pauseIcon = this.querySelector('#pauseIcon');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
    }

    _onPause() {
        this._isPlaying = false;
        const playIcon = this.querySelector('#playIcon');
        const pauseIcon = this.querySelector('#pauseIcon');
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
    }

    _updateLogo(imageSrc) {
        const logo = this.querySelector('#vizLogo');
        if (logo && imageSrc) logo.src = imageSrc;
    }

    _startAnimation() {
        const animate = () => {
            this._animationId = requestAnimationFrame(animate);
            
            if (this._analyser && this._dataArray) {
                this._analyser.getByteFrequencyData(this._dataArray);
            }

            this._drawBackground();
            this._drawParticles();
            this._drawSpectrum();
            this._pulseLogo();
        };
        
        animate();
    }

    _drawBackground() {
        if (!this._bgCanvas) return;
        
        const ctx = this._bgCanvas.getContext('2d');
        const w = this._bgCanvas.width;
        const h = this._bgCanvas.height;

        // Base gradient
        const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h)/2);
        gradient.addColorStop(0, this._colors.background);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Pulse effect based on bass
        if (this._settings.backgroundPulse && this._dataArray) {
            const bass = this._dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5 / 255;
            
            ctx.globalAlpha = bass * 0.3;
            const pulseGradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            pulseGradient.addColorStop(0, this._colors.primary);
            pulseGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = pulseGradient;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }

    _drawParticles() {
        if (!this._particlesCanvas || !this._settings.particlesEnabled) return;
        
        const ctx = this._particlesCanvas.getContext('2d');
        const w = this._particlesCanvas.width;
        const h = this._particlesCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const colors = [this._colors.primary, this._colors.secondary, this._colors.accent];
        
        // Get frequency data for particle responsiveness
        const treble = this._dataArray ? this._dataArray.slice(200, 256).reduce((a, b) => a + b, 0) / 56 / 255 : 0;

        this._particles.forEach(p => {
            // Update position
            p.x += p.vx * this._settings.particleSpeed * (1 + treble);
            p.y += p.vy * this._settings.particleSpeed * (1 + treble);

            // Wrap around screen
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = colors[p.colorIndex];
            ctx.globalAlpha = p.opacity * (0.5 + treble * 0.5);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    _drawSpectrum() {
        if (!this._spectrumCanvas || !this._dataArray) return;
        
        const ctx = this._spectrumCanvas.getContext('2d');
        const w = this._spectrumCanvas.width;
        const h = this._spectrumCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const bars = this._settings.spectrumBars;
        const barWidth = (w / bars) - this._settings.spectrumGap;
        const heightScale = this._settings.spectrumHeight / 255;

        // Draw spectrum bars
        for (let i = 0; i < bars; i++) {
            const dataIndex = Math.floor(i * this._dataArray.length / bars);
            const value = this._dataArray[dataIndex];
            const barHeight = value * heightScale;

            const x = i * (w / bars);
            const y = h / 2;

            // Color gradient for bars
            const gradient = ctx.createLinearGradient(0, y - barHeight, 0, y + barHeight);
            gradient.addColorStop(0, this._colors.primary);
            gradient.addColorStop(0.5, this._colors.secondary);
            gradient.addColorStop(1, this._colors.primary);

            ctx.fillStyle = gradient;

            // Glow effect
            if (this._settings.spectrumGlow) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = this._colors.primary;
            }

            // Draw top bar
            ctx.fillRect(x, y - barHeight, barWidth, barHeight);

            // Draw mirrored bottom bar
            if (this._settings.spectrumMirror) {
                ctx.fillRect(x, y, barWidth, barHeight);
            }

            ctx.shadowBlur = 0;
        }
    }

    _pulseLogo() {
        if (!this._dataArray) return;

        const logo = this.querySelector('#vizLogo');
        if (!logo) return;

        // Get bass frequency average
        const bass = this._dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;

        if (bass > 0.7) {
            logo.classList.add('pulsing');
            setTimeout(() => logo.classList.remove('pulsing'), 300);
        }
    }
}

customElements.define('trap-nation-visualizer', TrapNationVisualizer);
