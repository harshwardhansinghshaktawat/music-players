class GlassMorphPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._wavesurfer = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
                
                /* Default Theme: Aurora */
                :host {
    --glass-bg-primary: rgba(255, 255, 255, 0.1);
    --glass-bg-secondary: rgba(255, 255, 255, 0.15);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-shadow: rgba(0, 0, 0, 0.1);
    --accent-color: #C874D9;
    --accent-gradient: linear-gradient(135deg, #8A2BE2, #C874D9);
    --bg-gradient: linear-gradient(135deg, #2E0854, #5B0060, #8A2BE2);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --icon-color: rgba(255, 255, 255, 0.8);
    --visualizer-color1: rgba(195, 120, 217, 0.7);
    --visualizer-color2: rgba(138, 43, 226, 0.7);
    --visualizer-accent: rgba(230, 180, 255, 0.9);
    --blur-amount: 10px;
    
    display: block;
    width: 100%;
    height: 100%;
    font-family: 'Poppins', sans-serif;
    color: var(--text-primary);
    box-sizing: border-box;
    font-size: 16px;
}

/* Neo Mint Theme */
:host(.theme-neo-mint) {
    --glass-bg-primary: rgba(255, 255, 255, 0.08);
    --glass-bg-secondary: rgba(255, 255, 255, 0.12);
    --glass-border: rgba(255, 255, 255, 0.15);
    --glass-shadow: rgba(0, 0, 0, 0.15);
    --accent-color: #00E6C3;
    --accent-gradient: linear-gradient(135deg, #00E6C3, #01C4E7);
    --bg-gradient: linear-gradient(135deg, #004E5F, #007D69, #00B894);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --icon-color: rgba(255, 255, 255, 0.8);
    --visualizer-color1: rgba(0, 230, 195, 0.7);
    --visualizer-color2: rgba(1, 196, 231, 0.7);
    --visualizer-accent: rgba(180, 255, 240, 0.9);
}

/* Rose Quartz Theme */
:host(.theme-rose-quartz) {
    --glass-bg-primary: rgba(255, 255, 255, 0.15);
    --glass-bg-secondary: rgba(255, 255, 255, 0.2);
    --glass-border: rgba(255, 255, 255, 0.25);
    --glass-shadow: rgba(0, 0, 0, 0.1);
    --accent-color: #FF9999;
    --accent-gradient: linear-gradient(135deg, #FF9999, #FF6B8B);
    --bg-gradient: linear-gradient(135deg, #96545E, #C06C84, #F67280);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --icon-color: rgba(255, 255, 255, 0.8);
    --visualizer-color1: rgba(255, 153, 153, 0.7);
    --visualizer-color2: rgba(255, 107, 139, 0.7);
    --visualizer-accent: rgba(255, 220, 220, 0.9);
}

/* Electric Blue Theme */
:host(.theme-electric-blue) {
    --glass-bg-primary: rgba(255, 255, 255, 0.1);
    --glass-bg-secondary: rgba(255, 255, 255, 0.15);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-shadow: rgba(0, 0, 0, 0.1);
    --accent-color: #2196F3;
    --accent-gradient: linear-gradient(135deg, #2196F3, #00C9FF);
    --bg-gradient: linear-gradient(135deg, #1A237E, #0D47A1, #2979FF);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --icon-color: rgba(255, 255, 255, 0.8);
    --visualizer-color1: rgba(33, 150, 243, 0.7);
    --visualizer-color2: rgba(0, 201, 255, 0.7);
    --visualizer-accent: rgba(180, 230, 255, 0.9);
}

/* Sunset Coral Theme */
:host(.theme-sunset-coral) {
    --glass-bg-primary: rgba(255, 255, 255, 0.1);
    --glass-bg-secondary: rgba(255, 255, 255, 0.15);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-shadow: rgba(0, 0, 0, 0.1);
    --accent-color: #FF6B6B;
    --accent-gradient: linear-gradient(135deg, #FF6B6B, #FFD166);
    --bg-gradient: linear-gradient(135deg, #7D2A2A, #B83B5E, #FF6B6B);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --icon-color: rgba(255, 255, 255, 0.8);
    --visualizer-color1: rgba(255, 107, 107, 0.7);
    --visualizer-color2: rgba(255, 209, 102, 0.7);
    --visualizer-accent: rgba(255, 220, 180, 0.9);
}
                
                *, *::before, *::after {
                    box-sizing: inherit;
                    margin: 0;
                    padding: 0;
                }
                
                .glass-container {
    width: 100%;
    height: 100%;
    background: var(--bg-gradient);
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
}
                
                /* Glassmorphism common styles */
                .glass-panel {
                    background: var(--glass-bg-primary);
                    backdrop-filter: blur(var(--blur-amount));
                    -webkit-backdrop-filter: blur(var(--blur-amount));
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    box-shadow: 0 4px 30px var(--glass-shadow);
                }
                
                .glass-secondary {
                    background: var(--glass-bg-secondary);
                    backdrop-filter: blur(var(--blur-amount));
                    -webkit-backdrop-filter: blur(var(--blur-amount));
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                }
                
                /* Floating orbs background decoration */
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(60px);
                    opacity: 0.5;
                    z-index: 0;
                }
                
                .orb-1 {
                    width: 300px;
                    height: 300px;
                    background: var(--accent-color);
                    top: -100px;
                    left: -100px;
                    animation: float 12s ease-in-out infinite;
                }
                
                .orb-2 {
                    width: 200px;
                    height: 200px;
                    background: var(--visualizer-color2);
                    bottom: -70px;
                    right: 10%;
                    animation: float 14s ease-in-out 1s infinite reverse;
                }
                
                .orb-3 {
                    width: 150px;
                    height: 150px;
                    background: var(--visualizer-color1);
                    top: 10%;
                    right: -60px;
                    animation: float 16s ease-in-out 0.5s infinite;
                }
                
                @keyframes float {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(10px, 10px) rotate(2deg); }
                    50% { transform: translate(5px, -5px) rotate(-1deg); }
                    75% { transform: translate(-10px, 5px) rotate(1deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                
                /* Player Header */
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px;
                    z-index: 2;
                    position: relative;
                }
                
                .player-title {
                    font-size: 1.5em;
                    font-weight: 600;
                    background: var(--accent-gradient);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    letter-spacing: 0.5px;
                }
                
                /* Theme Selector */
                .theme-selector {
                    display: flex;
                    gap: 10px;
                }
                
                .theme-option {
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    border: 2px solid transparent;
                }
                
                .theme-option:hover {
                    transform: scale(1.15);
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
                }
                
                .theme-option.active {
                    border: 2px solid white;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
                }
                
                .theme-option:focus {
                    outline: none;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
                }
                
                .theme-ultraviolet {
    background: linear-gradient(135deg, #8A2BE2, #C874D9);
}

.theme-neo-mint {
    background: linear-gradient(135deg, #00E6C3, #01C4E7);
}

.theme-rose-quartz {
    background: linear-gradient(135deg, #FF9999, #FF6B8B);
}

.theme-electric-blue {
    background: linear-gradient(135deg, #2196F3, #00C9FF);
}

.theme-sunset-coral {
    background: linear-gradient(135deg, #FF6B6B, #FFD166);
}
                
                /* Main layout */
                .player-main {
                    display: flex;
                    flex-direction: column;
                    padding: 0 25px 25px;
                    flex: 1;
                    position: relative;
                    z-index: 2;
                    gap: 20px;
                    overflow: hidden;
                }
                
                @media (min-width: 900px) {
                    .player-main {
                        flex-direction: row;
                        gap: 25px;
                    }
                }
                
                /* Left section with artwork */
                .player-artwork-section {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    flex: 1;
                }
                
                /* Artwork container with glass effect */
                .artwork-container {
                    aspect-ratio: 1 / 1;
                    width: 100%;
                    max-width: 350px;
                    margin: 0 auto;
                    position: relative;
                    overflow: hidden;
                    border-radius: 16px;
                    background: var(--glass-bg-primary);
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                }
                
                /* Spinning disk effect behind the artwork */
                .spinning-disk {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.5;
                    background: conic-gradient(
                        rgba(255, 255, 255, 0.1) 0deg,
                        rgba(255, 255, 255, 0.2) 90deg,
                        rgba(255, 255, 255, 0.1) 180deg,
                        rgba(255, 255, 255, 0.2) 270deg,
                        rgba(255, 255, 255, 0.1) 360deg
                    );
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 80%;
                    height: 80%;
                    border: 15px solid rgba(255, 255, 255, 0.05);
                }
                
                .spinning-disk::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 15%;
                    height: 15%;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
                }
                
                .disk-spinning {
                    animation: spin 8s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                
                .album-cover {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    mix-blend-mode: normal;
                    opacity: 0.9;
                    transition: all 0.5s ease;
                }
                
                .artwork-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        rgba(0, 0, 0, 0.1),
                        rgba(0, 0, 0, 0.4)
                    );
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 25px;
                }
                
                /* Centered circular play button */
                .artwork-play-btn {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    opacity: 0;
                    z-index: 10;
                }
                
                .artwork-container:hover .artwork-play-btn {
                    opacity: 1;
                }
                
                .artwork-play-btn svg {
                    width: 24px;
                    height: 24px;
                    fill: white;
                    margin-left: 3px; /* Offset for play icon */
                }
                
                .artwork-play-btn:hover {
                    transform: translate(-50%, -50%) scale(1.1);
                    background: rgba(255, 255, 255, 0.25);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }
                
                /* Track information */
                .track-info {
                    text-align: center;
                    padding: 0 15px;
                }
                
                .track-title {
                    font-size: 1.6em;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-artist {
                    font-size: 1.1em;
                    color: var(--text-secondary);
                    margin-bottom: 2px;
                    font-weight: 400;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-album {
                    font-size: 0.9em;
                    color: var(--text-secondary);
                    opacity: 0.8;
                    font-weight: 300;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                /* Right section with controls and playlist */
                .player-controls-section {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    flex: 1;
                }
                
                /* Circle visualizer container */
                .visualizer-container {
    aspect-ratio: 2 / 1;
    width: 100%;
    background: var(--glass-bg-secondary);
    backdrop-filter: blur(var(--blur-amount));
    -webkit-backdrop-filter: blur(var(--blur-amount));
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 5px 15px var(--glass-shadow);
}
                
                .audio-visualizer {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                
                /* Controls panel */
                .controls-panel {
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    gap: 15px;
                }
                
                /* Progress bar with glass effect */
                .progress-container {
                    width: 100%;
                    margin-bottom: 10px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                    cursor: pointer;
                    position: relative;
                }
                
                .progress-fill {
                    height: 100%;
                    background: var(--accent-gradient);
                    border-radius: 3px;
                    width: 0%;
                    position: relative;
                    transition: width 0.1s linear;
                }
                
                .progress-handle {
                    width: 16px;
                    height: 16px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                    display: none;
                }
                
                .progress-bar:hover .progress-handle {
                    display: block;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85em;
                    color: var(--text-secondary);
                    margin-top: 8px;
                    font-family: 'Inter', sans-serif;
                    letter-spacing: 0.3px;
                }
                
                /* Main playback controls */
                .playback-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    margin: 10px 0;
                }
                
                .control-button {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: var(--icon-color);
                }
                
                .control-button:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
                }
                
                .control-button svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                .play-button {
                    width: 55px;
                    height: 55px;
                    background: var(--accent-gradient);
                    color: white;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                }
                
                .play-button:hover {
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
                }
                
                .play-button svg {
                    width: 22px;
                    height: 22px;
                    margin-left: 3px; /* Offset for play icon */
                }
                
                /* Secondary controls row */
                .secondary-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex: 1;
                    max-width: 150px;
                }
                
                .volume-button {
                    color: var(--icon-color);
                    cursor: pointer;
                    transition: color 0.3s ease;
                }
                
                .volume-button:hover {
                    color: var(--text-primary);
                }
                
                .volume-button svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .volume-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    outline: none;
                    transition: all 0.3s ease;
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
                }
                
                .volume-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: none;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
                }
                
                .volume-slider:hover::-webkit-slider-thumb {
                    transform: scale(1.2);
                }
                
                .volume-slider:hover::-moz-range-thumb {
                    transform: scale(1.2);
                }
                
                .additional-controls {
                    display: flex;
                    gap: 15px;
                }
                
                .control-icon {
                    color: var(--icon-color);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .control-icon:hover {
                    color: var(--text-primary);
                    transform: translateY(-2px);
                }
                
                .control-icon.active {
                    color: var(--accent-color);
                }
                
                .control-icon svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                /* Playlist section with glass effect */
                .playlist-container {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 200px;
                    max-height: 400px;
                }
                
                .playlist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .playlist-title {
                    font-size: 1.1em;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-primary);
                }
                
                .playlist-title svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                /* Social links in playlist header */
                .social-links {
                    display: flex;
                    gap: 12px;
                }
                
                .social-link {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--icon-color);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .social-link:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    color: var(--text-primary);
                }
                
                .social-link svg {
                    width: 15px;
                    height: 15px;
                    fill: currentColor;
                }
                
                /* Track list with glass effect */
                .tracks-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                /* Scrollbar styling */
                .tracks-container::-webkit-scrollbar {
                    width: 5px;
                }
                
                .tracks-container::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                
                .tracks-container::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                
                .tracks-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                /* Track item styles */
                .track-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 10px 15px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .track-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateX(5px);
                }
                
                .track-item.active {
                    background: rgba(255, 255, 255, 0.15);
                    border-left: 3px solid var(--accent-color);
                }
                
                .track-number {
                    font-weight: 500;
                    font-size: 0.9em;
                    color: var(--text-secondary);
                    width: 24px;
                    text-align: center;
                }
                
                .track-item.active .track-number {
                    color: var(--accent-color);
                }
                
                .track-info-small {
                    flex: 1;
                    min-width: 0; /* For text overflow to work */
                }
                
                .track-title-small {
                    font-weight: 500;
                    font-size: 0.95em;
                    margin-bottom: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-artist-small {
                    font-size: 0.8em;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-duration {
                    font-size: 0.85em;
                    color: var(--text-secondary);
                    flex-shrink: 0;
                }
                
                /* Bottom section for services */
                .services-panel {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .services-title {
                    font-size: 0.9em;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-bottom: 5px;
                }
                
                .service-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .service-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 15px;
                    border-radius: 30px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: var(--text-secondary);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 500;
                }
                
                .service-button:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                    color: var(--text-primary);
                }
                
                .service-button svg {
                    width: 15px;
                    height: 15px;
                    fill: currentColor;
                }
                
                /* Share panel */
                .share-panel {
                    margin-top: 10px;
                }
                
                /* Buy button with glass effect */
                .buy-button {
                    width: 100%;
                    padding: 12px;
                    background: var(--accent-gradient);
                    border: none;
                    border-radius: 30px;
                    color: white;
                    font-weight: 600;
                    font-size: 0.95em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    margin-top: 15px;
                    display: block;
                    text-align: center;
                }
                
                .buy-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }
                
                /* Responsive styles */
                @media (max-width: 900px) {
                    .player-main {
                        flex-direction: column;
                    }
                    
                    .artwork-container {
                        max-width: 300px;
                    }
                }
                
                @media (max-width: 600px) {
                    .player-header {
                        padding: 15px 20px;
                    }
                    
                    .player-main {
                        padding: 0 20px 20px;
                        gap: 15px;
                    }
                    
                    .track-title {
                        font-size: 1.4em;
                    }
                    
                    .track-artist {
                        font-size: 1em;
                    }
                    
                    .track-album {
                        font-size: 0.85em;
                    }
                    
                    .artwork-container {
                        max-width: 250px;
                    }
                    
                    .controls-panel {
                        padding: 15px;
                    }
                    
                    .playlist-header {
                        padding: 12px 15px;
                    }
                    
                    .tracks-container {
                        padding: 8px 15px;
                    }
                    
                    .services-panel {
                        padding: 15px;
                    }
                }
                
                /* Accessibility focus styles */
                button:focus-visible,
                input:focus-visible,
                a:focus-visible,
                .track-item:focus-visible,
                .theme-option:focus-visible {
                    outline: 2px solid var(--accent-color);
                    outline-offset: 3px;
                }
                
                /* Toast notification */
                .notification {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 30px;
                    padding: 12px 25px;
                    color: white;
                    font-size: 0.9em;
                    font-weight: 500;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }
                
                .notification.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            </style>
            
            <div class="glass-container">
                <!-- Floating background orbs -->
                <div class="orb orb-1"></div>
                <div class="orb orb-2"></div>
                <div class="orb orb-3"></div>
                
                <!-- Player Header -->
                <div class="player-header">
                    <h1 class="player-title">Music Player</h1>
                    
                    <div class="theme-selector">
    <div class="theme-option theme-ultraviolet active" data-theme="default" title="Ultraviolet Theme" tabindex="0"></div>
    <div class="theme-option theme-neo-mint" data-theme="neo-mint" title="Neo Mint Theme" tabindex="0"></div>
    <div class="theme-option theme-rose-quartz" data-theme="rose-quartz" title="Rose Quartz Theme" tabindex="0"></div>
    <div class="theme-option theme-electric-blue" data-theme="electric-blue" title="Electric Blue Theme" tabindex="0"></div>
    <div class="theme-option theme-sunset-coral" data-theme="sunset-coral" title="Sunset Coral Theme" tabindex="0"></div>
</div>
                </div>
                
                <!-- Main Player Layout -->
                <div class="player-main">
                    <!-- Left side - Artwork and Track Info -->
                    <div class="player-artwork-section">
                        <!-- Artwork with glass effect -->
                        <div class="artwork-container glass-panel">
                            <div class="spinning-disk"></div>
                            <img class="album-cover" src="" alt="Album Cover">
                            
                            <!-- Play button overlay -->
                            <div class="artwork-play-btn" role="button" tabindex="0" aria-label="Play or pause">
                                <svg class="play-svg" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                <svg class="pause-svg" viewBox="0 0 24 24" style="display: none;">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            </div>
                            
                            <div class="artwork-overlay">
                                <!-- Intentionally empty, for gradient overlay effect -->
                            </div>
                        </div>
                        
                        <!-- Track Info -->
                        <div class="track-info">
                            <h2 class="track-title">Song Title</h2>
                            <h3 class="track-artist">Artist Name</h3>
                            <p class="track-album">Album Name</p>
                        </div>
                        
                        <!-- Buy Button -->
                        <a href="#" class="buy-button" tabindex="0">Get This Track</a>
                    </div>
                    
                    <!-- Right side - Controls and Playlist -->
                    <div class="player-controls-section">
                        <!-- Visualizer with glass effect -->
                        <div class="visualizer-container glass-panel">
                            <canvas class="audio-visualizer" id="audioVisualizer"></canvas>
                        </div>
                        
                        <!-- Controls Panel -->
                        <div class="controls-panel glass-panel">
                            <!-- Progress Bar -->
                            <div class="progress-container">
                                <div class="progress-bar" tabindex="0" role="slider" aria-label="Playback progress">
                                    <div class="progress-fill"></div>
                                    <div class="progress-handle"></div>
                                </div>
                                <div class="time-display">
                                    <span class="current-time">0:00</span>
                                    <span class="total-time">0:00</span>
                                </div>
                            </div>
                            
                            <!-- Main Playback Controls -->
                            <div class="playback-controls">
                                <button class="control-button shuffle-button" title="Shuffle">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                                    </svg>
                                </button>
                                <button class="control-button prev-button" title="Previous">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                    </svg>
                                </button>
                                <button class="control-button play-button" title="Play/Pause">
                                    <svg class="play-svg" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <svg class="pause-svg" viewBox="0 0 24 24" style="display: none;">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                    </svg>
                                </button>
                                <button class="control-button next-button" title="Next">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                                <button class="control-button repeat-button" title="Repeat">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Secondary Controls (Volume, etc) -->
                            <div class="secondary-controls">
                                <div class="volume-control">
                                    <div class="volume-button" title="Mute/Unmute">
                                        <svg class="volume-icon" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                        </svg>
                                        <svg class="mute-icon" viewBox="0 0 24 24" style="display: none;">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                        </svg>
                                    </div>
                                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.8" title="Volume">
                                </div>
                                
                                <div class="additional-controls">
                                    <div class="control-icon add-to-playlist" title="Add to Playlist">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z"/>
                                        </svg>
                                    </div>
                                    <div class="control-icon favorite-button" title="Add to Favorites">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Playlist Section -->
                        <div class="playlist-container glass-panel">
                            <div class="playlist-header">
                                <div class="playlist-title">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                                    </svg>
                                    <span>Playlist</span>
                                </div>
                                
                                <!-- Social Media Links -->
                                <div class="social-links">
                                    <a href="#" class="social-link" title="Facebook" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                                        </svg>
                                    </a>
                                    <a href="#" class="social-link" title="Twitter" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/>
                                        </svg>
                                    </a>
                                    <a href="#" class="social-link" title="Instagram" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/>
                                        </svg>
                                    </a>
                                    <a href="#" class="social-link" title="Website" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M16.2,16.2L14.8,14.8C14.2,15.3 13.3,15.6 12.4,15.6C11.4,15.6 10.5,15.2 9.8,14.6L8.4,16C9.4,16.9 10.8,17.4 12.3,17.4C13.9,17.4 15.3,16.8 16.2,16.2M18,12C18,12 18,12 18,12C18,12.7 17.8,13.4 17.6,14L19.1,15.5C19.7,14.5 20,13.3 20,12C20,10.7 19.7,9.5 19.1,8.5L17.6,10C17.8,10.6 18,11.3 18,12M12,4C7.6,4 4,7.6 4,12C4,13.3 4.3,14.5 4.9,15.5L6.4,14C6.2,13.4 6,12.7 6,12C6,11.3 6.2,10.6 6.4,10L4.9,8.5C4.3,9.5 4,10.7 4,12C4,12 4,12 4,12C4,12.7 4.2,13.4 4.4,14.1L5.9,12.6C5.8,12.4 5.7,12.2 5.7,12C5.7,9.5 7.7,7.4 10.2,7.4C11.1,7.4 12,7.7 12.7,8.2L14.2,6.7C13.2,5.9 11.9,5.4 10.5,5.4C8.9,5.4 7.5,6 6.6,6.6L8,8C8.7,7.5 9.6,7.2 10.5,7.2C11.5,7.2 12.4,7.6 13.1,8.2L14.5,6.8C13.5,5.9 12.1,5.4 10.6,5.4C9,5.4 7.6,6 6.7,6.6L8.1,8C8.8,7.5 9.7,7.2 10.6,7.2C11.6,7.2 12.5,7.6 13.2,8.2L14.6,6.8C13.6,5.9 12.2,5.4 10.7,5.4C10.6,5.4 10.5,5.4 10.4,5.4C10.9,5.1 11.4,5 12,5C16.4,5 20,8.6 20,13C20,17.4 16.4,21 12,21C7.6,21 4,17.4 4,13C4,8.6 7.6,5 12,5M12,9C10.3,9 9,10.3 9,12C9,13.7 10.3,15 12,15C13.7,15 15,13.7 15,12C15,10.3 13.7,9 12,9Z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Tracks List Container -->
                            <div class="tracks-container">
                                <!-- Track items will be dynamically added here -->
                            </div>
                        </div>
                        
                        <!-- Services Panel -->
                        <div class="services-panel glass-panel">
                            <div class="services-title">Listen On</div>
                            <div class="service-buttons">
                                <a href="#" class="service-button spotify-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M17.9,10.9C14.7,9 9.35,8.8 6.3,9.75C5.8,9.9 5.3,9.6 5.15,9.15C5,8.65 5.3,8.15 5.75,8C9.3,6.95 15.15,7.15 18.85,9.35C19.3,9.6 19.45,10.2 19.2,10.65C18.95,11 18.35,11.15 17.9,10.9M17.8,13.7C17.55,14.05 17.1,14.2 16.75,13.95C14.05,12.3 9.95,11.8 6.8,12.8C6.4,12.9 5.95,12.7 5.85,12.3C5.75,11.9 5.95,11.45 6.35,11.35C10,10.25 14.5,10.8 17.6,12.7C17.9,12.85 18.05,13.35 17.8,13.7M16.6,16.45C16.4,16.75 16.05,16.85 15.75,16.65C13.4,15.2 10.45,14.9 6.95,15.7C6.6,15.8 6.3,15.55 6.2,15.25C6.1,14.9 6.35,14.6 6.65,14.5C10.45,13.65 13.75,14 16.35,15.6C16.7,15.75 16.75,16.15 16.6,16.45M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                    </svg>
                                    <span>Spotify</span>
                                </a>
                                <a href="#" class="service-button apple-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
                                    </svg>
                                    <span>Apple Music</span>
                                </a>
                                <a href="#" class="service-button youtube-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                                    </svg>
                                    <span>YouTube</span>
                                </a>
                                <a href="#" class="service-button soundcloud-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M11.56,8.87V17H20.32V17C22.17,16.87 23,15.73 23,14.33C23,12.85 21.88,11.66 20.38,11.66C20,11.66 19.68,11.74 19.35,11.88C19.11,9.54 17.12,7.71 14.67,7.71C13.5,7.71 12.39,8.15 11.56,8.87M10.68,9.89C10.38,9.71 10.06,9.57 9.71,9.5V17H11.1V9.34C10.95,9.5 10.81,9.7 10.68,9.89M8.33,9.35V17H9.25V9.38C9.06,9.35 8.87,9.34 8.67,9.34C8.55,9.34 8.44,9.34 8.33,9.35M6.5,10V17H7.41V9.54C7.08,9.65 6.77,9.81 6.5,10M4.83,12.5C4.77,12.5 4.71,12.44 4.64,12.41V17H5.56V10.86C5.19,11.34 4.94,11.91 4.83,12.5M2.79,12.22V16.91C3,16.97 3.24,17 3.5,17H3.72V12.14C3.64,12.13 3.56,12.12 3.5,12.12C3.24,12.12 3,12.16 2.79,12.22M1,14.56C1,15.31 1.34,15.97 1.87,16.42V12.71C1.34,13.15 1,13.82 1,14.56Z"/>
                                    </svg>
                                    <span>SoundCloud</span>
                                </a>
                            </div>
                            
                            <!-- Share Panel -->
                            <div class="share-panel">
                                <div class="services-title">Share</div>
                                <div class="service-buttons">
                                    <button class="service-button share-facebook" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                                        </svg>
                                        <span>Facebook</span>
                                    </button>
                                    <button class="service-button share-twitter" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/>
                                        </svg>
                                        <span>Twitter</span>
                                    </button>
                                    <button class="service-button share-copy" tabindex="0">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M16,1H4C2.9,1 2,1.9 2,3V17H4V3H16V1M19,5H8C6.9,5 6,5.9 6,7V21C6,22.1 6.9,23 8,23H19C20.1,23 21,22.1 21,21V7C21,5.9 20.1,5 19,5M19,21H8V7H19V21Z"/>
                                        </svg>
                                        <span>Copy Link</span>
                                    </button>
                                </div>
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
                console.log("Received player data:", newValue); // For debugging
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
                            shareUrl: song.shareUrl || window.location.href,
                            duration: song.duration || '0:00'
                        };
                    });
                }
                
                this.render();
                
                // If audio element exists, load the current song
                if (this._audioElement && 
                    this._playerData && 
                    this._playerData.songs && 
                    this._playerData.songs.length > 0) {
                    
                    const currentSong = this._playerData.songs[this._playerData.currentIndex];
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
        this._analyser.fftSize = 512; // Larger FFT for more detailed visualization
        this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
        
        // Connect audio element to analyzer
        this._source = this._audioContext.createMediaElementSource(this._audioElement);
        this._source.connect(this._analyser);
        this._analyser.connect(this._audioContext.destination);
        
        // Set up audio element events
        this._audioElement.addEventListener('loadedmetadata', () => {
            this._updateDuration();
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
            // Don't change playing state here as we're going to play the next song
            this._stopVisualization();
            
            // Auto play next if not in repeat mode
            if (!this._isRepeat) {
                // Use forceAutoplay to ensure the next song plays automatically
                this._changeSong(1, true);
            } else {
                // For repeat mode, play the same song again
                this._audioElement.currentTime = 0;
                this._audioElement.play();
            }
        });
        
        // Load the current song if data is available
        if (this._playerData && this._playerData.songs && this._playerData.songs.length > 0) {
            const currentSong = this._playerData.songs[this._playerData.currentIndex];
            if (currentSong && currentSong.audioFile) {
                this._loadSong(currentSong.audioFile);
            }
        }
    }
    
    _loadSong(url) {
        if (this._audioElement) {
            console.log("Loading song:", url);
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
    
    // Clear canvas with a transparent background that matches the glass effect
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // To achieve a true glassmorphism effect, we'll use a semi-transparent gradient that
    // matches our theme colors rather than clearing with black
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
    bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get colors from CSS variables
    const primaryColor = getComputedStyle(this).getPropertyValue('--visualizer-color1').trim();
    const secondaryColor = getComputedStyle(this).getPropertyValue('--visualizer-color2').trim();
    const accentColor = getComputedStyle(this).getPropertyValue('--visualizer-accent').trim();
    
    // Create a wave effect visualizer that fits glassmorphism aesthetic
    // We'll create a smooth wave that reacts to the music
    const sliceWidth = canvas.width / this._dataArray.length;
    const centerY = canvas.height / 2;
    
    // Calculate wave points with smooth transitions
    if (!this._prevWavePoints) {
        this._prevWavePoints = new Array(this._dataArray.length).fill(centerY);
    }
    
    // Apply smoothing factor to transitions
    const smoothingFactor = 0.3;
    
    // Draw main wave
    this._drawWave(ctx, primaryColor, sliceWidth, centerY, smoothingFactor, 0.7);
    
    // Draw second wave (offset and with different color)
    this._drawWave(ctx, secondaryColor, sliceWidth, centerY, smoothingFactor, 0.5, 10);
    
    // Add flowing particles along the wave for extra effect
    this._drawFlowingParticles(ctx, accentColor);
    
    // Add subtle reflections
    this._drawReflections(ctx);
}

// Helper method to draw wave
_drawWave(ctx, color, sliceWidth, centerY, smoothingFactor, alpha, yOffset = 0) {
    const canvas = this._canvas;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i < this._dataArray.length; i++) {
        // Get normalized value (0 to 1)
        const value = this._dataArray[i] / 255.0;
        
        // Calculate wave height with smoothing
        const waveHeight = value * canvas.height * 0.4; // Limit height to 40% of canvas
        const targetY = centerY - waveHeight + yOffset;
        
        // Apply smoothing
        if (!this._prevWavePoints[i]) this._prevWavePoints[i] = centerY;
        this._prevWavePoints[i] = this._prevWavePoints[i] * (1 - smoothingFactor) + targetY * smoothingFactor;
        
        const x = i * sliceWidth;
        const y = this._prevWavePoints[i];
        
        // Use quadratic curves for smoother waves
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            const prevX = (i - 1) * sliceWidth;
            const prevY = this._prevWavePoints[i - 1];
            const cpX = (x + prevX) / 2;
            const cpY = (y + prevY) / 2;
            
            ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
    }
    
    // Complete the wave by drawing to the bottom corners
    ctx.lineTo(canvas.width, centerY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    
    // Create gradient fill for wave
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = alpha;
    ctx.fill();
    
    // Add glow to the wave
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.8;
    ctx.stroke();
    
    // Reset global alpha
    ctx.globalAlpha = 1;
}

// Add flowing particles that move along the wave
_drawFlowingParticles(ctx, color) {
    // Initialize particles if they don't exist
    if (!this._particles) {
        this._particles = [];
        this._createParticles(30);
    }
    
    // Update and draw particles
    const canvas = this._canvas;
    
    for (let i = 0; i < this._particles.length; i++) {
        const p = this._particles[i];
        
        // Update position
        p.x += p.speed;
        
        // If particle goes off-screen, reset it
        if (p.x > canvas.width) {
            p.x = 0;
            p.y = canvas.height * Math.random() * 0.7 + canvas.height * 0.15;
            p.size = Math.random() * 3 + 1;
            p.speed = Math.random() * 1 + 0.5;
            p.opacity = Math.random() * 0.7 + 0.3;
        }
        
        // Get the intensity of audio at this x-position
        const dataIndex = Math.floor((p.x / canvas.width) * this._dataArray.length);
        const intensity = this._dataArray[dataIndex] / 255;
        
        // Make particles react to the audio
        const yOffset = intensity * 30;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y - yOffset, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity * (intensity + 0.2);
        ctx.fill();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
}

// Create flowing particles
_createParticles(count) {
    const canvas = this._canvas;
    
    for (let i = 0; i < count; i++) {
        this._particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height * Math.random() * 0.7 + canvas.height * 0.15,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            opacity: Math.random() * 0.7 + 0.3
        });
    }
}

// Add subtle reflections for glass effect
_drawReflections(ctx) {
    const canvas = this._canvas;
    
    // Draw subtle light reflection
    const reflection = ctx.createLinearGradient(0, 0, canvas.width, 0);
    reflection.addColorStop(0, 'rgba(255, 255, 255, 0)');
    reflection.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    reflection.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);
}


    _setupEventListeners() {
        // Artwork play button
        const artworkPlayBtn = this._shadow.querySelector('.artwork-play-btn');
        if (artworkPlayBtn) {
            artworkPlayBtn.addEventListener('click', () => {
                this._togglePlayback();
            });
            
            // Make the play button keyboard accessible
            artworkPlayBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._togglePlayback();
                }
            });
        }
        
        // Main play button
        const playButton = this._shadow.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this._togglePlayback();
            });
        }

        // Next button
        const nextButton = this._shadow.querySelector('.next-button');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this._changeSong(1);
            });
        }

        // Previous button
        const prevButton = this._shadow.querySelector('.prev-button');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this._changeSong(-1);
            });
        }

        // Shuffle button
        const shuffleButton = this._shadow.querySelector('.shuffle-button');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => {
                this._toggleShuffle();
            });
        }

        // Repeat button
        const repeatButton = this._shadow.querySelector('.repeat-button');
        if (repeatButton) {
            repeatButton.addEventListener('click', () => {
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

        const volumeButton = this._shadow.querySelector('.volume-button');
        if (volumeButton) {
            volumeButton.addEventListener('click', () => {
                this._toggleMute();
            });
        }

        // Progress bar
        const progressBar = this._shadow.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                if (!this._audioElement || !this._audioElement.duration) return;
                
                const rect = progressBar.getBoundingClientRect();
                const position = (e.clientX - rect.left) / rect.width;
                this._audioElement.currentTime = position * this._audioElement.duration;
            });
            
            // Keyboard navigation for progress bar
            progressBar.addEventListener('keydown', (e) => {
                if (!this._audioElement || !this._audioElement.duration) return;
                
                const duration = this._audioElement.duration;
                const currentTime = this._audioElement.currentTime;
                const step = duration * 0.05; // 5% of duration for each key press
                
                switch (e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        this._audioElement.currentTime = Math.min(duration, currentTime + step);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this._audioElement.currentTime = Math.max(0, currentTime - step);
                        break;
                    case 'Home':
                        e.preventDefault();
                        this._audioElement.currentTime = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        this._audioElement.currentTime = duration;
                        break;
                }
            });
        }

        // Buy button
        const buyButton = this._shadow.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', (e) => {
                e.preventDefault();
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
                    localStorage.setItem('glassMorphPlayerTheme', option.dataset.theme);
                } catch (e) {
                    console.log('Unable to save theme preference to localStorage');
                }
            });
            
            // Make theme options keyboard accessible
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    option.click();
                }
            });
        });
        
        // Load saved theme if available
        try {
            const savedTheme = localStorage.getItem('glassMorphPlayerTheme');
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
        
        // Favorite button
        const favoriteButton = this._shadow.querySelector('.favorite-button');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', () => {
                favoriteButton.classList.toggle('active');
                const isFavorite = favoriteButton.classList.contains('active');
                
                // Show a notification
                this._showNotification(isFavorite ? 
                    'Added to your favorites' : 
                    'Removed from your favorites');
                
                // You can implement additional favorite functionality here
            });
        }
        
        // Set up share buttons
        this._setupShareButtons();
    }
    
    _togglePlayback() {
        if (!this._audioElement) return;
        
        if (this._audioElement.paused) {
            this._audioElement.play();
        } else {
            this._audioElement.pause();
        }
    }
    
    _changeTheme(theme) {
    // Remove all theme classes
    this.classList.remove(
        'theme-neo-mint',
        'theme-rose-quartz',
        'theme-electric-blue',
        'theme-sunset-coral'
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
        
        const { songs, currentIndex } = this._playerData;
        const song = songs[currentIndex];
        
        if (!song) {
            console.warn("Could not find current song at index", currentIndex);
            return;
        }
        
        console.log("Rendering song:", song); // For debugging
        
        // Update UI elements
        const titleElement = this._shadow.querySelector('.track-title');
        const artistElement = this._shadow.querySelector('.track-artist');
        const albumElement = this._shadow.querySelector('.track-album');
        
        if (titleElement) titleElement.textContent = song.title || 'Unknown Title';
        if (artistElement) artistElement.textContent = song.artist || 'Unknown Artist';
        if (albumElement) {
            if (song.album) {
                albumElement.textContent = song.album;
                albumElement.style.display = '';
            } else {
                albumElement.style.display = 'none';
            }
        }
        
        // Set album cover image
        const albumCover = this._shadow.querySelector('.album-cover');
        if (albumCover) {
            if (song.coverImage) {
                albumCover.src = song.coverImage;
                albumCover.alt = `${song.title} by ${song.artist}`;
            } else {
                albumCover.src = 'https://via.placeholder.com/500?text=Glass+Audio';
                albumCover.alt = 'Default album cover';
            }
        }
        
        // Update streaming service links
        this._updateStreamingLinks(song);
        
        // Update artist social links
        this._updateArtistSocialLinks(song);
        
        // Update playlist tracks
        this._updatePlaylistTracks();
        
        // Update buy button
        const buyButton = this._shadow.querySelector('.buy-button');
        if (buyButton) {
            if (song.purchaseLink) {
                buyButton.href = song.purchaseLink;
                buyButton.style.display = 'block';
            } else {
                buyButton.style.display = 'none';
            }
        }
        
        // Load audio if available
        if (this._audioElement && song.audioFile) {
            console.log("Loading audio:", song.audioFile); // For debugging
            this._loadSong(song.audioFile);
        } else {
            console.warn("Audio element not initialized or no audio file available");
        }
    }
    
    _updatePlaylistTracks() {
        const tracksContainer = this._shadow.querySelector('.tracks-container');
        if (!tracksContainer || !this._playerData || !this._playerData.songs) return;
        
        // Clear existing tracks
        tracksContainer.innerHTML = '';
        
        // Add track items
        this._playerData.songs.forEach((song, index) => {
            const isActive = index === this._playerData.currentIndex;
            
            const trackItem = document.createElement('div');
            trackItem.className = `track-item${isActive ? ' active' : ''}`;
            trackItem.setAttribute('tabindex', '0');
            trackItem.setAttribute('role', 'button');
            trackItem.setAttribute('aria-label', `Play ${song.title} by ${song.artist}`);
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info-small">
                    <div class="track-title-small">${song.title || 'Unknown Title'}</div>
                    <div class="track-artist-small">${song.artist || 'Unknown Artist'}</div>
                </div>
                <div class="track-duration">${song.duration || '0:00'}</div>
            `;
            
            trackItem.addEventListener('click', () => {
                this._playerData.currentIndex = index;
                this.render();
                
                // Start playing the selected track
                if (this._audioElement) {
                    this._audioElement.play();
                }
            });
            
            // Make track items keyboard accessible
            trackItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trackItem.click();
                }
            });
            
            tracksContainer.appendChild(trackItem);
        });
    }

    _changeSong(direction, forceAutoplay = false) {
        if (!this._playerData || !this._playerData.songs || this._playerData.songs.length === 0) return;
        
        // Store current playing state before changing song
        const wasPlaying = this._isPlaying || forceAutoplay;
        
        let newIndex;
        
        if (this._isShuffled) {
            // Random selection for shuffle mode
            newIndex = Math.floor(Math.random() * this._playerData.songs.length);
            // Avoid playing the same song again
            while (newIndex === this._playerData.currentIndex && this._playerData.songs.length > 1) {
                newIndex = Math.floor(Math.random() * this._playerData.songs.length);
            }
        } else {
            // Normal next/previous
            newIndex = this._playerData.currentIndex + direction;
            
            // Loop around
            if (newIndex < 0) newIndex = this._playerData.songs.length - 1;
            if (newIndex >= this._playerData.songs.length) newIndex = 0;
        }
        
        // Update the current index
        this._playerData.currentIndex = newIndex;
        
        // Update the UI with the new song information
        this.render();
        
        // Auto-play the new song if the previous one was playing or forceAutoplay is true
        if (wasPlaying && this._audioElement) {
            this._audioElement.play().catch(error => {
                console.error("Error auto-playing next song:", error);
                
                // Show notification for autoplay issues (common in some browsers)
                if (error.name === 'NotAllowedError') {
                    this._showNotification('Autoplay blocked by browser. Click play to continue.');
                }
            });
        }
    }

    _setPlayingState(isPlaying) {
        this._isPlaying = isPlaying;
        
        // Update all play/pause icons
        const playIcons = this._shadow.querySelectorAll('.play-svg');
        const pauseIcons = this._shadow.querySelectorAll('.pause-svg');
        
        // Start or stop the spinning disk animation
        const spinningDisk = this._shadow.querySelector('.spinning-disk');
        
        if (isPlaying) {
            playIcons.forEach(icon => icon.style.display = 'none');
            pauseIcons.forEach(icon => icon.style.display = 'block');
            
            if (spinningDisk) {
                spinningDisk.classList.add('disk-spinning');
            }
        } else {
            playIcons.forEach(icon => icon.style.display = 'block');
            pauseIcons.forEach(icon => icon.style.display = 'none');
            
            if (spinningDisk) {
                spinningDisk.classList.remove('disk-spinning');
            }
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
        const shuffleButton = this._shadow.querySelector('.shuffle-button');
        
        if (shuffleButton) {
            if (this._isShuffled) {
                shuffleButton.classList.add('active');
                this._showNotification('Shuffle on');
            } else {
                shuffleButton.classList.remove('active');
                this._showNotification('Shuffle off');
            }
        }
    }

    _toggleRepeat() {
        this._isRepeat = !this._isRepeat;
        const repeatButton = this._shadow.querySelector('.repeat-button');
        
        if (repeatButton) {
            if (this._isRepeat) {
                repeatButton.classList.add('active');
                this._showNotification('Repeat on');
            } else {
                repeatButton.classList.remove('active');
                this._showNotification('Repeat off');
            }
        }
    }

    _updateCurrentTime() {
        if (!this._audioElement) return;
        
        const currentTime = this._audioElement.currentTime;
        const duration = this._audioElement.duration;
        
        // Update current time display
        const currentTimeElement = this._shadow.querySelector('.current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = this._formatTime(currentTime);
        }
        
        // Update progress bar
        if (!isNaN(duration) && duration > 0) {
            const progress = currentTime / duration;
            
            const progressFill = this._shadow.querySelector('.progress-fill');
            const progressHandle = this._shadow.querySelector('.progress-handle');
            
            if (progressFill) {
                progressFill.style.width = `${progress * 100}%`;
            }
            
            if (progressHandle) {
                progressHandle.style.left = `${progress * 100}%`;
            }
            
            // Update ARIA attributes for accessibility
            const progressBar = this._shadow.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.setAttribute('aria-valuenow', Math.round(progress * 100));
                progressBar.setAttribute('aria-valuetext', `${this._formatTime(currentTime)} of ${this._formatTime(duration)}`);
            }
        }
    }

    _updateDuration() {
        if (!this._audioElement) return;
        
        const duration = this._audioElement.duration;
        const totalTimeElement = this._shadow.querySelector('.total-time');
        
        if (!isNaN(duration) && totalTimeElement) {
            totalTimeElement.textContent = this._formatTime(duration);
            
            // Update ARIA attributes
            const progressBar = this._shadow.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.setAttribute('aria-valuemin', '0');
                progressBar.setAttribute('aria-valuemax', '100');
                progressBar.setAttribute('aria-valuenow', '0');
            }
        }
    }

    _formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        seconds = Math.floor(seconds);
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    _updateStreamingLinks(song) {
        // Update streaming service links if available
        const buttons = {
            spotify: this._shadow.querySelector('.spotify-button'),
            youtube: this._shadow.querySelector('.youtube-button'),
            soundcloud: this._shadow.querySelector('.soundcloud-button'),
            apple: this._shadow.querySelector('.apple-button')
        };
        
        // Hide all buttons first
        for (const button of Object.values(buttons)) {
            if (button) button.style.display = 'none';
        }
        
        // Only show buttons for available services
        if (song.streamingLinks) {
            for (const [service, url] of Object.entries(song.streamingLinks)) {
                if (url && buttons[service]) {
                    buttons[service].href = url;
                    buttons[service].style.display = 'flex';
                }
            }
        }
    }
    
    _updateArtistSocialLinks(song) {
        // Update artist social links
        const links = {
            facebook: this._shadow.querySelector('a[title="Facebook"]'),
            twitter: this._shadow.querySelector('a[title="Twitter"]'),
            instagram: this._shadow.querySelector('a[title="Instagram"]'),
            website: this._shadow.querySelector('a[title="Website"]')
        };
        
        // Map from API's social keys to our link keys
        const socialMap = {
            facebook: 'facebook',
            twitter: 'twitter',
            instagram: 'instagram',
            website: 'website'
        };
        
        // Hide all links first
        for (const link of Object.values(links)) {
            if (link) link.style.display = 'none';
        }
        
        // Show links for available social platforms
        if (song.artistSocial) {
            for (const [platform, url] of Object.entries(song.artistSocial)) {
                const linkKey = socialMap[platform];
                if (url && linkKey && links[linkKey]) {
                    links[linkKey].href = url;
                    links[linkKey].style.display = 'flex';
                }
            }
        }
    }
    
    _setupShareButtons() {
        const shareButtons = {
            facebook: this._shadow.querySelector('.share-facebook'),
            twitter: this._shadow.querySelector('.share-twitter'),
            copy: this._shadow.querySelector('.share-copy')
        };
        
        // Function to get current song info
        const getShareInfo = () => {
            if (!this._playerData || !this._playerData.songs) return { title: '', artist: '', url: '' };
            
            const song = this._playerData.songs[this._playerData.currentIndex];
            if (!song) return { title: '', artist: '', url: '' };
            
            return {
                title: song.title || 'Unknown Title',
                artist: song.artist || 'Unknown Artist',
                url: song.shareUrl || window.location.href
            };
        };
        
        // Facebook share
        if (shareButtons.facebook) {
            shareButtons.facebook.addEventListener('click', () => {
                const info = getShareInfo();
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(info.url)}&quote=${encodeURIComponent(`Listening to "${info.title}" by ${info.artist}`)}`, '_blank');
            });
        }
        
        // Twitter share
        if (shareButtons.twitter) {
            shareButtons.twitter.addEventListener('click', () => {
                const info = getShareInfo();
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Vibing to "${info.title}" by ${info.artist}`)}&url=${encodeURIComponent(info.url)}`, '_blank');
            });
        }
        
        // Copy link
        if (shareButtons.copy) {
            shareButtons.copy.addEventListener('click', () => {
                const info = getShareInfo();
                try {
                    navigator.clipboard.writeText(info.url);
                    this._showNotification('Link copied to clipboard');
                } catch (err) {
                    console.error('Failed to copy link: ', err);
                    
                    // Fallback for browsers without clipboard API
                    const textArea = document.createElement('textarea');
                    textArea.value = info.url;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-9999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    
                    try {
                        document.execCommand('copy');
                        this._showNotification('Link copied to clipboard');
                    } catch (err) {
                        this._showNotification('Failed to copy link');
                        console.error('Fallback copy failed:', err);
                    }
                    
                    document.body.removeChild(textArea);
                }
            });
        }
    }
    
    _showNotification(message) {
        // First, remove any existing notification
        const existingNotification = this._shadow.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to DOM
        this._shadow.appendChild(notification);
        
        // Force reflow to ensure transition works
        notification.offsetHeight;
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Automatically hide after a delay
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remove from DOM after transition
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    _buyNow() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const song = this._playerData.songs[this._playerData.currentIndex];
        
        if (song && song.purchaseLink) {
            window.open(song.purchaseLink, '_blank');
        } else {
            this._showNotification('Purchase link not available');
        }
    }
}

// Register the custom element with a new name
window.customElements.define('glass-morph-player', GlassMorphPlayer);
