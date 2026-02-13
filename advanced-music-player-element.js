// ============================================================
//  advanced-music-player  —  Wix Blocks Custom Element
//  • No shadow DOM (matches Wix default element sizing pattern)
//  • height/width fills whatever the Wix Editor container is
//  • 10-band EQ with named presets + "Custom" slider panel
//  • Library overlay (songs + albums), visualiser, full transport
// ============================================================

class AdvancedMusicPlayer extends HTMLElement {

    constructor() {
        super();
        // — state —
        this._audio           = null;
        this._ctx             = null;   // AudioContext
        this._analyser        = null;
        this._gain            = null;
        this._eqNodes         = [];
        this._isPlaying       = false;
        this._volume          = 0.8;
        this._lastVolume      = 0.8;
        this._shuffle         = false;
        this._repeatMode      = 'none'; // none | all | one
        this._playlist        = [];
        this._songIdx         = -1;
        this._allSongs        = [];
        this._albums          = [];
        this._seeking         = false;
        this._animId          = null;
        this._idleAnimId      = null;
        this._idleVis         = false;
        this._libOpen         = false;
        this._libView         = 'songs'; // songs | albums
        this._libSearch       = '';
        this._selAlbum        = null;
        this._playerData      = null;
        this._eqPreset        = 'flat';
        this._dataArray       = null;

        // 10-band EQ  (32 Hz … 16 kHz)
        this._EQ_FREQS  = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        this._EQ_LABELS = ['32','64','125','250','500','1k','2k','4k','8k','16k'];
        this._PRESETS   = {
            flat:       { name: 'Flat',       bands: [0,  0,  0,  0,  0,  0,  0,  0,  0,  0] },
            bass:       { name: 'Bass+',      bands: [7,  6,  5,  3,  1,  0,  0,  0,  0,  0] },
            treble:     { name: 'Treble+',    bands: [0,  0,  0,  0,  0,  1,  2,  4,  5,  6] },
            vocal:      { name: 'Vocal',      bands: [-2,-1,  0,  2,  5,  5,  3,  1,  0, -1] },
            rock:       { name: 'Rock',       bands: [5,  4,  3,  1, -1,  0,  2,  4,  5,  5] },
            jazz:       { name: 'Jazz',       bands: [0,  0,  0,  3,  4,  4,  3,  0, -1, -1] },
            classical:  { name: 'Classical',  bands: [0,  0,  0,  0,  0,  0,  0,  3,  4,  4] },
            electronic: { name: 'Electronic', bands: [5,  4,  1, -2,  0,  2,  0,  2,  4,  5] },
            pop:        { name: 'Pop',        bands: [-1, 0,  3,  4,  4,  3,  1, -1, -1, -1] },
            lofi:       { name: 'Lo-Fi',      bands: [4,  3,  2,  0, -2, -4, -3, -2,  1,  3] },
            custom:     { name: 'Custom',     bands: [0,  0,  0,  0,  0,  0,  0,  0,  0,  0] },
        };
    }

    // ─────────────────────────────────────────────────────────
    //  OBSERVED ATTRIBUTES
    // ─────────────────────────────────────────────────────────
    static get observedAttributes() {
        return [
            'player-data','player-name',
            'primary-color','secondary-color','background-color',
            'surface-color','text-primary','text-secondary','accent-color',
            'title-font-family','text-font-family'
        ];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;
        if (name === 'player-data' && newVal) {
            try {
                this._playerData = JSON.parse(newVal);
                this._allSongs   = this._playerData.songs || [];
                this._buildAlbums();
                this._renderLib();
                if (this._allSongs.length && this._songIdx === -1)
                    this._loadSong(0, this._allSongs, false);
            } catch(e) { console.error('[AMP] player-data error', e); }
        } else if (name === 'player-name' && newVal) {
            const el = this.querySelector('.amp-brand');
            if (el) el.textContent = newVal;
        } else {
            this._applyColors();
        }
    }

    // ─────────────────────────────────────────────────────────
    //  LIFECYCLE
    // ─────────────────────────────────────────────────────────
    connectedCallback() {
        this._injectStyle();
        this._buildDOM();
        this._bindEvents();
        this._initAudio();
        this._buildEQChips();
        this._buildEQBands();
        this._idleStart();
        if (this._playerData) {
            this._renderLib();
            if (this._allSongs.length && this._songIdx === -1)
                this._loadSong(0, this._allSongs, false);
        }
    }

    disconnectedCallback() {
        this._visStop();
        if (this._audio) this._audio.pause();
        if (this._ctx)   this._ctx.close().catch(() => {});
    }

    // ─────────────────────────────────────────────────────────
    //  CSS  —  injected into the host element (no shadow DOM)
    //          so the Wix Editor container size is respected.
    //          Key trick: host tag uses height:100% / -webkit-fill-available
    // ─────────────────────────────────────────────────────────
    _injectStyle() {
        const s = document.createElement('style');
        s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

/* HOST — fills Wix custom-element container exactly */
advanced-music-player {
    display:block;
    width:100%;
    height:100%;
    height:-moz-available;
    height:-webkit-fill-available;
    box-sizing:border-box;
    font-family:'Barlow Condensed',sans-serif;
    /* design tokens */
    --bg:    #141414;
    --surf:  #1c1c1c;
    --panel: #222;
    --b1:    #2e2e2e;
    --b2:    #3a3a3a;
    --acc:   #ff6b00;
    --acc2:  #ffaa44;
    --grn:   #22c55e;
    --t1:    #f0ece4;
    --t2:    #a09890;
    --t3:    #5a5450;
    --r:     3px;
    --mono:  'IBM Plex Mono',monospace;
}
advanced-music-player *, advanced-music-player *::before, advanced-music-player *::after {
    box-sizing:border-box; margin:0; padding:0;
}

/* SHELL — flex column filling host */
.amp-shell {
    width:100%; height:100%;
    background:var(--bg);
    border:1px solid var(--b1);
    border-radius:6px;
    display:flex; flex-direction:column;
    overflow:hidden; position:relative;
    background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.011) 2px,rgba(255,255,255,.011) 4px);
}

