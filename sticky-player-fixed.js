// ============================================================
//  STICKY BOTTOM MUSIC PLAYER - Fixed Version
//  ✅ Removed player name
//  ✅ Increased font sizes
//  ✅ Fixed all contrast issues
//  ✅ Shadow color control with intensity slider
//  ✅ Removed weird side animations
//  ✅ All solid hex colors (no RGBA)
// ============================================================

class StickyMusicPlayer extends HTMLElement {
    constructor() {
        super();
        this._audio = null;
        this._ctx = null;
        this._analyser = null;
        this._dataArray = null;
        this._animId = null;
        this._isPlaying = false;
        this._currentSong = 0;
        this._songs = [];
        this._volume = 0.8;
        this._lastVolume = 0.8;
        this._shuffle = false;
        this._repeat = 'none';
        this._seeking = false;
        this._drawerOpen = false;
        this._searchQuery = '';
        this._domReady = false;
    }

    static get observedAttributes() {
        return [
            'player-data',
            'primary-color',
            'secondary-color',
            'background-color',
            'text-primary',
            'text-secondary',
            'accent-color',
            'shadow-color',
            'shadow-intensity',
            'font-family'
        ];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (newVal === oldVal) return;

        if (name === 'player-data' && newVal) {
            try {
                const data = JSON.parse(newVal);
                this._songs = data.songs || [];
                if (this._songs.length > 0) {
                    if (this._domReady) {
                        this._loadSong(0, false);
                        this._renderDrawer();
                    }
                }
            } catch (e) {
                console.error('[StickyPlayer] Data error:', e);
            }
        } else if (name.includes('color') || name === 'font-family') {
            this._applyStyles();
        } else if (name === 'shadow-intensity' || name === 'shadow-color') {
            this._applyShadow();
        }
    }

    connectedCallback() {
        // The custom element itself is invisible - the actual player is appended to body
        this.style.display = 'block';
        this.style.height = '0';
        this.style.width = '0';
        this.style.overflow = 'hidden';
        
        this._injectStyles();
        this._buildDOM();
        this._initAudio();
        this._bindEvents();
        this._domReady = true;
        
        // Load first song if songs already loaded
        if (this._songs.length > 0) {
            this._loadSong(0, false);
            this._renderDrawer();
        }
    }

    disconnectedCallback() {
        if (this._animId) cancelAnimationFrame(this._animId);
        if (this._audio) this._audio.pause();
        // Remove the fixed player from body
        const player = document.getElementById('sticky-player-fixed');
        if (player) player.remove();
        // Remove the drawer
        const drawer = document.getElementById('sticky-queue-drawer');
        if (drawer) drawer.remove();
        // Remove body padding
        document.body.style.paddingBottom = '';
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;600;700&display=swap');

sticky-music-player {
    display: block;
    width: 100%;
    font-family: 'Inter', sans-serif;
}

#sticky-player-fixed {
    /* Default WCAG compliant colors */
    --primary: #3b82f6;
    --secondary: #60a5fa;
    --bg: #1a1a1a;
    --text-primary: #f0f0f0;
    --text-secondary: #999999;
    --accent: #3b82f6;
    --shadow-color: #000000;
    --shadow-intensity: 0.3;
    --font-family: 'Inter', sans-serif;
}

*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

#sticky-player-fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    background: var(--bg);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    z-index: 9999;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
    font-family: var(--font-family);
}

/* FIX: Added shadow with controllable color and intensity */
#sticky-player-fixed::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(to bottom, transparent, var(--shadow-color));
    opacity: var(--shadow-intensity);
    pointer-events: none;
    z-index: -1;
}

/* Album Art - FIX: Removed animations */
.album-art {
    width: 70px;
    height: 70px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
}

.album-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.album-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.album-placeholder svg {
    width: 30px;
    height: 30px;
    fill: var(--text-secondary);
    opacity: 0.5;
}

/* Song Info - FIX: Increased font sizes */
.song-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.song-title {
    font-size: 16px; /* Increased from 14px */
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}

