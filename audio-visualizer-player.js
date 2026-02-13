class AudioVisualizerPlayer extends HTMLElement {

    constructor() {
        super();
        // — audio —
        this._audio       = null;
        this._actx        = null;
        this._analyser    = null;
        this._gainNode    = null;
        this._freqData    = null;
        this._timeData    = null;
        // — three —
        this._renderer    = null;
        this._scene       = null;
        this._camera      = null;
        this._sphere      = null;
        this._wireframe   = null;
        this._particles   = null;
        this._particlePos = null;
        this._particleVel = null;
        this._clock       = null;
        this._animId      = null;
        // — state —
        this._songs       = [];
        this._songIdx     = -1;
        this._playlist    = [];
        this._isPlaying   = false;
        this._volume      = 0.8;
        this._lastVol     = 0.8;
        this._seeking     = false;
        this._threeLoaded = false;
        this._libOpen     = true;
        this._searchQ     = '';
        this._colorPreset = 'cosmicVoid';
        // — beat detection —
        this._bassEnergy  = 0;
        this._bassSmooth  = 0;
        this._kickPrev    = 0;
        this._kickThresh  = 0.55;
        this._kickFlash   = 0;
        this._beatDecay   = 0.92;
        // — player data —
        this._playerData  = null;

        // Color presets (10 dark, 10 light)
        this._PRESETS = {
            // ── DARK ──────────────────────────────────────────────
            cosmicVoid: {
                name:'Cosmic Void', dark:true,
                bg:'#020408',
                sphere1:'0.05, 0.08, 0.22',  sphere2:'0.12, 0.22, 0.65',
                glow:'0.08, 0.18, 0.85',      kick:'0.6, 0.15, 1.0',
                wire:'0.05,0.12,0.55',         particle:'0.2,0.5,1.0',
                ui:'#1a2a5a', uiAcc:'#4488ff', uiText:'#c8d8ff',
                uiBg:'#060c1a', uiBorder:'#1a2a4a',
            },
            solarFlare: {
                name:'Solar Flare', dark:true,
                bg:'#060200',
                sphere1:'0.35, 0.08, 0.02',  sphere2:'0.95, 0.35, 0.05',
                glow:'1.0, 0.45, 0.0',        kick:'1.0, 0.9, 0.2',
                wire:'0.5,0.12,0.02',          particle:'1.0,0.55,0.1',
                ui:'#2a1400', uiAcc:'#ff6600', uiText:'#ffd0a0',
                uiBg:'#0a0400', uiBorder:'#3a1a00',
            },
            emeraldDepth: {
                name:'Emerald Depth', dark:true,
                bg:'#010a04',
                sphere1:'0.02, 0.18, 0.08',  sphere2:'0.05, 0.65, 0.22',
                glow:'0.0, 0.85, 0.35',       kick:'0.5, 1.0, 0.6',
                wire:'0.02,0.3,0.1',           particle:'0.1,0.9,0.4',
                ui:'#011a08', uiAcc:'#00cc55', uiText:'#a0ffcc',
                uiBg:'#010a04', uiBorder:'#013318',
            },
            crimsonPulse: {
                name:'Crimson Pulse', dark:true,
                bg:'#080002',
                sphere1:'0.28, 0.02, 0.05',  sphere2:'0.85, 0.05, 0.18',
                glow:'1.0, 0.05, 0.22',       kick:'1.0, 0.6, 0.7',
                wire:'0.4,0.02,0.08',          particle:'1.0,0.2,0.3',
                ui:'#1a0005', uiAcc:'#ff1144', uiText:'#ffaabb',
                uiBg:'#080002', uiBorder:'#330010',
            },
            auroraVerde: {
                name:'Aurora Verde', dark:true,
                bg:'#010508',
                sphere1:'0.0, 0.22, 0.28',   sphere2:'0.0, 0.65, 0.55',
                glow:'0.0, 0.9, 0.8',         kick:'0.5, 1.0, 0.95',
                wire:'0.0,0.25,0.35',          particle:'0.1,0.85,0.75',
                ui:'#010d10', uiAcc:'#00ddcc', uiText:'#a0fff8',
                uiBg:'#010508', uiBorder:'#012830',
            },
            goldenHour: {
                name:'Golden Hour', dark:true,
                bg:'#050300',
                sphere1:'0.28, 0.20, 0.0',   sphere2:'0.88, 0.65, 0.0',
                glow:'1.0, 0.85, 0.1',        kick:'1.0, 1.0, 0.6',
                wire:'0.4,0.28,0.0',           particle:'1.0,0.78,0.15',
                ui:'#151000', uiAcc:'#ffcc00', uiText:'#fff0a0',
                uiBg:'#050300', uiBorder:'#2a2000',
            },
            neonTokyo: {
                name:'Neon Tokyo', dark:true,
                bg:'#020006',
                sphere1:'0.45, 0.0, 0.35',   sphere2:'0.85, 0.0, 0.75',
                glow:'1.0, 0.1, 0.95',        kick:'0.4, 0.9, 1.0',
                wire:'0.5,0.0,0.45',           particle:'1.0,0.2,0.9',
                ui:'#0d0015', uiAcc:'#ff22ee', uiText:'#ffaaf8',
                uiBg:'#020006', uiBorder:'#2a0030',
            },
            obsidianFrost: {
                name:'Obsidian Frost', dark:true,
                bg:'#010305',
                sphere1:'0.08, 0.12, 0.18',  sphere2:'0.35, 0.55, 0.75',
                glow:'0.55, 0.78, 1.0',       kick:'0.9, 0.95, 1.0',
                wire:'0.1,0.18,0.28',          particle:'0.6,0.8,1.0',
                ui:'#080e16', uiAcc:'#88ccff', uiText:'#d0eaff',
                uiBg:'#010305', uiBorder:'#122030',
            },
            lavaCore: {
                name:'Lava Core', dark:true,
                bg:'#040100',
                sphere1:'0.22, 0.06, 0.0',   sphere2:'0.75, 0.18, 0.0',
                glow:'1.0, 0.35, 0.0',        kick:'1.0, 0.75, 0.3',
                wire:'0.35,0.08,0.0',          particle:'1.0,0.4,0.05',
                ui:'#100400', uiAcc:'#ff5500', uiText:'#ffc888',
                uiBg:'#040100', uiBorder:'#280a00',
            },
            violetDusk: {
                name:'Violet Dusk', dark:true,
                bg:'#030108',
                sphere1:'0.18, 0.05, 0.32',  sphere2:'0.55, 0.15, 0.88',
                glow:'0.72, 0.25, 1.0',       kick:'0.9, 0.7, 1.0',
                wire:'0.22,0.05,0.38',         particle:'0.8,0.35,1.0',
                ui:'#0a0518', uiAcc:'#9933ff', uiText:'#ddb8ff',
                uiBg:'#030108', uiBorder:'#1a0a30',
            },
            // ── LIGHT ─────────────────────────────────────────────
            morningMist: {
                name:'Morning Mist', dark:false,
                bg:'#eef4f8',
                sphere1:'0.55, 0.72, 0.88',  sphere2:'0.22, 0.48, 0.75',
                glow:'0.15, 0.38, 0.85',      kick:'0.05, 0.2, 0.7',
                wire:'0.4,0.6,0.85',           particle:'0.2,0.45,0.8',
                ui:'#dce8f4', uiAcc:'#2255cc', uiText:'#1a2a50',
                uiBg:'#eef4f8', uiBorder:'#b8cce0',
            },
            sakuraBlossom: {
                name:'Sakura Blossom', dark:false,
                bg:'#fdf0f4',
                sphere1:'0.95, 0.75, 0.82',  sphere2:'0.88, 0.45, 0.62',
                glow:'0.85, 0.28, 0.52',      kick:'0.65, 0.08, 0.35',
                wire:'0.9,0.65,0.75',          particle:'0.85,0.35,0.55',
                ui:'#f8dde6', uiAcc:'#cc2255', uiText:'#4a0a20',
                uiBg:'#fdf0f4', uiBorder:'#e8b8c8',
            },
            limeLush: {
                name:'Lime Lush', dark:false,
                bg:'#f0faf2',
                sphere1:'0.55, 0.88, 0.62',  sphere2:'0.18, 0.75, 0.38',
                glow:'0.05, 0.65, 0.28',      kick:'0.02, 0.45, 0.18',
                wire:'0.4,0.82,0.52',          particle:'0.1,0.7,0.35',
                ui:'#d8f4de', uiAcc:'#117733', uiText:'#082a14',
                uiBg:'#f0faf2', uiBorder:'#a8ddbc',
            },
            sunsetPeach: {
                name:'Sunset Peach', dark:false,
                bg:'#fff7f0',
                sphere1:'1.0, 0.82, 0.68',   sphere2:'0.95, 0.55, 0.28',
                glow:'0.88, 0.35, 0.08',      kick:'0.65, 0.18, 0.02',
                wire:'0.95,0.72,0.55',         particle:'0.9,0.48,0.15',
                ui:'#ffe8d5', uiAcc:'#cc4400', uiText:'#3a1200',
                uiBg:'#fff7f0', uiBorder:'#f0c8a8',
            },
            arcticSky: {
                name:'Arctic Sky', dark:false,
                bg:'#f0f8ff',
                sphere1:'0.68, 0.88, 1.0',   sphere2:'0.35, 0.68, 0.95',
                glow:'0.1, 0.5, 0.9',         kick:'0.02, 0.3, 0.72',
                wire:'0.55,0.8,0.98',          particle:'0.25,0.6,0.92',
                ui:'#d5eeff', uiAcc:'#0066cc', uiText:'#002244',
                uiBg:'#f0f8ff', uiBorder:'#99ccee',
            },
            lavenderField: {
                name:'Lavender Field', dark:false,
                bg:'#f5f0ff',
                sphere1:'0.82, 0.72, 1.0',   sphere2:'0.58, 0.38, 0.92',
                glow:'0.45, 0.18, 0.88',      kick:'0.28, 0.05, 0.65',
                wire:'0.72,0.6,0.98',          particle:'0.52,0.3,0.9',
                ui:'#e8d8ff', uiAcc:'#6622cc', uiText:'#1a0044',
                uiBg:'#f5f0ff', uiBorder:'#ccaaee',
            },
            goldenCanvas: {
                name:'Golden Canvas', dark:false,
                bg:'#fffbf0',
                sphere1:'1.0, 0.92, 0.55',   sphere2:'0.88, 0.72, 0.12',
                glow:'0.75, 0.55, 0.02',      kick:'0.55, 0.38, 0.0',
                wire:'0.95,0.85,0.4',          particle:'0.8,0.62,0.08',
                ui:'#fff3cc', uiAcc:'#aa7700', uiText:'#2a1a00',
                uiBg:'#fffbf0', uiBorder:'#eecc88',
            },
            coralReef: {
                name:'Coral Reef', dark:false,
                bg:'#fff5f0',
                sphere1:'1.0, 0.72, 0.6',    sphere2:'0.92, 0.38, 0.22',
                glow:'0.85, 0.22, 0.08',      kick:'0.65, 0.08, 0.02',
                wire:'0.98,0.62,0.5',          particle:'0.88,0.32,0.15',
                ui:'#ffe0d5', uiAcc:'#cc3300', uiText:'#3a0a00',
                uiBg:'#fff5f0', uiBorder:'#f0b8a0',
            },
            mintBreeze: {
                name:'Mint Breeze', dark:false,
                bg:'#f0fffc',
                sphere1:'0.6, 0.95, 0.88',   sphere2:'0.18, 0.78, 0.68',
                glow:'0.02, 0.65, 0.55',      kick:'0.0, 0.45, 0.38',
                wire:'0.45,0.88,0.8',          particle:'0.12,0.72,0.62',
                ui:'#ccf5ef', uiAcc:'#007766', uiText:'#002822',
                uiBg:'#f0fffc', uiBorder:'#88ddd5',
            },
            roseGold: {
                name:'Rose Gold', dark:false,
                bg:'#fff8f5',
                sphere1:'0.95, 0.8, 0.78',   sphere2:'0.85, 0.52, 0.55',
                glow:'0.75, 0.32, 0.38',      kick:'0.55, 0.15, 0.22',
                wire:'0.92,0.72,0.7',          particle:'0.8,0.42,0.48',
                ui:'#f5ddd8', uiAcc:'#aa3344', uiText:'#2a0810',
                uiBg:'#fff8f5', uiBorder:'#e8bbb8',
            },
        };
    }

    static get observedAttributes() {
        return ['player-data','player-name','primary-color','secondary-color',
                'background-color','surface-color','text-primary','text-secondary','accent-color'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;
        if (name === 'player-data' && newVal) {
            try {
                this._playerData = JSON.parse(newVal);
                this._songs = this._playerData.songs || [];
                this._renderSidebar();
                if (this._songs.length && this._songIdx === -1)
                    this._loadSong(0, this._songs, false);
            } catch(e) { console.error('[VIZ] player-data error', e); }
        }
    }

    connectedCallback() {
        this._injectStyle();
        this._buildDOM();
        this._loadThreeJS(() => {
            this._threeLoaded = true;
            this._initThree();
            this._initAudio();
            this._animate();
        });
        if (this._playerData) {
            this._songs = this._playerData.songs || [];
            this._renderSidebar();
        }
    }

    disconnectedCallback() {
        if (this._animId) cancelAnimationFrame(this._animId);
        if (this._audio) this._audio.pause();
        if (this._actx)  this._actx.close().catch(()=>{});
        if (this._renderer) this._renderer.dispose();
    }

    // ─── STYLES ────────────────────────────────────────────────────────────────
    _injectStyle() {
        const p = this._colorPreset;
        const C = this._PRESETS[p];
        const s = document.createElement('style');
        s.id = 'viz-style';
        s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

audio-visualizer-player {
    display:block; width:100%; height:100%;
    height:-moz-available; height:-webkit-fill-available;
    box-sizing:border-box;
    --bg:${C.bg}; --ui:${C.ui}; --acc:${C.uiAcc}; --txt:${C.uiText};
    --uibg:${C.uiBg}; --bdr:${C.uiBorder};
    --mono:'JetBrains Mono',monospace;
    --sans:'Syne',sans-serif;
    font-family:var(--sans);
}
audio-visualizer-player *, audio-visualizer-player *::before, audio-visualizer-player *::after {
    box-sizing:border-box; margin:0; padding:0;
}
.viz-root {
    width:100%; height:100%;
    background:var(--bg);
    display:flex; flex-direction:row;
    overflow:hidden; position:relative;
}

/* ── SIDEBAR ── */
.viz-sidebar {
    width:240px; flex-shrink:0;
    background:var(--uibg);
    border-right:1px solid var(--bdr);
    display:flex; flex-direction:column;
    overflow:hidden;
    transition:width .3s cubic-bezier(.4,0,.2,1);
    position:relative; z-index:10;
}
.viz-sidebar.closed { width:0; }
.viz-sb-head {
    padding:14px 14px 10px;
    border-bottom:1px solid var(--bdr);
    flex-shrink:0;
}
.viz-sb-title {
    font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
    color:var(--acc); font-family:var(--mono); margin-bottom:8px;
}
.viz-sb-search {
    position:relative;
}
.viz-sb-search svg {
    position:absolute; left:8px; top:50%; transform:translateY(-50%);
    width:11px; height:11px; pointer-events:none;
}
.viz-sb-search svg path { fill:var(--acc); opacity:.5; }
.viz-srch {
    width:100%; padding:6px 8px 6px 26px;
    background:var(--ui); border:1px solid var(--bdr);
    border-radius:4px; color:var(--txt);
    font-size:11px; font-family:var(--sans);
    outline:none; transition:border-color .15s;
}
.viz-srch:focus { border-color:var(--acc); }
.viz-srch::placeholder { color:var(--txt); opacity:.35; }
.viz-sb-list { flex:1; overflow-y:auto; }
.viz-sb-list::-webkit-scrollbar { width:3px; }
.viz-sb-list::-webkit-scrollbar-track { background:transparent; }
.viz-sb-list::-webkit-scrollbar-thumb { background:var(--bdr); border-radius:2px; }
.viz-sb-list::-webkit-scrollbar-thumb:hover { background:var(--acc); }
.viz-sb-list { scrollbar-width:thin; scrollbar-color:var(--bdr) transparent; }
.viz-srow {
    display:flex; align-items:center; gap:10px;
    padding:8px 14px; cursor:pointer;
    border-bottom:1px solid var(--bdr);
    transition:background .12s;
}
.viz-srow:hover { background:var(--ui); }
.viz-srow.on { background:color-mix(in srgb, var(--acc) 12%, transparent); border-left:2px solid var(--acc); padding-left:12px; }
.viz-snum { font-size:10px; font-family:var(--mono); color:var(--txt); opacity:.35; width:18px; flex-shrink:0; text-align:right; }
.viz-srow.on .viz-snum { color:var(--acc); opacity:1; }
.viz-sart-thumb { width:34px; height:34px; flex-shrink:0; border-radius:4px; overflow:hidden; background:var(--ui); }
.viz-sart-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.viz-smeta { flex:1; min-width:0; }
.viz-sname { font-size:12px; font-weight:600; color:var(--txt); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.viz-srow.on .viz-sname { color:var(--acc); }
.viz-ssub { font-size:10px; color:var(--txt); opacity:.45; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.viz-sdur { font-size:10px; font-family:var(--mono); color:var(--txt); opacity:.35; flex-shrink:0; }

/* Playing bars */
.viz-pbars { display:none; gap:2px; align-items:flex-end; width:14px; height:14px; flex-shrink:0; }
.viz-srow.on .viz-pbars { display:flex; }
.viz-pbar { width:3px; border-radius:1px; animation:pbounce .8s ease-in-out infinite; }
.viz-pbar:nth-child(2) { animation-delay:.15s; }
.viz-pbar:nth-child(3) { animation-delay:.3s; }
@keyframes pbounce { 0%,100%{height:4px} 50%{height:12px} }

/* ── MAIN AREA ── */
.viz-main {
    flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative;
}
.viz-canvas-wrap {
    flex:1; position:relative; overflow:hidden;
}
.viz-canvas-wrap canvas {
    display:block; width:100% !important; height:100% !important;
}

/* TOGGLE SIDEBAR BTN */
.viz-tog {
    position:absolute; left:0; top:50%; transform:translateY(-50%);
    width:20px; height:48px; z-index:20;
    background:var(--uibg); border:1px solid var(--bdr); border-left:none;
    border-radius:0 6px 6px 0; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--acc); transition:background .15s;
}
.viz-tog:hover { background:var(--ui); }
.viz-tog svg { width:10px; height:10px; fill:currentColor; transition:transform .3s; }
.viz-tog.closed svg { transform:scaleX(-1); }

/* OVERLAY INFO (top of canvas) */
.viz-info {
    position:absolute; top:0; left:0; right:0;
    padding:16px 24px 0;
    display:flex; align-items:flex-start; justify-content:space-between;
    pointer-events:none; z-index:5;
}
.viz-now { pointer-events:none; }
.viz-now-title {
    font-size:22px; font-weight:800; letter-spacing:-.01em;
    color:var(--txt); line-height:1; text-shadow:0 2px 20px rgba(0,0,0,.5);
}
.viz-now-artist { font-size:12px; font-weight:500; color:var(--acc); margin-top:4px; letter-spacing:.04em; }
.viz-now-album  { font-size:10px; color:var(--txt); opacity:.4; margin-top:2px; font-family:var(--mono); }

/* CONTROLS PANEL */
.viz-controls {
    flex-shrink:0; padding:10px 16px 12px;
    background:var(--uibg); border-top:1px solid var(--bdr);
    display:flex; flex-direction:column; gap:8px;
}

/* Timeline */
.viz-timeline {
    display:flex; align-items:center; gap:10px;
}
.viz-time-lbl { font-size:10px; font-family:var(--mono); color:var(--txt); opacity:.5; flex-shrink:0; width:34px; }
.viz-time-lbl.tot { text-align:right; }
.viz-scrub {
    flex:1; position:relative; height:4px;
    background:var(--ui); border-radius:2px; cursor:pointer;
    padding:8px 0; margin:-8px 0;
}
.viz-scrub-bg { position:absolute; top:8px; left:0; right:0; height:4px; background:var(--bdr); border-radius:2px; }
.viz-scrub-fill {
    position:absolute; top:8px; left:0;
    height:4px; background:var(--acc); border-radius:2px;
    width:0%; transition:width .1s linear; pointer-events:none;
}
.viz-scrub-waveform {
    position:absolute; top:4px; left:0; right:0; height:12px;
    pointer-events:none; opacity:.25;
}
.viz-scrub-head {
    position:absolute; top:50%; left:0;
    width:14px; height:14px;
    background:var(--txt); border:2px solid var(--acc);
    border-radius:50%; transform:translate(-50%,-50%);
    opacity:0; transition:opacity .15s; pointer-events:none;
    box-shadow:0 0 8px var(--acc);
}
.viz-scrub:hover .viz-scrub-head { opacity:1; }

/* Transport row */
.viz-trow {
    display:flex; align-items:center; gap:8px;
}
.viz-tl { display:flex; gap:4px; align-items:center; }
.viz-tc { display:flex; gap:6px; align-items:center; flex:1; justify-content:center; }
.viz-tr { display:flex; gap:6px; align-items:center; }

.viz-ibtn {
    width:28px; height:28px; flex-shrink:0;
    background:var(--ui); border:1px solid var(--bdr);
    border-radius:4px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--txt); opacity:.6; padding:0;
    transition:opacity .15s, border-color .15s, color .15s;
}
.viz-ibtn:hover { opacity:1; border-color:var(--acc); color:var(--acc); }
.viz-ibtn.on { opacity:1; color:var(--acc); border-color:var(--acc); background:color-mix(in srgb, var(--acc) 10%, transparent); }
.viz-ibtn svg { width:13px; height:13px; fill:currentColor; pointer-events:none; }

.viz-play {
    width:40px; height:40px;
    background:var(--acc); border:none; border-radius:50%;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:var(--uibg); transition:transform .12s, box-shadow .15s, filter .15s;
    box-shadow:0 0 0 rgba(0,0,0,0);
}
.viz-play:hover  { transform:scale(1.08); box-shadow:0 0 20px color-mix(in srgb, var(--acc) 60%, transparent); }
.viz-play:active { transform:scale(.95); }
.viz-play svg { width:16px; height:16px; fill:currentColor; }
.viz-play.playing { filter:brightness(1.15); }

.viz-skip {
    width:32px; height:32px; flex-shrink:0;
    background:var(--ui); border:1px solid var(--bdr);
    border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--txt); opacity:.7; padding:0;
    transition:opacity .15s, border-color .15s;
}
.viz-skip:hover { opacity:1; border-color:var(--acc); }
.viz-skip svg { width:14px; height:14px; fill:currentColor; }

.viz-vol { display:flex; align-items:center; gap:6px; }
.viz-vol svg { width:12px; height:12px; fill:var(--txt); opacity:.5; flex-shrink:0; }
.viz-vol-sl {
    -webkit-appearance:none; appearance:none;
    width:70px; height:3px; background:var(--bdr); border-radius:2px;
    outline:none; cursor:pointer;
}
.viz-vol-sl::-webkit-slider-thumb {
    -webkit-appearance:none; width:12px; height:12px;
    background:var(--acc); border-radius:50%; cursor:pointer;
    box-shadow:0 0 6px color-mix(in srgb, var(--acc) 60%, transparent);
}
.viz-vol-sl::-moz-range-thumb {
    width:12px; height:12px; background:var(--acc); border:none; border-radius:50%;
}

/* Preset picker */
.viz-presets {
    display:flex; gap:4px; overflow-x:auto; align-items:center;
    scrollbar-width:none;
}
.viz-presets::-webkit-scrollbar { display:none; }
.viz-preset-lbl { font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--txt); opacity:.35; font-family:var(--mono); flex-shrink:0; }
.viz-pc {
    flex-shrink:0; padding:3px 9px;
    font-size:9px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
    border:1px solid var(--bdr); border-radius:20px; cursor:pointer;
    color:var(--txt); opacity:.5; background:transparent;
    transition:all .15s; white-space:nowrap; font-family:var(--sans);
}
.viz-pc:hover { opacity:.85; border-color:var(--acc); }
.viz-pc.on { opacity:1; color:var(--acc); border-color:var(--acc); background:color-mix(in srgb, var(--acc) 10%, transparent); }

/* Links */
.viz-ext-links { display:flex; gap:5px; flex-wrap:wrap; pointer-events:all; }
.viz-ext-link {
    padding:3px 8px; font-size:9px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
    background:color-mix(in srgb, var(--acc) 15%, transparent);
    border:1px solid color-mix(in srgb, var(--acc) 40%, transparent);
    color:var(--acc); border-radius:3px; text-decoration:none;
    transition:background .15s;
}
.viz-ext-link:hover { background:color-mix(in srgb, var(--acc) 25%, transparent); }

/* Empty state */
.viz-empty { text-align:center; padding:32px 16px; }
.viz-empty svg { width:28px; height:28px; opacity:.2; margin-bottom:8px; }
.viz-empty p { font-size:11px; opacity:.3; letter-spacing:.08em; text-transform:uppercase; font-family:var(--mono); }
.viz-empty svg path { fill:var(--acc); }
.viz-empty p { color:var(--txt); }
        `;
        this.appendChild(s);
    }

    // ─── DOM ───────────────────────────────────────────────────────────────────
    _buildDOM() {
        const root = document.createElement('div');
        root.className = 'viz-root';
        root.id = 'viz-root';

        root.innerHTML = `
<!-- SIDEBAR -->
<div class="viz-sidebar" id="viz-sb">
    <div class="viz-sb-head">
        <div class="viz-sb-title">Library</div>
        <div class="viz-sb-search">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" class="viz-srch" id="viz-srch" placeholder="Search songs...">
        </div>
    </div>
    <div class="viz-sb-list" id="viz-sblist"></div>
</div>

<!-- MAIN -->
<div class="viz-main">
    <!-- Toggle sidebar btn -->
    <button class="viz-tog" id="viz-tog" title="Toggle Library">
        <svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
    </button>

    <!-- Canvas -->
    <div class="viz-canvas-wrap" id="viz-cwrap">
        <!-- Three.js canvas injected here -->
        <!-- Overlay info -->
        <div class="viz-info">
            <div class="viz-now">
                <div class="viz-now-title"  id="viz-title">—</div>
                <div class="viz-now-artist" id="viz-artist"></div>
                <div class="viz-now-album"  id="viz-albl"></div>
                <div class="viz-ext-links"  id="viz-elinks" style="margin-top:8px"></div>
            </div>
        </div>
    </div>

    <!-- Controls -->
    <div class="viz-controls">
        <!-- Timeline -->
        <div class="viz-timeline">
            <span class="viz-time-lbl" id="viz-cur">0:00</span>
            <div class="viz-scrub" id="viz-scrub">
                <div class="viz-scrub-bg"></div>
                <canvas class="viz-scrub-waveform" id="viz-wfcv"></canvas>
                <div class="viz-scrub-fill"  id="viz-sfill"></div>
                <div class="viz-scrub-head"  id="viz-shead"></div>
            </div>
            <span class="viz-time-lbl tot" id="viz-tot">0:00</span>
        </div>

        <!-- Transport -->
        <div class="viz-trow">
            <div class="viz-tl">
                <button class="viz-ibtn" id="viz-shuf" title="Shuffle">
                    <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                </button>
                <button class="viz-ibtn" id="viz-rep" title="Repeat">
                    <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                </button>
            </div>
            <div class="viz-tc">
                <button class="viz-skip" id="viz-prev" title="Previous">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button class="viz-play" id="viz-play" title="Play/Pause">
                    <svg id="viz-pico"  viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="viz-paico" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button class="viz-skip" id="viz-next" title="Next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
            </div>
            <div class="viz-tr">
                <div class="viz-vol">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    <input type="range" class="viz-vol-sl" id="viz-vol" min="0" max="1" step="0.01" value="0.8">
                </div>
                <button class="viz-ibtn" id="viz-mute" title="Mute">
                    <svg id="viz-vico" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    <svg id="viz-mico" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                </button>
            </div>
        </div>

        <!-- Presets -->
        <div class="viz-presets" id="viz-presets">
            <span class="viz-preset-lbl">THEME</span>
        </div>
    </div>
</div>
        `;
        this.appendChild(root);
        this._bindEvents();
        this._buildPresetChips();
    }

    // ─── THREE.JS LOADER (CDN pattern from PieChartElement) ───────────────────
    _loadThreeJS(cb) {
        if (window.THREE) { cb(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.onload  = () => cb();
        s.onerror = () => console.error('[VIZ] Failed to load Three.js');
        document.head.appendChild(s);
    }

    // ─── THREE INIT ────────────────────────────────────────────────────────────
    _initThree() {
        const THREE = window.THREE;
        const wrap  = this.querySelector('#viz-cwrap');

        this._renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this._renderer.setSize(wrap.clientWidth, wrap.clientHeight);
        this._renderer.setClearColor(0x000000, 0);
        wrap.insertBefore(this._renderer.domElement, wrap.firstChild);

        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(60, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
        this._camera.position.set(0, 0, 2.8);

        this._clock = new THREE.Clock();

        this._buildSphere();
        this._buildParticles();
        this._buildLights();

        // Resize observer
        const ro = new ResizeObserver(() => {
            const w = wrap.clientWidth, h = wrap.clientHeight;
            this._renderer.setSize(w, h);
            this._camera.aspect = w / h;
            this._camera.updateProjectionMatrix();
        });
        ro.observe(wrap);
    }

    _getPresetVec(key) {
        const C = this._PRESETS[this._colorPreset];
        const v = C[key].split(',').map(x => parseFloat(x.trim()));
        return v;
    }

    _buildSphere() {
        const THREE = window.THREE;
        const C = this._PRESETS[this._colorPreset];
        const [s1r,s1g,s1b] = this._getPresetVec('sphere1');
        const [s2r,s2g,s2b] = this._getPresetVec('sphere2');
        const [gr,gg,gb]    = this._getPresetVec('glow');
        const [kr,kg,kb]    = this._getPresetVec('kick');

        const vertexShader = `
            uniform float uTime;
            uniform float uBass;
            uniform float uKick;
            uniform float uMid;
            varying vec3 vNormal;
            varying vec3 vPos;
            varying float vDisplace;
            varying float vBass;

            // Simplex-like noise
            vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
            vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
            vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
            float snoise(vec3 v){
                const vec2 C=vec2(1./6.,1./3.);
                const vec4 D=vec4(0.,.5,1.,2.);
                vec3 i=floor(v+dot(v,C.yyy));
                vec3 x0=v-i+dot(i,C.xxx);
                vec3 g=step(x0.yzx,x0.xyz);
                vec3 l=1.-g;
                vec3 i1=min(g.xyz,l.zxy);
                vec3 i2=max(g.xyz,l.zxy);
                vec3 x1=x0-i1+C.xxx;
                vec3 x2=x0-i2+C.yyy;
                vec3 x3=x0-D.yyy;
                i=mod289(i);
                vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
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
                vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
                vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
                m=m*m;
                return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
            }

            void main(){
                vNormal = normalize(normalMatrix * normal);
                float t = uTime * 0.4;
                // Base organic noise
                float n1 = snoise(position * 1.8 + vec3(t * 0.6, t * 0.4, t * 0.3));
                float n2 = snoise(position * 3.5 + vec3(t * 0.3, t * 0.7, t * 0.5)) * 0.4;
                float n3 = snoise(position * 7.0 + vec3(t * 1.2, t * 0.9, t * 0.8)) * 0.15;
                // Bass-reactive displacement — thumps on kick
                float bassDisplace = (uBass * 0.28 + uKick * 0.15) * (n1 * 0.6 + 1.0);
                // Frequency spike spikes
                float midSpike = uMid * 0.08 * snoise(position * 6.0 + vec3(t * 2.0));
                float totalDisplace = (n1 * 0.06 + n2 * 0.04 + n3 * 0.02 + bassDisplace + midSpike);
                vDisplace = totalDisplace;
                vBass = uBass;
                vPos = position + normal * totalDisplace;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            uniform float uBass;
            uniform float uKick;
            uniform vec3  uColor1;
            uniform vec3  uColor2;
            uniform vec3  uGlow;
            uniform vec3  uKickColor;
            varying vec3  vNormal;
            varying vec3  vPos;
            varying float vDisplace;
            varying float vBass;

            void main(){
                // Fresnel rim glow
                vec3 viewDir = normalize(cameraPosition - vPos);
                float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
                rim = pow(rim, 2.2);

                // Color based on displacement
                float t = clamp(vDisplace * 3.5, 0.0, 1.0);
                vec3 baseColor = mix(uColor1, uColor2, t);

                // Bass pulse — saturate towards glow color
                baseColor = mix(baseColor, uGlow, uBass * 0.55);

                // Kick flash — bright burst
                baseColor = mix(baseColor, uKickColor, uKick * 0.7);

                // Rim lighting
                vec3 rimColor = mix(uGlow, uKickColor, uKick * 0.8);
                baseColor += rimColor * rim * (0.6 + uBass * 0.8 + uKick * 1.2);

                // Inner core brightness
                float core = pow(max(dot(vNormal, vec3(0.,0.,1.)), 0.), 4.0);
                baseColor += uGlow * core * 0.3;

                // Subtle time shimmer
                float shimmer = sin(uTime * 2.0 + vPos.x * 8.0 + vPos.y * 6.0) * 0.04;
                baseColor += shimmer * uGlow;

                float alpha = 0.88 + rim * 0.12 + uBass * 0.08;
                gl_FragColor = vec4(baseColor, alpha);
            }
        `;

        const [s1r,s1g,s1b] = this._getPresetVec('sphere1');
        const [s2r,s2g,s2b] = this._getPresetVec('sphere2');
        const [gr,gg,gb]    = this._getPresetVec('glow');
        const [krr,kgg,kbb] = this._getPresetVec('kick');

        const geo = new THREE.SphereGeometry(1, 128, 128);
        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime:      { value: 0 },
                uBass:      { value: 0 },
                uKick:      { value: 0 },
                uMid:       { value: 0 },
                uColor1:    { value: new THREE.Vector3(s1r,s1g,s1b) },
                uColor2:    { value: new THREE.Vector3(s2r,s2g,s2b) },
                uGlow:      { value: new THREE.Vector3(gr,gg,gb) },
                uKickColor: { value: new THREE.Vector3(krr,kgg,kbb) },
            },
            transparent: true,
        });

        this._sphere = new THREE.Mesh(geo, mat);
        this._scene.add(this._sphere);

        // Wireframe overlay
        const wgeo = new THREE.SphereGeometry(1.01, 32, 32);
        const [wr,wg,wb] = this._getPresetVec('wire');
        const wmat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(wr,wg,wb),
            wireframe: true,
            transparent: true,
            opacity: 0.06,
        });
        this._wireframe = new THREE.Mesh(wgeo, wmat);
        this._scene.add(this._wireframe);
    }

    _buildParticles() {
        const THREE = window.THREE;
        const N = 1800;
        const positions = new Float32Array(N * 3);
        const velocities = [];
        const [pr,pg,pb] = this._getPresetVec('particle');

        for (let i = 0; i < N; i++) {
            // Distribute on sphere surface + outward cloud
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const r     = 1.15 + Math.random() * 1.8;
            positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
            velocities.push({
                theta, phi,
                r: 1.15 + Math.random() * 1.8,
                speed: (Math.random() - 0.5) * 0.003,
                radialSpeed: (Math.random() - 0.5) * 0.002,
                baseR: r,
            });
        }
        this._particleVel = velocities;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: new THREE.Color(pr, pg, pb),
            size: 0.018,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true,
        });
        this._particles = new THREE.Points(geo, mat);
        this._particlePos = positions;
        this._scene.add(this._particles);
    }

    _buildLights() {
        const THREE = window.THREE;
        const ambient = new THREE.AmbientLight(0xffffff, 0.05);
        this._scene.add(ambient);
    }

    // ─── AUDIO INIT ────────────────────────────────────────────────────────────
    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';
        try {
            this._actx     = new (window.AudioContext || window.webkitAudioContext)();
            const src      = this._actx.createMediaElementSource(this._audio);
            this._analyser = this._actx.createAnalyser();
            this._analyser.fftSize = 2048;
            this._analyser.smoothingTimeConstant = 0.8;
            this._gainNode = this._actx.createGain();
            this._gainNode.gain.value = this._volume;
            src.connect(this._gainNode);
            this._gainNode.connect(this._analyser);
            this._analyser.connect(this._actx.destination);
            this._freqData = new Uint8Array(this._analyser.frequencyBinCount);
            this._timeData = new Uint8Array(this._analyser.frequencyBinCount);
        } catch(e) { console.warn('[VIZ] Web Audio unavailable', e); }

        this._audio.addEventListener('timeupdate',     () => this._onTime());
        this._audio.addEventListener('loadedmetadata', () => this._onMeta());
        this._audio.addEventListener('ended',          () => this._next());
        this._audio.addEventListener('play',           () => this._onPlay());
        this._audio.addEventListener('pause',          () => this._onPause());
    }

    // ─── ANIMATION LOOP ────────────────────────────────────────────────────────
    _animate() {
        this._animId = requestAnimationFrame(() => this._animate());
        if (!this._threeLoaded || !this._renderer) return;

        const THREE   = window.THREE;
        const t       = this._clock.getDelta();
        const elapsed = this._clock.getElapsedTime();

        // ── Read audio data ──
        let bass = 0, mid = 0, high = 0, kick = 0;
        if (this._analyser && this._freqData) {
            this._analyser.getByteFrequencyData(this._freqData);
            const N = this._freqData.length;
            // Bass: bins 0-8 (~0–200Hz)
            for (let i = 0; i < 8; i++)  bass += this._freqData[i] / 255;
            bass /= 8;
            // Mid: bins 8-40 (~200Hz–2kHz)
            for (let i = 8; i < 40; i++) mid  += this._freqData[i] / 255;
            mid /= 32;
            // High: bins 40-100
            for (let i = 40; i < 100; i++) high += this._freqData[i] / 255;
            high /= 60;

            // Beat / kick detection
            this._bassSmooth = this._bassSmooth * 0.85 + bass * 0.15;
            const delta = bass - this._bassSmooth;
            if (delta > this._kickThresh && bass > 0.4) {
                this._kickFlash = 1.0;
            }
            this._kickFlash *= this._beatDecay;
            this._bassEnergy = bass;
            kick = this._kickFlash;
        }

        // ── Update sphere shaders ──
        if (this._sphere) {
            const u = this._sphere.material.uniforms;
            u.uTime.value = elapsed;
            u.uBass.value = this._bassEnergy;
            u.uKick.value = kick;
            u.uMid.value  = mid;
            // Slow auto-rotate, faster on bass
            this._sphere.rotation.y += 0.003 + this._bassEnergy * 0.008;
            this._sphere.rotation.x += 0.001 + this._bassEnergy * 0.003;
        }

        if (this._wireframe) {
            this._wireframe.rotation.y -= 0.002;
            this._wireframe.rotation.z += 0.001;
            this._wireframe.material.opacity = 0.04 + this._bassEnergy * 0.12 + kick * 0.18;
        }

        // ── Update particles ──
        if (this._particles && this._particleVel) {
            const pos = this._particlePos;
            for (let i = 0; i < this._particleVel.length; i++) {
                const v = this._particleVel[i];
                // Orbit + float
                v.theta += v.speed + this._bassEnergy * 0.006;
                v.phi   += v.speed * 0.5;
                // On kick — push outward
                if (kick > 0.3) {
                    v.r = Math.min(v.baseR + kick * 0.6, v.baseR * 2.5);
                } else {
                    v.r += (v.baseR - v.r) * 0.04; // spring back
                }
                pos[i*3]   = v.r * Math.sin(v.phi) * Math.cos(v.theta);
                pos[i*3+1] = v.r * Math.sin(v.phi) * Math.sin(v.theta);
                pos[i*3+2] = v.r * Math.cos(v.phi);
            }
            this._particles.geometry.attributes.position.needsUpdate = true;
            this._particles.material.opacity = 0.35 + this._bassEnergy * 0.5 + kick * 0.3;
            this._particles.material.size    = 0.014 + this._bassEnergy * 0.018 + kick * 0.025;
        }

        this._renderer.render(this._scene, this._camera);
    }

    // ─── EVENTS ────────────────────────────────────────────────────────────────
    _q(id) { return this.querySelector('#' + id); }

    _bindEvents() {
        // Sidebar toggle
        this._q('viz-tog').addEventListener('click', () => {
            const sb   = this._q('viz-sb');
            const btn  = this._q('viz-tog');
            const open = sb.classList.toggle('closed');
            btn.classList.toggle('closed', open);
        });

        // Search
        this._q('viz-srch').addEventListener('input', e => {
            this._searchQ = e.target.value.toLowerCase();
            this._renderSidebar();
        });

        // Transport
        this._q('viz-play').addEventListener('click', () => this._togglePlay());
        this._q('viz-prev').addEventListener('click', () => this._prev());
        this._q('viz-next').addEventListener('click', () => this._next());

        // Shuffle
        this._q('viz-shuf').addEventListener('click', () => {
            this._shuffle = !this._shuffle;
            this._q('viz-shuf').classList.toggle('on', this._shuffle);
        });

        // Repeat
        this._q('viz-rep').addEventListener('click', () => {
            const m = ['none','all','one'];
            const cur = this._repeatMode || 'none';
            this._repeatMode = m[(m.indexOf(cur)+1) % m.length];
            this._q('viz-rep').classList.toggle('on', this._repeatMode !== 'none');
        });

        // Volume
        const vol = this._q('viz-vol');
        vol.addEventListener('input', e => {
            this._volume = parseFloat(e.target.value);
            if (this._gainNode) this._gainNode.gain.value = this._volume;
            this._volIcon();
        });
        this._q('viz-mute').addEventListener('click', () => {
            if (this._volume > 0) { this._lastVol = this._volume; this._volume = 0; }
            else                  { this._volume = this._lastVol || 0.8; }
            vol.value = this._volume;
            if (this._gainNode) this._gainNode.gain.value = this._volume;
            this._volIcon();
        });

        // Scrub
        const scrub = this._q('viz-scrub');
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

    _buildPresetChips() {
        const wrap = this._q('viz-presets');
        Object.entries(this._PRESETS).forEach(([key, p]) => {
            const btn = document.createElement('button');
            btn.className = 'viz-pc' + (key === this._colorPreset ? ' on' : '');
            btn.dataset.key = key;
            btn.textContent = p.name;
            btn.addEventListener('click', () => this._applyPreset(key));
            wrap.appendChild(btn);
        });
    }

    _applyPreset(key) {
        this._colorPreset = key;
        const C = this._PRESETS[key];
        const root = this.querySelector('.viz-root');

        // Update CSS variables
        root.style.setProperty('--acc',   C.uiAcc);
        root.style.setProperty('--txt',   C.uiText);
        root.style.setProperty('--uibg',  C.uiBg);
        root.style.setProperty('--ui',    C.ui);
        root.style.setProperty('--bdr',   C.uiBorder);
        root.style.setProperty('--bg',    C.bg);
        this.style.setProperty('--acc',   C.uiAcc);
        this.style.setProperty('--txt',   C.uiText);
        this.style.setProperty('--bg',    C.bg);

        // Update Three.js uniforms
        if (this._sphere) {
            const THREE = window.THREE;
            const u = this._sphere.material.uniforms;
            const [s1r,s1g,s1b] = C.sphere1.split(',').map(x=>parseFloat(x));
            const [s2r,s2g,s2b] = C.sphere2.split(',').map(x=>parseFloat(x));
            const [gr,gg,gb]    = C.glow.split(',').map(x=>parseFloat(x));
            const [kr,kg,kb]    = C.kick.split(',').map(x=>parseFloat(x));
            u.uColor1.value.set(s1r,s1g,s1b);
            u.uColor2.value.set(s2r,s2g,s2b);
            u.uGlow.value.set(gr,gg,gb);
            u.uKickColor.value.set(kr,kg,kb);

            // Update wireframe
            if (this._wireframe) {
                const [wr,wg,wb] = C.wire.split(',').map(x=>parseFloat(x));
                this._wireframe.material.color.setRGB(wr,wg,wb);
            }
            // Update particles
            if (this._particles) {
                const [pr,pg,pb] = C.particle.split(',').map(x=>parseFloat(x));
                this._particles.material.color.setRGB(pr,pg,pb);
            }
        }

        // Update chip highlights
        this.querySelectorAll('.viz-pc').forEach(c =>
            c.classList.toggle('on', c.dataset.key === key)
        );

        // Update playing bar colors
        this._updatePlaybarColors();
    }

    _updatePlaybarColors() {
        const C = this._PRESETS[this._colorPreset];
        this.querySelectorAll('.viz-pbar').forEach(b => b.style.background = C.uiAcc);
    }

    // ─── AUDIO EVENTS ──────────────────────────────────────────────────────────
    _onPlay() {
        this._isPlaying = true;
        this._q('viz-pico') .style.display = 'none';
        this._q('viz-paico').style.display = 'block';
        this._q('viz-play') .classList.add('playing');
        if (this._actx?.state === 'suspended') this._actx.resume();
    }
    _onPause() {
        this._isPlaying = false;
        this._q('viz-pico') .style.display = 'block';
        this._q('viz-paico').style.display = 'none';
        this._q('viz-play') .classList.remove('playing');
    }
    _onTime() {
        if (!this._audio || this._seeking) return;
        const cur = this._audio.currentTime, dur = this._audio.duration;
        if (isNaN(dur)) return;
        this._scrubUI(cur / dur);
        this._q('viz-cur').textContent = this._fmt(cur);
    }
    _onMeta() {
        const dur = this._audio?.duration;
        if (dur && !isNaN(dur)) this._q('viz-tot').textContent = this._fmt(dur);
    }

    // ─── PLAYBACK ──────────────────────────────────────────────────────────────
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
                if (autoPlay) this._audio.play().catch(()=>{});
            }
        }
        this._nowPlaying(song);
        this._renderSidebar();
    }

    _togglePlay() {
        if (!this._audio) return;
        if (this._songIdx === -1 && this._songs.length) { this._loadSong(0, this._songs, true); return; }
        if (this._audio.paused) {
            if (this._actx?.state === 'suspended') this._actx.resume();
            this._audio.play().catch(()=>{});
        } else { this._audio.pause(); }
    }

    _next() {
        if (!this._playlist?.length) return;
        const idx = this._shuffle
            ? Math.floor(Math.random() * this._playlist.length)
            : (this._songIdx + 1) % this._playlist.length;
        this._loadSong(idx, this._playlist, this._isPlaying || true);
    }

    _prev() {
        if (!this._playlist?.length) return;
        if (this._audio?.currentTime > 3) { this._audio.currentTime = 0; return; }
        const idx = this._shuffle
            ? Math.floor(Math.random() * this._playlist.length)
            : (this._songIdx - 1 + this._playlist.length) % this._playlist.length;
        this._loadSong(idx, this._playlist, this._isPlaying);
    }

    // ─── NOW PLAYING ───────────────────────────────────────────────────────────
    _nowPlaying(song) {
        this._q('viz-title') .textContent = song.title  || '—';
        this._q('viz-artist').textContent = song.artist || '';
        this._q('viz-albl')  .textContent = song.album  || '';

        const sl = song.streamingLinks || {}, lns = [];
        if (sl.spotify)       lns.push(['Spotify',    sl.spotify]);
        if (sl.apple)         lns.push(['Apple',      sl.apple]);
        if (sl.youtube)       lns.push(['YouTube',    sl.youtube]);
        if (sl.soundcloud)    lns.push(['SoundCloud', sl.soundcloud]);
        if (song.purchaseLink) lns.push(['Buy',       song.purchaseLink]);
        this._q('viz-elinks').innerHTML = lns.map(([l,u]) =>
            `<a href="${u}" target="_blank" class="viz-ext-link">${l}</a>`
        ).join('');

        this._q('viz-cur').textContent = '0:00';
        this._q('viz-tot').textContent = '0:00';
        this._scrubUI(0);
    }

    _scrubUI(p) {
        this._q('viz-sfill').style.width = (p*100) + '%';
        this._q('viz-shead').style.left  = (p*100) + '%';
    }

    _volIcon() {
        this._q('viz-vico').style.display = this._volume === 0 ? 'none'  : 'block';
        this._q('viz-mico').style.display = this._volume === 0 ? 'block' : 'none';
    }

    // ─── SIDEBAR ───────────────────────────────────────────────────────────────
    _renderSidebar() {
        const list = this._q('viz-sblist');
        if (!list) return;
        const C = this._PRESETS[this._colorPreset];

        const songs = this._searchQ
            ? this._songs.filter(s =>
                (s.title||'').toLowerCase().includes(this._searchQ) ||
                (s.artist||'').toLowerCase().includes(this._searchQ))
            : this._songs;

        if (!songs.length) {
            list.innerHTML = `<div class="viz-empty">
                <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                <p>No songs</p></div>`;
            return;
        }

        list.innerHTML = songs.map((song, i) => {
            const active = this._playlist?.indexOf(song) === this._songIdx && this._songIdx !== -1;
            const thumb  = song.coverImage
                ? `<img src="${song.coverImage}" alt="">`
                : `<div style="width:100%;height:100%;background:${C.ui};display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="${C.uiAcc}" opacity=".4" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>`;

            return `
            <div class="viz-srow${active?' on':''}" data-i="${i}">
                <span class="viz-snum">${active ? '' : (i+1)}</span>
                <div class="viz-pbars">
                    <div class="viz-pbar" style="background:${C.uiAcc}"></div>
                    <div class="viz-pbar" style="background:${C.uiAcc}"></div>
                    <div class="viz-pbar" style="background:${C.uiAcc}"></div>
                </div>
                <div class="viz-sart-thumb">${thumb}</div>
                <div class="viz-smeta">
                    <div class="viz-sname">${this._esc(song.title||'Unknown')}</div>
                    <div class="viz-ssub">${this._esc(song.artist||'—')}</div>
                </div>
                <span class="viz-sdur">${song.duration||''}</span>
            </div>`;
        }).join('');

        list.querySelectorAll('.viz-srow').forEach(row =>
            row.addEventListener('click', () =>
                this._loadSong(parseInt(row.dataset.i), songs, true)
            )
        );
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────
    _fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s/60), sec = Math.floor(s%60);
        return `${m}:${sec<10?'0':''}${sec}`;
    }
    _esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
}

customElements.define('audio-visualizer-player', AudioVisualizerPlayer);
