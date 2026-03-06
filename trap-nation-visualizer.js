// ============================================================
//  TRAP NATION VISUALIZER + MUSIC PLAYER — Custom Element
//
//  Follows EXACTLY the same pattern as the original widget:
//  - observedAttributes = kebab-case flat colour attrs
//  - attributeChangedCallback → _applyStyles() → CSS vars
//  - Widget sets individual attrs (primary-color, etc.)
//  - Panel sets individual color props via wixWidget.setProps
//  - Presets live in the PANEL, not here
// ============================================================

class TrapNationVisualizer extends HTMLElement {

    constructor() {
        super();

        // ── Audio ──────────────────────────────────────────────
        this._aC         = null;
        this._vizAnalyser= null;
        this._beatAnalyser= null;
        this._srcNode    = null;
        this._vizData    = null;
        this._beatData   = null;
        this._bufLen     = 0;
        this._live       = false;

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

        // ── Ring buffers ───────────────────────────────────────
        this._N_HALF    = 128;
        this._N_RING    = 256;
        this._ringBuf   = new Float32Array(256);
        this._ringSmooth= new Float32Array(256);

        // ── Ken Burns ──────────────────────────────────────────
        this._kbX=0; this._kbY=0; this._kbS=1.04;
        this._kbTX=8; this._kbTY=-6; this._kbTS=1.06; this._kbTick=0;

        // ── Dimensions ─────────────────────────────────────────
        this._W=800; this._H=600; this._CX=400; this._CY=300;
        this._BASE_R=0; this._MAX_H=0; this._CENTER_R=0;

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

        // ── Misc ───────────────────────────────────────────────
        this._particleMaxSize = 1.1;
        this._particleSpeed   = 1.0;
        this._particles  = [];
        this._animId     = null;
        this._bgImg      = null;
        this._bgReady    = false;
        this._coverImg   = null;
        this._coverReady = false;
        this._domReady   = false;
        this._audioEl    = null;
        this._srcConnected = false;

        // ── Default scheme (used by canvas before first attr) ──
        this._S = { c1:'#00ffff', c2:'#9b59b6', c3:'#ffffff', glow:'#00ffff', bgTint:'#001122' };

        // ── New panel-controlled settings ──────────────────────
        this._circleScale = 1.0;    // 0.5–1.5, multiplies BASE_R + CENTER_R
        this._bgMode      = 'random'; // 'random' | 'cover'
        this._rtSens      = 1.35;   // RT beat sensitivity (replaces hardcoded 1.35)
        this._centerLine1 = 'TRAP';   // top label in centre disc
        this._centerLine2 = 'NATION'; // bottom label in centre disc

        // ── Precision timing anchor for lookahead ──────────────
        // audioEl.currentTime has ~100ms jitter at OS level.
        // We instead track aC.currentTime at the moment of play
        // start and compute song position as:
        //   songPos = _playbackAnchorSong + (aC.currentTime - _playbackAnchorAC)
        // This gives sub-millisecond accuracy regardless of OS tick rate.
        this._playbackAnchorAC   = 0; // aC.currentTime snapshot at play start
        this._playbackAnchorSong = 0; // song position at that snapshot
    }

    // ──────────────────────────────────────────────────────────
    //  OBSERVED ATTRIBUTES
    //  Flat individual colour attrs — same pattern as original
    //  sticky-music-player custom element
    // ──────────────────────────────────────────────────────────
    static get observedAttributes() {
        return [
            'player-data',
            'primary-color',    // c1  — ring glow / primary
            'secondary-color',  // c2  — ring secondary
            'tertiary-color',   // c3  — dots / beat flash
            'glow-color',       // glow shadow
            'bg-tint-color',    // background pulse tint
            'particle-size',
            'particle-speed',
            'font-family',
            'circle-scale',     // 0.5–1.5 — ring + disc size multiplier
            'bg-mode',          // 'random' | 'cover'
            'beat-threshold',   // RT sensitivity, default 1.35
            'center-line1',     // top text in centre disc (default 'TRAP')
            'center-line2'      // bottom text in centre disc (default 'NATION')
        ];
    }

