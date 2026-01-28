class ModernMusicPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.audioFiles = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.currentView = 'albums'; // albums, songs, nowPlaying
        this.currentAlbum = null;
        this.audio = new Audio();
        this.options = {
            theme: 'dark',
            customColors: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
                background: '#1f2937',
                text: '#ffffff'
            },
            playback: {
                autoplay: false,
                shuffle: false,
                repeatMode: 'none'
            }
        };
        
        // Theme presets
        this.themes = {
            dark: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
                background: '#1f2937',
                text: '#ffffff',
                cardBg: '#374151',
                hover: '#4b5563'
            },
            light: {
                primary: '#3b82f6',
                secondary: '#8b5cf6',
                background: '#f3f4f6',
                text: '#1f2937',
                cardBg: '#ffffff',
                hover: '#e5e7eb'
            },
            midnight: {
                primary: '#0ea5e9',
                secondary: '#06b6d4',
                background: '#0f172a',
                text: '#e0f2fe',
                cardBg: '#1e293b',
                hover: '#334155'
            },
            forest: {
                primary: '#10b981',
                secondary: '#059669',
                background: '#064e3b',
                text: '#d1fae5',
                cardBg: '#065f46',
                hover: '#047857'
            },
            sunset: {
                primary: '#f97316',
                secondary: '#ea580c',
                background: '#7c2d12',
                text: '#fed7aa',
                cardBg: '#9a3412',
                hover: '#c2410c'
            },
            purple: {
                primary: '#a855f7',
                secondary: '#9333ea',
                background: '#581c87',
                text: '#f3e8ff',
                cardBg: '#6b21a8',
                hover: '#7e22ce'
            },
            ocean: {
                primary: '#06b6d4',
                secondary: '#0891b2',
                background: '#164e63',
                text: '#cffafe',
                cardBg: '#155e75',
                hover: '#0e7490'
            },
            rose: {
                primary: '#f43f5e',
                secondary: '#e11d48',
                background: '#881337',
                text: '#ffe4e6',
                cardBg: '#9f1239',
                hover: '#be123c'
            }
        };
        
        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    }
    
    static get observedAttributes() {
        return ['audio-files', 'player-options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'audio-files' && newValue) {
            try {
                this.audioFiles = JSON.parse(newValue);
                console.log('✅ Audio files loaded:', this.audioFiles.length);
                this.render();
            } catch (e) {
                console.error('Error parsing audio files:', e);
            }
        } else if (name === 'player-options' && newValue) {
            try {
                const newOptions = JSON.parse(newValue);
                this.options = { ...this.options, ...newOptions };
                this.render();
            } catch (e) {
                console.error('Error parsing player options:', e);
            }
        }
    }

    connectedCallback() {
        this.render();
    }
    
    disconnectedCallback() {
        this.audio.pause();
        this.audio.src = '';
    }
    
    getActiveTheme() {
        if (this.options.theme === 'custom') {
            return {
                primary: this.options.customColors.primary,
                secondary: this.options.customColors.secondary,
                background: this.options.customColors.background,
                text: this.options.customColors.text,
                cardBg: this.adjustColor(this.options.customColors.background, 20),
                hover: this.adjustColor(this.options.customColors.background, 30)
            };
        }
        return this.themes[this.options.theme] || this.themes.dark;
    }
    
    adjustColor(color, amount) {
        const clamp = (num) => Math.min(Math.max(num, 0), 255);
        const num = parseInt(color.replace('#', ''), 16);
        const r = clamp((num >> 16) + amount);
        const g = clamp(((num >> 8) & 0x00FF) + amount);
        const b = clamp((num & 0x0000FF) + amount);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    render() {
        const theme = this.getActiveTheme();
        
        this.shadowRoot.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }

                .player-container {
                    width: 100%;
                    height: 100%;
                    background: ${theme.background};
                    color: ${theme.text};
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                /* Header */
                .player-header {
                    padding: 20px;
                    background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .header-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .music-icon {
                    width: 32px;
                    height: 32px;
                }

                /* Navigation Tabs */
                .nav-tabs {
                    display: flex;
                    gap: 5px;
                    padding: 15px 20px;
                    background: ${theme.cardBg};
                    border-bottom: 2px solid ${theme.hover};
                }

                .nav-tab {
                    background: transparent;
                    border: none;
                    color: ${theme.text};
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    opacity: 0.7;
                }

                .nav-tab:hover {
                    background: ${theme.hover};
                    opacity: 1;
                }

                .nav-tab.active {
                    background: ${theme.primary};
                    opacity: 1;
                }

                /* Content Area */
                .content-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    scrollbar-width: thin;
                    scrollbar-color: ${theme.primary} ${theme.cardBg};
                }

                .content-area::-webkit-scrollbar {
                    width: 8px;
                }

                .content-area::-webkit-scrollbar-track {
                    background: ${theme.cardBg};
                }

                .content-area::-webkit-scrollbar-thumb {
                    background: ${theme.primary};
                    border-radius: 4px;
                }

                /* Albums Grid */
                .albums-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                }

                .album-card {
                    background: ${theme.cardBg};
                    border-radius: 12px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .album-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
                    background: ${theme.hover};
                }

                .album-cover {
                    width: 100%;
                    aspect-ratio: 1;
                    background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    margin-bottom: 12px;
                    overflow: hidden;
                }

                .album-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .album-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .album-artist {
                    font-size: 14px;
                    opacity: 0.7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .album-count {
                    font-size: 12px;
                    opacity: 0.5;
                    margin-top: 4px;
                }

                /* Track List */
                .track-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .track-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .back-button {
                    background: ${theme.primary};
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .back-button:hover {
                    background: ${theme.secondary};
                    transform: translateX(-3px);
                }

                .track-item {
                    background: ${theme.cardBg};
                    padding: 15px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .track-item:hover {
                    background: ${theme.hover};
                    transform: translateX(5px);
                }

                .track-item.playing {
                    background: linear-gradient(90deg, ${theme.primary}20, ${theme.cardBg});
                    border-left: 4px solid ${theme.primary};
                }

                .track-number {
                    width: 30px;
                    text-align: center;
                    font-weight: 600;
                    opacity: 0.7;
                }

                .track-cover {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .track-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                }

                .track-info {
                    flex: 1;
                    min-width: 0;
                }

                .track-title {
                    font-size: 15px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .track-artist {
                    font-size: 13px;
                    opacity: 0.7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .track-duration {
                    font-size: 14px;
                    opacity: 0.7;
                    font-weight: 500;
                }

                /* Now Playing View */
                .now-playing {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .np-cover {
                    width: 300px;
                    height: 300px;
                    background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 120px;
                    margin-bottom: 30px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                    overflow: hidden;
                }

                .np-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .np-info {
                    text-align: center;
                    margin-bottom: 30px;
                    width: 100%;
                }

                .np-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .np-artist {
                    font-size: 18px;
                    opacity: 0.8;
                }

                /* Player Controls Bar */
                .player-controls-bar {
                    background: ${theme.cardBg};
                    padding: 20px;
                    border-top: 2px solid ${theme.hover};
                    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
                }

                .mini-player {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 15px;
                }

                .mini-cover {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .mini-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .mini-info {
                    flex: 1;
                    min-width: 0;
                }

                .mini-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .mini-artist {
                    font-size: 14px;
                    opacity: 0.7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                }

                .control-btn {
                    background: ${theme.hover};
                    border: none;
                    color: ${theme.text};
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    font-size: 18px;
                }

                .control-btn:hover {
                    background: ${theme.primary};
                    transform: scale(1.1);
                }

                .control-btn.play-btn {
                    width: 55px;
                    height: 55px;
                    background: ${theme.primary};
                    font-size: 22px;
                }

                .control-btn.play-btn:hover {
                    background: ${theme.secondary};
                    transform: scale(1.15);
                }

                .control-btn.active {
                    background: ${theme.primary};
                }

                /* Progress Bar */
                .progress-section {
                    margin-top: 15px;
                }

                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: ${theme.hover};
                    border-radius: 3px;
                    cursor: pointer;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, ${theme.primary}, ${theme.secondary});
                    border-radius: 3px;
                    transition: width 0.1s linear;
                }

                .time-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    opacity: 0.7;
                }

                /* Volume Control */
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .volume-slider {
                    width: 100px;
                    height: 4px;
                    background: ${theme.hover};
                    border-radius: 2px;
                    cursor: pointer;
                    overflow: hidden;
                }

                .volume-fill {
                    height: 100%;
                    background: ${theme.primary};
                    border-radius: 2px;
                    width: 100%;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-icon {
                    font-size: 80px;
                    opacity: 0.3;
                    margin-bottom: 20px;
                }

                .empty-text {
                    font-size: 18px;
                    opacity: 0.7;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .albums-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 15px;
                    }

                    .np-cover {
                        width: 250px;
                        height: 250px;
                        font-size: 100px;
                    }

                    .np-title {
                        font-size: 22px;
                    }

                    .np-artist {
                        font-size: 16px;
                    }

                    .controls {
                        gap: 10px;
                    }

                    .control-btn {
                        width: 40px;
                        height: 40px;
                    }

                    .control-btn.play-btn {
                        width: 50px;
                        height: 50px;
                    }
                }

                @media (max-width: 480px) {
                    .albums-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .np-cover {
                        width: 200px;
                        height: 200px;
                        font-size: 80px;
                    }

                    .mini-player {
                        gap: 12px;
                    }

                    .mini-cover {
                        width: 50px;
                        height: 50px;
                    }
                }
            </style>

            <div class="player-container">
                <!-- Header -->
                <div class="player-header">
                    <h1 class="header-title">
                        <svg class="music-icon" viewBox="0 0 24 24" fill="white">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        Music Library
                    </h1>
                </div>

                <!-- Navigation Tabs -->
                <div class="nav-tabs">
                    <button class="nav-tab ${this.currentView === 'albums' ? 'active' : ''}" id="albumsTab">Albums</button>
                    <button class="nav-tab ${this.currentView === 'songs' ? 'active' : ''}" id="songsTab">All Songs</button>
                    <button class="nav-tab ${this.currentView === 'nowPlaying' ? 'active' : ''}" id="nowPlayingTab">Now Playing</button>
                </div>

                <!-- Content Area -->
                <div class="content-area">
                    ${this.renderContent()}
                </div>

                <!-- Player Controls Bar -->
                <div class="player-controls-bar">
                    ${this.renderPlayerBar()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderContent() {
        if (this.audioFiles.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <div class="empty-text">No music files loaded</div>
                </div>
            `;
        }

        if (this.currentView === 'albums') {
            return this.renderAlbumsView();
        } else if (this.currentView === 'songs') {
            return this.renderSongsView();
        } else {
            return this.renderNowPlayingView();
        }
    }

    renderAlbumsView() {
        const albums = this.getAlbums();
        
        if (albums.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">💿</div>
                    <div class="empty-text">No albums found</div>
                </div>
            `;
        }

        return `
            <div class="albums-grid">
                ${albums.map(album => `
                    <div class="album-card" data-album="${album.name}">
                        <div class="album-cover">
                            ${album.cover ? `<img src="${album.cover}" alt="${album.name}">` : '💿'}
                        </div>
                        <div class="album-title" title="${album.name}">${album.name}</div>
                        <div class="album-artist" title="${album.artist}">${album.artist}</div>
                        <div class="album-count">${album.tracks.length} track${album.tracks.length !== 1 ? 's' : ''}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSongsView() {
        return `
            <div class="track-list">
                ${this.audioFiles.map((track, index) => `
                    <div class="track-item ${index === this.currentTrackIndex && this.isPlaying ? 'playing' : ''}" data-index="${index}">
                        <div class="track-number">${index + 1}</div>
                        <div class="track-cover">
                            ${track.coverUrl ? `<img src="${track.coverUrl}" alt="${track.title}">` : '🎵'}
                        </div>
                        <div class="track-info">
                            <div class="track-title">${track.title}</div>
                            <div class="track-artist">${track.artist}</div>
                        </div>
                        <div class="track-duration">${this.formatTime(track.duration)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderNowPlayingView() {
        if (this.audioFiles.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <div class="empty-text">No track playing</div>
                </div>
            `;
        }

        const currentTrack = this.audioFiles[this.currentTrackIndex];

        return `
            <div class="now-playing">
                <div class="np-cover">
                    ${currentTrack.coverUrl ? `<img src="${currentTrack.coverUrl}" alt="${currentTrack.title}">` : '🎵'}
                </div>
                <div class="np-info">
                    <div class="np-title">${currentTrack.title}</div>
                    <div class="np-artist">${currentTrack.artist}</div>
                </div>
            </div>
        `;
    }

    renderPlayerBar() {
        if (this.audioFiles.length === 0) {
            return '<div style="text-align: center; opacity: 0.5;">No tracks loaded</div>';
        }

        const currentTrack = this.audioFiles[this.currentTrackIndex];
        const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;

        return `
            <div class="mini-player">
                <div class="mini-cover">
                    ${currentTrack.coverUrl ? `<img src="${currentTrack.coverUrl}" alt="${currentTrack.title}">` : '🎵'}
                </div>
                <div class="mini-info">
                    <div class="mini-title">${currentTrack.title}</div>
                    <div class="mini-artist">${currentTrack.artist}</div>
                </div>
                
                <div class="controls">
                    <button class="control-btn ${this.options.playback.shuffle ? 'active' : ''}" id="shuffleBtn" title="Shuffle">
                        🔀
                    </button>
                    <button class="control-btn" id="prevBtn" title="Previous">
                        ⏮️
                    </button>
                    <button class="control-btn play-btn" id="playBtn" title="${this.isPlaying ? 'Pause' : 'Play'}">
                        ${this.isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button class="control-btn" id="nextBtn" title="Next">
                        ⏭️
                    </button>
                    <button class="control-btn ${this.options.playback.repeatMode !== 'none' ? 'active' : ''}" id="repeatBtn" title="Repeat">
                        ${this.options.playback.repeatMode === 'one' ? '🔂' : '🔁'}
                    </button>
                </div>

                <div class="volume-control">
                    <span>🔊</span>
                    <div class="volume-slider" id="volumeSlider">
                        <div class="volume-fill" style="width: ${this.audio.volume * 100}%"></div>
                    </div>
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-bar" id="progressBar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="time-info">
                    <span id="currentTime">${this.formatTime(this.audio.currentTime)}</span>
                    <span id="duration">${this.formatTime(this.audio.duration || 0)}</span>
                </div>
            </div>
        `;
    }

    getAlbums() {
        const albumMap = new Map();
        
        this.audioFiles.forEach(track => {
            const albumName = track.album || 'Unknown Album';
            if (!albumMap.has(albumName)) {
                albumMap.set(albumName, {
                    name: albumName,
                    artist: track.artist,
                    cover: track.coverUrl,
                    tracks: []
                });
            }
            albumMap.get(albumName).tracks.push(track);
        });

        return Array.from(albumMap.values());
    }

    attachEventListeners() {
        // Tab navigation
        const albumsTab = this.shadowRoot.getElementById('albumsTab');
        const songsTab = this.shadowRoot.getElementById('songsTab');
        const nowPlayingTab = this.shadowRoot.getElementById('nowPlayingTab');

        if (albumsTab) albumsTab.addEventListener('click', () => this.switchView('albums'));
        if (songsTab) songsTab.addEventListener('click', () => this.switchView('songs'));
        if (nowPlayingTab) nowPlayingTab.addEventListener('click', () => this.switchView('nowPlaying'));

        // Album cards
        this.shadowRoot.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', () => {
                const albumName = card.dataset.album;
                this.openAlbum(albumName);
            });
        });

        // Track items
        this.shadowRoot.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.playTrack(index);
            });
        });

        // Back button
        const backBtn = this.shadowRoot.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.switchView('albums'));
        }

        // Player controls
        const playBtn = this.shadowRoot.getElementById('playBtn');
        const prevBtn = this.shadowRoot.getElementById('prevBtn');
        const nextBtn = this.shadowRoot.getElementById('nextBtn');
        const shuffleBtn = this.shadowRoot.getElementById('shuffleBtn');
        const repeatBtn = this.shadowRoot.getElementById('repeatBtn');

        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousTrack());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextTrack());
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        if (repeatBtn) repeatBtn.addEventListener('click', () => this.cycleRepeat());

        // Progress bar
        const progressBar = this.shadowRoot.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            });
        }

        // Volume slider
        const volumeSlider = this.shadowRoot.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('click', (e) => {
                const rect = volumeSlider.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.volume = Math.max(0, Math.min(1, percent));
                this.updateVolume();
            });
        }
    }

    switchView(view) {
        this.currentView = view;
        this.render();
    }

    openAlbum(albumName) {
        this.currentAlbum = albumName;
        const albums = this.getAlbums();
        const album = albums.find(a => a.name === albumName);
        
        if (!album) return;

        const content = this.shadowRoot.querySelector('.content-area');
        content.innerHTML = `
            <div class="track-list">
                <div class="track-header">
                    <button class="back-button" id="backBtn">
                        ← Back to Albums
                    </button>
                    <div>
                        <h2 style="margin: 0;">${album.name}</h2>
                        <p style="margin: 5px 0 0; opacity: 0.7;">${album.artist}</p>
                    </div>
                </div>
                ${album.tracks.map((track, index) => {
                    const globalIndex = this.audioFiles.indexOf(track);
                    return `
                        <div class="track-item ${globalIndex === this.currentTrackIndex && this.isPlaying ? 'playing' : ''}" data-index="${globalIndex}">
                            <div class="track-number">${index + 1}</div>
                            <div class="track-cover">
                                ${track.coverUrl ? `<img src="${track.coverUrl}" alt="${track.title}">` : '🎵'}
                            </div>
                            <div class="track-info">
                                <div class="track-title">${track.title}</div>
                                <div class="track-artist">${track.artist}</div>
                            </div>
                            <div class="track-duration">${this.formatTime(track.duration)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Re-attach listeners
        const backBtn = content.querySelector('#backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.switchView('albums'));
        }

        content.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.playTrack(index);
            });
        });
    }

    playTrack(index) {
        if (index < 0 || index >= this.audioFiles.length) return;
        
        this.currentTrackIndex = index;
        const track = this.audioFiles[index];
        
        this.audio.src = track.url;
        this.audio.play();
        this.isPlaying = true;
        
        this.render();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            if (!this.audio.src && this.audioFiles.length > 0) {
                this.audio.src = this.audioFiles[0].url;
            }
            this.audio.play();
        }
        this.isPlaying = !this.isPlaying;
        this.render();
    }

    previousTrack() {
        if (this.currentTrackIndex > 0) {
            this.playTrack(this.currentTrackIndex - 1);
        } else {
            this.playTrack(this.audioFiles.length - 1);
        }
    }

    nextTrack() {
        if (this.options.playback.shuffle) {
            const randomIndex = Math.floor(Math.random() * this.audioFiles.length);
            this.playTrack(randomIndex);
        } else if (this.currentTrackIndex < this.audioFiles.length - 1) {
            this.playTrack(this.currentTrackIndex + 1);
        } else {
            this.playTrack(0);
        }
    }

    toggleShuffle() {
        this.options.playback.shuffle = !this.options.playback.shuffle;
        this.render();
    }

    cycleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.options.playback.repeatMode);
        this.options.playback.repeatMode = modes[(currentIndex + 1) % modes.length];
        this.render();
    }

    handleTrackEnd() {
        if (this.options.playback.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.options.playback.repeatMode === 'all' || this.currentTrackIndex < this.audioFiles.length - 1) {
            this.nextTrack();
        } else {
            this.isPlaying = false;
            this.render();
        }
    }

    updateProgress() {
        const progressFill = this.shadowRoot.querySelector('.progress-fill');
        const currentTimeEl = this.shadowRoot.getElementById('currentTime');
        
        if (progressFill && this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        const durationEl = this.shadowRoot.getElementById('duration');
        if (durationEl) {
            durationEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateVolume() {
        const volumeFill = this.shadowRoot.querySelector('.volume-fill');
        if (volumeFill) {
            volumeFill.style.width = `${this.audio.volume * 100}%`;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

customElements.define('modern-music-player', ModernMusicPlayer);
