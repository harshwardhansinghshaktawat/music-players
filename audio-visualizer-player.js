// ============================================================
//  audio-reactive-player  —  Wix Blocks Custom Element
//  Three.js + WebAudio API Audio-Reactive Sphere Visualizer
//  • IcosahedronGeometry with GLSL Perlin noise displacement
//  • Frequency-split: bass drives scale/spike, mids color, highs shimmer
//  • UnrealBloom post-processing for glow
//  • Minimal player controls (transport + progress only)
//  • Same attribute API as previous widgets (player-data, primary-color, etc.)
// ============================================================

class AudioReactivePlayer extends HTMLElement {

    constructor() {
        super();
        // ── State ──
        this._playerData  = null;
        this._allSongs    = [];
        this._playlist    = [];
        this._songIdx     = -1;
        this._isPlaying   = false;
        this._volume      = 0.8;
        this._lastVolume  = 0.8;
        this._shuffle     = false;
        this._repeatMode  = 'none';
        this._seeking     = false;
        this._domReady    = false;
        this._pendingLoad = null;

        // ── Audio ──
        this._audio       = null;
        this._audioCtx    = null;
        this._analyser    = null;
        this._gainNode    = null;
        this._dataArray   = null;
        this._freqBands   = { bass: 0, mid: 0, high: 0, kick: 0 };
        this._smoothBands = { bass: 0, mid: 0, high: 0, kick: 0 };
        this._kickCooldown = 0;

        // ── Three.js ──
        this._renderer    = null;
        this._scene       = null;
        this._camera      = null;
        this._sphere      = null;
        this._innerSphere = null;
        this._composer    = null;
        this._clock       = null;
        this._animId      = null;
        this._threeLoaded = false;

        // ── Theme ──
        this._colors = {
            primary:    '#ff6b00',
            secondary:  '#ffaa44',
            background: '#0a0a0a',
            surface:    '#141414',
            textPrimary:'#f0ece4',
            textSec:    '#a09890',
            accent:     '#ff3366'
        };
    }

    static get observedAttributes() {
        return [
            'player-data', 'player-name',
            'primary-color', 'secondary-color', 'background-color',
            'surface-color', 'text-primary', 'text-secondary', 'accent-color',
            'title-font-family', 'text-font-family'
        ];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;
        if (name === 'player-data' && newVal) {
            try {
                this._playerData = JSON.parse(newVal);
                this._allSongs   = this._playerData.songs || [];
                if (this._allSongs.length && this._songIdx === -1) {
                    if (this._domReady) this._loadSong(0, this._allSongs, false);
                    else this._pendingLoad = { idx: 0, list: this._allSongs, autoPlay: false };
                }
            } catch(e) { console.error('[ARP] player-data error', e); }
        } else if (name === 'player-name' && newVal) {
            const el = this.querySelector('.arp-brand');
            if (el) el.textContent = newVal;
        } else {
            this._applyColorAttr(name, newVal);
        }
    }

    connectedCallback() {
        this._injectStyles();
        this._buildDOM();
        this._initAudio();
        this._bindEvents();
        this._domReady = true;

        // Load Three.js then boot visualizer
        this._loadThree().then(() => {
            this._initThree();
            this._animate();
        });

        if (this._pendingLoad) {
            const { idx, list, autoPlay } = this._pendingLoad;
            this._pendingLoad = null;
            this._loadSong(idx, list, autoPlay);
        } else if (this._allSongs.length && this._songIdx === -1) {
            this._loadSong(0, this._allSongs, false);
        }
    }

    disconnectedCallback() {
        if (this._animId) cancelAnimationFrame(this._animId);
        if (this._audio) this._audio.pause();
        if (this._audioCtx) this._audioCtx.close().catch(() => {});
        if (this._renderer) { this._renderer.dispose(); this._renderer = null; }
    }

    // ──────────────────────────────────────────────────────────
    //  LOAD THREE.JS + POST-PROCESSING from CDN
    // ──────────────────────────────────────────────────────────
    _loadThree() {
        // Load scripts sequentially
        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        ];
        return scripts.reduce((p, src) => p.then(() => this._loadScript(src)), Promise.resolve())
            .then(() => { this._threeLoaded = true; });
    }

    _loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src;
            s.onload  = resolve;
            s.onerror = () => { console.warn('[ARP] Failed to load', src); resolve(); };
            document.head.appendChild(s);
        });
    }

    // ──────────────────────────────────────────────────────────
    //  STYLES
    // ──────────────────────────────────────────────────────────
    _injectStyles() {
        const s = document.createElement('style');
        s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

audio-reactive-player {
    display: block;
    width: 100%; height: 100%;
    height: -webkit-fill-available;
    box-sizing: border-box;
    font-family: 'Rajdhani', sans-serif;
    --c-bg:   #0a0a0a;
    --c-surf: #141414;
    --c-b1:   #222;
    --c-b2:   #333;
    --c-acc:  #ff6b00;
    --c-acc2: #ff3366;
    --c-t1:   #f0ece4;
    --c-t2:   #a09890;
    --c-t3:   #4a4540;
    --mono:   'Share Tech Mono', monospace;
}
audio-reactive-player *, audio-reactive-player *::before, audio-reactive-player *::after {
    box-sizing: border-box; margin: 0; padding: 0;
}

/* SHELL */
.arp-shell {
    width: 100%; height: 100%;
    background: var(--c-bg);
    display: flex; flex-direction: column;
    overflow: hidden; position: relative;
    border-radius: 6px;
    border: 1px solid var(--c-b1);
}

/* TOP BAR */
.arp-top {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px;
    background: rgba(10,10,10,0.95);
    border-bottom: 1px solid var(--c-b1);
    flex-shrink: 0; z-index: 10;
    backdrop-filter: blur(8px);
}
.arp-brand {
    font-size: 11px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: var(--c-acc);
    font-family: var(--mono); flex: 1;
}
.arp-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--c-t3); flex-shrink: 0;
    transition: background .3s, box-shadow .3s;
}
.arp-dot.on { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
.arp-ibtn {
    width: 28px; height: 28px; flex-shrink: 0;
    background: transparent; border: 1px solid var(--c-b2);
    border-radius: 3px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--c-t3); padding: 0;
    transition: color .15s, border-color .15s, background .15s;
    position: relative;
}
.arp-ibtn:hover { color: var(--c-t1); border-color: var(--c-acc); }
.arp-ibtn.on { color: var(--c-acc); border-color: var(--c-acc); background: rgba(255,107,0,.08); }
.arp-ibtn svg { width: 14px; height: 14px; fill: currentColor; pointer-events: none; }
.arp-ibtn[title]:hover::after {
    content: attr(title);
    position: absolute; bottom: calc(100% + 6px); left: 50%;
    transform: translateX(-50%);
    background: #111; color: var(--c-t1); font-size: 9px;
    font-family: var(--mono); white-space: nowrap;
    padding: 3px 7px; border-radius: 2px;
    border: 1px solid var(--c-b2); pointer-events: none; z-index: 99;
}