/* TOP BAR */
.amp-top {
    display:flex; align-items:center; gap:5px;
    padding:6px 10px;
    background:var(--surf); border-bottom:1px solid var(--b1);
    flex-shrink:0;
}
.amp-brand {
    flex:1; font-size:11px; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase;
    color:var(--acc); font-family:var(--mono);
}
.amp-dot {
    width:6px; height:6px; border-radius:50%;
    background:var(--t3); flex-shrink:0;
    transition:background .3s,box-shadow .3s;
}
.amp-dot.on { background:var(--grn); box-shadow:0 0 6px var(--grn); }
.amp-ibtn {
    width:26px; height:26px; flex-shrink:0;
    background:var(--panel); border:1px solid var(--b2);
    border-radius:var(--r); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--t2); padding:0;
    transition:color .15s,background .15s,border-color .15s;
}
.amp-ibtn:hover  { color:var(--t1); border-color:var(--acc); }
.amp-ibtn.on     { color:var(--acc); border-color:var(--acc); background:rgba(255,107,0,.12); }
.amp-ibtn svg    { width:13px; height:13px; fill:currentColor; pointer-events:none; }

/* ART STRIP */
.amp-art {
    position:relative; height:128px; flex-shrink:0;
    overflow:hidden; background:var(--surf);
}
.amp-art-bg {
    position:absolute; inset:0;
    background-size:cover; background-position:center;
    filter:blur(20px) brightness(.3); transform:scale(1.1);
}
.amp-art-row {
    position:relative; z-index:1;
    display:flex; align-items:center;
    gap:12px; padding:10px 12px; height:100%;
}
.amp-thumb {
    width:80px; height:80px; flex-shrink:0;
    border-radius:4px; overflow:hidden;
    border:1px solid rgba(255,255,255,.08);
    background:var(--panel);
    box-shadow:0 4px 20px rgba(0,0,0,.6);
    position:relative;
}
.amp-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.amp-thumb-ph {
    width:100%; height:100%;
    display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#2a2a2a,#1a1a1a);
}
.amp-thumb-ph svg { width:28px; height:28px; fill:var(--t3); opacity:.45; }
.amp-disc {
    position:absolute; inset:-3px; border-radius:50%;
    border:2px solid transparent; border-top-color:var(--acc);
    animation:amp-spin 2s linear infinite;
    opacity:0; transition:opacity .3s;
}
.amp-thumb.playing .amp-disc { opacity:1; }
@keyframes amp-spin { to { transform:rotate(360deg); } }

