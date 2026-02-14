// ============================================================
//  bottom-bar-player  —  Wix Blocks Custom Element  v2
//
//  Spotify-style sticky bottom bar.
//  Appends a fixed bar to document.body — the custom element
//  itself sits at zero height wherever it is placed on the page.
//
//  LAYOUT (3-zone CSS grid, full viewport width):
//  ╔══════════════════════════════════════════════════════════╗
//  ║░░░░░░░░░░░░░ progress strip (very top edge) ░░░░░░░░░░░║
//  ║ [art + title/artist]   [⇄ ⏮ ▶ ⏭ ⟳]   [vol ∷ queue]  ║
//  ╚══════════════════════════════════════════════════════════╝
//
//  Attributes:
//    player-data        JSON {songs:[...]}
//    bar-height         number px  (default 72, range 60–120)
//    primary-color      accent / kick-pulse color
//    background-color   bar background
//    surface-color      drawer / popup background
//    text-primary       main text
//    text-secondary     secondary text
// ============================================================

class BottomBarPlayer extends HTMLElement {

    constructor() {
        super();

        // ── Playback state ─────────────────────────────────────
        this._allSongs    = [];
        this._playlist    = [];
        this._songIdx     = -1;
        this._isPlaying   = false;
        this._volume      = 0.8;
        this._lastVolume  = 0.8;
        this._shuffle     = false;
        this._repeatMode  = 'none';   // 'none' | 'all' | 'one'
        this._seeking     = false;
        this._domReady    = false;
        this._pendingLoad = null;
        this._drawerOpen  = false;
        this._linksOpen   = false;

        // ── Audio graph ────────────────────────────────────────
        this._audio    = null;
        this._audioCtx = null;
        this._gainNode = null;
        this._analyser = null;
        this._kickData = null;

        // ── Layout ─────────────────────────────────────────────
        this._barHeight = 72;   // px, driven by bar-height attribute
    }

    // ── Observed attributes ───────────────────────────────────
    static get observedAttributes() {
        return [
            'player-data',
            'bar-height',
            'primary-color',
            'secondary-color',
            'background-color',
            'surface-color',
            'text-primary',
            'text-secondary',
            'accent-color',
        ];
    }

    attributeChangedCallback(name, _, val) {
        if (val === null || val === undefined) return;

        if (name === 'player-data') {
            try {
                const d = JSON.parse(val);
                this._allSongs = d.songs || [];
                if (this._allSongs.length && this._songIdx === -1) {
                    if (this._domReady) this._loadSong(0, this._allSongs, false);
                    else this._pendingLoad = { idx: 0, list: this._allSongs, autoPlay: false };
                }
            } catch (e) { console.error('[BBP] player-data parse error', e); }

        } else if (name === 'bar-height') {
            const h = Math.max(60, Math.min(120, parseInt(val) || 72));
            this._barHeight = h;
            this._applyBarHeight(h);

        } else {
            this._applyThemeProp(name, val);
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────
    connectedCallback() {
        this._injectCSS();
        this._buildDOM();
        this._bindEvents();
        this._initAudio();
        this._domReady = true;

        // Apply bar-height if already set
        this._applyBarHeight(this._barHeight);

        if (this._pendingLoad) {
            const { idx, list, autoPlay } = this._pendingLoad;
            this._pendingLoad = null;
            this._loadSong(idx, list, autoPlay);
        } else if (this._allSongs.length && this._songIdx === -1) {
            this._loadSong(0, this._allSongs, false);
        }
    }

    disconnectedCallback() {
        this._audio?.pause();
        this._audioCtx?.close().catch(() => {});
        document.getElementById('bbp-bar')?.remove();
        document.getElementById('bbp-drawer')?.remove();
        document.getElementById('bbp-links-pop')?.remove();
        document.querySelector('style[data-bbp]')?.remove();
        document.removeEventListener('click', this._docClickFn);
        document.body.style.paddingBottom = '';
    }

    // ─────────────────────────────────────────────────────────
    //  BAR HEIGHT — updates CSS var + body padding
    // ─────────────────────────────────────────────────────────
    _applyBarHeight(h) {
        document.documentElement.style.setProperty('--bbp-h', h + 'px');
        document.body.style.paddingBottom = h + 'px';
        // Shift drawer anchor
        const drawer = document.getElementById('bbp-drawer');
        if (drawer) drawer.style.bottom = h + 'px';
        // Shift links popup
        const lp = document.getElementById('bbp-links-pop');
        if (lp) lp.style.bottom = (h + 10) + 'px';
        // Scale art size proportionally: base 48px at 72px height
        const artSize = Math.round(h * 0.62);
        document.documentElement.style.setProperty('--bbp-art', artSize + 'px');
    }

    // ─────────────────────────────────────────────────────────
    //  CSS
    // ─────────────────────────────────────────────────────────
    _injectCSS() {
        if (document.querySelector('style[data-bbp]')) return;
        const s = document.createElement('style');
        s.setAttribute('data-bbp', '1');
        s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

/* ── CSS variables ── */
:root {
    --bbp-h:    72px;
    --bbp-art:  44px;
    --bbp-acc:  #1db954;
    --bbp-bg:   #181818;
    --bbp-surf: #282828;
    --bbp-t1:   #ffffff;
    --bbp-t2:   #b3b3b3;
    --bbp-t3:   #535353;
    --bbp-bdr:  rgba(255,255,255,.08);
    --bbp-kick: 29,185,84;
}

/* ── THE BAR ── */
#bbp-bar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: var(--bbp-h);
    background: var(--bbp-bg);
    border-top: 1px solid var(--bbp-bdr);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    z-index: 9999;
    box-shadow: 0 -4px 24px rgba(0,0,0,.45);
    font-family: 'Rajdhani', sans-serif;
    user-select: none;
    transition: height .25s ease;
}

/* ── Progress strip — very top edge ── */
#bbp-prog {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(255,255,255,.1);
    cursor: pointer;
    z-index: 2;
    transition: height .15s;
}
#bbp-prog:hover { height: 5px; }

#bbp-pfill {
    height: 100%;
    background: var(--bbp-t3);
    width: 0%;
    transition: width .1s linear;
    position: relative;
    pointer-events: none;
    border-radius: 0 2px 2px 0;
}
#bbp-pfill::after {
    content: '';
    position: absolute;
    right: -5px; top: 50%;
    transform: translateY(-50%);
    width: 11px; height: 11px;
    background: var(--bbp-t1);
    border-radius: 50%;
    opacity: 0;
    transition: opacity .15s;
    pointer-events: none;
}
#bbp-prog:hover #bbp-pfill        { background: var(--bbp-acc); }
#bbp-prog:hover #bbp-pfill::after { opacity: 1; }

