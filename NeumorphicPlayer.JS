class NeumorphicPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._wavesurfer = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Nunito:wght@300;400;600;700&display=swap');
                
                /* Default Theme: Light Gray */
                :host {
                    /* Main colors */
                    --background: #e0e5ec;
                    --background-dark: #d1d9e6;
                    --background-light: #f9f9f9;
                    --shadow-dark: rgba(163, 177, 198, 0.6);
                    --shadow-light: rgba(255, 255, 255, 0.8);
                    --primary: #6d5dfc;
                    --primary-light: #8f85fb;
                    --text-color: #444;
                    --text-color-light: #666;
                    --text-color-dark: #333;
                    --success: #4CAF50;
                    --error: #f44336;
                    
                    /* Neumorphic properties */
                    --flat: 0.3rem;
                    --flat-pressed: 0.2rem;
                    --concave: 0.3rem;
                    --convex: 0.3rem;
                    --pressed: 0.2rem;
                    
                    /* Visualizer colors */
                    --visualizer-bars: #6d5dfc;
                    --visualizer-bars-alt: #8f85fb;
                    
                    /* Fonts */
                    --font-primary: 'Poppins', sans-serif;
                    --font-secondary: 'Nunito', sans-serif;
                    
                    display: block;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    font-family: var(--font-primary);
                    color: var(--text-color);
                    font-size: 16px;
                }
                
                /* Soft Blue Theme */
                :host(.theme-soft-blue) {
                    --background: #e6eefa;
                    --background-dark: #d4e0f7;
                    --background-light: #f5f9ff;
                    --shadow-dark: rgba(150, 170, 200, 0.6);
                    --shadow-light: rgba(255, 255, 255, 0.8);
                    --primary: #4a69bd;
                    --primary-light: #6a89cc;
                    --text-color: #3c4c6d;
                    --text-color-light: #5d6d8e;
                    --text-color-dark: #2c3e50;
                    --visualizer-bars: #4a69bd;
                    --visualizer-bars-alt: #6a89cc;
                }
                
                /* Mint Green Theme */
                :host(.theme-mint-green) {
                    --background: #e6f4f1;
                    --background-dark: #d7ede9;
                    --background-light: #f5faf9;
                    --shadow-dark: rgba(150, 190, 180, 0.6);
                    --shadow-light: rgba(255, 255, 255, 0.8);
                    --primary: #48c9b0;
                    --primary-light: #68d9c0;
                    --text-color: #2b7a6a;
                    --text-color-light: #48a999;
                    --text-color-dark: #1b4a41;
                    --visualizer-bars: #48c9b0;
                    --visualizer-bars-alt: #68d9c0;
                }
                
                /* Warm Beige Theme */
                :host(.theme-warm-beige) {
                    --background: #f5f0e8;
                    --background-dark: #eae0d5;
                    --background-light: #fdfaf5;
                    --shadow-dark: rgba(190, 175, 155, 0.6);
                    --shadow-light: rgba(255, 255, 255, 0.8);
                    --primary: #d2946b;
                    --primary-light: #e2b58b;
                    --text-color: #705a45;
                    --text-color-light: #907860;
                    --text-color-dark: #503f2c;
                    --visualizer-bars: #d2946b;
                    --visualizer-bars-alt: #e2b58b;
                }
                
                /* Dark Mode Theme */
                :host(.theme-dark-mode) {
                    --background: #282c34;
                    --background-dark: #1c1f25;
                    --background-light: #353b47;
                    --shadow-dark: rgba(0, 0, 0, 0.5);
                    --shadow-light: rgba(255, 255, 255, 0.08);
                    --primary: #bb86fc;
                    --primary-light: #cca5fd;
                    --text-color: #e3e3e3;
                    --text-color-light: #bbbbbb;
                    --text-color-dark: #ffffff;
                    --visualizer-bars: #bb86fc;
                    --visualizer-bars-alt: #cca5fd;
                }
                
                /* Essential reset styles */
                *, *::before, *::after {
                    box-sizing: inherit;
                    margin: 0;
                    padding: 0;
                }
                
                button, input {
                    font-family: inherit;
                }
                
                /* Player container */
                .player-container {
                    width: 100%;
                    height: 100%;
                    background: var(--background);
                    border-radius: 24px;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }
                
                /* Header area */
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                
                .player-title {
                    font-size: 1.6rem;
                    font-weight: 600;
                    color: var(--text-color-dark);
                    letter-spacing: 0.5px;
                }
                
                /* Theme selector */
                .theme-selector {
                    display: flex;
                    gap: 12px;
                }
                
                .theme-option {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 3px 3px 7px var(--shadow-dark), 
                                -3px -3px 7px var(--shadow-light);
                }
                
                .theme-option:hover {
                    transform: scale(1.1);
                }
                
                .theme-option.active {
                    box-shadow: inset 2px 2px 5px var(--shadow-dark), 
                                inset -2px -2px 5px var(--shadow-light);
                }
                
                .theme-light-gray {
                    background: #e0e5ec;
                }
                
                .theme-soft-blue {
                    background: #e6eefa;
                }
                
                .theme-mint-green {
                    background: #e6f4f1;
                }
                
                .theme-warm-beige {
                    background: #f5f0e8;
                }
                
                .theme-dark-mode {
                    background: #282c34;
                }
                
                /* Main content area */
                .player-main {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                    flex: 1;
                }
                
                @media (min-width: 992px) {
                    .player-main {
                        flex-direction: row;
                    }
                    
                    .player-left-section {
                        width: 45%;
                    }
                    
                    .player-right-section {
                        width: 55%;
                    }
                }
                
                /* Left section with artwork and main controls */
                .player-left-section {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                
                /* Artwork */
                .artwork-container {
                    position: relative;
                    width: 100%;
                    padding-top: 100%; /* 1:1 Aspect Ratio */
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 8px 8px 16px var(--shadow-dark), 
                                -8px -8px 16px var(--shadow-light);
                }
                
                .artwork-disk {
                    position: absolute;
                    top: 10%;
                    left: 10%;
                    width: 80%;
                    height: 80%;
                    border-radius: 50%;
                    background: var(--background-dark);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 8px 8px 16px var(--shadow-dark), 
                                -8px -8px 16px var(--shadow-light);
                    z-index: 1;
                    transition: transform 0.5s ease;
                }
                
                .artwork-disk.spinning {
                    animation: spin 8s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .artwork-disk-inner {
                    width: 40%;
                    height: 40%;
                    border-radius: 50%;
                    background: var(--background-light);
                    box-shadow: inset 3px 3px 6px var(--shadow-dark), 
                                inset -3px -3px 6px var(--shadow-light);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .artwork-disk-center {
                    width: 20%;
                    height: 20%;
                    border-radius: 50%;
                    background: var(--primary);
                }
                
                .artwork-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 24px;
                    z-index: 0;
                }
                
                /* Track information */
                .track-info {
                    text-align: center;
                    padding: 10px 0;
                }
                
                .track-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: var(--text-color-dark);
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-artist {
                    font-size: 1.1rem;
                    color: var(--text-color);
                    margin-bottom: 3px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-album {
                    font-size: 0.9rem;
                    color: var(--text-color-light);
                    font-weight: 400;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                /* Main player controls */
                .main-controls {
                    margin-top: 15px;
                }
                
                .progress-container {
                    width: 100%;
                    margin-bottom: 20px;
                }
                
                .progress-bar {
                    height: 8px;
                    width: 100%;
                    background: var(--background);
                    border-radius: 4px;
                    position: relative;
                    box-shadow: inset 2px 2px 5px var(--shadow-dark), 
                                inset -2px -2px 5px var(--shadow-light);
                    cursor: pointer;
                }
                
                .progress-fill {
                    height: 100%;
                    background: var(--primary);
                    border-radius: 4px;
                    width: 0%;
                    position: relative;
                    transition: width 0.1s linear;
                }
                
                .progress-knob {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    transform: translate(50%, -50%);
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary);
                    box-shadow: 2px 2px 5px var(--shadow-dark), 
                                -2px -2px 5px var(--shadow-light);
                    display: none;
                }
                
                .progress-bar:hover .progress-knob {
                    display: block;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: var(--text-color-light);
                    margin-top: 8px;
                    font-family: var(--font-secondary);
                }
                
                /* Control buttons */
                .playback-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    margin: 20px 0;
                }
                
                .control-button {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: none;
                    background: var(--background);
                    color: var(--text-color);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    /* Neumorphic raised effect */
                    box-shadow: 5px 5px 10px var(--shadow-dark), 
                                -5px -5px 10px var(--shadow-light);
                }
                
                .control-button:hover {
                    color: var(--primary);
                }
                
                .control-button:active, 
                .control-button.active {
                    /* Neumorphic pressed effect */
                    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                                inset -3px -3px 7px var(--shadow-light);
                }
                
                .control-button svg {
                    width: 22px;
                    height: 22px;
                    fill: currentColor;
                }
                
                .play-button {
                    width: 70px;
                    height: 70px;
                    color: var(--primary);
                }
                
                .play-button svg {
                    width: 30px;
                    height: 30px;
                }
                
                /* Secondary controls */
                .secondary-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 15px;
                }
                
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 150px;
                }
                
                .volume-icon {
                    color: var(--text-color);
                    transition: color 0.3s ease;
                    cursor: pointer;
                }
                
                .volume-icon:hover {
                    color: var(--primary);
                }
                
                .volume-icon svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .volume-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: var(--background);
                    outline: none;
                    /* Neumorphic inset effect */
                    box-shadow: inset 2px 2px 5px var(--shadow-dark), 
                                inset -2px -2px 5px var(--shadow-light);
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    /* Neumorphic raised effect for thumb */
                    box-shadow: 2px 2px 5px var(--shadow-dark), 
                                -2px -2px 5px var(--shadow-light);
                }
                
                .volume-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    border: none;
                    /* Neumorphic raised effect for thumb */
                    box-shadow: 2px 2px 5px var(--shadow-dark), 
                                -2px -2px 5px var(--shadow-light);
                }
                
                .extra-controls {
                    display: flex;
                    gap: 15px;
                }
                
                .extra-control-button {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    background: var(--background);
                    color: var(--text-color);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    /* Neumorphic raised effect */
                    box-shadow: 3px 3px 7px var(--shadow-dark), 
                                -3px -3px 7px var(--shadow-light);
                }
                
                .extra-control-button:hover {
                    color: var(--primary);
                }
                
                .extra-control-button:active,
                .extra-control-button.active {
                    /* Neumorphic pressed effect */
                    box-shadow: inset 2px 2px 5px var(--shadow-dark), 
                                inset -2px -2px 5px var(--shadow-light);
                }
                
                .extra-control-button svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                /* Right section with visualizer and playlist */
                .player-right-section {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                
                /* Neumorphic Panel (reusable) */
                .neumorphic-panel {
                    background: var(--background);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 8px 8px 16px var(--shadow-dark), 
                                -8px -8px 16px var(--shadow-light);
                }
                
                /* Visualizer */
                .visualizer-container {
                    width: 100%;
                    height: 180px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 20px;
                    /* Neumorphic inset effect */
                    box-shadow: inset 5px 5px 10px var(--shadow-dark), 
                                inset -5px -5px 10px var(--shadow-light);
                }
                
                .audio-visualizer {
                    width: 100%;
                    height: 100%;
                }
                
                /* Playlist section */
                .playlist-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 200px;
                }
                
                .playlist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    margin-bottom: 15px;
                }
                
                .playlist-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-color-dark);
                    display: flex;
                    align-items: center;
                    gap: 8px;
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
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: var(--background);
                    color: var(--text-color);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    /* Neumorphic raised effect */
                    box-shadow: 3px 3px 7px var(--shadow-dark), 
                                -3px -3px 7px var(--shadow-light);
                }
                
                .social-link:hover {
                    color: var(--primary);
                }
                
                .social-link svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
                
                /* Tracks list */
                .tracks-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 5px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-right: -5px;
                    padding-right: 5px;
                }
                
                /* Custom scrollbar */
                .tracks-container::-webkit-scrollbar {
                    width: 6px;
                }
                
                .tracks-container::-webkit-scrollbar-track {
                    background: var(--background);
                    border-radius: 3px;
                }
                
                .tracks-container::-webkit-scrollbar-thumb {
                    background: var(--primary-light);
                    border-radius: 3px;
                }
                
                .track-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px 15px;
                    border-radius: 12px;
                    background: var(--background);
                    /* Subtle raised effect */
                    box-shadow: 3px 3px 7px var(--shadow-dark), 
                                -3px -3px 7px var(--shadow-light);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .track-item:hover {
                    transform: translateY(-2px);
                }
                
                .track-item.active {
                    /* Inset effect when active */
                    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                                inset -3px -3px 7px var(--shadow-light);
                }
                
                .track-number {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-color-light);
                    /* Inset effect */
                    box-shadow: inset 2px 2px 5px var(--shadow-dark), 
                                inset -2px -2px 5px var(--shadow-light);
                }
                
                .track-item.active .track-number {
                    background: var(--primary-light);
                    color: white;
                    box-shadow: none;
                }
                
                .track-info-small {
                    flex: 1;
                    min-width: 0; /* For text overflow to work */
                }
                
                .track-title-small {
                    font-weight: 500;
                    font-size: 0.95rem;
                    margin-bottom: 3px;
                    color: var(--text-color-dark);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-artist-small {
                    font-size: 0.8rem;
                    color: var(--text-color-light);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .track-duration {
                    color: var(--text-color-light);
                    font-size: 0.8rem;
                    font-weight: 500;
                    flex-shrink: 0;
                }
                
                /* Bottom section with services */
                .services-section {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .services-title {
                    font-size: 0.9rem;
                    color: var(--text-color-light);
                    font-weight: 500;
                    margin-bottom: 10px;
                }
                
                .service-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .service-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 15px;
                    border-radius: 12px;
                    background: var(--background);
                    border: none;
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    /* Neumorphic raised effect */
                    box-shadow: 3px 3px 7px var(--shadow-dark), 
                                -3px -3px 7px var(--shadow-light);
                    transition: all 0.3s ease;
                }
                
                .service-button:hover {
                    color: var(--primary);
                    transform: translateY(-2px);
                }
                
                .service-button svg {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }
                
                /* Buy button */
                .buy-button {
                    display: block;
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    background: var(--primary);
                    border: none;
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    text-align: center;
                    text-decoration: none;
                    margin-top: 20px;
                    /* Neumorphic raised effect */
                    box-shadow: 3px 3px 7px var(--shadow-dark), 
                                -3px -3px 7px var(--shadow-light);
                    transition: all 0.3s ease;
                }
                
                .buy-button:hover {
                    background: var(--primary-light);
                    transform: translateY(-2px);
                }
                
                .buy-button:active {
                    /* Slightly pressed effect */
                    transform: translateY(0);
                    box-shadow: 2px 2px 5px var(--shadow-dark), 
                                -2px -2px 5px var(--shadow-light);
                }
                
                /* Responsive design */
                @media (max-width: 991px) {
                    .player-container {
                        padding: 20px;
                    }
                    
                    .player-header {
                        margin-bottom: 20px;
                    }
                    
                    .player-title {
                        font-size: 1.4rem;
                    }
                    
                    .theme-option {
                        width: 24px;
                        height: 24px;
                    }
                    
                    .player-main {
                        gap: 20px;
                    }
                    
                    .artwork-container {
                        max-width: 300px;
                        margin: 0 auto;
                    }
                    
                    .track-title {
                        font-size: 1.3rem;
                    }
                    
                    .track-artist {
                        font-size: 1rem;
                    }
                    
                    .playback-controls {
                        gap: 15px;
                    }
                    
                    .control-button {
                        width: 45px;
                        height: 45px;
                    }
                    
                    .play-button {
                        width: 60px;
                        height: 60px;
                    }
                }
                
                @media (max-width: 576px) {
                    .player-container {
                        padding: 15px;
                    }
                    
                    .player-header {
                        margin-bottom: 15px;
                    }
                    
                    .player-title {
                        font-size: 1.2rem;
                    }
                    
                    .theme-option {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .player-main {
                        gap: 15px;
                    }
                    
                    .track-title {
                        font-size: 1.2rem;
                    }
                    
                    .playback-controls {
                        gap: 10px;
                    }
                    
                    .control-button {
                        width: 40px;
                        height: 40px;
                    }
                    
                    .play-button {
                        width: 55px;
                        height: 55px;
                    }
                    
                    .play-button svg {
                        width: 25px;
                        height: 25px;
                    }
                    
                    .visualizer-container {
                        height: 150px;
                    }
                }
                
                /* Accessibility focus styles */
                button:focus-visible,
                input:focus-visible,
                a:focus-visible,
                .track-item:focus-visible,
                .theme-option:focus-visible {
                    outline: 2px solid var(--primary);
                    outline-offset: 2px;
                }
                
                /* Toast notification */
                .notification {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: var(--background);
                    color: var(--text-color-dark);
                    padding: 12px 25px;
                    border-radius: 12px;
                    box-shadow: 5px 5px 10px var(--shadow-dark), 
                                -5px -5px 10px var(--shadow-light);
                    font-size: 0.9rem;
                    font-weight: 500;
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }
                
                .notification.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            </style>
            
            <div class="player-container">
                <!-- Player Header -->
                <div class="player-header">
                    <h1 class="player-title">Soft Music</h1>
                    
                    <div class="theme-selector">
                        <div class="theme-option theme-light-gray active" data-theme="default" title="Light Gray Theme" tabindex="0"></div>
                        <div class="theme-option theme-soft-blue" data-theme="soft-blue" title="Soft Blue Theme" tabindex="0"></div>
                        <div class="theme-option theme-mint-green" data-theme="mint-green" title="Mint Green Theme" tabindex="0"></div>
                        <div class="theme-option theme-warm-beige" data-theme="warm-beige" title="Warm Beige Theme" tabindex="0"></div>
                        <div class="theme-option theme-dark-mode" data-theme="dark-mode" title="Dark Mode Theme" tabindex="0"></div>
                    </div>
                </div>
                
                <!-- Main Player Layout -->
                <div class="player-main">
                    <!-- Left side - Artwork and Main Controls -->
                    <div class="player-left-section">
                        <!-- Artwork with neumorphic effect -->
                        <div class="artwork-container">
                            <img class="artwork-image" src="" alt="Album Cover">
                            
                            <!-- Spinning disc effect -->
                            <div class="artwork-disk">
                                <div class="artwork-disk-inner">
                                    <div class="artwork-disk-center"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Track Info -->
                        <div class="track-info">
                            <h2 class="track-title">Song Title</h2>
                            <h3 class="track-artist">Artist Name</h3>
                            <p class="track-album">Album Name</p>
                        </div>
                        
                        <!-- Main Controls -->
                        <div class="main-controls">
                            <!-- Progress Bar -->
                            <div class="progress-container">
                                <div class="progress-bar" tabindex="0" role="slider" aria-label="Playback progress">
                                    <div class="progress-fill"></div>
                                    <div class="progress-knob"></div>
                                </div>
                                <div class="time-display">
                                    <span class="current-time">0:00</span>
                                    <span class="total-time">0:00</span>
                                </div>
                            </div>
                            
                            <!-- Playback Controls -->
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
                                    <svg class="play-icon" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <svg class="pause-icon" viewBox="0 0 24 24" style="display: none;">
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
                            
                            <!-- Secondary Controls -->
                            <div class="secondary-controls">
                                <div class="volume-control">
                                    <div class="volume-icon" title="Mute/Unmute">
                                        <svg class="volume-on-icon" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                        </svg>
                                        <svg class="volume-off-icon" viewBox="0 0 24 24" style="display: none;">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                        </svg>
                                    </div>
                                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.8" title="Volume">
                                </div>
                                
                                <div class="extra-controls">
                                    <button class="extra-control-button" title="Add to Favorites">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                                        </svg>
                                    </button>
                                    <button class="extra-control-button" title="Share">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right side - Visualizer and Playlist -->
                    <div class="player-right-section">
                        <!-- Visualizer -->
                        <div class="visualizer-container">
                            <canvas class="audio-visualizer" id="audioVisualizer"></canvas>
                        </div>
                        
                        <!-- Playlist -->
                        <div class="playlist-section neumorphic-panel">
                            <div class="playlist-header">
                                <div class="playlist-title">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                                    </svg>
                                    <span>Playlist</span>
                                </div>
                                
                                <!-- Social Links -->
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
                                            <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Tracks list -->
                            <div class="tracks-container">
                                <!-- Track items will be dynamically added here -->
                            </div>
                        </div>
                        
                        <!-- Services section -->
                        <div class="services-section neumorphic-panel">
                            <div class="services-title">Listen On</div>
                            <div class="service-buttons">
                                <button class="service-button spotify-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M17.9,10.9C14.7,9 9.35,8.8 6.3,9.75C5.8,9.9 5.3,9.6 5.15,9.15C5,8.65 5.3,8.15 5.75,8C9.3,6.95 15.15,7.15 18.85,9.35C19.3,9.6 19.45,10.2 19.2,10.65C18.95,11 18.35,11.15 17.9,10.9M17.8,13.7C17.55,14.05 17.1,14.2 16.75,13.95C14.05,12.3 9.95,11.8 6.8,12.8C6.4,12.9 5.95,12.7 5.85,12.3C5.75,11.9 5.95,11.45 6.35,11.35C10,10.25 14.5,10.8 17.6,12.7C17.9,12.85 18.05,13.35 17.8,13.7M16.6,16.45C16.4,16.75 16.05,16.85 15.75,16.65C13.4,15.2 10.45,14.9 6.95,15.7C6.6,15.8 6.3,15.55 6.2,15.25C6.1,14.9 6.35,14.6 6.65,14.5C10.45,13.65 13.75,14 16.35,15.6C16.7,15.75 16.75,16.15 16.6,16.45M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                    </svg>
                                    <span>Spotify</span>
                                </button>
                                <button class="service-button apple-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                                    </svg>
                                    <span>Apple Music</span>
                                </button>
                                <button class="service-button youtube-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                                    </svg>
                                    <span>YouTube</span>
                                </button>
                                <button class="service-button soundcloud-button" tabindex="0">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M11.56,8.87V17H20.32V17C22.17,16.87 23,15.73 23,14.33C23,12.85 21.88,11.66 20.38,11.66C20,11.66 19.68,11.74 19.35,11.88C19.11,9.54 17.12,7.71 14.67,7.71C13.5,7.71 12.39,8.15 11.56,8.87M10.68,9.89C10.38,9.71 10.06,9.57 9.71,9.5V17H11.1V9.34C10.95,9.5 10.81,9.7 10.68,9.89M8.33,9.35V17H9.25V9.38C9.06,9.35 8.87,9.34 8.67,9.34C8.55,9.34 8.44,9.34 8.33,9.35M6.5,10V17H7.41V9.54C7.08,9.65 6.77,9.81 6.5,10M4.83,12.5C4.77,12.5 4.71,12.44 4.64,12.41V17H5.56V10.86C5.19,11.34 4.94,11.91 4.83,12.5M2.79,12.22V16.91C3,16.97 3.24,17 3.5,17H3.72V12.14C3.64,12.13 3.56,12.12 3.5,12.12C3.24,12.12 3,12.16 2.79,12.22M1,14.56C1,15.31 1.34,15.97 1.87,16.42V12.71C1.34,13.15 1,13.82 1,14.56Z"/>
                                    </svg>
                                    <span>SoundCloud</span>
                                </button>
                            </div>
                            
                            <!-- Buy Button -->
                            <a href="#" class="buy-button" tabindex="0">Get This Track</a>
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
        this._analyser.fftSize = 256; // For better performance, adjust as needed
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
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get visualizer colors from CSS variables
        const primaryColor = getComputedStyle(this).getPropertyValue('--visualizer-bars').trim();
        const secondaryColor = getComputedStyle(this).getPropertyValue('--visualizer-bars-alt').trim();
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);
        
        // Draw neumorphic style bars (pill shaped)
        const barWidth = Math.ceil(canvas.width / 64);
        const gap = Math.max(2, Math.floor(barWidth * 0.3));
        const totalBarWidth = barWidth + gap;
        const barCount = Math.floor(canvas.width / totalBarWidth);
        
        // Keep track of previous values for smoothing
        if (!this._prevBars) {
            this._prevBars = new Array(barCount).fill(0);
        }
        
        // Shadow for neumorphic effect
        const shadowDark = getComputedStyle(this).getPropertyValue('--shadow-dark').trim();
        const shadowLight = getComputedStyle(this).getPropertyValue('--shadow-light').trim();
        
        for (let i = 0; i < barCount; i++) {
            // Get data and apply smoothing for more natural movement
            const index = Math.floor(i * this._dataArray.length / barCount);
            let value = this._dataArray[index];
            
            // Apply smoothing
            const smoothingFactor = 0.7; // Adjust for more/less smoothing
            value = this._prevBars[i] * smoothingFactor + value * (1 - smoothingFactor);
            this._prevBars[i] = value;
            
            // Calculate bar height based on frequency data
            const percent = value / 255;
            const barHeight = Math.max(5, percent * canvas.height * 0.75); // Min height of 5px
            
            // Position the bar
            const x = i * totalBarWidth;
            const y = canvas.height - barHeight;
            
            // Draw neumorphic style bar with rounded corners
            const cornerRadius = barWidth / 2; // Pill shaped bar
            
            // Draw main bar
            ctx.beginPath();
            ctx.moveTo(x + cornerRadius, y);
            ctx.lineTo(x + barWidth - cornerRadius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + cornerRadius);
            ctx.lineTo(x + barWidth, y + barHeight - cornerRadius);
            ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - cornerRadius, y + barHeight);
            ctx.lineTo(x + cornerRadius, y + barHeight);
            ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - cornerRadius);
            ctx.lineTo(x, y + cornerRadius);
            ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
            ctx.closePath();
            
            // Gradient fill
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add neumorphic effect with light and shadow
            ctx.beginPath();
            ctx.moveTo(x + cornerRadius, y);
            ctx.lineTo(x + barWidth - cornerRadius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + cornerRadius);
            ctx.lineTo(x + barWidth, y + barHeight - cornerRadius);
            ctx.strokeStyle = shadowLight;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + barWidth - cornerRadius, y + barHeight);
            ctx.lineTo(x + cornerRadius, y + barHeight);
            ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - cornerRadius);
            ctx.lineTo(x, y + cornerRadius);
            ctx.strokeStyle = shadowDark;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Add subtle light reflection at the top
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, 3);
    }

    _setupEventListeners() {
        // Play/Pause button
        const playButton = this._shadow.querySelector('.play-button');
        const playIcon = this._shadow.querySelector('.play-icon');
        const pauseIcon = this._shadow.querySelector('.pause-icon');
        
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
                shuffleButton.classList.toggle('active');
            });
        }

        // Repeat button
        const repeatButton = this._shadow.querySelector('.repeat-button');
        if (repeatButton) {
            repeatButton.addEventListener('click', () => {
                this._toggleRepeat();
                repeatButton.classList.toggle('active');
            });
        }

        // Volume control
        const volumeSlider = this._shadow.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                this._setVolume(volume);
            });
        }

        // Mute button
        const volumeIcon = this._shadow.querySelector('.volume-icon');
        if (volumeIcon) {
            volumeIcon.addEventListener('click', () => {
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
        
        // Favorite button (toggle)
        const favoriteButton = this._shadow.querySelector('button[title="Add to Favorites"]');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', () => {
                favoriteButton.classList.toggle('active');
                
                // Show a notification
                if (favoriteButton.classList.contains('active')) {
                    this._showNotification('Added to favorites');
                } else {
                    this._showNotification('Removed from favorites');
                }
            });
        }
        
        // Share button (show notification)
        const shareButton = this._shadow.querySelector('button[title="Share"]');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this._handleShare();
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
                    localStorage.setItem('neumorphicPlayerTheme', option.dataset.theme);
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
            const savedTheme = localStorage.getItem('neumorphicPlayerTheme');
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
        
        // Service buttons
        const serviceButtons = this._shadow.querySelectorAll('.service-button');
        serviceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const serviceName = button.classList.contains('spotify-button') ? 'Spotify' :
                                    button.classList.contains('apple-button') ? 'Apple Music' :
                                    button.classList.contains('youtube-button') ? 'YouTube' :
                                    button.classList.contains('soundcloud-button') ? 'SoundCloud' : '';
                
                if (serviceName) {
                    e.preventDefault();
                    this._openServiceLink(serviceName.toLowerCase().replace(/\s+/g, ''));
                }
            });
        });
        
        // Buy button
        const buyButton = this._shadow.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', (e) => {
                e.preventDefault();
                this._buyNow();
            });
        }
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
            'theme-soft-blue',
            'theme-mint-green',
            'theme-warm-beige',
            'theme-dark-mode'
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
        
        // Set artwork image
        const artworkImage = this._shadow.querySelector('.artwork-image');
        if (artworkImage) {
            if (song.coverImage) {
                artworkImage.src = song.coverImage;
                artworkImage.alt = `Cover for ${song.title} by ${song.artist}`;
            } else {
                artworkImage.src = 'https://via.placeholder.com/500?text=Soft+Music';
                artworkImage.alt = 'Default album cover';
            }
        }
        
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
        
        // Update streaming service buttons
        this._updateServiceButtons(song);
        
        // Update artist social links
        this._updateSocialLinks(song);
        
        // Update playlist tracks
        this._updatePlaylistTracks();
        
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
            
            // Estimate duration from audio if not provided
            let duration = song.duration || '0:00';
            if (isActive && this._audioElement && this._audioElement.duration) {
                duration = this._formatTime(this._audioElement.duration);
            }
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info-small">
                    <div class="track-title-small">${song.title || 'Unknown Title'}</div>
                    <div class="track-artist-small">${song.artist || 'Unknown Artist'}</div>
                </div>
                <div class="track-duration">${duration}</div>
            `;
            
            trackItem.addEventListener('click', () => {
                this._playerData.currentIndex = index;
                this.render();
                
                // Start playing the selected track
                if (this._audioElement) {
                    this._audioElement.play();
                }
            });
            
            // Make it keyboard accessible
            trackItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trackItem.click();
                }
            });
            
            tracksContainer.appendChild(trackItem);
        });
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
        
        this._playerData.currentIndex = newIndex;
        this.render();
        
        // Always auto-play the new song if the previous one was playing
        if (wasPlaying && this._audioElement) {
            this._audioElement.play();
        }
    }

    _setPlayingState(isPlaying) {
        this._isPlaying = isPlaying;
        
        // Update play/pause icon
        const playIcon = this._shadow.querySelector('.play-icon');
        const pauseIcon = this._shadow.querySelector('.pause-icon');
        const artworkDisk = this._shadow.querySelector('.artwork-disk');
        
        if (isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (artworkDisk) artworkDisk.classList.add('spinning');
            
            // Apply pressed effect to play button
            const playButton = this._shadow.querySelector('.play-button');
            if (playButton) playButton.classList.add('active');
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (artworkDisk) artworkDisk.classList.remove('spinning');
            
            // Remove pressed effect from play button
            const playButton = this._shadow.querySelector('.play-button');
            if (playButton) playButton.classList.remove('active');
        }
    }

    _setVolume(volume) {
        this._currentVolume = volume;
        
        if (this._audioElement) {
            this._audioElement.volume = volume;
        }
        
        // Update mute button state
        const volumeOnIcon = this._shadow.querySelector('.volume-on-icon');
        const volumeOffIcon = this._shadow.querySelector('.volume-off-icon');
        
        if (volume === 0) {
            if (volumeOnIcon) volumeOnIcon.style.display = 'none';
            if (volumeOffIcon) volumeOffIcon.style.display = 'block';
        } else {
            if (volumeOnIcon) volumeOnIcon.style.display = 'block';
            if (volumeOffIcon) volumeOffIcon.style.display = 'none';
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
        this._showNotification(this._isShuffled ? 'Shuffle on' : 'Shuffle off');
    }

    _toggleRepeat() {
        this._isRepeat = !this._isRepeat;
        this._showNotification(this._isRepeat ? 'Repeat on' : 'Repeat off');
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
            const progressKnob = this._shadow.querySelector('.progress-knob');
            
            if (progressFill) {
                progressFill.style.width = `${progress * 100}%`;
            }
            
            if (progressKnob) {
                progressKnob.style.left = `${progress * 100}%`;
            }
            
            // Update ARIA values for accessibility
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
            
            // Update the current track's duration in the playlist
            this._updateCurrentTrackDuration(this._formatTime(duration));
            
            // Initialize ARIA values
            const progressBar = this._shadow.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.setAttribute('aria-valuemin', '0');
                progressBar.setAttribute('aria-valuemax', '100');
                progressBar.setAttribute('aria-valuenow', '0');
            }
        }
    }
    
    _updateCurrentTrackDuration(duration) {
        // Update the duration display in the playlist for the current track
        if (this._playerData && typeof this._playerData.currentIndex !== 'undefined') {
            const currentTrackItem = this._shadow.querySelector(`.track-item:nth-child(${this._playerData.currentIndex + 1}) .track-duration`);
            if (currentTrackItem) {
                currentTrackItem.textContent = duration;
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

    _updateServiceButtons(song) {
        // Map service names to button selectors
        const serviceMap = {
            spotify: '.spotify-button',
            youtube: '.youtube-button',
            soundcloud: '.soundcloud-button',
            apple: '.apple-button'
        };
        
        // Hide all service buttons initially
        for (const selector of Object.values(serviceMap)) {
            const button = this._shadow.querySelector(selector);
            if (button) button.style.display = 'none';
        }
        
        // Show buttons for available services
        if (song.streamingLinks) {
            for (const [service, url] of Object.entries(song.streamingLinks)) {
                const selector = serviceMap[service];
                if (url && selector) {
                    const button = this._shadow.querySelector(selector);
                    if (button) {
                        // Set the link as a data attribute for now
                        button.dataset.url = url;
                        button.style.display = 'flex';
                    }
                }
            }
        }
    }
    
    _updateSocialLinks(song) {
        // Map social platform names to link selectors
        const socialMap = {
            facebook: 'a[title="Facebook"]',
            twitter: 'a[title="Twitter"]',
            instagram: 'a[title="Instagram"]',
            website: 'a[title="Website"]'
        };
        
        // Hide all social links initially
        for (const selector of Object.values(socialMap)) {
            const link = this._shadow.querySelector(selector);
            if (link) link.style.display = 'none';
        }
        
        // Show links for available social platforms
        if (song.artistSocial) {
            for (const [platform, url] of Object.entries(song.artistSocial)) {
                const selector = socialMap[platform];
                if (url && selector) {
                    const link = this._shadow.querySelector(selector);
                    if (link) {
                        link.href = url;
                        link.style.display = 'flex';
                    }
                }
            }
        }
    }
    
    _openServiceLink(service) {
        if (!this._playerData || !this._playerData.songs) return;
        
        const song = this._playerData.songs[this._playerData.currentIndex];
        
        if (song && song.streamingLinks && song.streamingLinks[service]) {
            window.open(song.streamingLinks[service], '_blank');
        } else {
            this._showNotification(`No ${service} link available`);
        }
    }
    
    _handleShare() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const song = this._playerData.songs[this._playerData.currentIndex];
        if (!song) return;
        
        // Try the Web Share API first
        if (navigator.share) {
            navigator.share({
                title: `${song.title} by ${song.artist}`,
                text: `Check out "${song.title}" by ${song.artist}`,
                url: song.shareUrl || window.location.href
            })
            .then(() => console.log('Shared successfully'))
            .catch((error) => {
                console.error('Error sharing:', error);
                this._showShareNotification();
            });
        } else {
            // Fallback to clipboard
            this._showShareNotification();
        }
    }
    
    _showShareNotification() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const song = this._playerData.songs[this._playerData.currentIndex];
        if (!song) return;
        
        try {
            const url = song.shareUrl || window.location.href;
            navigator.clipboard.writeText(url)
                .then(() => {
                    this._showNotification('Link copied to clipboard');
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    this._showNotification('Could not copy link');
                });
        } catch (error) {
            console.error('Share failed:', error);
            this._showNotification('Sharing not available');
        }
    }
    
    _showNotification(message) {
        // First, remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
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
        }, 2000);
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
window.customElements.define('neumorphic-player', NeumorphicPlayer);