    // ──────────────────────────────────────────────────────────
    //  ATTRIBUTE CHANGED CALLBACK
    //  Same pattern as original: colour attrs → _applyStyles()
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
            } catch(e) { console.error('[TrapNation] player-data parse error:', e); }
            return;
        }

        if (name === 'particle-size') {
            this._particleMaxSize = parseFloat(newVal) || 1.1;
            this._rebuildParticles();
            return;
        }

        if (name === 'particle-speed') {
            this._particleSpeed = parseFloat(newVal) || 1.0;
            this._rebuildParticles();
            return;
        }

        if (name === 'circle-scale') {
            this._circleScale = parseFloat(newVal) || 1.0;
            this._resize(); // recalculate BASE_R / CENTER_R with new multiplier
            return;
        }

        if (name === 'bg-mode') {
            this._bgMode = newVal || 'random';
            // Load cover as BG if switching to cover mode and a song is loaded
            if (this._bgMode === 'cover') this._loadBGAsCover();
            else                          this._loadBGRandom();
            return;
        }

        if (name === 'beat-threshold') {
            this._rtSens = parseFloat(newVal) || 1.35;
            return;
        }

        if (name === 'center-line1') {
            this._centerLine1 = newVal || 'TRAP';
            return;
        }

        if (name === 'center-line2') {
            this._centerLine2 = newVal || 'NATION';
            return;
        }

        // All colour attrs + font-family → update CSS vars
        this._applyStyles();
    }

    // ──────────────────────────────────────────────────────────
    //  _applyStyles()
    //  Reads all colour attrs → sets CSS vars on container
    //  Also syncs this._S for canvas draw functions
    //  Identical pattern to original widget's _applyStyles()
    // ──────────────────────────────────────────────────────────
    _applyStyles() {
        const c1     = this.getAttribute('primary-color')   || '#00ffff';
        const c2     = this.getAttribute('secondary-color') || '#9b59b6';
        const c3     = this.getAttribute('tertiary-color')  || '#ffffff';
        const glow   = this.getAttribute('glow-color')      || '#00ffff';
        const bgTint = this.getAttribute('bg-tint-color')   || '#001122';
        const font   = this.getAttribute('font-family')     || 'Courier New';

        // Keep canvas scheme in sync
        this._S = { c1, c2, c3, glow, bgTint };

        const wrap = this._wrap;
        if (!wrap) return;

        wrap.style.setProperty('--c1',      c1);
        wrap.style.setProperty('--c2',      c2);
        wrap.style.setProperty('--c3',      c3);
        wrap.style.setProperty('--glow',    glow);
        wrap.style.setProperty('--bg-tint', bgTint);
        wrap.style.setProperty('--font',    `'${font}', 'Courier New', monospace`);
    }

    // ──────────────────────────────────────────────────────────
    //  LIFECYCLE
    // ──────────────────────────────────────────────────────────
    connectedCallback() {
        this.style.display   = 'block';
        this.style.position  = 'relative';
        this.style.overflow  = 'hidden';

        this._buildDOM();
        this._setupResizeObserver();
        this._loadBGImage();
        this._buildParticles();
        this._bindUIEvents();
        this._startLoop();
        this._domReady = true;

        // Apply any attrs that already arrived
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
.tnv-wrap {
    position: absolute; inset: 0;
    background: #000;
    overflow: hidden;
    font-family: var(--font, 'Courier New', monospace);
    cursor: none;
    --c1: #00ffff; --c2: #9b59b6; --c3: #ffffff;
    --glow: #00ffff; --bg-tint: #001122;
}
.tnv-wrap.ui-visible { cursor: default; }
.tnv-canvas-bg, .tnv-canvas-main {
    position: absolute; top:0; left:0; display:block; pointer-events:none;
}
/* ── Strip ── */
.tnv-strip {
    position:absolute; bottom:0; left:0; right:0; height:88px;
    background: linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.70) 70%, transparent 100%);
    display:flex; flex-direction:column; justify-content:flex-end;
    padding:0 20px 10px; gap:7px; z-index:50;
    transition: opacity 0.5s ease, transform 0.5s ease;
}
.tnv-strip.hidden { opacity:0; transform:translateY(18px); pointer-events:none; }
.tnv-progress-row { display:flex; align-items:center; gap:10px; }
.tnv-progress-bar {
    flex:1; height:4px; background:rgba(255,255,255,0.12);
    border-radius:2px; cursor:pointer; position:relative;
}
.tnv-progress-fill {
    height:100%; width:0%; background:var(--c1);
    border-radius:2px; transition:width 0.1s linear; position:relative;
}
.tnv-progress-fill::after {
    content:''; position:absolute; right:-5px; top:50%; transform:translateY(-50%);
    width:10px; height:10px; background:#fff; border-radius:50%;
    opacity:0; transition:opacity 0.2s; box-shadow:0 0 6px var(--c1);
}
.tnv-progress-bar:hover .tnv-progress-fill::after { opacity:1; }
.tnv-time {
    font-size:11px; color:rgba(255,255,255,0.55); letter-spacing:1px;
    flex-shrink:0; font-variant-numeric:tabular-nums;
    font-family:var(--font,'Courier New',monospace);
}
.tnv-controls-row { display:flex; align-items:center; gap:8px; }
.tnv-song-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.tnv-song-title {
    font-size:12px; font-weight:700; color:#fff; letter-spacing:2px;
    text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    text-shadow:0 0 12px var(--c1); font-family:var(--font,'Courier New',monospace);
}
.tnv-song-artist {
    font-size:10px; color:rgba(255,255,255,0.45); letter-spacing:2px;
    text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    font-family:var(--font,'Courier New',monospace);
}
.tnv-controls { display:flex; align-items:center; gap:3px; }
.tnv-btn {
    width:36px; height:36px; border:none; background:transparent;
    color:rgba(255,255,255,0.70); cursor:pointer; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    transition:all 0.18s; padding:0; flex-shrink:0;
}
.tnv-btn:hover  { color:#fff; background:rgba(255,255,255,0.08); }
.tnv-btn.active { color:var(--c1); }
.tnv-btn svg    { width:18px; height:18px; fill:currentColor; }
.tnv-play-btn {
    width:42px; height:42px; background:var(--c1); color:#000 !important;
    box-shadow:0 0 18px var(--glow);
}
.tnv-play-btn:hover { background:#fff !important; transform:scale(1.08); }
.tnv-play-btn svg   { fill:#000; }
.tnv-vol { display:flex; align-items:center; gap:6px; }
.tnv-vol-slider {
    -webkit-appearance:none; appearance:none; width:70px; height:3px;
    background:rgba(255,255,255,0.15); border-radius:2px; outline:none; cursor:pointer;
}
.tnv-vol-slider::-webkit-slider-thumb {
    -webkit-appearance:none; width:10px; height:10px;
    background:var(--c1); border-radius:50%; cursor:pointer;
}
.tnv-vol-slider::-moz-range-thumb {
    width:10px; height:10px; background:var(--c1); border:none; border-radius:50%; cursor:pointer;
}
/* ── Drawer ── */
.tnv-drawer {
    position:absolute; bottom:93px; right:12px; width:310px; max-height:400px;
    background:rgba(0,0,0,0.93); border:1px solid rgba(255,255,255,0.07);
    border-radius:6px; backdrop-filter:blur(20px);
    display:flex; flex-direction:column; z-index:60;
    transform:translateY(14px); opacity:0; pointer-events:none;
    transition:transform 0.28s, opacity 0.28s; box-shadow:0 8px 40px rgba(0,0,0,0.85);
}
.tnv-drawer.open { transform:translateY(0); opacity:1; pointer-events:all; }
.tnv-drawer-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:11px 14px; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;
}
.tnv-drawer-title {
    font-size:9px; font-weight:700; letter-spacing:3px; text-transform:uppercase;
    color:var(--c1); font-family:var(--font,'Courier New',monospace);
}
.tnv-drawer-search {
    display:flex; align-items:center; gap:8px; padding:8px 14px;
    border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;
}
.tnv-drawer-search svg { width:13px; height:13px; fill:rgba(255,255,255,0.28); flex-shrink:0; }
.tnv-search-input {
    flex:1; background:transparent; border:none; outline:none; color:#fff;
    font-size:11px; letter-spacing:1px; font-family:var(--font,'Courier New',monospace);
}
.tnv-search-input::placeholder { color:rgba(255,255,255,0.22); }
.tnv-drawer-body { flex:1; overflow-y:auto; padding:5px; }
.tnv-drawer-body::-webkit-scrollbar { width:3px; }
.tnv-drawer-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
.tnv-queue-song {
    display:flex; align-items:center; gap:10px; padding:7px 8px;
    border-radius:4px; cursor:pointer; transition:background 0.18s;
}
.tnv-queue-song:hover  { background:rgba(255,255,255,0.05); }
.tnv-queue-song.active { background:rgba(255,255,255,0.09); }
.tnv-queue-num {
    font-size:10px; color:rgba(255,255,255,0.28); width:18px; text-align:center;
    flex-shrink:0; font-family:var(--font,'Courier New',monospace);
}
.tnv-queue-song.active .tnv-queue-num { color:var(--c1); }
.tnv-queue-art { width:34px; height:34px; border-radius:3px; overflow:hidden; background:#111; flex-shrink:0; }
.tnv-queue-art img { width:100%; height:100%; object-fit:cover; }
.tnv-queue-info { flex:1; min-width:0; }
.tnv-queue-title {
    font-size:11px; font-weight:700; color:#fff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    font-family:var(--font,'Courier New',monospace);
}
.tnv-queue-song.active .tnv-queue-title { color:var(--c1); }
.tnv-queue-artist {
    font-size:10px; color:rgba(255,255,255,0.38); letter-spacing:1px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    font-family:var(--font,'Courier New',monospace);
}
.tnv-queue-dur { font-size:10px; color:rgba(255,255,255,0.28); flex-shrink:0; }
.tnv-queue-empty {
    padding:28px 16px; text-align:center; color:rgba(255,255,255,0.22);
    font-size:10px; letter-spacing:2px; font-family:var(--font,'Courier New',monospace);
}
@media (max-width:480px) {
    .tnv-strip { padding:0 12px 9px; }
    .tnv-vol   { display:none; }
    .tnv-drawer { width:calc(100% - 24px); right:12px; }
}
</style>

<div class="tnv-wrap" id="tnvWrap">
    <canvas class="tnv-canvas-bg"   id="tnvBgC"></canvas>
    <canvas class="tnv-canvas-main" id="tnvMc"></canvas>

    <div class="tnv-strip" id="tnvStrip">
        <div class="tnv-progress-row">
            <span class="tnv-time" id="tnvCurTime">0:00</span>
            <div class="tnv-progress-bar" id="tnvProgressBar">
                <div class="tnv-progress-fill" id="tnvProgressFill"></div>
            </div>
            <span class="tnv-time" id="tnvTotalTime">0:00</span>
        </div>
        <div class="tnv-controls-row">
            <div class="tnv-song-info">
                <div class="tnv-song-title"  id="tnvSongTitle">NO TRACK LOADED</div>
                <div class="tnv-song-artist" id="tnvSongArtist">—</div>
            </div>
            <div class="tnv-controls">
                <button class="tnv-btn" id="tnvShuffleBtn" title="Shuffle">
                    <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                </button>
                <button class="tnv-btn" id="tnvPrevBtn" title="Previous">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button class="tnv-btn tnv-play-btn" id="tnvPlayBtn" title="Play/Pause">
                    <svg id="tnvPlayIcon"  viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="tnvPauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button class="tnv-btn" id="tnvNextBtn" title="Next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
                <button class="tnv-btn" id="tnvRepeatBtn" title="Repeat">
                    <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                </button>
            </div>
            <div class="tnv-vol">
                <button class="tnv-btn" id="tnvVolBtn" title="Mute">
                    <svg id="tnvVolIcon"  viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    <svg id="tnvMuteIcon" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                </button>
                <input type="range" class="tnv-vol-slider" id="tnvVolSlider" min="0" max="1" step="0.01" value="0.8">
            </div>
            <button class="tnv-btn" id="tnvQueueBtn" title="Queue">
                <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zm17-4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/></svg>
            </button>
        </div>
    </div>

    <div class="tnv-drawer" id="tnvDrawer">
        <div class="tnv-drawer-header">
            <span class="tnv-drawer-title">Queue</span>
            <button class="tnv-btn" id="tnvDrawerClose" style="width:26px;height:26px">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        </div>
        <div class="tnv-drawer-search">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" class="tnv-search-input" id="tnvSearch" placeholder="Search songs...">
        </div>
        <div class="tnv-drawer-body" id="tnvDrawerBody"></div>
    </div>
</div>`;

        this._wrap = this.querySelector('#tnvWrap');
        this._bgC  = this.querySelector('#tnvBgC');
        this._mc   = this.querySelector('#tnvMc');
        this._off1 = document.createElement('canvas');
        this._off2 = document.createElement('canvas');
        this._bg   = this._bgC.getContext('2d');
        this._ctx  = this._mc.getContext('2d');
        this._o1   = this._off1.getContext('2d');
        this._o2   = this._off2.getContext('2d');

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
        this._W  = this.offsetWidth  || 800;
        this._H  = this.offsetHeight || 600;
        this._CX = this._W / 2;
        this._CY = this._H / 2;
        const baseScale = Math.min(this._W, this._H) * 0.240 * (this._circleScale || 1.0);
        this._BASE_R   = baseScale;
        this._MAX_H    = Math.min(this._W, this._H) * 0.100 * (this._circleScale || 1.0);
        this._CENTER_R = baseScale * 0.79;
        [this._bgC, this._mc, this._off1, this._off2].forEach(c => {
            c.width = this._W; c.height = this._H;
        });
        this._bgC.style.width  = this._W + 'px';
        this._bgC.style.height = this._H + 'px';
        this._mc.style.width   = this._W + 'px';
        this._mc.style.height  = this._H + 'px';
    }

    _loadBGRandom() {
        // Loads a random picsum photo as the Ken Burns background
        this._bgImg = new Image();
        this._bgImg.crossOrigin = 'anonymous';
        const seed = Math.floor(Math.random() * 200) + 1;
        this._bgImg.src = `https://picsum.photos/1920/1080?random=${seed}`;
        this._bgImg.onload = () => { this._bgReady = true; };
    }

    _loadBGAsCover() {
        // Uses the current song's cover art as the Ken Burns background
        const song = this._songs[this._currentSong];
        if (song && song.coverImage) {
            this._bgImg = new Image();
            this._bgImg.crossOrigin = 'anonymous';
            this._bgImg.src = song.coverImage;
            this._bgImg.onload = () => { this._bgReady = true; };
            this._bgReady = false;
        }
        // If no cover art, keep current bg image unchanged
    }

    _loadBGImage() {
        // Called once on connectedCallback — respects current bgMode
        if (this._bgMode === 'cover') this._loadBGAsCover();
        else                          this._loadBGRandom();
    }

    _updateCover(song) {
        if (song && song.coverImage) {
            this._coverImg = new Image();
            this._coverImg.crossOrigin = 'anonymous';
            this._coverImg.src = song.coverImage;
            this._coverImg.onload = () => { this._coverReady = true; };
            this._coverReady = false;
            // Also update BG if in cover mode
            if (this._bgMode === 'cover') this._loadBGAsCover();
        } else {
            this._coverImg = null; this._coverReady = false;
        }
    }

    // ── PARTICLES (3D starfield — exact copy of original HTML) ──

    _buildParticles() {
        this._particles = Array.from({ length: 420 }, () => this._newParticle(true));
    }

    _rebuildParticles() {
        if (this._domReady)
            this._particles = Array.from({ length: 420 }, () => this._newParticle(true));
    }

    _newParticle(init = false) {
        const Z_FAR = 800;
        return {
            x3:    (Math.random() - 0.5) * Z_FAR * 2.2,
            y3:    (Math.random() - 0.5) * Z_FAR * 2.2,
            z3:    init ? Math.random() * Z_FAR + 1 : Z_FAR * (0.85 + Math.random() * 0.15),
            vz:    (1.8 + Math.random() * 3.0) * this._particleSpeed,
            maxSz: 0.3 + Math.random() * this._particleMaxSize,
            op:    0.35 + Math.random() * 0.55
        };
    }

    _updateParticle(p) {
        p.z3 -= p.vz + this._kickStrength * 9.0;
        if (p.z3 < 1) Object.assign(p, this._newParticle(false));
    }

    _drawParticle(p) {
        const FL = 280, Z_FAR = 800;
        const scale = FL / p.z3;
        const sx = p.x3 * scale + this._CX;
        const sy = p.y3 * scale + this._CY;
        if (sx < -10 || sx > this._W + 10 || sy < -10 || sy > this._H + 10) return;
        const depth = 1 - (p.z3 / Z_FAR);
        const sz  = p.maxSz * (0.1 + depth * 1.4);
        const alp = p.op   * (0.1 + depth * 0.9);
        if (sz < 0.05 || alp < 0.01) return;
        const r  = Math.max(sz * 2.5, 0.5);
        const gr = this._ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        gr.addColorStop(0,    'rgba(255,255,255,1)');
        gr.addColorStop(0.35, this._hexToRgba(this._S.c1, 0.55));
        gr.addColorStop(1,    'rgba(0,0,0,0)');
        this._ctx.save();
        this._ctx.globalAlpha = alp;
        this._ctx.fillStyle = gr;
        this._ctx.beginPath();
        this._ctx.arc(sx, sy, r, 0, Math.PI * 2);
        this._ctx.fill();
        this._ctx.restore();
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

    _killSrc() {
        if (this._srcNode) { try { this._srcNode.disconnect(); } catch(e) {} this._srcNode = null; }
        this._srcConnected = false;
        this._live = false;
    }

    // ── OFFLINE BEAT ANALYSIS — exact 3-function algorithm from original HTML ──

    _getPeaksAtThreshold(data, threshold, sampleRate) {
        const peaks = [], skip = Math.floor(sampleRate * 0.23);
        let i = 0;
        while (i < data.length) {
            if (Math.abs(data[i]) > threshold) { peaks.push(i); i += skip; }
            i++;
        }
        return peaks;
    }

    _countIntervalsBetweenNearbyPeaks(peaks) {
        const counts = [];
        peaks.forEach((peak, idx) => {
            for (let i = 1; i <= 10; i++) {
                if (idx + i >= peaks.length) break;
                const interval = peaks[idx + i] - peak;
                const found = counts.find(c => c.interval === interval);
                if (found) found.count++;
                else counts.push({ interval, count: 1 });
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
            if (found) found.count += ic.count;
            else tempos.push({ tempo: bpm, count: ic.count });
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
        // Starting threshold scales with rtSens: lower sensitivity = start lower
        // rtSens 1.35 (default) → start at 0.75
        // rtSens 1.0 (very sensitive) → start at 0.45
        // rtSens 2.0 (high threshold) → start at 0.85 (clamped)
        const startThr = Math.min(0.85, Math.max(0.30, 0.75 - (1.35 - this._rtSens) * 0.30));
        const thrSteps = [];
        for (let t = startThr; t >= 0.30; t = Math.round((t - 0.05) * 100) / 100) thrSteps.push(t);
        let peaks = [];
        for (const thr of thrSteps) {
            peaks = this._getPeaksAtThreshold(norm, thr, sr);
            if (peaks.length >= 20) break;
        }
        if (peaks.length < 4) { this._micMode = false; this._kickTimestamps = []; this._detectedBPM = 0; return; }
        const intervals = this._countIntervalsBetweenNearbyPeaks(peaks);
        const tempos    = this._groupNeighborsByTempo(intervals, sr);
        this._detectedBPM    = tempos.length > 0 ? tempos[0].tempo : 0;
        this._kickTimestamps = peaks.map(p => p / sr).sort((a, b) => a - b);
    }

    // ── BEAT STATE ──

    _clearBeatState() {
        this._kickTimestamps=[]; this._nextKickIdx=0; this._detectedBPM=0; this._micMode=false;
        this._kickStrength=0; this._bgPulse=0; this._kickEnv=0; this._bgEnv=0;
        // Also zero the ring smooth buffer so no ghost spectrum carries over
        this._ringSmooth.fill(0);
        this._ringBuf.fill(0);
    }

    _resetRTBeat() {
        this._rtHistory.fill(0); this._rtIdx=0; this._rtFilled=false; this._rtWarmup=0; this._rtCooldown=0;
        this._kickStrength=0; this._bgPulse=0; this._kickEnv=0; this._bgEnv=0;
    }

    // ── LOOKAHEAD SCHEDULER ──────────────────────────────────
    //
    //  Root cause of kick lag: audioEl.currentTime is updated by
    //  the OS audio thread on a ~10–100ms tick, so it can lag the
    //  actual playback position by up to one OS buffer length.
    //
    //  Fix: Record aC.currentTime (Web Audio clock, sub-ms precision)
    //  at the exact moment playback starts (_playbackAnchorAC).
    //  Each frame, derive precise song position as:
    //    songPos = _playbackAnchorSong + (aC.currentTime - _playbackAnchorAC)
    //
    //  This is the same clock used by the Web Audio scheduler itself,
    //  so kick timestamps from offline analysis align perfectly.
    //  Lookahead window: 1.5 frames (25ms) to ensure kicks fire before
    //  the RAF that renders the frame where the kick actually hits.

    _tickLookahead() {
        if (!this._live || this._micMode || !this._kickTimestamps.length) return;
        if (!this._aC) return;

        // Precise song position via Web Audio clock
        const songTime = this._playbackAnchorSong +
                         (this._aC.currentTime - this._playbackAnchorAC);

        // 25ms lookahead = ~1.5 frames at 60fps
        const horizon = songTime + 0.025;

        // Skip past any kicks we've already fired or are too far behind
        while (this._nextKickIdx < this._kickTimestamps.length &&
               this._kickTimestamps[this._nextKickIdx] < songTime - 0.05) {
            this._nextKickIdx++;
        }

        // Fire all kicks inside the lookahead window
        while (this._nextKickIdx < this._kickTimestamps.length &&
               this._kickTimestamps[this._nextKickIdx] <= horizon) {
            this._fireKick(1.0);
            this._nextKickIdx++;
        }

        // Loop reset: when song position wraps back to 0, reset kick pointer
        if (this._songDuration > 0 && songTime >= this._songDuration - 0.08) {
            this._nextKickIdx = 0;
            // Re-anchor the clock for the loop
            this._playbackAnchorAC   = this._aC.currentTime;
            this._playbackAnchorSong = 0;
        }
    }

    // ── REAL-TIME BEAT DETECTION — exact same as original HTML ──

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

    // ── KICK ENVELOPE — exact two-stage decay from original HTML ──

    _fireKick(strength) {
        this._kickEnv = Math.min(1.0, strength);
        this._bgEnv   = Math.min(1.0, strength * 0.95);
    }

    _decayKick() {
        if (this._kickEnv > 0.30) this._kickEnv *= 0.86; else this._kickEnv *= 0.95;
        if (this._bgEnv  > 0.30) this._bgEnv   *= 0.82; else this._bgEnv   *= 0.94;
        this._kickStrength = this._kickEnv * this._kickEnv;  // envCurve = v*v
        this._bgPulse      = this._bgEnv   * this._bgEnv;
    }

    // ── RING ARRAY — exact same as original HTML ──

    _buildRingArray(sr) {
        const nyq = sr / 2, fLo = 30, fHi = Math.min(16000, nyq * 0.9);
        for (let i = 0; i < this._N_HALF; i++) {
            const freq = fLo * Math.pow(fHi / fLo, i / (this._N_HALF - 1));
            const bin  = Math.min(Math.round(freq / nyq * this._bufLen), this._bufLen - 1);
            const raw  = this._vizData[bin] / 255.0, t = i / (this._N_HALF - 1);
            let s;
            if      (t < 0.12) s = Math.pow(raw, 1.4) * 1.35;
            else if (t < 0.35) s = Math.pow(raw, 1.6) * 1.10;
            else if (t < 0.65) s = Math.pow(raw, 1.8) * 0.90;
            else               s = Math.pow(raw, 2.2) * 0.70;
            this._ringBuf[i] = Math.min(1.0, s);
        }
        for (let i = 0; i < this._N_RING; i++) {
            const h = i < this._N_HALF ? i : this._N_RING - 1 - i;
            const tgt = this._ringBuf[h], atk = tgt > this._ringSmooth[i];
            this._ringSmooth[i] += (tgt - this._ringSmooth[i]) * (atk ? 0.7 : 0.3);
        }
        this._gaussSmooth(this._ringSmooth, 1.5);
    }

    _gaussSmooth(arr, sigma) {
        const n = arr.length, r = Math.ceil(sigma * 2.5), tmp = new Float32Array(arr);
        for (let i = 0; i < n; i++) {
            let s = 0, w = 0;
            for (let j = -r; j <= r; j++) {
                const wt = Math.exp(-(j * j) / (2 * sigma * sigma));
                s += tmp[(i + j + n) % n] * wt; w += wt;
            }
            arr[i] = s / w;
        }
    }

    // ── DRAW HELPERS ──

    _hexToRgba(hex, a) {
        const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }

    _lerpColor(hexA, hexB, t) {
        const ra=parseInt(hexA.slice(1,3),16),ga=parseInt(hexA.slice(3,5),16),ba=parseInt(hexA.slice(5,7),16);
        const rb=parseInt(hexB.slice(1,3),16),gb=parseInt(hexB.slice(3,5),16),bb=parseInt(hexB.slice(5,7),16);
        const r=Math.round(ra+(rb-ra)*t),g=Math.round(ga+(gb-ga)*t),b=Math.round(ba+(bb-ba)*t);
        return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');
    }

    // ── KEN BURNS — exact same as original HTML ──

    _updateKenBurns() {
        this._kbTick++;
        if (this._kbTick % 500 === 0) {
            this._kbTX=(Math.random()-0.5)*55; this._kbTY=(Math.random()-0.5)*38;
            this._kbTS=1.03+Math.random()*0.055;
        }
        this._kbX+=(this._kbTX-this._kbX)*0.0015;
        this._kbY+=(this._kbTY-this._kbY)*0.0015;
        this._kbS+=(this._kbTS-this._kbS)*0.0015;
    }

    // ── drawBG — exact same as original HTML ──

    _drawBG() {
        const bg=this._bg, W=this._W, H=this._H, CX=this._CX, CY=this._CY, S=this._S;
        bg.clearRect(0,0,W,H);
        const zoom = 1.0 + this._bgPulse * 0.022;
        if (this._bgReady) {
            bg.save();
            const sc=Math.max(W/this._bgImg.naturalWidth,H/this._bgImg.naturalHeight)*this._kbS*zoom;
            bg.drawImage(this._bgImg,CX-this._bgImg.naturalWidth*sc/2+this._kbX,CY-this._bgImg.naturalHeight*sc/2+this._kbY,this._bgImg.naturalWidth*sc,this._bgImg.naturalHeight*sc);
            bg.restore();
            bg.fillStyle=`rgba(0,0,0,${Math.max(0.52,0.74-this._bgPulse*0.09)})`;
            bg.fillRect(0,0,W,H);
        } else { bg.fillStyle='#000'; bg.fillRect(0,0,W,H); }
        if (this._bgPulse > 0.04) {
            const a=this._bgPulse*0.22;
            const gr=bg.createRadialGradient(CX,CY,Math.min(W,H)*0.10,CX,CY,Math.min(W,H)*(0.35+this._bgPulse*0.20));
            gr.addColorStop(0,   this._hexToRgba(S.c1,    a*0.55));
            gr.addColorStop(0.35,this._hexToRgba(S.bgTint,a*0.35));
            gr.addColorStop(0.70,this._hexToRgba(S.bgTint,a*0.12));
            gr.addColorStop(1,  'rgba(0,0,0,0)');
            bg.fillStyle=gr; bg.fillRect(0,0,W,H);
        }
        const vg=bg.createRadialGradient(CX,CY,Math.min(W,H)*0.28,CX,CY,Math.max(W,H)*0.72);
        vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,0,0.55)');
        bg.fillStyle=vg; bg.fillRect(0,0,W,H);
    }

    // ── buildRingPath — exact same as original HTML ──

    _buildRingPath(tCtx, buf, bR, mH) {
        const n=buf.length, CX=this._CX, CY=this._CY;
        const px=new Float32Array(n), py=new Float32Array(n);
        for (let i=0;i<n;i++) {
            const ang=(i/n)*Math.PI*2-Math.PI/2, r=bR+buf[i]*mH;
            px[i]=CX+Math.cos(ang)*r; py[i]=CY+Math.sin(ang)*r;
        }
        tCtx.beginPath(); tCtx.moveTo(px[0],py[0]);
        for (let i=0;i<n;i++) {
            const p0=(i-1+n)%n,p1=i,p2=(i+1)%n,p3=(i+2)%n;
            const cp1x=px[p1]+(px[p2]-px[p0])/6,cp1y=py[p1]+(py[p2]-py[p0])/6;
            const cp2x=px[p2]-(px[p3]-px[p1])/6,cp2y=py[p2]-(py[p3]-py[p1])/6;
            tCtx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,px[p2],py[p2]);
        }
        tCtx.closePath();
    }

    // ── drawRing — exact same as original HTML ──

    _drawRing() {
        const ctx=this._ctx,o1=this._o1,o2=this._o2;
        const W=this._W,H=this._H,CX=this._CX,CY=this._CY;
        const BASE_R=this._BASE_R,MAX_H=this._MAX_H,S=this._S,rs=this._ringSmooth;

        o1.clearRect(0,0,W,H);
        this._buildRingPath(o1,rs,BASE_R,MAX_H);
        const g1=o1.createRadialGradient(CX,CY,BASE_R*0.90,CX,CY,BASE_R+MAX_H);
        g1.addColorStop(0,S.c1+'44');g1.addColorStop(0.45,S.c1+'cc');g1.addColorStop(0.80,S.c2+'88');g1.addColorStop(1,S.c2+'00');
        o1.fillStyle=g1;o1.arc(CX,CY,BASE_R*0.93,0,Math.PI*2,false);o1.fill('evenodd');
        o1.strokeStyle=S.c1+'bb';o1.lineWidth=7;o1.stroke();
        ctx.save();ctx.filter='blur(22px)';ctx.globalAlpha=0.55;ctx.globalCompositeOperation='screen';ctx.drawImage(this._off1,0,0);ctx.restore();

        o2.clearRect(0,0,W,H);
        this._buildRingPath(o2,rs,BASE_R,MAX_H);
        const g2=o2.createRadialGradient(CX,CY,BASE_R*0.92,CX,CY,BASE_R+MAX_H*0.88);
        g2.addColorStop(0,S.c1+'66');g2.addColorStop(0.55,S.c2+'99');g2.addColorStop(1,S.c2+'00');
        o2.fillStyle=g2;o2.arc(CX,CY,BASE_R*0.95,0,Math.PI*2,false);o2.fill('evenodd');
        o2.strokeStyle=S.c1+'dd';o2.lineWidth=3;o2.stroke();
        ctx.save();ctx.filter='blur(7px)';ctx.globalAlpha=0.72;ctx.globalCompositeOperation='screen';ctx.drawImage(this._off2,0,0);ctx.restore();

        ctx.save();ctx.globalCompositeOperation='screen';
        this._buildRingPath(ctx,rs,BASE_R,MAX_H);
        const sg=ctx.createRadialGradient(CX,CY,BASE_R,CX,CY,BASE_R+MAX_H);
        sg.addColorStop(0,S.c1);sg.addColorStop(0.5,S.c2);sg.addColorStop(1,S.c3);
        ctx.strokeStyle=sg;ctx.lineWidth=1.6;ctx.shadowBlur=10;ctx.shadowColor=S.glow;ctx.stroke();ctx.restore();

        ctx.save();ctx.globalCompositeOperation='screen';
        for (let i=0;i<this._N_RING;i+=2) {
            const v=rs[i];if(v<0.40)continue;
            const ang=(i/this._N_RING)*Math.PI*2-Math.PI/2,r=BASE_R+v*MAX_H;
            ctx.globalAlpha=(v-0.40)/0.60*0.85;ctx.shadowBlur=12;ctx.shadowColor=S.c1;ctx.fillStyle=S.c3;
            ctx.beginPath();ctx.arc(CX+Math.cos(ang)*r,CY+Math.sin(ang)*r,v*3.8,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
        ctx.save();ctx.strokeStyle=S.c1+'22';ctx.lineWidth=1;ctx.beginPath();ctx.arc(CX,CY,BASE_R,0,Math.PI*2);ctx.stroke();ctx.restore();
    }

    // ── drawCenter — exact same as original HTML ──

    _drawCenter() {
        const ctx=this._ctx,S=this._S,CX=this._CX,CY=this._CY;
        const cr=this._CENTER_R*(1.0+this._kickStrength*0.045);
        ctx.save();ctx.beginPath();ctx.arc(CX,CY,cr-2,0,Math.PI*2);ctx.clip();
        if (this._coverReady&&this._coverImg) {
            ctx.drawImage(this._coverImg,CX-cr,CY-cr,cr*2,cr*2);
            ctx.fillStyle=S.bgTint+'44';ctx.fillRect(CX-cr,CY-cr,cr*2,cr*2);
            const iv=ctx.createRadialGradient(CX,CY,cr*0.45,CX,CY,cr);
            iv.addColorStop(0,'transparent');iv.addColorStop(1,'rgba(0,0,0,0.45)');
            ctx.fillStyle=iv;ctx.fillRect(CX-cr,CY-cr,cr*2,cr*2);
        } else {
            const pg=ctx.createRadialGradient(CX,CY,0,CX,CY,cr);
            pg.addColorStop(0,S.bgTint+'ff');pg.addColorStop(1,'#000');
            ctx.fillStyle=pg;ctx.fillRect(CX-cr,CY-cr,cr*2,cr*2);
        }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle=S.c1+Math.floor(20+this._kickStrength*80).toString(16).padStart(2,'0');
        ctx.lineWidth=8;ctx.shadowBlur=20+this._kickStrength*28;ctx.shadowColor=S.glow;ctx.globalAlpha=0.25+this._kickStrength*0.35;
        ctx.beginPath();ctx.arc(CX,CY,cr+4,0,Math.PI*2);ctx.stroke();ctx.restore();
        ctx.save();ctx.strokeStyle=S.c1;ctx.lineWidth=3.5;
        ctx.shadowBlur=22+this._kickStrength*30;ctx.shadowColor=S.glow;ctx.globalAlpha=0.88+this._kickStrength*0.12;
        ctx.beginPath();ctx.arc(CX,CY,cr,0,Math.PI*2);ctx.stroke();ctx.restore();
        ctx.save();
        const fs=Math.floor(cr*0.20);
        ctx.textAlign='center';ctx.textBaseline='middle';
        const textScale=1.0+this._kickStrength*0.10;
        ctx.translate(CX,CY);ctx.scale(textScale,textScale);ctx.translate(-CX,-CY);
        ctx.font=`900 ${fs}px 'Courier New',monospace`;
        const glowSize=10+this._kickStrength*38,glowAlpha=0.86+this._kickStrength*0.14;
        ctx.shadowBlur=glowSize;ctx.shadowColor=S.glow;ctx.globalAlpha=glowAlpha;
        ctx.fillStyle=this._kickStrength>0.15?this._lerpColor(S.c1,'#ffffff',this._kickStrength*0.55):S.c1;
        ctx.fillText(this._centerLine1||'TRAP',CX,CY-fs*0.60);
        ctx.shadowBlur=glowSize*0.85;ctx.shadowColor=S.glow;
        ctx.fillStyle=this._kickStrength>0.15?this._lerpColor(S.c2,'#ffffff',this._kickStrength*0.40):S.c2;
        ctx.fillText(this._centerLine2||'NATION',CX,CY+fs*0.60);
        ctx.restore();
    }

    // ── drawBeatFlash — exact same as original HTML ──

    _drawBeatFlash() {
        if (this._kickStrength<0.08) return;
        const ctx=this._ctx,S=this._S,CX=this._CX,CY=this._CY,W=this._W,H=this._H;
        ctx.save();
        const rg=ctx.createRadialGradient(CX,CY,0,CX,CY,Math.min(W,H)*0.50);
        rg.addColorStop(0,   S.c3+Math.floor(this._kickStrength*30).toString(16).padStart(2,'0'));
        rg.addColorStop(0.40,S.glow+Math.floor(this._kickStrength*18).toString(16).padStart(2,'0'));
        rg.addColorStop(1,  'transparent');
        ctx.fillStyle=rg;ctx.globalCompositeOperation='screen';ctx.fillRect(0,0,W,H);
        ctx.restore();
    }

    // ── MAIN LOOP ────────────────────────────────────────────
    //
    //  Beat/envelope logic is gated on _isPlaying so that:
    //  • Paused / no song    → kick env decays to zero and stops,
    //                          analyser is not read, RT detector silent
    //  • Tab hidden→visible  → anchor is re-synced so the lookahead
    //                          doesn't fire a burst of stale kicks
    //
    //  _tabWasHidden tracks whether the page was hidden since the
    //  last frame. On return we re-anchor _playbackAnchorAC to the
    //  current Web Audio clock and skip past any kicks that would
    //  have fired while we were away, rather than firing them all
    //  at once.

    _startLoop() {
        // Track tab visibility so we can re-anchor on return
        this._tabWasHidden = false;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._tabWasHidden = true;
            } else if (this._tabWasHidden) {
                this._tabWasHidden = false;
                if (this._isPlaying && this._aC) {
                    // Re-anchor the Web Audio clock to now, and fast-forward
                    // the kick index past any timestamps we missed while hidden
                    const missed = this._playbackAnchorSong +
                                   (this._aC.currentTime - this._playbackAnchorAC);
                    this._playbackAnchorAC   = this._aC.currentTime;
                    this._playbackAnchorSong = this._audioEl.currentTime;
                    // Skip kicks that fell while tab was hidden
                    while (this._nextKickIdx < this._kickTimestamps.length &&
                           this._kickTimestamps[this._nextKickIdx] < this._playbackAnchorSong) {
                        this._nextKickIdx++;
                    }
                }
                // Flush stale ring data so no ghost spectrum appears
                this._ringSmooth.fill(0);
                this._ringBuf.fill(0);
            }
        });

        const frame = () => {
            this._animId = requestAnimationFrame(frame);
            const sr = this._aC ? this._aC.sampleRate : 44100;

            if (this._live && this._isPlaying && this._vizAnalyser) {
                // Only read analyser and fire beat detection when actually playing
                this._vizAnalyser.getByteFrequencyData(this._vizData);
                this._buildRingArray(sr);
                if (!this._micMode && this._kickTimestamps.length > 0) this._tickLookahead();
                else this._tickRTBeat();

                // Decay envelope each frame while playing
                this._decayKick();
            } else {
                // Not playing: drain kick envelope to zero quickly so any
                // residual flash/thump from before pause fades out cleanly,
                // then hold at exactly zero — no further decay needed
                if (this._kickEnv > 0.001 || this._bgEnv > 0.001) {
                    this._kickEnv *= 0.70;  // fast drain (not the slow beat decay)
                    this._bgEnv   *= 0.70;
                    this._kickStrength = this._kickEnv * this._kickEnv;
                    this._bgPulse      = this._bgEnv   * this._bgEnv;
                } else {
                    // Hard-clamp to zero so floating point never triggers flash
                    this._kickEnv = 0; this._bgEnv = 0;
                    this._kickStrength = 0; this._bgPulse = 0;
                }

                // Drain ring spectrum smoothly to zero so it doesn't freeze
                // at its last position when song pauses
                if (this._live) {
                    for (let i = 0; i < this._N_RING; i++) {
                        this._ringSmooth[i] *= 0.88;
                        if (this._ringSmooth[i] < 0.001) this._ringSmooth[i] = 0;
                    }
                }
            }

            this._updateKenBurns();
            this._drawBG();
            this._ctx.clearRect(0,0,this._W,this._H);
            this._particles.forEach(p => { this._updateParticle(p); this._drawParticle(p); });
            this._drawBeatFlash();
            if (this._live) this._drawRing();
            this._drawCenter();
        };
        frame();
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
        } catch(e) {
            console.warn('[TrapNation] Beat analysis fallback to RT:', e);
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
                // Anchor the Web Audio clock to song position 0 at play start
                this._playbackAnchorAC   = this._aC.currentTime;
                this._playbackAnchorSong = this._audioEl.currentTime;
            }).catch(e => console.warn('[TrapNation] Autoplay blocked:', e));
        }
    }

    _updateSongInfoUI(song) {
        const t=this.querySelector('#tnvSongTitle'), a=this.querySelector('#tnvSongArtist');
        if (t) t.textContent=(song.title||'Unknown Title').toUpperCase();
        if (a) a.textContent= song.artist||'—';
    }

    _togglePlay() {
        if (!this._audioEl||!this._songs.length) return;
        this._initAudio();
        if (this._aC.state==='suspended') {
            this._aC.resume().then(() => this._doTogglePlay());
        } else {
            this._doTogglePlay();
        }
    }

    _doTogglePlay() {
        if (this._audioEl.paused) {
            this._audioEl.play().then(() => {
                // Re-anchor clock each time playback resumes
                this._playbackAnchorAC   = this._aC.currentTime;
                this._playbackAnchorSong = this._audioEl.currentTime;
            }).catch(e => console.warn(e));
        } else {
            this._audioEl.pause();
        }
    }

    _prev() {
        const idx=this._shuffle?Math.floor(Math.random()*this._songs.length):(this._currentSong-1+this._songs.length)%this._songs.length;
        this._loadSong(idx,this._isPlaying);
    }

    _next() {
        const idx=this._shuffle?Math.floor(Math.random()*this._songs.length):(this._currentSong+1)%this._songs.length;
        this._loadSong(idx,this._isPlaying);
    }

    _toggleShuffle() {
        this._shuffle=!this._shuffle;
        const btn=this.querySelector('#tnvShuffleBtn');
        if (btn) btn.classList.toggle('active',this._shuffle);
    }

    _toggleRepeat() {
        const modes=['none','all','one'];
        this._repeat=modes[(modes.indexOf(this._repeat)+1)%modes.length];
        const btn=this.querySelector('#tnvRepeatBtn');
        if (!btn) return;
        btn.classList.toggle('active',this._repeat!=='none');
        btn.innerHTML=this._repeat==='one'
            ?`<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`
            :`<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
    }

    _toggleMute() {
        if (this._volume>0){this._lastVolume=this._volume;this._volume=0;}
        else{this._volume=this._lastVolume||0.8;}
        if (this._audioEl) this._audioEl.volume=this._volume;
        const s=this.querySelector('#tnvVolSlider');
        if (s) s.value=this._volume;
        this._updateVolIcon();
    }

    _setVolume(val) {
        this._volume=parseFloat(val);
        if (this._audioEl) this._audioEl.volume=this._volume;
        this._updateVolIcon();
    }

    _updateVolIcon() {
        const vi=this.querySelector('#tnvVolIcon'),mi=this.querySelector('#tnvMuteIcon');
        if (vi) vi.style.display=this._volume===0?'none':'block';
        if (mi) mi.style.display=this._volume===0?'block':'none';
    }

    _onTimeUpdate() {
        const cur=this._audioEl.currentTime,dur=this._audioEl.duration;
        if (isNaN(dur)) return;
        const fill=this.querySelector('#tnvProgressFill'),el=this.querySelector('#tnvCurTime');
        if (fill) fill.style.width=((cur/dur)*100)+'%';
        if (el)   el.textContent=this._fmtTime(cur);
    }

    _onMetadata() {
        const dur=this._audioEl.duration;
        if (dur&&!isNaN(dur)){const el=this.querySelector('#tnvTotalTime');if(el)el.textContent=this._fmtTime(dur);}
    }

    _onEnded() {
        if (this._repeat==='one'){this._audioEl.currentTime=0;this._audioEl.play();}
        else this._next();
    }

    _onPlay()  {
        this._isPlaying=true;
        // Re-anchor Web Audio clock at the exact moment playback resumes.
        // This fixes the lookahead drifting after pause/resume cycles.
        if (this._aC) {
            this._playbackAnchorAC   = this._aC.currentTime;
            this._playbackAnchorSong = this._audioEl.currentTime;
            // Skip past any kick timestamps behind current position
            // (covers the case where user seeks while paused)
            while (this._nextKickIdx < this._kickTimestamps.length &&
                   this._kickTimestamps[this._nextKickIdx] < this._playbackAnchorSong - 0.05) {
                this._nextKickIdx++;
            }
        }
        // Reset RT detector so it doesn't treat silence-to-music jump as a kick
        this._resetRTBeat();
        const pi=this.querySelector('#tnvPlayIcon'),pa=this.querySelector('#tnvPauseIcon');
        if (pi) pi.style.display='none'; if (pa) pa.style.display='block';
    }

    _onPause() {
        this._isPlaying=false;
        // Zero beat state immediately — loop will drain smoothly
        // but zeroing here ensures the very next frame shows nothing
        this._kickEnv=0; this._bgEnv=0; this._kickStrength=0; this._bgPulse=0;
        // Reset RT beat warmup so it re-learns average on resume
        this._resetRTBeat();
        const pi=this.querySelector('#tnvPlayIcon'),pa=this.querySelector('#tnvPauseIcon');
        if (pi) pi.style.display='block'; if (pa) pa.style.display='none';
    }

    _fmtTime(s) {
        if (!s||isNaN(s)) return '0:00';
        const m=Math.floor(s/60),sc=Math.floor(s%60);
        return `${m}:${sc<10?'0':''}${sc}`;
    }

    _toggleDrawer() {
        this._drawerOpen=!this._drawerOpen;
        const drawer=this.querySelector('#tnvDrawer'),btn=this.querySelector('#tnvQueueBtn');
        if (drawer) drawer.classList.toggle('open',this._drawerOpen);
        if (btn)    btn.classList.toggle('active',this._drawerOpen);
        if (this._drawerOpen) this._renderDrawer();
    }

    _renderDrawer() {
        const body=this.querySelector('#tnvDrawerBody');
        if (!body) return;
        const q=this._searchQuery;
        const filtered=this._songs.filter(s=>!q||(s.title||'').toLowerCase().includes(q)||(s.artist||'').toLowerCase().includes(q));
        if (!filtered.length){body.innerHTML='<div class="tnv-queue-empty">NO SONGS FOUND</div>';return;}
        body.innerHTML=filtered.map((song,i)=>{
            const ai=this._songs.indexOf(song),active=ai===this._currentSong;
            const art=song.coverImage?`<img src="${this._esc(song.coverImage)}" alt="">`:'';
            return `<div class="tnv-queue-song${active?' active':''}" data-index="${ai}">
                <span class="tnv-queue-num">${i+1}</span>
                <div class="tnv-queue-art">${art}</div>
                <div class="tnv-queue-info">
                    <div class="tnv-queue-title">${this._esc(song.title||'Unknown')}</div>
                    <div class="tnv-queue-artist">${this._esc(song.artist||'—')}</div>
                </div>
                <span class="tnv-queue-dur">${song.duration||''}</span>
            </div>`;
        }).join('');
        body.querySelectorAll('.tnv-queue-song').forEach(row=>{
            row.addEventListener('click',()=>{this._loadSong(parseInt(row.dataset.index),true);this._toggleDrawer();});
        });
    }

    _esc(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}

    _bindUIEvents() {
        const wrap=this.querySelector('#tnvWrap'),strip=this.querySelector('#tnvStrip');
        const showUI=()=>{
            strip.classList.remove('hidden');wrap.classList.add('ui-visible');
            clearTimeout(this._hideTimer);
            this._hideTimer=setTimeout(()=>{strip.classList.add('hidden');wrap.classList.remove('ui-visible');},5000);
        };
        wrap.addEventListener('mousemove',showUI);
        wrap.addEventListener('mouseenter',showUI);
        strip.addEventListener('mouseenter',()=>clearTimeout(this._hideTimer));
        strip.addEventListener('mouseleave',()=>{
            this._hideTimer=setTimeout(()=>{strip.classList.add('hidden');wrap.classList.remove('ui-visible');},5000);
        });
        this.querySelector('#tnvPlayBtn')    .addEventListener('click',()=>this._togglePlay());
        this.querySelector('#tnvPrevBtn')    .addEventListener('click',()=>this._prev());
        this.querySelector('#tnvNextBtn')    .addEventListener('click',()=>this._next());
        this.querySelector('#tnvShuffleBtn') .addEventListener('click',()=>this._toggleShuffle());
        this.querySelector('#tnvRepeatBtn')  .addEventListener('click',()=>this._toggleRepeat());
        this.querySelector('#tnvVolBtn')     .addEventListener('click',()=>this._toggleMute());
        this.querySelector('#tnvVolSlider')  .addEventListener('input',e=>this._setVolume(e.target.value));
        this.querySelector('#tnvQueueBtn')   .addEventListener('click',()=>this._toggleDrawer());
        this.querySelector('#tnvDrawerClose').addEventListener('click',()=>this._toggleDrawer());
        this.querySelector('#tnvSearch')     .addEventListener('input',e=>{this._searchQuery=e.target.value.toLowerCase();this._renderDrawer();});
        this.querySelector('#tnvProgressBar').addEventListener('click',e=>{
            const rect=this.querySelector('#tnvProgressBar').getBoundingClientRect();
            const pct=(e.clientX-rect.left)/rect.width;
            if (this._audioEl&&this._audioEl.duration){
                const seekPos = pct * this._audioEl.duration;
                this._audioEl.currentTime = seekPos;
                this._nextKickIdx = 0;
                // Re-anchor the Web Audio clock after seek
                if (this._aC) {
                    this._playbackAnchorAC   = this._aC.currentTime;
                    this._playbackAnchorSong = seekPos;
                }
            }
        });
        document.addEventListener('click',e=>{
            const drawer=this.querySelector('#tnvDrawer'),qBtn=this.querySelector('#tnvQueueBtn');
            if (drawer&&this._drawerOpen&&!drawer.contains(e.target)&&qBtn&&!qBtn.contains(e.target)) this._toggleDrawer();
        });
    }
}

customElements.define('trap-nation-visualizer', TrapNationVisualizer);