/* ── LEFT ZONE ── */
.bbp-left {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    min-width: 0;
    overflow: hidden;
}

/* Album art */
.bbp-art-wrap {
    position: relative;
    flex-shrink: 0;
    width: var(--bbp-art);
    height: var(--bbp-art);
    border-radius: 4px;
    overflow: hidden;
    background: var(--bbp-surf);
    cursor: pointer;
    transition: width .25s ease, height .25s ease;
}
.bbp-art-wrap img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform .3s;
}
.bbp-art-wrap:hover img { transform: scale(1.06); }
.bbp-art-ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: var(--bbp-t3);
}
.bbp-art-ph svg { width: 20px; height: 20px; fill: currentColor; }

/* Kick pulse ring on art */
@keyframes bbp-kick-ring {
    0%   { box-shadow: 0 0 0 0px rgba(var(--bbp-kick),.8); }
    100% { box-shadow: 0 0 0 12px rgba(var(--bbp-kick),0); }
}
.bbp-art-wrap.kick { animation: bbp-kick-ring .4s ease-out forwards; }

/* Song meta */
.bbp-meta { flex: 1; min-width: 0; }
.bbp-meta-title {
    font-size: 13px; font-weight: 600; color: var(--bbp-t1);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    cursor: pointer; display: block; line-height: 1.5;
    transition: color .15s;
}
.bbp-meta-title:hover  { color: var(--bbp-acc); text-decoration: underline; }
.bbp-meta-artist {
    font-size: 11px; color: var(--bbp-t2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block; line-height: 1.4; cursor: default;
}

/* ── CENTER ZONE ── */
.bbp-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 32px;
}
.bbp-transport {
    display: flex;
    align-items: center;
    gap: 20px;
}

/* Ghost buttons: shuffle, repeat */
.bbp-ghost {
    background: transparent; border: none; cursor: pointer;
    padding: 3px; color: var(--bbp-t3);
    display: flex; align-items: center;
    transition: color .15s, transform .1s;
    position: relative;
}
.bbp-ghost:hover { color: var(--bbp-t1); transform: scale(1.1); }
.bbp-ghost.on    { color: var(--bbp-acc); }
.bbp-ghost.on::after {
    content: '';
    position: absolute;
    bottom: -3px; left: 50%;
    transform: translateX(-50%);
    width: 4px; height: 4px;
    background: var(--bbp-acc); border-radius: 50%;
}
.bbp-ghost svg { pointer-events: none; fill: currentColor; }

/* Skip buttons */
.bbp-skip {
    background: transparent; border: none; cursor: pointer;
    padding: 3px; color: var(--bbp-t2);
    display: flex; align-items: center;
    transition: color .15s, transform .1s;
}
.bbp-skip:hover { color: var(--bbp-t1); transform: scale(1.1); }
.bbp-skip svg   { pointer-events: none; fill: currentColor; }