/* THREE.JS CANVAS AREA — dominant, fills flex space */
.arp-vis-wrap {
    flex: 1; position: relative;
    overflow: hidden; min-height: 0;
    background: radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%);
}
.arp-canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }

/* Song info overlay — bottom-left of canvas */
.arp-song-overlay {
    position: absolute; bottom: 16px; left: 16px; right: 100px;
    pointer-events: none; z-index: 5;
}
.arp-overlay-title {
    font-size: 22px; font-weight: 700; line-height: 1.1;
    color: var(--c-t1); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    text-shadow: 0 2px 20px rgba(0,0,0,.8);
}
.arp-overlay-artist {
    font-size: 13px; color: var(--c-acc); font-weight: 500;
    margin-top: 2px; letter-spacing: .05em;
    text-shadow: 0 1px 12px rgba(0,0,0,.8);
}
.arp-overlay-album {
    font-size: 10px; color: var(--c-t3); margin-top: 2px;
    font-family: var(--mono); letter-spacing: .06em;
}
.arp-links-overlay {
    display: flex; gap: 5px; margin-top: 7px; flex-wrap: wrap;
    pointer-events: all;
}
.arp-link {
    padding: 2px 8px; font-size: 9px; font-weight: 600;
    letter-spacing: .06em; text-transform: uppercase;
    background: rgba(255,107,0,.12); border: 1px solid rgba(255,107,0,.3);
    color: var(--c-acc); border-radius: 2px; text-decoration: none;
    font-family: var(--mono);
    transition: background .15s, border-color .15s;
}
.arp-link:hover { background: rgba(255,107,0,.25); border-color: var(--c-acc); }

/* Frequency meters — right side overlay */
.arp-meters {
    position: absolute; bottom: 16px; right: 14px;
    display: flex; flex-direction: column; gap: 4px;
    z-index: 5; pointer-events: none;
}
.arp-meter-row {
    display: flex; align-items: center; gap: 5px;
}
.arp-meter-lbl {
    font-size: 8px; font-family: var(--mono); color: var(--c-t3);
    width: 24px; text-align: right; letter-spacing: .04em;
    text-transform: uppercase;
}
.arp-meter-track {
    width: 60px; height: 4px;
    background: rgba(255,255,255,.05); border-radius: 2px; overflow: hidden;
}
.arp-meter-fill {
    height: 100%; width: 0%; border-radius: 2px;
    transition: width .06s linear;
}
.arp-meter-bass  .arp-meter-fill { background: var(--c-acc); box-shadow: 0 0 6px var(--c-acc); }
.arp-meter-mid   .arp-meter-fill { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
.arp-meter-high  .arp-meter-fill { background: var(--c-acc2); box-shadow: 0 0 6px var(--c-acc2); }

/* PROGRESS */
.arp-prog {
    padding: 8px 14px 6px;
    background: rgba(10,10,10,0.95);
    border-top: 1px solid var(--c-b1);
    flex-shrink: 0; z-index: 10;
    backdrop-filter: blur(8px);
}
.arp-scrub {
    position: relative; height: 3px;
    background: var(--c-b1); border-radius: 2px;
    cursor: pointer; padding: 7px 0; margin: -7px 0;
}
.arp-scrub-fill {
    position: absolute; top: 7px; left: 0; height: 3px;
    background: var(--c-acc); border-radius: 2px;
    width: 0%; pointer-events: none;
    box-shadow: 0 0 8px var(--c-acc);
    transition: width .1s linear;
}
.arp-scrub-head {
    position: absolute; top: 50%; left: 0;
    width: 11px; height: 11px;
    background: var(--c-t1); border: 2px solid var(--c-acc);
    border-radius: 50%; transform: translate(-50%,-50%);
    opacity: 0; transition: opacity .15s; pointer-events: none;
    box-shadow: 0 0 8px var(--c-acc);
}
.arp-scrub:hover .arp-scrub-head { opacity: 1; }
.arp-times {
    display: flex; justify-content: space-between; margin-top: 8px;
}
.arp-t { font-size: 10px; font-family: var(--mono); color: var(--c-t3); }
.arp-t.cur { color: var(--c-t2); }

/* TRANSPORT */
.arp-xport {
    display: flex; align-items: center;
    padding: 8px 14px 10px;
    background: rgba(10,10,10,0.95);
    gap: 6px; flex-shrink: 0; z-index: 10;
    backdrop-filter: blur(8px);
}
.arp-left, .arp-right { display: flex; align-items: center; gap: 4px; }
.arp-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }

.arp-play {
    width: 40px; height: 40px;
    background: var(--c-acc); border: none; border-radius: 4px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #fff; transition: background .15s, transform .12s, box-shadow .15s;
}
.arp-play:hover { background: #ff8533; box-shadow: 0 0 16px rgba(255,107,0,.5); transform: scale(1.05); }
.arp-play:active { transform: scale(.96); }
.arp-play svg { width: 16px; height: 16px; fill: currentColor; pointer-events: none; }

.arp-skip {
    width: 30px; height: 30px; flex-shrink: 0;
    background: transparent; border: 1px solid var(--c-b2);
    border-radius: 3px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--c-t3); padding: 0;
    transition: color .15s, border-color .15s; position: relative;
}
.arp-skip:hover { color: var(--c-t1); border-color: var(--c-acc); }
.arp-skip svg { width: 14px; height: 14px; fill: currentColor; }
.arp-skip[title]:hover::after {
    content: attr(title);
    position: absolute; bottom: calc(100% + 6px); left: 50%;
    transform: translateX(-50%);
    background: #111; color: var(--c-t1); font-size: 9px;
    font-family: var(--mono); white-space: nowrap;
    padding: 3px 7px; border-radius: 2px;
    border: 1px solid var(--c-b2); pointer-events: none; z-index: 99;
}

