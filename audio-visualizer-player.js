// ============================================================
//  audio-reactive-player  —  Wix Blocks Custom Element
//
//  Faithful to Wael Yasmina's tutorial:
//  • IcosahedronGeometry(4, 30) wireframe
//  • pnoise (Ashima periodic) vertex displacement
//  • u_frequency from getAverageFrequency() drives displacement
//  • UnrealBloom post-processing via EffectComposer (CDN imports)
//    bloomPass.threshold=0.5, strength=0.4, radius=0.8
//  • Mouse-parallax camera (tutorial's exact formula)
//  • RGB uniforms → fragment shader (panel color pickers drive these)
//  • Transparent glass control bar pinned to bottom
//  • NO freq meters, NO particles, NO overcomplicated glow
// ============================================================

class AudioReactivePlayer extends HTMLElement {

    constructor() {
        super();
        // State
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

        // Audio
        this._audio       = null;
        this._audioCtx    = null;
        this._analyser    = null;
        this._gainNode    = null;
        this._avgFreq     = 0;

        // Three.js objects
        this._renderer    = null;
        this._scene       = null;
        this._camera      = null;
        this._mesh        = null;
        this._composer    = null;
        this._bloomPass   = null;
        this._clock       = null;
        this._animId      = null;
        this._uniforms    = null;
        this._mouseX      = 0;
        this._mouseY      = 0;

        // Tutorial colour params (driven by panel pickers)
        this._params = {
            red:       1.0,
            green:     1.0,
            blue:      1.0,
            threshold: 0.5,
            strength:  0.4,
            radius:    0.8,
        };
    }

    // ── Observed attributes ───────────────────────────────────
    static get observedAttributes() {
        return [
            'player-data', 'player-name',
            'primary-color', 'secondary-color', 'background-color',
            'surface-color', 'text-primary', 'text-secondary', 'accent-color',
            'title-font-family', 'text-font-family'
        ];
    }

    attributeChangedCallback(name, _, newVal) {
        if (!newVal) return;
        if (name === 'player-data') {
            try {
                this._playerData = JSON.parse(newVal);
                this._allSongs   = this._playerData.songs || [];
                if (this._allSongs.length && this._songIdx === -1) {
                    if (this._domReady) this._loadSong(0, this._allSongs, false);
                    else this._pendingLoad = { idx: 0, list: this._allSongs, autoPlay: false };
                }
            } catch(e) { console.error('[ARP] player-data parse error', e); }

        } else if (name === 'player-name') {
            const el = this.querySelector('#arp-brand');
            if (el) el.textContent = newVal;

        } else if (name === 'primary-color') {
            // primary-color → sphere wireframe colour
            const rgb = this._hex01(newVal);
            if (rgb) {
                this._params.red   = rgb.r;
                this._params.green = rgb.g;
                this._params.blue  = rgb.b;
                if (this._uniforms) {
                    this._uniforms.u_red.value   = rgb.r;
                    this._uniforms.u_green.value = rgb.g;
                    this._uniforms.u_blue.value  = rgb.b;
                }
            }
        }
        // Other colour props don't map to the sphere — they only affect CSS vars
        // which the shell already picks up via inline style on the element.
    }