.song-artist {
    font-size: 14px; /* Increased from 12px */
    font-weight: 400;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Progress Section */
.progress-section {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 200px;
}

.progress-bar {
    width: 100%;
    height: 6px; /* Slightly thicker */
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    width: 0%;
    transition: width 0.1s linear;
    position: relative;
}

.progress-fill::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: var(--text-primary);
    border: 2px solid var(--accent);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s;
}

.progress-bar:hover .progress-fill::after {
    opacity: 1;
}

.time-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.time {
    font-size: 12px; /* Increased from 11px */
    font-weight: 500;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
}

/* Controls */
.controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.control-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;
}

.control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
}

.control-btn.active {
    color: var(--accent);
}

.control-btn svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
}

/* Play Button */
.play-btn {
    width: 48px;
    height: 48px;
    background: var(--accent);
    border-radius: 50%;
}

.play-btn:hover {
    background: var(--primary);
    transform: scale(1.08);
}

.play-btn svg {
    width: 22px;
    height: 22px;
    fill: var(--bg);
}

/* Volume */
.volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 80px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: var(--accent);
    border-radius: 50%;
    cursor: pointer;
}

.volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: var(--accent);
    border: none;
    border-radius: 50%;
    cursor: pointer;
}

/* Queue Button */
.queue-btn {
    width: 40px;
    height: 40px;
}

.queue-btn.active {
    color: var(--accent);
}

/* Queue Drawer */
#sticky-queue-drawer {
    position: fixed;
    bottom: 90px;
    right: 16px;
    width: 360px;
    max-height: 500px;
    background: var(--bg);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    z-index: 10000;
    transform: translateY(20px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.3s, opacity 0.3s;
    font-family: var(--font-family);
}

#sticky-queue-drawer.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
}

.drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
}

.drawer-close {
    width: 32px;
    height: 32px;
}

.drawer-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-search svg {
    width: 18px;
    height: 18px;
    fill: var(--text-secondary);
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 14px;
    font-family: var(--font-family);
}

.search-input::placeholder {
    color: var(--text-secondary);
}

.drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.drawer-body::-webkit-scrollbar {
    width: 6px;
}

.drawer-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

