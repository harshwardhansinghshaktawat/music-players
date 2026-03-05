class MusicVisualizerPro extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        
        // Audio
        this._audioContext = null;
        this._vizAnalyser = null;
        this._beatAnalyser = null;
        this._srcNode = null;
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
        
        // Settings
        this._settings = {
            particleCount: 420,
            particleSpeed: 1.8,
            ringSize: 0.240,
            ringHeight: 0.100,
            centerSize: 0.79,
            showCoverArt: true,
            bgSource: 'random',
            centerSource: 'cover',
            spectrumStyle: 'smooth',
            glowIntensity: 1.0,
            beatSensitivity: 1.0
        };
        
        this._createDOM();
        this._setupEventListeners();
    }
    
    static get observedAttributes() {
        return [
            'player-data', 'player-name', 'primary-color', 'secondary-color', 
            'background-color', 'surface-color', 'text-primary', 'text-secondary', 
            'accent-color', 'border-radius', 'title-font-family', 'body-font-family',
            'particle-count', 'particle-speed', 'ring-size', 'ring-height', 
            'center-size', 'show-cover-art', 'bg-source', 'center-source',
            'spectrum-style', 'glow-intensity', 'beat-sensitivity', 'color-scheme'
        ];
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
        } else if (name === 'player-name' && newValue) {
            // Update if needed
        } else if (name === 'particle-count') {
            this._settings.particleCount = parseInt(newValue) || 420;
            this._initParticles();
        } else if (name === 'particle-speed') {
            this._settings.particleSpeed = parseFloat(newValue) || 1.8;
        } else if (name === 'ring-size') {
            this._settings.ringSize = parseFloat(newValue) || 0.240;
        } else if (name === 'ring-height') {
            this._settings.ringHeight = parseFloat(newValue) || 0.100;
        } else if (name === 'center-size') {
            this._settings.centerSize = parseFloat(newValue) || 0.79;
        } else if (name === 'show-cover-art') {
            this._settings.showCoverArt = newValue === 'true';
        } else if (name === 'bg-source') {
            this._settings.bgSource = newValue || 'random';
            this._loadBackgroundImage();
        } else if (name === 'center-source') {
            this._settings.centerSource = newValue || 'cover';
        } else if (name === 'spectrum-style') {
            this._settings.spectrumStyle = newValue || 'smooth';
        } else if (name === 'glow-intensity') {
            this._settings.glowIntensity = parseFloat(newValue) || 1.0;
        } else if (name === 'beat-sensitivity') {
            this._settings.beatSensitivity = parseFloat(newValue) || 1.0;
        } else if (name === 'color-scheme' && newValue) {
            this._applyColorScheme(newValue);
        } else if (name.includes('color') || name.includes('font') || name === 'border-radius') {
            this._updateStyles();
        }
    }
    
    connectedCallback() {
        this._initAudio();
        this._initParticles();
        this._loadBackgroundImage();
        this._startAnimation();
        
        if (this._playerData) {
            this._renderBrowser();
        }
    }
    
    disconnectedCallback() {
        this._cleanup();
    }
    
    _createDOM() {
        this._shadow.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                :host {
                    --primary-color: #00ffff;
                    --secondary-color: #9b59b6;
                    --background-color: #ffffff;
                    --surface-color: #f5f5f5;
                    --text-primary: #000000;
                    --text-secondary: #666666;
                    --accent-color: #00ffff;
                    --border-color: rgba(0, 255, 255, 0.3);
                    --glow-color: #00ffff;
                    --bg-tint: #001122;
                    
                    --title-font: 'Inter', sans-serif;
                    --body-font: 'Inter', sans-serif;
                    --border-radius: 12px;
                    
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
                    font-family: var(--title-font);
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
                    border: 1px solid var(--border-color);
                    border-radius: calc(var(--border-radius) / 2);
                    color: var(--accent-color);
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
                    border-right: 1px solid var(--border-color);
                    backdrop-filter: blur(20px);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .browser-header {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 0.25rem;
                    border-radius: calc(var(--border-radius) / 2);
                    border: 1px solid var(--border-color);
                    margin-bottom: 1rem;
                }
                
                .view-toggle-btn {
                    flex: 1;
                    padding: 0.5rem;
                    background: transparent;
                    border: none;
                    border-radius: calc(var(--border-radius) / 3);
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .view-toggle-btn.active {
                    background: var(--accent-color);
                    color: #000;
                }
                
                .browser-search {
                    position: relative;
                }
                
                .browser-search input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid var(--border-color);
                    border-radius: calc(var(--border-radius) / 2);
                    color: white;
                    font-size: 0.875rem;
                    font-family: var(--body-font);
                }
                
                .browser-search input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .browser-search input:focus {
                    outline: none;
                    border-color: var(--accent-color);
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
                    background: var(--border-color);
                    border-radius: 3px;
                }
                
                .albums-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 0.75rem;
                }
                
                .album-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid var(--border-color);
                    border-radius: calc(var(--border-radius) / 1.5);
                    padding: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .album-card:hover {
                    border-color: var(--accent-color);
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }
                
                .album-card.active {
                    border-color: var(--accent-color);
                    background: rgba(0, 255, 255, 0.15);
                }
                
                .album-cover {
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: calc(var(--border-radius) / 2);
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
                    border: 1px solid var(--border-color);
                    border-radius: calc(var(--border-radius) / 2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .song-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--accent-color);
                }
                
                .song-item.active {
                    background: rgba(0, 255, 255, 0.15);
                    border-color: var(--accent-color);
                }
                
                .song-cover {
                    width: 2.75rem;
                    height: 2.75rem;
                    border-radius: calc(var(--border-radius) / 3);
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
                    border: 1px solid var(--border-color);
                    border-radius: calc(var(--border-radius) / 2);
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
                    background: var(--accent-color);
                    color: #000;
                }
                
                .controls-footer {
                    background: rgba(0, 0, 0, 0.85);
                    border-top: 1px solid var(--border-color);
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
                    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
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
                    border: 1px solid var(--border-color);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-radius: calc(var(--border-radius) / 2);
                }
                
                .control-btn:hover {
                    background: var(--accent-color);
                    border-color: var(--accent-color);
                    color: #000;
                }
                
                .control-btn.active {
                    background: var(--accent-color);
                    border-color: var(--accent-color);
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
                    background: var(--accent-color);
                    border-color: var(--accent-color);
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
                    background: var(--accent-color);
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
                        border-bottom: 1px solid var(--border-color);
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

_setupEventListeners() {
        // View toggle
        this._shadow.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._currentView = btn.dataset.view;
                this._selectedAlbum = null;
                this._updateViewToggle();
                this._renderBrowser();
            });
        });
        
        // Search
        const searchInput = this._shadow.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this._searchQuery = e.target.value.toLowerCase();
            this._renderBrowser();
        });
        
        // Playback controls
        this._shadow.querySelector('.play-btn').addEventListener('click', () => {
            if (!this._currentPlaylist || this._currentSongIndex === -1) {
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
        
        // Volume control
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
        
        // Progress bar
        const progressBar = this._shadow.querySelector('.progress-bar-container');
        progressBar.addEventListener('click', (e) => {
            if (!this._audioElement || !this._audioElement.duration) return;
            
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this._audioElement.currentTime = percent * this._audioElement.duration;
        });
    }
    
    _initAudio() {
        this._audioElement = document.createElement('audio');
        this._audioElement.crossOrigin = 'anonymous';
        
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Visualizer analyser
            this._vizAnalyser = this._audioContext.createAnalyser();
            this._vizAnalyser.fftSize = 4096;
            this._vizAnalyser.smoothingTimeConstant = 0.0;
            this._bufLen = this._vizAnalyser.frequencyBinCount;
            this._vizData = new Uint8Array(this._bufLen);
            
            // Beat analyser
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
            this._updatePlayButton();
            if (this._audioContext?.state === 'suspended') {
                this._audioContext.resume();
            }
        });
        this._audioElement.addEventListener('pause', () => {
            this._isPlaying = false;
            this._updatePlayButton();
        });
    }
    
    _initParticles() {
        this._particles = Array.from({length: this._settings.particleCount}, () => new Particle());
    }
    
    _loadBackgroundImage() {
        if (this._settings.bgSource === 'random') {
            this._bgImage = new Image();
            this._bgImage.crossOrigin = 'anonymous';
            this._bgImage.src = `https://picsum.photos/1920/1080?random=${Math.floor(Math.random() * 1000)}`;
            this._bgImage.onload = () => { this._bgReady = true; };
        } else if (this._settings.bgSource === 'cover' && this._currentPlaylist && this._currentSongIndex >= 0) {
            const song = this._currentPlaylist[this._currentSongIndex];
            if (song.coverImage) {
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
    
    // Continue in next response due to length...
}

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
