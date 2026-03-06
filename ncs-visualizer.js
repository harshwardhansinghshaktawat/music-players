// ============================================================
//  NCS VISUALIZER + MUSIC PLAYER — Custom Element
//
//  NoCopyrightSounds-inspired circular spectrum visualizer
//  with song info panel, social links, and music player controls.
//
//  Layout: Left side = Song info + social links
//          Right side = Circular spectrum visualizer
//          Bottom = Player controls strip
//
//  Follows the same Wix Blocks custom element pattern:
//  - observedAttributes = kebab-case flat attrs
//  - attributeChangedCallback → _applyStyles() → CSS vars
//  - Widget sets individual attrs via wixWidget.setProps
// ============================================================

class NCSVisualizer extends HTMLElement {

    constructor() {
        super();

        // ── Audio ──────────────────────────────────────────────
        this._aC          = null;
        this._vizAnalyser = null;
        this._beatAnalyser= null;
        this._srcNode     = null;
        this._vizData     = null;
        this._beatData    = null;
        this._bufLen      = 0;
        this._live        = false;

        // ── Beat state ─────────────────────────────────────────
        this._kickTimestamps = [];
        this._detectedBPM    = 0;
        this._songDuration   = 0;
        this._micMode        = false;
        this._nextKickIdx    = 0;
        this._kickStrength   = 0;
        this._bgPulse        = 0;
        this._kickEnv        = 0;
        this._bgEnv          = 0;

        // ── RT beat detection ──────────────────────────────────
        this._rtHistory   = new Float32Array(60);
        this._rtIdx       = 0;
        this._rtFilled    = false;
        this._rtWarmup    = 0;
        this._rtCooldown  = 0;

        // ── Spectrum data ──────────────────────────────────────
        this._specBars    = 64;  // number of bars in the circular spectrum
        this._specSmooth  = new Float32Array(64);

        // ── Dimensions ─────────────────────────────────────────
        this._W = 800; this._H = 600;

        // ── Player state ───────────────────────────────────────
        this._songs       = [];
        this._currentSong = 0;
        this._isPlaying   = false;
        this._volume      = 0.8;
        this._lastVolume  = 0.8;
        this._shuffle     = false;
        this._repeat      = 'none';
        this._drawerOpen  = false;
        this._searchQuery = '';

        // ── UI auto-hide ───────────────────────────────────────
        this._uiVisible = true;
        this._hideTimer = null;

        // ── Particles ──────────────────────────────────────────
        this._particles       = [];
        this._particleMaxSize = 1.2;
        this._particleSpeed   = 1.0;

        // ── Misc ───────────────────────────────────────────────
        this._animId       = null;
        this._bgImg        = null;
        this._bgReady      = false;
        this._coverImg     = null;
        this._coverReady   = false;
        this._domReady     = false;
        this._audioEl      = null;
        this._srcConnected = false;

        // ── Default colour scheme ──────────────────────────────
        this._S = {
            c1: '#00e5ff',   // primary / spectrum bars
            c2: '#7c4dff',   // secondary / accent
            c3: '#ffffff',   // tertiary / text highlights
            glow: '#00e5ff', // glow colour
            bgTint: '#0a0a12' // background tint
        };

        // ── Panel-controlled settings ──────────────────────────
        this._circleScale   = 1.0;
        this._bgMode        = 'random';
        this._rtSens        = 1.35;
        this._specBarCount  = 64;
        this._specBarWidth  = 3.0;
        this._showSocialLinks = true;

        // ── Ken Burns ──────────────────────────────────────────
        this._kbX = 0; this._kbY = 0; this._kbS = 1.04;
        this._kbTX = 8; this._kbTY = -6; this._kbTS = 1.06; this._kbTick = 0;

        // ── Precision timing anchor ────────────────────────────
        this._playbackAnchorAC   = 0;
        this._playbackAnchorSong = 0;
    }

    // ──────────────────────────────────────────────────────────
    //  OBSERVED ATTRIBUTES
    // ──────────────────────────────────────────────────────────
    static get observedAttributes() {
        return [
            'player-data',
            'primary-color',
            'secondary-color',
            'tertiary-color',
            'glow-color',
            'bg-tint-color',
            'particle-size',
            'particle-speed',
            'font-family',
            'circle-scale',
            'bg-mode',
            'beat-threshold',
            'spec-bar-count',
            'spec-bar-width',
            'show-social-links'
        ];
    }

    // ──────────────────────────────────────────────────────────
    //  ATTRIBUTE CHANGED CALLBACK
    // ──────────────────────────────────────────────────────────
    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;

        if (name === 'player-data' && newVal) {
            try {
                const data = JSON.parse(newVal);
                this._songs = data.songs || [];
                if (this._domReady && this._songs.length > 0) {
                    this._loadSong(0, false);
                    this._renderDrawer();
                }
            } catch (e) { console.error('[NCS] player-data parse error:', e); }
            return;
        }

        if (name === 'particle-size') { this._particleMaxSize = parseFloat(newVal) || 1.2; this._rebuildParticles(); return; }
        if (name === 'particle-speed') { this._particleSpeed = parseFloat(newVal) || 1.0; this._rebuildParticles(); return; }
        if (name === 'circle-scale') { this._circleScale = parseFloat(newVal) || 1.0; this._resize(); return; }
        if (name === 'bg-mode') { this._bgMode = newVal || 'random'; if (this._bgMode === 'cover') this._loadBGAsCover(); else this._loadBGRandom(); return; }
        if (name === 'beat-threshold') { this._rtSens = parseFloat(newVal) || 1.35; return; }
        if (name === 'spec-bar-count') {
            this._specBarCount = parseInt(newVal) || 64;
            this._specBars = this._specBarCount;
            this._specSmooth = new Float32Array(this._specBars);
            return;
        }
        if (name === 'spec-bar-width') { this._specBarWidth = parseFloat(newVal) || 3.0; return; }
        if (name === 'show-social-links') {
            this._showSocialLinks = newVal !== 'false';
            this._updateSongInfoUI(this._songs[this._currentSong]);
            return;
        }