    // ── Lifecycle ─────────────────────────────────────────────
    connectedCallback() {
        this._injectCSS();
        this._buildDOM();
        this._bindEvents();
        this._initAudio();
        this._domReady = true;

        // Load Three r128 then the post-processing helpers
        this._loadScriptsSequentially([
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
            // EffectComposer + passes — use the jsDelivr mirror which has the full examples bundle
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/OutputPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js',
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js',
        ]).then(() => {
            this._initThree();
            this._startLoop();
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
        if (this._animId)   cancelAnimationFrame(this._animId);
        if (this._audio)    this._audio.pause();
        if (this._audioCtx) this._audioCtx.close().catch(() => {});
        if (this._renderer) { this._renderer.dispose(); this._renderer = null; }
        if (this._ro)       this._ro.disconnect();
    }

    // ── Script loader ─────────────────────────────────────────
    _loadScript(src) {
        return new Promise(resolve => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s   = document.createElement('script');
            s.src     = src;
            s.onload  = resolve;
            s.onerror = () => { console.warn('[ARP] Failed to load', src); resolve(); };
            document.head.appendChild(s);
        });
    }

    _loadScriptsSequentially(srcs) {
        return srcs.reduce((p, src) => p.then(() => this._loadScript(src)), Promise.resolve());
    }

    // ── CSS ───────────────────────────────────────────────────
    _injectCSS() {
        if (this.querySelector('style[data-arp]')) return;
        const s = document.createElement('style');
        s.setAttribute('data-arp', '1');
        s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

audio-reactive-player {
    display: block;
    width: 100%;
    height: 100%;
    height: -webkit-fill-available;
    box-sizing: border-box;
    font-family: 'Rajdhani', sans-serif;
    --mono: 'Share Tech Mono', monospace;
}
audio-reactive-player *,
audio-reactive-player *::before,
audio-reactive-player *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* ─── Shell: pure black, no border ─── */
.arp-shell {
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

/* ─── Canvas wrapper fills remaining space ─── */
.arp-vis {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 0;
}
#arp-canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
}

/* ─── Hud elements overlaid on canvas ─── */
/* Brand — centred top */
#arp-brand {
    position: absolute;
    top: 13px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: rgba(255,255,255,.18);
    font-family: var(--mono);
    pointer-events: none;
    white-space: nowrap;
    z-index: 4;
}

/* Status dot — top right */
#arp-dot {
    position: absolute;
    top: 15px;
    right: 14px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,.12);
    z-index: 4;
    transition: background .3s, box-shadow .3s;
}
#arp-dot.on {
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e80;
}

/* Library toggle — top left */
#arp-lbtn {
    position: absolute;
    top: 9px;
    left: 12px;
    z-index: 5;
    width: 26px;
    height: 26px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,.28);
    padding: 0;
    transition: color .15s, border-color .15s, background .15s;
}
#arp-lbtn:hover, #arp-lbtn.on {
    color: #fff;
    border-color: rgba(255,255,255,.3);
    background: rgba(255,255,255,.08);
}
#arp-lbtn svg { width: 13px; height: 13px; fill: currentColor; }

/* Song info — bottom left, inside canvas area */
.arp-songinfo {
    position: absolute;
    bottom: 14px;
    left: 14px;
    right: 14px;
    pointer-events: none;
    z-index: 4;
}
.arp-songtitle {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.1;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: .01em;
    text-shadow: 0 2px 24px rgba(0,0,0,.6);
}
.arp-songartist {
    font-size: 11px;
    color: rgba(255,255,255,.42);
    letter-spacing: .12em;
    text-transform: uppercase;
    font-family: var(--mono);
    margin-top: 3px;
}
.arp-links {
    display: flex;
    gap: 4px;
    margin-top: 6px;
    flex-wrap: wrap;
    pointer-events: all;
}
.arp-link {
    padding: 2px 7px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.12);
    color: rgba(255,255,255,.45);
    border-radius: 2px;
    text-decoration: none;
    font-family: var(--mono);
    transition: background .15s, color .15s;
}
.arp-link:hover {
    background: rgba(255,255,255,.13);
    color: #fff;
}

/* ─── Transparent controls strip ─── */
.arp-controls {
    flex-shrink: 0;
    background: rgba(0,0,0,.5);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255,255,255,.055);
    padding: 9px 14px 12px;
    z-index: 10;
}

/* Scrubber row */
.arp-scrub-row {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
}
.arp-time {
    font-size: 10px;
    font-family: var(--mono);
    color: rgba(255,255,255,.28);
    flex-shrink: 0;
    min-width: 30px;
}
.arp-time.cur { color: rgba(255,255,255,.52); }

.arp-scrub {
    flex: 1;
    position: relative;
    height: 2px;
    background: rgba(255,255,255,.1);
    border-radius: 2px;
    cursor: pointer;
    /* Expand hit area */
    padding: 8px 0;
    margin: -8px 0;
}
.arp-scrub-fill {
    position: absolute;
    top: 8px;
    left: 0;
    height: 2px;
    background: #fff;
    border-radius: 2px;
    width: 0%;
    pointer-events: none;
    transition: width .1s linear;
}
.arp-scrub-thumb {
    position: absolute;
    top: 50%;
    left: 0%;
    width: 9px;
    height: 9px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s;
}
.arp-scrub:hover .arp-scrub-thumb { opacity: 1; }