/* Play / pause — white circle */
.bbp-play {
    width: 36px; height: 36px;
    background: var(--bbp-t1);
    border: none; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #000; padding: 0; flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(0,0,0,.4);
    transition: transform .1s, background .15s;
}
.bbp-play:hover  { transform: scale(1.07); background: #fff; }
.bbp-play:active { transform: scale(.93); }
.bbp-play svg   { pointer-events: none; fill: currentColor; }

/* Time display */
.bbp-times {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-family: 'Share Tech Mono', monospace;
    color: var(--bbp-t3); line-height: 1;
}
.bbp-times .cur { color: var(--bbp-t2); }

/* ── RIGHT ZONE ── */
.bbp-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 16px;
    overflow: hidden;
}

/* Volume */
.bbp-vol-wrap { display: flex; align-items: center; gap: 6px; }
.bbp-vol-btn {
    background: transparent; border: none; cursor: pointer;
    padding: 2px; color: var(--bbp-t2);
    display: flex; align-items: center;
    transition: color .15s;
}
.bbp-vol-btn:hover { color: var(--bbp-t1); }
.bbp-vol-btn svg   { width: 16px; height: 16px; fill: currentColor; }
.bbp-vol-sl {
    -webkit-appearance: none; appearance: none;
    width: 90px; height: 4px;
    background: var(--bbp-t3); border-radius: 2px;
    outline: none; cursor: pointer; transition: background .15s;
}
.bbp-vol-wrap:hover .bbp-vol-sl { background: var(--bbp-t2); }
.bbp-vol-sl::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    background: var(--bbp-t1); border-radius: 50%;
    cursor: pointer; opacity: 0; transition: opacity .15s;
}
.bbp-vol-wrap:hover .bbp-vol-sl::-webkit-slider-thumb { opacity: 1; }
.bbp-vol-sl::-moz-range-thumb {
    width: 12px; height: 12px;
    background: var(--bbp-t1); border: none; border-radius: 50%;
}

/* Queue button */
.bbp-qbtn {
    background: transparent; border: none; cursor: pointer;
    padding: 5px; color: var(--bbp-t3);
    display: flex; align-items: center;
    border-radius: 3px;
    transition: color .15s, background .15s;
}
.bbp-qbtn:hover { color: var(--bbp-t1); background: rgba(255,255,255,.06); }
.bbp-qbtn.on    { color: var(--bbp-acc); }
.bbp-qbtn svg   { width: 16px; height: 16px; fill: currentColor; }

/* ── Tooltips ── */
[data-tip] { position: relative; }
[data-tip]:hover::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 8px); left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a; color: #fff;
    font-size: 11px; font-family: 'Share Tech Mono', monospace;
    white-space: nowrap; padding: 4px 8px;
    border-radius: 4px; border: 1px solid rgba(255,255,255,.1);
    pointer-events: none; z-index: 99999;
}

/* ── QUEUE DRAWER ── */
#bbp-drawer {
    position: fixed;
    bottom: var(--bbp-h);
    right: 0;
    width: 340px;
    max-height: min(500px, calc(100vh - var(--bbp-h) - 16px));
    background: var(--bbp-surf);
    border: 1px solid var(--bbp-bdr);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    box-shadow: -4px 0 40px rgba(0,0,0,.5);
    display: flex; flex-direction: column; overflow: hidden;
    z-index: 10000;
    transform: translateY(16px); opacity: 0; pointer-events: none;
    transition: transform .22s cubic-bezier(.4,0,.2,1), opacity .2s;
}
#bbp-drawer.open {
    transform: translateY(0); opacity: 1; pointer-events: all;
}

.bbp-dhead {
    display: flex; align-items: center; padding: 14px 16px 10px;
    border-bottom: 1px solid var(--bbp-bdr); flex-shrink: 0;
}
.bbp-dhead-title {
    flex: 1; font-size: 14px; font-weight: 700; color: var(--bbp-t1);
    letter-spacing: .02em;
}
.bbp-dclose {
    background: transparent; border: none; cursor: pointer;
    padding: 4px; color: var(--bbp-t3); border-radius: 50%;
    display: flex; align-items: center;
    transition: color .15s, background .15s;
}
.bbp-dclose:hover { color: var(--bbp-t1); background: rgba(255,255,255,.08); }
.bbp-dclose svg { width: 14px; height: 14px; fill: currentColor; }