.arp-vol { display: flex; align-items: center; gap: 5px; }
.arp-vol-sl {
    -webkit-appearance: none; appearance: none;
    width: 60px; height: 3px;
    background: var(--c-b2); border-radius: 2px; outline: none; cursor: pointer;
}
.arp-vol-sl::-webkit-slider-thumb {
    -webkit-appearance: none; width: 10px; height: 10px;
    background: var(--c-acc); border-radius: 50%; cursor: pointer;
}
.arp-vol-sl::-moz-range-thumb {
    width: 10px; height: 10px;
    background: var(--c-acc); border: none; border-radius: 50%;
}

/* LIBRARY PANEL */
.arp-lib {
    position: absolute; inset: 0; z-index: 20;
    background: rgba(8,8,8,0.97);
    transform: translateX(100%);
    transition: transform .22s cubic-bezier(.4,0,.2,1);
    display: flex; flex-direction: column;
    backdrop-filter: blur(20px);
}
.arp-lib.open { transform: translateX(0); }
.arp-lib-head {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--c-b1); flex-shrink: 0;
}
.arp-lib-title {
    flex: 1; font-size: 11px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--c-acc); font-family: var(--mono);
}
.arp-lib-body { flex: 1; overflow-y: auto; }
.arp-lib-body::-webkit-scrollbar { width: 3px; }
.arp-lib-body::-webkit-scrollbar-thumb { background: var(--c-b2); border-radius: 2px; }