/* Transport row */
.arp-transport {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.arp-tl { display: flex; align-items: center; gap: 4px; }
.arp-tc { display: flex; align-items: center; gap: 7px; }
.arp-tr { display: flex; align-items: center; gap: 5px; }

/* Ghost icon buttons */
.arp-btn {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    background: transparent;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,.28);
    padding: 0;
    transition: color .15s, border-color .15s;
    position: relative;
}
.arp-btn:hover { color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.25); }
.arp-btn.on    { color: #fff;                  border-color: rgba(255,255,255,.4);  }
.arp-btn svg   { width: 12px; height: 12px; fill: currentColor; pointer-events: none; }

/* Tooltip on buttons */
.arp-btn[title]:hover::after,
.arp-playbtn[title]:hover::after,
.arp-skipbtn[title]:hover::after {
    content: attr(title);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,.9);
    color: rgba(255,255,255,.7);
    font-size: 9px;
    font-family: var(--mono);
    white-space: nowrap;
    padding: 3px 7px;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,.1);
    pointer-events: none;
    z-index: 99;
}

/* Play button — solid white */
.arp-playbtn {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,.9);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    padding: 0;
    transition: background .15s, transform .1s;
    position: relative;
}
.arp-playbtn:hover  { background: #fff; transform: scale(1.04); }
.arp-playbtn:active { transform: scale(.95); }
.arp-playbtn svg    { width: 14px; height: 14px; fill: currentColor; }

/* Skip buttons */
.arp-skipbtn {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background: transparent;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,.35);
    padding: 0;
    transition: color .15s, border-color .15s;
    position: relative;
}
.arp-skipbtn:hover { color: #fff; border-color: rgba(255,255,255,.28); }
.arp-skipbtn svg   { width: 13px; height: 13px; fill: currentColor; }

/* Volume */
.arp-vol { display: flex; align-items: center; gap: 5px; }
.arp-vol-sl {
    -webkit-appearance: none;
    appearance: none;
    width: 52px;
    height: 2px;
    background: rgba(255,255,255,.12);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
}
.arp-vol-sl::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: 8px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
}
.arp-vol-sl::-moz-range-thumb {
    width: 8px;
    height: 8px;
    background: #fff;
    border: none;
    border-radius: 50%;
}

/* ─── Library overlay ─── */
.arp-lib {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: rgba(4,4,4,.96);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    transform: translateX(100%);
    transition: transform .22s cubic-bezier(.4,0,.2,1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.arp-lib.open { transform: translateX(0); }

.arp-lib-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    flex-shrink: 0;
}
.arp-lib-label {
    flex: 1;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: rgba(255,255,255,.3);
    font-family: var(--mono);
}
.arp-lib-close {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,.3);
    padding: 0;
    transition: color .15s, border-color .15s;
}
.arp-lib-close:hover { color: #fff; border-color: rgba(255,255,255,.3); }
.arp-lib-close svg { width: 11px; height: 11px; fill: currentColor; }

.arp-search-wrap {
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    position: relative;
    flex-shrink: 0;
}
.arp-search-wrap svg {
    position: absolute;
    left: 22px;
    top: 50%;
    transform: translateY(-50%);
    width: 11px;
    height: 11px;
    fill: rgba(255,255,255,.2);
    pointer-events: none;
}
.arp-search {
    width: 100%;
    padding: 6px 8px 6px 26px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 3px;
    color: #fff;
    font-size: 12px;
    font-family: 'Rajdhani', sans-serif;
    outline: none;
    transition: border-color .15s;
}
.arp-search:focus { border-color: rgba(255,255,255,.25); }
.arp-search::placeholder { color: rgba(255,255,255,.18); }

.arp-lib-body {
    flex: 1;
    overflow-y: auto;
}
.arp-lib-body::-webkit-scrollbar { width: 3px; }
.arp-lib-body::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.08);
    border-radius: 2px;
}