.bbp-dsrch-wrap {
    padding: 8px 12px; border-bottom: 1px solid var(--bbp-bdr);
    flex-shrink: 0; position: relative;
}
.bbp-dsrch-wrap svg {
    position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
    width: 13px; height: 13px; fill: var(--bbp-t3); pointer-events: none;
}
.bbp-dsrch {
    width: 100%; padding: 7px 10px 7px 30px;
    background: rgba(255,255,255,.06); border: 1px solid transparent;
    border-radius: 4px; color: var(--bbp-t1);
    font-size: 13px; font-family: 'Rajdhani', sans-serif;
    outline: none; transition: border-color .15s;
}
.bbp-dsrch:focus { border-color: var(--bbp-t3); }
.bbp-dsrch::placeholder { color: var(--bbp-t3); }

.bbp-dbody { flex: 1; overflow-y: auto; padding: 6px 0; }
.bbp-dbody::-webkit-scrollbar { width: 4px; }
.bbp-dbody::-webkit-scrollbar-thumb { background: var(--bbp-t3); border-radius: 2px; }

/* Song rows */
.bbp-srow {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 12px; border-radius: 4px; cursor: pointer;
    margin: 0 4px; transition: background .1s;
}
.bbp-srow:hover { background: rgba(255,255,255,.08); }
.bbp-srow.on    { background: rgba(255,255,255,.12); }

.bbp-snum {
    font-size: 12px; font-family: 'Share Tech Mono', monospace;
    color: var(--bbp-t3); width: 18px; text-align: right; flex-shrink: 0;
}
.bbp-srow.on .bbp-snum { color: var(--bbp-acc); }

.bbp-sart {
    width: 36px; height: 36px; flex-shrink: 0;
    border-radius: 3px; overflow: hidden; background: var(--bbp-bg);
}
.bbp-sart img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bbp-sart-ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: var(--bbp-t3);
}
.bbp-sart-ph svg { width: 16px; height: 16px; fill: currentColor; }

.bbp-smeta { flex: 1; min-width: 0; }
.bbp-sname {
    font-size: 13px; font-weight: 600; color: var(--bbp-t1);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bbp-srow.on .bbp-sname { color: var(--bbp-acc); }
.bbp-ssub {
    font-size: 11px; color: var(--bbp-t3);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bbp-sdur {
    font-size: 11px; font-family: 'Share Tech Mono', monospace;
    color: var(--bbp-t3); flex-shrink: 0;
}

.bbp-bars { display: none; gap: 2px; align-items: flex-end; width: 14px; height: 14px; flex-shrink: 0; }
.bbp-srow.on .bbp-bars { display: flex; }
.bbp-bar {
    width: 3px; background: var(--bbp-acc);
    border-radius: 1px; animation: bbp-bar .7s ease-in-out infinite;
}
.bbp-bar:nth-child(2) { animation-delay: .15s; }
.bbp-bar:nth-child(3) { animation-delay: .30s; }
@keyframes bbp-bar { 0%,100%{height:3px} 50%{height:12px} }

.bbp-empty {
    padding: 28px 16px; text-align: center;
    font-size: 12px; color: var(--bbp-t3);
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: .06em; text-transform: uppercase;
}

/* ── STREAMING LINKS POPUP ── */
#bbp-links-pop {
    position: fixed;
    bottom: 82px;
    left: 16px;
    background: #2a2a2a;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 6px;
    padding: 5px; min-width: 170px;
    z-index: 10001;
    box-shadow: 0 8px 32px rgba(0,0,0,.6);
    transform: translateY(8px); opacity: 0; pointer-events: none;
    transition: transform .18s cubic-bezier(.4,0,.2,1), opacity .18s;
}
#bbp-links-pop.open {
    transform: translateY(0); opacity: 1; pointer-events: all;
}
#bbp-links-pop a {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 4px;
    color: #fff; font-size: 13px; font-weight: 500;
    font-family: 'Rajdhani', sans-serif;
    text-decoration: none; transition: background .1s; white-space: nowrap;
}
#bbp-links-pop a:hover { background: rgba(255,255,255,.1); }
#bbp-links-pop a svg   { width: 14px; height: 14px; fill: currentColor; flex-shrink: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .bbp-center { padding: 0 16px; }
    .bbp-ghost  { display: none; }
    .bbp-times  { display: none; }
    .bbp-vol-sl { width: 64px; }
    #bbp-drawer { width: 100%; border-radius: 12px 12px 0 0; }
}
@media (max-width: 480px) {
    .bbp-right { display: none; }
    .bbp-left  { max-width: 55%; }
}
        `;
        document.head.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────
    //  DOM
    // ─────────────────────────────────────────────────────────
    _buildDOM() {
        // ── Bar ───────────────────────────────────────────────
        const bar = document.createElement('div');
        bar.id = 'bbp-bar';
        bar.innerHTML = `
<div id="bbp-prog"><div id="bbp-pfill"></div></div>

