class ClayMusicPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._wavesurfer = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');
                
                /* Base Styles */
                :host {
                    /* Default Soft Pastel Theme */
                    --primary-bg: #f5f3ff;
                    --secondary-bg: #eee9fe;
                    --surface-color: #ffffff;
                    --primary-color: #9d7aed;
                    --secondary-color: #c9a7ff;
                    --accent-color: #ff8fab;
                    --text-primary: #33305f;
                    --text-secondary: #6e6a95;
                    --shadow-color: rgba(157, 122, 237, 0.2);
                    --shadow-color-dark: rgba(157, 122, 237, 0.35);
                    --progress-bg: #e3dcff;
                    --button-hover: #b89bff;
                    --button-press: #8b69da;
                    --volume-track: #e3dcff;
                    --clay-shadow: -12px -12px 24px rgba(255, 255, 255, 0.6), 
                                   12px 12px 24px var(--shadow-color);
                    --clay-shadow-pressed: -6px -6px 12px rgba(255, 255, 255, 0.4), 
                                           6px 6px 12px var(--shadow-color-dark),
                                           inset 3px 3px 6px var(--shadow-color),
                                           inset -3px -3px 6px rgba(255, 255, 255, 0.4);
                    --clay-shadow-inset: inset -6px -6px 12px rgba(255, 255, 255, 0.4), 
                                         inset 6px 6px 12px var(--shadow-color);
                    --visualizer-gradient: linear-gradient(to top, #a78eff, #ff98c5);
                    --slider-thumb-color: #9d7aed;
                    display: block;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    font-size: 16px;
                    font-family: 'Poppins', sans-serif;
                }
                
                /* Earth Clay Theme */
                :host(.theme-earth-clay) {
                    --primary-bg: #f6f1eb;
                    --secondary-bg: #efe7df;
                    --surface-color: #ffffff;
                    --primary-color: #c87d56;
                    --secondary-color: #e5a681;
                    --accent-color: #80a677;
                    --text-primary: #553a2c;
                    --text-secondary: #8a6e5a;
                    --shadow-color: rgba(200, 125, 86, 0.2);
                    --shadow-color-dark: rgba(200, 125, 86, 0.35);
                    --progress-bg: #ede1d6;
                    --button-hover: #e0936a;
                    --button-press: #b46a45;
                    --volume-track: #ede1d6;
                    --visualizer-gradient: linear-gradient(to top, #e5a681, #a6c39d);
                    --slider-thumb-color: #c87d56;
                }
                
                /* Candy Theme */
                :host(.theme-candy) {
                    --primary-bg: #ffeef7;
                    --secondary-bg: #fff0f9;
                    --surface-color: #ffffff;
                    --primary-color: #ff70b5;
                    --secondary-color: #ff9fcd;
                    --accent-color: #70d1ff;
                    --text-primary: #9a2c68;
                    --text-secondary: #cd6ca0;
                    --shadow-color: rgba(255, 112, 181, 0.2);
                    --shadow-color-dark: rgba(255, 112, 181, 0.35);
                    --progress-bg: #ffdfef;
                    --button-hover: #ff89c1;
                    --button-press: #e65aa0;
                    --volume-track: #ffdfef;
                    --visualizer-gradient: linear-gradient(to top, #ff9fcd, #9fe5ff);
                    --slider-thumb-color: #ff70b5;
                }
                
                /* Muted Nature Theme */
                :host(.theme-muted-nature) {
                    --primary-bg: #f0f5f2;
                    --secondary-bg: #e7efe9;
                    --surface-color: #ffffff;
                    --primary-color: #7aac7c;
                    --secondary-color: #a7caa8;
                    --accent-color: #a7a05c;
                    --text-primary: #405541;
                    --text-secondary: #768d76;
                    --shadow-color: rgba(122, 172, 124, 0.2);
                    --shadow-color-dark: rgba(122, 172, 124, 0.35);
                    --progress-bg: #dae9dc;
                    --button-hover: #8bbe8e;
                    --button-press: #69996b;
                    --volume-track: #dae9dc;
                    --visualizer-gradient: linear-gradient(to top, #a7caa8, #d0ce8c);
                    --slider-thumb-color: #7aac7c;
                }
                
                /* Twilight Theme */
                :host(.theme-twilight) {
                    --primary-bg: #F0EDFF;
                    --secondary-bg: #E9E4FD;
                    --surface-color: #FEFEFF;
                    --primary-color: #6554AF;
                    --secondary-color: #9084C2;
                    --accent-color: #EE76E5;
                    --text-primary: #36305C;
                    --text-secondary: #6D678F;
                    --shadow-color: rgba(101, 84, 175, 0.2);
                    --shadow-color-dark: rgba(101, 84, 175, 0.35);
                    --progress-bg: #D6D0F0;
                    --button-hover: #8274C3;
                    --button-press: #554595;
                    --volume-track: #D6D0F0;
                    --visualizer-gradient: linear-gradient(to top, #9084C2, #F498EE);
                    --slider-thumb-color: #6554AF;
                }
                
                /* Sherbet Theme */
                :host(.theme-sherbet) {
                    --primary-bg: #FFF4ED;
                    --secondary-bg: #FFEEE3;
                    --surface-color: #FFFFFF;
                    --primary-color: #FF9671;
                    --secondary-color: #FFBFAA;
                    --accent-color: #9EE09E;
                    --text-primary: #A34E2D;
                    --text-secondary: #C7815E;
                    --shadow-color: rgba(255, 150, 113, 0.2);
                    --shadow-color-dark: rgba(255, 150, 113, 0.35);
                    --progress-bg: #FFDFD0;
                    --button-hover: #FFAA8C;
                    --button-press: #E88060;
                    --volume-track: #FFDFD0;
                    --visualizer-gradient: linear-gradient(to top, #FFBFAA, #C0EDC0);
                    --slider-thumb-color: #FF9671;
                }
                
                *, *:before, *:after {
                    box-sizing: inherit;
                }
                
                /* Main Container */
                .clay-player {
                    width: 100%;
                    height: 100%;
                    background: var(--primary-bg);
                    border-radius: 30px;
                    padding: 30px;
                    box-shadow: var(--clay-shadow);
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    position: relative;
                    overflow: hidden;
                }
                
                /* Header Section */
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .player-title {
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 700;
                    font-size: 1.8rem;
                    color: var(--primary-color);
                    margin: 0;
                }
                
                .theme-switcher {
                    display: flex;
                    gap: 10px;
                }
                
                .theme-option {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 3px 3px 6px var(--shadow-color), -3px -3px 6px rgba(255, 255, 255, 0.8);
                    position: relative;
                    overflow: hidden;
                    border: 2px solid var(--surface-color);
                }
                
                .theme-option:hover {
                    transform: scale(1.15);
                }
                
                .theme-option.active {
                    border: 2px solid var(--primary-color);
                    transform: scale(1.15);
                    box-shadow: var(--clay-shadow-pressed);
                }
                
                .theme-soft-pastel {
                    background: linear-gradient(45deg, #9d7aed, #ff8fab);
                }
                
                .theme-earth-clay {
                    background: linear-gradient(45deg, #c87d56, #80a677);
                }
                
                .theme-candy {
                    background: linear-gradient(45deg, #ff70b5, #70d1ff);
                }
                
                .theme-muted-nature {
                    background: linear-gradient(45deg, #7aac7c, #a7a05c);
                }
                
                .theme-twilight {
                    background: linear-gradient(45deg, #6554AF, #EE76E5);
                }
                
                .theme-sherbet {
                    background: linear-gradient(45deg, #FF9671, #9EE09E);
                }
                
                /* Main Layout */
                .player-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    flex: 1;
                }
                
                /* Left Column - Album and Info */
                .player-left {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                
                .album-container {
                    aspect-ratio: 1/1;
                    background: var(--secondary-bg);
                    border-radius: 24px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: var(--clay-shadow);
                }
                
                .album-art {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 24px;
                    transition: transform 0.3s ease;
                }
                
                .album-art:hover {
                    transform: scale(1.05);
                }
                
                .track-info {
                    background: var(--secondary-bg);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--clay-shadow);
                }
                
                .track-title {
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 700;
                    font-size: 1.6rem;
                    color: var(--text-primary);
                    margin: 0 0 8px 0;
                }
                
                .track-artist {
                    font-weight: 500;
                    font-size: 1.2rem;
                    color: var(--text-secondary);
                    margin: 0 0 4px 0;
                }
                
                .track-album {
                    font-weight: 400;
                    font-size: 1rem;
                    color: var(--text-secondary);
                    opacity: 0.8;
                    margin: 0;
                }
                
                /* Right Column - Controls and Playlist */
                .player-right {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                
                /* Visualizer */
                .visualizer-container {
                    height: 140px;
                    background: var(--secondary-bg);
                    border-radius: 24px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: var(--clay-shadow-inset);
                    padding: 16px;
                }
                
                .visualizer-title {
                    position: absolute;
                    top: 12px;
                    left: 16px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    opacity: 0.6;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                
                .audio-visualizer {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                
                /* Controls Section */
                .controls-container {
                    background: var(--secondary-bg);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--clay-shadow);
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .playback-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                }
                
                .control-button {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: var(--surface-color);
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.3s ease;
                    box-shadow: 6px 6px 12px var(--shadow-color), -6px -6px 12px rgba(255, 255, 255, 0.8);
                }
                
                .control-button:hover {
                    color: var(--primary-color);
                    box-shadow: 4px 4px 8px var(--shadow-color), -4px -4px 8px rgba(255, 255, 255, 0.8);
                }
                
                .control-button:active, 
                .control-button.active {
                    box-shadow: var(--clay-shadow-pressed);
                    color: var(--primary-color);
                }
                
                .control-button svg {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                }
                
                .play-button {
                    width: 70px;
                    height: 70px;
                    background: var(--primary-color);
                    color: white;
                }
                
                .play-button:hover {
                    background: var(--button-hover);
                    color: white;
                }
                
                .play-button:active {
                    background: var(--button-press);
                    color: white;
                }
                
                .play-button svg {
                    width: 32px;
                    height: 32px;
                }
                
                /* Progress Bar */
                .progress-container {
                    margin-top: 8px;
                }
                
                .progress-bar {
                    height: 16px;
                    background: var(--progress-bg);
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: var(--clay-shadow-inset);
                    cursor: pointer;
                }
                
                .progress-fill {
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 8px;
                    width: 0%;
                    position: relative;
                    box-shadow: 0 0 10px var(--primary-color);
                    transition: width 0.1s linear;
                }
                
                .progress-handle {
                    width: 24px;
                    height: 24px;
                    background: var(--surface-color);
                    border: 3px solid var(--primary-color);
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    right: 0;
                    transform: translate(50%, -50%);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .progress-bar:hover .progress-handle {
                    opacity: 1;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
                
                /* Volume Control */
                .volume-container {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-top: 8px;
                }
                
                .volume-icon {
                    color: var(--text-secondary);
                }
                
                .volume-icon svg {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                }
                
                .volume-slider {
                    flex: 1;
                    -webkit-appearance: none;
                    height: 12px;
                    background: var(--volume-track);
                    border-radius: 6px;
                    box-shadow: var(--clay-shadow-inset);
                    outline: none;
                    overflow: hidden;
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--slider-thumb-color);
                    cursor: pointer;
                    border: 3px solid var(--surface-color);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }
                
                .volume-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--slider-thumb-color);
                    cursor: pointer;
                    border: 3px solid var(--surface-color);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }
                
                /* Playlist Section */
                .playlist-container {
                    background: var(--secondary-bg);
                    border-radius: 24px;
                    padding: 16px;
                    box-shadow: var(--clay-shadow);
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                }
                
                .playlist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 8px 12px 8px;
                }
                
                .playlist-title {
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 600;
                    font-size: 1.2rem;
                    color: var(--text-primary);
                    margin: 0;
                }
                
                .playlist-count {
                    background: var(--primary-color);
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border-radius: 20px;
                    padding: 4px 10px;
                    box-shadow: 2px 2px 4px var(--shadow-color);
                }
                
                .song-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                    margin-right: -8px;
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-color) var(--secondary-bg);
                }
                
                .song-list::-webkit-scrollbar {
                    width: 6px;
                }
                
                .song-list::-webkit-scrollbar-track {
                    background: var(--secondary-bg);
                    border-radius: 10px;
                }
                
                .song-list::-webkit-scrollbar-thumb {
                    background-color: var(--primary-color);
                    border-radius: 10px;
                }
                
                .song-item {
                    background: var(--surface-color);
                    border-radius: 16px;
                    padding: 12px 16px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 4px 4px 8px var(--shadow-color), -4px -4px 8px rgba(255, 255, 255, 0.8);
                }
                
                .song-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 6px 6px 12px var(--shadow-color), -6px -6px 12px rgba(255, 255, 255, 0.8);
                }
                
                .song-item.active {
                    background: var(--primary-bg);
                    border-left: 4px solid var(--primary-color);
                    box-shadow: var(--clay-shadow-pressed);
                }
                
                .song-item-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .song-item-title {
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                
                .song-item-artist {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                
                /* Social/Share Container */
                .social-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-top: 24px;
                }
                
                .social-box {
                    background: var(--secondary-bg);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--clay-shadow);
                }
                
                .social-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                
                .social-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .social-icon svg {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
                
                .social-title {
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 600;
                    font-size: 1rem;
                    color: var(--text-primary);
                    margin: 0;
                }
                
                .social-content {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .social-button, .service-link, .artist-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--surface-color);
                    color: var(--text-secondary);
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 3px 3px 6px var(--shadow-color), -3px -3px 6px rgba(255, 255, 255, 0.8);
                    text-decoration: none;
                }
                
                .social-button:hover, .service-link:hover, .artist-link:hover {
                    transform: translateY(-3px);
                    color: var(--primary-color);
                    box-shadow: 4px 4px 8px var(--shadow-color), -4px -4px 8px rgba(255, 255, 255, 0.8);
                }
                
                .social-button:active, .service-link:active, .artist-link:active {
                    transform: translateY(0);
                    box-shadow: var(--clay-shadow-pressed);
                }
                
                .social-button svg, .service-link svg, .artist-link svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .buy-button {
                    grid-column: 1 / -1;
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    border-radius: 18px;
                    padding: 16px;
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 700;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 6px 6px 12px var(--shadow-color), -6px -6px 12px rgba(255, 255, 255, 0.8);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .buy-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 8px 8px 16px var(--shadow-color), -8px -8px 16px rgba(255, 255, 255, 0.8);
                }
                
                .buy-button:active {
                    transform: translateY(0);
                    box-shadow: var(--clay-shadow-pressed);
                }
                
                /* Responsive Design */
                @media (max-width: 1024px) {
                    .player-content {
                        grid-template-columns: 1fr;
                    }
                    
                    .social-container {
                        grid-template-columns: 1fr 1fr;
                    }
                    
                    .buy-button {
                        grid-column: 1 / -1;
                    }
                }
                
                @media (max-width: 768px) {
                    .clay-player {
                        padding: 20px;
                    }
                    
                    .player-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    
                    .theme-switcher {
                        align-self: center;
                    }
                    
                    .social-container {
                        grid-template-columns: 1fr;
                    }
                    
                    .control-button {
                        width: 40px;
                        height: 40px;
                    }
                    
                    .play-button {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .control-button svg {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .play-button svg {
                        width: 28px;
                        height: 28px;
                    }
                }
                
                @media (max-width: 480px) {
                    .clay-player {
                        padding: 15px;
                    }
                    
                    .player-title {
                        font-size: 1.5rem;
                    }
                    
                    .track-title {
                        font-size: 1.3rem;
                    }
                    
                    .track-artist {
                        font-size: 1rem;
                    }
                    
                    .control-button {
                        width: 36px;
                        height: 36px;
                    }
                    
                    .play-button {
                        width: 50px;
                        height: 50px;
                    }
                    
                    .control-button svg {
                        width: 18px;
                        height: 18px;
                    }
                    
                    .play-button svg {
                        width: 24px;
                        height: 24px;
                    }
                }
            </style>
            
            <div class="clay-player">
                <!-- Header with Title and Theme Switcher -->
                <div class="player-header">
                    <h1 class="player-title">Clay Music Player</h1>
                    <div class="theme-switcher">
                        <div class="theme-option theme-soft-pastel active" data-theme="default" title="Soft Pastel"></div>
                        <div class="theme-option theme-earth-clay" data-theme="earth-clay" title="Earth Clay"></div>
                        <div class="theme-option theme-candy" data-theme="candy" title="Candy"></div>
                        <div class="theme-option theme-muted-nature" data-theme="muted-nature" title="Muted Nature"></div>
                        <div class="theme-option theme-twilight" data-theme="twilight" title="Twilight"></div>
                        <div class="theme-option theme-sherbet" data-theme="sherbet" title="Sherbet"></div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="player-content">
                    <!-- Left Column - Album Art and Track Info -->
                    <div class="player-left">
                        <!-- Album Cover -->
                        <div class="album-container">
                            <img class="album-art" src="" alt="Album Cover">
                        </div>
                        
                        <!-- Track Information -->
                        <div class="track-info">
                            <h2 class="track-title">Song Title</h2>
                            <div class="track-artist">Artist Name</div>
                            <div class="track-album">Album Name</div>
                        </div>
                    </div>
                    
                    <!-- Right Column - Controls and Playlist -->
                    <div class="player-right">
                        <!-- Visualizer -->
                        <div class="visualizer-container">
                            <div class="visualizer-title">Audio Spectrum</div>
                            <canvas class="audio-visualizer" id="audioVisualizer"></canvas>
                        </div>
                        
                        <!-- Controls -->
                        <div class="controls-container">
                            <!-- Playback Controls -->
                            <div class="playback-controls">
                                <button class="control-button shuffle-btn" title="Shuffle">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
                                    </svg>
                                </button>
                                <button class="control-button prev-btn" title="Previous">
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
                                <button class="control-button next-btn" title="Next">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                                <button class="control-button repeat-btn" title="Repeat">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill"></div>
                                    <div class="progress-handle"></div>
                                </div>
                                <div class="time-display">
                                    <span class="current-time">0:00</span>
                                    <span class="total-time">0:00</span>
                                </div>
                            </div>
                            
                            <!-- Volume Control -->
                            <div class="volume-container">
                                <div class="volume-icon">
                                    <svg class="volume-on-icon" viewBox="0 0 24 24">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                    </svg>
                                    <svg class="volume-off-icon" viewBox="0 0 24 24" style="display: none;">
                                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                    </svg>
                                </div>
                                <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.8">
                            </div>
                        </div>
                        
                        <!-- Playlist -->
                        <div class="playlist-container">
                            <div class="playlist-header">
                                <h3 class="playlist-title">Playlist</h3>
                                <div class="playlist-count">0</div>
                            </div>
                            <div class="song-list">
                                <!-- Song items will be added here dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Social Section -->
                <div class="social-container">
                    <!-- Share Box -->
                    <div class="social-box">
                        <div class="social-header">
                            <div class="social-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                </svg>
                            </div>
                            <h4 class="social-title">Share</h4>
                        </div>
                        <div class="social-content">
                            <button class="social-button share-facebook" title="Share on Facebook">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                                </svg>
                            </button>
                            <button class="social-button share-twitter" title="Share on Twitter">
                                <svg viewBox="0 0 24 24">
                                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                </svg>
                            </button>
                            <button class="social-button share-whatsapp" title="Share on WhatsApp">
                                <svg viewBox="0 0 24 24">
                                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375a9.869 9.869 0 0 1-1.516-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.891-9.885 9.891m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                </svg>
                            </button>
                            <button class="social-button share-email" title="Share via Email">
                                <svg viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                            </button>
                            <button class="social-button share-copy" title="Copy Link">
                                <svg viewBox="0 0 24 24">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Streaming Box -->
                    <div class="social-box">
                        <div class="social-header">
                            <div class="social-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                            </div>
                            <h4 class="social-title">Stream</h4>
                        </div>
                        <div class="social-content">
                            <a href="#" class="service-link service-spotify" target="_blank" title="Listen on Spotify">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                            </a>
                            <a href="#" class="service-link service-youtube" target="_blank" title="Watch on YouTube">
                                <svg viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                            <a href="#" class="service-link service-soundcloud" target="_blank" title="Listen on SoundCloud">
                                <svg viewBox="0 0 24 24">
                                    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.105.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.093-.09-.093m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.075.075.135.15.135.074 0 .135-.06.15-.135l.225-2.55-.225-2.623c0-.06-.06-.135-.135-.135l-.031-.017zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444.033.015zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.225-.225-.225m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456-.016.015zm.749-.134c-.135 0-.255.119-.255.254l-.15 5.322.15 2.473c0 .15.12.255.255.255s.255-.105.255-.255l.15-2.473-.15-5.307c0-.148-.12-.254-.271-.254l.016-.015zm.749-.15c-.15 0-.285.135-.285.285L9.7 14.77l.135 2.458c0 .149.135.27.285.27s.27-.12.27-.27l.15-2.458-.15-5.03c0-.15-.135-.27-.285-.27m1.005.166c-.164 0-.284.135-.284.285l-.121 4.695.121 2.428c0 .15.12.285.284.285.15 0 .285-.135.285-.285l.135-2.428-.135-4.695c0-.165-.135-.285-.284-.285m.75-.045c-.165 0-.3.135-.3.3l-.105 4.725.105 2.4c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.12-2.4-.12-4.725c-.014-.164-.149-.3-.3-.3m.884-.05c-.194 0-.315.135-.315.345l-.09 4.78.09 2.4c0 .164.136.314.315.314.165 0 .314-.15.314-.314l.091-2.4-.091-4.78c0-.194-.164-.345-.314-.345m.914-.095c-.196 0-.346.149-.346.345L14.6 14.725l.076 2.383c0 .209.15.36.345.36.21 0 .36-.165.36-.36l.09-2.403-.09-4.702c0-.209-.165-.36-.36-.36m1.035-.074c-.21 0-.376.18-.376.375l-.075 4.46.075 2.374c0 .194.166.374.376.374.195 0 .375-.18.375-.374l.074-2.374-.074-4.46c0-.21-.18-.376-.375-.376m1.05-.595c-.061 0-.105.045-.105.09l-.061 5.297.06 2.335c0 .06.045.104.106.104.059 0 .104-.044.104-.104l.075-2.335-.074-5.327c0-.046-.045-.075-.105-.075m.509.137c-.075 0-.135.06-.135.135l-.045 5.172.045 2.321c0 .074.06.15.135.15.09 0 .149-.076.149-.15l.06-2.321-.06-5.172c0-.074-.06-.135-.149-.135l.015-.007zm.958.137c-.103 0-.164.08-.164.165l-.046 5.041.047 2.335c0 .105.074.18.164.18.105 0 .18-.075.18-.18l.052-2.335-.052-5.04c0-.09-.075-.166-.179-.166m.904-.061c-.12 0-.194.09-.194.18l-.029 5.017.029 2.329c0 .104.074.18.194.18.109 0 .18-.075.193-.18l.052-2.329-.044-5.033c0-.09-.089-.165-.193-.165l-.008.001zm1.214.196c-.09 0-.18.08-.18.18l-.044 4.856.045 2.321c0 .104.09.18.18.18.104 0 .18-.076.189-.18l.029-2.321-.029-4.871c0-.107-.088-.178-.19-.165zm1.169.815c0-.09-.082-.165-.18-.165-.089 0-.164.075-.171.164l-.045 4.071.046 2.336c0 .09.075.164.18.164.094 0 .179-.074.18-.164l.044-2.336-.053-4.07zm1.349-.627c-.119 0-.209.084-.209.203l-.044 4.5.044 2.307c0 .119.105.209.209.209.104 0 .179-.09.194-.209l.052-2.307-.052-4.5c0-.12-.09-.204-.194-.204l.001.001zm.825-.209c-.135 0-.219.09-.224.224l-.046 4.513.046 2.294c.005.134.089.224.225.224.119 0 .224-.09.229-.224l.044-2.294-.044-4.513c0-.134-.109-.225-.229-.225m.875-.118c-.149 0-.23.105-.234.233l-.044 4.605.044 2.257c0 .133.09.239.234.239.136 0 .24-.105.244-.24l.046-2.255-.044-4.606c-.009-.134-.113-.237-.245-.233h-.001zm.988.008c-.146 0-.255.105-.255.254l-.029 4.597.029 2.254c0 .15.109.254.255.254.149 0 .254-.104.259-.254l.03-2.254-.03-4.596c-.005-.16-.114-.255-.259-.255m1.004.385c-.03-.12-.135-.215-.255-.215-.135 0-.245.9-.255.226l-.03 4.222.03 2.241c.01.135.12.226.255.226.12 0 .226-.09.255-.226l.03-2.24-.03-4.222v-.012zm.764-.23c-.164 0-.284.12-.284.284l-.03 4.438.03 2.227c0 .164.12.284.284.284.149 0 .284-.12.284-.284l.029-2.227-.029-4.438c0-.165-.135-.285-.284-.285m.929-.126c-.18 0-.301.135-.301.3l-.03 4.277.03 2.176c0 .18.135.301.301.301.164 0 .3-.12.3-.301l.03-2.176-.03-4.277c0-.18-.136-.3-.3-.3m1.094-.329c-.195 0-.315.142-.315.33l-.03 4.264.03 2.169c0 .189.12.315.315.315.165 0 .314-.126.314-.315l.03-2.17-.03-4.262c0-.189-.133-.331-.314-.331m.598-.15c-.21 0-.345.149-.345.354l-.03 4.408.03 2.143c0 .194.149.344.345.344.209 0 .33-.149.33-.344l.045-2.143-.044-4.408c0-.21-.136-.345-.331-.345v-.01zM2.072 10.81c-.051 0-.09.039-.096.09l-.249 3.04.264 2.971c.006.052.045.09.096.09s.09-.038.096-.09l.28-2.971-.28-3.04c-.006-.051-.045-.09-.096-.09m-.446-.581c-.045 0-.09.03-.105.074L1.3 13.404l.224 2.881c.015.045.06.074.105.074.047 0 .09-.029.1-.074l.255-2.881-.257-3.091c-.008-.045-.05-.074-.1-.074m3.502-4.524c-.004-.06-.049-.104-.105-.104-.066 0-.111.044-.115.109l-.218 7.614.218 2.525c.004.06.049.106.115.106.056 0 .101-.045.105-.105l.247-2.527-.247-7.619z"/>
                                </svg>
                            </a>
                            <a href="#" class="service-link service-apple" target="_blank" title="Listen on Apple Music">
                                <svg viewBox="0 0 24 24">
                                    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.664.113 1.322.255 1.966.28 1.262.876 2.36 1.89 3.21.906.77 1.964 1.22 3.15 1.45.39.07.786.115 1.185.146.414.027.828.044 1.242.044.187 0 .375-.007.562-.013h9.17c.14-.01.284-.013.425-.025.627-.047 1.245-.108 1.847-.29 1.22-.36 2.24-1.054 3.02-2.076.55-.738.898-1.563 1.088-2.455.116-.53.176-1.07.204-1.613.016-.31.022-.617.03-.928v-9.17c-.01-.278-.018-.554-.036-.83-.04-.666-.11-1.305-.27-1.933-.367-1.432-1.108-2.596-2.297-3.466-.757-.553-1.604-.895-2.534-1.085-.444-.09-.894-.142-1.35-.164-.134-.007-.268-.016-.4-.023zm-12.24 4.53c1.234.057 2.407.283 3.534.767 1.626.7 2.924 1.787 3.847 3.307.347.575.598 1.18.778 1.812.083.29.142.59.18.888.042.33.037.666.053 1l.008.19c.012.586-.04 1.16-.2 1.726-.386 1.372-1.08 2.57-2.126 3.552-.798.748-1.723 1.283-2.776 1.623-.788.257-1.6.39-2.428.453-.15.01-.302.022-.452.027-.08.003-.16.003-.238.003h-10.8c-.14 0-.276-.01-.414-.023-.735-.065-1.456-.192-2.148-.46-1.06-.41-1.955-1.042-2.698-1.893-.723-.825-1.24-1.764-1.563-2.812C1.518 19.3 1.37 18.72 1.3 18.132c-.043-.373-.076-.75-.076-1.128 0-.37 0-.738.025-1.107.05-.632.164-1.252.352-1.85.42-1.32 1.103-2.45 2.08-3.382C4.554 9.84 5.64 9.35 6.865 9.111c.81-.158 1.624-.23 2.442-.256.27-.007.54-.01.813-.01h1.142c.193 0 .387.01.58.02zm.037 2.21c-.976.035-1.95.04-2.927.012-.78-.036-1.557-.13-2.31-.368-.8-.255-1.47-.696-1.964-1.42-.25-.365-.415-.775-.484-1.218-.07-.442.02-.872.233-1.263.4-.726 1.037-1.15 1.808-1.35.324-.083.655-.113.99-.124.36-.012.735-.002 1.11-.002h8.064c.314.01.629.024.942.08.78.14 1.466.44 1.983 1.08.87.108.155.226.227.352.128.225.203.466.217.72.047.882-.308 1.534-1.048 1.982-.46.28-.96.44-1.482.524-.216.035-.435.057-.654.067-.388.02-.777.027-1.166.033-.33.004-.66.01-.99.01zm8.92 3.655c-.076-.662-.213-1.306-.482-1.908-.546-1.228-1.336-2.257-2.353-3.124-.86-.736-1.833-1.288-2.904-1.687-1.237-.46-2.523-.7-3.843-.75-.68-.027-1.362-.02-2.043-.02H7.45c-.32.01-.634.026-.946.096-.538.123-1.027.33-1.403.78-.215.26-.348.55-.355.878-.004.15 0 .3.022.45.095.667.445 1.17 1.02 1.53.417.261.88.413 1.36.512.508.103 1.022.143 1.536.165.936.043 1.873.03 2.808.012.36-.005.72-.036 1.078-.077 1.34-.15 2.616-.56 3.788-1.28.882-.54 1.643-1.2 2.277-2.016.363-.467.636-.986.82-1.56zm-7.82 1.98c.057-.196.123-.39.17-.59.148-.61.213-1.234.193-1.87-.022-.69-.155-1.362-.446-1.985-.16-.342-.367-.655-.633-.93-.373-.39-.826-.653-1.325-.83-.262-.093-.53-.158-.803-.2-.34-.05-.688-.073-1.035-.073H5.23c-.66 0-1.303.14-1.91.411-.598.27-1.087.662-1.45 1.2-.326.484-.54 1.016-.66 1.582-.067.31-.1.625-.12.946-.023.428-.01.856.046 1.282.112.836.36 1.61.83 2.31.552.82 1.26 1.478 2.11 1.976.66.386 1.367.662 2.116.83.56.125 1.127.19 1.702.212.32.01.64.01.96.01h.63c.16-.012.32-.024.48-.04 1.007-.1 1.967-.36 2.872-.84.997-.53 1.845-1.22 2.525-2.1.413-.535.747-1.11.98-1.73.172-.46.282-.94.338-1.424.012-.105.023-.21.023-.327H8.893v.004z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Artist Box -->
                    <div class="social-box">
                        <div class="social-header">
                            <div class="social-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <h4 class="social-title">Follow Artist</h4>
                        </div>
                        <div class="social-content">
                            <a href="#" class="artist-link artist-facebook" target="_blank" title="Artist on Facebook">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                                </svg>
                            </a>
                            <a href="#" class="artist-link artist-twitter" target="_blank" title="Artist on Twitter">
                                <svg viewBox="0 0 24 24">
                                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                </svg>
                            </a>
                            <a href="#" class="artist-link artist-instagram" target="_blank" title="Artist on Instagram">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                </svg>
                            </a>
                            <a href="#" class="artist-link artist-youtube" target="_blank" title="Artist on YouTube">
                                <svg viewBox="0 0 24 24">
                                    <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.857.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z"/>
                                </svg>
                            </a>
                            <a href="#" class="artist-link artist-tiktok" target="_blank" title="Artist on TikTok">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </a>
                            <a href="#" class="artist-link artist-website" target="_blank" title="Official Website">
                                <svg viewBox="0 0 24 24">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Buy Button -->
                    <button class="buy-button">Purchase Track</button>
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

    static get observedAttributes() {
        return ['player-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'player-data' && newValue !== oldValue) {
            try {
                console.log("Received player data:", newValue);
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
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "var(--primary-color)");
        gradient.addColorStop(1, "var(--secondary-color)");
        
        // Draw bars
        const barWidth = (canvas.width / this._dataArray.length) * 2;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < this._dataArray.length; i++) {
            barHeight = this._dataArray[i] / 2;
            
            // Claymorphic style bars
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 10);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add highlights to bar tops for clay effect
            ctx.beginPath();
            ctx.roundRect(x + 2, canvas.height - barHeight, barWidth - 6, 5, 10);
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fill();
            
            // Add shadow effect
            ctx.beginPath();
            ctx.roundRect(x + 1, canvas.height - barHeight + 1, barWidth - 4, barHeight - 2, 10);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            x += barWidth + 1;
        }
    }

    _setupEventListeners() {
        // Play/Pause button
        const playBtn = this._shadow.querySelector('.play-button');
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

        // Volume control
        const volumeSlider = this._shadow.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.value = this._currentVolume;
            
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                this._setVolume(volume);
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

        // Buy button
        const buyButton = this._shadow.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                this._buyNow();
            });
        }
        
        // Theme selector
        const themeOptions = this._shadow.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                this._changeTheme(theme);
                
                // Update active class
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Save theme preference to localStorage if available
                try {
localStorage.setItem('clay-music-player-theme', theme);
                } catch (e) {
                    console.warn("LocalStorage not available", e);
                }
            });
        });
        
        // Share buttons
        const shareButtons = this._shadow.querySelectorAll('.social-button');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.classList[1].replace('share-', '');
                this._shareSong(platform);
            });
        });
    }

    _setupResizeListener() {
        window.addEventListener('resize', () => {
            if (this._canvas) {
                const visualizerContainer = this._shadow.querySelector('.visualizer-container');
                this._canvas.width = visualizerContainer.clientWidth;
                this._canvas.height = visualizerContainer.clientHeight;
            }
        });
    }

    _changeTheme(theme) {
        const host = this._shadow.host;
        
        // Remove existing theme classes
        host.classList.remove('theme-earth-clay', 'theme-candy', 'theme-muted-nature', 'theme-twilight', 'theme-sherbet');
        
        // Add new theme class
        if (theme !== 'default') {
            host.classList.add(`theme-${theme}`);
        }
    }

    _setPlayingState(isPlaying) {
        this._isPlaying = isPlaying;
        
        const playIcon = this._shadow.querySelector('.play-icon');
        const pauseIcon = this._shadow.querySelector('.pause-icon');
        
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    _updateCurrentTime() {
        if (!this._audioElement) return;
        
        const currentTimeElement = this._shadow.querySelector('.current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = this._formatTime(this._audioElement.currentTime);
        }
        
        const progressFill = this._shadow.querySelector('.progress-fill');
        if (progressFill) {
            const percentage = (this._audioElement.currentTime / this._audioElement.duration) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }

    _updateDuration() {
        if (!this._audioElement) return;
        
        const totalTimeElement = this._shadow.querySelector('.total-time');
        if (totalTimeElement) {
            totalTimeElement.textContent = this._formatTime(this._audioElement.duration);
        }
    }

    _formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    _changeSong(direction) {
        if (!this._playerData || !this._playerData.songs || this._playerData.songs.length === 0) return;
        
        let newIndex = this._playerData.currentIndex + direction;
        
        if (this._isShuffle) {
            // Generate a random index different from the current one
            do {
                newIndex = Math.floor(Math.random() * this._playerData.songs.length);
            } while (newIndex === this._playerData.currentIndex && this._playerData.songs.length > 1);
        } else {
            // Handle wrapping around the playlist
            if (newIndex < 0) {
                newIndex = this._playerData.songs.length - 1;
            } else if (newIndex >= this._playerData.songs.length) {
                newIndex = 0;
            }
        }
        
        this._playerData.currentIndex = newIndex;
        
        // Update UI and load new song
        this.render();
        
        // Load and play the new song
        const currentSong = this._playerData.songs[this._playerData.currentIndex];
        if (currentSong && currentSong.audioFile) {
            this._loadSong(currentSong.audioFile);
            
            // Auto play new song after change
            if (this._isPlaying) {
                this._audioElement.play();
            }
        }
    }

    _toggleShuffle() {
        this._isShuffle = !this._isShuffle;
        
        const shuffleBtn = this._shadow.querySelector('.shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this._isShuffle);
        }
    }

    _toggleRepeat() {
        this._isRepeat = !this._isRepeat;
        
        const repeatBtn = this._shadow.querySelector('.repeat-btn');
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this._isRepeat);
        }
    }

    _setVolume(volume) {
        if (!this._audioElement) return;
        
        this._currentVolume = volume;
        this._audioElement.volume = volume;
        
        // Update volume icon state
        const volumeOnIcon = this._shadow.querySelector('.volume-on-icon');
        const volumeOffIcon = this._shadow.querySelector('.volume-off-icon');
        
        if (volume === 0) {
            volumeOnIcon.style.display = 'none';
            volumeOffIcon.style.display = 'block';
        } else {
            volumeOnIcon.style.display = 'block';
            volumeOffIcon.style.display = 'none';
        }
    }

    _shareSong(platform) {
        if (!this._playerData || !this._playerData.songs) return;
        
        const currentSong = this._playerData.songs[this._playerData.currentIndex];
        if (!currentSong) return;
        
        const title = encodeURIComponent(currentSong.title);
        const artist = encodeURIComponent(currentSong.artist);
        const url = encodeURIComponent(currentSong.shareUrl || window.location.href);
        
        // Create share URL based on platform
        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${title} by ${artist}&url=${url}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${title} by ${artist} ${url}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Check out this song: ${title}&body=I thought you might like this song: ${title} by ${artist}. Listen here: ${url}`;
                break;
            case 'copy':
                this._copyToClipboard(currentSong.shareUrl || window.location.href);
                return;
        }
        
        // Open share URL in new window
        if (shareUrl) {
            window.open(shareUrl, '_blank');
        }
    }

    _copyToClipboard(text) {
        // Create a temporary input element
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        
        // Execute copy command
        try {
            document.execCommand('copy');
            this._showNotification('Link copied to clipboard');
        } catch (err) {
            console.error('Failed to copy:', err);
            this._showNotification('Failed to copy link');
        }
        
        // Remove temporary element
        document.body.removeChild(input);
    }

    _showNotification(message) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        `;
        
        // Add to shadow DOM
        this._shadow.querySelector('.clay-player').appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Hide and remove notification after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    _buyNow() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const currentSong = this._playerData.songs[this._playerData.currentIndex];
        if (currentSong && currentSong.purchaseLink) {
            window.open(currentSong.purchaseLink, '_blank');
        }
    }

    render() {
        if (!this._playerData || !this._playerData.songs || this._playerData.songs.length === 0) {
            console.warn("No song data available for rendering");
            return;
        }
        
        const currentSong = this._playerData.songs[this._playerData.currentIndex];
        if (!currentSong) return;
        
        // Update album art
        const albumArt = this._shadow.querySelector('.album-art');
        if (albumArt) {
            albumArt.src = currentSong.coverImage || '';
            albumArt.alt = `${currentSong.title} by ${currentSong.artist}`;
        }
        
        // Update track info
        const trackTitle = this._shadow.querySelector('.track-title');
        const trackArtist = this._shadow.querySelector('.track-artist');
        const trackAlbum = this._shadow.querySelector('.track-album');
        
        if (trackTitle) trackTitle.textContent = currentSong.title;
        if (trackArtist) trackArtist.textContent = currentSong.artist;
        if (trackAlbum) trackAlbum.textContent = currentSong.album;
        
        // Update playlist
        this._renderPlaylist();
        
        // Update streaming links
        this._updateStreamingLinks(currentSong.streamingLinks);
        
        // Update artist social links
        this._updateArtistLinks(currentSong.artistSocial);
        
        // Update buy button
        const buyButton = this._shadow.querySelector('.buy-button');
        if (buyButton) {
            buyButton.style.display = currentSong.purchaseLink ? 'block' : 'none';
        }
    }

    _renderPlaylist() {
        if (!this._playerData || !this._playerData.songs) return;
        
        const songList = this._shadow.querySelector('.song-list');
        const playlistCount = this._shadow.querySelector('.playlist-count');
        
        if (songList) {
            // Clear existing playlist
            songList.innerHTML = '';
            
            // Populate with songs
            this._playerData.songs.forEach((song, index) => {
                const songItem = document.createElement('div');
                songItem.className = 'song-item';
                if (index === this._playerData.currentIndex) {
                    songItem.classList.add('active');
                }
                
                songItem.innerHTML = `
                    <div class="song-item-info">
                        <div class="song-item-title">${song.title}</div>
                        <div class="song-item-artist">${song.artist}</div>
                    </div>
                `;
                
                songItem.addEventListener('click', () => {
                    this._playerData.currentIndex = index;
                    this.render();
                    
                    // Load and play the selected song
                    if (song.audioFile) {
                        this._loadSong(song.audioFile);
                        this._audioElement.play();
                    }
                });
                
                songList.appendChild(songItem);
            });
            
            // Update playlist count
            if (playlistCount) {
                playlistCount.textContent = this._playerData.songs.length;
            }
        }
    }

    _updateStreamingLinks(links) {
        if (!links) return;
        
        const serviceElements = {
            spotify: this._shadow.querySelector('.service-spotify'),
            youtube: this._shadow.querySelector('.service-youtube'),
            soundcloud: this._shadow.querySelector('.service-soundcloud'),
            apple: this._shadow.querySelector('.service-apple')
        };
        
        // Update each link if available
        for (const [service, url] of Object.entries(links)) {
            if (serviceElements[service] && url) {
                serviceElements[service].href = url;
                serviceElements[service].style.display = 'flex';
            } else if (serviceElements[service]) {
                serviceElements[service].style.display = 'none';
            }
        }
    }

    _updateArtistLinks(links) {
        if (!links) return;
        
        const artistElements = {
            facebook: this._shadow.querySelector('.artist-facebook'),
            twitter: this._shadow.querySelector('.artist-twitter'),
            instagram: this._shadow.querySelector('.artist-instagram'),
            youtube: this._shadow.querySelector('.artist-youtube'),
            tiktok: this._shadow.querySelector('.artist-tiktok'),
            website: this._shadow.querySelector('.artist-website')
        };
        
        // Update each link if available
        for (const [platform, url] of Object.entries(links)) {
            if (artistElements[platform] && url) {
                artistElements[platform].href = url;
                artistElements[platform].style.display = 'flex';
            } else if (artistElements[platform]) {
                artistElements[platform].style.display = 'none';
            }
        }
    }

    disconnectedCallback() {
        // Clean up resources when component is removed
        if (this._audioElement) {
            this._audioElement.pause();
            this._audioElement.src = '';
        }
        
        if (this._audioContext) {
            this._audioContext.close();
        }
        
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this._setupResizeListener);
    }
}

// Define the custom element
customElements.define('clay-music-player', ClayMusicPlayer);
