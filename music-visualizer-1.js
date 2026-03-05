// ============================================================
//  TRAP NATION VISUALIZER - Complete Custom Element
//  ✓ CMS Integration
//  ✓ Song Library/Queue
//  ✓ Progress Bar with Seeking
//  ✓ Cover Art as Background
//  ✓ Spectrum Analyzer
//  ✓ Reactive Particles
// ============================================================

class TrapNationVisualizer extends HTMLElement {
    constructor() {
        super();
        this._audio = null;
        this._audioCtx = null;
        this._analyser = null;
        this._dataArray = null;
        this._songs = [];
        this._currentIndex = 0;
        this._isPlaying = false;
        this._volume = 0.8;
        this._seeking = false;
        this._libraryOpen = false;
        this._searchQuery = '';
        this._particles = [];
        this._animationId = null;
        
        this._colors = {
            primary: '#ff0050',
            secondary: '#00f0ff',
            accent: '#ffffff',
            background: '#0a0a0a'
        };
        
        this._settings = {
            spectrumBars: 64,
            spectrumGlow: true,
            particlesEnabled: true,
            backgroundPulse: true
        };
    }

    static get observedAttributes() {
        return ['player-data', 'primary-color', 'secondary-color', 'accent-color', 
                'background-color', 'spectrum-bars', 'spectrum-glow', 'particles-enabled', 'background-pulse'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;
        
        if (name === 'player-data' && newVal) {
            try {
                const data = JSON.parse(newVal);
                this._songs = data.songs || [];
                if (this._songs.length > 0) {
                    this._loadSong(0, false);
                    this._renderLibrary();
                }
            } catch (e) { console.error('[TrapViz]', e); }
        } else if (name === 'primary-color') this._colors.primary = newVal || '#ff0050';
        else if (name === 'secondary-color') this._colors.secondary = newVal || '#00f0ff';
        else if (name === 'accent-color') this._colors.accent = newVal || '#fff';
        else if (name === 'background-color') this._colors.background = newVal || '#0a0a0a';
        else if (name === 'spectrum-bars') this._settings.spectrumBars = parseInt(newVal) || 64;
        else if (name === 'spectrum-glow') this._settings.spectrumGlow = newVal === 'true';
        else if (name === 'particles-enabled') this._settings.particlesEnabled = newVal === 'true';
        else if (name === 'background-pulse') this._settings.backgroundPulse = newVal === 'true';
    }

    connectedCallback() {
        this._injectStyles();
        this._buildDOM();
        this._initAudio();
        this._initCanvases();
        this._initParticles();
        this._bindEvents();
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
trap-nation-visualizer { display:block; width:100%; height:600px; position:relative; background:#0a0a0a; overflow:hidden; font-family:'Rajdhani','Arial Black',sans-serif; }
.viz-container { position:absolute; inset:0; }
.viz-canvas { position:absolute; top:0; left:0; width:100%; height:100%; }
.viz-bg-image { position:absolute; inset:0; background-size:cover; background-position:center; filter:blur(40px) brightness(0.4); transform:scale(1.1); z-index:1; opacity:0; transition:opacity 0.5s; }
.viz-bg-image.active { opacity:1; }
.viz-progress { position:absolute; top:0; left:0; right:0; height:4px; background:rgba(255,255,255,0.1); z-index:30; cursor:pointer; }
.viz-progress-fill { height:100%; background:linear-gradient(90deg,var(--primary,#ff0050),var(--secondary,#00f0ff)); width:0%; position:relative; }
.viz-progress-fill::after { content:''; position:absolute; right:0; top:50%; transform:translateY(-50%); width:12px; height:12px; background:#fff; border-radius:50%; opacity:0; transition:opacity 0.2s; }
.viz-progress:hover .viz-progress-fill::after { opacity:1; }
.viz-time { position:absolute; top:10px; right:20px; color:#fff; font-size:14px; font-family:'Courier New',monospace; z-index:30; text-shadow:0 2px 6px rgba(0,0,0,0.8); }
.viz-info { position:absolute; top:20px; left:50%; transform:translateX(-50%); text-align:center; z-index:20; color:#fff; text-shadow:0 2px 10px rgba(0,0,0,0.8); max-width:80%; }
.viz-title { font-size:32px; font-weight:900; letter-spacing:2px; margin-bottom:8px; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.viz-artist { font-size:18px; font-weight:400; opacity:0.8; }
.viz-controls { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:20; display:flex; gap:12px; align-items:center; background:rgba(0,0,0,0.7); padding:12px 20px; border-radius:50px; backdrop-filter:blur(10px); }
.viz-btn { width:40px; height:40px; border:none; background:rgba(255,255,255,0.1); color:#fff; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.viz-btn:hover { background:rgba(255,255,255,0.2); transform:scale(1.1); }
.viz-btn.play { width:50px; height:50px; background:var(--primary,#ff0050); }
.viz-btn.play:hover { background:var(--secondary,#00f0ff); }
.viz-btn.active { background:var(--primary,#ff0050); }
.viz-btn svg { width:20px; height:20px; fill:currentColor; }
.viz-library { position:absolute; right:0; top:0; bottom:0; width:360px; background:rgba(0,0,0,0.95); backdrop-filter:blur(20px); z-index:40; transform:translateX(100%); transition:transform 0.3s; display:flex; flex-direction:column; }
.viz-library.open { transform:translateX(0); }
.viz-library-header { padding:20px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between; }
.viz-library-title { font-size:20px; font-weight:700; color:#fff; }
.viz-library-close { background:none; border:none; color:#fff; cursor:pointer; padding:8px; }
.viz-library-search { padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.1); }
.viz-search-input { width:100%; padding:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:#fff; font-size:14px; outline:none; }
.viz-search-input::placeholder { color:rgba(255,255,255,0.5); }
.viz-library-body { flex:1; overflow-y:auto; padding:12px; }
.viz-library-body::-webkit-scrollbar { width:6px; }
.viz-library-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.3); border-radius:3px; }
.viz-song-item { display:flex; align-items:center; gap:12px; padding:10px; border-radius:8px; cursor:pointer; transition:background 0.2s; margin-bottom:8px; }
.viz-song-item:hover { background:rgba(255,255,255,0.1); }
.viz-song-item.active { background:rgba(255,0,80,0.2); }
.viz-song-art { width:50px; height:50px; border-radius:6px; object-fit:cover; background:rgba(255,255,255,0.1); }
.viz-song-info { flex:1; min-width:0; }
.viz-song-title { font-size:14px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.viz-song-artist { font-size:12px; color:rgba(255,255,255,0.6); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.viz-song-duration { font-size:12px; color:rgba(255,255,255,0.5); font-family:'Courier New',monospace; }
@media (max-width:768px) { .viz-library { width:100%; } .viz-title { font-size:24px; } .viz-artist { font-size:14px; } }
        `;
        this.appendChild(style);
    }

    _buildDOM() {
        const container = document.createElement('div');
        container.className = 'viz-container';
        container.innerHTML = `
            <div class="viz-bg-image" id="vizBgImage"></div>
            <canvas class="viz-canvas" id="bgCanvas"></canvas>
            <canvas class="viz-canvas" id="particlesCanvas"></canvas>
            <canvas class="viz-canvas" id="spectrumCanvas"></canvas>
            <div class="viz-progress" id="vizProgress"><div class="viz-progress-fill" id="vizProgressFill"></div></div>
            <div class="viz-time" id="vizTime">0:00 / 0:00</div>
            <div class="viz-info"><div class="viz-title" id="vizTitle">TRAP NATION</div><div class="viz-artist" id="vizArtist">Select a song</div></div>
            <div class="viz-controls">
                <button class="viz-btn" id="libraryBtn" title="Library"><svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zm17-4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/></svg></button>
                <button class="viz-btn" id="prevBtn" title="Previous"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
                <button class="viz-btn play" id="playBtn" title="Play"><svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>
                <button class="viz-btn" id="nextBtn" title="Next"><svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
            </div>
            <div class="viz-library" id="vizLibrary">
                <div class="viz-library-header"><div class="viz-library-title">Song Library</div><button class="viz-library-close" id="libraryCloseBtn"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
                <div class="viz-library-search"><input type="text" class="viz-search-input" id="vizSearchInput" placeholder="Search songs..."></div>
                <div class="viz-library-body" id="vizLibraryBody"></div>
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
        this._audio.addEventListener('timeupdate', () => this._onTimeUpdate());
        this._audio.addEventListener('loadedmetadata', () => this._onMetadata());

        try {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this._analyser = this._audioCtx.createAnalyser();
            this._analyser.fftSize = 512;
            this._analyser.smoothingTimeConstant = 0.8;
            this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
            const source = this._audioCtx.createMediaElementSource(this._audio);
            source.connect(this._analyser);
            this._analyser.connect(this._audioCtx.destination);
        } catch (e) { console.warn('[TrapViz] Web Audio unavailable'); }
    }

    _initCanvases() {
        const resize = () => {
            ['bgCanvas', 'particlesCanvas', 'spectrumCanvas'].forEach(id => {
                const canvas = this.querySelector(`#${id}`);
                if (canvas) { canvas.width = this.offsetWidth; canvas.height = this.offsetHeight; }
            });
        };
        resize();
        window.addEventListener('resize', resize);
    }

    _initParticles() {
        for (let i = 0; i < 100; i++) {
            this._particles.push({
                x: Math.random() * this.offsetWidth,
                y: Math.random() * this.offsetHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                colorIndex: Math.floor(Math.random() * 3)
            });
        }
    }

    _bindEvents() {
        const $ = (id) => this.querySelector(`#${id}`);
        const playBtn = $('playBtn'), prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
        const libraryBtn = $('libraryBtn'), closeBtn = $('libraryCloseBtn');
        const searchInput = $('vizSearchInput'), progress = $('vizProgress');

        if (playBtn) playBtn.addEventListener('click', () => this._togglePlay());
        if (prevBtn) prevBtn.addEventListener('click', () => this._prev());
        if (nextBtn) nextBtn.addEventListener('click', () => this._next());
        if (libraryBtn) libraryBtn.addEventListener('click', () => this._toggleLibrary());
        if (closeBtn) closeBtn.addEventListener('click', () => this._toggleLibrary());
        if (searchInput) searchInput.addEventListener('input', (e) => { this._searchQuery = e.target.value.toLowerCase(); this._renderLibrary(); });
        if (progress) progress.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            if (this._audio && this._audio.duration) this._audio.currentTime = percent * this._audio.duration;
        });
    }

    _loadSong(index, autoPlay = true) {
        if (!this._songs[index]) return;
        this._currentIndex = index;
        const song = this._songs[index];
        
        if (this._audio && song.audioFile) {
            this._audio.src = song.audioFile;
            this._audio.load();
            if (autoPlay) {
                if (this._audioCtx && this._audioCtx.state === 'suspended') this._audioCtx.resume();
                this._audio.play().catch(e => console.warn('Play error:', e));
            }
        }

        const title = this.querySelector('#vizTitle');
        const artist = this.querySelector('#vizArtist');
        const bgImage = this.querySelector('#vizBgImage');
        
        if (title) title.textContent = song.title || 'UNKNOWN';
        if (artist) artist.textContent = song.artist || '—';
        if (bgImage && song.coverImage) {
            bgImage.style.backgroundImage = `url('${song.coverImage}')`;
            bgImage.classList.add('active');
        }
        this._renderLibrary();
    }

    _togglePlay() {
        if (!this._audio) return;
        if (this._songs.length === 0) { this._toggleLibrary(); return; }
        if (this._audio.paused) {
            if (this._audioCtx && this._audioCtx.state === 'suspended') this._audioCtx.resume();
            this._audio.play().catch(e => console.warn('Play error:', e));
        } else this._audio.pause();
    }

    _prev() {
        if (!this._songs.length) return;
        const index = (this._currentIndex - 1 + this._songs.length) % this._songs.length;
        this._loadSong(index, this._isPlaying);
    }

    _next() {
        if (!this._songs.length) return;
        const index = (this._currentIndex + 1) % this._songs.length;
        this._loadSong(index, this._isPlaying);
    }

    _toggleLibrary() {
        this._libraryOpen = !this._libraryOpen;
        const library = this.querySelector('#vizLibrary');
        const btn = this.querySelector('#libraryBtn');
        if (library) library.classList.toggle('open', this._libraryOpen);
        if (btn) btn.classList.toggle('active', this._libraryOpen);
    }

    _renderLibrary() {
        const body = this.querySelector('#vizLibraryBody');
        if (!body) return;

        const filtered = this._songs.filter(s => {
            if (!this._searchQuery) return true;
            const t = (s.title || '').toLowerCase();
            const a = (s.artist || '').toLowerCase();
            return t.includes(this._searchQuery) || a.includes(this._searchQuery);
        });

        if (filtered.length === 0) {
            body.innerHTML = '<div style="padding:40px 20px;text-align:center;color:rgba(255,255,255,0.5)">No songs found</div>';
            return;
        }

        body.innerHTML = filtered.map(song => {
            const idx = this._songs.indexOf(song);
            const active = idx === this._currentIndex;
            return `<div class="viz-song-item ${active?'active':''}" data-index="${idx}">
                <img class="viz-song-art" src="${song.coverImage||''}" alt="">
                <div class="viz-song-info">
                    <div class="viz-song-title">${this._esc(song.title||'Unknown')}</div>
                    <div class="viz-song-artist">${this._esc(song.artist||'—')}</div>
                </div>
                <div class="viz-song-duration">${song.duration||''}</div>
            </div>`;
        }).join('');

        body.querySelectorAll('.viz-song-item').forEach(item => {
            item.addEventListener('click', () => {
                this._loadSong(parseInt(item.dataset.index), true);
                this._toggleLibrary();
            });
        });
    }

    _onTimeUpdate() {
        if (!this._audio || this._seeking) return;
        const current = this._audio.currentTime, duration = this._audio.duration;
        if (isNaN(duration)) return;
        const fill = this.querySelector('#vizProgressFill');
        const time = this.querySelector('#vizTime');
        if (fill) fill.style.width = ((current / duration) * 100) + '%';
        if (time) time.textContent = `${this._fmt(current)} / ${this._fmt(duration)}`;
    }

    _onMetadata() {
        const time = this.querySelector('#vizTime');
        if (time && this._audio.duration) time.textContent = `0:00 / ${this._fmt(this._audio.duration)}`;
    }

    _onPlay() {
        this._isPlaying = true;
        const play = this.querySelector('#playIcon'), pause = this.querySelector('#pauseIcon');
        if (play) play.style.display = 'none';
        if (pause) pause.style.display = 'block';
    }

    _onPause() {
        this._isPlaying = false;
        const play = this.querySelector('#playIcon'), pause = this.querySelector('#pauseIcon');
        if (play) play.style.display = 'block';
        if (pause) pause.style.display = 'none';
    }

    _fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    _esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    _startAnimation() {
        const animate = () => {
            this._animationId = requestAnimationFrame(animate);
            if (this._analyser && this._dataArray) this._analyser.getByteFrequencyData(this._dataArray);
            this._drawBackground();
            this._drawParticles();
            this._drawSpectrum();
        };
        animate();
    }

    _drawBackground() {
        const canvas = this.querySelector('#bgCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h)/2);
        grad.addColorStop(0, this._colors.background);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        if (this._settings.backgroundPulse && this._dataArray) {
            const bass = this._dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5 / 255;
            ctx.globalAlpha = bass * 0.3;
            const pulse = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            pulse.addColorStop(0, this._colors.primary);
            pulse.addColorStop(1, 'transparent');
            ctx.fillStyle = pulse;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }

    _drawParticles() {
        if (!this._settings.particlesEnabled) return;
        const canvas = this.querySelector('#particlesCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const colors = [this._colors.primary, this._colors.secondary, this._colors.accent];
        const treble = this._dataArray ? this._dataArray.slice(200, 256).reduce((a, b) => a + b, 0) / 56 / 255 : 0;

        this._particles.forEach(p => {
            p.x += p.vx * (1 + treble);
            p.y += p.vy * (1 + treble);
            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = colors[p.colorIndex];
            ctx.globalAlpha = p.opacity * (0.5 + treble * 0.5);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    _drawSpectrum() {
        const canvas = this.querySelector('#spectrumCanvas');
        if (!canvas || !this._dataArray) return;
        const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const bars = this._settings.spectrumBars;
        const barWidth = (w / bars) - 2;

        for (let i = 0; i < bars; i++) {
            const dataIndex = Math.floor(i * this._dataArray.length / bars);
            const value = this._dataArray[dataIndex];
            const barHeight = (value / 255) * 200;
            const x = i * (w / bars), y = h / 2;
            const grad = ctx.createLinearGradient(0, y - barHeight, 0, y + barHeight);
            grad.addColorStop(0, this._colors.primary);
            grad.addColorStop(0.5, this._colors.secondary);
            grad.addColorStop(1, this._colors.primary);
            ctx.fillStyle = grad;
            if (this._settings.spectrumGlow) { ctx.shadowBlur = 20; ctx.shadowColor = this._colors.primary; }
            ctx.fillRect(x, y - barHeight, barWidth, barHeight);
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.shadowBlur = 0;
        }
    }
}

customElements.define('trap-nation-visualizer', TrapNationVisualizer);