<div class="bbp-left">
    <div class="bbp-art-wrap" id="bbp-art-wrap" data-tip="Streaming links">
        <div class="bbp-art-ph" id="bbp-art-ph">
            <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <img id="bbp-art" src="" alt="">
    </div>
    <div class="bbp-meta">
        <span class="bbp-meta-title"  id="bbp-title">—</span>
        <span class="bbp-meta-artist" id="bbp-artist">Open the queue to select a track</span>
    </div>
</div>

<div class="bbp-center">
    <div class="bbp-transport">
        <button class="bbp-ghost" id="bbp-shuf" data-tip="Shuffle">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
        </button>
        <button class="bbp-skip" id="bbp-prev" data-tip="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button class="bbp-play" id="bbp-play" data-tip="Play">
            <svg id="bbp-ico-play"  width="16" height="16" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg id="bbp-ico-pause" width="16" height="16" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <button class="bbp-skip" id="bbp-next" data-tip="Next">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
        <button class="bbp-ghost" id="bbp-rep" data-tip="Repeat">
            <svg id="bbp-rep-svg" width="16" height="16" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
        </button>
    </div>
    <div class="bbp-times">
        <span id="bbp-cur" class="cur">0:00</span>
        <span style="color:var(--bbp-t3)">·</span>
        <span id="bbp-tot">0:00</span>
    </div>
</div>

<div class="bbp-right">
    <div class="bbp-vol-wrap">
        <button class="bbp-vol-btn" id="bbp-mute" data-tip="Mute">
            <svg id="bbp-vol-ico" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM16.5 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <svg id="bbp-mut-ico" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
        </button>
        <input type="range" class="bbp-vol-sl" id="bbp-vol" min="0" max="1" step="0.01" value="0.8">
    </div>
    <button class="bbp-qbtn" id="bbp-qbtn" data-tip="Queue">
        <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zm17-4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/></svg>
    </button>
</div>
        `;

        // ── Drawer ────────────────────────────────────────────
        const drawer = document.createElement('div');
        drawer.id = 'bbp-drawer';
        drawer.innerHTML = `
<div class="bbp-dhead">
    <span class="bbp-dhead-title">Queue</span>
    <button class="bbp-dclose" id="bbp-dclose">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
</div>
<div class="bbp-dsrch-wrap">
    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
    <input type="text" class="bbp-dsrch" id="bbp-dsrch" placeholder="Search tracks…">
