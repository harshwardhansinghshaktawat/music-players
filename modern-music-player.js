class ModernMusicPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._audioElement = null;
        this._audioContext = null;
        this._analyser = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._isShuffled = false;
        this._isRepeat = false;
        this._currentView = 'albums'; // 'albums' or 'songs'
        this._selectedAlbum = null;
        this._animationId = null;
        this._allSongs = []; // Store all songs separately
        
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap');
                
                :host {
                    --primary-color: #6366f1;
                    --secondary-color: #4f46e5;
                    --background-color: #0f172a;
                    --surface-color: #1e293b;
                    --surface-light: #334155;
                    --text-primary: #f1f5f9;
                    --text-secondary: #94a3b8;
                    --text-muted: #64748b;
                    --accent-color: #f43f5e;
                    --success-color: #10b981;
                    --border-color: #334155;
                    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
                    --radius-sm: 0.375rem;
                    --radius-md: 0.5rem;
                    --radius-lg: 0.75rem;
                    --radius-xl: 1rem;
                    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    
                    display: block;
                    width: 100%;
                    height: 100%;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    box-sizing: border-box;
                }
                
                *, *::before, *::after {
                    box-sizing: inherit;
                }
                
                .player-container {
                    width: 100%;
                    height: 100%;
                    background: var(--background-color);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-xl);
                    position: relative;
                }
                
                /* Header */
                .player-header {
                    padding: 1.5rem 2rem;
                    background: var(--surface-color);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .player-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .player-title svg {
                    width: 2rem;
                    height: 2rem;
                    fill: var(--primary-color);
                }
                
                .player-title h1 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--primary-color);
                }
                
                /* Main Content Area */
                .player-main {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                    min-height: 0;
                }
                
                /* Sidebar/Browser */
                .browser-sidebar {
                    width: 320px;
                    background: var(--surface-color);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .browser-header {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                    background: var(--background-color);
                    padding: 0.25rem;
                    border-radius: var(--radius-md);
                }
                
                .view-toggle-btn {
                    flex: 1;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: none;
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                
                .view-toggle-btn svg {
                    width: 1rem;
                    height: 1rem;
                    fill: currentColor;
                }
                
                .view-toggle-btn.active {
                    background: var(--primary-color);
                    color: white;
                }
                
                .browser-search {
                    margin-top: 1rem;
                    position: relative;
                }
                
                .browser-search input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    background: var(--background-color);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    transition: var(--transition);
                }
                
                .browser-search input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
                
                .browser-search svg {
                    position: absolute;
                    left: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 1rem;
                    height: 1rem;
                    fill: var(--text-muted);
                    pointer-events: none;
                }
                
                .browser-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }
                
                /* Custom Scrollbar */
                .browser-content::-webkit-scrollbar {
                    width: 8px;
                }
                
                .browser-content::-webkit-scrollbar-track {
                    background: var(--background-color);
                }
                
                .browser-content::-webkit-scrollbar-thumb {
                    background: var(--surface-light);
                    border-radius: 4px;
                }
                
                .browser-content::-webkit-scrollbar-thumb:hover {
                    background: var(--border-color);
                }
                
                /* Album Cards */
                .albums-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 1rem;
                }
                
                .album-card {
                    background: var(--background-color);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 1rem;
                    cursor: pointer;
                    transition: var(--transition);
                    text-align: center;
                }
                
                .album-card:hover {
                    border-color: var(--primary-color);
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                }
                
                .album-card.active {
                    border-color: var(--primary-color);
                    background: var(--surface-light);
                }
                
                .album-cover {
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: var(--radius-md);
                    background: var(--surface-light);
                    margin-bottom: 0.75rem;
                    overflow: hidden;
                    position: relative;
                }
                
                .album-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .album-cover-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--primary-color);
                }
                
                .album-cover-placeholder svg {
                    width: 3rem;
                    height: 3rem;
                    fill: white;
                    opacity: 0.5;
                }
                
                .album-info {
                    text-align: left;
                }
                
                .album-name {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--text-primary);
                    margin-bottom: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .album-artist {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .album-count {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 0.5rem;
                }
                
                .album-count svg {
                    width: 0.875rem;
                    height: 0.875rem;
                    fill: currentColor;
                }
                
                /* Song List */
                .songs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .song-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: var(--background-color);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: var(--transition);
                }
                
                .song-item:hover {
                    background: var(--surface-light);
                    border-color: var(--primary-color);
                }
                
                .song-item.active {
                    background: var(--surface-light);
                    border-color: var(--primary-color);
                }
                
                .song-cover {
                    width: 3rem;
                    height: 3rem;
                    border-radius: var(--radius-sm);
                    flex-shrink: 0;
                    overflow: hidden;
                    background: var(--surface-light);
                }
                
                .song-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .song-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .song-title {
                    font-weight: 500;
                    font-size: 0.875rem;
                    color: var(--text-primary);
                    margin-bottom: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .song-artist {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .song-duration {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-variant-numeric: tabular-nums;
                }
                
                /* Now Playing */
                .now-playing {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .now-playing-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem 2rem;
                    overflow-y: auto;
                }
                
                .current-cover-container {
                    width: 100%;
                    max-width: 400px;
                    aspect-ratio: 1;
                    margin-bottom: 2rem;
                    position: relative;
                }
                
                .current-cover {
                    width: 100%;
                    height: 100%;
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    box-shadow: var(--shadow-xl);
                    background: var(--surface-color);
                    position: relative;
                }
                
                .current-cover::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: var(--primary-color);
                    opacity: 0;
                    transition: var(--transition);
                }
                
                .current-cover.playing::before {
                    opacity: 0.2;
                }
                
                .current-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .visualizer-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 80px;
                    background: var(--background-color);
                    opacity: 0.9;
                    display: flex;
                    align-items: flex-end;
                    padding: 1rem;
                }
                
                .mini-visualizer {
                    width: 100%;
                    height: 40px;
                }
                
                .current-info {
                    text-align: center;
                    width: 100%;
                    max-width: 500px;
                }
                
                .current-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                    line-height: 1.2;
                }
                
                .current-artist {
                    font-size: 1.25rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.5rem;
                }
                
                .current-album {
                    font-size: 1rem;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                }
                
                .current-genre {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 999px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 2rem;
                }
                
                /* Links Section */
                .current-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                
                .link-btn {
                    padding: 0.625rem 1.25rem;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                }
                
                .link-btn:hover {
                    background: var(--surface-light);
                    border-color: var(--primary-color);
                    color: var(--text-primary);
                    transform: translateY(-2px);
                }
                
                .link-btn svg {
                    width: 1.125rem;
                    height: 1.125rem;
                    fill: currentColor;
                }
                
                /* Controls Footer */
                .controls-footer {
                    background: var(--surface-color);
                    border-top: 1px solid var(--border-color);
                    padding: 1.5rem 2rem;
                }
                
                .progress-section {
                    margin-bottom: 1.5rem;
                }
                
                .progress-bar-container {
                    position: relative;
                    height: 6px;
                    background: var(--background-color);
                    border-radius: 3px;
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                }
                
                .progress-bar-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 3px;
                    transition: width 0.1s linear;
                }
                
                .progress-handle {
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 14px;
                    height: 14px;
                    background: white;
                    border: 2px solid var(--primary-color);
                    border-radius: 50%;
                    opacity: 0;
                    transition: var(--transition);
                    box-shadow: var(--shadow-md);
                }
                
                .progress-bar-container:hover .progress-handle {
                    opacity: 1;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-variant-numeric: tabular-nums;
                }
                
                .controls-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 2rem;
                }
                
                .controls-left,
                .controls-right {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .controls-center {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .control-btn {
                    width: 2.5rem;
                    height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: var(--transition);
                    border-radius: var(--radius-md);
                }
                
                .control-btn:hover {
                    color: var(--text-primary);
                    background: var(--surface-light);
                }
                
                .control-btn.active {
                    color: var(--primary-color);
                }
                
                .control-btn svg {
                    width: 1.25rem;
                    height: 1.25rem;
                    fill: currentColor;
                }
                
                .play-btn {
                    width: 3.5rem;
                    height: 3.5rem;
                    background: var(--primary-color);
                    color: white;
                    box-shadow: var(--shadow-lg);
                }
                
                .play-btn:hover {
                    background: var(--secondary-color);
                    transform: scale(1.05);
                }
                
                .play-btn svg {
                    width: 1.5rem;
                    height: 1.5rem;
                }
                
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    min-width: 120px;
                }
                
                .volume-slider {
                    flex: 1;
                    -webkit-appearance: none;
                    height: 4px;
                    background: var(--background-color);
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: var(--transition);
                }
                
                .volume-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                
                .volume-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    background: var(--primary-color);
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: var(--transition);
                }
                
                .volume-slider::-moz-range-thumb:hover {
                    transform: scale(1.2);
                }
                
                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 3rem 2rem;
                    color: var(--text-muted);
                }
                
                .empty-state svg {
                    width: 4rem;
                    height: 4rem;
                    fill: var(--text-muted);
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }
                
                .empty-state h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 0.5rem;
                }
                
                .back-btn {
                    margin-bottom: 1rem;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--background-color);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                
                .back-btn:hover {
                    background: var(--surface-light);
                    color: var(--text-primary);
                }
                
                .back-btn svg {
                    width: 1rem;
                    height: 1rem;
                    fill: currentColor;
                    transform: rotate(180deg);
                }
                
                /* Responsive */
                @media (max-width: 1024px) {
                    .browser-sidebar {
                        width: 280px;
                    }
                    
                    .albums-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                @media (max-width: 768px) {
                    .player-main {
                        flex-direction: column;
                    }
                    
                    .browser-sidebar {
                        width: 100%;
                        max-height: 40%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                    }
                    
                    .now-playing-content {
                        padding: 2rem 1.5rem;
                    }
                    
                    .current-cover-container {
                        max-width: 300px;
                        margin-bottom: 1.5rem;
                    }
                    
                    .current-title {
                        font-size: 1.5rem;
                    }
                    
                    .current-artist {
                        font-size: 1rem;
                    }
                    
                    .controls-main {
                        gap: 1rem;
                    }
                    
                    .controls-footer {
                        padding: 1rem 1.5rem;
                    }
                }
                
                @media (max-width: 480px) {
                    .player-header {
                        padding: 1rem 1.5rem;
                    }
                    
                    .player-title h1 {
                        font-size: 1.25rem;
                    }
                    
                    .controls-left,
                    .controls-right {
                        gap: 0.5rem;
                    }
                    
                    .control-btn {
                        width: 2rem;
                        height: 2rem;
                    }
                    
                    .play-btn {
                        width: 3rem;
                        height: 3rem;
                    }
                    
                    .volume-control {
                        min-width: 80px;
                    }
                }
            </style>
            
            <div class="player-container">
                <!-- Header -->
                <div class="player-header">
                    <div class="player-title">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        <h1>Music Player</h1>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="player-main">
                    <!-- Browser Sidebar -->
                    <div class="browser-sidebar">
                        <div class="browser-header">
                            <div class="view-toggle">
                                <button class="view-toggle-btn active" data-view="albums">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                    <span>Albums</span>
                                </button>
                                <button class="view-toggle-btn" data-view="songs">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                                    </svg>
                                    <span>All Songs</span>
                                </button>
                            </div>
                            <div class="browser-search">
                                <svg viewBox="0 0 24 24">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                                <input type="text" placeholder="Search music..." class="search-input">
                            </div>
                        </div>
                        <div class="browser-content">
                            <!-- Content will be dynamically rendered here -->
                        </div>
                    </div>
                    
                    <!-- Now Playing -->
                    <div class="now-playing">
                        <div class="now-playing-content">
                            <div class="empty-state">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                                <h3>No Song Playing</h3>
                                <p>Select a song from the library to start playing</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Controls Footer -->
                <div class="controls-footer">
                    <div class="progress-section">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill"></div>
                            <div class="progress-handle"></div>
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
                                    <svg class="mute-icon" viewBox="0 0 24 24" style="display: none;">
                                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                    </svg>
                                </button>
                                <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.8">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this._shadow.appendChild(this._root);
        this._setupEventListeners();
    }
    
    static get observedAttributes() {
        return ['player-data', 'player-name', 'primary-color', 'secondary-color', 'background-color', 
                'text-primary', 'text-secondary', 'accent-color', 'surface-color', 'title-font-family', 'text-font-family'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) return;
        
        if (name === 'player-data' && newValue) {
            try {
                this._playerData = JSON.parse(newValue);
                this._allSongs = this._playerData.songs || [];
                this._processAlbums();
                this._render();
            } catch (e) {
                console.error('Error parsing player data:', e);
            }
        } else if (name === 'player-name' && newValue) {
            const titleElement = this._shadow.querySelector('.player-title h1');
            if (titleElement) {
                titleElement.textContent = newValue;
            }
        } else if (name.includes('color') || name.includes('font')) {
            this._updateStyles();
        }
    }
    
    connectedCallback() {
        this._loadWaveSurferScript().then(() => {
            this._initializeAudio();
        });
        
        if (this._playerData) {
            this._render();
        }
    }
    
    disconnectedCallback() {
        this._cleanup();
    }
    
    _processAlbums() {
        if (!this._playerData || !this._playerData.songs) return;
        
        // Group songs by album
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
    
    _updateStyles() {
        const primaryColor = this.getAttribute('primary-color');
        const secondaryColor = this.getAttribute('secondary-color');
        const backgroundColor = this.getAttribute('background-color');
        const surfaceColor = this.getAttribute('surface-color');
        const textPrimary = this.getAttribute('text-primary');
        const textSecondary = this.getAttribute('text-secondary');
        const accentColor = this.getAttribute('accent-color');
        
        if (primaryColor) this.style.setProperty('--primary-color', primaryColor);
        if (secondaryColor) this.style.setProperty('--secondary-color', secondaryColor);
        if (backgroundColor) this.style.setProperty('--background-color', backgroundColor);
        if (surfaceColor) this.style.setProperty('--surface-color', surfaceColor);
        if (textPrimary) this.style.setProperty('--text-primary', textPrimary);
        if (textSecondary) this.style.setProperty('--text-secondary', textSecondary);
        if (accentColor) this.style.setProperty('--accent-color', accentColor);
    }
    
    _loadWaveSurferScript() {
        return new Promise((resolve) => {
            if (window.WaveSurfer) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/6.6.4/wavesurfer.min.js';
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
    }
    
    _initializeAudio() {
        this._audioElement = document.createElement('audio');
        this._audioElement.crossOrigin = 'anonymous';
        
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this._analyser = this._audioContext.createAnalyser();
            this._analyser.fftSize = 256;
            this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
            
            const source = this._audioContext.createMediaElementSource(this._audioElement);
            source.connect(this._analyser);
            this._analyser.connect(this._audioContext.destination);
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
            this._startVisualization();
        });
        this._audioElement.addEventListener('pause', () => {
            this._isPlaying = false;
            this._updatePlayButton();
            this._stopVisualization();
        });
    }
    
    _setupEventListeners() {
        // View toggle
        this._shadow.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._currentView = btn.dataset.view;
                this._selectedAlbum = null; // Reset selected album when switching views
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
        
        // Play/Pause
        this._shadow.querySelector('.play-btn').addEventListener('click', () => {
            // If no song is loaded, load and play the first song
            if (!this._currentPlaylist || this._currentSongIndex === undefined) {
                this._playFirstSong();
            } else if (this._audioElement) {
                if (this._audioElement.paused) {
                    this._audioElement.play();
                } else {
                    this._audioElement.pause();
                }
            }
        });
        
        // Previous/Next
        this._shadow.querySelector('.prev-btn').addEventListener('click', () => this._playPrevious());
        this._shadow.querySelector('.next-btn').addEventListener('click', () => this._playNext());
        
        // Shuffle/Repeat
        this._shadow.querySelector('.shuffle-btn').addEventListener('click', () => {
            this._isShuffled = !this._isShuffled;
            this._shadow.querySelector('.shuffle-btn').classList.toggle('active', this._isShuffled);
        });
        
        this._shadow.querySelector('.repeat-btn').addEventListener('click', () => {
            this._isRepeat = !this._isRepeat;
            this._shadow.querySelector('.repeat-btn').classList.toggle('active', this._isRepeat);
        });
        
        // Volume
        const volumeSlider = this._shadow.querySelector('.volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            this._currentVolume = parseFloat(e.target.value);
            if (this._audioElement) {
                this._audioElement.volume = this._currentVolume;
            }
            this._updateVolumeIcon();
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
            this._updateVolumeIcon();
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
    
    _playFirstSong() {
        // Determine which playlist to use
        let playlist = [];
        
        if (this._selectedAlbum && this._selectedAlbum.songs) {
            // If an album is selected, play from that album
            playlist = this._selectedAlbum.songs;
        } else if (this._allSongs && this._allSongs.length > 0) {
            // Otherwise, play from all songs
            playlist = this._allSongs;
        }
        
        if (playlist.length > 0) {
            this._playSong(0, playlist);
        }
    }
    
    _render() {
        this._renderBrowser();
        this._updateNowPlaying();
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
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <h3>No Albums</h3>
                    <p>No albums found in your library</p>
                </div>
            `;
            return;
        }
        
        let filteredAlbums = this._albums;
        if (this._searchQuery) {
            filteredAlbums = this._albums.filter(album => 
                album.name.toLowerCase().includes(this._searchQuery) ||
                album.artist.toLowerCase().includes(this._searchQuery) ||
                (album.genre && album.genre.toLowerCase().includes(this._searchQuery))
            );
        }
        
        container.innerHTML = `
            <div class="albums-grid">
                ${filteredAlbums.map(album => `
                    <div class="album-card ${this._selectedAlbum?.name === album.name ? 'active' : ''}" data-album="${this._escapeHtml(album.name)}">
                        <div class="album-cover">
                            ${album.coverImage ? 
                                `<img src="${album.coverImage}" alt="${this._escapeHtml(album.name)}">` :
                                `<div class="album-cover-placeholder">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                </div>`
                            }
                        </div>
                        <div class="album-info">
                            <div class="album-name">${this._escapeHtml(album.name)}</div>
                            <div class="album-artist">${this._escapeHtml(album.artist)}</div>
                            <div class="album-count">
                                <svg viewBox="0 0 24 24">
                                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                                </svg>
                                ${album.songs.length} ${album.songs.length === 1 ? 'song' : 'songs'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
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
        
        // FIX: Show all songs if no album is selected, otherwise show album songs
        if (this._selectedAlbum) {
            songs = this._selectedAlbum.songs;
        } else {
            songs = this._allSongs;
        }
        
        if (this._searchQuery) {
            songs = songs.filter(song =>
                song.title.toLowerCase().includes(this._searchQuery) ||
                song.artist.toLowerCase().includes(this._searchQuery) ||
                (song.album && song.album.toLowerCase().includes(this._searchQuery)) ||
                (song.genre && song.genre.toLowerCase().includes(this._searchQuery))
            );
        }
        
        if (songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24">
                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                    </svg>
                    <h3>No Songs</h3>
                    <p>No songs found</p>
                </div>
            `;
            return;
        }
        
        // Add back button if album is selected
        const backButton = this._selectedAlbum ? `
            <button class="back-btn" id="back-to-albums">
                <svg viewBox="0 0 24 24">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
                <span>Back to Albums</span>
            </button>
        ` : '';
        
        container.innerHTML = `
            ${backButton}
            <div class="songs-list">
                ${songs.map((song, index) => {
                    // Find the actual index in the current playlist
                    const actualIndex = this._currentPlaylist?.indexOf(song) ?? -1;
                    const isActive = this._currentPlaylist && actualIndex === this._currentSongIndex;
                    
                    return `
                        <div class="song-item ${isActive ? 'active' : ''}" data-index="${index}">
                            <div class="song-cover">
                                ${song.coverImage ? 
                                    `<img src="${song.coverImage}" alt="${this._escapeHtml(song.title)}">` :
                                    ''
                                }
                            </div>
                            <div class="song-info">
                                <div class="song-title">${this._escapeHtml(song.title)}</div>
                                <div class="song-artist">${this._escapeHtml(song.artist)}</div>
                            </div>
                            <div class="song-duration">${song.duration || '0:00'}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // Back button handler
        const backBtn = container.querySelector('#back-to-albums');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this._selectedAlbum = null;
                this._currentView = 'albums';
                this._updateViewToggle();
                this._renderBrowser();
            });
        }
        
        // Song click handlers
        container.querySelectorAll('.song-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this._playSong(index, songs);
            });
        });
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
        }
        
        this._updateNowPlaying();
        this._renderBrowser(); // Update active state
    }
    
    _updateNowPlaying() {
        const nowPlayingContent = this._shadow.querySelector('.now-playing-content');
        
        if (!this._currentPlaylist || this._currentSongIndex === undefined) {
            nowPlayingContent.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <h3>No Song Playing</h3>
                    <p>Select a song from the library to start playing</p>
                </div>
            `;
            return;
        }
        
        const song = this._currentPlaylist[this._currentSongIndex];
        
        const streamingLinks = song.streamingLinks || {};
        const artistSocial = song.artistSocial || {};
        
        const links = [];
        if (streamingLinks.spotify) links.push({ name: 'Spotify', url: streamingLinks.spotify, icon: 'spotify' });
        if (streamingLinks.apple) links.push({ name: 'Apple Music', url: streamingLinks.apple, icon: 'apple' });
        if (streamingLinks.youtube) links.push({ name: 'YouTube', url: streamingLinks.youtube, icon: 'youtube' });
        if (streamingLinks.soundcloud) links.push({ name: 'SoundCloud', url: streamingLinks.soundcloud, icon: 'soundcloud' });
        if (song.purchaseLink) links.push({ name: 'Buy Now', url: song.purchaseLink, icon: 'cart' });
        
        nowPlayingContent.innerHTML = `
            <div class="current-cover-container">
                <div class="current-cover ${this._isPlaying ? 'playing' : ''}">
                    ${song.coverImage ? 
                        `<img src="${song.coverImage}" alt="${this._escapeHtml(song.title)}">` :
                        `<div class="album-cover-placeholder">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                            </svg>
                        </div>`
                    }
                    <div class="visualizer-overlay">
                        <canvas class="mini-visualizer"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="current-info">
                <div class="current-title">${this._escapeHtml(song.title)}</div>
                <div class="current-artist">${this._escapeHtml(song.artist)}</div>
                <div class="current-album">${this._escapeHtml(song.album || '')}</div>
                ${song.genre ? `<div class="current-genre">${this._escapeHtml(song.genre)}</div>` : ''}
                
                ${links.length > 0 ? `
                    <div class="current-links">
                        ${links.map(link => `
                            <a href="${link.url}" target="_blank" class="link-btn">
                                ${this._getLinkIcon(link.icon)}
                                <span>${link.name}</span>
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Initialize mini visualizer canvas
        this._miniCanvas = nowPlayingContent.querySelector('.mini-visualizer');
        if (this._miniCanvas) {
            this._miniCanvasCtx = this._miniCanvas.getContext('2d');
            this._miniCanvas.width = this._miniCanvas.offsetWidth;
            this._miniCanvas.height = this._miniCanvas.offsetHeight;
        }
    }
    
    _getLinkIcon(type) {
        const icons = {
            spotify: '<svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
            apple: '<svg viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
            youtube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            soundcloud: '<svg viewBox="0 0 24 24"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.105.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.093-.09-.093m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.075.075.135.15.135.074 0 .135-.06.15-.135l.225-2.55-.225-2.623c0-.06-.06-.135-.135-.135l-.031-.017zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444.033.015zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.225-.225-.225m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456-.016.015zm.749-.134c-.135 0-.255.119-.255.254l-.15 5.322.15 2.473c0 .15.12.255.255.255s.255-.105.255-.255l.15-2.473-.15-5.307c0-.148-.12-.254-.271-.254l.016-.015zm.749-.15c-.15 0-.285.135-.285.285L9.7 14.77l.135 2.458c0 .149.135.27.285.27s.27-.12.27-.27l.15-2.458-.15-5.03c0-.15-.135-.27-.285-.27m1.005.166c-.164 0-.284.135-.284.285l-.121 4.695.121 2.428c0 .15.12.285.284.285.15 0 .285-.135.285-.285l.135-2.428-.135-4.695c0-.165-.135-.285-.284-.285m.75-.045c-.165 0-.3.135-.3.3l-.105 4.725.105 2.4c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.12-2.4-.12-4.725c-.014-.164-.149-.3-.3-.3m.884-.05c-.194 0-.315.135-.315.345l-.09 4.78.09 2.4c0 .164.136.314.315.314.165 0 .314-.15.314-.314l.091-2.4-.091-4.78c0-.194-.164-.345-.314-.345m.914-.095c-.196 0-.346.149-.346.345L14.6 14.725l.076 2.383c0 .209.15.36.345.36.21 0 .36-.165.36-.36l.09-2.403-.09-4.702c0-.209-.165-.36-.36-.36m1.035-.074c-.21 0-.376.18-.376.375l-.075 4.46.075 2.374c0 .194.166.374.376.374.195 0 .375-.18.375-.374l.074-2.374-.074-4.46c0-.21-.18-.376-.375-.376m1.05-.595c-.061 0-.105.045-.105.09l-.061 5.297.06 2.335c0 .06.045.104.106.104.059 0 .104-.044.104-.104l.075-2.335-.074-5.327c0-.046-.045-.075-.105-.075m.509.137c-.075 0-.135.06-.135.135l-.045 5.172.045 2.321c0 .074.06.15.135.15.09 0 .149-.076.149-.15l.06-2.321-.06-5.172c0-.074-.06-.135-.149-.135l.015-.007zm.958.137c-.103 0-.164.08-.164.165l-.046 5.041.047 2.335c0 .105.074.18.164.18.105 0 .18-.075.18-.18l.052-2.335-.052-5.04c0-.09-.075-.166-.179-.166m.904-.061c-.12 0-.194.09-.194.18l-.029 5.017.029 2.329c0 .104.074.18.194.18.109 0 .18-.075.193-.18l.052-2.329-.044-5.033c0-.09-.089-.165-.193-.165l-.008.001zm1.214.196c-.09 0-.18.08-.18.18l-.044 4.856.045 2.321c0 .104.09.18.18.18.104 0 .18-.076.189-.18l.029-2.321-.029-4.871c0-.107-.088-.178-.19-.165zm1.169.815c0-.09-.082-.165-.18-.165-.089 0-.164.075-.171.164l-.045 4.071.046 2.336c0 .09.075.164.18.164.094 0 .179-.074.18-.164l.044-2.336-.053-4.07zm1.349-.627c-.119 0-.209.084-.209.203l-.044 4.5.044 2.307c0 .119.105.209.209.209.104 0 .179-.09.194-.209l.052-2.307-.052-4.5c0-.12-.09-.204-.194-.204l.001.001zm.825-.209c-.135 0-.219.09-.224.224l-.046 4.513.046 2.294c.005.134.089.224.225.224.119 0 .224-.09.229-.224l.044-2.294-.044-4.513c0-.134-.109-.225-.229-.225m.875-.118c-.149 0-.23.105-.234.233l-.044 4.605.044 2.257c0 .133.09.239.234.239.136 0 .24-.105.244-.24l.046-2.255-.044-4.606c-.009-.134-.113-.237-.245-.233h-.001zm.988.008c-.146 0-.255.105-.255.254l-.029 4.597.029 2.254c0 .15.109.254.255.254.149 0 .254-.104.259-.254l.03-2.254-.03-4.596c-.005-.16-.114-.255-.259-.255m1.004.385c-.03-.12-.135-.215-.255-.215-.135 0-.245.9-.255.226l-.03 4.222.03 2.241c.01.135.12.226.255.226.12 0 .226-.09.255-.226l.03-2.24-.03-4.222v-.012zm.764-.23c-.164 0-.284.12-.284.284l-.03 4.438.03 2.227c0 .164.12.284.284.284.149 0 .284-.12.284-.284l.029-2.227-.029-4.438c0-.165-.135-.285-.284-.285m.929-.126c-.18 0-.301.135-.301.3l-.03 4.277.03 2.176c0 .18.135.301.301.301.164 0 .3-.12.3-.301l.03-2.176-.03-4.277c0-.18-.136-.3-.3-.3m1.094-.329c-.195 0-.315.142-.315.33l-.03 4.264.03 2.169c0 .189.12.315.315.315.165 0 .314-.126.314-.315l.03-2.17-.03-4.262c0-.189-.133-.331-.314-.331m.598-.15c-.21 0-.345.149-.345.354l-.03 4.408.03 2.143c0 .194.149.344.345.344.209 0 .33-.149.33-.344l.045-2.143-.044-4.408c0-.21-.136-.345-.331-.345v-.01zM2.072 10.81c-.051 0-.09.039-.096.09l-.249 3.04.264 2.971c.006.052.045.09.096.09s.09-.038.096-.09l.28-2.971-.28-3.04c-.006-.051-.045-.09-.096-.09m-.446-.581c-.045 0-.09.03-.105.074L1.3 13.404l.224 2.881c.015.045.06.074.105.074.047 0 .09-.029.1-.074l.255-2.881-.257-3.091c-.008-.045-.05-.074-.1-.074m3.502-4.524c-.004-.06-.049-.104-.105-.104-.066 0-.111.044-.115.109l-.218 7.614.218 2.525c.004.06.049.106.115.106.056 0 .101-.045.105-.105l.247-2.527-.247-7.619z"/></svg>',
            cart: '<svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>'
        };
        return icons[type] || '';
    }
    
    _startVisualization() {
        if (!this._analyser || !this._miniCanvasCtx || !this._miniCanvas) return;
        
        const draw = () => {
            if (!this._isPlaying) return;
            
            this._animationId = requestAnimationFrame(draw);
            
            this._analyser.getByteFrequencyData(this._dataArray);
            
            const ctx = this._miniCanvasCtx;
            const canvas = this._miniCanvas;
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            const barCount = 60;
            const barWidth = width / barCount;
            
            const primaryColor = getComputedStyle(this).getPropertyValue('--primary-color') || '#6366f1';
            
            for (let i = 0; i < barCount; i++) {
                const value = this._dataArray[Math.floor(i * this._dataArray.length / barCount)];
                const percent = value / 255;
                const barHeight = percent * height * 0.8;
                
                ctx.fillStyle = primaryColor;
                ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.8, barHeight);
            }
        };
        
        draw();
    }
    
    _stopVisualization() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        
        if (this._miniCanvasCtx && this._miniCanvas) {
            this._miniCanvasCtx.clearRect(0, 0, this._miniCanvas.width, this._miniCanvas.height);
        }
    }
    
    _updateProgress() {
        if (!this._audioElement) return;
        
        const current = this._audioElement.currentTime;
        const total = this._audioElement.duration;
        
        if (isNaN(total)) return;
        
        const percent = (current / total) * 100;
        
        this._shadow.querySelector('.progress-bar-fill').style.width = `${percent}%`;
        this._shadow.querySelector('.progress-handle').style.left = `${percent}%`;
        this._shadow.querySelector('.current-time').textContent = this._formatTime(current);
    }
    
    _updateDuration() {
        if (!this._audioElement) return;
        
        const total = this._audioElement.duration;
        if (!isNaN(total)) {
            this._shadow.querySelector('.total-time').textContent = this._formatTime(total);
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
        
        // Update cover playing state
        const currentCover = this._shadow.querySelector('.current-cover');
        if (currentCover) {
            if (this._isPlaying) {
                currentCover.classList.add('playing');
            } else {
                currentCover.classList.remove('playing');
            }
        }
    }
    
    _updateVolumeIcon() {
        const volumeIcon = this._shadow.querySelector('.volume-icon');
        const muteIcon = this._shadow.querySelector('.mute-icon');
        
        if (this._currentVolume === 0) {
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'block';
        } else {
            volumeIcon.style.display = 'block';
            muteIcon.style.display = 'none';
        }
    }
    
    _playNext() {
        if (!this._currentPlaylist) return;
        
        if (this._isShuffled) {
            this._currentSongIndex = Math.floor(Math.random() * this._currentPlaylist.length);
        } else {
            this._currentSongIndex = (this._currentSongIndex + 1) % this._currentPlaylist.length;
        }
        
        this._playSong(this._currentSongIndex, this._currentPlaylist);
    }
    
    _playPrevious() {
        if (!this._currentPlaylist) return;
        
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
    
    _cleanup() {
        this._stopVisualization();
        
        if (this._audioElement) {
            this._audioElement.pause();
        }
        
        if (this._audioContext) {
            this._audioContext.close();
        }
    }
}

customElements.define('modern-music-player', ModernMusicPlayer);