/* Song rows */
.arp-srow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 14px;
    border-bottom: 1px solid rgba(255,255,255,.04);
    cursor: pointer;
    transition: background .1s;
}
.arp-srow:hover { background: rgba(255,255,255,.03); }
.arp-srow.on {
    background: rgba(255,255,255,.05);
    border-left: 2px solid rgba(255,255,255,.35);
    padding-left: 12px;
}
.arp-snum {
    font-size: 10px;
    font-family: var(--mono);
    color: rgba(255,255,255,.18);
    width: 18px;
    text-align: right;
    flex-shrink: 0;
}
.arp-srow.on .arp-snum { color: rgba(255,255,255,.55); }
.arp-scover {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 2px;
    overflow: hidden;
    background: rgba(255,255,255,.05);
}
.arp-scover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.arp-smeta { flex: 1; min-width: 0; }
.arp-sname {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.arp-srow.on .arp-sname { color: #fff; }
.arp-ssub {
    font-size: 10px;
    color: rgba(255,255,255,.28);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.arp-sdur {
    font-size: 10px;
    font-family: var(--mono);
    color: rgba(255,255,255,.22);
    flex-shrink: 0;
}

/* Animated bars for active row */
.arp-bars { display: none; gap: 2px; align-items: flex-end; width: 14px; height: 14px; flex-shrink: 0; }
.arp-srow.on .arp-bars { display: flex; }
.arp-bar { width: 3px; background: #fff; border-radius: 1px; animation: arp-bar .7s ease-in-out infinite; }
.arp-bar:nth-child(2) { animation-delay: .15s; }
.arp-bar:nth-child(3) { animation-delay: .3s; }
@keyframes arp-bar { 0%,100%{height:3px} 50%{height:12px} }

/* Empty state */
.arp-empty {
    text-align: center;
    padding: 36px 16px;
}
.arp-empty svg {
    width: 26px;
    height: 26px;
    fill: rgba(255,255,255,.1);
    margin: 0 auto 10px;
    display: block;
}
.arp-empty p {
    font-size: 10px;
    color: rgba(255,255,255,.18);
    letter-spacing: .1em;
    text-transform: uppercase;
    font-family: var(--mono);
}
        `;
        this.appendChild(s);
    }

    // ── DOM ───────────────────────────────────────────────────
    _buildDOM() {
        const shell = document.createElement('div');
        shell.className = 'arp-shell';
        shell.innerHTML = `
<!-- ── Visualiser canvas ── -->
<div class="arp-vis" id="arp-vis">
    <canvas id="arp-canvas"></canvas>

    <span id="arp-brand">REACTOR</span>
    <div  id="arp-dot"></div>

    <button id="arp-lbtn" title="Open Library">
        <svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5 11.12 10 12.5 10c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
    </button>

    <!-- Song info overlay, bottom-left -->
    <div class="arp-songinfo">
        <div class="arp-songtitle"  id="arp-title">Select a Track</div>
        <div class="arp-songartist" id="arp-artist"></div>
        <div class="arp-links"      id="arp-links"></div>
    </div>
</div>

<!-- ── Transparent controls bar ── -->
<div class="arp-controls">
    <!-- Scrubber -->
    <div class="arp-scrub-row">
        <span class="arp-time cur" id="arp-cur">0:00</span>
        <div class="arp-scrub" id="arp-scrub">
            <div class="arp-scrub-fill"  id="arp-sfill"></div>
            <div class="arp-scrub-thumb" id="arp-sthumb"></div>
        </div>
        <span class="arp-time" id="arp-tot">0:00</span>
    </div>
    <!-- Transport -->
    <div class="arp-transport">
        <div class="arp-tl">
            <button class="arp-btn" id="arp-shuf" title="Shuffle">
                <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>
            <button class="arp-btn" id="arp-rep" title="Repeat">
                <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            </button>
        </div>
        <div class="arp-tc">
            <button class="arp-skipbtn" id="arp-prev" title="Previous">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="arp-playbtn" id="arp-play" title="Play / Pause">
                <svg id="arp-ico-play"  viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="arp-ico-pause" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="arp-skipbtn" id="arp-next" title="Next">
                <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
        </div>
        <div class="arp-tr">
            <div class="arp-vol">
                <button class="arp-btn" id="arp-mute" title="Mute">
                    <svg id="arp-ico-vol" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    <svg id="arp-ico-mut" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                </button>
                <input type="range" class="arp-vol-sl" id="arp-vol" min="0" max="1" step="0.01" value="0.8" title="Volume">
            </div>
        </div>
    </div>
</div>

<!-- ── Library overlay ── -->
<div class="arp-lib" id="arp-lib">
    <div class="arp-lib-head">
        <span class="arp-lib-label">Library</span>
        <button class="arp-lib-close" id="arp-lclose" title="Close">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
    </div>
    <div class="arp-search-wrap">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input type="text" class="arp-search" id="arp-search" placeholder="Search tracks...">
    </div>
    <div class="arp-lib-body" id="arp-lbody"></div>
</div>
        `;
        this.appendChild(shell);
    }

    // ── THREE.JS SETUP ────────────────────────────────────────
    _initThree() {
        const THREE = window.THREE;
        if (!THREE) { console.warn('[ARP] THREE not available'); return; }

        const vis    = this.querySelector('#arp-vis');
        const canvas = this.querySelector('#arp-canvas');
        if (!vis || !canvas) return;

        const W = vis.clientWidth  || 480;
        const H = vis.clientHeight || 300;

        // ── Renderer ───────────────────────────────────────────
        this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this._renderer.setSize(W, H);
        this._renderer.outputColorSpace = THREE.SRGBColorSpace || THREE.LinearEncoding;

        // ── Scene + Camera (tutorial positions) ────────────────
        this._scene  = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
        this._camera.position.set(0, 0, 14);   // tutorial uses z=14 after removing OrbitControls

        // ── Clock ──────────────────────────────────────────────
        this._clock = new THREE.Clock();

        // ── pnoise GLSL — Ashima webgl-noise periodic variant ──
        // Copied exactly from tutorial (vec3 mod289 → pnoise function)
        const pnoiseGLSL = /* glsl */`
            vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            vec4 mod289(vec4 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            vec4 permute(vec4 x) {
                return mod289(((x * 34.0) + 10.0) * x);
            }
            vec4 taylorInvSqrt(vec4 r) {
                return 1.79284291400159 - 0.85373472095314 * r;
            }
            vec3 fade(vec3 t) {
                return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
            }
            float pnoise(vec3 P, vec3 rep) {
                vec3 Pi0 = mod(floor(P), rep);
                vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
                Pi0 = mod289(Pi0);
                Pi1 = mod289(Pi1);
                vec3 Pf0 = fract(P);
                vec3 Pf1 = Pf0 - vec3(1.0);
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                vec4 iy = vec4(Pi0.yy,  Pi1.yy);
                vec4 iz0 = Pi0.zzzz;
                vec4 iz1 = Pi1.zzzz;
                vec4 ixy  = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0);
                vec4 ixy1 = permute(ixy + iz1);
                vec4 gx0 = ixy0 * (1.0 / 7.0);
                vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                gx0 = fract(gx0);
                vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                vec4 gx1 = ixy1 * (1.0 / 7.0);
                vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                gx1 = fract(gx1);
                vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
                vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
                vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
                vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
                vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
                vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
                vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
                vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
                vec4 norm0 = taylorInvSqrt(vec4(
                    dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
                g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
                vec4 norm1 = taylorInvSqrt(vec4(
                    dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
                g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
                float n000 = dot(g000, Pf0);
                float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                float n111 = dot(g111, Pf1);
                vec3 fade_xyz = fade(Pf0);
                vec4 n_z = mix(
                    vec4(n000, n100, n010, n110),
                    vec4(n001, n101, n011, n111),
                    fade_xyz.z);
                vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
                return 2.2 * n_xyz;
            }
        `;

        // ── Vertex shader — tutorial formula exactly ───────────
        const vertexShader = /* glsl */`
            ${pnoiseGLSL}

            uniform float u_time;
            uniform float u_frequency;

            void main() {
                float noise        = 3.0 * pnoise(position + u_time, vec3(10.0));
                float displacement = (u_frequency / 30.0) * (noise / 10.0);
                vec3  newPosition  = position + normal * displacement;
                gl_Position        = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;

        // ── Fragment shader — tutorial RGB uniforms ────────────
        const fragmentShader = /* glsl */`
            uniform float u_red;
            uniform float u_green;
            uniform float u_blue;

            void main() {
                gl_FragColor = vec4(u_red, u_green, u_blue, 1.0);
            }
        `;

        // ── Uniforms (6 total, exactly tutorial) ───────────────
        this._uniforms = {
            u_time:      { value: 0.0 },
            u_frequency: { value: 0.0 },
            u_red:       { value: this._params.red   },
            u_green:     { value: this._params.green },
            u_blue:      { value: this._params.blue  },
        };

        // ── Mesh: IcosahedronGeometry(4, 30) wireframe ─────────
        const geo  = new THREE.IcosahedronGeometry(4, 30);
        const mat  = new THREE.ShaderMaterial({
            wireframe: true,
            uniforms:  this._uniforms,
            vertexShader,
            fragmentShader,
        });
        this._mesh = new THREE.Mesh(geo, mat);
        this._scene.add(this._mesh);

        // ── UnrealBloom post-processing ────────────────────────
        // Use the globally-injected classes loaded from jsDelivr CDN
        try {
            const { EffectComposer, RenderPass, UnrealBloomPass, OutputPass } = this._getPostProcessing(THREE);

            const renderScene = new RenderPass(this._scene, this._camera);

            const bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H));
            bloomPass.threshold = this._params.threshold; // 0.5
            bloomPass.strength  = this._params.strength;  // 0.4
            bloomPass.radius    = this._params.radius;    // 0.8
            this._bloomPass = bloomPass;

            this._composer = new EffectComposer(this._renderer);
            this._composer.addPass(renderScene);
            this._composer.addPass(bloomPass);
            // OutputPass exists in r128 jsDelivr build — if not available, skip gracefully
            if (OutputPass) {
                this._composer.addPass(new OutputPass());
            }
        } catch(e) {
            console.warn('[ARP] UnrealBloom unavailable, falling back to direct render', e);
            this._composer = null;
        }

        // ── Resize observer ────────────────────────────────────
        const ro = new ResizeObserver(() => this._onResize());
        ro.observe(vis);
        this._ro = ro;

        // ── Mouse parallax — tutorial's exact code ─────────────
        document.addEventListener('mousemove', this._onMouseMove = e => {
            const rect = vis.getBoundingClientRect();
            const halfX = rect.width  / 2;
            const halfY = rect.height / 2;
            this._mouseX = (e.clientX - rect.left  - halfX) / 100;
            this._mouseY = (e.clientY - rect.top   - halfY) / 100;
        });
    }

    // Retrieve post-processing classes — they attach to THREE namespace in r128
    _getPostProcessing(THREE) {
        // jsDelivr CDN for r128 examples attaches to window.THREE namespace
        const EC  = THREE.EffectComposer  || window.EffectComposer;
        const RP  = THREE.RenderPass      || window.RenderPass;
        const UBP = THREE.UnrealBloomPass || window.UnrealBloomPass;
        const OP  = THREE.OutputPass      || window.OutputPass  || null;
        if (!EC || !RP || !UBP) throw new Error('Post-processing classes not found');
        return { EffectComposer: EC, RenderPass: RP, UnrealBloomPass: UBP, OutputPass: OP };
    }

    _onResize() {
        if (!this._renderer) return;
        const vis = this.querySelector('#arp-vis');
        if (!vis) return;
        const W = vis.clientWidth, H = vis.clientHeight;
        if (!W || !H) return;
        this._camera.aspect = W / H;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(W, H);
        if (this._composer) this._composer.setSize(W, H);
    }

    // ── Render loop ───────────────────────────────────────────
    _startLoop() {
        const loop = () => {
            this._animId = requestAnimationFrame(loop);
            if (!this._renderer || !this._uniforms) return;

            const t = this._clock.getElapsedTime();

            // Tutorial's exact animate() body:
            // camera.position.x += (mouseX - camera.position.x) * 0.05;
            // camera.position.y += (-mouseY - camera.position.y) * 0.5;   ← tutorial uses 0.5, not 0.05
            // camera.lookAt(scene.position);
            this._camera.position.x += (this._mouseX  - this._camera.position.x) * 0.05;
            this._camera.position.y += (-this._mouseY - this._camera.position.y) * 0.05;
            this._camera.lookAt(this._scene.position);

            this._uniforms.u_time.value      = t;
            this._uniforms.u_frequency.value = this._avgFreq;

            // Render through composer (bloom) or directly
            if (this._composer) {
                this._composer.render();
            } else {
                this._renderer.render(this._scene, this._camera);
            }
        };
        loop();
    }

    // ── Audio ─────────────────────────────────────────────────
    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';

        try {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this._gainNode = this._audioCtx.createGain();

            // Tutorial uses THREE.AudioAnalyser with fftSize=32.
            // We replicate it directly via native AnalyserNode.
            this._nativeAnalyser = this._audioCtx.createAnalyser();
            this._nativeAnalyser.fftSize = 32;
            this._freqData = new Uint8Array(this._nativeAnalyser.frequencyBinCount);

            const src = this._audioCtx.createMediaElementSource(this._audio);
            src.connect(this._gainNode);
            this._gainNode.connect(this._nativeAnalyser);
            this._nativeAnalyser.connect(this._audioCtx.destination);
            this._gainNode.gain.value = this._volume;

            // Replicates THREE.AudioAnalyser.getAverageFrequency()
            const tick = () => {
                requestAnimationFrame(tick);
                if (!this._nativeAnalyser) return;
                this._nativeAnalyser.getByteFrequencyData(this._freqData);
                let sum = 0;
                for (let i = 0; i < this._freqData.length; i++) sum += this._freqData[i];
                this._avgFreq = sum / this._freqData.length;
            };
            tick();
        } catch(e) {
            console.warn('[ARP] Web Audio API unavailable', e);
        }

        this._audio.addEventListener('timeupdate',     () => this._onTimeUpdate());
        this._audio.addEventListener('loadedmetadata', () => this._onMeta());
        this._audio.addEventListener('ended',          () => this._onEnded());
        this._audio.addEventListener('play',           () => this._onPlay());
        this._audio.addEventListener('pause',          () => this._onPause());
    }

    _onPlay() {
        this._isPlaying = true;
        this._q('arp-ico-play') .style.display = 'none';
        this._q('arp-ico-pause').style.display = 'block';
        this._q('arp-dot').classList.add('on');
        if (this._audioCtx?.state === 'suspended') this._audioCtx.resume();
    }
    _onPause() {
        this._isPlaying = false;
        this._q('arp-ico-play') .style.display = 'block';
        this._q('arp-ico-pause').style.display = 'none';
        this._q('arp-dot').classList.remove('on');
    }
    _onTimeUpdate() {
        if (!this._audio || this._seeking) return;
        const cur = this._audio.currentTime, dur = this._audio.duration;
        if (isNaN(dur)) return;
        const p = cur / dur;
        this._q('arp-sfill') .style.width = (p * 100) + '%';
        this._q('arp-sthumb').style.left  = (p * 100) + '%';
        this._q('arp-cur').textContent    = this._fmt(cur);
    }
    _onMeta() {
        const d = this._audio?.duration;
        if (d && !isNaN(d)) this._q('arp-tot').textContent = this._fmt(d);
    }
    _onEnded() {
        if (this._repeatMode === 'one') {
            this._audio.currentTime = 0;
            this._audio.play().catch(() => {});
        } else {
            this._autoNext();
        }
    }

    // ── Playback ──────────────────────────────────────────────
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
        this._renderNowPlaying(song);
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
    _autoNext() {
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

    // ── UI ────────────────────────────────────────────────────
    _renderNowPlaying(song) {
        const t = this._q('arp-title'),  a = this._q('arp-artist'), l = this._q('arp-links');
        if (t) t.textContent = song.title  || 'Unknown';
        if (a) a.textContent = song.artist ? song.artist.toUpperCase() : '';
        if (l) {
            const sl = song.streamingLinks || {}, lns = [];
            if (sl.spotify)        lns.push(['Spotify',     sl.spotify]);
            if (sl.apple)          lns.push(['Apple Music', sl.apple]);
            if (sl.youtube)        lns.push(['YouTube',     sl.youtube]);
            if (sl.soundcloud)     lns.push(['SoundCloud',  sl.soundcloud]);
            if (song.purchaseLink) lns.push(['Buy Now',     song.purchaseLink]);
            l.innerHTML = lns.map(([n, u]) =>
                `<a href="${u}" target="_blank" class="arp-link" title="Listen on ${n}">${n}</a>`
            ).join('');
        }
        const cur = this._q('arp-cur'), tot = this._q('arp-tot');
        const fill= this._q('arp-sfill'), thumb = this._q('arp-sthumb');
        if (cur)   cur.textContent  = '0:00';
        if (tot)   tot.textContent  = '0:00';
        if (fill)  fill.style.width = '0%';
        if (thumb) thumb.style.left = '0%';
    }

    _libToggle(open) {
        const lib = this.querySelector('#arp-lib'), btn = this.querySelector('#arp-lbtn');
        if (lib) lib.classList.toggle('open', open);
        if (btn) btn.classList.toggle('on',   open);
        if (open) this._renderLib();
    }

    _renderLib() {
        const body  = this.querySelector('#arp-lbody');
        const srch  = this.querySelector('#arp-search');
        if (!body) return;
        const q    = srch?.value?.toLowerCase() || '';
        const list = this._allSongs.filter(s =>
            !q || (s.title ||'').toLowerCase().includes(q) ||
                  (s.artist||'').toLowerCase().includes(q) ||
                  (s.album ||'').toLowerCase().includes(q)
        );
        if (!list.length) {
            body.innerHTML = `<div class="arp-empty">
                <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
                <p>No tracks found</p></div>`;
            return;
        }
        body.innerHTML = list.map((song, i) => {
            const active = this._playlist?.indexOf(song) === this._songIdx && this._songIdx !== -1;
            return `<div class="arp-srow${active ? ' on' : ''}" data-i="${i}">
                <span class="arp-snum">${active ? '' : i + 1}</span>
                <div class="arp-bars"><div class="arp-bar"></div><div class="arp-bar"></div><div class="arp-bar"></div></div>
                <div class="arp-scover">${song.coverImage ? `<img src="${song.coverImage}" alt="" loading="lazy">` : ''}</div>
                <div class="arp-smeta">
                    <div class="arp-sname">${this._esc(song.title  || 'Unknown')}</div>
                    <div class="arp-ssub">${this._esc(song.artist || '—')}${song.album ? ' · ' + this._esc(song.album) : ''}</div>
                </div>
                <span class="arp-sdur">${song.duration || ''}</span>
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

    // ── Event binding ─────────────────────────────────────────
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
            const modes = ['none', 'all', 'one'];
            this._repeatMode = modes[(modes.indexOf(this._repeatMode) + 1) % modes.length];
            this._q('arp-rep').classList.toggle('on', this._repeatMode !== 'none');
            this._q('arp-rep').title = `Repeat: ${this._repeatMode}`;
        });

        const volEl = this._q('arp-vol');
        volEl.addEventListener('input', e => {
            this._volume = parseFloat(e.target.value);
            if (this._gainNode) this._gainNode.gain.value = this._volume;
            this._syncVolIcon();
        });
        this._q('arp-mute').addEventListener('click', () => {
            if (this._volume > 0) { this._lastVolume = this._volume; this._volume = 0; }
            else                    this._volume = this._lastVolume || 0.8;
            volEl.value = this._volume;
            if (this._gainNode) this._gainNode.gain.value = this._volume;
            this._syncVolIcon();
        });

        // Scrubber
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
            const mv = e => { if (this._q('arp-sfill')) this._q('arp-sfill').style.width = (pct(e) * 100) + '%'; };
            const up = e => {
                if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
                this._seeking = false;
                document.removeEventListener('mousemove', mv);
                document.removeEventListener('mouseup',   up);
            };
            document.addEventListener('mousemove', mv);
            document.addEventListener('mouseup',   up);
        });

        // Library search
        const srch = this.querySelector('#arp-search');
        if (srch) srch.addEventListener('input', () => this._renderLib());

        // PlayerAPI command bus
        this.addEventListener('player-command', e => {
            const { command, data } = e.detail || {};
            if      (command === 'play')      this._audio?.play().catch(() => {});
            else if (command === 'pause')     this._audio?.pause();
            else if (command === 'next')      this._next();
            else if (command === 'previous')  this._prev();
            else if (command === 'setVolume') {
                this._volume = data?.volume ?? this._volume;
                if (this._gainNode) this._gainNode.gain.value = this._volume;
                const vEl = this._q('arp-vol');
                if (vEl) vEl.value = this._volume;
            } else if (command === 'seekTo') {
                if (this._audio?.duration && data?.position != null)
                    this._audio.currentTime = data.position * this._audio.duration;
            } else if (command === 'shuffle') {
                this._shuffle = data?.enable ?? !this._shuffle;
            } else if (command === 'repeat') {
                this._repeatMode = data?.enable ? 'all' : 'none';
            }
        });
    }

    // ── Panel colour prop handler ─────────────────────────────
    // primary-color  → sphere wireframe rgb
    // accent-color   → optional: future use
    // bloom params could be driven by sliders via custom attrs
    _applyColorProp(attr, val) {
        // Already handled in attributeChangedCallback for primary-color
        // Other attrs: no-op (controls don't have strong colour theming —
        // they are intentionally transparent / greyscale)
    }

    // ── Helpers ───────────────────────────────────────────────
    _q(id)   { return this.querySelector('#' + id); }
    _fmt(s)  {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }
    _esc(t)  { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
    _hex01(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? { r: parseInt(m[1],16)/255, g: parseInt(m[2],16)/255, b: parseInt(m[3],16)/255 } : null;
    }
    _syncVolIcon() {
        const vi = this._q('arp-ico-vol'), mi = this._q('arp-ico-mut');
        if (vi) vi.style.display = this._volume === 0 ? 'none'  : 'block';
        if (mi) mi.style.display = this._volume === 0 ? 'block' : 'none';
    }
}

customElements.define('audio-reactive-player', AudioReactivePlayer);