</div>
<div class="bbp-dbody" id="bbp-dbody"></div>
        `;

        // ── Links popup ───────────────────────────────────────
        const linksPop = document.createElement('div');
        linksPop.id = 'bbp-links-pop';

        document.body.appendChild(bar);
        document.body.appendChild(drawer);
        document.body.appendChild(linksPop);
        document.body.style.paddingBottom = this._barHeight + 'px';
    }

    // ─────────────────────────────────────────────────────────
    //  AUDIO
    // ─────────────────────────────────────────────────────────
    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';
        try {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this._gainNode = this._audioCtx.createGain();
            this._analyser = this._audioCtx.createAnalyser();
            this._analyser.fftSize               = 512;
            this._analyser.smoothingTimeConstant  = 0.75;
            this._kickData = new Uint8Array(this._analyser.frequencyBinCount);
            const src = this._audioCtx.createMediaElementSource(this._audio);
            src.connect(this._gainNode);
            this._gainNode.connect(this._analyser);
            this._analyser.connect(this._audioCtx.destination);
            this._gainNode.gain.value = this._volume;
            this._runKickDetector();
        } catch (e) { console.warn('[BBP] Web Audio unavailable', e); }

        this._audio.addEventListener('timeupdate',     () => this._onTime());
        this._audio.addEventListener('loadedmetadata', () => this._onMeta());
        this._audio.addEventListener('ended',          () => this._onEnded());
        this._audio.addEventListener('play',           () => this._onPlay());
        this._audio.addEventListener('pause',          () => this._onPause());
    }

    _runKickDetector() {
        const BIN_LO = 1, BIN_HI = 3;
        const FLUX_THRESHOLD = 60, COOLDOWN_MS = 200;
        let prevEnergy = 0, lastKick = 0;
        const tick = () => {
            requestAnimationFrame(tick);
            if (!this._analyser || !this._kickData) return;
            this._analyser.getByteFrequencyData(this._kickData);
            let e = 0;
            for (let i = BIN_LO; i <= BIN_HI; i++) e += this._kickData[i];
            const flux = Math.max(0, e - prevEnergy);
            prevEnergy = e;
            const now = performance.now();
            if (flux > FLUX_THRESHOLD && now - lastKick > COOLDOWN_MS) {
                lastKick = now;
                const aw = document.getElementById('bbp-art-wrap');
                if (aw) { aw.classList.remove('kick'); void aw.offsetWidth; aw.classList.add('kick'); }
            }
        };
        tick();
    }

    // ─────────────────────────────────────────────────────────
    //  AUDIO EVENTS
    // ─────────────────────────────────────────────────────────
    _onPlay() {
        this._isPlaying = true;
        this._g('bbp-ico-play') .style.display = 'none';
        this._g('bbp-ico-pause').style.display = 'block';
        if (this._audioCtx?.state === 'suspended') this._audioCtx.resume();
    }
    _onPause() {
        this._isPlaying = false;
        this._g('bbp-ico-play') .style.display = 'block';
        this._g('bbp-ico-pause').style.display = 'none';
    }
    _onTime() {
        if (!this._audio || this._seeking) return;
        const cur = this._audio.currentTime, dur = this._audio.duration;
        if (!dur || isNaN(dur)) return;
        const p = cur / dur;
        const fill = this._g('bbp-pfill'), ct = this._g('bbp-cur');
        if (fill) fill.style.width = (p * 100) + '%';
        if (ct)   ct.textContent   = this._fmt(cur);
    }
    _onMeta() {
        const d = this._audio?.duration;
        const el = this._g('bbp-tot');
        if (d && !isNaN(d) && el) el.textContent = this._fmt(d);
    }
    _onEnded() {
        if (this._repeatMode === 'one') { this._audio.currentTime = 0; this._audio.play().catch(() => {}); }
        else this._autoNext();
    }

    // ─────────────────────────────────────────────────────────
    //  PLAYBACK
    // ─────────────────────────────────────────────────────────
    _loadSong(idx, list, autoPlay = true) {
        if (!list?.[idx]) return;
        this._playlist = list; this._songIdx = idx;
        const song = list[idx];
        this._audio.pause();
        if (song.audioFile) {
            this._audio.src = song.audioFile;
            this._audio.load();
            if (autoPlay) {
                if (this._audioCtx?.state === 'suspended') this._audioCtx.resume().catch(() => {});
                this._audio.play().catch(e => console.warn('[BBP] play blocked:', e));
            }
        }
        this._renderNowPlaying(song);
        this._renderDrawer();
    }

    _togglePlay() {
        if (!this._audio) return;
        if (this._songIdx === -1 && this._allSongs.length) { this._loadSong(0, this._allSongs, true); return; }
        if (this._audio.paused) {
            if (this._audioCtx?.state === 'suspended') this._audioCtx.resume();
            this._audio.play().catch(() => {});
        } else this._audio.pause();
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

    // ─────────────────────────────────────────────────────────
    //  UI — NOW PLAYING
    // ─────────────────────────────────────────────────────────
    _renderNowPlaying(song) {
        const t  = this._g('bbp-title');
        const a  = this._g('bbp-artist');
        const img= this._g('bbp-art');
        const ph = this._g('bbp-art-ph');
        if (t)  t.textContent = song.title  || 'Unknown';
        if (a)  a.textContent = song.artist || '—';
        if (img && ph) {
            if (song.coverImage) { img.src = song.coverImage; img.style.display = 'block'; ph.style.display = 'none'; }
            else                 { img.style.display = 'none'; ph.style.display = 'flex'; }
        }
        // Reset progress
        const fill = this._g('bbp-pfill'), cur = this._g('bbp-cur'), tot = this._g('bbp-tot');
        if (fill) fill.style.width = '0%';
        if (cur)  cur.textContent  = '0:00';
        if (tot)  tot.textContent  = '0:00';
        // Links popup
        this._buildLinksPop(song);
    }

    _buildLinksPop(song) {
        const pop = this._g('bbp-links-pop');
        if (!pop) return;
        const sl = song.streamingLinks || {};
        const links = [];
        if (sl.spotify)        links.push(['Spotify',     sl.spotify,    `<svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`]);
        if (sl.apple)          links.push(['Apple Music', sl.apple,      `<svg viewBox="0 0 24 24"><path d="M23.994 14.583c-.418 1.698-1.502 3.608-2.844 5.19-1.296 1.524-2.63 2.226-4.005 2.226-.968 0-2.228-.588-3.168-1.108-.978-.54-2.178-1.068-3.497-1.068-1.368 0-2.568.528-3.588 1.068C5.92 21.407 4.756 22 3.76 22c-1.452 0-2.916-.936-4.404-2.856C1.68 18.07.918 16.35.504 14.43.102 12.498 0 10.62 0 9.174c0-2.826.744-5.118 2.208-6.864C3.576.888 5.37 0 7.278 0c1.092 0 2.37.564 3.372 1.068.948.48 1.908.924 2.814.924.792 0 1.74-.444 2.76-.924C17.25.498 18.474 0 19.638 0c1.722 0 3.408.714 4.836 2.07-1.644.996-2.502 2.508-2.502 4.464 0 1.788.798 3.312 2.022 4.374zm-8.148-13.53c.054.234.078.462.078.696 0 1.506-.648 2.94-1.692 3.924-.972.936-2.262 1.482-3.492 1.344a4.992 4.992 0 01-.06-.648c0-1.404.618-2.844 1.638-3.81 1.002-.954 2.322-1.542 3.528-1.506z"/></svg>`]);
        if (sl.youtube)        links.push(['YouTube',     sl.youtube,    `<svg viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>`]);
        if (sl.soundcloud)     links.push(['SoundCloud',  sl.soundcloud, `<svg viewBox="0 0 24 24"><path d="M0 14.232a2.985 2.985 0 002.978 2.986l.006.004h14.037a2.987 2.987 0 002.978-2.99 2.987 2.987 0 00-2.978-2.99 2.945 2.945 0 00-.638.07A4.98 4.98 0 0012 6.522a5.005 5.005 0 00-4.998 5.008.78.78 0 000 .117A2.983 2.983 0 000 14.232zm20.97-.63a3.03 3.03 0 10-3.03 3.63h3.03a3.03 3.03 0 000-6.06v2.43z"/></svg>`]);
        if (song.purchaseLink) links.push(['Buy Now',     song.purchaseLink, `<svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.9 18 9 18h12v-2H9.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.46 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`]);

        if (!links.length) { pop.innerHTML = ''; return; }
        pop.innerHTML = links.map(([label, url, icon]) =>
            `<a href="${this._esc(url)}" target="_blank" rel="noopener">${icon}<span>${label}</span></a>`
        ).join('');
    }

    // ─────────────────────────────────────────────────────────
    //  QUEUE DRAWER
    // ─────────────────────────────────────────────────────────
    _setDrawer(open) {
        this._drawerOpen = open;
        this._g('bbp-drawer')?.classList.toggle('open', open);
        this._g('bbp-qbtn')  ?.classList.toggle('on',   open);
        if (open) this._renderDrawer();
    }

    _renderDrawer() {
        const body = this._g('bbp-dbody'), srch = this._g('bbp-dsrch');
        if (!body) return;
        const q    = srch?.value?.toLowerCase() || '';
        const list = this._allSongs.filter(s =>
            !q || (s.title ||'').toLowerCase().includes(q) ||
                  (s.artist||'').toLowerCase().includes(q) ||
                  (s.album ||'').toLowerCase().includes(q)
        );
        if (!list.length) { body.innerHTML = `<div class="bbp-empty">No tracks found</div>`; return; }
        body.innerHTML = list.map((song, i) => {
            const on  = this._playlist?.indexOf(song) === this._songIdx && this._songIdx !== -1;
            const art = song.coverImage
                ? `<img src="${this._esc(song.coverImage)}" alt="" loading="lazy">`
                : `<div class="bbp-sart-ph"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>`;
            return `<div class="bbp-srow${on?' on':''}" data-si="${i}">
                <span class="bbp-snum">${on?'':i+1}</span>
                <div class="bbp-bars"><div class="bbp-bar"></div><div class="bbp-bar"></div><div class="bbp-bar"></div></div>
                <div class="bbp-sart">${art}</div>
                <div class="bbp-smeta">
                    <div class="bbp-sname">${this._esc(song.title||'Unknown')}</div>
                    <div class="bbp-ssub">${this._esc(song.artist||'—')}${song.album?' · '+this._esc(song.album):''}</div>
                </div>
                <span class="bbp-sdur">${song.duration||''}</span>
            </div>`;
        }).join('');
        body.querySelectorAll('.bbp-srow').forEach(row => {
            row.addEventListener('click', () => {
                const real = list[parseInt(row.dataset.si)];
                const idx  = this._allSongs.indexOf(real);
                this._loadSong(idx >= 0 ? idx : parseInt(row.dataset.si), this._allSongs, true);
                this._setDrawer(false);
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────
    _bindEvents() {
        // All DOM is appended to body — use setTimeout to ensure it's ready
        setTimeout(() => {
            const on = (id, ev, fn) => { const el = this._g(id); if (el) el.addEventListener(ev, fn); };

            on('bbp-play', 'click', () => this._togglePlay());
            on('bbp-prev', 'click', () => this._prev());
            on('bbp-next', 'click', () => this._next());

            on('bbp-shuf', 'click', () => {
                this._shuffle = !this._shuffle;
                this._g('bbp-shuf')?.classList.toggle('on', this._shuffle);
            });

            on('bbp-rep', 'click', () => {
                const modes = ['none','all','one'];
                this._repeatMode = modes[(modes.indexOf(this._repeatMode)+1) % modes.length];
                const btn = this._g('bbp-rep');
                btn?.classList.toggle('on', this._repeatMode !== 'none');
                btn?.setAttribute('data-tip',
                    this._repeatMode === 'none' ? 'Repeat' :
                    this._repeatMode === 'all'  ? 'Repeat: All' : 'Repeat: One');
                // Swap icon for repeat-one
                const svg = this._g('bbp-rep-svg');
                if (svg) svg.innerHTML = this._repeatMode === 'one'
                    ? '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2v-1h-1v-1h1V9h-2l-2 1v1h1v1h-1v1h1v1h2z"/>'
                    : '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>';
            });

            // Volume
            on('bbp-vol', 'input', e => {
                this._volume = parseFloat(e.target.value);
                if (this._gainNode) this._gainNode.gain.value = this._volume;
                this._syncVolIcon();
            });
            on('bbp-mute', 'click', () => {
                if (this._volume > 0) { this._lastVolume = this._volume; this._volume = 0; }
                else                    this._volume = this._lastVolume || 0.8;
                const sl = this._g('bbp-vol');
                if (sl) sl.value = this._volume;
                if (this._gainNode) this._gainNode.gain.value = this._volume;
                this._syncVolIcon();
            });

            // Progress scrub
            const prog = this._g('bbp-prog');
            if (prog) {
                const pct = e => {
                    const r = prog.getBoundingClientRect();
                    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
                };
                prog.addEventListener('click', e => {
                    if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
                });
                prog.addEventListener('mousedown', () => {
                    this._seeking = true;
                    const mv = e => { const f=this._g('bbp-pfill'); if(f) f.style.width=(pct(e)*100)+'%'; };
                    const up = e => {
                        if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
                        this._seeking = false;
                        document.removeEventListener('mousemove', mv);
                        document.removeEventListener('mouseup',   up);
                    };
                    document.addEventListener('mousemove', mv);
                    document.addEventListener('mouseup',   up);
                });
            }

            // Queue drawer
            on('bbp-qbtn',  'click', () => this._setDrawer(!this._drawerOpen));
            on('bbp-dclose','click', () => this._setDrawer(false));
            on('bbp-dsrch', 'input', () => this._renderDrawer());

            // Links popup toggle (art click or title click)
            const toggleLinks = () => {
                this._linksOpen = !this._linksOpen;
                this._g('bbp-links-pop')?.classList.toggle('open', this._linksOpen);
            };
            on('bbp-art-wrap', 'click', toggleLinks);
            on('bbp-title',    'click', toggleLinks);

            // Close on outside click
            this._docClickFn = e => {
                const lp = this._g('bbp-links-pop');
                if (lp && this._linksOpen &&
                    !lp.contains(e.target) &&
                    !this._g('bbp-art-wrap')?.contains(e.target) &&
                    !this._g('bbp-title')?.contains(e.target)) {
                    this._linksOpen = false; lp.classList.remove('open');
                }
                const dr = this._g('bbp-drawer');
                if (dr && this._drawerOpen &&
                    !dr.contains(e.target) &&
                    !this._g('bbp-qbtn')?.contains(e.target)) {
                    this._setDrawer(false);
                }
            };
            document.addEventListener('click', this._docClickFn);

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
                    const sl = this._g('bbp-vol'); if (sl) sl.value = this._volume;
                } else if (command === 'seekTo') {
                    if (this._audio?.duration && data?.position != null)
                        this._audio.currentTime = data.position * this._audio.duration;
                } else if (command === 'shuffle') {
                    this._shuffle = data?.enable ?? !this._shuffle;
                } else if (command === 'repeat') {
                    this._repeatMode = data?.enable ? 'all' : 'none';
                }
            });
        }, 0);
    }

    // ─────────────────────────────────────────────────────────
    //  THEMING
    // ─────────────────────────────────────────────────────────
    _applyThemeProp(name, val) {
        const map = {
            'primary-color':    '--bbp-acc',
            'accent-color':     '--bbp-acc',
            'background-color': '--bbp-bg',
            'surface-color':    '--bbp-surf',
            'text-primary':     '--bbp-t1',
            'text-secondary':   '--bbp-t2',
        };
        const cssVar = map[name];
        if (cssVar) document.documentElement.style.setProperty(cssVar, val);
        if (name === 'primary-color' || name === 'accent-color') {
            const rgb = this._hexToRgbStr(val);
            if (rgb) document.documentElement.style.setProperty('--bbp-kick', rgb);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────
    _g(id)   { return document.getElementById(id); }
    _fmt(s)  {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s/60), sec = Math.floor(s%60);
        return `${m}:${sec<10?'0':''}${sec}`;
    }
    _esc(t)  { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
    _hexToRgbStr(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}` : null;
    }
    _syncVolIcon() {
        const vi=this._g('bbp-vol-ico'), mi=this._g('bbp-mut-ico');
        if (vi) vi.style.display = this._volume===0 ? 'none'  : 'block';
        if (mi) mi.style.display = this._volume===0 ? 'block' : 'none';
    }
}

customElements.define('bottom-bar-player', BottomBarPlayer);