.amp-meta { flex:1; min-width:0; }
.amp-title {
    font-size:18px; font-weight:700; line-height:1.1;
    color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.amp-artist {
    font-size:13px; color:var(--acc2); margin-top:2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.amp-album-lbl {
    font-size:10px; color:var(--t3); margin-top:3px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    font-family:var(--mono);
}
.amp-links { display:flex; gap:4px; margin-top:6px; flex-wrap:wrap; }
.amp-link {
    padding:2px 6px; font-size:9px; font-weight:600;
    letter-spacing:.08em; text-transform:uppercase;
    background:rgba(255,107,0,.12); border:1px solid rgba(255,107,0,.3);
    color:var(--acc); border-radius:2px; text-decoration:none;
    transition:background .15s,border-color .15s;
}
.amp-link:hover { background:rgba(255,107,0,.22); border-color:var(--acc); }

.amp-vis {
    position:absolute; bottom:0; left:0; right:0;
    height:24px; opacity:.45; pointer-events:none; display:block;
}

/* PROGRESS */
.amp-prog {
    padding:8px 12px 5px;
    background:var(--surf); border-bottom:1px solid var(--b1);
    flex-shrink:0;
}
.amp-scrub {
    position:relative; height:4px;
    background:var(--panel); border-radius:2px;
    cursor:pointer; padding:6px 0; margin:-6px 0;
}
.amp-scrub-fill {
    position:absolute; top:6px; left:0;
    height:4px; background:var(--acc); border-radius:2px;
    width:0%; transition:width .1s linear; pointer-events:none;
}
.amp-scrub-head {
    position:absolute; top:50%; left:0;
    width:12px; height:12px;
    background:var(--t1); border:2px solid var(--acc);
    border-radius:50%; transform:translate(-50%,-50%);
    opacity:0; transition:opacity .15s; pointer-events:none;
    box-shadow:0 0 6px rgba(255,107,0,.5);
}
.amp-scrub:hover .amp-scrub-head { opacity:1; }
.amp-times {
    display:flex; justify-content:space-between; align-items:center;
    margin-top:9px;
}
.amp-t { font-size:10px; font-family:var(--mono); color:var(--t3); }
.amp-t.cur { color:var(--t2); }
.amp-genre {
    font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    padding:1px 6px; background:rgba(255,107,0,.1);
    border:1px solid rgba(255,107,0,.25); color:var(--acc); border-radius:2px;
}

/* TRANSPORT */
.amp-xport {
    display:flex; align-items:center; gap:4px;
    padding:7px 10px;
    background:var(--bg); border-bottom:1px solid var(--b1);
    flex-shrink:0;
}
.amp-xl { display:flex; gap:3px; align-items:center; }
.amp-xc { display:flex; gap:4px; align-items:center; flex:1; justify-content:center; }
.amp-xr { display:flex; gap:4px; align-items:center; }

.amp-play {
    width:36px; height:36px;
    background:var(--acc); border:none; border-radius:var(--r);
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:#fff; transition:background .15s,transform .12s,box-shadow .15s;
}
.amp-play:hover  { background:#ff8533; box-shadow:0 0 14px rgba(255,107,0,.4); transform:scale(1.04); }
.amp-play:active { transform:scale(.97); }
.amp-play svg    { width:15px; height:15px; fill:currentColor; }

.amp-skip {
    width:28px; height:28px; flex-shrink:0;
    background:var(--panel); border:1px solid var(--b2);
    border-radius:var(--r); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--t2); padding:0;
    transition:color .15s,border-color .15s;
}
.amp-skip:hover { color:var(--t1); border-color:var(--acc); }
.amp-skip svg   { width:13px; height:13px; fill:currentColor; }

.amp-vol { display:flex; align-items:center; gap:4px; }
.amp-vol-sl {
    -webkit-appearance:none; appearance:none;
    width:56px; height:3px;
    background:var(--b2); border-radius:2px;
    outline:none; cursor:pointer;
}
.amp-vol-sl::-webkit-slider-thumb {
    -webkit-appearance:none; width:10px; height:10px;
    background:var(--acc); border-radius:50%; cursor:pointer;
}
.amp-vol-sl::-moz-range-thumb {
    width:10px; height:10px;
    background:var(--acc); border:none; border-radius:50%;
}

/* EQ PRESET CHIP ROW */
.amp-eq-row {
    display:flex; align-items:center; gap:6px;
    padding:6px 10px;
    background:var(--surf); border-bottom:1px solid var(--b1);
    flex-shrink:0;
}
.amp-eq-lbl {
    font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:var(--t3); font-family:var(--mono); flex-shrink:0;
}
.amp-chips {
    display:flex; gap:3px; overflow-x:auto; flex:1;
    scrollbar-width:none; -webkit-overflow-scrolling:touch;
}
.amp-chips::-webkit-scrollbar { display:none; }
.amp-chip {
    flex-shrink:0; padding:2px 7px;
    font-size:9px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
    background:var(--panel); border:1px solid var(--b2);
    border-radius:2px; cursor:pointer; color:var(--t3);
    transition:all .15s; white-space:nowrap;
    font-family:'Barlow Condensed',sans-serif;
}
.amp-chip:hover  { color:var(--t2); border-color:var(--t3); }
.amp-chip.on     { color:var(--acc); border-color:var(--acc); background:rgba(255,107,0,.1); }

/* EQ PANEL — collapsible, holds both preset readout bands AND custom sliders */
.amp-eq-panel {
    background:var(--panel); border-bottom:1px solid var(--b1);
    overflow:hidden; max-height:0;
    transition:max-height .28s ease;
    flex-shrink:0;
}
.amp-eq-panel.open { max-height:120px; }

/* — preset band display (read-only bars) — */
.amp-eq-bars {
    display:flex; gap:5px; align-items:flex-end;
    padding:8px 10px 6px;
}
.amp-eq-bar-col { display:flex; flex-direction:column; align-items:center; gap:2px; flex:1; }
.amp-eq-bar-val { font-size:8px; font-family:var(--mono); color:var(--t3); height:11px; line-height:11px; text-align:center; }
.amp-eq-bar-track {
    width:100%; height:46px;
    background:var(--b1); border-radius:2px;
    position:relative; overflow:hidden;
}
.amp-eq-bar-fill {
    position:absolute; bottom:50%; left:0; right:0;
    background:var(--acc); border-radius:2px;
    transition:height .2s, bottom .2s;
    opacity:.7;
}
.amp-eq-bar-fill.neg {
    top:50%; bottom:auto;
    background:var(--acc2);
}
.amp-eq-bar-freq { font-size:7px; font-family:var(--mono); color:var(--t3); text-align:center; }

/* — custom slider panel — */
.amp-eq-custom {
    display:none; gap:5px; align-items:flex-end;
    padding:8px 10px 6px;
}
.amp-eq-custom.show { display:flex; }
.amp-eq-sl-col { display:flex; flex-direction:column; align-items:center; gap:2px; flex:1; }
.amp-eq-sl-val { font-size:8px; font-family:var(--mono); color:var(--t3); height:11px; line-height:11px; text-align:center; }
.amp-eq-sl-wrap { flex:1; display:flex; justify-content:center; }
input.amp-eq-sl {
    -webkit-appearance:slider-vertical; appearance:auto;
    writing-mode:vertical-lr; direction:rtl;
    width:16px; height:46px;
    accent-color:var(--acc); cursor:pointer;
    background:transparent; outline:none;
}
input.amp-eq-sl::-webkit-slider-runnable-track { width:2px; background:var(--b2); }
input.amp-eq-sl::-webkit-slider-thumb {
    -webkit-appearance:none; width:10px; height:5px;
    background:var(--acc); border-radius:2px;
}
.amp-eq-sl-freq { font-size:7px; font-family:var(--mono); color:var(--t3); text-align:center; }

/* STATUS BAR — pushed to bottom with margin-top:auto */
.amp-status {
    display:flex; align-items:center; gap:8px;
    padding:4px 10px;
    background:var(--surf); border-top:1px solid var(--b1);
    flex-shrink:0; margin-top:auto;
}
.amp-status-txt {
    flex:1; font-size:9px; font-family:var(--mono);
    color:var(--t3); letter-spacing:.04em;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.amp-eq-badge {
    font-size:8px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    padding:1px 5px; border-radius:2px; flex-shrink:0;
    background:rgba(255,107,0,.1); border:1px solid rgba(255,107,0,.25);
    color:var(--acc); font-family:var(--mono);
}

/* LIBRARY OVERLAY */
.amp-lib {
    position:absolute; inset:0; z-index:10;
    background:var(--bg);
    transform:translateX(100%);
    transition:transform .22s cubic-bezier(.4,0,.2,1);
    display:flex; flex-direction:column; overflow:hidden;
}
.amp-lib.open { transform:translateX(0); }
.amp-lib-head {
    display:flex; align-items:center; gap:6px;
    padding:6px 10px;
    background:var(--surf); border-bottom:1px solid var(--b1);
    flex-shrink:0;
}
.amp-lib-title {
    flex:1; font-size:11px; font-weight:700; letter-spacing:.12em;
    text-transform:uppercase; color:var(--acc); font-family:var(--mono);
}
.amp-lib-tabs {
    display:flex;
    background:var(--panel); border-bottom:1px solid var(--b1);
    flex-shrink:0;
}
.amp-lib-tab {
    flex:1; padding:7px 0; text-align:center;
    font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:var(--t3); cursor:pointer; border:none; background:transparent;
    border-bottom:2px solid transparent;
    transition:color .15s,border-color .15s;
    font-family:'Barlow Condensed',sans-serif;
}
.amp-lib-tab.on { color:var(--acc); border-bottom-color:var(--acc); }
.amp-lib-srch-wrap {
    padding:6px 10px;
    background:var(--surf); border-bottom:1px solid var(--b1);
    flex-shrink:0; position:relative;
}
.amp-lib-srch-wrap svg {
    position:absolute; left:18px; top:50%; transform:translateY(-50%);
    width:11px; height:11px; fill:var(--t3); pointer-events:none;
}
.amp-lib-srch {
    width:100%; padding:5px 8px 5px 26px;
    background:var(--panel); border:1px solid var(--b2);
    border-radius:var(--r); color:var(--t1);
    font-size:11px; font-family:'Barlow Condensed',sans-serif;
    outline:none; transition:border-color .15s;
}
.amp-lib-srch:focus { border-color:var(--acc); }
.amp-lib-srch::placeholder { color:var(--t3); }
.amp-lib-back {
    display:flex; align-items:center; gap:6px;
    padding:6px 10px;
    background:var(--surf); border-bottom:1px solid var(--b1);
    cursor:pointer; font-size:11px; font-weight:600;
    color:var(--t2); flex-shrink:0;
    transition:color .15s;
    font-family:'Barlow Condensed',sans-serif;
}
.amp-lib-back:hover { color:var(--acc); }
.amp-lib-back svg { width:10px; height:10px; fill:currentColor; }
.amp-lib-body { flex:1; overflow-y:auto; overflow-x:hidden; }
.amp-lib-body::-webkit-scrollbar { width:4px; }
.amp-lib-body::-webkit-scrollbar-track { background:transparent; }
.amp-lib-body::-webkit-scrollbar-thumb { background:var(--b2); border-radius:2px; }
.amp-lib-body::-webkit-scrollbar-thumb:hover { background:var(--acc); }
.amp-lib-body { scrollbar-width:thin; scrollbar-color:var(--b2) transparent; }

/* Song row */
.amp-srow {
    display:flex; align-items:center; gap:8px;
    padding:5px 10px; border-bottom:1px solid var(--b1);
    cursor:pointer; transition:background .12s;
}
.amp-srow:hover { background:var(--surf); }
.amp-srow.on { background:rgba(255,107,0,.08); border-left:2px solid var(--acc); padding-left:8px; }
.amp-snum { font-size:10px; font-family:var(--mono); color:var(--t3); width:16px; text-align:right; flex-shrink:0; }
.amp-srow.on .amp-snum { color:var(--acc); }
.amp-sthumb { width:30px; height:30px; flex-shrink:0; border-radius:2px; overflow:hidden; background:var(--panel); }
.amp-sthumb img { width:100%; height:100%; object-fit:cover; display:block; }
.amp-smeta { flex:1; min-width:0; }
.amp-sname { font-size:12px; font-weight:600; color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.amp-srow.on .amp-sname { color:var(--acc); }
.amp-ssub  { font-size:10px; color:var(--t3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.amp-sdur  { font-size:10px; font-family:var(--mono); color:var(--t3); flex-shrink:0; }
.amp-bars  { display:none; gap:2px; align-items:flex-end; width:14px; height:14px; flex-shrink:0; }
.amp-srow.on .amp-bars { display:flex; }
.amp-bar   { width:3px; background:var(--acc); border-radius:1px; animation:amp-bar .8s ease-in-out infinite; }
.amp-bar:nth-child(2) { animation-delay:.15s; }
.amp-bar:nth-child(3) { animation-delay:.3s; }
@keyframes amp-bar { 0%,100%{height:4px} 50%{height:12px} }

/* Album grid */
.amp-agrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:8px; padding:8px; }
.amp-acard {
    background:var(--surf); border:1px solid var(--b1); border-radius:4px;
    overflow:hidden; cursor:pointer;
    transition:border-color .15s,transform .15s;
}
.amp-acard:hover { border-color:var(--acc); transform:translateY(-2px); }
.amp-aart  { aspect-ratio:1; width:100%; overflow:hidden; background:var(--panel); }
.amp-aart img { width:100%; height:100%; object-fit:cover; display:block; }
.amp-aph   { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.amp-aph svg { width:22px; height:22px; fill:var(--t3); opacity:.35; }
.amp-ainfo { padding:5px 6px; }
.amp-aname { font-size:10px; font-weight:700; color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.amp-aartist { font-size:9px; color:var(--t3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.amp-acount { font-size:9px; color:var(--acc); font-family:var(--mono); }

/* Empty state */
.amp-empty { text-align:center; padding:28px 16px; }
.amp-empty svg { width:28px; height:28px; fill:var(--t3); opacity:.28; margin-bottom:8px; }
.amp-empty p { font-size:11px; color:var(--t3); letter-spacing:.06em; text-transform:uppercase; }
        `;
        this.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────
    //  DOM
    // ─────────────────────────────────────────────────────────
    _buildDOM() {
        const shell = document.createElement('div');
        shell.className = 'amp-shell';
        shell.innerHTML = `
<!-- TOP BAR -->
<div class="amp-top">
    <span class="amp-brand">AMP·MK2</span>
    <div class="amp-dot" id="amp-dot"></div>
    <button class="amp-ibtn" id="amp-lbtn" title="Library">
        <svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5 11.12 10 12.5 10c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
    </button>
    <button class="amp-ibtn" id="amp-eqbtn" title="Equalizer">
        <svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/></svg>
    </button>
</div>

<!-- ART STRIP -->
<div class="amp-art">
    <div class="amp-art-bg" id="amp-bg"></div>
    <div class="amp-art-row">
        <div class="amp-thumb" id="amp-thumb">
            <div class="amp-thumb-ph" id="amp-ph">
                <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            <div class="amp-disc"></div>
        </div>
        <div class="amp-meta">
            <div class="amp-title"  id="amp-title">No Track</div>
            <div class="amp-artist" id="amp-artist">—</div>
            <div class="amp-album-lbl" id="amp-albl"></div>
            <div class="amp-links"  id="amp-links"></div>
        </div>
    </div>
    <canvas class="amp-vis" id="amp-vis"></canvas>
</div>

<!-- PROGRESS -->
<div class="amp-prog">
    <div class="amp-scrub" id="amp-scrub">
        <div class="amp-scrub-fill" id="amp-sfill"></div>
        <div class="amp-scrub-head" id="amp-shead"></div>
    </div>
    <div class="amp-times">
        <span class="amp-t cur" id="amp-cur">0:00</span>
        <span class="amp-genre" id="amp-genre" style="display:none"></span>
        <span class="amp-t" id="amp-tot">0:00</span>
    </div>
</div>

<!-- TRANSPORT -->
<div class="amp-xport">
    <div class="amp-xl">
        <button class="amp-ibtn" id="amp-shuf" title="Shuffle">
            <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
        </button>
        <button class="amp-ibtn" id="amp-rep" title="Repeat">
            <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
        </button>
    </div>
    <div class="amp-xc">
        <button class="amp-skip" id="amp-prev" title="Previous">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button class="amp-play" id="amp-play" title="Play/Pause">
            <svg id="amp-pico" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg id="amp-paico" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <button class="amp-skip" id="amp-next" title="Next">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
    </div>
    <div class="amp-xr">
        <div class="amp-vol">
            <button class="amp-ibtn" id="amp-mute" title="Mute">
                <svg id="amp-vico" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                <svg id="amp-mico" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            </button>
            <input type="range" class="amp-vol-sl" id="amp-vol" min="0" max="1" step="0.01" value="0.8">
        </div>
    </div>
</div>

<!-- EQ PRESET CHIPS -->
<div class="amp-eq-row">
    <span class="amp-eq-lbl">EQ</span>
    <div class="amp-chips" id="amp-chips"></div>
</div>

<!-- EQ PANEL (preset bars + custom sliders) -->
<div class="amp-eq-panel" id="amp-eqpanel">
    <div class="amp-eq-bars"   id="amp-eqbars"></div>
    <div class="amp-eq-custom" id="amp-eqcustom"></div>
</div>

<!-- STATUS BAR -->
<div class="amp-status">
    <span class="amp-status-txt" id="amp-stxt">READY</span>
    <span class="amp-eq-badge"   id="amp-eqbadge">FLAT</span>
</div>

<!-- LIBRARY OVERLAY -->
<div class="amp-lib" id="amp-lib">
    <div class="amp-lib-head">
        <span class="amp-lib-title">Library</span>
        <button class="amp-ibtn" id="amp-lclose" title="Close">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
    </div>
    <div class="amp-lib-tabs">
        <button class="amp-lib-tab on" data-tab="songs">Songs</button>
        <button class="amp-lib-tab"    data-tab="albums">Albums</button>
    </div>
    <div class="amp-lib-srch-wrap">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input type="text" class="amp-lib-srch" id="amp-srch" placeholder="Search...">
    </div>
    <div class="amp-lib-back" id="amp-lback" style="display:none">
        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        <span>All Albums</span>
    </div>
    <div class="amp-lib-body" id="amp-lbody"></div>
</div>
        `;
        this.appendChild(shell);
    }

    // ─────────────────────────────────────────────────────────
    //  AUDIO  INIT
    // ─────────────────────────────────────────────────────────
    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';

        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            const src = this._ctx.createMediaElementSource(this._audio);

            this._eqNodes = this._EQ_FREQS.map((freq, i) => {
                const f = this._ctx.createBiquadFilter();
                f.type          = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
                f.frequency.value = freq;
                f.Q.value       = 1.4;
                f.gain.value    = 0;
                return f;
            });

            this._gain = this._ctx.createGain();
            this._gain.gain.value = this._volume;

            this._analyser = this._ctx.createAnalyser();
            this._analyser.fftSize = 512;
            this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);

            src.connect(this._eqNodes[0]);
            for (let i = 0; i < this._eqNodes.length - 1; i++)
                this._eqNodes[i].connect(this._eqNodes[i+1]);
            this._eqNodes[this._eqNodes.length-1].connect(this._gain);
            this._gain.connect(this._analyser);
            this._analyser.connect(this._ctx.destination);
        } catch(e) { console.warn('[AMP] Web Audio unavailable', e); }

        this._audio.addEventListener('timeupdate',    () => this._onTime());
        this._audio.addEventListener('loadedmetadata',() => this._onMeta());
        this._audio.addEventListener('ended',         () => this._onEnd());
        this._audio.addEventListener('play',          () => this._onPlay());
        this._audio.addEventListener('pause',         () => this._onPause());
    }

    // ─────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────
    _q(id) { return this.querySelector('#' + id); }

    _bindEvents() {
        // Library
        this._q('amp-lbtn')  .addEventListener('click', () => this._libToggle(true));
        this._q('amp-lclose').addEventListener('click', () => this._libToggle(false));
        this.querySelectorAll('.amp-lib-tab').forEach(t =>
            t.addEventListener('click', () => {
                this._libView  = t.dataset.tab;
                this._selAlbum = null;
                this.querySelectorAll('.amp-lib-tab').forEach(x => x.classList.remove('on'));
                t.classList.add('on');
                this._q('amp-lback').style.display = 'none';
                this._renderLib();
            })
        );
        this._q('amp-srch').addEventListener('input', e => {
            this._libSearch = e.target.value.toLowerCase();
            this._renderLib();
        });
        this._q('amp-lback').addEventListener('click', () => {
            this._selAlbum = null;
            this._q('amp-lback').style.display = 'none';
            this._renderLib();
        });

        // EQ toggle
        this._q('amp-eqbtn').addEventListener('click', () => {
            const p = this._q('amp-eqpanel');
            const open = p.classList.toggle('open');
            this._q('amp-eqbtn').classList.toggle('on', open);
        });

        // Transport
        this._q('amp-play').addEventListener('click', () => this._togglePlay());
        this._q('amp-prev').addEventListener('click', () => this._prev());
        this._q('amp-next').addEventListener('click', () => this._next());

        // Shuffle
        this._q('amp-shuf').addEventListener('click', () => {
            this._shuffle = !this._shuffle;
            this._q('amp-shuf').classList.toggle('on', this._shuffle);
            this._status(this._shuffle ? 'SHUFFLE ON' : 'SHUFFLE OFF');
        });

        // Repeat (none → all → one)
        this._q('amp-rep').addEventListener('click', () => {
            const m = ['none','all','one'];
            this._repeatMode = m[(m.indexOf(this._repeatMode)+1) % m.length];
            const btn = this._q('amp-rep');
            btn.classList.toggle('on', this._repeatMode !== 'none');
            btn.innerHTML = this._repeatMode === 'one'
                ? `<svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`
                : `<svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
            this._status('REPEAT: ' + this._repeatMode.toUpperCase());
        });

        // Volume
        const volEl = this._q('amp-vol');
        volEl.addEventListener('input', e => {
            this._volume = parseFloat(e.target.value);
            if (this._gain) this._gain.gain.value = this._volume;
            this._volIcon();
        });
        this._q('amp-mute').addEventListener('click', () => {
            if (this._volume > 0) { this._lastVolume = this._volume; this._volume = 0; }
            else                  { this._volume = this._lastVolume || 0.8; }
            volEl.value = this._volume;
            if (this._gain) this._gain.gain.value = this._volume;
            this._volIcon();
        });

        // Scrub
        const scrub = this._q('amp-scrub');
        const pct = e => {
            const r = scrub.getBoundingClientRect();
            return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        };
        scrub.addEventListener('click', e => {
            if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
        });
        scrub.addEventListener('mousedown', () => {
            this._seeking = true;
            const mv = e => this._scrubUI(pct(e));
            const up = e => {
                if (this._audio?.duration) this._audio.currentTime = pct(e) * this._audio.duration;
                this._seeking = false;
                document.removeEventListener('mousemove', mv);
                document.removeEventListener('mouseup',  up);
            };
            document.addEventListener('mousemove', mv);
            document.addEventListener('mouseup',   up);
        });
    }

    // ─────────────────────────────────────────────────────────
    //  AUDIO EVENTS
    // ─────────────────────────────────────────────────────────
    _onPlay() {
        this._isPlaying = true;
        this._q('amp-pico') .style.display = 'none';
        this._q('amp-paico').style.display = 'block';
        this._q('amp-dot')  .classList.add('on');
        this._q('amp-thumb').classList.add('playing');
        if (this._ctx?.state === 'suspended') this._ctx.resume();
        this._visStop(); this._visStart();
    }
    _onPause() {
        this._isPlaying = false;
        this._q('amp-pico') .style.display = 'block';
        this._q('amp-paico').style.display = 'none';
        this._q('amp-dot')  .classList.remove('on');
        this._q('amp-thumb').classList.remove('playing');
        this._visStop(); this._idleStart();
    }
    _onTime() {
        if (!this._audio || this._seeking) return;
        const cur = this._audio.currentTime, dur = this._audio.duration;
        if (isNaN(dur)) return;
        this._scrubUI(cur / dur);
        this._q('amp-cur').textContent = this._fmt(cur);
    }
    _onMeta() {
        const dur = this._audio?.duration;
        if (dur && !isNaN(dur)) this._q('amp-tot').textContent = this._fmt(dur);
    }
    _onEnd() {
        if (this._repeatMode === 'one') { this._audio.currentTime = 0; this._audio.play(); }
        else this._next();
    }

    // ─────────────────────────────────────────────────────────
    //  PLAYBACK
    // ─────────────────────────────────────────────────────────
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
                if (autoPlay) this._audio.play().catch(() => {});
            }
        }
        this._nowPlaying(song);
        this._renderLib();
        this._status((song.artist || '—') + ' — ' + (song.title || 'Unknown'));
    }

    _togglePlay() {
        if (!this._audio) return;
        if (this._songIdx === -1 && this._allSongs.length) { this._loadSong(0, this._allSongs, true); return; }
        if (this._audio.paused) {
            if (this._ctx?.state === 'suspended') this._ctx.resume();
            this._audio.play().catch(() => {});
        } else { this._audio.pause(); }
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
    //  NOW PLAYING UI
    // ─────────────────────────────────────────────────────────
    _nowPlaying(song) {
        this._q('amp-title') .textContent = song.title  || 'Unknown';
        this._q('amp-artist').textContent = song.artist || '—';
        this._q('amp-albl')  .textContent = song.album  || '';

        const g = this._q('amp-genre');
        g.textContent   = song.genre || '';
        g.style.display = song.genre ? '' : 'none';

        const thumb = this._q('amp-thumb'), bg = this._q('amp-bg'), ph = this._q('amp-ph');
        let img = thumb.querySelector('img');
        if (song.coverImage) {
            if (!img) { img = document.createElement('img'); thumb.insertBefore(img, thumb.firstChild); }
            img.src = song.coverImage;
            ph.style.display = 'none';
            bg.style.backgroundImage = `url('${song.coverImage}')`;
        } else {
            if (img) img.remove();
            ph.style.display = '';
            bg.style.backgroundImage = '';
        }

        const sl = song.streamingLinks || {}, lns = [];
        if (sl.spotify)       lns.push(['SPT', sl.spotify]);
        if (sl.apple)         lns.push(['APL', sl.apple]);
        if (sl.youtube)       lns.push(['YT',  sl.youtube]);
        if (sl.soundcloud)    lns.push(['SC',  sl.soundcloud]);
        if (song.purchaseLink) lns.push(['BUY', song.purchaseLink]);
        this._q('amp-links').innerHTML = lns.map(([l,u]) =>
            `<a href="${u}" target="_blank" class="amp-link">${l}</a>`
        ).join('');

        this._q('amp-cur').textContent = '0:00';
        this._q('amp-tot').textContent = '0:00';
        this._scrubUI(0);
    }

    _scrubUI(p) {
        this._q('amp-sfill').style.width = (p*100) + '%';
        this._q('amp-shead').style.left  = (p*100) + '%';
    }

    _volIcon() {
        this._q('amp-vico').style.display = this._volume === 0 ? 'none'  : 'block';
        this._q('amp-mico').style.display = this._volume === 0 ? 'block' : 'none';
    }

    _status(t) { this._q('amp-stxt').textContent = String(t).toUpperCase(); }

    // ─────────────────────────────────────────────────────────
    //  LIBRARY
    // ─────────────────────────────────────────────────────────
    _libToggle(open) {
        this._libOpen = open;
        this._q('amp-lib') .classList.toggle('open', open);
        this._q('amp-lbtn').classList.toggle('on',   open);
        if (open) this._renderLib();
    }

    _buildAlbums() {
        const map = new Map();
        this._allSongs.forEach(s => {
            const k = s.album || 'Unknown Album';
            if (!map.has(k)) map.set(k, { name:k, artist:s.artist||'—', coverImage:s.coverImage, songs:[] });
            map.get(k).songs.push(s);
        });
        this._albums = Array.from(map.values());
    }

    _renderLib() {
        const body = this._q('amp-lbody');
        if (!body) return;

        if (this._libView === 'songs' || this._selAlbum) {
            const src  = this._selAlbum ? this._selAlbum.songs : this._allSongs;
            const list = this._libSearch
                ? src.filter(s => (s.title||'').toLowerCase().includes(this._libSearch) ||
                                  (s.artist||'').toLowerCase().includes(this._libSearch) ||
                                  (s.album||'').toLowerCase().includes(this._libSearch))
                : src;
            if (!list.length) { body.innerHTML = this._empty(); return; }

            body.innerHTML = list.map((song, i) => {
                const active = this._playlist?.indexOf(song) === this._songIdx && this._songIdx !== -1;
                return `
                <div class="amp-srow${active?' on':''}" data-i="${i}">
                    <span class="amp-snum">${active ? '' : (i+1)}</span>
                    <div class="amp-bars"><div class="amp-bar"></div><div class="amp-bar"></div><div class="amp-bar"></div></div>
                    <div class="amp-sthumb">${song.coverImage ? `<img src="${song.coverImage}" alt="">` : ''}</div>
                    <div class="amp-smeta">
                        <div class="amp-sname">${this._esc(song.title||'Unknown')}</div>
                        <div class="amp-ssub">${this._esc(song.artist||'—')}${song.album?' · '+this._esc(song.album):''}</div>
                    </div>
                    <span class="amp-sdur">${song.duration||''}</span>
                </div>`;
            }).join('');

            body.querySelectorAll('.amp-srow').forEach(row =>
                row.addEventListener('click', () => {
                    this._loadSong(parseInt(row.dataset.i), list, true);
                    this._libToggle(false);
                })
            );
        } else {
            const list = this._libSearch
                ? this._albums.filter(a => a.name.toLowerCase().includes(this._libSearch) ||
                                           a.artist.toLowerCase().includes(this._libSearch))
                : this._albums;
            if (!list.length) { body.innerHTML = this._empty(); return; }

            body.innerHTML = `<div class="amp-agrid">` + list.map(a => `
                <div class="amp-acard" data-aname="${this._esc(a.name)}">
                    <div class="amp-aart">${a.coverImage
                        ? `<img src="${a.coverImage}" alt="">`
                        : `<div class="amp-aph"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>`}
                    </div>
                    <div class="amp-ainfo">
                        <div class="amp-aname">${this._esc(a.name)}</div>
                        <div class="amp-aartist">${this._esc(a.artist)}</div>
                        <div class="amp-acount">${a.songs.length} TRK</div>
                    </div>
                </div>`).join('') + `</div>`;

            body.querySelectorAll('.amp-acard').forEach(card =>
                card.addEventListener('click', () => {
                    this._selAlbum = this._albums.find(a => a.name === card.dataset.aname);
                    this._q('amp-lback').style.display = '';
                    this._renderLib();
                })
            );
        }
    }

    // ─────────────────────────────────────────────────────────
    //  EQ
    // ─────────────────────────────────────────────────────────
    _buildEQChips() {
        const c = this._q('amp-chips');
        if (!c) return;
        c.innerHTML = Object.entries(this._PRESETS).map(([k,p]) =>
            `<button class="amp-chip${k===this._eqPreset?' on':''}" data-k="${k}">${p.name}</button>`
        ).join('');
        c.querySelectorAll('.amp-chip').forEach(chip =>
            chip.addEventListener('click', () => this._applyPreset(chip.dataset.k))
        );
    }

    _applyPreset(key) {
        const preset = this._PRESETS[key];
        if (!preset) return;

        // Save current custom slider values before switching away
        if (key !== 'custom') {
            preset.bands.forEach((g, i) => {
                if (this._eqNodes[i]) this._eqNodes[i].gain.value = g;
            });
        }

        this._eqPreset = key;
        this.querySelectorAll('.amp-chip').forEach(c => c.classList.toggle('on', c.dataset.k === key));
        this._q('amp-eqbadge').textContent = preset.name.toUpperCase();
        this._status('EQ: ' + preset.name);

        // Show/hide correct inner panel
        this._buildEQBands(); // always rebuild bar display
        this._buildCustomSliders();

        const bars   = this._q('amp-eqbars');
        const custom = this._q('amp-eqcustom');
        if (key === 'custom') {
            bars.style.display   = 'none';
            custom.classList.add('show');
        } else {
            bars.style.display   = '';
            custom.classList.remove('show');
        }
    }

    // Read-only bar visualisation for named presets
    _buildEQBands() {
        const c = this._q('amp-eqbars');
        if (!c) return;
        c.innerHTML = this._EQ_FREQS.map((_, i) => {
            const val  = this._eqNodes[i]?.gain?.value ?? 0;
            const pct  = Math.abs(val) / 12 * 50; // max 50% of half-height
            const neg  = val < 0;
            const disp = (val >= 0 ? '+' : '') + Math.round(val);
            return `
            <div class="amp-eq-bar-col">
                <div class="amp-eq-bar-val">${disp}</div>
                <div class="amp-eq-bar-track">
                    <div class="amp-eq-bar-fill${neg?' neg':''}" style="${neg ? `top:50%;height:${pct}%` : `bottom:50%;height:${pct}%`}"></div>
                </div>
                <div class="amp-eq-bar-freq">${this._EQ_LABELS[i]}</div>
            </div>`;
        }).join('');
    }

    // Interactive sliders shown only when "Custom" is selected
    _buildCustomSliders() {
        const c = this._q('amp-eqcustom');
        if (!c) return;
        // Preserve current gain values as slider starting points
        c.innerHTML = this._EQ_FREQS.map((_, i) => {
            const val = this._eqNodes[i]?.gain?.value ?? 0;
            return `
            <div class="amp-eq-sl-col" data-band="${i}">
                <div class="amp-eq-sl-val" id="amp-slv-${i}">${(val>=0?'+':'')+Math.round(val)}</div>
                <div class="amp-eq-sl-wrap">
                    <input type="range" class="amp-eq-sl" id="amp-sl-${i}"
                        min="-12" max="12" step="0.5" value="${val}" data-band="${i}">
                </div>
                <div class="amp-eq-sl-freq">${this._EQ_LABELS[i]}</div>
            </div>`;
        }).join('');

        c.querySelectorAll('.amp-eq-sl').forEach(sl =>
            sl.addEventListener('input', e => {
                const idx = parseInt(e.target.dataset.band);
                const val = parseFloat(e.target.value);
                if (this._eqNodes[idx]) this._eqNodes[idx].gain.value = val;
                const lbl = this._q(`amp-slv-${idx}`);
                if (lbl) lbl.textContent = (val>=0?'+':'') + Math.round(val);
                // Keep custom preset bands in sync
                this._PRESETS.custom.bands[idx] = val;
            })
        );
    }

    // ─────────────────────────────────────────────────────────
    //  VISUALISER
    // ─────────────────────────────────────────────────────────
    _visStart() {
        const cv = this._q('amp-vis');
        if (!cv || !this._analyser) return;
        cv.width  = cv.offsetWidth  || 300;
        cv.height = cv.offsetHeight || 24;
        const ctx = cv.getContext('2d');
        const N   = 48, bw = cv.width / N;
        const draw = () => {
            if (!this._isPlaying) return;
            this._animId = requestAnimationFrame(draw);
            this._analyser.getByteFrequencyData(this._dataArray);
            ctx.clearRect(0, 0, cv.width, cv.height);
            const acc = this._accentColor();
            for (let i = 0; i < N; i++) {
                const v = this._dataArray[Math.floor(i * this._dataArray.length / N)] / 255;
                ctx.fillStyle   = acc;
                ctx.globalAlpha = 0.4 + v * 0.6;
                ctx.fillRect(i*bw+1, cv.height - v*cv.height, bw-2, v*cv.height);
            }
            ctx.globalAlpha = 1;
        };
        draw();
    }

    _idleStart() {
        const cv = this._q('amp-vis');
        if (!cv) return;
        cv.width  = cv.offsetWidth  || 300;
        cv.height = cv.offsetHeight || 24;
        const ctx = cv.getContext('2d');
        const N   = 48, bw = cv.width / N;
        const h   = Array.from({length:N}, () => Math.random() * 0.14);
        const sp  = Array.from({length:N}, () => (Math.random()-.5) * 0.007);
        const acc = this._accentColor();
        this._idleVis = true;
        const draw = () => {
            if (this._isPlaying || !this._idleVis) return;
            this._idleAnimId = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, cv.width, cv.height);
            for (let i = 0; i < N; i++) {
                h[i] = Math.max(0.02, Math.min(0.16, h[i] + sp[i]));
                if (h[i] >= 0.16 || h[i] <= 0.02) sp[i] *= -1;
                ctx.fillStyle   = acc;
                ctx.globalAlpha = 0.17;
                ctx.fillRect(i*bw+1, cv.height - h[i]*cv.height, bw-2, h[i]*cv.height);
            }
            ctx.globalAlpha = 1;
        };
        draw();
    }

    _visStop() {
        if (this._animId)     { cancelAnimationFrame(this._animId);     this._animId     = null; }
        this._idleVis = false;
        if (this._idleAnimId) { cancelAnimationFrame(this._idleAnimId); this._idleAnimId = null; }
        const cv = this._q('amp-vis');
        if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
    }

    _accentColor() {
        return getComputedStyle(this).getPropertyValue('--acc').trim() || '#ff6b00';
    }

    // ─────────────────────────────────────────────────────────
    //  COLOR THEMING
    // ─────────────────────────────────────────────────────────
    _applyColors() {
        const map = {
            'primary-color':    '--acc',
            'secondary-color':  '--acc2',
            'background-color': '--bg',
            'surface-color':    '--surf',
            'text-primary':     '--t1',
            'text-secondary':   '--t2',
            'accent-color':     '--acc',
        };
        for (const [attr, cssVar] of Object.entries(map)) {
            const v = this.getAttribute(attr);
            if (v) this.style.setProperty(cssVar, v);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────
    _fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s/60), sec = Math.floor(s%60);
        return `${m}:${sec<10?'0':''}${sec}`;
    }
    _esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
    _empty() {
        return `<div class="amp-empty">
            <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
            <p>Nothing here</p></div>`;
    }
}

customElements.define('advanced-music-player', AdvancedMusicPlayer);