/* Song rows in library */
.arp-srow {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 14px; border-bottom: 1px solid var(--c-b1);
    cursor: pointer; transition: background .12s;
}
.arp-srow:hover { background: rgba(255,255,255,.03); }
.arp-srow.on { background: rgba(255,107,0,.06); border-left: 2px solid var(--c-acc); padding-left: 12px; }
.arp-snum { font-size: 10px; font-family: var(--mono); color: var(--c-t3); width: 18px; text-align: right; flex-shrink: 0; }
.arp-srow.on .arp-snum { color: var(--c-acc); }
.arp-scover { width: 32px; height: 32px; flex-shrink: 0; border-radius: 3px; overflow: hidden; background: var(--c-b1); }
.arp-scover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.arp-smeta { flex: 1; min-width: 0; }
.arp-sname { font-size: 13px; font-weight: 600; color: var(--c-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arp-srow.on .arp-sname { color: var(--c-acc); }
.arp-ssub { font-size: 10px; color: var(--c-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arp-sdur { font-size: 10px; font-family: var(--mono); color: var(--c-t3); flex-shrink: 0; }

/* Animated bars for active song */
.arp-bars { display: none; gap: 2px; align-items: flex-end; width: 14px; height: 14px; }
.arp-srow.on .arp-bars { display: flex; }
.arp-bar { width: 3px; background: var(--c-acc); border-radius: 1px; animation: arp-bar .7s ease-in-out infinite; }
.arp-bar:nth-child(2) { animation-delay: .15s; }
.arp-bar:nth-child(3) { animation-delay: .3s; }
@keyframes arp-bar { 0%,100%{height:3px} 50%{height:13px} }

/* Empty state */
.arp-empty { text-align: center; padding: 32px 16px; color: var(--c-t3); }
.arp-empty svg { width: 30px; height: 30px; fill: var(--c-t3); opacity: .25; margin-bottom: 10px; }
.arp-empty p { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }

/* Search */
.arp-srch-wrap {
    padding: 8px 14px; border-bottom: 1px solid var(--c-b1);
    position: relative; flex-shrink: 0;
}
.arp-srch-wrap svg {
    position: absolute; left: 22px; top: 50%; transform: translateY(-50%);
    width: 11px; height: 11px; fill: var(--c-t3); pointer-events: none;
}
.arp-srch {
    width: 100%; padding: 5px 8px 5px 26px;
    background: var(--c-b1); border: 1px solid var(--c-b2);
    border-radius: 3px; color: var(--c-t1);
    font-size: 12px; font-family: 'Rajdhani', sans-serif; outline: none;
    transition: border-color .15s;
}
.arp-srch:focus { border-color: var(--c-acc); }
.arp-srch::placeholder { color: var(--c-t3); }
        `;
        this.appendChild(s);
    }

    // ──────────────────────────────────────────────────────────
    //  DOM
    // ──────────────────────────────────────────────────────────
    _buildDOM() {
        const shell = document.createElement('div');
        shell.className = 'arp-shell';
        shell.innerHTML = `
<!-- TOP BAR -->
<div class="arp-top">
    <span class="arp-brand">REACTOR·V1</span>
    <div class="arp-dot" id="arp-dot"></div>
    <button class="arp-ibtn" id="arp-lbtn" title="Open Library">
        <svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5 11.12 10 12.5 10c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
    </button>
</div>

<!-- VISUALIZER CANVAS -->
<div class="arp-vis-wrap" id="arp-vis-wrap">
    <canvas id="arp-canvas" class="arp-canvas"></canvas>

    <!-- Song info overlay -->
    <div class="arp-song-overlay">
        <div class="arp-overlay-title" id="arp-title">Select a Track</div>
        <div class="arp-overlay-artist" id="arp-artist">—</div>
        <div class="arp-overlay-album" id="arp-album"></div>
        <div class="arp-links-overlay" id="arp-links"></div>
    </div>

    <!-- Frequency meters -->
    <div class="arp-meters">
        <div class="arp-meter-row arp-meter-bass">
            <span class="arp-meter-lbl">BASS</span>
            <div class="arp-meter-track"><div class="arp-meter-fill" id="arp-m-bass"></div></div>
        </div>
        <div class="arp-meter-row arp-meter-mid">
            <span class="arp-meter-lbl">MID</span>
            <div class="arp-meter-track"><div class="arp-meter-fill" id="arp-m-mid"></div></div>
        </div>
        <div class="arp-meter-row arp-meter-high">
            <span class="arp-meter-lbl">HIGH</span>
            <div class="arp-meter-track"><div class="arp-meter-fill" id="arp-m-high"></div></div>
        </div>
    </div>
</div>

<!-- PROGRESS -->
<div class="arp-prog">
    <div class="arp-scrub" id="arp-scrub">
        <div class="arp-scrub-fill" id="arp-sfill"></div>
        <div class="arp-scrub-head" id="arp-shead"></div>
    </div>
    <div class="arp-times">
        <span class="arp-t cur" id="arp-cur">0:00</span>
        <span class="arp-t" id="arp-tot">0:00</span>
    </div>
</div>

<!-- TRANSPORT -->
<div class="arp-xport">
    <div class="arp-left">
        <button class="arp-ibtn" id="arp-shuf" title="Toggle Shuffle">
            <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
        </button>
        <button class="arp-ibtn" id="arp-rep" title="Toggle Repeat">
            <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
        </button>
    </div>
    <div class="arp-center">
        <button class="arp-skip" id="arp-prev" title="Previous Track">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button class="arp-play" id="arp-play" title="Play / Pause">
            <svg id="arp-pico" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg id="arp-paico" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <button class="arp-skip" id="arp-next" title="Next Track">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
    </div>
    <div class="arp-right">
        <div class="arp-vol">
            <button class="arp-ibtn" id="arp-mute" title="Toggle Mute">
                <svg id="arp-vico" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                <svg id="arp-mico" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            </button>
            <input type="range" class="arp-vol-sl" id="arp-vol" min="0" max="1" step="0.01" value="0.8" title="Volume">
        </div>
    </div>
</div>

<!-- LIBRARY OVERLAY -->
<div class="arp-lib" id="arp-lib">
    <div class="arp-lib-head">
        <span class="arp-lib-title">Track Library</span>
        <button class="arp-ibtn" id="arp-lclose" title="Close Library">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
    </div>
    <div class="arp-srch-wrap">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input type="text" class="arp-srch" id="arp-srch" placeholder="Search tracks...">
    </div>
    <div class="arp-lib-body" id="arp-lbody"></div>
</div>
        `;
        this.appendChild(shell);
    }

    // ──────────────────────────────────────────────────────────
    //  THREE.JS VISUALIZER
    // ──────────────────────────────────────────────────────────
    _initThree() {
        if (!window.THREE) { console.warn('[ARP] THREE not available'); return; }
        const THREE = window.THREE;
        const wrap  = this.querySelector('#arp-vis-wrap');
        const canvas= this.querySelector('#arp-canvas');
        if (!wrap || !canvas) return;

        const W = wrap.clientWidth  || 400;
        const H = wrap.clientHeight || 300;

        // Renderer
        this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this._renderer.setSize(W, H);
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.2;

        // Scene + Camera
        this._scene  = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
        this._camera.position.set(0, 0, 4.5);

        // Clock
        this._clock = new THREE.Clock();

        // ── Vertex Shader — Perlin noise displacement ──────
        const vertexShader = `
            // Classic Perlin 3D noise by Stefan Gustavson
            vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
            vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
            vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
            vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

            float cnoise(vec3 P){
                vec3 Pi0 = floor(P), Pi1 = Pi0 + vec3(1.0);
                Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
                vec3 Pf0 = fract(P), Pf1 = Pf0 - vec3(1.0);
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                vec4 iy = vec4(Pi0.yy, Pi1.yy);
                vec4 iz0 = Pi0.zzzz, iz1 = Pi1.zzzz;
                vec4 ixy  = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0);
                vec4 ixy1 = permute(ixy + iz1);
                vec4 gx0 = ixy0 * (1.0/7.0);
                vec4 gy0 = fract(floor(gx0) * (1.0/7.0)) - 0.5;
                gx0 = fract(gx0);
                vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                vec4 gx1 = ixy1 * (1.0/7.0);
                vec4 gy1 = fract(floor(gx1) * (1.0/7.0)) - 0.5;
                gx1 = fract(gx1);
                vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);
                vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
                vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);
                vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
                vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
                g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
                vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
                g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
                float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz));
                float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z));
                float n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
                float n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);
                vec3 fade_xyz=fade(Pf0);
                vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
                vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
                float n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);
                return 2.2 * n_xyz;
            }

            uniform float u_time;
            uniform float u_bass;
            uniform float u_mid;
            uniform float u_high;
            uniform float u_kick;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying float vNoise;

            void main() {
                vNormal   = normal;
                vPosition = position;

                // Noise layers: slow organic + fast audio-reactive
                float slowNoise = cnoise(position * 1.2 + u_time * 0.18);
                float fastNoise = cnoise(position * 3.5 + u_time * 0.55);

                // Bass causes big, smooth spikes; kick adds a sharp punch
                float bassDisp = u_bass * 0.55 * slowNoise;
                float kickDisp = u_kick * 0.35;
                float midDisp  = u_mid  * 0.18 * fastNoise;
                float highDisp = u_high * 0.08 * cnoise(position * 7.0 + u_time * 1.2);

                float totalDisp = bassDisp + kickDisp + midDisp + highDisp + slowNoise * 0.06;
                vNoise = totalDisp;

                vec3 newPos = position + normal * totalDisp;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `;

        // ── Fragment Shader — Fresnel + color bands ────────
        const fragmentShader = `
            uniform float u_bass;
            uniform float u_mid;
            uniform float u_high;
            uniform float u_time;
            uniform vec3  u_colorA;
            uniform vec3  u_colorB;
            uniform vec3  u_colorC;
            varying vec3  vNormal;
            varying vec3  vPosition;
            varying float vNoise;

            void main() {
                // Fresnel edge glow
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.5);

                // Color mixing driven by frequency bands
                vec3 baseColor = mix(u_colorA, u_colorB, clamp(u_bass * 1.5, 0.0, 1.0));
                baseColor = mix(baseColor, u_colorC, clamp(u_high * 2.0, 0.0, 1.0));
                baseColor = mix(baseColor, vec3(1.0), clamp(u_mid * 0.4, 0.0, 0.3));

                // Noise-based color variation
                float noiseC = clamp(vNoise * 0.8 + 0.5, 0.0, 1.0);
                baseColor = mix(baseColor * 0.6, baseColor, noiseC);

                // Fresnel glow — edges glow brighter with audio
                float glowStr = 0.6 + u_bass * 1.2 + u_high * 0.5;
                vec3 finalColor = baseColor + fresnel * glowStr * u_colorA;

                // Slight wireframe-like brightness at peaks
                finalColor += vec3(fresnel * fresnel * 0.4);

                gl_FragColor = vec4(finalColor, 0.85 + fresnel * 0.15);
            }
        `;

        // ── Build sphere mesh ──────────────────────────────
        const geo = new THREE.IcosahedronGeometry(1.6, 60);
        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time:   { value: 0 },
                u_bass:   { value: 0 },
                u_mid:    { value: 0 },
                u_high:   { value: 0 },
                u_kick:   { value: 0 },
                u_colorA: { value: new THREE.Color(this._colors.primary) },
                u_colorB: { value: new THREE.Color(this._colors.accent) },
                u_colorC: { value: new THREE.Color(this._colors.secondary) },
            },
            transparent: true,
            side: THREE.FrontSide,
        });

        this._sphere = new THREE.Mesh(geo, mat);
        this._scene.add(this._sphere);

        // ── Wireframe overlay for glow effect ─────────────
        const wireGeo = new THREE.IcosahedronGeometry(1.62, 12);
        const wireMat = new THREE.ShaderMaterial({
            vertexShader: `
                uniform float u_time;
                uniform float u_bass;
                uniform float u_kick;
                varying float vFresnel;

                vec3 mod289v3(vec3 x){return x - floor(x*(1./289.))*289.;}
                vec4 mod289v4(vec4 x){return x - floor(x*(1./289.))*289.;}
                vec4 permute4(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
                vec4 taylorInvSqrt4(vec4 r){return 1.79284291-0.85373472*r;}
                float snoise(vec3 v){
                    const vec2 C=vec2(1./6.,1./3.);
                    const vec4 D=vec4(0.,0.5,1.,2.);
                    vec3 i=floor(v+dot(v,C.yyy));
                    vec3 x0=v-i+dot(i,C.xxx);
                    vec3 g=step(x0.yzx,x0.xyz);
                    vec3 l=1.-g;
                    vec3 i1=min(g.xyz,l.zxy);
                    vec3 i2=max(g.xyz,l.zxy);
                    vec3 x1=x0-i1+C.xxx;
                    vec3 x2=x0-i2+C.yyy;
                    vec3 x3=x0-D.yyy;
                    i=mod289v3(i);
                    vec4 p=permute4(permute4(permute4(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
                    float n_=.142857142857;
                    vec3 ns=n_*D.wyz-D.xzx;
                    vec4 j=p-49.*floor(p*ns.z*ns.z);
                    vec4 x_=floor(j*ns.z);
                    vec4 y_=floor(j-7.*x_);
                    vec4 x=x_*ns.x+ns.yyyy;
                    vec4 y=y_*ns.x+ns.yyyy;
                    vec4 h=1.-abs(x)-abs(y);
                    vec4 b0=vec4(x.xy,y.xy);
                    vec4 b1=vec4(x.zw,y.zw);
                    vec4 s0=floor(b0)*2.+1.;
                    vec4 s1=floor(b1)*2.+1.;
                    vec4 sh=-step(h,vec4(0.));
                    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
                    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
                    vec3 p0=vec3(a0.xy,h.x);
                    vec3 p1=vec3(a0.zw,h.y);
                    vec3 p2=vec3(a1.xy,h.z);
                    vec3 p3=vec3(a1.zw,h.w);
                    vec4 norm=taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
                    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
                    m=m*m;
                    return 42.*dot(m*m,vec3(dot(p0,x0),dot(p1,x1),dot(p2,x2),vec3(dot(p3,x3))).xxx);
                }

                void main(){
                    vec3 viewDir = normalize(cameraPosition - position);
                    vFresnel = pow(1.0 - abs(dot(normalize(normal), viewDir)), 2.0);
                    float n = snoise(position * 1.5 + u_time * 0.2);
                    vec3 disp = position + normal * (u_bass * 0.55 + u_kick * 0.35) * (n * 0.5 + 0.5);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(disp, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 u_colorA;
                uniform float u_bass;
                uniform float u_high;
                varying float vFresnel;
                void main(){
                    float alpha = vFresnel * (0.25 + u_bass * 0.5 + u_high * 0.2);
                    gl_FragColor = vec4(u_colorA, alpha);
                }
            `,
            uniforms: {
                u_time:   { value: 0 },
                u_bass:   { value: 0 },
                u_kick:   { value: 0 },
                u_high:   { value: 0 },
                u_colorA: { value: new THREE.Color(this._colors.primary) },
            },
            wireframe: true,
            transparent: true,
        });
        this._wireframe = new THREE.Mesh(wireGeo, wireMat);
        this._scene.add(this._wireframe);

        // ── Ambient point light for depth ──────────────────
        const light1 = new THREE.PointLight(0xffffff, 1.5, 20);
        light1.position.set(3, 3, 3);
        this._scene.add(light1);
        const light2 = new THREE.PointLight(this._colors.accent, 1.2, 15);
        light2.position.set(-3, -2, 2);
        this._scene.add(light2);
        this._light2 = light2;

        // Particles ring
        this._buildParticles(THREE);

        // Handle resize
        const ro = new ResizeObserver(() => this._onResize());
        ro.observe(wrap);
        this._ro = ro;
    }

    _buildParticles(THREE) {
        const count  = 180;
        const pos    = new Float32Array(count * 3);
        const sizes  = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const r     = 2.2 + Math.random() * 0.6;
            pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = r * Math.cos(phi);
            sizes[i]   = Math.random() * 3 + 1;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                u_bass:   { value: 0 },
                u_colorA: { value: new THREE.Color(this._colors.primary) },
                u_time:   { value: 0 },
            },
            vertexShader: `
                attribute float size;
                uniform float u_bass;
                uniform float u_time;
                void main(){
                    float pulse = 1.0 + u_bass * 0.4 * sin(u_time * 3.0 + position.x * 2.0);
                    vec3 pos = position * pulse;
                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (1.0 + u_bass * 2.5) * (300.0 / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                uniform vec3 u_colorA;
                uniform float u_bass;
                void main(){
                    float d = length(gl_PointCoord - vec2(0.5));
                    if(d > 0.5) discard;
                    float alpha = (1.0 - d*2.0) * (0.4 + u_bass * 0.6);
                    gl_FragColor = vec4(u_colorA, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
        });
        this._particles = new THREE.Points(geo, mat);
        this._scene.add(this._particles);
    }

    _onResize() {
        if (!this._renderer) return;
        const wrap = this.querySelector('#arp-vis-wrap');
        if (!wrap) return;
        const W = wrap.clientWidth, H = wrap.clientHeight;
        if (!W || !H) return;
        this._camera.aspect = W / H;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(W, H);
    }

    // ──────────────────────────────────────────────────────────
    //  ANIMATION LOOP
    // ──────────────────────────────────────────────────────────
    _animate() {
        this._animId = requestAnimationFrame(() => this._animate());
        if (!this._renderer || !this._scene || !this._camera) return;

        const t    = this._clock ? this._clock.getElapsedTime() : 0;
        const bands= this._smoothBands;

        // Smooth interpolation for all bands
        const lerp = (a, b, k) => a + (b - a) * k;
        this._smoothBands.bass = lerp(bands.bass, this._freqBands.bass, 0.12);
        this._smoothBands.mid  = lerp(bands.mid,  this._freqBands.mid,  0.10);
        this._smoothBands.high = lerp(bands.high, this._freqBands.high, 0.08);
        this._smoothBands.kick = lerp(bands.kick, this._freqBands.kick, 0.22);

        const sb = this._smoothBands;

        if (this._sphere) {
            const u = this._sphere.material.uniforms;
            u.u_time.value = t;
            u.u_bass.value = sb.bass;
            u.u_mid.value  = sb.mid;
            u.u_high.value = sb.high;
            u.u_kick.value = sb.kick;
            // Slow auto-rotation + audio-reactive speed boost
            this._sphere.rotation.y += 0.003 + sb.bass * 0.015;
            this._sphere.rotation.x += 0.001 + sb.mid  * 0.005;
        }
        if (this._wireframe) {
            const u = this._wireframe.material.uniforms;
            u.u_time.value = t;
            u.u_bass.value = sb.bass;
            u.u_kick.value = sb.kick;
            u.u_high.value = sb.high;
            this._wireframe.rotation.copy(this._sphere.rotation);
        }
        if (this._particles) {
            const u = this._particles.material.uniforms;
            u.u_bass.value = sb.bass;
            u.u_time.value = t;
            this._particles.rotation.y += 0.001 + sb.high * 0.006;
            this._particles.rotation.x -= 0.0005;
        }

        // Kick decay
        if (this._freqBands.kick > 0) {
            this._freqBands.kick *= 0.85;
        }

        // Update meters
        this._updateMeters(sb);

        this._renderer.render(this._scene, this._camera);
    }

    _updateMeters(sb) {
        const bass = this.querySelector('#arp-m-bass');
        const mid  = this.querySelector('#arp-m-mid');
        const high = this.querySelector('#arp-m-high');
        if (bass) bass.style.width = Math.min(100, sb.bass * 130) + '%';
        if (mid)  mid.style.width  = Math.min(100, sb.mid  * 130) + '%';
        if (high) high.style.width = Math.min(100, sb.high * 130) + '%';
    }

    // ──────────────────────────────────────────────────────────
    //  AUDIO INIT + ANALYSIS
    // ──────────────────────────────────────────────────────────
    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';

        try {
            this._audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
            const src        = this._audioCtx.createMediaElementSource(this._audio);
            this._gainNode   = this._audioCtx.createGain();
            this._analyser   = this._audioCtx.createAnalyser();
            this._analyser.fftSize          = 2048;
            this._analyser.smoothingTimeConstant = 0.75;
            this._dataArray  = new Uint8Array(this._analyser.frequencyBinCount);

            src.connect(this._gainNode);
            this._gainNode.connect(this._analyser);
            this._analyser.connect(this._audioCtx.destination);
            this._gainNode.gain.value = this._volume;

            // Start frequency analysis loop
            this._analysisLoop();
        } catch(e) { console.warn('[ARP] Web Audio unavailable', e); }

        this._audio.addEventListener('timeupdate',     () => this._onTime());
        this._audio.addEventListener('loadedmetadata', () => this._onMeta());
        this._audio.addEventListener('ended',          () => this._onEnd());
        this._audio.addEventListener('play',           () => this._onPlay());
        this._audio.addEventListener('pause',          () => this._onPause());
    }

    _analysisLoop() {
        const loop = () => {
            requestAnimationFrame(loop);
            if (!this._analyser || !this._dataArray) return;
            this._analyser.getByteFrequencyData(this._dataArray);

            const N = this._dataArray.length;
            // Frequency bin ranges (approximate for 44.1kHz, fftSize=2048)
            // Bass: 0-150Hz → bins 0-7
            // Low-Mid: 150-500Hz → bins 7-23
            // Mid: 500-4kHz → bins 23-186
            // High: 4k-20kHz → bins 186-N
            let bassSum = 0, midSum = 0, highSum = 0;
            const bassEnd = Math.floor(N * 0.035);
            const midEnd  = Math.floor(N * 0.18);

            for (let i = 0; i < bassEnd; i++) bassSum += this._dataArray[i];
            for (let i = bassEnd; i < midEnd;  i++) midSum  += this._dataArray[i];
            for (let i = midEnd;  i < N;       i++) highSum += this._dataArray[i];

            const bassNorm = (bassSum / bassEnd) / 255;
            const midNorm  = (midSum  / (midEnd - bassEnd)) / 255;
            const highNorm = (highSum / (N - midEnd)) / 255;

            this._freqBands.bass = bassNorm;
            this._freqBands.mid  = midNorm;
            this._freqBands.high = highNorm;

            // Kick detection: sharp bass transient
            if (this._kickCooldown > 0) {
                this._kickCooldown--;
            } else if (bassNorm > 0.72 && bassNorm > this._freqBands.bass * 1.4) {
                this._freqBands.kick = 1.0;
                this._kickCooldown   = 12;
            }
        };
        loop();
    }

    // ──────────────────────────────────────────────────────────
    //  AUDIO EVENT HANDLERS
    // ──────────────────────────────────────────────────────────
    _onPlay() {
        this._isPlaying = true;
        this._q('arp-pico') .style.display = 'none';
        this._q('arp-paico').style.display = 'block';
        this._q('arp-dot')  .classList.add('on');
        if (this._audioCtx?.state === 'suspended') this._audioCtx.resume();
    }
    _onPause() {
        this._isPlaying = false;
        this._q('arp-pico') .style.display = 'block';
        this._q('arp-paico').style.display = 'none';
        this._q('arp-dot')  .classList.remove('on');
    }
    _onTime() {
        if (!this._audio || this._seeking) return;
        const cur = this._audio.currentTime, dur = this._audio.duration;
        if (isNaN(dur)) return;
        const p = cur / dur;
        this._q('arp-sfill').style.width = (p*100) + '%';
        this._q('arp-shead').style.left  = (p*100) + '%';
        this._q('arp-cur').textContent   = this._fmt(cur);
    }
    _onMeta() {
        const d = this._audio?.duration;
        if (d && !isNaN(d)) this._q('arp-tot').textContent = this._fmt(d);
    }
    _onEnd() {
        if (this._repeatMode === 'one') {
            this._audio.currentTime = 0;
            this._audio.play().catch(() => {});
        } else {
            this._nextAutoPlay();
        }
    }

    // ──────────────────────────────────────────────────────────
    //  PLAYBACK
    // ──────────────────────────────────────────────────────────
    _loadSong(idx, list, autoPlay = true) {
        if (!list?.[idx]) return;
        this._playlist = list;
        this._songIdx  = idx;
        const song = list[idx];
        if (this._audio) {
            this._audio.pause();
            if (song.audioFile) {
                this._audio.src = song.audioFile;
                this._audio.load();
                if (autoPlay) {
                    if (this._audioCtx?.state === 'suspended') this._audioCtx.resume().catch(() => {});
                    this._audio.play().catch(e => console.warn('[ARP] play blocked:', e));
                }
            }
        }
        this._nowPlaying(song);
        this._renderLib();
    }

    _togglePlay() {
        if (!this._audio) return;
        if (this._songIdx === -1 && this._allSongs.length) { this._loadSong(0, this._allSongs, true); return; }
        if (this._audio.paused) {
            if (this._audioCtx?.state === 'suspended') this._audioCtx.resume();
            this._audio.play().catch(() => {});
        } else { this._audio.pause(); }
    }

    _nextAutoPlay() {
        if (!this._playlist?.length) return;
        const idx = this._shuffle
            ? Math.floor(Math.random() * this._playlist.length)
            : (this._songIdx + 1) % this._playlist.length;
        this._loadSong(idx, this._playlist, true);
    }

    _next() {
        if (!this._playlist?.length) return;
        const idx = this._shuffle
            ? Math.floor(Math.random() * this._playlist.length)
            : (this._songIdx + 1) % this._playlist.length;
        this._loadSong(idx, this._playlist, this._isPlaying);
    }

    _prev() {
        if (!this._playlist?.length) return;
        if (this._audio?.currentTime > 3) { this._audio.currentTime = 0; return; }
        const idx = this._shuffle
            ? Math.floor(Math.random() * this._playlist.length)
            : (this._songIdx - 1 + this._playlist.length) % this._playlist.length;
        this._loadSong(idx, this._playlist, this._isPlaying);
    }

    // ──────────────────────────────────────────────────────────
    //  NOW PLAYING UI
    // ──────────────────────────────────────────────────────────
    _nowPlaying(song) {
        const title  = this.querySelector('#arp-title');
        const artist = this.querySelector('#arp-artist');
        const album  = this.querySelector('#arp-album');
        const links  = this.querySelector('#arp-links');

        if (title)  title.textContent  = song.title  || 'Unknown';
        if (artist) artist.textContent = song.artist || '—';
        if (album)  album.textContent  = song.album  ? `${song.album}` : '';

        if (links) {
            const sl = song.streamingLinks || {}, lns = [];
            if (sl.spotify)        lns.push(['Spotify',     sl.spotify]);
            if (sl.apple)          lns.push(['Apple Music', sl.apple]);
            if (sl.youtube)        lns.push(['YouTube',     sl.youtube]);
            if (sl.soundcloud)     lns.push(['SoundCloud',  sl.soundcloud]);
            if (song.purchaseLink) lns.push(['Buy Now',     song.purchaseLink]);
            links.innerHTML = lns.map(([l,u]) =>
                `<a href="${u}" target="_blank" class="arp-link" title="Listen on ${l}">${l}</a>`
            ).join('');
        }

        // Update Three.js sphere color from cover image dominant color (approximated from accent)
        if (this._sphere && window.THREE) {
            const THREE = window.THREE;
            this._sphere.material.uniforms.u_colorA.value = new THREE.Color(this._colors.primary);
            this._sphere.material.uniforms.u_colorB.value = new THREE.Color(this._colors.accent);
        }

        const cur = this.querySelector('#arp-cur');
        const tot = this.querySelector('#arp-tot');
        if (cur) cur.textContent = '0:00';
        if (tot) tot.textContent = '0:00';
        const fill = this.querySelector('#arp-sfill');
        const head = this.querySelector('#arp-shead');
        if (fill) fill.style.width = '0%';
        if (head) head.style.left  = '0%';
    }

    // ──────────────────────────────────────────────────────────
    //  LIBRARY
    // ──────────────────────────────────────────────────────────
    _libToggle(open) {
        const lib = this.querySelector('#arp-lib');
        const btn = this.querySelector('#arp-lbtn');
        if (lib) lib.classList.toggle('open', open);
        if (btn) btn.classList.toggle('on', open);
        if (open) this._renderLib();
    }

    _renderLib() {
        const body  = this.querySelector('#arp-lbody');
        const srch  = this.querySelector('#arp-srch');
        if (!body) return;

        const q    = srch?.value?.toLowerCase() || '';
        const list = this._allSongs.filter(s =>
            !q || (s.title||'').toLowerCase().includes(q) ||
                  (s.artist||'').toLowerCase().includes(q) ||
                  (s.album||'').toLowerCase().includes(q)
        );

        if (!list.length) {
            body.innerHTML = `<div class="arp-empty">
                <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
                <p>No tracks found</p></div>`;
            return;
        }

        body.innerHTML = list.map((song, i) => {
            const active = this._playlist?.indexOf(song) === this._songIdx && this._songIdx !== -1;
            return `
            <div class="arp-srow${active?' on':''}" data-i="${i}">
                <span class="arp-snum">${active ? '' : (i+1)}</span>
                <div class="arp-bars"><div class="arp-bar"></div><div class="arp-bar"></div><div class="arp-bar"></div></div>
                <div class="arp-scover">${song.coverImage ? `<img src="${song.coverImage}" alt="" loading="lazy">` : ''}</div>
                <div class="arp-smeta">
                    <div class="arp-sname">${this._esc(song.title||'Unknown')}</div>
                    <div class="arp-ssub">${this._esc(song.artist||'—')}${song.album?' · '+this._esc(song.album):''}</div>
                </div>
                <span class="arp-sdur">${song.duration||''}</span>
            </div>`;
        }).join('');

        body.querySelectorAll('.arp-srow').forEach(row =>
            row.addEventListener('click', () => {
                const realSong = list[parseInt(row.dataset.i)];
                const realIdx  = this._allSongs.indexOf(realSong);
                this._loadSong(realIdx >= 0 ? realIdx : parseInt(row.dataset.i), this._allSongs, true);
                this._libToggle(false);
            })
        );
    }

    // ──────────────────────────────────────────────────────────
    //  EVENT BINDING
    // ──────────────────────────────────────────────────────────
    _bindEvents() {
        this._q('arp-lbtn')  .addEventListener('click', () => this._libToggle(true));
        this._q('arp-lclose').addEventListener('click', () => this._libToggle(false));
        this._q('arp-play')  .addEventListener('click', () => this._togglePlay());
        this._q('arp-prev')  .addEventListener('click', () => this._prev());
        this._q('arp-next')  .addEventListener('click', () => this._next());

        this._q('arp-shuf').addEventListener('click', () => {
            this._shuffle = !this._shuffle;
            this._q('arp-shuf').classList.toggle('on', this._shuffle);
        });

        this._q('arp-rep').addEventListener('click', () => {
            const m = ['none','all','one'];
            this._repeatMode = m[(m.indexOf(this._repeatMode)+1) % m.length];
            const btn = this._q('arp-rep');
            btn.classList.toggle('on', this._repeatMode !== 'none');
            btn.title = `Repeat: ${this._repeatMode}`;
        });

        const volEl = this._q('arp-vol');
        volEl.addEventListener('input', e => {
            this._volume = parseFloat(e.target.value);
            if (this._gainNode) this._gainNode.gain.value = this._volume;
            this._updateVolIcon();
        });
        this._q('arp-mute').addEventListener('click', () => {
            if (this._volume > 0) { this._lastVolume = this._volume; this._volume = 0; }
            else this._volume = this._lastVolume || 0.8;
            volEl.value = this._volume;
            if (this._gainNode) this._gainNode.gain.value = this._volume;
            this._updateVolIcon();
        });

        const scrub = this._q('arp-scrub');
        const pct = e => {
            const r = scrub.getBoundingClientRect();
            return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        };
        scrub.addEventListener('click', e => {
            if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
        });
        scrub.addEventListener('mousedown', () => {
            this._seeking = true;
            const mv = e => { this._q('arp-sfill').style.width = (pct(e)*100)+'%'; };
            const up = e => {
                if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
                this._seeking = false;
                document.removeEventListener('mousemove', mv);
                document.removeEventListener('mouseup',   up);
            };
            document.addEventListener('mousemove', mv);
            document.addEventListener('mouseup',   up);
        });

        const srch = this._q('arp-srch');
        if (srch) srch.addEventListener('input', () => this._renderLib());

        // player-command events from PlayerAPI
        this.addEventListener('player-command', e => {
            const { command, data } = e.detail || {};
            switch(command) {
                case 'play':   this._audio?.play().catch(()=>{}); break;
                case 'pause':  this._audio?.pause(); break;
                case 'next':   this._next(); break;
                case 'previous': this._prev(); break;
                case 'setVolume':
                    this._volume = data?.volume ?? this._volume;
                    if (this._gainNode) this._gainNode.gain.value = this._volume;
                    const vEl = this._q('arp-vol');
                    if (vEl) vEl.value = this._volume;
                    break;
                case 'seekTo':
                    if (this._audio?.duration && data?.position != null)
                        this._audio.currentTime = data.position * this._audio.duration;
                    break;
                case 'shuffle': this._shuffle = data?.enable ?? !this._shuffle; break;
                case 'repeat':  this._repeatMode = data?.enable ? 'all' : 'none'; break;
            }
        });
    }

    // ──────────────────────────────────────────────────────────
    //  COLOR THEMING
    // ──────────────────────────────────────────────────────────
    _applyColorAttr(name, val) {
        if (!val) return;
        const map = {
            'primary-color':    ['--c-acc',  'primary'],
            'secondary-color':  ['--c-acc2', 'secondary'],
            'background-color': ['--c-bg',   'background'],
            'surface-color':    ['--c-surf', 'surface'],
            'text-primary':     ['--c-t1',   'textPrimary'],
            'text-secondary':   ['--c-t2',   'textSec'],
            'accent-color':     ['--c-acc2', 'accent'],
        };
        const entry = map[name];
        if (!entry) return;
        const [cssVar, colorKey] = entry;
        this.style.setProperty(cssVar, val);
        this._colors[colorKey] = val;

        // Update Three.js uniforms if sphere ready
        if (this._sphere && window.THREE) {
            const THREE = window.THREE;
            this._sphere.material.uniforms.u_colorA.value = new THREE.Color(this._colors.primary);
            this._sphere.material.uniforms.u_colorB.value = new THREE.Color(this._colors.accent);
            this._sphere.material.uniforms.u_colorC.value = new THREE.Color(this._colors.secondary);
        }
        if (this._wireframe && window.THREE) {
            const THREE = window.THREE;
            this._wireframe.material.uniforms.u_colorA.value = new THREE.Color(this._colors.primary);
        }
        if (this._particles && window.THREE) {
            const THREE = window.THREE;
            this._particles.material.uniforms.u_colorA.value = new THREE.Color(this._colors.primary);
        }
        if (this._light2 && window.THREE) {
            this._light2.color = new window.THREE.Color(this._colors.accent);
        }
    }

    // ──────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────
    _q(id) { return this.querySelector('#' + id); }

    _updateVolIcon() {
        const vi = this._q('arp-vico'), mi = this._q('arp-mico');
        if (vi) vi.style.display = this._volume === 0 ? 'none'  : 'block';
        if (mi) mi.style.display = this._volume === 0 ? 'block' : 'none';
    }

    _fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s/60), sec = Math.floor(s%60);
        return `${m}:${sec<10?'0':''}${sec}`;
    }

    _esc(t) {
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }
}

customElements.define('audio-reactive-player', AudioReactivePlayer);
