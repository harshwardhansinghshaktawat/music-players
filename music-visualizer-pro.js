class MusicVisualizerPro extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        
        // Canvas references
        this._bgCanvas = null;
        this._mainCanvas = null;
        this._bgCtx = null;
        this._mainCtx = null;
        this._off1Canvas = null;
        this._off1Ctx = null;
        this._off2Canvas = null;
        this._off2Ctx = null;
        
        // Dimensions (hardcoded settings from original)
        this._width = 0;
        this._height = 0;
        this._cx = 0;
        this._cy = 0;
        this._baseRadius = 0;
        this._maxHeight = 0;
        this._centerRadius = 0;
        
        // Audio
        this._audioContext = null;
        this._vizAnalyser = null;
        this._beatAnalyser = null;
        this._audioElement = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._isShuffled = false;
        this._isRepeat = false;
        
        // Data
        this._allSongs = [];
        this._currentPlaylist = [];
        this._currentSongIndex = -1;
        this._selectedAlbum = null;
        this._currentView = 'albums';
        this._searchQuery = '';
        
        // Visualizer state
        this._vizData = null;
        this._beatData = null;
        this._bufLen = 0;
        this._beatBufLen = 0;
        this._live = false;
        
        // Beat detection
        this._kickTimestamps = [];
        this._detectedBPM = 0;
        this._playbackStart = 0;
        this._songDuration = 0;
        this._nextKickIdx = 0;
        this._kickStrength = 0;
        this._bgPulse = 0;
        this._kickEnv = 0;
        this._bgEnv = 0;
        this._micMode = false;
        
        // Real-time beat detection
        this._rtHistory = new Float32Array(60);
        this._rtIdx = 0;
        this._rtFilled = false;
        this._rtWarmup = 0;
        this._rtCooldown = 0;
        
        // Ring
        this._ringBuf = new Float32Array(256);
        this._ringSmooth = new Float32Array(256);
        
        // Particles
        this._particles = [];
        this._particleCount = 420; // Only controllable setting
        
        // Animation
        this._animationId = null;
        this._kenBurnsX = 0;
        this._kenBurnsY = 0;
        this._kenBurnsScale = 1.04;
        this._kenBurnsTX = 8;
        this._kenBurnsTY = -6;
        this._kenBurnsTS = 1.06;
        this._kenBurnsTick = 0;
        
        // Images
        this._bgImage = null;
        this._bgReady = false;
        this._coverImage = null;
        this._coverReady = false;
        this._bgSource = 'random'; // Only controllable setting
        
        // Color scheme (only controllable setting)
        this._colorScheme = {
            c1: '#00ffff',
            c2: '#9b59b6',
            c3: '#ffffff',
            glow: '#00ffff',
            bgTint: '#001122'
        };
        
        this._createDOM();
    }
    
    static get observedAttributes() {
        return ['player-data', 'bg-source', 'particle-count', 'color-scheme'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) return;
        
        if (name === 'player-data' && newValue) {
            try {
                this._playerData = JSON.parse(newValue);
                this._allSongs = this._playerData.songs || [];
                this._processAlbums();
                this._renderBrowser();
            } catch (e) {
                console.error('Error parsing player data:', e);
            }
        } else if (name === 'bg-source') {
            this._bgSource = newValue || 'random';
            this._loadBackgroundImage();
        } else if (name === 'particle-count') {
            this._particleCount = parseInt(newValue) || 420;
            this._initParticles();
        } else if (name === 'color-scheme' && newValue) {
            this._applyColorScheme(newValue);
        }
    }
    
    connectedCallback() {
        this._setupCanvases();
        this._initAudio();
        this._initParticles();
        this._loadBackgroundImage();
        this._setupEventListeners();
        this._startAnimation();
        
        if (this._playerData) {
            this._renderBrowser();
        }
        
        const resizeObserver = new ResizeObserver(() => {
            this._updateDimensions();
        });
        resizeObserver.observe(this);
    }
    
    disconnectedCallback() {
        this._cleanup();
    }
    
    _createDOM() {
        this._shadow.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    position: relative;
                    overflow: hidden;
                }
                
                *, *::before, *::after {
                    box-sizing: inherit;
                }
                
                .visualizer-container {
                    width: 100%;
                    height: 100%;
                    background: #000;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .canvas-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                #bgCanvas {
                    z-index: 1;
                }
                
                #mainCanvas {
                    z-index: 2;
                }
                
                .ui-layer {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    pointer-events: none;
                }
                
                .top-bar {
                    padding: 1rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    pointer-events: auto;
                }
                
                .song-info {
                    color: rgba(255, 255, 255, 0.9);
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
                }
                
                .song-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    font-family: 'Inter', sans-serif;
                    margin-bottom: 0.25rem;
                    letter-spacing: 0.5px;
                }
                
                .song-artist {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                }
                
                .bpm-badge {
                    padding: 0.5rem 1rem;
                    background: rgba(0, 0, 0, 0.6);
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    border-radius: 6px;
                    color: rgba(0, 255, 255, 0.45);
                    font-size: 0.75rem;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    backdrop-filter: blur(10px);
                    font-family: 'Courier New', monospace;
                    opacity: 0;
                    transition: opacity 1s;
                }
                
                .bpm-badge.visible {
                    opacity: 1;
                }
                
                .browser-section {
                    flex: 1;
                    display: flex;
                    min-height: 0;
                    pointer-events: auto;
                }
                
                .browser-sidebar {
                    width: 300px;
                    background: rgba(0, 0, 0, 0.85);
                    border-right: 1px solid rgba(0, 255, 255, 0.3);
                    backdrop-filter: blur(20px);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .browser-header {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                }
                
                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 0.25rem;
                    border-radius: 6px;
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    margin-bottom: 1rem;
                }
                
                .view-toggle-btn {
                    flex: 1;
                    padding: 0.5rem;
                    background: transparent;
                    border: none;
                    border-radius: 4px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .view-toggle-btn.active {
                    background: #00ffff;
                    color: #000;
                }
                
                .browser-search {
                    position: relative;
                }
                
                .browser-search input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    border-radius: 6px;
                    color: white;
                    font-size: 0.875rem;
                    font-family: 'Inter', sans-serif;
                }
                
                .browser-search input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .browser-search input:focus {
                    outline: none;
                    border-color: #00ffff;
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .browser-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }
                
                .browser-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .browser-content::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .browser-content::-webkit-scrollbar-thumb {
                    background: rgba(0, 255, 255, 0.3);
                    border-radius: 3px;
                }
                
                .albums-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 0.75rem;
                }
                
                .album-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(0, 255, 255, 0.3);
                    border-radius: 8px;
                    padding: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .album-card:hover {
                    border-color: #00ffff;
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }
                
                .album-card.active {
                    border-color: #00ffff;
                    background: rgba(0, 255, 255, 0.15);
                }
                
                .album-cover {
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    margin-bottom: 0.5rem;
                    overflow: hidden;
                }
                
                .album-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .album-info {
                    color: white;
                }
                
                .album-name {
                    font-weight: 600;
                    font-size: 0.8125rem;
                    margin-bottom: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .album-artist {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .songs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .song-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .song-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #00ffff;
                }
                
                .song-item.active {
                    background: rgba(0, 255, 255, 0.15);
                    border-color: #00ffff;
                }
                
                .song-cover {
                    width: 2.75rem;
                    height: 2.75rem;
                    border-radius: 4px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .song-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .song-info-text {
                    flex: 1;
                    min-width: 0;
                    color: white;
                }
                
                .song-title-text {
                    font-weight: 500;
                    font-size: 0.875rem;
                    margin-bottom: 0.125rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .song-artist-text {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .back-btn {
                    width: 100%;
                    padding: 0.625rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    border-radius: 6px;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .back-btn:hover {
                    background: #00ffff;
                    color: #000;
                }
                
                .controls-footer {
                    background: rgba(0, 0, 0, 0.85);
                    border-top: 1px solid rgba(0, 255, 255, 0.3);
                    padding: 1rem 1.5rem;
                    backdrop-filter: blur(20px);
                    pointer-events: auto;
                }
                
                .progress-section {
                    margin-bottom: 1rem;
                }
                
                .progress-bar-container {
                    position: relative;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background: linear-gradient(90deg, #00ffff, #9b59b6);
                    border-radius: 3px;
                    transition: width 0.1s linear;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-variant-numeric: tabular-nums;
                }
                
                .controls-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1.5rem;
                }
                
                .controls-left,
                .controls-right {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .controls-center {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .control-btn {
                    width: 2.25rem;
                    height: 2.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(0, 255, 255, 0.3);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-radius: 6px;
                }
                
                .control-btn:hover {
                    background: #00ffff;
                    border-color: #00ffff;
                    color: #000;
                }
                
                .control-btn.active {
                    background: #00ffff;
                    border-color: #00ffff;
                    color: #000;
                }
                
                .control-btn svg {
                    width: 1.125rem;
                    height: 1.125rem;
                    fill: currentColor;
                }
                
                .play-btn {
                    width: 3rem;
                    height: 3rem;
                    background: #00ffff;
                    border-color: #00ffff;
                    color: #000;
                }
                
                .play-btn:hover {
                    transform: scale(1.05);
                }
                
                .play-btn svg {
                    width: 1.375rem;
                    height: 1.375rem;
                }
                
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    min-width: 120px;
                }
                
                .volume-slider {
                    flex: 1;
                    -webkit-appearance: none;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #00ffff;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 2rem 1.5rem;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                @media (max-width: 768px) {
                    .browser-sidebar {
                        width: 100%;
                        height: 250px;
                        border-right: none;
                        border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                    }
                    
                    .browser-section {
                        flex-direction: column;
                    }
                }
            </style>
            
            <div class="visualizer-container">
                <canvas id="bgCanvas" class="canvas-layer"></canvas>
                <canvas id="mainCanvas" class="canvas-layer"></canvas>
                
                <div class="ui-layer">
                    <div class="top-bar">
                        <div class="song-info">
                            <div class="song-title">No Song Playing</div>
                            <div class="song-artist">Select a song to begin</div>
                        </div>
                        <div class="bpm-badge"></div>
                    </div>
                    
                    <div class="browser-section">
                        <div class="browser-sidebar">
                            <div class="browser-header">
                                <div class="view-toggle">
                                    <button class="view-toggle-btn active" data-view="albums">Albums</button>
                                    <button class="view-toggle-btn" data-view="songs">All Songs</button>
                                </div>
                                <div class="browser-search">
                                    <input type="text" placeholder="Search music..." class="search-input">
                                </div>
                            </div>
                            <div class="browser-content"></div>
                        </div>
                    </div>
                    
                    <div class="controls-footer">
                        <div class="progress-section">
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill"></div>
                            </div>
                            <div class="time-display">
                                <span class="current-time">0:00</span>
                                <span class="total-time">0:00</span>
                            </div>
                        </div>
                        
                        <div class="controls-main">
                            <div class="controls-left">
                                <button class="control-btn shuffle-btn" title="Shuffle">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                                    </svg>
                                </button>
                                <button class="control-btn repeat-btn" title="Repeat">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="controls-center">
                                <button class="control-btn prev-btn" title="Previous">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                    </svg>
                                </button>
                                <button class="control-btn play-btn" title="Play">
                                    <svg class="play-icon" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <svg class="pause-icon" viewBox="0 0 24 24" style="display: none;">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                    </svg>
                                </button>
                                <button class="control-btn next-btn" title="Next">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="controls-right">
                                <div class="volume-control">
                                    <button class="control-btn volume-btn" title="Mute">
                                        <svg class="volume-icon" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                        </svg>
                                    </button>
                                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.8">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

_setupCanvases() {
        this._bgCanvas = this._shadow.getElementById('bgCanvas');
        this._mainCanvas = this._shadow.getElementById('mainCanvas');
        this._bgCtx = this._bgCanvas.getContext('2d');
        this._mainCtx = this._mainCanvas.getContext('2d');
        
        this._off1Canvas = document.createElement('canvas');
        this._off1Ctx = this._off1Canvas.getContext('2d');
        this._off2Canvas = document.createElement('canvas');
        this._off2Ctx = this._off2Canvas.getContext('2d');
        
        this._updateDimensions();
    }
    
    _updateDimensions() {
        const rect = this.getBoundingClientRect();
        this._width = rect.width;
        this._height = rect.height;
        this._cx = this._width / 2;
        this._cy = this._height / 2;
        
        // Hardcoded from original values
        this._baseRadius = Math.min(this._width, this._height) * 0.240;
        this._maxHeight = Math.min(this._width, this._height) * 0.100;
        this._centerRadius = this._baseRadius * 0.79;
        
        if (this._bgCanvas) {
            this._bgCanvas.width = this._width;
            this._bgCanvas.height = this._height;
        }
        
        if (this._mainCanvas) {
            this._mainCanvas.width = this._width;
            this._mainCanvas.height = this._height;
        }
        
        if (this._off1Canvas) {
            this._off1Canvas.width = this._width;
            this._off1Canvas.height = this._height;
        }
        
        if (this._off2Canvas) {
            this._off2Canvas.width = this._width;
            this._off2Canvas.height = this._height;
        }
    }
    
    _applyColorScheme(schemeName) {
        const schemes = this._getColorSchemes();
        const scheme = schemes[schemeName];
        if (!scheme) return;
        
        this._colorScheme = scheme;
    }
    
    _getColorSchemes() {
        return {
            cyan: {c1:'#00ffff', c2:'#9b59b6', c3:'#ffffff', glow:'#00ffff', bgTint:'#001122'},
            fire: {c1:'#ff6500', c2:'#ffd700', c3:'#ffeecc', glow:'#ff3000', bgTint:'#1a0800'},
            neon: {c1:'#39ff14', c2:'#00eecc', c3:'#ccffee', glow:'#39ff14', bgTint:'#001a10'},
            synthwave: {c1:'#ff00ff', c2:'#7b2fff', c3:'#ffaaff', glow:'#dd00ff', bgTint:'#180028'},
            gold: {c1:'#ffd700', c2:'#fff8dc', c3:'#ffffff', glow:'#ffaa00', bgTint:'#1a1200'},
            electricBlue: {c1:'#0080ff', c2:'#00d4ff', c3:'#e0f7ff', glow:'#0080ff', bgTint:'#001a33'},
            lavaRed: {c1:'#ff1744', c2:'#ff6e40', c3:'#ffe0e0', glow:'#ff1744', bgTint:'#330000'},
            acidGreen: {c1:'#76ff03', c2:'#b2ff59', c3:'#f1ffe0', glow:'#76ff03', bgTint:'#0d1a00'},
            deepOcean: {c1:'#006db3', c2:'#0099cc', c3:'#ccf2ff', glow:'#0099cc', bgTint:'#001a26'},
            sunset: {c1:'#ff5722', c2:'#ff9800', c3:'#fff3e0', glow:'#ff5722', bgTint:'#1a0d00'},
            arctic: {c1:'#00e5ff', c2:'#80deea', c3:'#e0f7fa', glow:'#00e5ff', bgTint:'#001a1f'},
            plasma: {c1:'#e91e63', c2:'#ff4081', c3:'#fce4ec', glow:'#e91e63', bgTint:'#1a0011'},
            toxic: {c1:'#c6ff00', c2:'#f4ff81', c3:'#f9ffe0', glow:'#c6ff00', bgTint:'#1a2600'},
            royal: {c1:'#651fff', c2:'#b388ff', c3:'#ede7f6', glow:'#651fff', bgTint:'#0d001a'},
            ember: {c1:'#ff6f00', c2:'#ffab40', c3:'#fff3e0', glow:'#ff6f00', bgTint:'#1a0f00'},
            cyber: {c1:'#00ffff', c2:'#ff00ff', c3:'#ffffff', glow:'#00ffff', bgTint:'#0d0d1a'},
            matrix: {c1:'#00ff41', c2:'#39ff14', c3:'#e0ffe0', glow:'#00ff41', bgTint:'#001a08'},
            vaporwave: {c1:'#ff71ce', c2:'#01cdfe', c3:'#f0f8ff', glow:'#ff71ce', bgTint:'#1a0015'},
            midnight: {c1:'#3d5afe', c2:'#7c4dff', c3:'#e8eaf6', glow:'#3d5afe', bgTint:'#00001a'},
            inferno: {c1:'#ff3d00', c2:'#ff6e40', c3:'#fbe9e7', glow:'#ff3d00', bgTint:'#1a0800'},
            arctic2: {c1:'#18ffff', c2:'#84ffff', c3:'#e0f7fa', glow:'#18ffff', bgTint:'#001a1f'},
            nebula: {c1:'#d500f9', c2:'#e040fb', c3:'#f3e5f5', glow:'#d500f9', bgTint:'#1a0021'},
            emerald: {c1:'#00e676', c2:'#69f0ae', c3:'#e8f5e9', glow:'#00e676', bgTint:'#001a0d'},
            crimson: {c1:'#f50057', c2:'#ff4081', c3:'#fce4ec', glow:'#f50057', bgTint:'#1a000b'},
            sapphire: {c1:'#2979ff', c2:'#448aff', c3:'#e3f2fd', glow:'#2979ff', bgTint:'#00102b'},
            voltage: {c1:'#ffea00', c2:'#ffff00', c3:'#fffde7', glow:'#ffea00', bgTint:'#1a1a00'},
            aurora: {c1:'#1de9b6', c2:'#64ffda', c3:'#e0f2f1', glow:'#1de9b6', bgTint:'#001a18'},
            galaxy: {c1:'#7c4dff', c2:'#b388ff', c3:'#ede7f6', glow:'#7c4dff', bgTint:'#0f001a'},
            phoenix: {c1:'#ff9100', c2:'#ffab40', c3:'#fff3e0', glow:'#ff9100', bgTint:'#1a1000'},
            glacial: {c1:'#00b8d4', c2:'#00e5ff', c3:'#e0f7fa', glow:'#00b8d4', bgTint:'#001822'},
            magma: {c1:'#dd2c00', c2:'#ff6e40', c3:'#fbe9e7', glow:'#dd2c00', bgTint:'#1a0600'},
            lime: {c1:'#aeea00', c2:'#c6ff00', c3:'#f9fbe7', glow:'#aeea00', bgTint:'#151a00'},
            orchid: {c1:'#aa00ff', c2:'#d500f9', c3:'#f3e5f5', glow:'#aa00ff', bgTint:'#15001a'},
            amber: {c1:'#ffc400', c2:'#ffd740', c3:'#fff8e1', glow:'#ffc400', bgTint:'#1a1500'},
            ocean: {c1:'#00acc1', c2:'#00e5ff', c3:'#e0f7fa', glow:'#00acc1', bgTint:'#001519'}
        };
    }

    _initAudio() {
        this._audioElement = document.createElement('audio');
        this._audioElement.crossOrigin = 'anonymous';
        
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this._vizAnalyser = this._audioContext.createAnalyser();
            this._vizAnalyser.fftSize = 4096;
            this._vizAnalyser.smoothingTimeConstant = 0.0;
            this._bufLen = this._vizAnalyser.frequencyBinCount;
            this._vizData = new Uint8Array(this._bufLen);
            
            this._beatAnalyser = this._audioContext.createAnalyser();
            this._beatAnalyser.fftSize = 2048;
            this._beatAnalyser.smoothingTimeConstant = 0.4;
            this._beatBufLen = this._beatAnalyser.frequencyBinCount;
            this._beatData = new Uint8Array(this._beatBufLen);
            
            const source = this._audioContext.createMediaElementSource(this._audioElement);
            source.connect(this._vizAnalyser);
            source.connect(this._beatAnalyser);
            this._beatAnalyser.connect(this._audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
        
        this._audioElement.addEventListener('timeupdate', () => this._updateProgress());
        this._audioElement.addEventListener('loadedmetadata', () => this._updateDuration());
        this._audioElement.addEventListener('ended', () => this._handleSongEnd());
        this._audioElement.addEventListener('play', () => {
            this._isPlaying = true;
            this._live = true;
            this._updatePlayButton();
            if (this._audioContext?.state === 'suspended') {
                this._audioContext.resume();
            }
        });
        this._audioElement.addEventListener('pause', () => {
            this._isPlaying = false;
            this._live = false;
            this._updatePlayButton();
        });
    }
    
    _initParticles() {
        this._particles = [];
        for (let i = 0; i < this._particleCount; i++) {
            this._particles.push(new Particle());
        }
    }
    
    _loadBackgroundImage() {
        if (this._bgSource === 'random') {
            this._bgImage = new Image();
            this._bgImage.crossOrigin = 'anonymous';
            this._bgImage.src = `https://picsum.photos/1920/1080?random=${Math.floor(Math.random() * 1000)}`;
            this._bgImage.onload = () => { this._bgReady = true; };
        } else if (this._bgSource === 'cover' && this._currentPlaylist.length > 0 && this._currentSongIndex >= 0) {
            const song = this._currentPlaylist[this._currentSongIndex];
            if (song && song.coverImage) {
                this._bgImage = new Image();
                this._bgImage.crossOrigin = 'anonymous';
                this._bgImage.src = song.coverImage;
                this._bgImage.onload = () => { this._bgReady = true; };
            }
        }
    }
    
    _processAlbums() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const albumsMap = new Map();
        
        this._playerData.songs.forEach(song => {
            const albumName = song.album || 'Unknown Album';
            
            if (!albumsMap.has(albumName)) {
                albumsMap.set(albumName, {
                    name: albumName,
                    artist: song.artist || 'Unknown Artist',
                    coverImage: song.coverImage,
                    genre: song.genre || '',
                    songs: []
                });
            }
            
            albumsMap.get(albumName).songs.push(song);
        });
        
        this._albums = Array.from(albumsMap.values());
    }
    
    _setupEventListeners() {
        this._shadow.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._currentView = btn.dataset.view;
                this._selectedAlbum = null;
                this._updateViewToggle();
                this._renderBrowser();
            });
        });
        
        const searchInput = this._shadow.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this._searchQuery = e.target.value.toLowerCase();
            this._renderBrowser();
        });
        
        this._shadow.querySelector('.play-btn').addEventListener('click', () => {
            if (!this._currentPlaylist.length || this._currentSongIndex === -1) {
                this._playFirstSong();
            } else if (this._audioElement) {
                if (this._audioElement.paused) {
                    this._audioElement.play();
                } else {
                    this._audioElement.pause();
                }
            }
        });
        
        this._shadow.querySelector('.prev-btn').addEventListener('click', () => this._playPrevious());
        this._shadow.querySelector('.next-btn').addEventListener('click', () => this._playNext());
        
        this._shadow.querySelector('.shuffle-btn').addEventListener('click', () => {
            this._isShuffled = !this._isShuffled;
            this._shadow.querySelector('.shuffle-btn').classList.toggle('active', this._isShuffled);
        });
        
        this._shadow.querySelector('.repeat-btn').addEventListener('click', () => {
            this._isRepeat = !this._isRepeat;
            this._shadow.querySelector('.repeat-btn').classList.toggle('active', this._isRepeat);
        });
        
        const volumeSlider = this._shadow.querySelector('.volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            this._currentVolume = parseFloat(e.target.value);
            if (this._audioElement) {
                this._audioElement.volume = this._currentVolume;
            }
        });
        
        this._shadow.querySelector('.volume-btn').addEventListener('click', () => {
            if (this._currentVolume > 0) {
                this._lastVolume = this._currentVolume;
                this._currentVolume = 0;
            } else {
                this._currentVolume = this._lastVolume || 0.8;
            }
            volumeSlider.value = this._currentVolume;
            if (this._audioElement) {
                this._audioElement.volume = this._currentVolume;
            }
        });
        
        const progressBar = this._shadow.querySelector('.progress-bar-container');
        progressBar.addEventListener('click', (e) => {
            if (!this._audioElement || !this._audioElement.duration) return;
            
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this._audioElement.currentTime = percent * this._audioElement.duration;
        });
    }
    
    _playFirstSong() {
        let playlist = [];
        
        if (this._selectedAlbum && this._selectedAlbum.songs) {
            playlist = this._selectedAlbum.songs;
        } else if (this._allSongs && this._allSongs.length > 0) {
            playlist = this._allSongs;
        }
        
        if (playlist.length > 0) {
            this._playSong(0, playlist);
        }
    }
    
    _playSong(index, playlist) {
        if (!playlist || !playlist[index]) return;
        
        this._currentPlaylist = playlist;
        this._currentSongIndex = index;
        const song = playlist[index];
        
        if (this._audioElement && song.audioFile) {
            this._audioElement.src = song.audioFile;
            this._audioElement.load();
            this._audioElement.play();
            
            this._playbackStart = this._audioContext ? this._audioContext.currentTime : 0;
            this._nextKickIdx = 0;
        }
        
        this._updateSongInfo();
        this._renderBrowser();
        
        if (song.coverImage) {
            this._coverImage = new Image();
            this._coverImage.crossOrigin = 'anonymous';
            this._coverImage.src = song.coverImage;
            this._coverImage.onload = () => { this._coverReady = true; };
        }
        
        if (this._bgSource === 'cover') {
            this._loadBackgroundImage();
        }
    }
    
    _updateSongInfo() {
        if (!this._currentPlaylist.length || this._currentSongIndex === -1) {
            this._shadow.querySelector('.song-title').textContent = 'No Song Playing';
            this._shadow.querySelector('.song-artist').textContent = 'Select a song to begin';
            return;
        }
        
        const song = this._currentPlaylist[this._currentSongIndex];
        this._shadow.querySelector('.song-title').textContent = song.title || 'Unknown Title';
        this._shadow.querySelector('.song-artist').textContent = song.artist || 'Unknown Artist';
    }
    
    _updateViewToggle() {
        this._shadow.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this._currentView);
        });
    }
    
    _renderBrowser() {
        const container = this._shadow.querySelector('.browser-content');
        
        if (this._currentView === 'albums') {
            this._renderAlbums(container);
        } else {
            this._renderAllSongs(container);
        }
    }
    
    _renderAlbums(container) {
        if (!this._albums || this._albums.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No albums found</p></div>';
            return;
        }
        
        let filteredAlbums = this._albums;
        if (this._searchQuery) {
            filteredAlbums = this._albums.filter(album => 
                album.name.toLowerCase().includes(this._searchQuery) ||
                album.artist.toLowerCase().includes(this._searchQuery)
            );
        }
        
        container.innerHTML = `
            <div class="albums-grid">
                ${filteredAlbums.map(album => `
                    <div class="album-card ${this._selectedAlbum?.name === album.name ? 'active' : ''}" data-album="${this._escapeHtml(album.name)}">
                        <div class="album-cover">
                            ${album.coverImage ? `<img src="${album.coverImage}" alt="${this._escapeHtml(album.name)}">` : ''}
                        </div>
                        <div class="album-info">
                            <div class="album-name">${this._escapeHtml(album.name)}</div>
                            <div class="album-artist">${this._escapeHtml(album.artist)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', () => {
                const albumName = card.dataset.album;
                this._selectedAlbum = this._albums.find(a => a.name === albumName);
                this._currentView = 'songs';
                this._updateViewToggle();
                this._renderBrowser();
            });
        });
    }
    
    _renderAllSongs(container) {
        let songs = [];
        
        if (this._selectedAlbum) {
            songs = this._selectedAlbum.songs;
        } else {
            songs = this._allSongs;
        }
        
        if (this._searchQuery) {
            songs = songs.filter(song =>
                song.title.toLowerCase().includes(this._searchQuery) ||
                song.artist.toLowerCase().includes(this._searchQuery)
            );
        }
        
        if (songs.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No songs found</p></div>';
            return;
        }
        
        const backButton = this._selectedAlbum ? '<button class="back-btn" id="back-to-albums">← Back to Albums</button>' : '';
        
        container.innerHTML = `
            ${backButton}
            <div class="songs-list">
                ${songs.map((song, index) => {
                    const actualIndex = this._currentPlaylist?.indexOf(song) ?? -1;
                    const isActive = this._currentPlaylist && actualIndex === this._currentSongIndex;
                    
                    return `
                        <div class="song-item ${isActive ? 'active' : ''}" data-index="${index}">
                            <div class="song-cover">
                                ${song.coverImage ? `<img src="${song.coverImage}" alt="${this._escapeHtml(song.title)}">` : ''}
                            </div>
                            <div class="song-info-text">
                                <div class="song-title-text">${this._escapeHtml(song.title)}</div>
                                <div class="song-artist-text">${this._escapeHtml(song.artist)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        const backBtn = container.querySelector('#back-to-albums');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this._selectedAlbum = null;
                this._currentView = 'albums';
                this._updateViewToggle();
                this._renderBrowser();
            });
        }
        
        container.querySelectorAll('.song-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this._playSong(index, songs);
            });
        });
    }
    
    _playNext() {
        if (!this._currentPlaylist.length) return;
        
        if (this._isShuffled) {
            this._currentSongIndex = Math.floor(Math.random() * this._currentPlaylist.length);
        } else {
            this._currentSongIndex = (this._currentSongIndex + 1) % this._currentPlaylist.length;
        }
        
        this._playSong(this._currentSongIndex, this._currentPlaylist);
    }
    
    _playPrevious() {
        if (!this._currentPlaylist.length) return;
        
        if (this._isShuffled) {
            this._currentSongIndex = Math.floor(Math.random() * this._currentPlaylist.length);
        } else {
            this._currentSongIndex = (this._currentSongIndex - 1 + this._currentPlaylist.length) % this._currentPlaylist.length;
        }
        
        this._playSong(this._currentSongIndex, this._currentPlaylist);
    }
    
    _handleSongEnd() {
        if (this._isRepeat) {
            this._audioElement.currentTime = 0;
            this._audioElement.play();
        } else {
            this._playNext();
        }
    }
    
    _updateProgress() {
        if (!this._audioElement) return;
        
        const current = this._audioElement.currentTime;
        const total = this._audioElement.duration;
        
        if (isNaN(total)) return;
        
        const percent = (current / total) * 100;
        
        this._shadow.querySelector('.progress-bar-fill').style.width = `${percent}%`;
        this._shadow.querySelector('.current-time').textContent = this._formatTime(current);
    }
    
    _updateDuration() {
        if (!this._audioElement) return;
        
        const total = this._audioElement.duration;
        if (!isNaN(total)) {
            this._shadow.querySelector('.total-time').textContent = this._formatTime(total);
            this._songDuration = total;
        }
    }
    
    _updatePlayButton() {
        const playIcon = this._shadow.querySelector('.play-icon');
        const pauseIcon = this._shadow.querySelector('.pause-icon');
        
        if (this._isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    _formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ANIMATION LOOP
    _startAnimation() {
        this._animate();
    }
    
    _animate() {
        this._animationId = requestAnimationFrame(() => this._animate());
        
        const sr = this._audioContext ? this._audioContext.sampleRate : 44100;
        
        if (this._live && this._vizAnalyser) {
            this._vizAnalyser.getByteFrequencyData(this._vizData);
            this._buildRingArray(sr);
            this._tickRTBeat();
        }
        
        this._decayKick();
        this._updateKenBurns();
        this._drawBackground();
        this._mainCtx.clearRect(0, 0, this._width, this._height);
        this._updateParticles();
        this._drawParticles();
        this._drawBeatFlash();
        this._drawRing();
        this._drawCenter();
    }
    
    // BEAT DETECTION
    _tickRTBeat() {
        if (!this._beatData || !this._live || !this._beatAnalyser) return;
        
        this._beatAnalyser.getByteFrequencyData(this._beatData);
        
        const lo = this._freqToBin(30);
        const hi = this._freqToBin(120);
        
        let sq = 0, n = 0;
        for (let i = lo; i <= hi; i++) {
            const v = this._beatData[i] / 255;
            sq += v * v;
            n++;
        }
        
        const rms = n > 0 ? Math.sqrt(sq / n) : 0;
        
        this._rtHistory[this._rtIdx] = rms;
        this._rtIdx = (this._rtIdx + 1) % 60;
        if (this._rtIdx === 0) this._rtFilled = true;
        this._rtWarmup++;
        
        if (this._rtWarmup < 50) {
            if (this._rtCooldown > 0) this._rtCooldown--;
            return;
        }
        
        const len = this._rtFilled ? 60 : Math.max(1, this._rtIdx);
        let avg = 0;
        for (let i = 0; i < len; i++) avg += this._rtHistory[i];
        avg /= len;
        
        if (this._rtCooldown > 0) {
            this._rtCooldown--;
            return;
        }
        
        if (rms > avg * 1.35 && rms > 0.06) {
            const mag = Math.min(1.0, (rms - avg) / Math.max(0.01, avg * 0.5));
            this._fireKick(0.55 + mag * 0.45);
            this._rtCooldown = 22;
        }
    }
    
    _freqToBin(freq) {
        const nyq = (this._audioContext ? this._audioContext.sampleRate : 44100) / 2;
        return Math.min(Math.round(freq / nyq * this._beatAnalyser.frequencyBinCount), this._beatAnalyser.frequencyBinCount - 1);
    }
    
    _fireKick(strength) {
        this._kickEnv = Math.min(1.0, strength);
        this._bgEnv = Math.min(1.0, strength * 0.95);
    }
    
    _decayKick() {
        if (this._kickEnv > 0.30) this._kickEnv *= 0.86;
        else this._kickEnv *= 0.95;
        
        if (this._bgEnv > 0.30) this._bgEnv *= 0.82;
        else this._bgEnv *= 0.94;
        
        this._kickStrength = this._kickEnv * this._kickEnv;
        this._bgPulse = this._bgEnv * this._bgEnv;
    }
    
    // RING ARRAY
    _buildRingArray(sr) {
        const N_HALF = 128;
        const N_RING = 256;
        
        for (let i = 0; i < N_HALF; i++) {
            const bin = this._fftBinForRing(i, sr);
            const raw = this._vizData[bin] / 255.0;
            const t = i / (N_HALF - 1);
            
            let s;
            if (t < 0.12) s = Math.pow(raw, 1.4) * 1.35;
            else if (t < 0.35) s = Math.pow(raw, 1.6) * 1.10;
            else if (t < 0.65) s = Math.pow(raw, 1.8) * 0.90;
            else s = Math.pow(raw, 2.2) * 0.70;
            
            this._ringBuf[i] = Math.min(1.0, s);
        }
        
        for (let i = 0; i < N_RING; i++) {
            const h = i < N_HALF ? i : N_RING - 1 - i;
            const tgt = this._ringBuf[h];
            const atk = tgt > this._ringSmooth[i];
            this._ringSmooth[i] += (tgt - this._ringSmooth[i]) * (atk ? 0.7 : 0.3);
        }
        
        this._gaussSmooth(this._ringSmooth, 1.5);
    }
    
    _fftBinForRing(i, sr) {
        const nyq = sr / 2;
        const fLo = 30;
        const fHi = Math.min(16000, nyq * 0.9);
        const freq = fLo * Math.pow(fHi / fLo, i / 127);
        return Math.min(Math.round(freq / nyq * this._bufLen), this._bufLen - 1);
    }
    
    _gaussSmooth(arr, sigma) {
        const n = arr.length;
        const r = Math.ceil(sigma * 2.5);
        const tmp = new Float32Array(arr);
        
        for (let i = 0; i < n; i++) {
            let s = 0, w = 0;
            for (let j = -r; j <= r; j++) {
                const wt = Math.exp(-(j * j) / (2 * sigma * sigma));
                s += tmp[(i + j + n) % n] * wt;
                w += wt;
            }
            arr[i] = s / w;
        }
    }
    
    // KEN BURNS EFFECT
    _updateKenBurns() {
        this._kenBurnsTick++;
        if (this._kenBurnsTick % 500 === 0) {
            this._kenBurnsTX = (Math.random() - 0.5) * 55;
            this._kenBurnsTY = (Math.random() - 0.5) * 38;
            this._kenBurnsTS = 1.03 + Math.random() * 0.055;
        }
        this._kenBurnsX += (this._kenBurnsTX - this._kenBurnsX) * 0.0015;
        this._kenBurnsY += (this._kenBurnsTY - this._kenBurnsY) * 0.0015;
        this._kenBurnsScale += (this._kenBurnsTS - this._kenBurnsScale) * 0.0015;
    }
    
    // PARTICLES
    _updateParticles() {
        const Z_NEAR = 1;
        this._particles.forEach(p => {
            p.z3 -= p.vz + this._kickStrength * 9.0;
            if (p.z3 < Z_NEAR) p.reset(false);
        });
    }
    
    _drawParticles() {
        const FL = 280;
        const Z_FAR = 800;
        
        this._particles.forEach(p => {
            const scale = FL / p.z3;
            const sx = p.x3 * scale + this._cx;
            const sy = p.y3 * scale + this._cy;
            
            if (sx < -10 || sx > this._width + 10 || sy < -10 || sy > this._height + 10) return;
            
            const depth = 1 - (p.z3 / Z_FAR);
            const sz = p.maxSz * (0.1 + depth * 1.4);
            const alp = p.op * (0.1 + depth * 0.9);
            
            if (sz < 0.05 || alp < 0.01) return;
            
            this._mainCtx.save();
            this._mainCtx.globalAlpha = alp;
            
            const r = Math.max(sz * 2.5, 0.5);
            const gr = this._mainCtx.createRadialGradient(sx, sy, 0, sx, sy, r);
            gr.addColorStop(0, 'rgba(255,255,255,1)');
            gr.addColorStop(0.35, this._hexToRgba(this._colorScheme.c1, 0.55));
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            this._mainCtx.fillStyle = gr;
            this._mainCtx.beginPath();
            this._mainCtx.arc(sx, sy, r, 0, Math.PI * 2);
            this._mainCtx.fill();
            this._mainCtx.restore();
        });
    }
    
    // BACKGROUND
    _drawBackground() {
        this._bgCtx.clearRect(0, 0, this._width, this._height);
        
        const zoom = 1.0 + this._bgPulse * 0.022;
        
        if (this._bgReady && this._bgImage) {
            this._bgCtx.save();
            const sc = Math.max(this._width / this._bgImage.naturalWidth, this._height / this._bgImage.naturalHeight) * this._kenBurnsScale * zoom;
            this._bgCtx.drawImage(
                this._bgImage,
                this._cx - this._bgImage.naturalWidth * sc / 2 + this._kenBurnsX,
                this._cy - this._bgImage.naturalHeight * sc / 2 + this._kenBurnsY,
                this._bgImage.naturalWidth * sc,
                this._bgImage.naturalHeight * sc
            );
            this._bgCtx.restore();
            this._bgCtx.fillStyle = `rgba(0,0,0,${Math.max(0.52, 0.74 - this._bgPulse * 0.09)})`;
            this._bgCtx.fillRect(0, 0, this._width, this._height);
        } else {
            this._bgCtx.fillStyle = '#000';
            this._bgCtx.fillRect(0, 0, this._width, this._height);
        }
        
        if (this._bgPulse > 0.04) {
            const a = this._bgPulse * 0.22;
            
            const gr = this._bgCtx.createRadialGradient(
                this._cx, this._cy, Math.min(this._width, this._height) * 0.10,
                this._cx, this._cy, Math.min(this._width, this._height) * (0.35 + this._bgPulse * 0.20)
            );
            gr.addColorStop(0, this._hexToRgba(this._colorScheme.c1, a * 0.55));
            gr.addColorStop(0.35, this._hexToRgba(this._colorScheme.bgTint, a * 0.35));
            gr.addColorStop(0.70, this._hexToRgba(this._colorScheme.bgTint, a * 0.12));
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            this._bgCtx.fillStyle = gr;
            this._bgCtx.fillRect(0, 0, this._width, this._height);
        }
        
        const vg = this._bgCtx.createRadialGradient(
            this._cx, this._cy, Math.min(this._width, this._height) * 0.28,
            this._cx, this._cy, Math.max(this._width, this._height) * 0.72
        );
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, 'rgba(0,0,0,0.55)');
        this._bgCtx.fillStyle = vg;
        this._bgCtx.fillRect(0, 0, this._width, this._height);
    }
    
    _drawBeatFlash() {
        if (this._kickStrength < 0.08) return;
        
        this._mainCtx.save();
        const rg = this._mainCtx.createRadialGradient(
            this._cx, this._cy, 0,
            this._cx, this._cy, Math.min(this._width, this._height) * 0.50
        );
        rg.addColorStop(0, this._hexToRgba(this._colorScheme.c3, this._kickStrength * 0.30));
        rg.addColorStop(0.40, this._hexToRgba(this._colorScheme.glow, this._kickStrength * 0.18));
        rg.addColorStop(1, 'transparent');
        this._mainCtx.fillStyle = rg;
        this._mainCtx.globalCompositeOperation = 'screen';
        this._mainCtx.fillRect(0, 0, this._width, this._height);
        this._mainCtx.restore();
    }
    
    // RING
    _drawRing() {
        // Blurred layer 1
        this._off1Ctx.clearRect(0, 0, this._width, this._height);
        this._buildRingPath(this._off1Ctx);
        const g1 = this._off1Ctx.createRadialGradient(
            this._cx, this._cy, this._baseRadius * 0.90,
            this._cx, this._cy, this._baseRadius + this._maxHeight
        );
        g1.addColorStop(0, this._colorScheme.c1 + '44');
        g1.addColorStop(0.45, this._colorScheme.c1 + 'cc');
        g1.addColorStop(0.80, this._colorScheme.c2 + '88');
        g1.addColorStop(1, this._colorScheme.c2 + '00');
        this._off1Ctx.fillStyle = g1;
        this._off1Ctx.arc(this._cx, this._cy, this._baseRadius * 0.93, 0, Math.PI * 2, false);
        this._off1Ctx.fill('evenodd');
        this._off1Ctx.strokeStyle = this._colorScheme.c1 + 'bb';
        this._off1Ctx.lineWidth = 7;
        this._off1Ctx.stroke();
        
        this._mainCtx.save();
        this._mainCtx.filter = 'blur(22px)';
        this._mainCtx.globalAlpha = 0.55;
        this._mainCtx.globalCompositeOperation = 'screen';
        this._mainCtx.drawImage(this._off1Canvas, 0, 0);
        this._mainCtx.restore();
        
        // Blurred layer 2
        this._off2Ctx.clearRect(0, 0, this._width, this._height);
        this._buildRingPath(this._off2Ctx);
        const g2 = this._off2Ctx.createRadialGradient(
            this._cx, this._cy, this._baseRadius * 0.92,
            this._cx, this._cy, this._baseRadius + this._maxHeight * 0.88
        );
        g2.addColorStop(0, this._colorScheme.c1 + '66');
        g2.addColorStop(0.55, this._colorScheme.c2 + '99');
        g2.addColorStop(1, this._colorScheme.c2 + '00');
        this._off2Ctx.fillStyle = g2;
        this._off2Ctx.arc(this._cx, this._cy, this._baseRadius * 0.95, 0, Math.PI * 2, false);
        this._off2Ctx.fill('evenodd');
        this._off2Ctx.strokeStyle = this._colorScheme.c1 + 'dd';
        this._off2Ctx.lineWidth = 3;
        this._off2Ctx.stroke();
        
        this._mainCtx.save();
        this._mainCtx.filter = 'blur(7px)';
        this._mainCtx.globalAlpha = 0.72;
        this._mainCtx.globalCompositeOperation = 'screen';
        this._mainCtx.drawImage(this._off2Canvas, 0, 0);
        this._mainCtx.restore();
        
        // Sharp layer
        this._mainCtx.save();
        this._mainCtx.globalCompositeOperation = 'screen';
        this._buildRingPath(this._mainCtx);
        
        const sg = this._mainCtx.createRadialGradient(
            this._cx, this._cy, this._baseRadius,
            this._cx, this._cy, this._baseRadius + this._maxHeight
        );
        sg.addColorStop(0, this._colorScheme.c1);
        sg.addColorStop(0.5, this._colorScheme.c2);
        sg.addColorStop(1, this._colorScheme.c3);
        
        this._mainCtx.strokeStyle = sg;
        this._mainCtx.lineWidth = 1.6;
        this._mainCtx.shadowBlur = 10;
        this._mainCtx.shadowColor = this._colorScheme.glow;
        this._mainCtx.stroke();
        this._mainCtx.restore();
        
        // Peak dots
        this._mainCtx.save();
        this._mainCtx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 256; i += 2) {
            const v = this._ringSmooth[i];
            if (v < 0.40) continue;
            
            const ang = (i / 256) * Math.PI * 2 - Math.PI / 2;
            const r = this._baseRadius + v * this._maxHeight;
            
            this._mainCtx.globalAlpha = (v - 0.40) / 0.60 * 0.85;
            this._mainCtx.shadowBlur = 12;
            this._mainCtx.shadowColor = this._colorScheme.c1;
            this._mainCtx.fillStyle = this._colorScheme.c3;
            this._mainCtx.beginPath();
            this._mainCtx.arc(
                this._cx + Math.cos(ang) * r,
                this._cy + Math.sin(ang) * r,
                v * 3.8, 0, Math.PI * 2
            );
            this._mainCtx.fill();
        }
        this._mainCtx.restore();
        
        this._mainCtx.save();
        this._mainCtx.strokeStyle = this._colorScheme.c1 + '22';
        this._mainCtx.lineWidth = 1;
        this._mainCtx.beginPath();
        this._mainCtx.arc(this._cx, this._cy, this._baseRadius, 0, Math.PI * 2);
        this._mainCtx.stroke();
        this._mainCtx.restore();
    }
    
    _buildRingPath(ctx) {
        const n = this._ringSmooth.length;
        const px = new Float32Array(n);
        const py = new Float32Array(n);
        
        for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const r = this._baseRadius + this._ringSmooth[i] * this._maxHeight;
            px[i] = this._cx + Math.cos(ang) * r;
            py[i] = this._cy + Math.sin(ang) * r;
        }
        
        ctx.beginPath();
        ctx.moveTo(px[0], py[0]);
        for (let i = 0; i < n; i++) {
            const p0 = (i - 1 + n) % n;
            const p1 = i;
            const p2 = (i + 1) % n;
            const p3 = (i + 2) % n;
            
            const cp1x = px[p1] + (px[p2] - px[p0]) / 6;
            const cp1y = py[p1] + (py[p2] - py[p0]) / 6;
            const cp2x = px[p2] - (px[p3] - px[p1]) / 6;
            const cp2y = py[p2] - (py[p3] - py[p1]) / 6;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px[p2], py[p2]);
        }
        ctx.closePath();
    }
    
    // CENTER
    _drawCenter() {
        const cr = this._centerRadius * (1.0 + this._kickStrength * 0.045);
        
        // Draw image
        this._mainCtx.save();
        this._mainCtx.beginPath();
        this._mainCtx.arc(this._cx, this._cy, cr - 2, 0, Math.PI * 2);
        this._mainCtx.clip();
        
        if (this._coverReady && this._coverImage) {
            this._mainCtx.drawImage(this._coverImage, this._cx - cr, this._cy - cr, cr * 2, cr * 2);
            this._mainCtx.fillStyle = this._colorScheme.bgTint + '44';
            this._mainCtx.fillRect(this._cx - cr, this._cy - cr, cr * 2, cr * 2);
            
            const iv = this._mainCtx.createRadialGradient(this._cx, this._cy, cr * 0.45, this._cx, this._cy, cr);
            iv.addColorStop(0, 'transparent');
            iv.addColorStop(1, 'rgba(0,0,0,0.45)');
            this._mainCtx.fillStyle = iv;
            this._mainCtx.fillRect(this._cx - cr, this._cy - cr, cr * 2, cr * 2);
        } else {
            const pg = this._mainCtx.createRadialGradient(this._cx, this._cy, 0, this._cx, this._cy, cr);
            pg.addColorStop(0, this._colorScheme.bgTint + 'ff');
            pg.addColorStop(1, '#000');
            this._mainCtx.fillStyle = pg;
            this._mainCtx.fillRect(this._cx - cr, this._cy - cr, cr * 2, cr * 2);
        }
        this._mainCtx.restore();
        
        // Draw border glow
        this._mainCtx.save();
        this._mainCtx.strokeStyle = this._colorScheme.c1 + Math.floor(20 + this._kickStrength * 80).toString(16).padStart(2, '0');
        this._mainCtx.lineWidth = 8;
        this._mainCtx.shadowBlur = 20 + this._kickStrength * 28;
        this._mainCtx.shadowColor = this._colorScheme.glow;
        this._mainCtx.globalAlpha = 0.25 + this._kickStrength * 0.35;
        this._mainCtx.beginPath();
        this._mainCtx.arc(this._cx, this._cy, cr + 4, 0, Math.PI * 2);
        this._mainCtx.stroke();
        this._mainCtx.restore();
        
        this._mainCtx.save();
        this._mainCtx.strokeStyle = this._colorScheme.c1;
        this._mainCtx.lineWidth = 3.5;
        this._mainCtx.shadowBlur = 22 + this._kickStrength * 30;
        this._mainCtx.shadowColor = this._colorScheme.glow;
        this._mainCtx.globalAlpha = 0.88 + this._kickStrength * 0.12;
        this._mainCtx.beginPath();
        this._mainCtx.arc(this._cx, this._cy, cr, 0, Math.PI * 2);
        this._mainCtx.stroke();
        this._mainCtx.restore();
        
        // Draw text
        const song = this._currentPlaylist.length > 0 && this._currentSongIndex >= 0 
            ? this._currentPlaylist[this._currentSongIndex] 
            : null;
        
        if (song) {
            this._mainCtx.save();
            const fs = Math.floor(cr * 0.20);
            this._mainCtx.textAlign = 'center';
            this._mainCtx.textBaseline = 'middle';
            
            const textScale = 1.0 + this._kickStrength * 0.10;
            this._mainCtx.translate(this._cx, this._cy);
            this._mainCtx.scale(textScale, textScale);
            this._mainCtx.translate(-this._cx, -this._cy);
            
            this._mainCtx.font = `900 ${fs}px 'Courier New', monospace`;
            
            const glowSize = 10 + this._kickStrength * 38;
            const glowAlpha = 0.86 + this._kickStrength * 0.14;
            
            // Song title
            this._mainCtx.shadowBlur = glowSize;
            this._mainCtx.shadowColor = this._colorScheme.glow;
            this._mainCtx.globalAlpha = glowAlpha;
            this._mainCtx.fillStyle = this._kickStrength > 0.15 
                ? this._lerpColor(this._colorScheme.c1, '#ffffff', this._kickStrength * 0.55) 
                : this._colorScheme.c1;
            
            const title = song.title.toUpperCase();
            const maxWidth = cr * 1.8;
            let titleText = title;
            
            if (this._mainCtx.measureText(title).width > maxWidth) {
                while (this._mainCtx.measureText(titleText + '...').width > maxWidth && titleText.length > 0) {
                    titleText = titleText.slice(0, -1);
                }
                titleText += '...';
            }
            
            this._mainCtx.fillText(titleText, this._cx, this._cy);
            
            this._mainCtx.restore();
        }
    }
    
    // UTILITIES
    _hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }
    
    _lerpColor(hexA, hexB, t) {
        const ra = parseInt(hexA.slice(1, 3), 16);
        const ga = parseInt(hexA.slice(3, 5), 16);
        const ba = parseInt(hexA.slice(5, 7), 16);
        const rb = parseInt(hexB.slice(1, 3), 16);
        const gb = parseInt(hexB.slice(3, 5), 16);
        const bb = parseInt(hexB.slice(5, 7), 16);
        const r = Math.round(ra + (rb - ra) * t);
        const g = Math.round(ga + (gb - ga) * t);
        const b = Math.round(ba + (bb - ba) * t);
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }
    
    _cleanup() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
        }
        
        if (this._audioElement) {
            this._audioElement.pause();
        }
        
        if (this._audioContext) {
            this._audioContext.close();
        }
    }
}

// PARTICLE CLASS
class Particle {
    constructor() {
        this.reset(true);
    }
    
    reset(init = false) {
        const Z_FAR = 800;
        const Z_NEAR = 1;
        
        this.x3 = (Math.random() - 0.5) * Z_FAR * 2.2;
        this.y3 = (Math.random() - 0.5) * Z_FAR * 2.2;
        this.z3 = init ? Math.random() * Z_FAR + Z_NEAR : Z_FAR * (0.85 + Math.random() * 0.15);
        
        this.vz = 1.8 + Math.random() * 3.0;
        this.maxSz = 0.3 + Math.random() * 1.1;
        this.op = 0.35 + Math.random() * 0.55;
    }
}

customElements.define('music-visualizer-pro', MusicVisualizerPro);
