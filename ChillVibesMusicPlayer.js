class ChillVibesMusicPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._wavesurfer = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600;700&display=swap');
                
                /* Theme colors */
                /* Default Tropical Theme */
                :host {
                    --primary-color: #4ecdc4;
                    --secondary-color: #5d9ea3;
                    --background-color: #f7f9fc;
                    --background-gradient: linear-gradient(135deg, #f7f9fc, #e3eff8);
                    --text-primary: #2d4059;
                    --text-secondary: #546a7b;
                    --accent-color: #ff6b6b;
                    --button-hover: #36b5ac;
                    --control-bg: rgba(255, 255, 255, 0.9);
                    --card-bg: rgba(255, 255, 255, 0.8);
                    --player-border: 1px solid rgba(78, 205, 196, 0.2);
                    --border-color: rgba(78, 205, 196, 0.2);
                    --shadow-color: rgba(45, 64, 89, 0.1);
                    --visualizer-color-start: #4ecdc4;
                    --visualizer-color-end: #7ae7e0;
                    --button-text: #ffffff;
                    --progress-bg: rgba(220, 230, 239, 0.6);
                    --inactive-control: rgba(78, 205, 196, 0.5);
                    display: block;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    font-size: 16px;
                }
                
                /* Ocean Breeze Theme */
                :host(.theme-ocean-breeze) {
                    --primary-color: #3498db;
                    --secondary-color: #2980b9;
                    --background-color: #ecf0f1;
                    --background-gradient: linear-gradient(135deg, #ecf0f1, #d6eaf8);
                    --text-primary: #2c3e50;
                    --text-secondary: #7f8c8d;
                    --accent-color: #e74c3c;
                    --button-hover: #2980b9;
                    --control-bg: rgba(255, 255, 255, 0.9);
                    --card-bg: rgba(255, 255, 255, 0.8);
                    --border-color: rgba(52, 152, 219, 0.3);
                    --shadow-color: rgba(44, 62, 80, 0.1);
                    --visualizer-color-start: #3498db;
                    --visualizer-color-end: #67b0e3;
                    --button-text: #ffffff;
                    --progress-bg: rgba(189, 195, 199, 0.5);
                    --inactive-control: rgba(52, 152, 219, 0.5);
                }
                
                /* Sunset Palms Theme */
                :host(.theme-sunset-palms) {
                    --primary-color: #f39c12;
                    --secondary-color: #e67e22;
                    --background-color: #fef9e7;
                    --background-gradient: linear-gradient(135deg, #fef9e7, #fcf3cf);
                    --text-primary: #34495e;
                    --text-secondary: #7f8c8d;
                    --accent-color: #e74c3c;
                    --button-hover: #e67e22;
                    --control-bg: rgba(255, 255, 255, 0.9);
                    --card-bg: rgba(255, 255, 255, 0.8);
                    --border-color: rgba(243, 156, 18, 0.3);
                    --shadow-color: rgba(52, 73, 94, 0.1);
                    --visualizer-color-start: #f39c12;
                    --visualizer-color-end: #f8c471;
                    --button-text: #ffffff;
                    --progress-bg: rgba(236, 240, 241, 0.6);
                    --inactive-control: rgba(243, 156, 18, 0.5);
                }
                
                /* Tropical Night Theme */
                :host(.theme-tropical-night) {
                    --primary-color: #9b59b6;
                    --secondary-color: #8e44ad;
                    --background-color: #1f2a36;
                    --background-gradient: linear-gradient(135deg, #1f2a36, #2c3e50);
                    --text-primary: #ecf0f1;
                    --text-secondary: #bdc3c7;
                    --accent-color: #f1c40f;
                    --button-hover: #8e44ad;
                    --control-bg: rgba(52, 73, 94, 0.6);
                    --card-bg: rgba(52, 73, 94, 0.5);
                    --border-color: rgba(155, 89, 182, 0.3);
                    --shadow-color: rgba(0, 0, 0, 0.2);
                    --visualizer-color-start: #9b59b6;
                    --visualizer-color-end: #c39bd3;
                    --button-text: #ffffff;
                    --progress-bg: rgba(127, 140, 141, 0.4);
                    --inactive-control: rgba(155, 89, 182, 0.5);
                }
                
                /* Beach Vibes Theme */
                :host(.theme-beach-vibes) {
                    --primary-color: #16a085;
                    --secondary-color: #1abc9c;
                    --background-color: #f9f7f4;
                    --background-gradient: linear-gradient(135deg, #f9f7f4, #eee8d5);
                    --text-primary: #27ae60;
                    --text-secondary: #7f8c8d;
                    --accent-color: #f39c12;
                    --button-hover: #1abc9c;
                    --control-bg: rgba(255, 255, 255, 0.9);
                    --card-bg: rgba(255, 255, 255, 0.8);
                    --border-color: rgba(22, 160, 133, 0.3);
                    --shadow-color: rgba(44, 62, 80, 0.1);
                    --visualizer-color-start: #16a085;
                    --visualizer-color-end: #48c9b0;
                    --button-text: #ffffff;
                    --progress-bg: rgba(189, 195, 199, 0.5);
                    --inactive-control: rgba(22, 160, 133, 0.5);
                }
                
                /* Theme selector gradients */
                .theme-tropical {
                    background: linear-gradient(135deg, #4ecdc4, #5d9ea3);
                }
                
                .theme-ocean-breeze {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                }
                
                .theme-sunset-palms {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                }
                
                .theme-tropical-night {
                    background: linear-gradient(135deg, #9b59b6, #8e44ad);
                }
                
                .theme-beach-vibes {
                    background: linear-gradient(135deg, #16a085, #1abc9c);
                }
                
                *, *:before, *:after {
                    box-sizing: inherit;
                }
                
                .player-container {
                    width: 100%;
                    height: 100%;
                    background: var(--background-gradient);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 10px 25px var(--shadow-color);
                    color: var(--text-primary);
                    font-family: 'Poppins', sans-serif;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    border: var(--player-border);
                }
                
                /* Island-inspired grain texture overlay */
                .player-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==');
                    opacity: 0.3;
                    pointer-events: none;
                    border-radius: 16px;
                    mix-blend-mode: overlay;
                }
                
                /* Palm leaf subtle background pattern */
                .player-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        radial-gradient(circle at 20% 30%, rgba(78, 205, 196, 0.05) 0%, transparent 70%),
                        radial-gradient(circle at 80% 80%, rgba(78, 205, 196, 0.05) 0%, transparent 70%);
                    opacity: 0.8;
                    pointer-events: none;
                    border-radius: 16px;
                    z-index: -1;
                }
                
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .player-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                    font-family: 'Montserrat', sans-serif;
                    letter-spacing: 0.5px;
                    color: var(--primary-color);
                }
                
                /* Theme Selector */
                .theme-selector {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                }
                
                .theme-option {
                    width: 1.5rem;
                    height: 1.5rem;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: 2px solid transparent;
                    position: relative;
                }
                
                .theme-option:hover {
                    transform: scale(1.15);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }
                
                .theme-option.active {
                    border: 2px solid #fff;
                    box-shadow: 0 0 10px var(--primary-color);
                }
                
                .theme-option:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                /* Main layout - switching to a horizontal layout for larger screens, vertical for mobile */
                .player-layout {
                    display: flex;
                    flex-direction: row;
                    gap: 24px;
                    flex: 1;
                    overflow: hidden;
                }
                
                /* Cover art and player controls section */
                .player-main-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                /* Track info and player controls */
                .player-info-controls {
                    display: flex;
                    flex-direction: column;
                }
                
                /* Player sidebar - for playlists, social links, etc. */
                .player-sidebar {
                    width: 280px;
                    display: flex;
                    flex-direction: column;
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 5px 15px var(--shadow-color);
                    position: relative;
                    overflow: hidden;
                }
                
                /* Album cover styling */
                .cover-artwork {
                    position: relative;
                    width: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 20px var(--shadow-color);
                    margin-bottom: 20px;
                }
                
                .cover-container {
                    position: relative;
                    width: 100%;
                    padding-bottom: 100%; /* 1:1 Aspect Ratio - square */
                    overflow: hidden;
                }
                
                .album-cover {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                    border-radius: 12px;
                }
                
                .cover-container:hover .album-cover {
                    transform: scale(1.05);
                }
                
                /* Pulsing overlay for the album cover when playing */
                .cover-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center, rgba(78, 205, 196, 0.3) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    border-radius: 12px;
                    pointer-events: none;
                }
                
                .playing .cover-overlay {
                    animation: pulse 2s infinite ease-in-out;
                    opacity: 1;
                }
                
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.7; }
                    50% { transform: scale(1.05); opacity: 0.3; }
                    100% { transform: scale(0.95); opacity: 0.7; }
                }
                
                /* Track info styling */
                .track-info {
                    margin-bottom: 20px;
                }
                
                .track-title {
                    font-size: 1.6rem;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                    color: var(--text-primary);
                    line-height: 1.3;
                    font-family: 'Montserrat', sans-serif;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                .track-artist {
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                    margin: 0 0 4px 0;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                }
                
                .track-album {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    opacity: 0.8;
                    margin: 0;
                    font-weight: 400;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                }
                
                /* New visualizer style - wave-like for chill vibes */
                .visualizer-container {
                    background: var(--card-bg);
                    border-radius: 12px;
                    height: 100px;
                    padding: 12px;
                    margin: 16px 0;
                    position: relative;
                    overflow: hidden;
                    box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--border-color);
                }
                
                .audio-visualizer {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                
                /* Control buttons styling */
                .controls-container {
                    display: flex;
                    flex-direction: column;
                    margin-top: 16px;
                }
                
                .controls-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .playback-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }
                
                .volume-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn {
                    background: var(--control-bg);
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 8px var(--shadow-color);
                    position: relative;
                    overflow: hidden;
                }
                
                .btn::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 12px var(--shadow-color);
                }
                
                .btn:hover::after {
                    opacity: 1;
                }
                
                .btn:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .btn svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                    position: relative;
                    z-index: 1;
                }
                
                .play-btn {
                    background: var(--primary-color);
                    color: var(--button-text);
                    width: 56px;
                    height: 56px;
                    box-shadow: 0 5px 15px rgba(78, 205, 196, 0.3);
                }
                
                .play-btn:hover {
                    background: var(--button-hover);
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 8px 20px rgba(78, 205, 196, 0.5);
                }
                
                .play-btn svg {
                    width: 24px;
                    height: 24px;
                }
                
                /* Progress control styling */
                .progress-control {
                    width: 100%;
                    margin-bottom: 8px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: var(--progress-bg);
                    border-radius: 3px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: height 0.2s ease;
                }
                
                .progress-bar:hover {
                    height: 8px;
                }
                
                .progress-current {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 0%;
                    background: var(--primary-color);
                    border-radius: 3px;
                    transition: width 0.1s linear;
                }
                
                .progress-indicator {
                    position: absolute;
                    top: 50%;
                    left: 0%;
                    width: 12px;
                    height: 12px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    transition: transform 0.2s ease;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
                    border: 2px solid white;
                }
                
                .progress-bar:hover .progress-indicator {
                    transform: translate(-50%, -50%) scale(1);
                }
                
                .progress-bar:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-top: 8px;
                }
                
                /* Volume slider styling */
                .volume-slider {
                    -webkit-appearance: none;
                    width: 80px;
                    height: 4px;
                    background: var(--progress-bg);
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
                }
                
                .volume-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
                }
                
                .volume-slider:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                /* Buy now button styling */
                .buy-now-btn {
                    background: var(--accent-color);
                    color: var(--button-text);
                    border: none;
                    border-radius: 25px;
                    padding: 12px 24px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    margin-top: 16px;
                    width: 100%;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: 'Montserrat', sans-serif;
                }
                
                .buy-now-btn svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                .buy-now-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    background: var(--accent-color);
                    opacity: 0.95;
                }
                
                .buy-now-btn:focus {
                    outline: 2px solid var(--accent-color);
                    outline-offset: 2px;
                }
                
                /* Playlist section styling */
                .playlist-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    margin-top: 16px;
                    min-height: 0; /* For Firefox */
                }
                
                .playlist-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .playlist-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0;
                    color: var(--text-primary);
                    font-family: 'Montserrat', sans-serif;
                }
                
                .playlist-title svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .song-navigation {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding-right: 8px;
                    margin-bottom: 16px;
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-color) transparent;
                }
                
                .song-navigation::-webkit-scrollbar {
                    width: 4px;
                }
                
                .song-navigation::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .song-navigation::-webkit-scrollbar-thumb {
                    background-color: var(--primary-color);
                    border-radius: 2px;
                }
                
                .song-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.6);
                    border-left: 3px solid transparent;
                }
                
                .song-item:hover {
                    background: rgba(255, 255, 255, 0.8);
                    transform: translateX(4px);
                }
                
                .song-item:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .song-item.active {
                    background: rgba(255, 255, 255, 0.9);
                    border-left: 3px solid var(--primary-color);
                }
                
                .song-item-info {
                    flex: 1;
                    min-width: 0; /* For text-overflow to work */
                }
                
                .song-item-title {
                    font-weight: 500;
                    font-size: 0.9rem;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .song-item-artist {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                /* Social links section */
                .social-share-container {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                }
                
                .social-share-title {
                    font-size: 0.9rem;
                    margin: 0 0 12px 0;
                    color: var(--text-secondary);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .social-share-title svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
                
                .social-share-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .share-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--control-bg);
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                    border: none;
                }
                
                .share-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                
                .share-button:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .share-button svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                /* Streaming service links */
                .service-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 16px;
                }
                
                .service-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: var(--control-bg);
                    border-radius: 20px;
                    text-decoration: none;
                    color: var(--text-primary);
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                
                .service-link:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                
                .service-link:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .service-link svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
                
                /* Artist social links */
                .artist-social-container {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                }
                
                .artist-social-title {
                    font-size: 0.9rem;
                    margin: 0 0 12px 0;
                    color: var(--text-secondary);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .artist-social-title svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
                
                .artist-social-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .artist-social-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--control-bg);
                    color: var(--text-primary);
                    text-decoration: none;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                
                .artist-social-link:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                
                .artist-social-link:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .artist-social-link svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                /* Chill wave visualizer animation for when audio is playing */
                .wave-animation {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 40px;
                    gap: 4px;
                    margin-top: 12px;
                }
                
                .wave-bar {
                    background: var(--primary-color);
                    width: 3px;
                    height: 3px;
                    border-radius: 1px;
                    transition: height 0.2s ease;
                    opacity: 0.8;
                }
                
                @keyframes wave {
                    0% { height: 3px; }
                    50% { height: 20px; }
                    100% { height: 3px; }
                }
                
                .playing .wave-bar {
                    animation: wave 2s ease infinite;
                }
                
                .playing .wave-bar:nth-child(1) { animation-delay: -1.2s; }
                .playing .wave-bar:nth-child(2) { animation-delay: -0.9s; }
                .playing .wave-bar:nth-child(3) { animation-delay: -1.5s; }
                .playing .wave-bar:nth-child(4) { animation-delay: -0.6s; }
                .playing .wave-bar:nth-child(5) { animation-delay: -0.3s; }
                .playing .wave-bar:nth-child(6) { animation-delay: -1.8s; }
                .playing .wave-bar:nth-child(7) { animation-delay: -1.0s; }
                .playing .wave-bar:nth-child(8) { animation-delay: -0.7s; }
                .playing .wave-bar:nth-child(9) { animation-delay: -1.3s; }
                .playing .wave-bar:nth-child(10) { animation-delay: -0.5s; }
                .playing .wave-bar:nth-child(11) { animation-delay: -1.1s; }
                .playing .wave-bar:nth-child(12) { animation-delay: -0.8s; }
                
                /* Responsive Design */
                @media (max-width: 900px) {
                    .player-layout {
                        flex-direction: column;
                    }
                    
                    .player-sidebar {
                        width: 100%;
                        order: 2;
                    }
                    
                    .player-main-section {
                        order: 1;
                    }
                    
                    .cover-artwork {
                        max-width: 300px;
                        margin: 0 auto 20px;
                    }
                    
                    .track-info {
                        text-align: center;
                    }
                    
                    .track-title {
                        font-size: 1.4rem;
                    }
                    
                    .track-artist {
                        font-size: 1rem;
                    }
                    
                    .playback-controls {
                        justify-content: center;
                    }
                    
                    .controls-main {
                        flex-direction: column;
                        gap: 16px;
                    }
                    
                    .volume-controls {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .volume-slider {
                        width: 120px;
                    }
                    
                    .social-share-buttons,
                    .artist-social-links {
                        justify-content: center;
                    }
                    
                    .service-links {
                        justify-content: center;
                    }
                }
                
                @media (max-width: 480px) {
                    .player-container {
                        padding: 16px;
                        border-radius: 12px;
                    }
                    
                    .player-title {
                        font-size: 1.3rem;
                    }
                    
                    .theme-option {
                        width: 1.3rem;
                        height: 1.3rem;
                    }
                    
                    .track-title {
                        font-size: 1.3rem;
                    }
                    
                    .track-artist {
                        font-size: 0.95rem;
                    }
                    
                    .btn {
                        width: 36px;
                        height: 36px;
                    }
                    
                    .play-btn {
                        width: 50px;
                        height: 50px;
                    }
                    
                    .visualizer-container {
                        height: 80px;
                    }
                    
                    .playback-controls {
                        gap: 8px;
                    }
                }
                
                /* Animated Wave Background for Player */
                .wave-background {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 40%;
                    background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI1MHB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0icmdiYSg3OCwgMjA1LCAxOTYsIDAuMSkiPjxwYXRoIGQ9Ik0wIDUxLjc2YzM2LjIxLTIuMjUgNzcuNTctMy41OCAxMjYuNDItMy41OCAzMjAgMCAzMjAgNTcgNjQwIDU3IDI3MS4xNSAwIDMxMi41OC00MC45MSA1MTMuNTgtNTMuNFYwSDB6IiBmaWxsLW9wYWNpdHk9Ii4zIi8+PHBhdGggZD0iTTAgMjQuMzFjNDMuNDYtNS42OSA5NC41Ni05LjI1IDE1OC40Mi05LjI1IDMyMCAwIDMyMCA4OS4yNCA2NDAgODkuMjQgMjU2LjEzIDAgMzA3LjI4LTU3LjE2IDQ4MS41OC04MFYwSDB6IiBmaWxsLW9wYWNpdHk9Ii41Ii8+PHBhdGggZD0iTTAgMHYzLjRDMjguMiAxLjYgNTkuNC41OSA5NC40Mi41OWMzMjAgMCAzMjAgODQuMyA2NDAgODQuMyAyODUgMCAzMTYuMTctNjYuODUgNTQ1LjU4LTgxLjQ5VjB6Ii8+PC9nPjwvc3ZnPg==');
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    z-index: -1;
                    opacity: 0.7;
                    transform: rotate(180deg);
                }
                
                /* Focus visible styles for accessibility */
                :focus-visible {
                    outline: 3px solid var(--primary-color);
                    outline-offset: 3px;
                }
                
                /* High contrast mode adjustments */
                @media (forced-colors: active) {
                    .btn,
                    .progress-bar,
                    .volume-slider,
                    .song-item,
                    .service-link,
                    .share-button,
                    .artist-social-link,
                    .buy-now-btn {
                        border: 2px solid;
                    }
                    
                    .progress-current {
                        background: Highlight;
                    }
                    
                    .progress-indicator,
                    .volume-slider::-webkit-slider-thumb {
                        background: Highlight;
                        border: 2px solid ButtonText;
                    }
                }
            </style>
            
            <div class="player-container">
                <!-- Animated wave background -->
                <div class="wave-background"></div>
                
                <!-- Player Header with Title and Theme Selector -->
                <div class="player-header">
                    <h1 class="player-title">Chill Vibes Player</h1>
                    <div class="theme-selector">
                        <div class="theme-option theme-tropical active" data-theme="default" title="Tropical Theme"></div>
                        <div class="theme-option theme-ocean-breeze" data-theme="ocean-breeze" title="Ocean Breeze Theme"></div>
                        <div class="theme-option theme-sunset-palms" data-theme="sunset-palms" title="Sunset Palms Theme"></div>
                        <div class="theme-option theme-tropical-night" data-theme="tropical-night" title="Tropical Night Theme"></div>
                        <div class="theme-option theme-beach-vibes" data-theme="beach-vibes" title="Beach Vibes Theme"></div>
                    </div>
                </div>
                
                <!-- Main Player Layout -->
                <div class="player-layout">
                    <!-- Main Player Section (Cover art, controls) -->
                    <div class="player-main-section">
                        <!-- Cover Artwork -->
                        <div class="cover-artwork">
                            <div class="cover-container">
                                <img class="album-cover" src="" alt="Album Cover">
                                <div class="cover-overlay"></div>
                            </div>
                            
                            <!-- Wave Animation -->
                            <div class="wave-animation">
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                                <div class="wave-bar"></div>
                            </div>
                        </div>
                        
                        <!-- Player Info and Controls -->
                        <div class="player-info-controls">
                            <!-- Track Info -->
                            <div class="track-info">
                                <h2 class="track-title">Song Title</h2>
                                <h3 class="track-artist">Artist Name</h3>
                                <p class="track-album">Album Name</p>
                            </div>
                            
                            <!-- Visualizer -->
                            <div class="visualizer-container">
                                <canvas class="audio-visualizer" id="audioVisualizer"></canvas>
                            </div>
                            
                            <!-- Controls -->
                            <div class="controls-container">
                                <div class="controls-main">
                                    <div class="playback-controls">
                                        <button class="btn shuffle-btn" aria-label="Shuffle">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
                                            </svg>
                                        </button>
                                        <button class="btn prev-btn" aria-label="Previous">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                            </svg>
                                        </button>
                                        <button class="btn play-btn" aria-label="Play">
                                            <svg class="play-icon" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                            <svg class="pause-icon" viewBox="0 0 24 24" style="display: none;">
                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                            </svg>
                                        </button>
                                        <button class="btn next-btn" aria-label="Next">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                            </svg>
                                        </button>
                                        <button class="btn repeat-btn" aria-label="Repeat">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div class="volume-controls">
                                        <button class="btn mute-btn" aria-label="Mute">
                                            <svg class="volume-icon" viewBox="0 0 24 24">
                                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                            </svg>
                                            <svg class="mute-icon" viewBox="0 0 24 24" style="display: none;">
                                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                            </svg>
                                        </button>
                                        <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.8" aria-label="Volume">
                                    </div>
                                </div>
                                
                                <div class="progress-control">
                                    <div class="progress-bar" role="progressbar" aria-label="Audio Progress" tabindex="0">
                                        <div class="progress-current"></div>
                                        <div class="progress-indicator"></div>
                                    </div>
                                    <div class="time-display">
                                        <span class="current-time">0:00</span>
                                        <span class="total-time">0:00</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Buy Button -->
                            <button class="buy-now-btn">
                                <svg viewBox="0 0 24 24">
                                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                                Buy Now
                            </button>
                            
                            <!-- Streaming Services -->
                            <div class="service-links">
                                <a href="#" class="service-link service-spotify" target="_blank">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                    </svg>
                                    <span>Spotify</span>
                                </a>
                                <a href="#" class="service-link service-youtube" target="_blank">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                    <span>YouTube</span>
                                </a>
                                <a href="#" class="service-link service-soundcloud" target="_blank">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.105.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.093-.09-.093m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.075.075.135.15.135.074 0 .135-.06.15-.135l.225-2.55-.225-2.623c0-.06-.06-.135-.135-.135l-.031-.017zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444.033.015zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.225-.225-.225m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456-.016.015zm.749-.134c-.135 0-.255.119-.255.254l-.15 5.322.15 2.473c0 .15.12.255.255.255s.255-.105.255-.255l.15-2.473-.15-5.307c0-.148-.12-.254-.271-.254l.016-.015zm.749-.15c-.15 0-.285.135-.285.285L9.7 14.77l.135 2.458c0 .149.135.27.285.27s.27-.12.27-.27l.15-2.458-.15-5.03c0-.15-.135-.27-.285-.27m1.005.166c-.164 0-.284.135-.284.285l-.121 4.695.121 2.428c0 .15.12.285.284.285.15 0 .285-.135.285-.285l.135-2.428-.135-4.695c0-.165-.135-.285-.284-.285m.75-.045c-.165 0-.3.135-.3.3l-.105 4.725.105 2.4c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.12-2.4-.12-4.725c-.014-.164-.149-.3-.3-.3m.884-.05c-.194 0-.315.135-.315.345l-.09 4.78.09 2.4c0 .164.136.314.315.314.165 0 .314-.15.314-.314l.091-2.4-.091-4.78c0-.194-.164-.345-.314-.345m.914-.095c-.196 0-.346.149-.346.345L14.6 14.725l.076 2.383c0 .209.15.36.345.36.21 0 .36-.165.36-.36l.09-2.403-.09-4.702c0-.209-.165-.36-.36-.36m1.035-.074c-.21 0-.376.18-.376.375l-.075 4.46.075 2.374c0 .194.166.374.376.374.195 0 .375-.18.375-.374l.074-2.374-.074-4.46c0-.21-.18-.376-.375-.376m1.05-.595c-.061 0-.105.045-.105.09l-.061 5.297.06 2.335c0 .06.045.104.106.104.059 0 .104-.044.104-.104l.075-2.335-.074-5.327c0-.046-.045-.075-.105-.075m.509.137c-.075 0-.135.06-.135.135l-.045 5.172.045 2.321c0 .074.06.15.135.15.09 0 .149-.076.149-.15l.06-2.321-.06-5.172c0-.074-.06-.135-.149-.135l.015-.007zm.958.137c-.103 0-.164.08-.164.165l-.046 5.041.047 2.335c0 .105.074.18.164.18.105 0 .18-.075.18-.18l.052-2.335-.052-5.04c0-.09-.075-.166-.179-.166m.904-.061c-.12 0-.194.09-.194.18l-.029 5.017.029 2.329c0 .104.074.18.194.18.109 0 .18-.075.193-.18l.052-2.329-.044-5.033c0-.09-.089-.165-.193-.165l-.008.001zm1.214.196c-.09 0-.18.08-.18.18l-.044 4.856.045 2.321c0 .104.09.18.18.18.104 0 .18-.076.189-.18l.029-2.321-.029-4.871c0-.107-.088-.178-.19-.165zm1.169.815c0-.09-.082-.165-.18-.165-.089 0-.164.075-.171.164l-.045 4.071.046 2.336c0 .09.075.164.18.164.094 0 .179-.074.18-.164l.044-2.336-.053-4.07zm1.349-.627c-.119 0-.209.084-.209.203l-.044 4.5.044 2.307c0 .119.105.209.209.209.104 0 .179-.09.194-.209l.052-2.307-.052-4.5c0-.12-.09-.204-.194-.204l.001.001zm.825-.209c-.135 0-.219.09-.224.224l-.046 4.513.046 2.294c.005.134.089.224.225.224.119 0 .224-.09.229-.224l.044-2.294-.044-4.513c0-.134-.109-.225-.229-.225m.875-.118c-.149 0-.23.105-.234.233l-.044 4.605.044 2.257c0 .133.09.239.234.239.136 0 .24-.105.244-.24l.046-2.255-.044-4.606c-.009-.134-.113-.237-.245-.233h-.001zm.988.008c-.146 0-.255.105-.255.254l-.029 4.597.029 2.254c0 .15.109.254.255.254.149 0 .254-.104.259-.254l.03-2.254-.03-4.596c-.005-.16-.114-.255-.259-.255m1.004.385c-.03-.12-.135-.215-.255-.215-.135 0-.245.9-.255.226l-.03 4.222.03 2.241c.01.135.12.226.255.226.12 0 .226-.09.255-.226l.03-2.24-.03-4.222v-.012zm.764-.23c-.164 0-.284.12-.284.284l-.03 4.438.03 2.227c0 .164.12.284.284.284.149 0 .284-.12.284-.284l.029-2.227-.029-4.438c0-.165-.135-.285-.284-.285m.929-.126c-.18 0-.301.135-.301.3l-.03 4.277.03 2.176c0 .18.135.301.301.301.164 0 .3-.12.3-.301l.03-2.176-.03-4.277c0-.18-.136-.3-.3-.3m1.094-.329c-.195 0-.315.142-.315.33l-.03 4.264.03 2.169c0 .189.12.315.315.315.165 0 .314-.126.314-.315l.03-2.17-.03-4.262c0-.189-.133-.331-.314-.331m.598-.15c-.21 0-.345.149-.345.354l-.03 4.408.03 2.143c0 .194.149.344.345.344.209 0 .33-.149.33-.344l.045-2.143-.044-4.408c0-.21-.136-.345-.331-.345v-.01zM2.072 10.81c-.051 0-.09.039-.096.09l-.249 3.04.264 2.971c.006.052.045.09.096.09s.09-.038.096-.09l.28-2.971-.28-3.04c-.006-.051-.045-.09-.096-.09m-.446-.581c-.045 0-.09.03-.105.074L1.3 13.404l.224 2.881c.015.045.06.074.105.074.047 0 .09-.029.1-.074l.255-2.881-.257-3.091c-.008-.045-.05-.074-.1-.074m3.502-4.524c-.004-.06-.049-.104-.105-.104-.066 0-.111.044-.115.109l-.218 7.614.218 2.525c.004.06.049.106.115.106.056 0 .101-.045.105-.105l.247-2.527-.247-7.619z"/>
                                    </svg>
                                    <span>SoundCloud</span>
                                </a>
                                <a href="#" class="service-link service-apple" target="_blank">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.664.113 1.322.255 1.966.28 1.262.876 2.36 1.89 3.21.906.77 1.964 1.22 3.15 1.45.39.07.786.115 1.185.146.414.027.828.044 1.242.044.187 0 .375-.007.562-.013h9.17c.14-.01.284-.013.425-.025.627-.047 1.245-.108 1.847-.29 1.22-.36 2.24-1.054 3.02-2.076.55-.738.898-1.563 1.088-2.455.116-.53.176-1.07.204-1.613.016-.31.022-.617.03-.928v-9.17c-.01-.278-.018-.554-.036-.83-.04-.666-.11-1.305-.27-1.933-.367-1.432-1.108-2.596-2.297-3.466-.757-.553-1.604-.895-2.534-1.085-.444-.09-.894-.142-1.35-.164-.134-.007-.268-.016-.4-.023zm-12.24 4.53c1.234.057 2.407.283 3.534.767 1.626.7 2.924 1.787 3.847 3.307.347.575.598 1.18.778 1.812.083.29.142.59.18.888.042.33.037.666.053 1l.008.19c.012.586-.04 1.16-.2 1.726-.386 1.372-1.08 2.57-2.126 3.552-.798.748-1.723 1.283-2.776 1.623-.788.257-1.6.39-2.428.453-.15.01-.302.022-.452.027-.08.003-.16.003-.238.003h-10.8c-.14 0-.276-.01-.414-.023-.735-.065-1.456-.192-2.148-.46-1.06-.41-1.955-1.042-2.698-1.893-.723-.825-1.24-1.764-1.563-2.812C1.518 19.3 1.37 18.72 1.3 18.132c-.043-.373-.076-.75-.076-1.128 0-.37 0-.738.025-1.107.05-.632.164-1.252.352-1.85.42-1.32 1.103-2.45 2.08-3.382C4.554 9.84 5.64 9.35 6.865 9.111c.81-.158 1.624-.23 2.442-.256.27-.007.54-.01.813-.01h1.142c.193 0 .387.01.58.02zm.037 2.21c-.976.035-1.95.04-2.927.012-.78-.036-1.557-.13-2.31-.368-.8-.255-1.47-.696-1.964-1.42-.25-.365-.415-.775-.484-1.218-.07-.442.02-.872.233-1.263.4-.726 1.037-1.15 1.808-1.35.324-.083.655-.113.99-.124.36-.012.735-.002 1.11-.002h8.064c.314.01.629.024.942.08.78.14 1.466.44 1.983 1.08.87.108.155.226.227.352.128.225.203.466.217.72.047.882-.308 1.534-1.048 1.982-.46.28-.96.44-1.482.524-.216.035-.435.057-.654.067-.388.02-.777.027-1.166.033-.33.004-.66.01-.99.01zm8.92 3.655c-.076-.662-.213-1.306-.482-1.908-.546-1.228-1.336-2.257-2.353-3.124-.86-.736-1.833-1.288-2.904-1.687-1.237-.46-2.523-.7-3.843-.75-.68-.027-1.362-.02-2.043-.02H7.45c-.32.01-.634.026-.946.096-.538.123-1.027.33-1.403.78-.215.26-.348.55-.355.878-.004.15 0 .3.022.45.095.667.445 1.17 1.02 1.53.417.261.88.413 1.36.512.508.103 1.022.143 1.536.165.936.043 1.873.03 2.808.012.36-.005.72-.036 1.078-.077 1.34-.15 2.616-.56 3.788-1.28.882-.54 1.643-1.2 2.277-2.016.363-.467.636-.986.82-1.56zm-7.82 1.98c.057-.196.123-.39.17-.59.148-.61.213-1.234.193-1.87-.022-.69-.155-1.362-.446-1.985-.16-.342-.367-.655-.633-.93-.373-.39-.826-.653-1.325-.83-.262-.093-.53-.158-.803-.2-.34-.05-.688-.073-1.035-.073H5.23c-.66 0-1.303.14-1.91.411-.598.27-1.087.662-1.45 1.2-.326.484-.54 1.016-.66 1.582-.067.31-.1.625-.12.946-.023.428-.01.856.046 1.282.112.836.36 1.61.83 2.31.552.82 1.26 1.478 2.11 1.976.66.386 1.367.662 2.116.83.56.125 1.127.19 1.702.212.32.01.64.01.96.01h.63c.16-.012.32-.024.48-.04 1.007-.1 1.967-.36 2.872-.84.997-.53 1.845-1.22 2.525-2.1.413-.535.747-1.11.98-1.73.172-.46.282-.94.338-1.424.012-.105.023-.21.023-.327H8.893v.004zm4.287-2.23c-.01-.01-.014-.023-.02-.033-.267-.473-.686-.79-1.18-1.037-.3-.15-.613-.26-.947-.324-.437-.088-.877-.105-1.318-.07-.077.007-.154.013-.217.02v3.773h.005c.51.012.102.03.158.03 1.244.05 2.49.04 3.735-.035.263-.015.525-.054.784-.096.26-.042.514-.107.768-.167.69-.16 1.338-.42 1.956-.767.27-.15.525-.317.775-.49.425-.293.797-.63 1.085-1.06.076-.113.144-.23.2-.354.15-.327.23-.673.27-1.026.032-.29.036-.58.036-.87 0-.128-.01-.246-.035-.358-.066-.297-.186-.57-.385-.805-.29-.345-.655-.6-1.052-.82-.335-.182-.683-.343-1.04-.48-.237-.09-.476-.18-.714-.26-.44-.15-.903-.234-1.36-.337-.65-.15-1.3-.295-1.93-.518-.327-.116-.643-.25-.9-.5-.238-.228-.35-.5-.35-.814-.004-.11 0-.223.024-.333.066-.31.215-.56.47-.747.343-.252.73-.358 1.128-.41.245-.033.494-.04.74-.043.655-.01 1.31.013 1.96.137.4.077.795.196 1.145.407.516.307.855.74 1.013 1.33.01.04.03.077.055.142h3.58c-.017-.106-.026-.192-.045-.274-.096-.444-.257-.864-.49-1.252-.46-.766-1.084-1.347-1.85-1.777-.748-.42-1.56-.646-2.413-.764-.443-.062-.89-.084-1.34-.086-.32 0-.646.01-.967.034-.56.04-1.1.14-1.629.31-.52.168-1.013.396-1.46.705-.964.666-1.634 1.5-1.965 2.582-.12.396-.19.803-.21 1.214-.024.544.01 1.084.134 1.612.14.598.387 1.13.75 1.606.36.473.795.88 1.29 1.214.358.243.74.447 1.133.622.326.144.66.27.996.39.364.13.732.244 1.103.352.63.18 1.26.356 1.855.642.46.22.887.483 1.22.873.22.256.374.54.425.864.082.514.012.994-.357 1.4-.174.19-.388.33-.623.43-.47.2-.976.285-1.49.31-.445.02-.89.008-1.335-.03-.348-.03-.688-.09-1.023-.18-.49-.132-.956-.324-1.332-.684-.344-.33-.58-.73-.716-1.2-.012-.04-.03-.078-.048-.12h-3.558c0 .146.01.268.023.39.05.436.142.86.313 1.264.093.218.21.424.336.623.565.886 1.34 1.536 2.263 2.01.576.297 1.19.49 1.83.602.36.064.726.096 1.092.11.302.01.603.005.902.005.12-.006.233-.016.348-.027.712-.07 1.41-.19 2.087-.432.572-.207 1.11-.474 1.596-.84.304-.228.58-.485.83-.77.58-.665.96-1.42 1.103-2.293.048-.288.07-.578.08-.868.004-.077 0-.154 0-.268z"/>
                                    </svg>
                                    <span>Apple</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Player Sidebar (Playlist, Shares, Artist Links) -->
                    <div class="player-sidebar">
                        <!-- Playlist Header -->
                        <div class="playlist-header">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                            </svg>
                            <h3 class="playlist-title">Playlist</h3>
                        </div>
                        
                        <!-- Song navigation -->
                        <div class="song-navigation">
                            <!-- Song items will be added here dynamically -->
                        </div>
                        
                        <!-- Share section -->
                        <div class="social-share-container">
                            <div class="social-share-title">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                </svg>
                                Share This Track
                            </div>
                            <div class="social-share-buttons">
                                <button class="share-button share-facebook" title="Share on Facebook">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                                    </svg>
                                </button>
                                <button class="share-button share-twitter" title="Share on Twitter">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                    </svg>
                                </a>
                                <a href="#" class="artist-social-link artist-instagram" target="_blank" title="Instagram">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                    </svg>
                                </a>
                                <a href="#" class="artist-social-link artist-youtube" target="_blank" title="YouTube">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.857.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z"/>
                                    </svg>
                                </a>
                                <a href="#" class="artist-social-link artist-tiktok" target="_blank" title="TikTok">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                    </svg>
                                </a>
                                <a href="#" class="artist-social-link artist-website" target="_blank" title="Official Website">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this._shadow.appendChild(this._root);

        // Load WaveSurfer.js dynamically
        this._loadWaveSurferScript().then(() => {
            this._initializeWaveSurfer();
        });

        // Set up event listeners
        this._setupEventListeners();
        
        // Handle resize events
        this._setupResizeListener();
    }

    _setupResizeListener() {
        // Create ResizeObserver to handle container resizing
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => this._handleResize());
            this._resizeObserver.observe(this);
        } else {
            // Fallback for browsers without ResizeObserver
            window.addEventListener('resize', () => this._handleResize());
        }
    }

    _handleResize() {
        // Update canvas size when container resizes
        if (this._canvas) {
            const visualizerContainer = this._shadow.querySelector('.visualizer-container');
            if (visualizerContainer) {
                this._canvas.width = visualizerContainer.clientWidth;
                this._canvas.height = visualizerContainer.clientHeight;
            }
        }
    }

    static get observedAttributes() {
        return ['player-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'player-data' && newValue !== oldValue) {
            try {
                this._playerData = JSON.parse(newValue);
                
                // Ensure songs have all required properties
                if (this._playerData && this._playerData.songs) {
                    this._playerData.songs = this._playerData.songs.map(song => {
                        return {
                            title: song.title || 'Unknown Title',
                            artist: song.artist || 'Unknown Artist',
                            album: song.album || '',
                            audioFile: song.audioFile || '',
                            coverImage: song.coverImage || '',
                            streamingLinks: song.streamingLinks || {},
                            artistSocial: song.artistSocial || {},
                            purchaseLink: song.purchaseLink || null,
                            shareUrl: song.shareUrl || window.location.href
                        };
                    });
                }
                
                this.render();
                
                // If audio element exists, load the current song
                if (this._audioElement && 
                    this._playerData && 
                    this._playerData.songs && 
                    this._playerData.songs.length > 0) {
                    
                    const currentSong = this._playerData.songs[this._playerData.currentIndex || 0];
                    if (currentSong && currentSong.audioFile) {
                        this._loadSong(currentSong.audioFile);
                    }
                }
            } catch (e) {
                console.error("Error parsing player data:", e);
            }
        }
    }

    _loadWaveSurferScript() {
        return new Promise((resolve, reject) => {
            if (window.WaveSurfer) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/6.6.4/wavesurfer.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load WaveSurfer.js'));
            document.head.appendChild(script);
        });
    }

    _initializeWaveSurfer() {
        if (!window.WaveSurfer) return;
        
        // Get direct reference to canvas for visualization
        this._canvas = this._shadow.querySelector('#audioVisualizer');
        this._canvasCtx = this._canvas.getContext('2d');
        
        // Set canvas dimensions
        const visualizerContainer = this._shadow.querySelector('.visualizer-container');
        this._canvas.width = visualizerContainer.clientWidth;
        this._canvas.height = visualizerContainer.clientHeight;
        
        // Create hidden audio element for visualization and playback
        this._audioElement = document.createElement('audio');
        this._audioElement.crossOrigin = 'anonymous';
        this._audioElement.setAttribute('preload', 'auto');
        
        // Create Audio API context and analyzer
        this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this._analyser = this._audioContext.createAnalyser();
        this._analyser.fftSize = 256;
        this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
        
        // Connect audio element to analyzer
        this._source = this._audioContext.createMediaElementSource(this._audioElement);
        this._source.connect(this._analyser);
        this._analyser.connect(this._audioContext.destination);
        
        // Set up audio element events
        this._audioElement.addEventListener('loadedmetadata', () => {
            this._updateDuration();
            const totalTimeElement = this._shadow.querySelector('.total-time');
            if (totalTimeElement) {
                totalTimeElement.textContent = this._formatTime(this._audioElement.duration);
            }
        });
        
        this._audioElement.addEventListener('timeupdate', () => {
            this._updateCurrentTime();
        });
        
        this._audioElement.addEventListener('play', () => {
            this._setPlayingState(true);
            // Resume audio context if suspended (required by browsers)
            if (this._audioContext.state === 'suspended') {
                this._audioContext.resume();
            }
            // Start visualization
            this._startVisualization();
        });
        
        this._audioElement.addEventListener('pause', () => {
            this._setPlayingState(false);
            // Stop visualization
            this._stopVisualization();
        });
        
        this._audioElement.addEventListener('ended', () => {
            this._setPlayingState(false);
            this._stopVisualization();
            
            // Auto play next if not in repeat mode
            if (!this._isRepeat) {
                this._changeSong(1);
            } else {
                // For repeat mode, play the same song again
                this._audioElement.currentTime = 0;
                this._audioElement.play();
            }
        });
        
        // Load the current song if data is available
        if (this._playerData && this._playerData.songs && this._playerData.songs.length > 0) {
            const currentSong = this._playerData.songs[this._playerData.currentIndex || 0];
            if (currentSong && currentSong.audioFile) {
                this._loadSong(currentSong.audioFile);
            }
        }
    }
    
    _loadSong(url) {
        if (this._audioElement) {
            this._audioElement.src = url;
            this._audioElement.load();
        }
    }
    
    _startVisualization() {
        if (!this._analyser || !this._canvasCtx) return;
        
        this._animationId = requestAnimationFrame(this._drawVisualization.bind(this));
    }
    
    _stopVisualization() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        
        // Clear canvas
        if (this._canvasCtx && this._canvas) {
            this._canvasCtx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
    }
    
    _drawVisualization() {
        if (!this._isPlaying || !this._analyser || !this._canvasCtx) return;
        
        this._animationId = requestAnimationFrame(this._drawVisualization.bind(this));
        
        // Get frequency data
        this._analyser.getByteFrequencyData(this._dataArray);
        
        const canvas = this._canvas;
        const ctx = this._canvasCtx;
        
        // Create a persistent time variable if it doesn't exist
        if (!this._visualizerTime) this._visualizerTime = 0;
        this._visualizerTime += 0.01; // Increment for smooth animations
        
        // Clear canvas with a gentle gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get theme colors for visualization
        const visualizerStartColor = getComputedStyle(this).getPropertyValue('--visualizer-color-start') || '#4ecdc4';
        const visualizerEndColor = getComputedStyle(this).getPropertyValue('--visualizer-color-end') || '#7ae7e0';
        
        // Initialize circular rings if not created
        if (!this._rings) {
            this._rings = Array(4).fill().map((_, i) => ({
                radius: canvas.height * (0.2 + i * 0.15),
                intensity: 0,
                offset: i * Math.PI / 7,
                segments: 150
            }));
        }
        
        // Initialize ocean waves if not created
        if (!this._waves) {
            this._waves = Array(3).fill().map((_, i) => ({
                height: 0.3 + (i * 0.2),
                speed: 0.05 - (i * 0.01),
                offset: i * 5,
                frequency: 7 - (i * 1.5),
                phase: 0
            }));
        }
        
        // Initialize bubble particles
        if (!this._bubbles) {
            this._bubbles = Array(30).fill().map(() => ({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 50,
                size: Math.random() * 6 + 2,
                speed: Math.random() * 0.7 + 0.3,
                opacity: Math.random() * 0.6 + 0.2,
                hue: Math.random() * 40 - 20 // hue variation to add to main color
            }));
        }
        
        // Calculate average audio levels for different frequency bands
        const bassBand = this._getFrequencyBandValue(0, 5);     // Low frequencies (bass)
        const midBand = this._getFrequencyBandValue(5, 20);     // Mid frequencies
        const trebleBand = this._getFrequencyBandValue(20, 50); // High frequencies
        
        // Update rings based on audio frequencies with smooth transitions
        this._rings.forEach((ring, i) => {
            // Different frequency bands affect different rings
            let targetIntensity;
            if (i === 0) targetIntensity = bassBand * 1.2;
            else if (i === 1) targetIntensity = midBand * 1.0;
            else if (i === 2) targetIntensity = trebleBand * 0.8;
            else targetIntensity = (bassBand + midBand + trebleBand) / 3 * 0.6;
            
            // Smooth transitions for intensity changes
            ring.intensity = ring.intensity * 0.95 + targetIntensity * 0.05;
            
            // Draw circular audio reactive pattern
            this._drawAudioReactiveRing(ctx, canvas.width / 2, canvas.height / 2, ring, visualizerStartColor, visualizerEndColor);
        });
        
        // Draw smooth ocean waves at the bottom
        ctx.save();
        this._waves.forEach((wave, i) => {
            // Update wave phase
            wave.phase += wave.speed * (0.5 + (bassBand + midBand) * 0.3); // Audio reactivity
            
            // Create wave gradient
            const waveGradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * (1 - wave.height));
            waveGradient.addColorStop(0, `rgba(${this._hexToRgb(visualizerStartColor)}, ${0.3 - i * 0.07})`);
            waveGradient.addColorStop(1, `rgba(${this._hexToRgb(visualizerEndColor)}, ${0.1 - i * 0.03})`);
            
            // Draw wave
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            
            for (let x = 0; x < canvas.width; x += 5) {
                // Create smooth wave pattern with multiple sine waves
                const waveHeight = Math.sin(x * 0.01 * wave.frequency + wave.phase + wave.offset) 
                                  * (10 + bassBand * 15) // Bass makes waves higher
                                  + Math.sin(x * 0.02 * (wave.frequency * 0.7) + wave.phase * 1.3) 
                                  * (5 + midBand * 10);  // Mids add detail
                                  
                const y = canvas.height - (canvas.height * wave.height) + waveHeight;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fillStyle = waveGradient;
            ctx.fill();
        });
        ctx.restore();
        
        // Draw and update bubble particles
        ctx.save();
        this._bubbles.forEach(bubble => {
            // Create a shimmering effect based on time and position
            const shimmer = Math.sin(this._visualizerTime * 2 + bubble.x * 0.01 + bubble.y * 0.01) * 0.2 + 0.8;
            
            // Make bubbles responsive to music
            const pulseSize = bubble.size * (1 + ((bassBand + midBand) * 0.05 * Math.random()));
            
            // Create radial gradient for bubbles
            const bubbleGradient = ctx.createRadialGradient(
                bubble.x, bubble.y, 0,
                bubble.x, bubble.y, pulseSize * 2
            );
            
            // Adjust bubble color based on theme with slight variations
            const baseColor = this._adjustColor(visualizerStartColor, bubble.hue);
            bubbleGradient.addColorStop(0, `rgba(${this._hexToRgb(baseColor)}, ${bubble.opacity * shimmer})`);
            bubbleGradient.addColorStop(0.6, `rgba(${this._hexToRgb(visualizerEndColor)}, ${bubble.opacity * 0.7 * shimmer})`);
            bubbleGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            // Draw bubble
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = bubbleGradient;
            ctx.fill();
            
            // Add subtle glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = baseColor;
            
            // Move bubbles upward with slight horizontal drift based on time
            const drift = Math.sin(this._visualizerTime + bubble.y * 0.01) * 0.5;
            bubble.x += drift;
            bubble.y -= bubble.speed * (1 + (midBand * 0.2)); // Music affects speed
            
            // Reset bubbles when they go off screen
            if (bubble.y < -bubble.size * 2) {
                bubble.y = canvas.height + bubble.size;
                bubble.x = Math.random() * canvas.width;
                bubble.size = Math.random() * 6 + 2;
                bubble.opacity = Math.random() * 0.6 + 0.2;
                bubble.hue = Math.random() * 40 - 20;
            }
        });
        ctx.restore();
        
        // Draw subtle central pulse effect
        const pulseSize = 30 + (bassBand * 50);
        const pulseOpacity = 0.05 + (bassBand * 0.1);
        
        ctx.beginPath();
        const pulseGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, pulseSize
        );
        pulseGradient.addColorStop(0, `rgba(${this._hexToRgb(visualizerEndColor)}, ${pulseOpacity})`);
        pulseGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pulseGradient;
        ctx.arc(canvas.width / 2, canvas.height / 2, pulseSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Helper method to get average value for a frequency band
    _getFrequencyBandValue(startIndex, endIndex) {
        let sum = 0;
        for (let i = startIndex; i < endIndex && i < this._dataArray.length; i++) {
            sum += this._dataArray[i];
        }
        return sum / ((endIndex - startIndex) * 255); // Normalize to 0-1
    }
    
    // Helper to draw audio reactive circular patterns
    _drawAudioReactiveRing(ctx, centerX, centerY, ring, startColor, endColor) {
        const intensity = ring.intensity;
        const segments = ring.segments;
        const radius = ring.radius * (0.8 + intensity * 0.3); // Pulse with audio
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Create radial gradient for the ring
        const ringGradient = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * 1.2);
        ringGradient.addColorStop(0, `rgba(${this._hexToRgb(startColor)}, ${0.03 + intensity * 0.05})`);
        ringGradient.addColorStop(1, `rgba(${this._hexToRgb(endColor)}, 0)`);
        
        // Draw ring with audio-reactive shape
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2 + ring.offset + this._visualizerTime * 0.2;
            
            // Create audio-reactive distortion
            const freqIndex = Math.floor((i / segments) * this._dataArray.length);
            const freqValue = this._dataArray[freqIndex] / 255;
            
            // Create smooth waveform appearance
            const waveform = 
                Math.sin(angle * 5 + this._visualizerTime * 2) * 0.1 +
                Math.sin(angle * 9 + this._visualizerTime * 1.5) * 0.05;
            
            // Combine base radius with audio reactivity and waveform
            const radiusOffset = radius * (1 + (waveform + freqValue * 0.3) * intensity);
            
            const x = Math.cos(angle) * radiusOffset;
            const y = Math.sin(angle) * radiusOffset;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = ringGradient;
        ctx.fill();
        
        // Add subtle glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = startColor;
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Helper to convert hex color to rgb format
    _hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace(/^#/, '');
        
        // Parse hex values
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        
        return `${r}, ${g}, ${b}`;
    }
    
    // Helper to adjust a color by shifting its hue
    _adjustColor(hexColor, hueShift) {
        // Simple approximation for slight color variations
        hexColor = hexColor.replace(/^#/, '');
        
        // Parse hex values
        let r = parseInt(hexColor.substring(0, 2), 16);
        let g = parseInt(hexColor.substring(2, 4), 16);
        let b = parseInt(hexColor.substring(4, 6), 16);
        
        // Simple hue shift approximation
        r = Math.min(255, Math.max(0, r + hueShift));
        g = Math.min(255, Math.max(0, g + hueShift * 0.7));
        b = Math.min(255, Math.max(0, b + hueShift * 1.5));
        
        // Convert back to hex
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    _setupEventListeners() {
        // Play/Pause button
        const playBtn = this._shadow.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this._audioElement) {
                    if (this._audioElement.paused) {
                        this._audioElement.play();
                    } else {
                        this._audioElement.pause();
                    }
                }
            });
        }

        // Next button
        const nextBtn = this._shadow.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this._changeSong(1);
            });
        }

        // Previous button
        const prevBtn = this._shadow.querySelector('.prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this._changeSong(-1);
            });
        }

        // Shuffle button
        const shuffleBtn = this._shadow.querySelector('.shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this._toggleShuffle();
            });
        }

        // Repeat button
        const repeatBtn = this._shadow.querySelector('.repeat-btn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => {
                this._toggleRepeat();
            });
        }

        // Volume controls
        const volumeSlider = this._shadow.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                this._setVolume(volume);
            });
        }

        const muteBtn = this._shadow.querySelector('.mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this._toggleMute();
            });
        }

        // Progress bar
        const progressBar = this._shadow.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                if (!this._audioElement) return;
                
                const rect = progressBar.getBoundingClientRect();
                const position = (e.clientX - rect.left) / rect.width;
                this._audioElement.currentTime = position * this._audioElement.duration;
            });
        }

        // Buy now button
        const buyNowBtn = this._shadow.querySelector('.buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                this._buyNow();
            });
        }
        
        // Theme selector
        const themeOptions = this._shadow.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                this._changeTheme(option.dataset.theme);
                
                // Update active class
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Save theme preference to localStorage if available
                try {
                    localStorage.setItem('chillMusicPlayerTheme', option.dataset.theme);
                } catch (e) {
                    console.log('Unable to save theme preference to localStorage');
                }
            });
            
            // Add keyboard accessibility
            option.setAttribute('tabindex', '0');
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    option.click();
                }
            });
        });
        
        // Load saved theme if available
        try {
            const savedTheme = localStorage.getItem('chillMusicPlayerTheme');
            if (savedTheme) {
                this._changeTheme(savedTheme);
                
                // Update active class
                themeOptions.forEach(opt => {
                    if (opt.dataset.theme === savedTheme) {
                        opt.classList.add('active');
                    } else {
                        opt.classList.remove('active');
                    }
                });
            }
        } catch (e) {
            console.log('Unable to load saved theme preference');
        }
        
        // Add keyboard accessibility to interactive elements
        const interactiveElements = this._shadow.querySelectorAll('.btn, .song-item, .service-link, .share-button, .artist-social-link');
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        });
    }
    
    _changeTheme(theme) {
        // Remove all theme classes
        this.classList.remove(
            'theme-ocean-breeze', 'theme-sunset-palms', 
            'theme-tropical-night', 'theme-beach-vibes'
        );
        
        // Add selected theme class
        if (theme !== 'default') {
            this.classList.add(`theme-${theme}`);
        }
    }

    connectedCallback() {
        if (this._playerData) {
            this.render();
        }
        
        // Add event listener for player commands from the API
        this.addEventListener('player-command', (e) => {
            if (!e.detail || !e.detail.command) return;
            
            const { command, data } = e.detail;
            
            switch (command) {
                case 'play':
                    if (this._audioElement && this._audioElement.paused) {
                        this._audioElement.play();
                    }
                    break;
                case 'pause':
                    if (this._audioElement && !this._audioElement.paused) {
                        this._audioElement.pause();
                    }
                    break;
                case 'next':
                    this._changeSong(1);
                    break;
                case 'previous':
                    this._changeSong(-1);
                    break;
                case 'setVolume':
                    if (data && typeof data.volume === 'number') {
                        this._setVolume(data.volume);
                        const volumeSlider = this._shadow.querySelector('.volume-slider');
                        if (volumeSlider) volumeSlider.value = data.volume;
                    }
                    break;
                case 'seekTo':
                    if (this._audioElement && data && typeof data.position === 'number') {
                        this._audioElement.currentTime = 
                            data.position * this._audioElement.duration;
                    }
                    break;
            }
        });
    }

    disconnectedCallback() {
        // Clean up resources when element is removed
        this._stopVisualization();
        
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        
        if (this._audioElement) {
            this._audioElement.pause();
        }
        
        if (this._audioContext) {
            this._audioContext.close();
        }
    }

    render() {
        if (!this._playerData || !this._playerData.songs || this._playerData.songs.length === 0) {
            console.warn("No player data available or songs array is empty");
            return;
        }
        
        const { songs, currentIndex = 0 } = this._playerData;
        const song = songs[currentIndex];
        
        if (!song) {
            console.warn("Could not find current song at index", currentIndex);
            return;
        }
        
        // Update UI elements
        const titleElement = this._shadow.querySelector('.track-title');
        const artistElement = this._shadow.querySelector('.track-artist');
        const albumElement = this._shadow.querySelector('.track-album');
        
        if (titleElement) titleElement.textContent = song.title || 'Unknown Title';
        if (artistElement) artistElement.textContent = song.artist || 'Unknown Artist';
        if (albumElement) albumElement.textContent = song.album || '';
        
        // Set cover image
        const coverImg = this._shadow.querySelector('.album-cover');
        if (coverImg) {
            if (song.coverImage) {
                coverImg.src = song.coverImage;
            } else {
                coverImg.src = 'https://via.placeholder.com/500?text=Chill+Vibes';
            }
        }
        
        // Update streaming service links
        this._updateStreamingLinks(song);
        
        // Update artist social links
        this._updateArtistSocialLinks(song);
        
        // Setup share buttons
        this._setupShareButtons();
        
        // Update song navigation list
        this._updateSongNavigation();
        
        // Update buy button
        const buyButton = this._shadow.querySelector('.buy-now-btn');
        if (buyButton) {
            if (song.purchaseLink) {
                buyButton.style.display = 'block';
            } else {
                buyButton.style.display = 'none';
            }
        }
        
        // Load audio if available
        if (this._audioElement && song.audioFile) {
            this._loadSong(song.audioFile);
        }
    }
    
    _updateSongNavigation() {
        const songNavigationContainer = this._shadow.querySelector('.song-navigation');
        if (!songNavigationContainer) return;
        
        // Clear existing content
        songNavigationContainer.innerHTML = '';
        
        // Create song list
        if (this._playerData && this._playerData.songs) {
            this._playerData.songs.forEach((song, index) => {
                const songItem = document.createElement('div');
                songItem.className = 'song-item';
                songItem.setAttribute('tabindex', '0'); // Make focusable for accessibility
                
                if (index === (this._playerData.currentIndex || 0)) {
                    songItem.classList.add('active');
                }
                
                songItem.innerHTML = `
                    <div class="song-item-info">
                        <div class="song-item-title">${song.title || 'Unknown'}</div>
                        <div class="song-item-artist">${song.artist || 'Unknown'}</div>
                    </div>
                `;
                
                songItem.addEventListener('click', () => {
                    const wasPlaying = this._isPlaying;
                    this._playerData.currentIndex = index;
                    this.render();
                    
                    if (wasPlaying && this._audioElement) {
                        this._audioElement.play();
                    }
                });
                
                // Add keyboard support
                songItem.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        songItem.click();
                    }
                });
                
                songNavigationContainer.appendChild(songItem);
            });
        }
    }

    _changeSong(direction) {
        if (!this._playerData || !this._playerData.songs || this._playerData.songs.length === 0) return;
        
        // Store current playing state before changing song
        const wasPlaying = this._isPlaying;
        
        let newIndex;
        
        if (this._isShuffled) {
            // Random selection for shuffle mode
            newIndex = Math.floor(Math.random() * this._playerData.songs.length);
            // Avoid playing the same song again
            while (newIndex === (this._playerData.currentIndex || 0) && this._playerData.songs.length > 1) {
                newIndex = Math.floor(Math.random() * this._playerData.songs.length);
            }
        } else {
            // Normal next/previous
            newIndex = (this._playerData.currentIndex || 0) + direction;
            
            // Loop around
            if (newIndex < 0) newIndex = this._playerData.songs.length - 1;
            if (newIndex >= this._playerData.songs.length) newIndex = 0;
        }
        
        this._playerData.currentIndex = newIndex;
        this.render();
        
        // Always auto-play the new song if the previous one was playing
        if (wasPlaying && this._audioElement) {
            this._audioElement.play();
        }
    }

    _setPlayingState(isPlaying) {
        this._isPlaying = isPlaying;
        
        const playIcon = this._shadow.querySelector('.play-icon');
        const pauseIcon = this._shadow.querySelector('.pause-icon');
        const coverArtwork = this._shadow.querySelector('.cover-artwork');
        
        if (isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (coverArtwork) coverArtwork.classList.add('playing');
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (coverArtwork) coverArtwork.classList.remove('playing');
        }
    }

    _setVolume(volume) {
        this._currentVolume = volume;
        
        if (this._audioElement) {
            this._audioElement.volume = volume;
        }
        
        // Update mute button state
        const volumeIcon = this._shadow.querySelector('.volume-icon');
        const muteIcon = this._shadow.querySelector('.mute-icon');
        
        if (volume === 0) {
            if (volumeIcon) volumeIcon.style.display = 'none';
            if (muteIcon) muteIcon.style.display = 'block';
        } else {
            if (volumeIcon) volumeIcon.style.display = 'block';
            if (muteIcon) muteIcon.style.display = 'none';
        }
    }

    _toggleMute() {
        if (this._audioElement) {
            if (this._audioElement.volume > 0) {
                this._lastVolume = this._audioElement.volume;
                this._setVolume(0);
                const volumeSlider = this._shadow.querySelector('.volume-slider');
                if (volumeSlider) volumeSlider.value = 0;
            } else {
                const volumeToSet = this._lastVolume || 0.8;
                this._setVolume(volumeToSet);
                const volumeSlider = this._shadow.querySelector('.volume-slider');
                if (volumeSlider) volumeSlider.value = volumeToSet;
            }
        }
    }

    _toggleShuffle() {
        this._isShuffled = !this._isShuffled;
        const shuffleBtn = this._shadow.querySelector('.shuffle-btn');
        
        if (shuffleBtn) {
            if (this._isShuffled) {
                shuffleBtn.style.color = getComputedStyle(this).getPropertyValue('--primary-color');
                shuffleBtn.style.textShadow = '0 0 10px ' + getComputedStyle(this).getPropertyValue('--primary-color');
            } else {
                shuffleBtn.style.color = '';
                shuffleBtn.style.textShadow = '';
            }
        }
    }

    _toggleRepeat() {
        this._isRepeat = !this._isRepeat;
        const repeatBtn = this._shadow.querySelector('.repeat-btn');
        
        if (repeatBtn) {
            if (this._isRepeat) {
                repeatBtn.style.color = getComputedStyle(this).getPropertyValue('--primary-color');
                repeatBtn.style.textShadow = '0 0 10px ' + getComputedStyle(this).getPropertyValue('--primary-color');
            } else {
                repeatBtn.style.color = '';
                repeatBtn.style.textShadow = '';
            }
        }
    }

    _updateCurrentTime() {
        if (!this._audioElement) return;
        
        const currentTime = this._audioElement.currentTime;
        const currentTimeElement = this._shadow.querySelector('.current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = this._formatTime(currentTime);
        }
        
        // Update progress bar
        const progress = this._audioElement.currentTime / this._audioElement.duration;
        const progressCurrent = this._shadow.querySelector('.progress-current');
        const progressIndicator = this._shadow.querySelector('.progress-indicator');
        
        if (!isNaN(progress)) {
            if (progressCurrent) progressCurrent.style.width = `${progress * 100}%`;
            if (progressIndicator) progressIndicator.style.left = `${progress * 100}%`;
        }
    }

    _updateDuration() {
        if (!this._audioElement) return;
        
        const duration = this._audioElement.duration;
        const totalTimeElement = this._shadow.querySelector('.total-time');
        
        if (!isNaN(duration) && totalTimeElement) {
            totalTimeElement.textContent = this._formatTime(duration);
        }
    }

    _formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        
        seconds = Math.floor(seconds);
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    _updateStreamingLinks(song) {
        // Update streaming service links if available in the song data
        const links = {
            spotify: this._shadow.querySelector('.service-spotify'),
            youtube: this._shadow.querySelector('.service-youtube'),
            soundcloud: this._shadow.querySelector('.service-soundcloud'),
            apple: this._shadow.querySelector('.service-apple')
        };
        
        // Always hide all links first
        for (const link of Object.values(links)) {
            if (link) link.style.display = 'none';
        }
        
        // Only show links that are explicitly provided in the song data
        if (song.streamingLinks) {
            for (const [service, url] of Object.entries(song.streamingLinks)) {
                if (url && links[service]) {
                    links[service].href = url;
                    links[service].style.display = 'flex';
                }
            }
        }
    }
    
    _updateArtistSocialLinks(song) {
        // Update artist social links if available
        const links = {
            facebook: this._shadow.querySelector('.artist-facebook'),
            twitter: this._shadow.querySelector('.artist-twitter'),
            instagram: this._shadow.querySelector('.artist-instagram'),
            youtube: this._shadow.querySelector('.artist-youtube'),
            tiktok: this._shadow.querySelector('.artist-tiktok'),
            website: this._shadow.querySelector('.artist-website')
        };
        
        // Always hide all links first
        for (const link of Object.values(links)) {
            if (link) link.style.display = 'none';
        }
        
        // Only show links that are explicitly provided in the artist data
        if (song.artistSocial) {
            for (const [platform, url] of Object.entries(song.artistSocial)) {
                if (url && links[platform]) {
                    links[platform].href = url;
                    links[platform].style.display = 'flex';
                }
            }
        }
    }
    
    // Set up share functionality
    _setupShareButtons() {
        const shareButtons = {
            facebook: this._shadow.querySelector('.share-facebook'),
            twitter: this._shadow.querySelector('.share-twitter'),
            whatsapp: this._shadow.querySelector('.share-whatsapp'),
            email: this._shadow.querySelector('.share-email'),
            copy: this._shadow.querySelector('.share-copy')
        };
        
        // Get current song info
        if (!this._playerData || !this._playerData.songs) return;
        
        const song = this._playerData.songs[this._playerData.currentIndex || 0];
        if (!song) return;
        
        const songTitle = song.title || 'Unknown Title';
        const artistName = song.artist || 'Unknown Artist';
        const shareText = `Vibing to "${songTitle}" by ${artistName} 🌴`;
        const shareUrl = song.shareUrl || window.location.href;
        
        // Facebook share
        if (shareButtons.facebook) {
            shareButtons.facebook.addEventListener('click', () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
            });
        }
        
        // Twitter share
        if (shareButtons.twitter) {
            shareButtons.twitter.addEventListener('click', () => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
            });
        }
        
        // WhatsApp share
        if (shareButtons.whatsapp) {
            shareButtons.whatsapp.addEventListener('click', () => {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
            });
        }
        
        // Email share
        if (shareButtons.email) {
            shareButtons.email.addEventListener('click', () => {
                window.open(`mailto:?subject=${encodeURIComponent('Check out this chill track!')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
            });
        }
        
        // Copy link
        if (shareButtons.copy) {
            shareButtons.copy.addEventListener('click', () => {
                try {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Link copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy link: ', err);
                    
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        document.execCommand('copy');
                        alert('Link copied to clipboard!');
                    } catch (err) {
                        console.error('Fallback copy failed: ', err);
                    }
                    
                    document.body.removeChild(textArea);
                }
            });
        }
    }

    _buyNow() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const song = this._playerData.songs[this._playerData.currentIndex || 0];
        
        if (song && song.purchaseLink) {
            window.open(song.purchaseLink, '_blank');
        } else {
            alert('Purchase link not available for this track.');
        }
    }
}

// Register the custom element
window.customElements.define('chill-vibes-player', ChillVibesMusicPlayer);