        this._applyStyles();
    }

    // ──────────────────────────────────────────────────────────
    //  _applyStyles()
    // ──────────────────────────────────────────────────────────
    _applyStyles() {
        const c1     = this.getAttribute('primary-color')   || '#00e5ff';
        const c2     = this.getAttribute('secondary-color') || '#7c4dff';
        const c3     = this.getAttribute('tertiary-color')  || '#ffffff';
        const glow   = this.getAttribute('glow-color')      || '#00e5ff';
        const bgTint = this.getAttribute('bg-tint-color')   || '#0a0a12';
        const font   = this.getAttribute('font-family')     || 'Montserrat';

        this._S = { c1, c2, c3, glow, bgTint };

        const wrap = this._wrap;
        if (!wrap) return;
        wrap.style.setProperty('--c1', c1);
        wrap.style.setProperty('--c2', c2);
        wrap.style.setProperty('--c3', c3);
        wrap.style.setProperty('--glow', glow);
        wrap.style.setProperty('--bg-tint', bgTint);
        wrap.style.setProperty('--font', `'${font}', 'Montserrat', sans-serif`);
    }

    // ──────────────────────────────────────────────────────────
    //  LIFECYCLE
    // ──────────────────────────────────────────────────────────
    connectedCallback() {
        this.style.display  = 'block';
        this.style.position = 'relative';
        this.style.overflow = 'hidden';

        this._buildDOM();
        this._setupResizeObserver();
        this._loadBGImage();
        this._buildParticles();
        this._bindUIEvents();
        this._startLoop();
        this._domReady = true;
        this._applyStyles();

        if (this._songs.length > 0) {
            this._loadSong(0, false);
            this._renderDrawer();
        }
    }

    disconnectedCallback() {
        if (this._animId)    cancelAnimationFrame(this._animId);
        if (this._audioEl)   this._audioEl.pause();
        if (this._ro)        this._ro.disconnect();
        if (this._hideTimer) clearTimeout(this._hideTimer);
    }

    // ──────────────────────────────────────────────────────────
    //  BUILD DOM
    // ──────────────────────────────────────────────────────────
    _buildDOM() {
        this.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap');

.ncs-wrap {
    position: absolute; inset: 0;
    background: var(--bg-tint, #0a0a12);
    overflow: hidden;
    font-family: var(--font, 'Montserrat', sans-serif);
    cursor: none;
    --c1: #00e5ff; --c2: #7c4dff; --c3: #ffffff;
    --glow: #00e5ff; --bg-tint: #0a0a12;
}
.ncs-wrap.ui-visible { cursor: default; }

.ncs-canvas-bg, .ncs-canvas-main {
    position: absolute; top: 0; left: 0; display: block; pointer-events: none;
}

/* ── Song Info Overlay (left side) ── */
.ncs-info-panel {
    position: absolute; top: 0; left: 0; bottom: 88px;
    width: 45%; min-width: 280px;
    display: flex; flex-direction: column; justify-content: center;
    padding: 40px 40px 40px 50px;
    z-index: 40; pointer-events: none;
    transition: opacity 0.5s ease;
}
.ncs-info-panel > * { pointer-events: auto; }

.ncs-genre-tag {
    display: inline-block;
    padding: 4px 14px;
    border: 1px solid var(--c1);
    border-radius: 2px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--c1);
    margin-bottom: 18px;
    font-family: 'Rajdhani', var(--font, 'Montserrat'), sans-serif;
    width: fit-content;
}

.ncs-song-title-big {
    font-size: clamp(24px, 4vw, 52px);
    font-weight: 900;
    color: #fff;
    line-height: 1.05;
    letter-spacing: -0.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
    text-shadow: 0 0 40px rgba(0,0,0,0.6);
    font-family: 'Rajdhani', var(--font, 'Montserrat'), sans-serif;
}

.ncs-artist-big {
    font-size: clamp(14px, 2vw, 22px);
    font-weight: 300;
    color: rgba(255,255,255,0.65);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-family: 'Rajdhani', var(--font, 'Montserrat'), sans-serif;
}

.ncs-album-info {
    font-size: 11px;
    font-weight: 400;
    color: rgba(255,255,255,0.35);
    letter-spacing: 1.5px;
    margin-bottom: 28px;
    font-family: var(--font, 'Montserrat'), sans-serif;
}

/* Social links row */
.ncs-social-links {
    display: flex; flex-wrap: wrap; gap: 8px;
    margin-bottom: 22px;
}
.ncs-social-link {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50%;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
}
.ncs-social-link:hover {
    border-color: var(--c1);
    color: var(--c1);
    background: rgba(255,255,255,0.04);
    box-shadow: 0 0 14px var(--glow);
    transform: translateY(-2px);
}
.ncs-social-link svg { width: 16px; height: 16px; fill: currentColor; }

/* Stream links */
.ncs-stream-links {
    display: flex; flex-wrap: wrap; gap: 10px;
    margin-top: 4px;
}
.ncs-stream-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 16px;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 4px;
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.70);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
    font-family: var(--font, 'Montserrat'), sans-serif;
}
.ncs-stream-btn:hover {
    border-color: var(--c1);
    color: #fff;
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 16px rgba(0,0,0,0.3);
}
.ncs-stream-btn svg { width: 14px; height: 14px; fill: currentColor; }

/* Buy/Download button */
.ncs-buy-btn {
    border-color: var(--c1) !important;
    color: var(--c1) !important;
    background: rgba(0,229,255,0.06) !important;
}
.ncs-buy-btn:hover {
    background: var(--c1) !important;
    color: #000 !important;
}

/* ── Bottom Strip (Player Controls) ── */
.ncs-strip {
    position: absolute; bottom: 0; left: 0; right: 0; height: 88px;
    background: linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.75) 70%, transparent 100%);
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 0 24px 10px; gap: 7px; z-index: 50;
    transition: opacity 0.5s ease, transform 0.5s ease;
}
.ncs-strip.hidden { opacity: 0; transform: translateY(18px); pointer-events: none; }

.ncs-progress-row { display: flex; align-items: center; gap: 10px; }
.ncs-progress-bar {
    flex: 1; height: 3px; background: rgba(255,255,255,0.10);
    border-radius: 2px; cursor: pointer; position: relative;
}
.ncs-progress-fill {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, var(--c1), var(--c2));
    border-radius: 2px; transition: width 0.1s linear; position: relative;
}
.ncs-progress-fill::after {
    content: ''; position: absolute; right: -5px; top: 50%; transform: translateY(-50%);
    width: 10px; height: 10px; background: #fff; border-radius: 50%;
    opacity: 0; transition: opacity 0.2s; box-shadow: 0 0 8px var(--c1);
}
.ncs-progress-bar:hover .ncs-progress-fill::after { opacity: 1; }

.ncs-time {
    font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 1px;
    flex-shrink: 0; font-variant-numeric: tabular-nums;
    font-family: 'Rajdhani', var(--font), sans-serif; font-weight: 600;
}

.ncs-controls-row { display: flex; align-items: center; gap: 8px; }
.ncs-song-info-strip { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ncs-song-title-strip {
    font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 1.5px;
    text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-family: 'Rajdhani', var(--font), sans-serif;
}
.ncs-song-artist-strip {
    font-size: 10px; color: rgba(255,255,255,0.40); letter-spacing: 1.5px;
    text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-family: var(--font), sans-serif; font-weight: 400;
}

.ncs-controls { display: flex; align-items: center; gap: 3px; }
.ncs-btn {
    width: 36px; height: 36px; border: none; background: transparent;
    color: rgba(255,255,255,0.60); cursor: pointer; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s; padding: 0; flex-shrink: 0;
}
.ncs-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }
.ncs-btn.active { color: var(--c1); }
.ncs-btn svg { width: 18px; height: 18px; fill: currentColor; }

.ncs-play-btn {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--c1), var(--c2));
    color: #fff !important;
    box-shadow: 0 0 22px var(--glow), 0 4px 16px rgba(0,0,0,0.4);
}
.ncs-play-btn:hover { transform: scale(1.08); filter: brightness(1.15); }
.ncs-play-btn svg { fill: #fff; }

.ncs-vol { display: flex; align-items: center; gap: 6px; }
.ncs-vol-slider {
    -webkit-appearance: none; appearance: none; width: 70px; height: 3px;
    background: rgba(255,255,255,0.12); border-radius: 2px; outline: none; cursor: pointer;
}
.ncs-vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 10px; height: 10px;
    background: var(--c1); border-radius: 50%; cursor: pointer;
}
.ncs-vol-slider::-moz-range-thumb {
    width: 10px; height: 10px; background: var(--c1); border: none; border-radius: 50%;
}

