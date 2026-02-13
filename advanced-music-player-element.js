class AdvancedMusicPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._audioElement = null;
        this._audioContext = null;
        this._analyser = null;
        this._gainNode = null;
        this._eqNodes = [];
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._isShuffled = false;
        this._isRepeat = false; // 'none' | 'one' | 'all'
        this._repeatMode = 'none';
        this._currentPlaylist = [];
        this._currentSongIndex = -1;
        this._allSongs = [];
        this._albums = [];
        this._animationId = null;
        this._libraryOpen = false;
        this._searchQuery = '';
        this._libraryView = 'songs'; // 'songs' | 'albums'
        this._selectedAlbum = null;
        this._playerData = null;
        this._isSeeking = false;
        this._currentEqPreset = 'flat';
        this._eqPresets = {
            flat:       { name: 'Flat',        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            bass:       { name: 'Bass Boost',  bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
            treble:     { name: 'Treble Boost', bands: [0, 0, 0, 0, 0, 1, 2, 3, 4, 5] },
            vocal:      { name: 'Vocal',       bands: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1] },
            rock:       { name: 'Rock',        bands: [4, 3, 2, 0, -1, 0, 2, 3, 4, 4] },
            jazz:       { name: 'Jazz',        bands: [0, 0, 0, 2, 3, 3, 2, 0, -1, -1] },
            classical:  { name: 'Classical',   bands: [0, 0, 0, 0, 0, 0, 0, 2, 3, 3] },
            electronic: { name: 'Electronic',  bands: [4, 3, 0, -2, 0, 2, 0, 2, 3, 4] },
            pop:        { name: 'Pop',         bands: [-1, 0, 2, 3, 3, 2, 0, -1, -1, -1] },
            lofi:       { name: 'Lo-Fi',       bands: [3, 2, 1, 0, -2, -3, -2, -1, 1, 2] },
        };
        // EQ band frequencies (10-band)
        this._eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

        this._root = document.createElement('div');
        this._root.innerHTML = this._getTemplate();
        this._shadow.appendChild(this._root);
        this._setupEventListeners();
    }

    _getTemplate() {
        return `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

            :host {
                --c-bg:       #141414;
                --c-surface:  #1c1c1c;
                --c-panel:    #222222;
                --c-border:   #2e2e2e;
                --c-border2:  #3a3a3a;
                --c-accent:   #ff6b00;
                --c-accent2:  #ffaa44;
                --c-green:    #22c55e;
                --c-red:      #ef4444;
                --c-text1:    #f0ece4;
                --c-text2:    #a09890;
                --c-text3:    #5a5450;
                --c-scrub:    #ff6b00;
                --radius:     3px;
                --font-ui:    'Barlow Condensed', sans-serif;
                --font-mono:  'IBM Plex Mono', monospace;
                --transition: 0.15s ease;
                display: block;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                font-family: var(--font-ui);
            }
            *, *::before, *::after { box-sizing: inherit; margin: 0; padding: 0; }

            /* ── SHELL ── */
            .shell {
                width: 100%;
                height: 100%;
                background: var(--c-bg);
                border: 1px solid var(--c-border);
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
                /* Subtle brushed metal texture */
                background-image:
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(255,255,255,0.012) 2px,
                        rgba(255,255,255,0.012) 4px
                    );
            }

            /* ── TOP BAR ── */
            .top-bar {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 7px 10px;
                background: var(--c-surface);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0;
            }
            .top-bar-brand {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--c-accent);
                flex: 1;
                font-family: var(--font-mono);
            }
            .top-bar-indicator {
                width: 6px; height: 6px;
                border-radius: 50%;
                background: var(--c-text3);
                transition: background 0.3s, box-shadow 0.3s;
            }
            .top-bar-indicator.active {
                background: var(--c-green);
                box-shadow: 0 0 6px var(--c-green);
            }
            .icon-btn {
                width: 26px; height: 26px;
                background: var(--c-panel);
                border: 1px solid var(--c-border2);
                border-radius: var(--radius);
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                color: var(--c-text2);
                transition: color var(--transition), background var(--transition), border-color var(--transition);
                padding: 0;
            }
            .icon-btn:hover { color: var(--c-text1); border-color: var(--c-accent); }
            .icon-btn.active { color: var(--c-accent); border-color: var(--c-accent); background: rgba(255,107,0,0.12); }
            .icon-btn svg { width: 13px; height: 13px; fill: currentColor; pointer-events: none; }

            /* ── ALBUM ART STRIP ── */
            .art-strip {
                position: relative;
                height: 130px;
                flex-shrink: 0;
                overflow: hidden;
                background: var(--c-surface);
            }
            .art-bg {
                position: absolute; inset: 0;
                background-size: cover; background-position: center;
                filter: blur(20px) brightness(0.35);
                transform: scale(1.1);
                transition: background-image 0.4s;
            }
            .art-content {
                position: relative; z-index: 1;
                display: flex; align-items: center;
                gap: 12px; padding: 10px 12px;
                height: 100%;
            }
            .art-thumb {
                width: 80px; height: 80px;
                flex-shrink: 0;
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.08);
                background: var(--c-panel);
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
                position: relative;
            }
            .art-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .art-thumb-placeholder {
                width: 100%; height: 100%;
                display: flex; align-items: center; justify-content: center;
                background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
            }
            .art-thumb-placeholder svg { width: 28px; height: 28px; fill: var(--c-text3); opacity: 0.5; }
            /* Spinning disc indicator when playing */
            .disc-ring {
                position: absolute; inset: -3px;
                border-radius: 50%;
                border: 2px solid transparent;
                border-top-color: var(--c-accent);
                animation: spin 2s linear infinite;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .art-thumb.playing .disc-ring { opacity: 1; }
            @keyframes spin { to { transform: rotate(360deg); } }

            .art-meta { flex: 1; min-width: 0; }
            .art-title {
                font-size: 18px; font-weight: 700;
                color: var(--c-text1); line-height: 1.1;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                letter-spacing: 0.01em;
            }
            .art-artist {
                font-size: 13px; font-weight: 400;
                color: var(--c-accent2); margin-top: 2px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .art-album {
                font-size: 11px; font-weight: 400;
                color: var(--c-text3); margin-top: 3px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                font-family: var(--font-mono);
            }
            .art-links {
                display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;
            }
            .art-link {
                padding: 2px 6px;
                font-size: 9px; font-weight: 600;
                letter-spacing: 0.08em; text-transform: uppercase;
                background: rgba(255,107,0,0.12); border: 1px solid rgba(255,107,0,0.3);
                color: var(--c-accent); border-radius: 2px;
                cursor: pointer; text-decoration: none;
                transition: background var(--transition), border-color var(--transition);
            }
            .art-link:hover { background: rgba(255,107,0,0.22); border-color: var(--c-accent); }

            /* Visualizer canvas overlaid on art strip bottom */
            .vis-canvas {
                position: absolute; bottom: 0; left: 0; right: 0;
                height: 24px; opacity: 0.45; pointer-events: none;
            }

            /* ── PROGRESS SECTION ── */
            .progress-section {
                padding: 8px 12px 4px;
                background: var(--c-surface);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0;
            }
            .scrub-track {
                position: relative; height: 4px;
                background: var(--c-panel); border-radius: 2px;
                cursor: pointer;
                /* Wider hit target */
                padding: 6px 0; margin: -6px 0;
            }
            .scrub-fill {
                position: absolute; top: 6px; left: 0;
                height: 4px; background: var(--c-accent);
                border-radius: 2px; width: 0%; pointer-events: none;
                transition: width 0.1s linear;
            }
            .scrub-head {
                position: absolute; top: 50%; left: 0;
                width: 12px; height: 12px;
                background: var(--c-text1); border: 2px solid var(--c-accent);
                border-radius: 50%; transform: translate(-50%, -50%);
                opacity: 0; transition: opacity 0.15s; pointer-events: none;
                box-shadow: 0 0 6px rgba(255,107,0,0.5);
            }
            .scrub-track:hover .scrub-head { opacity: 1; }
            .time-row {
                display: flex; justify-content: space-between; align-items: center;
                margin-top: 10px;
            }
            .time-label {
                font-size: 10px; font-family: var(--font-mono);
                color: var(--c-text3); letter-spacing: 0.04em;
            }
            .time-label.current { color: var(--c-text2); }
            .genre-badge {
                font-size: 9px; font-weight: 700;
                letter-spacing: 0.1em; text-transform: uppercase;
                padding: 1px 6px; border-radius: 2px;
                background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.25);
                color: var(--c-accent);
            }

            /* ── TRANSPORT CONTROLS ── */
            .transport {
                display: flex; align-items: center;
                padding: 8px 10px;
                background: var(--c-bg);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0; gap: 4px;
            }
            .transport-left  { display: flex; gap: 3px; align-items: center; }
            .transport-center{ display: flex; gap: 4px; align-items: center; flex: 1; justify-content: center; }
            .transport-right { display: flex; gap: 3px; align-items: center; }

            /* Bigger play button */
            .play-btn {
                width: 38px; height: 38px;
                background: var(--c-accent);
                border: none; border-radius: var(--radius);
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                color: #fff;
                transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
                box-shadow: 0 0 0 rgba(255,107,0,0);
            }
            .play-btn:hover { background: #ff8533; box-shadow: 0 0 14px rgba(255,107,0,0.4); transform: scale(1.04); }
            .play-btn:active { transform: scale(0.97); }
            .play-btn svg { width: 16px; height: 16px; fill: currentColor; }

            .skip-btn {
                width: 30px; height: 30px;
                background: var(--c-panel); border: 1px solid var(--c-border2);
                border-radius: var(--radius); cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                color: var(--c-text2);
                transition: color var(--transition), border-color var(--transition), background var(--transition);
                padding: 0;
            }
            .skip-btn:hover { color: var(--c-text1); border-color: var(--c-accent); }
            .skip-btn svg { width: 14px; height: 14px; fill: currentColor; }

            /* ── VOLUME + EQ ROW ── */
            .bottom-row {
                display: flex; align-items: center; gap: 8px;
                padding: 7px 10px;
                background: var(--c-surface);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0;
            }
            .vol-icon { color: var(--c-text3); flex-shrink: 0; }
            .vol-icon svg { width: 12px; height: 12px; fill: currentColor; }
            .range-slider {
                -webkit-appearance: none; appearance: none;
                flex: 1; height: 3px;
                background: var(--c-border2); border-radius: 2px;
                outline: none; cursor: pointer;
            }
            .range-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 10px; height: 10px;
                background: var(--c-accent); border-radius: 50%;
                cursor: pointer; transition: transform 0.1s;
                box-shadow: 0 0 4px rgba(255,107,0,0.4);
            }
            .range-slider::-webkit-slider-thumb:hover { transform: scale(1.3); }
            .range-slider::-moz-range-thumb {
                width: 10px; height: 10px;
                background: var(--c-accent); border: none; border-radius: 50%; cursor: pointer;
            }
            .vol-value {
                font-size: 10px; font-family: var(--font-mono);
                color: var(--c-text3); width: 26px; text-align: right; flex-shrink: 0;
            }
            .sep { width: 1px; height: 14px; background: var(--c-border); flex-shrink: 0; }

            /* EQ preset selector */
            .eq-preset-label {
                font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
                text-transform: uppercase; color: var(--c-text3); flex-shrink: 0;
                font-family: var(--font-mono);
            }
            .eq-preset-scroll {
                display: flex; gap: 3px; overflow-x: auto; flex: 1;
                scrollbar-width: none; -webkit-overflow-scrolling: touch;
            }
            .eq-preset-scroll::-webkit-scrollbar { display: none; }
            .eq-chip {
                flex-shrink: 0;
                padding: 2px 7px; font-size: 9px; font-weight: 600;
                letter-spacing: 0.06em; text-transform: uppercase;
                background: var(--c-panel); border: 1px solid var(--c-border2);
                border-radius: 2px; cursor: pointer; color: var(--c-text3);
                transition: all var(--transition); white-space: nowrap;
                font-family: var(--font-ui);
            }
            .eq-chip:hover { color: var(--c-text2); border-color: var(--c-text3); }
            .eq-chip.active { color: var(--c-accent); border-color: var(--c-accent); background: rgba(255,107,0,0.1); }

            /* ── EQ PANEL (collapsible) ── */
            .eq-panel {
                background: var(--c-panel);
                border-bottom: 1px solid var(--c-border);
                overflow: hidden;
                max-height: 0;
                transition: max-height 0.25s ease;
                flex-shrink: 0;
            }
            .eq-panel.open { max-height: 110px; }
            .eq-inner { padding: 8px 10px; }
            .eq-bands {
                display: flex; gap: 6px; align-items: flex-end;
                height: 70px;
            }
            .eq-band {
                display: flex; flex-direction: column;
                align-items: center; gap: 3px; flex: 1;
            }
            .eq-band-val {
                font-size: 8px; font-family: var(--font-mono);
                color: var(--c-text3); text-align: center;
                height: 12px; line-height: 12px;
            }
            .eq-fader-wrap {
                flex: 1; width: 100%; display: flex;
                justify-content: center; align-items: center;
                position: relative;
            }
            input.eq-fader {
                -webkit-appearance: slider-vertical; appearance: auto;
                writing-mode: vertical-lr; direction: rtl;
                width: 18px; height: 48px;
                accent-color: var(--c-accent);
                cursor: pointer; background: transparent;
                outline: none;
            }
            input.eq-fader::-webkit-slider-runnable-track {
                width: 2px; background: var(--c-border2);
            }
            input.eq-fader::-webkit-slider-thumb {
                -webkit-appearance: none; width: 10px; height: 6px;
                background: var(--c-accent); border-radius: 2px;
            }
            .eq-band-freq {
                font-size: 7px; font-family: var(--font-mono);
                color: var(--c-text3); text-align: center;
            }

            /* ── LIBRARY OVERLAY ── */
            .library-overlay {
                position: absolute; inset: 0; z-index: 10;
                background: var(--c-bg);
                transform: translateX(100%);
                transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; flex-direction: column;
                overflow: hidden;
            }
            .library-overlay.open { transform: translateX(0); }

            .lib-header {
                display: flex; align-items: center; gap: 6px;
                padding: 7px 10px;
                background: var(--c-surface);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0;
            }
            .lib-title {
                font-size: 11px; font-weight: 700;
                letter-spacing: 0.12em; text-transform: uppercase;
                color: var(--c-accent); font-family: var(--font-mono); flex: 1;
            }

            /* Tab strip */
            .lib-tabs {
                display: flex;
                background: var(--c-panel);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0;
            }
            .lib-tab {
                flex: 1; padding: 7px 0; text-align: center;
                font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
                color: var(--c-text3); cursor: pointer; border: none; background: transparent;
                border-bottom: 2px solid transparent;
                transition: color var(--transition), border-color var(--transition);
                font-family: var(--font-ui);
            }
            .lib-tab.active { color: var(--c-accent); border-bottom-color: var(--c-accent); }

            /* Search */
            .lib-search-wrap {
                padding: 7px 10px;
                background: var(--c-surface);
                border-bottom: 1px solid var(--c-border);
                flex-shrink: 0; position: relative;
            }
            .lib-search-wrap svg {
                position: absolute; left: 18px; top: 50%;
                transform: translateY(-50%);
                width: 11px; height: 11px; fill: var(--c-text3); pointer-events: none;
            }
            .lib-search {
                width: 100%; padding: 5px 8px 5px 26px;
                background: var(--c-panel); border: 1px solid var(--c-border2);
                border-radius: var(--radius); color: var(--c-text1);
                font-size: 11px; font-family: var(--font-ui);
                outline: none; transition: border-color var(--transition);
            }
            .lib-search:focus { border-color: var(--c-accent); }
            .lib-search::placeholder { color: var(--c-text3); }

            /* Scrollable content */
            .lib-content {
                flex: 1; overflow-y: auto; overflow-x: hidden;
            }
            .lib-content::-webkit-scrollbar { width: 4px; }
            .lib-content::-webkit-scrollbar-track { background: transparent; }
            .lib-content::-webkit-scrollbar-thumb { background: var(--c-border2); border-radius: 2px; }
            .lib-content::-webkit-scrollbar-thumb:hover { background: var(--c-accent); }
            .lib-content { scrollbar-width: thin; scrollbar-color: var(--c-border2) transparent; }

            /* Song row */
            .song-row {
                display: flex; align-items: center; gap: 8px;
                padding: 6px 10px;
                border-bottom: 1px solid var(--c-border);
                cursor: pointer;
                transition: background var(--transition);
            }
            .song-row:hover { background: var(--c-surface); }
            .song-row.active { background: rgba(255,107,0,0.08); border-left: 2px solid var(--c-accent); padding-left: 8px; }
            .song-num {
                font-size: 10px; font-family: var(--font-mono);
                color: var(--c-text3); width: 16px; text-align: right; flex-shrink: 0;
            }
            .song-row.active .song-num { color: var(--c-accent); }
            .song-thumb {
                width: 32px; height: 32px; flex-shrink: 0;
                border-radius: 2px; overflow: hidden; background: var(--c-panel);
            }
            .song-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .song-meta { flex: 1; min-width: 0; }
            .song-name {
                font-size: 12px; font-weight: 600;
                color: var(--c-text1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .song-row.active .song-name { color: var(--c-accent); }
            .song-sub {
                font-size: 10px; color: var(--c-text3);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .song-dur {
                font-size: 10px; font-family: var(--font-mono);
                color: var(--c-text3); flex-shrink: 0;
            }
            /* Playing animation bars */
            .playing-bars {
                display: none; gap: 2px; align-items: flex-end;
                width: 14px; height: 14px; flex-shrink: 0;
            }
            .song-row.active .playing-bars { display: flex; }
            .bar {
                width: 3px; background: var(--c-accent); border-radius: 1px;
                animation: bar-bounce 0.8s ease-in-out infinite;
            }
            .bar:nth-child(2) { animation-delay: 0.15s; }
            .bar:nth-child(3) { animation-delay: 0.3s; }
            @keyframes bar-bounce {
                0%, 100% { height: 4px; }
                50% { height: 12px; }
            }

            /* Album cards grid */
            .album-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 8px; padding: 8px;
            }
            .album-card {
                background: var(--c-surface); border: 1px solid var(--c-border);
                border-radius: 4px; overflow: hidden; cursor: pointer;
                transition: border-color var(--transition), transform var(--transition);
            }
            .album-card:hover { border-color: var(--c-accent); transform: translateY(-2px); }
            .album-card.active { border-color: var(--c-accent); }
            .album-art {
                aspect-ratio: 1; width: 100%; overflow: hidden; background: var(--c-panel);
                position: relative;
            }
            .album-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .album-art-placeholder {
                width: 100%; height: 100%;
                display: flex; align-items: center; justify-content: center;
            }
            .album-art-placeholder svg { width: 24px; height: 24px; fill: var(--c-text3); opacity: 0.4; }
            .album-info { padding: 5px 6px; }
            .album-name {
                font-size: 10px; font-weight: 700; color: var(--c-text1);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .album-artist-name {
                font-size: 9px; color: var(--c-text3);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .album-count {
                font-size: 9px; color: var(--c-accent); font-family: var(--font-mono);
            }

            /* Back button in lib */
            .lib-back {
                display: flex; align-items: center; gap: 6px;
                padding: 6px 10px;
                background: var(--c-surface); border-bottom: 1px solid var(--c-border);
                cursor: pointer; font-size: 11px; font-weight: 600;
                color: var(--c-text2); flex-shrink: 0;
                transition: color var(--transition);
            }
            .lib-back:hover { color: var(--c-accent); }
            .lib-back svg { width: 10px; height: 10px; fill: currentColor; }

            /* Empty state */
            .empty-state {
                text-align: center; padding: 32px 16px;
            }
            .empty-state svg { width: 32px; height: 32px; fill: var(--c-text3); opacity: 0.3; margin-bottom: 8px; }
            .empty-state p { font-size: 11px; color: var(--c-text3); letter-spacing: 0.06em; text-transform: uppercase; }

            /* ── BOTTOM STATUS BAR ── */
            .status-bar {
                display: flex; align-items: center; gap: 8px;
                padding: 5px 10px;
                background: var(--c-surface);
                flex-shrink: 0;
                border-top: 1px solid var(--c-border);
            }
            .status-text {
                flex: 1; font-size: 9px; font-family: var(--font-mono);
                color: var(--c-text3); letter-spacing: 0.04em;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .status-eq-badge {
                font-size: 8px; font-weight: 700; letter-spacing: 0.1em;
                text-transform: uppercase; padding: 1px 5px;
                background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.25);
                color: var(--c-accent); border-radius: 2px; flex-shrink: 0;
                font-family: var(--font-mono);
            }
        </style>

        <div class="shell">
            <!-- TOP BAR -->
            <div class="top-bar">
                <div class="top-bar-brand">AMP·MK2</div>
                <div class="top-bar-indicator" id="playIndicator"></div>
                <!-- Library toggle -->
                <button class="icon-btn" id="libBtn" title="Library">
                    <svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5 11.12 10 12.5 10c.57 0 1.08.19 1.5.5V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
                </button>
                <!-- EQ toggle -->
                <button class="icon-btn" id="eqBtn" title="Equalizer">
                    <svg viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/></svg>
                </button>
            </div>

            <!-- ALBUM ART STRIP -->
            <div class="art-strip">
                <div class="art-bg" id="artBg"></div>
                <div class="art-content">
                    <div class="art-thumb" id="artThumb">
                        <div class="art-thumb-placeholder" id="artPlaceholder">
                            <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                        </div>
                        <div class="disc-ring" id="discRing"></div>
                    </div>
                    <div class="art-meta">
                        <div class="art-title" id="artTitle">No Track</div>
                        <div class="art-artist" id="artArtist">—</div>
                        <div class="art-album" id="artAlbum"></div>
                        <div class="art-links" id="artLinks"></div>
                    </div>
                </div>
                <canvas class="vis-canvas" id="visCanvas"></canvas>
            </div>

            <!-- PROGRESS -->
            <div class="progress-section">
                <div class="scrub-track" id="scrubTrack">
                    <div class="scrub-fill" id="scrubFill"></div>
                    <div class="scrub-head" id="scrubHead"></div>
                </div>
                <div class="time-row">
                    <span class="time-label current" id="timeCurrent">0:00</span>
                    <span class="genre-badge" id="genreBadge"></span>
                    <span class="time-label" id="timeTotal">0:00</span>
                </div>
            </div>

            <!-- TRANSPORT -->
            <div class="transport">
                <div class="transport-left">
                    <button class="icon-btn" id="shuffleBtn" title="Shuffle">
                        <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                    </button>
                    <button class="icon-btn" id="repeatBtn" title="Repeat">
                        <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                    </button>
                </div>
                <div class="transport-center">
                    <button class="skip-btn" id="prevBtn" title="Previous">
                        <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    <button class="play-btn" id="playBtn" title="Play/Pause">
                        <svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </button>
                    <button class="skip-btn" id="nextBtn" title="Next">
                        <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                </div>
                <div class="transport-right">
                    <button class="icon-btn" id="muteBtn" title="Mute">
                        <svg id="volIcon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                        <svg id="muteIcon" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                    </button>
                    <input type="range" class="range-slider" id="volSlider" min="0" max="1" step="0.01" value="0.8" style="width:60px">
                </div>
            </div>

            <!-- EQ PANEL -->
            <div class="eq-panel" id="eqPanel">
                <div class="eq-inner">
                    <div class="eq-bands" id="eqBands">
                        <!-- rendered by JS -->
                    </div>
                </div>
            </div>

            <!-- VOLUME + EQ PRESET ROW -->
            <div class="bottom-row">
                <span class="eq-preset-label">EQ</span>
                <div class="eq-preset-scroll" id="eqChips">
                    <!-- rendered by JS -->
                </div>
            </div>

            <!-- STATUS BAR -->
            <div class="status-bar">
                <span class="status-text" id="statusText">READY</span>
                <span class="status-eq-badge" id="eqBadge">FLAT</span>
            </div>

            <!-- LIBRARY OVERLAY -->
            <div class="library-overlay" id="libraryOverlay">
                <div class="lib-header">
                    <span class="lib-title">Library</span>
                    <button class="icon-btn" id="libCloseBtn" title="Close">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
                <div class="lib-tabs">
                    <button class="lib-tab active" data-tab="songs">Songs</button>
                    <button class="lib-tab" data-tab="albums">Albums</button>
                </div>
                <div class="lib-search-wrap">
                    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    <input type="text" class="lib-search" id="libSearch" placeholder="Search...">
                </div>
                <!-- album back button, hidden by default -->
                <div class="lib-back" id="libBack" style="display:none">
                    <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    <span>All Albums</span>
                </div>
                <div class="lib-content" id="libContent"></div>
            </div>
        </div>
        `;
    }

    // ─── LIFECYCLE ─────────────────────────────────────────────────────────────
    static get observedAttributes() {
        return ['player-data','player-name','primary-color','secondary-color','background-color',
                'text-primary','text-secondary','accent-color','surface-color',
                'title-font-family','text-font-family'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;
        if (name === 'player-data' && newVal) {
            try {
                this._playerData = JSON.parse(newVal);
                this._allSongs = this._playerData.songs || [];
                this._processAlbums();
                this._renderLibrary();
                // Auto-load first song without playing
                if (this._allSongs.length && this._currentSongIndex === -1) {
                    this._loadSong(0, this._allSongs, false);
                }
            } catch(e) { console.error('player-data parse error', e); }
        } else if (name === 'player-name' && newVal) {
            const brand = this._shadow.querySelector('.top-bar-brand');
            if (brand) brand.textContent = newVal;
        } else {
            this._applyColors();
        }
    }

    connectedCallback() {
        this._initAudio();
        this._buildEQ();
        this._renderEQChips();
        this._renderEQBands();
        this._startIdleVis();
        if (this._playerData) {
            this._renderLibrary();
            if (this._allSongs.length && this._currentSongIndex === -1) {
                this._loadSong(0, this._allSongs, false);
            }
        }
    }

    disconnectedCallback() {
        this._cleanup();
    }

    // ─── AUDIO SETUP ──────────────────────────────────────────────────────────
    _initAudio() {
        this._audioElement = document.createElement('audio');
        this._audioElement.crossOrigin = 'anonymous';

        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const src = this._audioContext.createMediaElementSource(this._audioElement);

            // 10-band EQ
            this._eqNodes = this._eqFrequencies.map((freq, i) => {
                const filter = this._audioContext.createBiquadFilter();
                filter.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1.4;
                filter.gain.value = 0;
                return filter;
            });

            // Chain: src → eq0 → eq1 → ... → eq9 → gain → analyser → dest
            this._gainNode = this._audioContext.createGain();
            this._gainNode.gain.value = this._currentVolume;

            this._analyser = this._audioContext.createAnalyser();
            this._analyser.fftSize = 512;
            this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);

            src.connect(this._eqNodes[0]);
            for (let i = 0; i < this._eqNodes.length - 1; i++) {
                this._eqNodes[i].connect(this._eqNodes[i + 1]);
            }
            this._eqNodes[this._eqNodes.length - 1].connect(this._gainNode);
            this._gainNode.connect(this._analyser);
            this._analyser.connect(this._audioContext.destination);
        } catch(e) { console.warn('Web Audio unavailable', e); }

        this._audioElement.addEventListener('timeupdate', () => this._onTimeUpdate());
        this._audioElement.addEventListener('loadedmetadata', () => this._onMetaLoaded());
        this._audioElement.addEventListener('ended', () => this._onEnded());
        this._audioElement.addEventListener('play', () => this._onPlay());
        this._audioElement.addEventListener('pause', () => this._onPause());
        this._audioElement.addEventListener('error', () => this._setStatus('ERROR LOADING TRACK'));
    }

    _buildEQ() { /* nodes already built in _initAudio */ }

    _applyEQPreset(presetKey) {
        this._currentEqPreset = presetKey;
        const preset = this._eqPresets[presetKey];
        if (!preset) return;
        preset.bands.forEach((gain, i) => {
            if (this._eqNodes[i]) this._eqNodes[i].gain.value = gain;
        });
        this._renderEQBands();
        this._updateEQChips();
        const badge = this._shadow.getElementById('eqBadge');
        if (badge) badge.textContent = preset.name.toUpperCase();
        this._setStatus(`EQ: ${preset.name}`);
    }

    // ─── EVENT LISTENERS ───────────────────────────────────────────────────────
    _setupEventListeners() {
        const s = (id) => this._shadow.getElementById(id);

        // Library open/close
        s('libBtn').addEventListener('click', () => this._toggleLibrary(true));
        s('libCloseBtn').addEventListener('click', () => this._toggleLibrary(false));

        // EQ panel toggle
        s('eqBtn').addEventListener('click', () => {
            const panel = s('eqPanel');
            const btn = s('eqBtn');
            const open = panel.classList.toggle('open');
            btn.classList.toggle('active', open);
        });

        // Transport
        s('playBtn').addEventListener('click', () => this._togglePlay());
        s('prevBtn').addEventListener('click', () => this._playPrev());
        s('nextBtn').addEventListener('click', () => this._playNext());

        // Shuffle
        s('shuffleBtn').addEventListener('click', () => {
            this._isShuffled = !this._isShuffled;
            s('shuffleBtn').classList.toggle('active', this._isShuffled);
            this._setStatus(this._isShuffled ? 'SHUFFLE ON' : 'SHUFFLE OFF');
        });

        // Repeat (cycle: none → all → one)
        s('repeatBtn').addEventListener('click', () => {
            const modes = ['none', 'all', 'one'];
            const idx = modes.indexOf(this._repeatMode);
            this._repeatMode = modes[(idx + 1) % modes.length];
            const btn = s('repeatBtn');
            btn.classList.toggle('active', this._repeatMode !== 'none');
            if (this._repeatMode === 'one') {
                btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`;
            } else {
                btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
            }
            this._setStatus(`REPEAT: ${this._repeatMode.toUpperCase()}`);
        });

        // Volume
        const volSlider = s('volSlider');
        volSlider.addEventListener('input', (e) => {
            this._currentVolume = parseFloat(e.target.value);
            if (this._gainNode) this._gainNode.gain.value = this._currentVolume;
            else if (this._audioElement) this._audioElement.volume = this._currentVolume;
            this._updateVolIcon();
        });

        // Mute
        s('muteBtn').addEventListener('click', () => {
            if (this._currentVolume > 0) {
                this._lastVolume = this._currentVolume;
                this._currentVolume = 0;
            } else {
                this._currentVolume = this._lastVolume || 0.8;
            }
            volSlider.value = this._currentVolume;
            if (this._gainNode) this._gainNode.gain.value = this._currentVolume;
            else if (this._audioElement) this._audioElement.volume = this._currentVolume;
            this._updateVolIcon();
        });

        // Scrub
        const scrub = s('scrubTrack');
        scrub.addEventListener('click', (e) => {
            if (!this._audioElement?.duration) return;
            const r = scrub.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            this._audioElement.currentTime = pct * this._audioElement.duration;
        });
        scrub.addEventListener('mousedown', (e) => {
            this._isSeeking = true;
            const move = (ev) => {
                const r = scrub.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
                this._setScrubUI(pct);
            };
            const up = (ev) => {
                const r = scrub.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
                if (this._audioElement?.duration) {
                    this._audioElement.currentTime = pct * this._audioElement.duration;
                }
                this._isSeeking = false;
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });

        // Library tabs
        this._shadow.querySelectorAll('.lib-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this._libraryView = tab.dataset.tab;
                this._selectedAlbum = null;
                this._shadow.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._shadow.getElementById('libBack').style.display = 'none';
                this._renderLibrary();
            });
        });

        // Library search
        this._shadow.getElementById('libSearch').addEventListener('input', (e) => {
            this._searchQuery = e.target.value.toLowerCase();
            this._renderLibrary();
        });

        // Library back
        s('libBack').addEventListener('click', () => {
            this._selectedAlbum = null;
            s('libBack').style.display = 'none';
            this._renderLibrary();
        });
    }

    // ─── AUDIO EVENTS ──────────────────────────────────────────────────────────
    _onPlay() {
        this._isPlaying = true;
        const pi = this._shadow.getElementById('playIcon');
        const pa = this._shadow.getElementById('pauseIcon');
        if (pi) pi.style.display = 'none';
        if (pa) pa.style.display = 'block';
        const ind = this._shadow.getElementById('playIndicator');
        if (ind) ind.classList.add('active');
        const thumb = this._shadow.getElementById('artThumb');
        if (thumb) thumb.classList.add('playing');
        if (this._audioContext?.state === 'suspended') this._audioContext.resume();
        this._startVis();
    }
    _onPause() {
        this._isPlaying = false;
        const pi = this._shadow.getElementById('playIcon');
        const pa = this._shadow.getElementById('pauseIcon');
        if (pi) pi.style.display = 'block';
        if (pa) pa.style.display = 'none';
        const ind = this._shadow.getElementById('playIndicator');
        if (ind) ind.classList.remove('active');
        const thumb = this._shadow.getElementById('artThumb');
        if (thumb) thumb.classList.remove('playing');
        this._stopVis();
        this._startIdleVis();
    }
    _onTimeUpdate() {
        if (!this._audioElement || this._isSeeking) return;
        const cur = this._audioElement.currentTime;
        const dur = this._audioElement.duration;
        if (isNaN(dur)) return;
        const pct = cur / dur;
        this._setScrubUI(pct);
        this._shadow.getElementById('timeCurrent').textContent = this._fmt(cur);
    }
    _onMetaLoaded() {
        const dur = this._audioElement?.duration;
        if (!isNaN(dur)) this._shadow.getElementById('timeTotal').textContent = this._fmt(dur);
    }
    _onEnded() {
        if (this._repeatMode === 'one') {
            this._audioElement.currentTime = 0;
            this._audioElement.play();
        } else {
            this._playNext();
        }
    }

    // ─── PLAYBACK ──────────────────────────────────────────────────────────────
    _loadSong(index, playlist, autoPlay = true) {
        if (!playlist?.[index]) return;
        this._currentPlaylist = playlist;
        this._currentSongIndex = index;
        const song = playlist[index];

        if (this._audioElement) {
            this._audioElement.pause();
            if (song.audioFile) {
                this._audioElement.src = song.audioFile;
                this._audioElement.load();
                if (autoPlay) {
                    const playAttempt = this._audioElement.play();
                    if (playAttempt) playAttempt.catch(() => {});
                }
            }
        }
        this._updateNowPlaying(song);
        this._renderLibrary(); // update active highlights
        this._setStatus(`${song.artist} — ${song.title}`);
    }

    _togglePlay() {
        if (!this._audioElement) return;
        if (this._currentSongIndex === -1 && this._allSongs.length) {
            this._loadSong(0, this._allSongs, true);
            return;
        }
        if (this._audioElement.paused) {
            if (this._audioContext?.state === 'suspended') this._audioContext.resume();
            this._audioElement.play().catch(() => {});
        } else {
            this._audioElement.pause();
        }
    }

    _playNext() {
        if (!this._currentPlaylist?.length) return;
        let idx;
        if (this._isShuffled) {
            idx = Math.floor(Math.random() * this._currentPlaylist.length);
        } else {
            idx = (this._currentSongIndex + 1) % this._currentPlaylist.length;
        }
        this._loadSong(idx, this._currentPlaylist, this._isPlaying);
    }

    _playPrev() {
        if (!this._currentPlaylist?.length) return;
        if (this._audioElement && this._audioElement.currentTime > 3) {
            this._audioElement.currentTime = 0;
            return;
        }
        let idx;
        if (this._isShuffled) {
            idx = Math.floor(Math.random() * this._currentPlaylist.length);
        } else {
            idx = (this._currentSongIndex - 1 + this._currentPlaylist.length) % this._currentPlaylist.length;
        }
        this._loadSong(idx, this._currentPlaylist, this._isPlaying);
    }

    // ─── UI UPDATE ─────────────────────────────────────────────────────────────
    _updateNowPlaying(song) {
        const set = (id, val) => { const el = this._shadow.getElementById(id); if (el) el.textContent = val; };
        set('artTitle', song.title || 'Unknown');
        set('artArtist', song.artist || '—');
        set('artAlbum', song.album || '');

        const badge = this._shadow.getElementById('genreBadge');
        if (badge) { badge.textContent = song.genre || ''; badge.style.display = song.genre ? '' : 'none'; }

        // Art
        const img = this._shadow.getElementById('artThumb');
        const bg  = this._shadow.getElementById('artBg');
        const ph  = this._shadow.getElementById('artPlaceholder');
        if (song.coverImage) {
            // Replace or create img element inside thumb
            let imgEl = img.querySelector('img');
            if (!imgEl) {
                imgEl = document.createElement('img');
                img.insertBefore(imgEl, img.firstChild);
            }
            imgEl.src = song.coverImage;
            if (ph) ph.style.display = 'none';
            if (bg) bg.style.backgroundImage = `url('${song.coverImage}')`;
        } else {
            const imgEl = img.querySelector('img');
            if (imgEl) imgEl.remove();
            if (ph) ph.style.display = '';
            if (bg) bg.style.backgroundImage = '';
        }

        // Links
        const linksEl = this._shadow.getElementById('artLinks');
        if (linksEl) {
            const links = [];
            const sl = song.streamingLinks || {};
            if (sl.spotify)    links.push(['SPT', sl.spotify]);
            if (sl.apple)      links.push(['APL', sl.apple]);
            if (sl.youtube)    links.push(['YT',  sl.youtube]);
            if (sl.soundcloud) links.push(['SC',  sl.soundcloud]);
            if (song.purchaseLink) links.push(['BUY', song.purchaseLink]);
            linksEl.innerHTML = links.map(([label, url]) =>
                `<a href="${url}" target="_blank" class="art-link">${label}</a>`
            ).join('');
        }

        // Reset time
        set('timeCurrent', '0:00');
        set('timeTotal', '0:00');
        this._setScrubUI(0);
    }

    _setScrubUI(pct) {
        const fill = this._shadow.getElementById('scrubFill');
        const head = this._shadow.getElementById('scrubHead');
        if (fill) fill.style.width = `${pct * 100}%`;
        if (head) head.style.left  = `${pct * 100}%`;
    }

    _updateVolIcon() {
        const vi = this._shadow.getElementById('volIcon');
        const mi = this._shadow.getElementById('muteIcon');
        if (vi) vi.style.display = this._currentVolume === 0 ? 'none' : 'block';
        if (mi) mi.style.display = this._currentVolume === 0 ? 'block' : 'none';
    }

    _setStatus(text) {
        const el = this._shadow.getElementById('statusText');
        if (el) el.textContent = text.toUpperCase();
    }

    // ─── LIBRARY ───────────────────────────────────────────────────────────────
    _toggleLibrary(open) {
        this._libraryOpen = open;
        const overlay = this._shadow.getElementById('libraryOverlay');
        const btn = this._shadow.getElementById('libBtn');
        if (overlay) overlay.classList.toggle('open', open);
        if (btn) btn.classList.toggle('active', open);
        if (open) this._renderLibrary();
    }

    _processAlbums() {
        const map = new Map();
        this._allSongs.forEach(song => {
            const key = song.album || 'Unknown Album';
            if (!map.has(key)) map.set(key, { name: key, artist: song.artist || '—', coverImage: song.coverImage, songs: [] });
            map.get(key).songs.push(song);
        });
        this._albums = Array.from(map.values());
    }

    _renderLibrary() {
        const content = this._shadow.getElementById('libContent');
        if (!content) return;

        if (this._libraryView === 'songs' || this._selectedAlbum) {
            const songs = this._selectedAlbum ? this._selectedAlbum.songs : this._allSongs;
            const filtered = this._searchQuery
                ? songs.filter(s =>
                    s.title?.toLowerCase().includes(this._searchQuery) ||
                    s.artist?.toLowerCase().includes(this._searchQuery) ||
                    s.album?.toLowerCase().includes(this._searchQuery))
                : songs;

            if (!filtered.length) { content.innerHTML = this._emptyState(); return; }

            content.innerHTML = filtered.map((song, i) => {
                const globalIdx = this._currentPlaylist?.indexOf(song);
                const isActive = globalIdx === this._currentSongIndex && this._currentSongIndex !== -1;
                return `
                <div class="song-row${isActive ? ' active' : ''}" data-index="${i}">
                    <span class="song-num">${isActive ? '' : (i + 1)}</span>
                    <div class="playing-bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
                    <div class="song-thumb">${song.coverImage ? `<img src="${song.coverImage}" alt="">` : ''}</div>
                    <div class="song-meta">
                        <div class="song-name">${this._esc(song.title || 'Unknown')}</div>
                        <div class="song-sub">${this._esc(song.artist || '—')}${song.album ? ' · ' + this._esc(song.album) : ''}</div>
                    </div>
                    <span class="song-dur">${song.duration || ''}</span>
                </div>`;
            }).join('');

            content.querySelectorAll('.song-row').forEach(row => {
                row.addEventListener('click', () => {
                    const idx = parseInt(row.dataset.index);
                    this._loadSong(idx, filtered, true);
                    this._toggleLibrary(false);
                });
            });
        } else {
            // Albums view
            const filtered = this._searchQuery
                ? this._albums.filter(a =>
                    a.name.toLowerCase().includes(this._searchQuery) ||
                    a.artist.toLowerCase().includes(this._searchQuery))
                : this._albums;

            if (!filtered.length) { content.innerHTML = this._emptyState(); return; }

            content.innerHTML = `<div class="album-grid">` + filtered.map(album => `
                <div class="album-card" data-album="${this._esc(album.name)}">
                    <div class="album-art">
                        ${album.coverImage
                            ? `<img src="${album.coverImage}" alt="">`
                            : `<div class="album-art-placeholder"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>`
                        }
                    </div>
                    <div class="album-info">
                        <div class="album-name">${this._esc(album.name)}</div>
                        <div class="album-artist-name">${this._esc(album.artist)}</div>
                        <div class="album-count">${album.songs.length} TRK</div>
                    </div>
                </div>
            `).join('') + `</div>`;

            content.querySelectorAll('.album-card').forEach(card => {
                card.addEventListener('click', () => {
                    const name = card.dataset.album;
                    this._selectedAlbum = this._albums.find(a => a.name === name);
                    this._shadow.getElementById('libBack').style.display = '';
                    this._renderLibrary();
                });
            });
        }
    }

    // ─── EQ RENDERING ─────────────────────────────────────────────────────────
    _renderEQChips() {
        const container = this._shadow.getElementById('eqChips');
        if (!container) return;
        container.innerHTML = Object.entries(this._eqPresets).map(([key, preset]) =>
            `<button class="eq-chip${key === this._currentEqPreset ? ' active' : ''}" data-preset="${key}">${preset.name}</button>`
        ).join('');
        container.querySelectorAll('.eq-chip').forEach(chip => {
            chip.addEventListener('click', () => this._applyEQPreset(chip.dataset.preset));
        });
    }

    _updateEQChips() {
        this._shadow.querySelectorAll('.eq-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.preset === this._currentEqPreset);
        });
    }

    _renderEQBands() {
        const container = this._shadow.getElementById('eqBands');
        if (!container) return;
        const freqLabels = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
        container.innerHTML = this._eqFrequencies.map((freq, i) => {
            const val = this._eqNodes[i]?.gain?.value ?? 0;
            return `
            <div class="eq-band" data-band="${i}">
                <div class="eq-band-val" id="eqVal${i}">${val >= 0 ? '+' : ''}${Math.round(val)}</div>
                <div class="eq-fader-wrap">
                    <input type="range" class="eq-fader" data-band="${i}"
                        min="-12" max="12" step="0.5" value="${val}">
                </div>
                <div class="eq-band-freq">${freqLabels[i]}</div>
            </div>`;
        }).join('');

        container.querySelectorAll('.eq-fader').forEach(fader => {
            fader.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.band);
                const val = parseFloat(e.target.value);
                if (this._eqNodes[idx]) this._eqNodes[idx].gain.value = val;
                const valEl = this._shadow.getElementById(`eqVal${idx}`);
                if (valEl) valEl.textContent = `${val >= 0 ? '+' : ''}${Math.round(val)}`;
                // Switch preset to custom-like
                this._currentEqPreset = '__custom__';
                this._updateEQChips();
                const badge = this._shadow.getElementById('eqBadge');
                if (badge) badge.textContent = 'CUSTOM';
            });
        });
    }

    // ─── VISUALIZER ───────────────────────────────────────────────────────────
    _startVis() {
        this._stopVis();
        const canvas = this._shadow.getElementById('visCanvas');
        if (!canvas || !this._analyser) return;
        canvas.width  = canvas.offsetWidth  || 300;
        canvas.height = canvas.offsetHeight || 24;
        const ctx = canvas.getContext('2d');
        const draw = () => {
            if (!this._isPlaying) return;
            this._animationId = requestAnimationFrame(draw);
            this._analyser.getByteFrequencyData(this._dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const bars = 48;
            const bw = canvas.width / bars;
            const accent = this._getAccentColor();
            for (let i = 0; i < bars; i++) {
                const v = this._dataArray[Math.floor(i * this._dataArray.length / bars)] / 255;
                const h = v * canvas.height;
                const alpha = 0.5 + v * 0.5;
                ctx.fillStyle = accent;
                ctx.globalAlpha = alpha;
                ctx.fillRect(i * bw + 1, canvas.height - h, bw - 2, h);
            }
            ctx.globalAlpha = 1;
        };
        draw();
    }

    _startIdleVis() {
        const canvas = this._shadow.getElementById('visCanvas');
        if (!canvas) return;
        canvas.width  = canvas.offsetWidth  || 300;
        canvas.height = canvas.offsetHeight || 24;
        const ctx = canvas.getContext('2d');
        const bars = 48;
        const bw = canvas.width / bars;
        const heights = Array.from({ length: bars }, () => Math.random() * 0.15);
        const speeds  = Array.from({ length: bars }, () => (Math.random() - 0.5) * 0.01);
        const accent = this._getAccentColor();
        const draw = () => {
            if (this._isPlaying || !this._idleVis) return;
            this._idleAnimId = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < bars; i++) {
                heights[i] = Math.max(0.02, Math.min(0.2, heights[i] + speeds[i]));
                if (heights[i] >= 0.2 || heights[i] <= 0.02) speeds[i] *= -1;
                const h = heights[i] * canvas.height;
                ctx.fillStyle = accent;
                ctx.globalAlpha = 0.2;
                ctx.fillRect(i * bw + 1, canvas.height - h, bw - 2, h);
            }
            ctx.globalAlpha = 1;
        };
        this._idleVis = true;
        draw();
    }

    _stopVis() {
        if (this._animationId) { cancelAnimationFrame(this._animationId); this._animationId = null; }
        this._idleVis = false;
        if (this._idleAnimId) { cancelAnimationFrame(this._idleAnimId); this._idleAnimId = null; }
        const canvas = this._shadow.getElementById('visCanvas');
        if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }

    _getAccentColor() {
        return getComputedStyle(this).getPropertyValue('--c-accent').trim() || '#ff6b00';
    }

    // ─── COLOR THEMING ─────────────────────────────────────────────────────────
    _applyColors() {
        const map = {
            'primary-color':    '--c-accent',
            'secondary-color':  '--c-accent2',
            'background-color': '--c-bg',
            'surface-color':    '--c-surface',
            'text-primary':     '--c-text1',
            'text-secondary':   '--c-text2',
            'accent-color':     '--c-accent',
        };
        const container = this._shadow.querySelector('.shell');
        for (const [attr, cssVar] of Object.entries(map)) {
            const val = this.getAttribute(attr);
            if (val) {
                this.style.setProperty(cssVar, val);
                if (container) container.style.setProperty(cssVar, val);
            }
        }
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────
    _fmt(s) {
        if (isNaN(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }
    _esc(text) {
        const d = document.createElement('div'); d.textContent = text; return d.innerHTML;
    }
    _emptyState() {
        return `<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg><p>Nothing here</p></div>`;
    }
    _cleanup() {
        this._stopVis();
        if (this._audioElement) this._audioElement.pause();
        if (this._audioContext) this._audioContext.close();
    }
}

customElements.define('advanced-music-player', AdvancedMusicPlayer);