/* Song Rows in Drawer */
.queue-song {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.queue-song:hover {
    background: rgba(255, 255, 255, 0.05);
}

.queue-song.active {
    background: rgba(255, 255, 255, 0.1);
}

.queue-num {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}

.queue-song.active .queue-num {
    color: var(--accent);
}

.queue-art {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
    flex-shrink: 0;
}

.queue-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.queue-info {
    flex: 1;
    min-width: 0;
}

.queue-song-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.queue-song.active .queue-song-title {
    color: var(--accent);
}

.queue-song-artist {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.queue-duration {
    font-size: 12px;
    color: var(--text-secondary);
    flex-shrink: 0;
}

.queue-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
    #sticky-player-fixed {
        padding: 12px 16px;
        gap: 12px;
    }
    
    .album-art {
        width: 50px;
        height: 50px;
    }
    
    .song-title {
        font-size: 14px;
    }
    
    .song-artist {
        font-size: 12px;
    }
    
    .controls {
        gap: 8px;
    }
    
    .control-btn {
        width: 36px;
        height: 36px;
    }
    
    .play-btn {
        width: 42px;
        height: 42px;
    }
    
    .volume-control,
    .queue-btn {
        display: none;
    }
    
    #sticky-queue-drawer {
        right: 0;
        left: 0;
        width: 100%;
        max-height: 60vh;
        border-radius: 12px 12px 0 0;
    }
}
        `;
        this.appendChild(style);
    }

    _buildDOM() {
        // Check if player already exists
        if (document.getElementById('sticky-player-fixed')) return;
        
        const player = document.createElement('div');
        player.id = 'sticky-player-fixed';
        player.innerHTML = `
            <div class="album-art" id="albumArt">
                <div class="album-placeholder">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                </div>
            </div>

            <div class="song-info">
                <div class="song-title" id="songTitle">No Track Playing</div>
                <div class="song-artist" id="songArtist">—</div>
            </div>

            <div class="progress-section">
                <div class="progress-bar" id="progressBar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="time-info">
                    <span class="time" id="currentTime">0:00</span>
                    <span class="time" id="totalTime">0:00</span>
                </div>
            </div>

            <div class="controls">
                <button class="control-btn" id="shuffleBtn" title="Shuffle">
                    <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                </button>

                <button class="control-btn" id="prevBtn" title="Previous">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>

                <button class="control-btn play-btn" id="playBtn" title="Play/Pause">
                    <svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>

                <button class="control-btn" id="nextBtn" title="Next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>

                <button class="control-btn" id="repeatBtn" title="Repeat Off">
                    <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                </button>
            </div>

            <div class="volume-control">
                <button class="control-btn" id="volumeBtn" title="Mute/Unmute">
                    <svg id="volumeIcon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    <svg id="muteIcon" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                </button>
                <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.01" value="0.8">
            </div>

            <button class="control-btn queue-btn" id="queueBtn" title="Queue">
                <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zm17-4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/></svg>
            </button>
        `;
        
        // Create queue drawer
        const drawer = document.createElement('div');
        drawer.id = 'sticky-queue-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <span class="drawer-title">Queue</span>
                <button class="control-btn drawer-close" id="drawerClose">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div class="drawer-search">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input type="text" class="search-input" id="queueSearch" placeholder="Search songs...">
            </div>
            <div class="drawer-body" id="drawerBody"></div>
        `;
        
        // Append both to body
        document.body.appendChild(player);
        document.body.appendChild(drawer);
        
        // Add padding to body so content doesn't go under the player
        document.body.style.paddingBottom = '90px';
        
        // Apply styles after DOM is ready
        setTimeout(() => {
            this._applyStyles();
            this._applyShadow();
        }, 50);
    }

    _initAudio() {
        this._audio = document.createElement('audio');
        this._audio.crossOrigin = 'anonymous';

        this._audio.addEventListener('timeupdate', () => this._onTimeUpdate());
        this._audio.addEventListener('loadedmetadata', () => this._onMetadata());
        this._audio.addEventListener('ended', () => this._onEnded());
        this._audio.addEventListener('play', () => this._onPlay());
        this._audio.addEventListener('pause', () => this._onPause());
    }

    _bindEvents() {
        // Use setTimeout to ensure DOM is ready in body
        setTimeout(() => {
            const playBtn = document.querySelector('#playBtn');
            const prevBtn = document.querySelector('#prevBtn');
            const nextBtn = document.querySelector('#nextBtn');
            const shuffleBtn = document.querySelector('#shuffleBtn');
            const repeatBtn = document.querySelector('#repeatBtn');
            const volumeBtn = document.querySelector('#volumeBtn');
            const volumeSlider = document.querySelector('#volumeSlider');
            const progressBar = document.querySelector('#progressBar');
            const queueBtn = document.querySelector('#queueBtn');
            const drawerClose = document.querySelector('#drawerClose');
            const queueSearch = document.querySelector('#queueSearch');

            if (!playBtn) return;

            playBtn.addEventListener('click', () => this._togglePlay());
            prevBtn.addEventListener('click', () => this._prev());
            nextBtn.addEventListener('click', () => this._next());
            shuffleBtn.addEventListener('click', () => this._toggleShuffle());
            repeatBtn.addEventListener('click', () => this._toggleRepeat());
            volumeBtn.addEventListener('click', () => this._toggleMute());
            volumeSlider.addEventListener('input', (e) => this._setVolume(e.target.value));

            // Queue drawer
            if (queueBtn) queueBtn.addEventListener('click', () => this._toggleDrawer());
            if (drawerClose) drawerClose.addEventListener('click', () => this._toggleDrawer());
            if (queueSearch) queueSearch.addEventListener('input', (e) => {
                this._searchQuery = e.target.value.toLowerCase();
                this._renderDrawer();
            });

            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (this._audio.duration) {
                    this._audio.currentTime = percent * this._audio.duration;
                }
            });
            
            // Close drawer on outside click
            document.addEventListener('click', (e) => {
                const drawer = document.getElementById('sticky-queue-drawer');
                const qBtn = document.getElementById('queueBtn');
                if (drawer && this._drawerOpen && 
                    !drawer.contains(e.target) && 
                    !qBtn.contains(e.target)) {
                    this._toggleDrawer();
                }
            });
        }, 100);
    }

    _loadSong(index, autoPlay = false) {
        if (!this._songs[index]) return;

        this._currentSong = index;
        const song = this._songs[index];

        if (this._audio) {
            this._audio.src = song.audioFile || '';
            this._audio.load();
            if (autoPlay) {
                this._audio.play().catch(e => console.warn('Autoplay blocked:', e));
            }
        }

        this._updateUI(song);
    }

    _updateUI(song) {
        const title = document.querySelector('#songTitle');
        const artist = document.querySelector('#songArtist');
        const albumArt = document.querySelector('#albumArt');

        if (!title) return;

        title.textContent = song.title || 'Unknown Title';
        artist.textContent = song.artist || 'Unknown Artist';

        if (song.coverImage) {
            albumArt.innerHTML = `<img src="${song.coverImage}" alt="${song.title}">`;
        } else {
            albumArt.innerHTML = `
                <div class="album-placeholder">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                </div>
            `;
        }
    }

    _togglePlay() {
        if (!this._audio) return;
        
        if (this._audio.paused) {
            this._audio.play().catch(e => console.warn('Play error:', e));
        } else {
            this._audio.pause();
        }
    }

    _prev() {
        let index = this._shuffle 
            ? Math.floor(Math.random() * this._songs.length)
            : (this._currentSong - 1 + this._songs.length) % this._songs.length;
        this._loadSong(index, this._isPlaying);
    }

    _next() {
        let index = this._shuffle
            ? Math.floor(Math.random() * this._songs.length)
            : (this._currentSong + 1) % this._songs.length;
        this._loadSong(index, this._isPlaying);
    }

    _toggleShuffle() {
        this._shuffle = !this._shuffle;
        const btn = document.querySelector('#shuffleBtn');
        if (btn) {
            btn.classList.toggle('active', this._shuffle);
            btn.title = this._shuffle ? 'Shuffle On' : 'Shuffle Off';
        }
    }

    _toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const current = modes.indexOf(this._repeat);
        this._repeat = modes[(current + 1) % modes.length];
        
        const btn = document.querySelector('#repeatBtn');
        if (!btn) return;
        
        btn.classList.toggle('active', this._repeat !== 'none');
        
        const titles = { none: 'Repeat Off', all: 'Repeat All', one: 'Repeat One' };
        btn.title = titles[this._repeat];
        
        if (this._repeat === 'one') {
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`;
        } else {
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
        }
    }

    _toggleMute() {
        if (this._volume > 0) {
            this._lastVolume = this._volume;
            this._volume = 0;
        } else {
            this._volume = this._lastVolume || 0.8;
        }
        
        if (this._audio) this._audio.volume = this._volume;
        const slider = document.querySelector('#volumeSlider');
        if (slider) slider.value = this._volume;
        this._updateVolumeIcon();
    }

    _setVolume(value) {
        this._volume = parseFloat(value);
        if (this._audio) this._audio.volume = this._volume;
        this._updateVolumeIcon();
    }

    _updateVolumeIcon() {
        const volumeIcon = document.querySelector('#volumeIcon');
        const muteIcon = document.querySelector('#muteIcon');
        
        if (!volumeIcon || !muteIcon) return;
        
        if (this._volume === 0) {
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'block';
        } else {
            volumeIcon.style.display = 'block';
            muteIcon.style.display = 'none';
        }
    }

    _onTimeUpdate() {
        if (!this._audio || this._seeking) return;
        
        const current = this._audio.currentTime;
        const duration = this._audio.duration;
        
        if (isNaN(duration)) return;
        
        const percent = (current / duration) * 100;
        const fill = document.querySelector('#progressFill');
        const timeEl = document.querySelector('#currentTime');
        
        if (fill) fill.style.width = percent + '%';
        if (timeEl) timeEl.textContent = this._formatTime(current);
    }

    _onMetadata() {
        const duration = this._audio.duration;
        if (duration && !isNaN(duration)) {
            const timeEl = document.querySelector('#totalTime');
            if (timeEl) timeEl.textContent = this._formatTime(duration);
        }
    }

    _onEnded() {
        if (this._repeat === 'one') {
            this._audio.currentTime = 0;
            this._audio.play();
        } else if (this._repeat === 'all' || this._songs.length > 1) {
            this._next();
        }
    }

    _onPlay() {
        this._isPlaying = true;
        const playIcon = document.querySelector('#playIcon');
        const pauseIcon = document.querySelector('#pauseIcon');
        
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
    }

    _onPause() {
        this._isPlaying = false;
        const playIcon = document.querySelector('#playIcon');
        const pauseIcon = document.querySelector('#pauseIcon');
        
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
    }

    _toggleDrawer() {
        this._drawerOpen = !this._drawerOpen;
        const drawer = document.getElementById('sticky-queue-drawer');
        const qBtn = document.getElementById('queueBtn');
        
        if (drawer) drawer.classList.toggle('open', this._drawerOpen);
        if (qBtn) qBtn.classList.toggle('active', this._drawerOpen);
        
        if (this._drawerOpen) this._renderDrawer();
    }

    _renderDrawer() {
        const body = document.getElementById('drawerBody');
        if (!body) return;

        const filtered = this._songs.filter(song => {
            if (!this._searchQuery) return true;
            const title = (song.title || '').toLowerCase();
            const artist = (song.artist || '').toLowerCase();
            const album = (song.album || '').toLowerCase();
            return title.includes(this._searchQuery) || 
                   artist.includes(this._searchQuery) || 
                   album.includes(this._searchQuery);
        });

        if (filtered.length === 0) {
            body.innerHTML = '<div class="queue-empty">No songs found</div>';
            return;
        }

        body.innerHTML = filtered.map((song, i) => {
            const actualIndex = this._songs.indexOf(song);
            const isActive = actualIndex === this._currentSong;
            const artHTML = song.coverImage 
                ? `<img src="${this._escapeHtml(song.coverImage)}" alt="">`
                : '';
            
            return `
                <div class="queue-song ${isActive ? 'active' : ''}" data-index="${actualIndex}">
                    <span class="queue-num">${i + 1}</span>
                    <div class="queue-art">${artHTML}</div>
                    <div class="queue-info">
                        <div class="queue-song-title">${this._escapeHtml(song.title || 'Unknown')}</div>
                        <div class="queue-song-artist">${this._escapeHtml(song.artist || '—')}</div>
                    </div>
                    <span class="queue-duration">${song.duration || ''}</span>
                </div>
            `;
        }).join('');

        // Bind click events
        body.querySelectorAll('.queue-song').forEach(row => {
            row.addEventListener('click', () => {
                const index = parseInt(row.dataset.index);
                this._loadSong(index, true);
                this._toggleDrawer();
            });
        });
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    _applyStyles() {
        const primary = this.getAttribute('primary-color') || '#3b82f6';
        const secondary = this.getAttribute('secondary-color') || '#60a5fa';
        const bg = this.getAttribute('background-color') || '#1a1a1a';
        const textPrimary = this.getAttribute('text-primary') || '#f0f0f0';
        const textSecondary = this.getAttribute('text-secondary') || '#999999';
        const accent = this.getAttribute('accent-color') || '#3b82f6';
        const fontFamily = this.getAttribute('font-family') || 'Inter';

        // Apply to the fixed player in body
        const player = document.getElementById('sticky-player-fixed');
        if (player) {
            player.style.setProperty('--primary', primary);
            player.style.setProperty('--secondary', secondary);
            player.style.setProperty('--bg', bg);
            player.style.setProperty('--text-primary', textPrimary);
            player.style.setProperty('--text-secondary', textSecondary);
            player.style.setProperty('--accent', accent);
            player.style.setProperty('--font-family', fontFamily);
        }
    }

    _applyShadow() {
        const shadowColor = this.getAttribute('shadow-color') || '#000000';
        const shadowIntensity = parseFloat(this.getAttribute('shadow-intensity') || '30') / 100;

        // Apply to the fixed player in body
        const player = document.getElementById('sticky-player-fixed');
        if (player) {
            player.style.setProperty('--shadow-color', shadowColor);
            player.style.setProperty('--shadow-intensity', shadowIntensity);
        }
    }
}

customElements.define('sticky-music-player', StickyMusicPlayer);