/* ── Queue Drawer ── */
.ncs-drawer {
    position: absolute; bottom: 93px; right: 12px; width: 320px; max-height: 420px;
    background: rgba(8,8,16,0.96); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; backdrop-filter: blur(24px);
    display: flex; flex-direction: column; z-index: 60;
    transform: translateY(14px); opacity: 0; pointer-events: none;
    transition: transform 0.28s, opacity 0.28s;
    box-shadow: 0 12px 48px rgba(0,0,0,0.9);
}
.ncs-drawer.open { transform: translateY(0); opacity: 1; pointer-events: all; }
.ncs-drawer-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.ncs-drawer-title {
    font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    color: var(--c1); font-family: 'Rajdhani', var(--font), sans-serif;
}
.ncs-drawer-search {
    display: flex; align-items: center; gap: 8px; padding: 8px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.ncs-drawer-search svg { width: 13px; height: 13px; fill: rgba(255,255,255,0.25); flex-shrink: 0; }
.ncs-search-input {
    flex: 1; background: transparent; border: none; outline: none; color: #fff;
    font-size: 11px; letter-spacing: 1px; font-family: var(--font), sans-serif;
}
.ncs-search-input::placeholder { color: rgba(255,255,255,0.18); }
.ncs-drawer-body { flex: 1; overflow-y: auto; padding: 5px; }
.ncs-drawer-body::-webkit-scrollbar { width: 3px; }
.ncs-drawer-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

.ncs-queue-song {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    border-radius: 6px; cursor: pointer; transition: background 0.18s;
}
.ncs-queue-song:hover { background: rgba(255,255,255,0.04); }
.ncs-queue-song.active { background: rgba(255,255,255,0.07); }
.ncs-queue-num {
    font-size: 10px; color: rgba(255,255,255,0.22); width: 18px; text-align: center;
    flex-shrink: 0; font-family: 'Rajdhani', monospace; font-weight: 600;
}
.ncs-queue-song.active .ncs-queue-num { color: var(--c1); }
.ncs-queue-art { width: 36px; height: 36px; border-radius: 4px; overflow: hidden; background: #111; flex-shrink: 0; }
.ncs-queue-art img { width: 100%; height: 100%; object-fit: cover; }
.ncs-queue-info { flex: 1; min-width: 0; }
.ncs-queue-title {
    font-size: 11px; font-weight: 700; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-family: 'Rajdhani', var(--font), sans-serif;
}
.ncs-queue-song.active .ncs-queue-title { color: var(--c1); }
.ncs-queue-artist {
    font-size: 10px; color: rgba(255,255,255,0.32); letter-spacing: 1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-family: var(--font), sans-serif;
}
.ncs-queue-dur { font-size: 10px; color: rgba(255,255,255,0.22); flex-shrink: 0; font-family: 'Rajdhani', monospace; }
.ncs-queue-empty {
    padding: 30px 16px; text-align: center; color: rgba(255,255,255,0.18);
    font-size: 10px; letter-spacing: 2px; font-family: var(--font), sans-serif;
}

/* ── BPM badge ── */
.ncs-bpm-badge {
    position: absolute; top: 20px; right: 24px;
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    color: rgba(255,255,255,0.25);
    font-family: 'Rajdhani', monospace;
    z-index: 45;
    transition: opacity 0.3s;
}

@media (max-width: 600px) {
    .ncs-info-panel { width: 100%; min-width: unset; padding: 20px 20px 20px 20px; justify-content: flex-start; padding-top: 30px; }
    .ncs-song-title-big { font-size: 22px; }
    .ncs-artist-big { font-size: 14px; }
    .ncs-vol { display: none; }
    .ncs-drawer { width: calc(100% - 24px); right: 12px; }
    .ncs-stream-links { gap: 6px; }
    .ncs-stream-btn { padding: 6px 10px; font-size: 9px; }
}
</style>

<div class="ncs-wrap" id="ncsWrap">
    <canvas class="ncs-canvas-bg"   id="ncsBgC"></canvas>
    <canvas class="ncs-canvas-main" id="ncsMc"></canvas>

    <div class="ncs-bpm-badge" id="ncsBPM"></div>

    <div class="ncs-info-panel" id="ncsInfoPanel">
        <div class="ncs-genre-tag" id="ncsGenre">ELECTRONIC</div>
        <div class="ncs-song-title-big" id="ncsTitleBig">NO TRACK LOADED</div>
        <div class="ncs-artist-big" id="ncsArtistBig">—</div>
        <div class="ncs-album-info" id="ncsAlbumInfo"></div>
        <div class="ncs-social-links" id="ncsSocialLinks"></div>
        <div class="ncs-stream-links" id="ncsStreamLinks"></div>
    </div>

    <div class="ncs-strip" id="ncsStrip">
        <div class="ncs-progress-row">
            <span class="ncs-time" id="ncsCurTime">0:00</span>
            <div class="ncs-progress-bar" id="ncsProgressBar">
                <div class="ncs-progress-fill" id="ncsProgressFill"></div>
            </div>
            <span class="ncs-time" id="ncsTotalTime">0:00</span>
        </div>
        <div class="ncs-controls-row">
            <div class="ncs-song-info-strip">
                <div class="ncs-song-title-strip" id="ncsSongTitle">NO TRACK LOADED</div>
                <div class="ncs-song-artist-strip" id="ncsSongArtist">—</div>
            </div>
            <div class="ncs-controls">
                <button class="ncs-btn" id="ncsShuffleBtn" title="Shuffle">
                    <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                </button>
                <button class="ncs-btn" id="ncsPrevBtn" title="Previous">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button class="ncs-btn ncs-play-btn" id="ncsPlayBtn" title="Play/Pause">
                    <svg id="ncsPlayIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="ncsPauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button class="ncs-btn" id="ncsNextBtn" title="Next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
                <button class="ncs-btn" id="ncsRepeatBtn" title="Repeat">
                    <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                </button>
            </div>
            <div class="ncs-vol">
                <button class="ncs-btn" id="ncsVolBtn" title="Mute">
                    <svg id="ncsVolIcon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    <svg id="ncsMuteIcon" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                </button>
                <input type="range" class="ncs-vol-slider" id="ncsVolSlider" min="0" max="1" step="0.01" value="0.8">
            </div>
            <button class="ncs-btn" id="ncsQueueBtn" title="Queue">
                <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zm17-4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/></svg>
            </button>
        </div>
    </div>

    <div class="ncs-drawer" id="ncsDrawer">
        <div class="ncs-drawer-header">
            <span class="ncs-drawer-title">Queue</span>
            <button class="ncs-btn" id="ncsDrawerClose" style="width:26px;height:26px">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        </div>
        <div class="ncs-drawer-search">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" class="ncs-search-input" id="ncsSearch" placeholder="Search songs...">
        </div>
        <div class="ncs-drawer-body" id="ncsDrawerBody"></div>
    </div>
</div>`;

        this._wrap  = this.querySelector('#ncsWrap');
        this._bgC   = this.querySelector('#ncsBgC');
        this._mc    = this.querySelector('#ncsMc');
        this._off1  = document.createElement('canvas');
        this._bg    = this._bgC.getContext('2d');
        this._ctx   = this._mc.getContext('2d');
        this._o1    = this._off1.getContext('2d');

        this._audioEl = document.createElement('audio');
        this._audioEl.crossOrigin = 'anonymous';
        this._audioEl.addEventListener('timeupdate',     () => this._onTimeUpdate());
        this._audioEl.addEventListener('loadedmetadata', () => this._onMetadata());
        this._audioEl.addEventListener('ended',          () => this._onEnded());
        this._audioEl.addEventListener('play',           () => this._onPlay());
        this._audioEl.addEventListener('pause',          () => this._onPause());
    }

    _setupResizeObserver() {
        this._ro = new ResizeObserver(() => this._resize());
        this._ro.observe(this);
        this._resize();
    }

    _resize() {
        this._W = this.offsetWidth  || 800;
        this._H = this.offsetHeight || 600;
        [this._bgC, this._mc, this._off1].forEach(c => { c.width = this._W; c.height = this._H; });
        this._bgC.style.width  = this._W + 'px';
        this._bgC.style.height = this._H + 'px';
        this._mc.style.width   = this._W + 'px';
        this._mc.style.height  = this._H + 'px';
    }

    // ── Background loading ──

    _loadBGRandom() {
        this._bgImg = new Image();
        this._bgImg.crossOrigin = 'anonymous';
        const seed = Math.floor(Math.random() * 200) + 1;
        this._bgImg.src = `https://picsum.photos/1920/1080?random=${seed}`;
        this._bgImg.onload = () => { this._bgReady = true; };
    }

    _loadBGAsCover() {
        const song = this._songs[this._currentSong];
        if (song && song.coverImage) {
            this._bgImg = new Image();
            this._bgImg.crossOrigin = 'anonymous';
            this._bgImg.src = song.coverImage;
            this._bgImg.onload = () => { this._bgReady = true; };
            this._bgReady = false;
        }
    }

    _loadBGImage() {
        if (this._bgMode === 'cover') this._loadBGAsCover();
        else this._loadBGRandom();
    }

    _updateCover(song) {
        if (song && song.coverImage) {
            this._coverImg = new Image();
            this._coverImg.crossOrigin = 'anonymous';
            this._coverImg.src = song.coverImage;
            this._coverImg.onload = () => { this._coverReady = true; };
            this._coverReady = false;
            if (this._bgMode === 'cover') this._loadBGAsCover();
        } else {
            this._coverImg = null; this._coverReady = false;
        }
    }

    // ── PARTICLES ──

    _buildParticles() {
        this._particles = Array.from({ length: 280 }, () => this._newParticle(true));
    }

    _rebuildParticles() {
        if (this._domReady)
            this._particles = Array.from({ length: 280 }, () => this._newParticle(true));
    }

    _newParticle(init = false) {
        return {
            x: Math.random() * this._W,
            y: Math.random() * this._H,
            vx: (Math.random() - 0.5) * 0.3 * this._particleSpeed,
            vy: -0.15 - Math.random() * 0.5 * this._particleSpeed,
            sz: 0.4 + Math.random() * this._particleMaxSize,
            op: 0.1 + Math.random() * 0.4,
            life: init ? Math.random() : 1.0,
            decay: 0.0005 + Math.random() * 0.001
        };
    }

    _updateParticle(p) {
        p.x += p.vx + this._kickStrength * (Math.random() - 0.5) * 3.0;
        p.y += p.vy - this._kickStrength * 1.5;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > this._W + 10) {
            Object.assign(p, this._newParticle(false));
            p.y = this._H + 5;
        }
    }

    _drawParticle(p) {
        const ctx = this._ctx;
        const alp = p.op * p.life;
        if (alp < 0.01) return;
        const r = Math.max(p.sz * 1.5, 0.3);
        ctx.save();
        ctx.globalAlpha = alp;
        ctx.fillStyle = this._S.c1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this._S.glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── AUDIO INIT ──

    _initAudio() {
        if (this._aC) return;
        this._aC = new (window.AudioContext || window.webkitAudioContext)();
        this._vizAnalyser = this._aC.createAnalyser();
        this._vizAnalyser.fftSize = 4096;
        this._vizAnalyser.smoothingTimeConstant = 0.0;
        this._bufLen  = this._vizAnalyser.frequencyBinCount;
        this._vizData = new Uint8Array(this._bufLen);
        this._beatAnalyser = this._aC.createAnalyser();
        this._beatAnalyser.fftSize = 2048;
        this._beatAnalyser.smoothingTimeConstant = 0.4;
        this._beatData = new Uint8Array(this._beatAnalyser.frequencyBinCount);
    }

    // ── OFFLINE BEAT ANALYSIS ──

    _getPeaksAtThreshold(data, threshold, sampleRate) {
        const peaks = [], skip = Math.floor(sampleRate * 0.23);
        let i = 0;
        while (i < data.length) { if (Math.abs(data[i]) > threshold) { peaks.push(i); i += skip; } i++; }
        return peaks;
    }

    _countIntervalsBetweenNearbyPeaks(peaks) {
        const counts = [];
        peaks.forEach((peak, idx) => {
            for (let i = 1; i <= 10; i++) {
                if (idx + i >= peaks.length) break;
                const interval = peaks[idx + i] - peak;
                const found = counts.find(c => c.interval === interval);
                if (found) found.count++; else counts.push({ interval, count: 1 });
            }
        });
        return counts;
    }

    _groupNeighborsByTempo(intervalCounts, sampleRate) {
        const tempos = [];
        intervalCounts.forEach(ic => {
            if (ic.interval === 0) return;
            let bpm = 60 / (ic.interval / sampleRate);
            while (bpm < 80)  bpm *= 2;
            while (bpm > 180) bpm /= 2;
            bpm = Math.round(bpm * 10) / 10;
            const found = tempos.find(t => Math.abs(t.tempo - bpm) < 1.0);
            if (found) found.count += ic.count; else tempos.push({ tempo: bpm, count: ic.count });
        });
        return tempos.sort((a, b) => b.count - a.count);
    }

    async _analyzeFile(audioBuffer) {
        const sr = audioBuffer.sampleRate;
        const offCtx = new OfflineAudioContext(1, audioBuffer.length, sr);
        const src = offCtx.createBufferSource();
        src.buffer = audioBuffer;
        const lpf = offCtx.createBiquadFilter();
        lpf.type = 'lowpass'; lpf.frequency.value = 150; lpf.Q.value = 0.8;
        src.connect(lpf); lpf.connect(offCtx.destination); src.start(0);
        const rendered = await offCtx.startRendering();
        const raw = rendered.getChannelData(0);
        let peak = 0;
        for (let i = 0; i < raw.length; i++) if (Math.abs(raw[i]) > peak) peak = Math.abs(raw[i]);
        const norm = new Float32Array(raw.length);
        if (peak > 0) for (let i = 0; i < raw.length; i++) norm[i] = raw[i] / peak;

        const startThr = Math.min(0.85, Math.max(0.30, 0.75 - (1.35 - this._rtSens) * 0.30));
        const thrSteps = [];
        for (let t = startThr; t >= 0.30; t = Math.round((t - 0.05) * 100) / 100) thrSteps.push(t);

        let peaks = [];
        for (const thr of thrSteps) { peaks = this._getPeaksAtThreshold(norm, thr, sr); if (peaks.length >= 20) break; }
        if (peaks.length < 4) { this._micMode = false; this._kickTimestamps = []; this._detectedBPM = 0; return; }

        const intervals = this._countIntervalsBetweenNearbyPeaks(peaks);
        const tempos    = this._groupNeighborsByTempo(intervals, sr);
        this._detectedBPM    = tempos.length > 0 ? tempos[0].tempo : 0;
        this._kickTimestamps = peaks.map(p => p / sr).sort((a, b) => a - b);

        // Update BPM badge
        const bpmEl = this.querySelector('#ncsBPM');
        if (bpmEl && this._detectedBPM > 0) bpmEl.textContent = `${Math.round(this._detectedBPM)} BPM`;
    }

    // ── BEAT STATE ──

    _clearBeatState() {
        this._kickTimestamps = []; this._nextKickIdx = 0; this._detectedBPM = 0; this._micMode = false;
        this._kickStrength = 0; this._bgPulse = 0; this._kickEnv = 0; this._bgEnv = 0;
        this._specSmooth.fill(0);
    }

    _resetRTBeat() {
        this._rtHistory.fill(0); this._rtIdx = 0; this._rtFilled = false; this._rtWarmup = 0; this._rtCooldown = 0;
        this._kickStrength = 0; this._bgPulse = 0; this._kickEnv = 0; this._bgEnv = 0;
    }

    // ── LOOKAHEAD SCHEDULER ──

    _tickLookahead() {
        if (!this._live || this._micMode || !this._kickTimestamps.length) return;
        if (!this._aC) return;
        const songTime = this._playbackAnchorSong + (this._aC.currentTime - this._playbackAnchorAC);
        const horizon = songTime + 0.025;
        while (this._nextKickIdx < this._kickTimestamps.length && this._kickTimestamps[this._nextKickIdx] < songTime - 0.05) this._nextKickIdx++;
        while (this._nextKickIdx < this._kickTimestamps.length && this._kickTimestamps[this._nextKickIdx] <= horizon) { this._fireKick(1.0); this._nextKickIdx++; }
        if (this._songDuration > 0 && songTime >= this._songDuration - 0.08) {
            this._nextKickIdx = 0;
            this._playbackAnchorAC = this._aC.currentTime;
            this._playbackAnchorSong = 0;
        }
    }

    // ── RT BEAT DETECTION ──

    _freqToBin(freq, analyser) {
        const nyq = (this._aC ? this._aC.sampleRate : 44100) / 2;
        return Math.min(Math.round(freq / nyq * analyser.frequencyBinCount), analyser.frequencyBinCount - 1);
    }

    _tickRTBeat() {
        if (!this._beatData || !this._live || !this._beatAnalyser) return;
        this._beatAnalyser.getByteFrequencyData(this._beatData);
        const lo = this._freqToBin(30, this._beatAnalyser), hi = this._freqToBin(120, this._beatAnalyser);
        let sq = 0, n = 0;
        for (let i = lo; i <= hi; i++) { const v = this._beatData[i] / 255; sq += v * v; n++; }
        const rms = n > 0 ? Math.sqrt(sq / n) : 0;
        this._rtHistory[this._rtIdx] = rms;
        this._rtIdx = (this._rtIdx + 1) % 60;
        if (this._rtIdx === 0) this._rtFilled = true;
        this._rtWarmup++;
        if (this._rtWarmup < 50) { if (this._rtCooldown > 0) this._rtCooldown--; return; }
        const len = this._rtFilled ? 60 : Math.max(1, this._rtIdx);
        let avg = 0;
        for (let i = 0; i < len; i++) avg += this._rtHistory[i];
        avg /= len;
        if (this._rtCooldown > 0) { this._rtCooldown--; return; }
        if (rms > avg * this._rtSens && rms > 0.06) {
            const mag = Math.min(1.0, (rms - avg) / Math.max(0.01, avg * 0.5));
            this._fireKick(0.55 + mag * 0.45);
            this._rtCooldown = 22;
        }
    }

    _fireKick(strength) {
        this._kickEnv = Math.min(1.0, strength);
        this._bgEnv   = Math.min(1.0, strength * 0.95);
    }

    _decayKick() {
        if (this._kickEnv > 0.30) this._kickEnv *= 0.86; else this._kickEnv *= 0.95;
        if (this._bgEnv  > 0.30) this._bgEnv   *= 0.82; else this._bgEnv   *= 0.94;
        this._kickStrength = this._kickEnv * this._kickEnv;
        this._bgPulse      = this._bgEnv   * this._bgEnv;
    }

    // ── SPECTRUM ARRAY for circular visualizer ──

    _buildSpectrumArray(sr) {
        const nyq = sr / 2;
        const fLo = 30, fHi = Math.min(16000, nyq * 0.9);
        const N = this._specBars;

        for (let i = 0; i < N; i++) {
            const freq = fLo * Math.pow(fHi / fLo, i / (N - 1));
            const bin  = Math.min(Math.round(freq / nyq * this._bufLen), this._bufLen - 1);
            const raw  = this._vizData[bin] / 255.0;
            const t    = i / (N - 1);
            let s;
            if      (t < 0.12) s = Math.pow(raw, 1.3) * 1.40;
            else if (t < 0.35) s = Math.pow(raw, 1.5) * 1.15;
            else if (t < 0.65) s = Math.pow(raw, 1.7) * 0.95;
            else               s = Math.pow(raw, 2.0) * 0.75;

            s = Math.min(1.0, s);
            const tgt = s;
            const atk = tgt > this._specSmooth[i];
            this._specSmooth[i] += (tgt - this._specSmooth[i]) * (atk ? 0.65 : 0.25);
        }
    }

    // ── DRAW HELPERS ──

    _hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }

    _lerpColor(hexA, hexB, t) {
        const ra = parseInt(hexA.slice(1, 3), 16), ga = parseInt(hexA.slice(3, 5), 16), ba = parseInt(hexA.slice(5, 7), 16);
        const rb = parseInt(hexB.slice(1, 3), 16), gb = parseInt(hexB.slice(3, 5), 16), bb = parseInt(hexB.slice(5, 7), 16);
        const r = Math.round(ra + (rb - ra) * t), g = Math.round(ga + (gb - ga) * t), b = Math.round(ba + (bb - ba) * t);
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }

    // ── KEN BURNS ──

    _updateKenBurns() {
        this._kbTick++;
        if (this._kbTick % 500 === 0) {
            this._kbTX = (Math.random() - 0.5) * 55;
            this._kbTY = (Math.random() - 0.5) * 38;
            this._kbTS = 1.03 + Math.random() * 0.055;
        }
        this._kbX += (this._kbTX - this._kbX) * 0.0015;
        this._kbY += (this._kbTY - this._kbY) * 0.0015;
        this._kbS += (this._kbTS - this._kbS) * 0.0015;
    }

    // ── DRAW BACKGROUND ──

    _drawBG() {
        const bg = this._bg, W = this._W, H = this._H, S = this._S;
        const CX = W / 2, CY = H / 2;
        bg.clearRect(0, 0, W, H);

        if (this._bgReady && this._bgImg) {
            bg.save();
            const sc = Math.max(W / this._bgImg.naturalWidth, H / this._bgImg.naturalHeight) * this._kbS;
            bg.drawImage(this._bgImg,
                CX - this._bgImg.naturalWidth * sc / 2 + this._kbX,
                CY - this._bgImg.naturalHeight * sc / 2 + this._kbY,
                this._bgImg.naturalWidth * sc,
                this._bgImg.naturalHeight * sc
            );
            bg.restore();
            // Heavy dark overlay — NCS style
            bg.fillStyle = `rgba(0,0,0,${Math.max(0.60, 0.80 - this._bgPulse * 0.06)})`;
            bg.fillRect(0, 0, W, H);
        } else {
            bg.fillStyle = S.bgTint;
            bg.fillRect(0, 0, W, H);
        }

        // Subtle colour pulse on beat
        if (this._bgPulse > 0.04) {
            const a = this._bgPulse * 0.15;
            const specCX = this._getSpecCX();
            const specCY = this._getSpecCY();
            const gr = bg.createRadialGradient(specCX, specCY, 40, specCX, specCY, Math.min(W, H) * 0.5);
            gr.addColorStop(0, this._hexToRgba(S.c1, a * 0.45));
            gr.addColorStop(0.5, this._hexToRgba(S.c2, a * 0.2));
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            bg.fillStyle = gr;
            bg.fillRect(0, 0, W, H);
        }

        // Vignette
        const vg = bg.createRadialGradient(CX, CY, Math.min(W, H) * 0.3, CX, CY, Math.max(W, H) * 0.7);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, 'rgba(0,0,0,0.60)');
        bg.fillStyle = vg;
        bg.fillRect(0, 0, W, H);
    }

    // ── Spectrum circle position (right side for desktop, center for mobile) ──

    _getSpecCX() {
        if (this._W < 600) return this._W * 0.5;
        return this._W * 0.68;
    }
    _getSpecCY() {
        if (this._W < 600) return this._H * 0.55;
        return this._H * 0.44;
    }

    // ── DRAW NCS-STYLE CIRCULAR SPECTRUM ──

    _drawCircularSpectrum() {
        const ctx = this._ctx, S = this._S;
        const CX = this._getSpecCX();
        const CY = this._getSpecCY();
        const baseR = Math.min(this._W, this._H) * 0.18 * (this._circleScale || 1.0);
        const maxBarH = Math.min(this._W, this._H) * 0.14 * (this._circleScale || 1.0);
        const N = this._specBars;
        const barW = this._specBarWidth;

        // ── Outer glow ring ──
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, baseR + 2, 0, Math.PI * 2);
        ctx.strokeStyle = this._hexToRgba(S.c1, 0.08 + this._kickStrength * 0.15);
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 20 + this._kickStrength * 30;
        ctx.shadowColor = S.glow;
        ctx.stroke();
        ctx.restore();

        // ── Spectrum bars (full circle, mirrored) ──
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < N; i++) {
            const v = this._specSmooth[i];
            const h = v * maxBarH;
            if (h < 1) continue;

            // Full circle: bars on both sides (mirrored)
            const angles = [
                (i / N) * Math.PI * 2 - Math.PI / 2,
                (-(i / N)) * Math.PI * 2 - Math.PI / 2
            ];

            for (const ang of angles) {
                const cos = Math.cos(ang), sin = Math.sin(ang);
                const x1 = CX + cos * (baseR + 3);
                const y1 = CY + sin * (baseR + 3);
                const x2 = CX + cos * (baseR + 3 + h);
                const y2 = CY + sin * (baseR + 3 + h);

                // Gradient colour: low freq = c1, high freq = c2
                const t = i / (N - 1);
                const barColor = this._lerpColor(S.c1, S.c2, t);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = barColor;
                ctx.lineWidth = barW;
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.6 + v * 0.4;
                ctx.shadowBlur = 4 + v * 10;
                ctx.shadowColor = barColor;
                ctx.stroke();
            }
        }
        ctx.restore();

        // ── Inner circle (cover art or gradient) ──
        const discR = baseR * (1.0 + this._kickStrength * 0.03);
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, discR, 0, Math.PI * 2);
        ctx.clip();

        if (this._coverReady && this._coverImg) {
            ctx.drawImage(this._coverImg, CX - discR, CY - discR, discR * 2, discR * 2);
            // Subtle dark overlay
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(CX - discR, CY - discR, discR * 2, discR * 2);
        } else {
            const pg = ctx.createRadialGradient(CX, CY, 0, CX, CY, discR);
            pg.addColorStop(0, S.bgTint);
            pg.addColorStop(1, '#000');
            ctx.fillStyle = pg;
            ctx.fillRect(CX - discR, CY - discR, discR * 2, discR * 2);
        }
        ctx.restore();

        // ── Disc border glow ──
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, discR, 0, Math.PI * 2);
        ctx.strokeStyle = S.c1;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15 + this._kickStrength * 25;
        ctx.shadowColor = S.glow;
        ctx.globalAlpha = 0.6 + this._kickStrength * 0.3;
        ctx.stroke();
        ctx.restore();

        // ── Dot accents on peaks ──
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < N; i += 2) {
            const v = this._specSmooth[i];
            if (v < 0.5) continue;
            const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
            const r = baseR + 3 + v * maxBarH + 4;
            const dx = CX + Math.cos(ang) * r;
            const dy = CY + Math.sin(ang) * r;
            ctx.globalAlpha = (v - 0.5) * 2 * 0.7;
            ctx.fillStyle = S.c3;
            ctx.shadowBlur = 8;
            ctx.shadowColor = S.c1;
            ctx.beginPath();
            ctx.arc(dx, dy, v * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ── DRAW BEAT FLASH ──

    _drawBeatFlash() {
        if (this._kickStrength < 0.08) return;
        const ctx = this._ctx, S = this._S;
        const CX = this._getSpecCX(), CY = this._getSpecCY();
        ctx.save();
        const rg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.min(this._W, this._H) * 0.45);
        rg.addColorStop(0, S.c3 + Math.floor(this._kickStrength * 20).toString(16).padStart(2, '0'));
        rg.addColorStop(0.4, S.glow + Math.floor(this._kickStrength * 12).toString(16).padStart(2, '0'));
        rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, this._W, this._H);
        ctx.restore();
    }

    // ── MAIN LOOP ──

    _startLoop() {
        this._tabWasHidden = false;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._tabWasHidden = true;
            } else if (this._tabWasHidden) {
                this._tabWasHidden = false;
                if (this._isPlaying && this._aC) {
                    this._playbackAnchorAC   = this._aC.currentTime;
                    this._playbackAnchorSong = this._audioEl.currentTime;
                    while (this._nextKickIdx < this._kickTimestamps.length &&
                           this._kickTimestamps[this._nextKickIdx] < this._playbackAnchorSong) {
                        this._nextKickIdx++;
                    }
                }
                this._specSmooth.fill(0);
            }
        });

        const frame = () => {
            this._animId = requestAnimationFrame(frame);
            const sr = this._aC ? this._aC.sampleRate : 44100;

            if (this._live && this._isPlaying && this._vizAnalyser) {
                this._vizAnalyser.getByteFrequencyData(this._vizData);
                this._buildSpectrumArray(sr);
                if (!this._micMode && this._kickTimestamps.length > 0) this._tickLookahead();
                else this._tickRTBeat();
                this._decayKick();
            } else {
                if (this._kickEnv > 0.001 || this._bgEnv > 0.001) {
                    this._kickEnv *= 0.70;
                    this._bgEnv   *= 0.70;
                    this._kickStrength = this._kickEnv * this._kickEnv;
                    this._bgPulse      = this._bgEnv   * this._bgEnv;
                } else {
                    this._kickEnv = 0; this._bgEnv = 0;
                    this._kickStrength = 0; this._bgPulse = 0;
                }
                if (this._live) {
                    for (let i = 0; i < this._specBars; i++) {
                        this._specSmooth[i] *= 0.88;
                        if (this._specSmooth[i] < 0.001) this._specSmooth[i] = 0;
                    }
                }
            }

            this._updateKenBurns();
            this._drawBG();
            this._ctx.clearRect(0, 0, this._W, this._H);
            this._particles.forEach(p => { this._updateParticle(p); this._drawParticle(p); });
            this._drawBeatFlash();
            if (this._live) this._drawCircularSpectrum();
            else this._drawIdleCircle();
        };
        frame();
    }

    // Draw a subtle idle circle when no music is playing
    _drawIdleCircle() {
        const ctx = this._ctx, S = this._S;
        const CX = this._getSpecCX(), CY = this._getSpecCY();
        const baseR = Math.min(this._W, this._H) * 0.18 * (this._circleScale || 1.0);

        // Cover art disc
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, baseR, 0, Math.PI * 2);
        ctx.clip();
        if (this._coverReady && this._coverImg) {
            ctx.drawImage(this._coverImg, CX - baseR, CY - baseR, baseR * 2, baseR * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(CX - baseR, CY - baseR, baseR * 2, baseR * 2);
        } else {
            const pg = ctx.createRadialGradient(CX, CY, 0, CX, CY, baseR);
            pg.addColorStop(0, S.bgTint);
            pg.addColorStop(1, '#000');
            ctx.fillStyle = pg;
            ctx.fillRect(CX - baseR, CY - baseR, baseR * 2, baseR * 2);
        }
        ctx.restore();

        // Border
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, baseR, 0, Math.PI * 2);
        ctx.strokeStyle = this._hexToRgba(S.c1, 0.25);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = S.glow;
        ctx.stroke();
        ctx.restore();
    }

    // ── SONG LOADING ──

    async _loadSong(index, autoPlay = false) {
        if (!this._songs[index]) return;
        this._currentSong = index;
        const song = this._songs[index];
        this._clearBeatState();
        this._updateCover(song);
        this._updateSongInfoUI(song);
        this._renderDrawer();

        // Reset BPM
        const bpmEl = this.querySelector('#ncsBPM');
        if (bpmEl) bpmEl.textContent = '';

        if (!song.audioFile) return;
        this._initAudio();
        if (this._aC.state === 'suspended') await this._aC.resume();

        this._audioEl.src    = song.audioFile;
        this._audioEl.volume = this._volume;
        this._audioEl.load();

        try {
            const res     = await fetch(song.audioFile);
            const arrBuf  = await res.arrayBuffer();
            const decoded = await this._aC.decodeAudioData(arrBuf.slice(0));
            this._songDuration = decoded.duration;
            await this._analyzeFile(decoded);
        } catch (e) {
            console.warn('[NCS] Beat analysis fallback to RT:', e);
            this._micMode = true;
        }

        if (!this._srcConnected) {
            this._srcNode = this._aC.createMediaElementSource(this._audioEl);
            this._srcNode.connect(this._vizAnalyser);
            this._srcNode.connect(this._beatAnalyser);
            this._beatAnalyser.connect(this._aC.destination);
            this._srcConnected = true;
        }

        this._nextKickIdx        = 0;
        this._playbackAnchorSong = 0;
        this._live               = true;

        if (autoPlay) {
            this._audioEl.play().then(() => {
                this._playbackAnchorAC   = this._aC.currentTime;
                this._playbackAnchorSong = this._audioEl.currentTime;
            }).catch(e => console.warn('[NCS] Autoplay blocked:', e));
        }
    }

    // ── SVG ICONS for social links ──
    _socialIcon(type) {
        const icons = {
            spotify: '<svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
            soundcloud: '<svg viewBox="0 0 24 24"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.06 0 .09-.037.104-.094l.2-1.282-.2-1.332c-.014-.057-.045-.094-.104-.094m1.8-1.208c-.066 0-.109.053-.116.117l-.213 2.517.213 2.445c.007.066.05.12.116.12.068 0 .11-.054.12-.12l.24-2.445-.24-2.517c-.01-.064-.052-.117-.12-.117m.92-.417c-.074 0-.12.063-.127.13l-.192 2.934.192 2.505c.007.069.053.133.127.133.074 0 .119-.064.13-.133l.22-2.505-.22-2.934c-.011-.067-.056-.13-.13-.13m.93-.156c-.082 0-.136.07-.143.148l-.168 3.09.168 2.525c.007.08.061.148.143.148.08 0 .135-.068.146-.148l.19-2.525-.19-3.09c-.01-.078-.066-.148-.146-.148m.942-.086c-.09 0-.146.08-.152.16l-.15 3.176.15 2.542c.006.084.062.163.152.163.09 0 .145-.079.157-.163l.17-2.542-.17-3.176c-.012-.08-.067-.16-.157-.16m.94-.025c-.098 0-.156.088-.163.178l-.132 3.2.132 2.55c.007.09.065.178.163.178.098 0 .155-.088.168-.178l.149-2.55-.149-3.2c-.013-.09-.07-.178-.168-.178m.938.038c-.106 0-.167.098-.172.191l-.112 2.97.112 2.553c.005.094.066.193.172.193.106 0 .166-.1.18-.193l.126-2.553-.126-2.97c-.014-.093-.074-.191-.18-.191m.945.015c-.114 0-.176.104-.183.204l-.1 2.955.1 2.55c.007.102.069.207.183.207.114 0 .175-.105.19-.207l.115-2.55-.115-2.955c-.015-.1-.076-.204-.19-.204m.949.086c-.122 0-.186.115-.192.218l-.085 2.87.085 2.54c.006.108.07.22.192.22.12 0 .184-.112.2-.22l.098-2.54-.098-2.87c-.016-.103-.08-.218-.2-.218m1.88.253c-.015-.12-.098-.236-.24-.236-.143 0-.226.117-.24.236l-.068 2.617.068 2.53c.014.12.097.235.24.235.142 0 .225-.116.24-.235l.075-2.53-.075-2.617m.944-.37c-.027-.134-.113-.253-.273-.253-.16 0-.246.12-.273.253l-.053 2.988.053 2.523c.027.133.113.25.273.25.16 0 .246-.117.273-.25l.06-2.523-.06-2.988m1.79-.463a.673.673 0 0 0-.682-.675.673.673 0 0 0-.679.675l-.04 3.45.04 2.506a.672.672 0 0 0 .679.669.672.672 0 0 0 .682-.669l.044-2.506-.044-3.45M21.004 7.83c-.548 0-1.071.13-1.533.365A5.673 5.673 0 0 0 13.95 3.6c-.6 0-1.189.098-1.714.25-.206.06-.263.13-.263.253v10.74c0 .131.103.24.234.253.003 0 8.557.005 8.798.005 1.66 0 2.996-1.35 2.996-3.01S22.662 7.83 21.004 7.83"/></svg>',
            apple: '<svg viewBox="0 0 24 24"><path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15C17.89.005 17.644 0 17.404 0H6.595c-.24 0-.485.005-.731.014-.527.015-1.048.057-1.565.15-.673.121-1.303.353-1.877.727C1.304 1.634.56 2.634.242 3.944A8.765 8.765 0 0 0 0 6.124v11.75c0 .738.065 1.47.24 2.19.317 1.31 1.062 2.31 2.18 3.043.574.374 1.204.606 1.877.727.517.093 1.038.135 1.565.15.245.009.49.014.73.014h10.81c.24 0 .485-.005.731-.014.527-.015 1.048-.057 1.564-.15.674-.121 1.304-.353 1.878-.727 1.118-.733 1.863-1.733 2.18-3.043.175-.72.24-1.452.24-2.19V6.124zm-6.628 10.36c-.076.078-.146.15-.207.214-.68.704-1.496 1.098-2.46 1.098-.376 0-.756-.07-1.13-.22-.346-.136-.686-.29-1.03-.428-.457-.182-.927-.262-1.41-.262-.5 0-.978.084-1.446.27-.333.131-.66.276-.994.41-.392.158-.79.234-1.2.234-.88 0-1.618-.333-2.28-.934a7.49 7.49 0 0 1-.618-.616c-1.06-1.17-1.665-2.58-1.88-4.18-.136-1.007-.105-2.008.148-2.994.422-1.64 1.312-2.88 2.713-3.668.658-.37 1.375-.56 2.13-.536.445.014.875.105 1.289.27.375.149.744.314 1.11.483.447.206.907.305 1.383.3.424-.004.835-.096 1.238-.272.36-.157.715-.326 1.078-.476.548-.225 1.12-.347 1.72-.328a4.19 4.19 0 0 1 2.39.818c.283.205.543.44.784.697-.1.08-.192.157-.278.238-.82.77-1.35 1.7-1.538 2.805-.213 1.26.07 2.403.804 3.435.24.336.521.638.835.901.035.03.069.062.1.096l-.047.05zM15.04 3.48c-.44.53-.978.886-1.615 1.07-.104.03-.21.05-.317.06a.398.398 0 0 1-.065-.003c-.015-.17-.02-.342 0-.515.07-.678.338-1.28.757-1.82.428-.55.96-.917 1.592-1.114.118-.037.237-.06.36-.075.022.17.03.34.013.514-.058.66-.313 1.25-.724 1.882z"/></svg>',
            facebook: '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
            twitter: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
            youtube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            tiktok: '<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
            website: '<svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 19.828a9.953 9.953 0 01-4.874-2.196l.893-.893A3.001 3.001 0 0011 14V13a1 1 0 00-1-1H8a1 1 0 00-1 1v1.586l-1.293 1.293A9.953 9.953 0 012 12c0-1.09.177-2.14.5-3.122L6 12.378V14a2 2 0 002 2h1v2a1 1 0 002 0v-3l2.371-2.371A4 4 0 0017 7h-1.535l1.5-3A9.96 9.96 0 0122 12c0 5.065-3.767 9.249-8.666 9.828z"/></svg>',
            share: '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>',
        };
        return icons[type] || icons.website;
    }

    _updateSongInfoUI(song) {
        if (!song) return;

        // Strip controls
        const t = this.querySelector('#ncsSongTitle'), a = this.querySelector('#ncsSongArtist');
        if (t) t.textContent = (song.title || 'Unknown Title').toUpperCase();
        if (a) a.textContent = song.artist || '—';

        // Big info panel
        const tb = this.querySelector('#ncsTitleBig');
        const ab = this.querySelector('#ncsArtistBig');
        const genre = this.querySelector('#ncsGenre');
        const album = this.querySelector('#ncsAlbumInfo');

        if (tb) tb.textContent = (song.title || 'Unknown Title').toUpperCase();
        if (ab) ab.textContent = song.artist || '—';
        if (genre) {
            genre.textContent = song.genre || 'MUSIC';
            genre.style.display = song.genre ? 'inline-block' : 'none';
        }
        if (album) {
            const parts = [];
            if (song.album) parts.push(song.album);
            if (song.duration) parts.push(song.duration);
            album.textContent = parts.join(' · ');
        }

        // Social links
        const socialEl = this.querySelector('#ncsSocialLinks');
        if (socialEl && this._showSocialLinks) {
            const links = [];
            if (song.artistFacebookLink)  links.push({ url: song.artistFacebookLink,  icon: 'facebook' });
            if (song.artistTwitterLink)   links.push({ url: song.artistTwitterLink,   icon: 'twitter' });
            if (song.artistInstagramLink) links.push({ url: song.artistInstagramLink, icon: 'instagram' });
            if (song.artistYouTubeLink)   links.push({ url: song.artistYouTubeLink,   icon: 'youtube' });
            if (song.artistTikTokLink)    links.push({ url: song.artistTikTokLink,    icon: 'tiktok' });
            if (song.artistWebsiteLink)   links.push({ url: song.artistWebsiteLink,   icon: 'website' });

            socialEl.innerHTML = links.map(l =>
                `<a class="ncs-social-link" href="${this._esc(l.url)}" target="_blank" rel="noopener" title="${l.icon}">
                    ${this._socialIcon(l.icon)}
                </a>`
            ).join('');
            socialEl.style.display = links.length ? 'flex' : 'none';
        } else if (socialEl) {
            socialEl.style.display = 'none';
        }

        // Stream links
        const streamEl = this.querySelector('#ncsStreamLinks');
        if (streamEl) {
            const streams = [];
            if (song.spotifyLink)     streams.push({ url: song.spotifyLink,     icon: 'spotify',    label: 'Spotify' });
            if (song.appleMusicLink)  streams.push({ url: song.appleMusicLink,  icon: 'apple',      label: 'Apple Music' });
            if (song.soundcloudLink)  streams.push({ url: song.soundcloudLink,  icon: 'soundcloud', label: 'SoundCloud' });
            if (song.shareUrl)        streams.push({ url: song.shareUrl,        icon: 'share',      label: 'Share' });
            if (song.buyPrice)        streams.push({ url: '#',                  icon: 'website',    label: `Buy $${song.buyPrice}`, isBuy: true });

            streamEl.innerHTML = streams.map(s =>
                `<a class="ncs-stream-btn${s.isBuy ? ' ncs-buy-btn' : ''}" href="${this._esc(s.url)}" target="_blank" rel="noopener">
                    ${this._socialIcon(s.icon)}
                    ${this._esc(s.label)}
                </a>`
            ).join('');
            streamEl.style.display = streams.length ? 'flex' : 'none';
        }
    }

    // ── Player controls (same pattern as original) ──

    _togglePlay() {
        if (!this._audioEl || !this._songs.length) return;
        this._initAudio();
        if (this._aC.state === 'suspended') this._aC.resume().then(() => this._doTogglePlay());
        else this._doTogglePlay();
    }

    _doTogglePlay() {
        if (this._audioEl.paused) {
            this._audioEl.play().then(() => {
                this._playbackAnchorAC   = this._aC.currentTime;
                this._playbackAnchorSong = this._audioEl.currentTime;
            }).catch(e => console.warn(e));
        } else {
            this._audioEl.pause();
        }
    }

    _prev() { const idx = this._shuffle ? Math.floor(Math.random() * this._songs.length) : (this._currentSong - 1 + this._songs.length) % this._songs.length; this._loadSong(idx, this._isPlaying); }
    _next() { const idx = this._shuffle ? Math.floor(Math.random() * this._songs.length) : (this._currentSong + 1) % this._songs.length; this._loadSong(idx, this._isPlaying); }

    _toggleShuffle() { this._shuffle = !this._shuffle; const btn = this.querySelector('#ncsShuffleBtn'); if (btn) btn.classList.toggle('active', this._shuffle); }

    _toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        this._repeat = modes[(modes.indexOf(this._repeat) + 1) % modes.length];
        const btn = this.querySelector('#ncsRepeatBtn');
        if (!btn) return;
        btn.classList.toggle('active', this._repeat !== 'none');
        btn.innerHTML = this._repeat === 'one'
            ? `<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
    }

    _toggleMute() {
        if (this._volume > 0) { this._lastVolume = this._volume; this._volume = 0; }
        else { this._volume = this._lastVolume || 0.8; }
        if (this._audioEl) this._audioEl.volume = this._volume;
        const s = this.querySelector('#ncsVolSlider'); if (s) s.value = this._volume;
        this._updateVolIcon();
    }

    _setVolume(val) { this._volume = parseFloat(val); if (this._audioEl) this._audioEl.volume = this._volume; this._updateVolIcon(); }

    _updateVolIcon() {
        const vi = this.querySelector('#ncsVolIcon'), mi = this.querySelector('#ncsMuteIcon');
        if (vi) vi.style.display = this._volume === 0 ? 'none' : 'block';
        if (mi) mi.style.display = this._volume === 0 ? 'block' : 'none';
    }

    _onTimeUpdate() {
        const cur = this._audioEl.currentTime, dur = this._audioEl.duration;
        if (isNaN(dur)) return;
        const fill = this.querySelector('#ncsProgressFill'), el = this.querySelector('#ncsCurTime');
        if (fill) fill.style.width = ((cur / dur) * 100) + '%';
        if (el) el.textContent = this._fmtTime(cur);
    }

    _onMetadata() {
        const dur = this._audioEl.duration;
        if (dur && !isNaN(dur)) { const el = this.querySelector('#ncsTotalTime'); if (el) el.textContent = this._fmtTime(dur); }
    }

    _onEnded() { if (this._repeat === 'one') { this._audioEl.currentTime = 0; this._audioEl.play(); } else this._next(); }

    _onPlay() {
        this._isPlaying = true;
        if (this._aC) {
            this._playbackAnchorAC   = this._aC.currentTime;
            this._playbackAnchorSong = this._audioEl.currentTime;
            while (this._nextKickIdx < this._kickTimestamps.length && this._kickTimestamps[this._nextKickIdx] < this._playbackAnchorSong - 0.05) this._nextKickIdx++;
        }
        this._resetRTBeat();
        const pi = this.querySelector('#ncsPlayIcon'), pa = this.querySelector('#ncsPauseIcon');
        if (pi) pi.style.display = 'none'; if (pa) pa.style.display = 'block';
    }

    _onPause() {
        this._isPlaying = false;
        this._kickEnv = 0; this._bgEnv = 0; this._kickStrength = 0; this._bgPulse = 0;
        this._resetRTBeat();
        const pi = this.querySelector('#ncsPlayIcon'), pa = this.querySelector('#ncsPauseIcon');
        if (pi) pi.style.display = 'block'; if (pa) pa.style.display = 'none';
    }

    _fmtTime(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60), sc = Math.floor(s % 60); return `${m}:${sc < 10 ? '0' : ''}${sc}`; }

    _toggleDrawer() {
        this._drawerOpen = !this._drawerOpen;
        const drawer = this.querySelector('#ncsDrawer'), btn = this.querySelector('#ncsQueueBtn');
        if (drawer) drawer.classList.toggle('open', this._drawerOpen);
        if (btn) btn.classList.toggle('active', this._drawerOpen);
        if (this._drawerOpen) this._renderDrawer();
    }

    _renderDrawer() {
        const body = this.querySelector('#ncsDrawerBody');
        if (!body) return;
        const q = this._searchQuery;
        const filtered = this._songs.filter(s => !q || (s.title || '').toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q));
        if (!filtered.length) { body.innerHTML = '<div class="ncs-queue-empty">NO SONGS FOUND</div>'; return; }
        body.innerHTML = filtered.map((song, i) => {
            const ai = this._songs.indexOf(song), active = ai === this._currentSong;
            const art = song.coverImage ? `<img src="${this._esc(song.coverImage)}" alt="">` : '';
            return `<div class="ncs-queue-song${active ? ' active' : ''}" data-index="${ai}">
                <span class="ncs-queue-num">${i + 1}</span>
                <div class="ncs-queue-art">${art}</div>
                <div class="ncs-queue-info">
                    <div class="ncs-queue-title">${this._esc(song.title || 'Unknown')}</div>
                    <div class="ncs-queue-artist">${this._esc(song.artist || '—')}</div>
                </div>
                <span class="ncs-queue-dur">${song.duration || ''}</span>
            </div>`;
        }).join('');
        body.querySelectorAll('.ncs-queue-song').forEach(row => {
            row.addEventListener('click', () => { this._loadSong(parseInt(row.dataset.index), true); this._toggleDrawer(); });
        });
    }

    _esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    _bindUIEvents() {
        const wrap = this.querySelector('#ncsWrap'), strip = this.querySelector('#ncsStrip');
        const showUI = () => {
            strip.classList.remove('hidden'); wrap.classList.add('ui-visible');
            clearTimeout(this._hideTimer);
            this._hideTimer = setTimeout(() => { strip.classList.add('hidden'); wrap.classList.remove('ui-visible'); }, 5000);
        };
        wrap.addEventListener('mousemove', showUI);
        wrap.addEventListener('mouseenter', showUI);
        strip.addEventListener('mouseenter', () => clearTimeout(this._hideTimer));
        strip.addEventListener('mouseleave', () => { this._hideTimer = setTimeout(() => { strip.classList.add('hidden'); wrap.classList.remove('ui-visible'); }, 5000); });

        this.querySelector('#ncsPlayBtn').addEventListener('click', () => this._togglePlay());
        this.querySelector('#ncsPrevBtn').addEventListener('click', () => this._prev());
        this.querySelector('#ncsNextBtn').addEventListener('click', () => this._next());
        this.querySelector('#ncsShuffleBtn').addEventListener('click', () => this._toggleShuffle());
        this.querySelector('#ncsRepeatBtn').addEventListener('click', () => this._toggleRepeat());
        this.querySelector('#ncsVolBtn').addEventListener('click', () => this._toggleMute());
        this.querySelector('#ncsVolSlider').addEventListener('input', e => this._setVolume(e.target.value));
        this.querySelector('#ncsQueueBtn').addEventListener('click', () => this._toggleDrawer());
        this.querySelector('#ncsDrawerClose').addEventListener('click', () => this._toggleDrawer());
        this.querySelector('#ncsSearch').addEventListener('input', e => { this._searchQuery = e.target.value.toLowerCase(); this._renderDrawer(); });

        this.querySelector('#ncsProgressBar').addEventListener('click', e => {
            const rect = this.querySelector('#ncsProgressBar').getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (this._audioEl && this._audioEl.duration) {
                const seekPos = pct * this._audioEl.duration;
                this._audioEl.currentTime = seekPos;
                this._nextKickIdx = 0;
                if (this._aC) { this._playbackAnchorAC = this._aC.currentTime; this._playbackAnchorSong = seekPos; }
            }
        });

        document.addEventListener('click', e => {
            const drawer = this.querySelector('#ncsDrawer'), qBtn = this.querySelector('#ncsQueueBtn');
            if (drawer && this._drawerOpen && !drawer.contains(e.target) && qBtn && !qBtn.contains(e.target)) this._toggleDrawer();
        });
    }
}

customElements.define('ncs-visualizer', NCSVisualizer);
