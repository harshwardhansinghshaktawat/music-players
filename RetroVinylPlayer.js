class RetroVinylPlayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._wavesurfer = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Roboto+Mono:wght@400;500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                
                /* Base Styles */
                :host {
                    --primary-color: #e8a87c;
                    --secondary-color: #c38e70;
                    --tertiary-color: #41292c;
                    --accent-color: #f05e23;
                    --background-dark: #25211e;
                    --background-medium: #332c26;
                    --background-light: #413931;
                    --text-primary: #f8e9d2;
                    --text-secondary: #d4c5b3;
                    --text-dark: #25211e;
                    --wood-texture: linear-gradient(30deg, #5d4037 0%, #795548 25%, #8d6e63 50%, #795548 75%, #5d4037 100%);
                    --brushed-metal: linear-gradient(145deg, #888 0%, #ccc 40%, #eee 50%, #ccc 60%, #888 100%);
                    --meter-gradient: linear-gradient(90deg, #6da36b 0%, #b5cf6b 50%, #ffdf3e 75%, #ffc107 85%, #ff8f00 95%, #e65100 100%);
                    --player-border: 4px solid #5d4037;
                    --knob-shadow: 0 4px 8px rgba(0, 0, 0, 0.5), inset 0 -2px 3px rgba(0, 0, 0, 0.2), inset 0 2px 3px rgba(255, 255, 255, 0.2);
                    --panel-shadow: 0 15px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(73, 54, 41, 0.8);
                    --inset-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
                    display: block;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    font-size: 16px;
                    font-family: 'Space Grotesk', sans-serif;
                }
                
                *, *:before, *:after {
                    box-sizing: inherit;
                }
                
                /* Main Player Container */
                .retro-player {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: var(--wood-texture);
                    border-radius: 15px;
                    box-shadow: var(--panel-shadow);
                    overflow: hidden;
                    padding: 25px;
                    border: var(--player-border);
                    position: relative;
                    color: var(--text-primary);
                }
                
                /* Retro Header with VU Meters */
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 20px;
                    background: var(--background-dark);
                    border-radius: 10px 10px 0 0;
                    border: 2px solid #3a2c22;
                    margin-bottom: 25px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    position: relative;
                }
                
                .player-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 2em;
                    margin: 0;
                    color: var(--primary-color);
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                    letter-spacing: 0.05em;
                }
                
                .vu-meters {
                    display: flex;
                    gap: 10px;
                }
                
                .vu-meter {
                    width: 60px;
                    height: 30px;
                    background: #111;
                    border-radius: 5px;
                    position: relative;
                    border: 2px solid #444;
                    box-shadow: var(--inset-shadow);
                    overflow: hidden;
                }
                
                .vu-meter-needle {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 2px;
                    height: 60%;
                    background: #fff;
                    transform-origin: bottom center;
                    transform: translateX(-50%) rotate(-60deg);
                    transition: transform 0.3s ease;
                }
                
                .vu-meter-scale {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 5px;
                    background: var(--meter-gradient);
                }
                
                .vu-meter-label {
                    position: absolute;
                    top: 2px;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 8px;
                    color: #aaa;
                    font-family: 'Roboto Mono', monospace;
                }
                
                /* Main Container Layout */
                .player-layout {
                    display: grid;
                    grid-template-columns: 1fr 3fr;
                    grid-template-rows: auto 1fr;
                    gap: 25px;
                    flex: 1;
                }
                
                /* Turntable Section */
                .turntable-section {
                    grid-column: 1;
                    grid-row: 1 / span 2;
                    background: var(--background-medium);
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border: 3px solid #3a2c22;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                }
                
                .turntable {
                    position: relative;
                    width: 100%;
                    padding-bottom: 100%; /* Square aspect ratio */
                    margin-bottom: 20px;
                }
                
                .platter {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #111;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), inset 0 2px 5px rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    transition: transform 0.5s linear;
                }
                
                .platter.playing {
                    animation: rotatePlatter 2s linear infinite;
                }
                
                @keyframes rotatePlatter {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .record {
                    position: absolute;
                    top: 10%;
                    left: 10%;
                    width: 80%;
                    height: 80%;
                    border-radius: 50%;
                    background: 
                        radial-gradient(
                            circle at center,
                            #444 0%, 
                            #333 20%, 
                            #222 30%, 
                            #333 32%, 
                            #222 34%, 
                            #333 36%, 
                            #222 38%, 
                            #333 40%, 
                            #222 42%, 
                            #333 44%, 
                            #222 46%, 
                            #333 48%, 
                            #222 50%, 
                            #333 52%, 
                            #222 54%, 
                            #333 56%, 
                            #222 58%, 
                            #333 60%, 
                            #222 62%, 
                            #333 64%, 
                            #222 66%, 
                            #333 68%, 
                            #222 70%, 
                            #333 72%, 
                            #222 74%, 
                            #333 76%, 
                            #222 78%, 
                            #333 80%, 
                            #222 82%, 
                            #333 84%, 
                            #222 86%, 
                            #333 88%, 
                            #222 90%, 
                            #333 92%, 
                            #222 94%, 
                            #333 96%, 
                            #222 98%, 
                            #111 100%
                        );
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .record-label {
                    width: 28%;
                    height: 28%;
                    border-radius: 50%;
                    background-size: cover;
                    background-position: center;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                }
                
                .spindle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 10%;
                    height: 10%;
                    border-radius: 50%;
                    background: var(--brushed-metal);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
                    z-index: 2;
                }
                
                .tonearm-base {
                    position: absolute;
                    top: 10%;
                    right: 10%;
                    width: 20%;
                    height: 20%;
                    border-radius: 50%;
                    background: var(--brushed-metal);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
                    z-index: 3;
                }
                
                .tonearm {
                    position: absolute;
                    top: 20%;
                    right: 20%;
                    width: 50%;
                    height: 8%;
                    background: linear-gradient(90deg, #888, #ccc);
                    transform-origin: right center;
                    transform: rotate(-30deg);
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
                    z-index: 2;
                    transition: transform 0.5s ease;
                }
                
                .tonearm.playing {
                    transform: rotate(15deg);
                }
                
                .tonearm-head {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 15%;
                    height: 150%;
                    background: #777;
                    border-radius: 2px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
                }
                
                .buy-now-btn {
                    width: 90%;
                    padding: 15px;
                    background: var(--accent-color);
                    color: var(--text-primary);
                    text-transform: uppercase;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    box-shadow: 0 4px 0 #a13e0c, 0 5px 10px rgba(0, 0, 0, 0.4);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Space Grotesk', sans-serif;
                    letter-spacing: 1px;
                    font-size: 1rem;
                    position: relative;
                    overflow: hidden;
                }
                
                .buy-now-btn:hover {
                    transform: translateY(2px);
                    box-shadow: 0 2px 0 #a13e0c, 0 3px 6px rgba(0, 0, 0, 0.4);
                }
                
                .buy-now-btn:active {
                    transform: translateY(4px);
                    box-shadow: 0 0 0 #a13e0c, 0 1px 3px rgba(0, 0, 0, 0.4);
                }
                
                /* Track Info Section */
                .track-info-section {
                    grid-column: 2;
                    grid-row: 1;
                    background: var(--background-dark);
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    border: 3px solid #3a2c22;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                }
                
                .track-info {
                    flex: 1;
                }
                
                .title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 2.4rem;
                    margin: 0 0 10px 0;
                    color: var(--primary-color);
                    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
                }
                
                .artist {
                    font-size: 1.5rem;
                    margin: 0 0 5px 0;
                    color: var(--text-secondary);
                }
                
                .album {
                    font-size: 1.1rem;
                    margin: 0;
                    color: var(--text-secondary);
                    opacity: 0.8;
                }
                
                .track-controls {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                }
                
                /* Retro Knobs & Sliders */
                .volume-knob-container {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin-bottom: 10px;
                }
                
                .volume-knob {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: 
                        radial-gradient(
                            circle at 40% 40%,
                            #d7c4aa 0%,
                            #a08a65 60%,
                            #6d5c42 100%
                        );
                    box-shadow: var(--knob-shadow);
                    cursor: pointer;
                }
                
                .volume-knob::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 8%;
                    height: 40%;
                    background: var(--tertiary-color);
                    transform-origin: bottom center;
                    transform: translate(-50%, -95%) rotate(var(--rotation, 0deg));
                }
                
                .knob-labels {
                    position: absolute;
                    top: -25px;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
                
                /* Main Content Layout */
                .player-content {
                    grid-column: 2;
                    grid-row: 2;
                    display: grid;
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr auto;
                    gap: 20px;
                }
                
                /* Visualizer */
                .visualizer-container {
                    background: var(--background-dark);
                    border-radius: 10px;
                    padding: 15px;
                    border: 3px solid #3a2c22;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                    height: 120px;
                    position: relative;
                    overflow: hidden;
                }
                
                .visualizer-screen {
                    width: 100%;
                    height: 100%;
                    background: #121010;
                    border-radius: 5px;
                    box-shadow: var(--inset-shadow);
                    overflow: hidden;
                    position: relative;
                }
                
                .audio-visualizer {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                
                .visualizer-grid {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        linear-gradient(rgba(0, 255, 120, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 120, 0.1) 1px, transparent 1px);
                    background-size: 20px 20px;
                    pointer-events: none;
                }
                
                .visualizer-scan {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: rgba(0, 255, 120, 0.5);
                    box-shadow: 0 0 10px 3px rgba(0, 255, 120, 0.3);
                    animation: scanline 2s linear infinite;
                    pointer-events: none;
                }
                
                @keyframes scanline {
                    0% { transform: translateY(-5px); }
                    100% { transform: translateY(120px); }
                }
                
                /* Controls Panel */
                .controls-panel {
                    background: var(--background-medium);
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    border: 3px solid #3a2c22;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                }
                
                .playback-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                }
                
                .btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: none;
                    background: linear-gradient(145deg, #594a3a, #493d30);
                    box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4), 
                                -2px -2px 6px rgba(255, 255, 255, 0.1);
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                }
                
                .btn:hover {
                    box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.5), 
                                -3px -3px 8px rgba(255, 255, 255, 0.15);
                }
                
                .btn:active {
                    box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.5), 
                                inset -2px -2px 6px rgba(255, 255, 255, 0.1);
                }
                
                .btn svg {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                }
                
                .play-btn {
                    width: 70px;
                    height: 70px;
                    background: var(--primary-color);
                    color: var(--tertiary-color);
                    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.4), 
                                -3px -3px 8px rgba(255, 255, 255, 0.1);
                }
                
                .play-btn:hover {
                    background: var(--secondary-color);
                }
                
                .play-btn svg {
                    width: 32px;
                    height: 32px;
                }
                
                .progress-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 15px;
                    background: var(--background-dark);
                    border-radius: 7px;
                    overflow: hidden;
                    box-shadow: var(--inset-shadow);
                    position: relative;
                    cursor: pointer;
                }
                
                .progress-current {
                    height: 100%;
                    width: 0%;
                    background: var(--primary-color);
                    border-radius: 7px;
                    position: relative;
                    transition: width 0.1s linear;
                }
                
                .progress-indicator {
                    position: absolute;
                    top: 50%;
                    left: 0%;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--text-primary);
                    transform: translate(-50%, -50%);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                    display: none;
                }
                
                .progress-bar:hover .progress-indicator {
                    display: block;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    font-family: 'Roboto Mono', monospace;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                
                /* Playlist Section (Side Panel) */
                .playlist-section {
                    background: var(--background-medium);
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    max-height: 300px;
                    border: 3px solid #3a2c22;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                }
                
                .playlist-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 1.4rem;
                    margin: 0;
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .playlist-title svg {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                }
                
                .song-navigation {
                    overflow-y: auto;
                    overscroll-behavior: contain;
                    scrollbar-width: thin;
                    scrollbar-color: var(--secondary-color) var(--background-dark);
                }
                
                .song-navigation::-webkit-scrollbar {
                    width: 8px;
                }
                
                .song-navigation::-webkit-scrollbar-track {
                    background: var(--background-dark);
                    border-radius: 4px;
                }
                
                .song-navigation::-webkit-scrollbar-thumb {
                    background-color: var(--secondary-color);
                    border-radius: 4px;
                }
                
                .song-item {
                    background: var(--background-dark);
                    border-radius: 8px;
                    padding: 12px 15px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-left: 3px solid transparent;
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
                }
                
                .song-item:hover {
                    transform: translateX(5px);
                    box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4);
                }
                
                .song-item.active {
                    border-left: 3px solid var(--primary-color);
                    background: var(--background-light);
                }
                
                .song-item-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .song-item-title {
                    font-weight: 500;
                    margin-bottom: 5px;
                    font-size: 1rem;
                }
                
                .song-item-artist {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    opacity: 0.8;
                }
                
                /* Social & Sharing Panel */
                .social-panel {
                    background: var(--background-dark);
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 20px;
                    border: 3px solid #3a2c22;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                }
                
                .panel-tabs {
                    display: flex;
                    border-bottom: 2px solid var(--background-medium);
                    margin-bottom: 15px;
                }
                
                .panel-tab {
                    padding: 10px 15px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .panel-tab.active {
                    color: var(--primary-color);
                    opacity: 1;
                    border-bottom: 3px solid var(--primary-color);
                    transform: translateY(2px);
                }
                
                .panel-content {
                    display: none;
                }
                
                .panel-content.active {
                    display: block;
                }
                
                .social-share-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .share-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--background-medium);
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3), 
                                -1px -1px 3px rgba(255, 255, 255, 0.1);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .share-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4), 
                                -2px -2px 5px rgba(255, 255, 255, 0.15);
                }
                
                .share-button svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .share-facebook { color: #1877F2; }
                .share-twitter { color: #1DA1F2; }
                .share-whatsapp { color: #25D366; }
                .share-email { color: #D44638; }
                .share-copy { color: #FFFFFF; }
                
                .service-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .service-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: var(--background-medium);
                    border-radius: 8px;
                    text-decoration: none;
                    color: var(--text-primary);
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3), 
                                -1px -1px 3px rgba(255, 255, 255, 0.1);
                    transition: all 0.2s ease;
                }
                
                .service-link:hover {
                    transform: translateY(-3px);
                    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4), 
                                -2px -2px 5px rgba(255, 255, 255, 0.15);
                }
                
                .service-link svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .service-spotify { color: #1DB954; }
                .service-youtube { color: #FF0000; }
                .service-soundcloud { color: #FF7700; }
                .service-apple { color: #FB2D4E; }
                
                .artist-social-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .artist-social-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--background-medium);
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3), 
                                -1px -1px 3px rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                
                .artist-social-link:hover {
                    transform: translateY(-3px);
                    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4), 
                                -2px -2px 5px rgba(255, 255, 255, 0.15);
                }
                
                .artist-social-link svg {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
                
                .artist-facebook { color: #1877F2; }
                .artist-twitter { color: #1DA1F2; }
                .artist-instagram { color: #E4405F; }
                .artist-youtube { color: #FF0000; }
                .artist-tiktok { color: #FFFFFF; }
                .artist-website { color: #FFFFFF; }
                
                /* Skeuomorphic Retro Details */
                .screws {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--brushed-metal);
                    box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.3), 
                                inset -1px -1px 2px rgba(0, 0, 0, 0.5);
                }
                
                .screw-top-left {
                    top: 10px;
                    left: 10px;
                }
                
                .screw-top-right {
                    top: 10px;
                    right: 10px;
                }
                
                .screw-bottom-left {
                    bottom: 10px;
                    left: 10px;
                }
                
                .screw-bottom-right {
                    bottom: 10px;
                    right: 10px;
                }
                
                .logo-plate {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    padding: 5px 10px;
                    background: var(--brushed-metal);
                    font-family: 'DM Serif Display', serif;
                    color: var(--tertiary-color);
                    font-size: 0.8rem;
                    border-radius: 3px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
                }
                
                /* Responsive Design */
                @media (max-width: 900px) {
                    .player-layout {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .track-info-section {
                        width: 100%;
                    }
                    
                    .turntable-section {
                        width: 100%;
                        max-width: 400px;
                        margin: 0 auto;
                    }
                }
                
                @media (max-width: 768px) {
                    .player-title {
                        font-size: 1.5em;
                    }
                    
                    .vu-meters {
                        display: none;
                    }
                    
                    .track-info-section {
                        flex-direction: column;
                    }
                    
                    .title {
                        font-size: 1.8rem;
                    }
                    
                    .artist {
                        font-size: 1.2rem;
                    }
                    
                    .track-controls {
                        flex-direction: row;
                        padding: 15px 0 0 0;
                    }
                    
                    .btn {
                        width: 45px;
                        height: 45px;
                    }
                    
                    .play-btn {
                        width: 60px;
                        height: 60px;
                    }
                }
            </style>
            
            <div class="retro-player">
                <!-- Decorative elements -->
                <div class="screws screw-top-left"></div>
                <div class="screws screw-top-right"></div>
                <div class="screws screw-bottom-left"></div>
                <div class="screws screw-bottom-right"></div>
                <div class="logo-plate">RetroVinyl</div>
                
                <!-- Player Header with VU Meters -->
                <div class="player-header">
                    <h1 class="player-title">Retro Vinyl Player</h1>
                    <div class="vu-meters">
                        <div class="vu-meter">
                            <div class="vu-meter-needle"></div>
                            <div class="vu-meter-scale"></div>
                            <div class="vu-meter-label">VU-L</div>
                        </div>
                        <div class="vu-meter">
                            <div class="vu-meter-needle"></div>
                            <div class="vu-meter-scale"></div>
                            <div class="vu-meter-label">VU-R</div>
                        </div>
                    </div>
                </div>
                
                <div class="player-layout">
                    <!-- Turntable Section with Record -->
                    <div class="turntable-section">
                        <div class="turntable">
                            <div class="platter">
                                <div class="record">
                                    <div class="record-label"></div>
                                </div>
                                <div class="spindle"></div>
                            </div>
                            <div class="tonearm-base"></div>
                            <div class="tonearm">
                                <div class="tonearm-head"></div>
                            </div>
                        </div>
                        <button class="buy-now-btn">Buy Now</button>
                    </div>
                    
                    <!-- Track Info Section -->
                    <div class="track-info-section">
                        <div class="track-info">
                            <h2 class="title">Song Title</h2>
                            <h3 class="artist">Artist Name</h3>
                            <p class="album">Album Name</p>
                        </div>
                        <div class="track-controls">
                            <div class="volume-knob-container">
                                <div class="knob-labels">VOLUME</div>
                                <div class="volume-knob"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Main Player Content -->
                    <div class="player-content">
                        <!-- Visualizer -->
                        <div class="visualizer-container">
                            <div class="visualizer-screen">
                                <canvas class="audio-visualizer" id="audioVisualizer"></canvas>
                                <div class="visualizer-grid"></div>
                                <div class="visualizer-scan"></div>
                            </div>
                        </div>
                        
                        <!-- Controls Panel -->
                        <div class="controls-panel">
                            <div class="playback-controls">
                                <button class="btn shuffle-btn">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
                                    </svg>
                                </button>
                                <button class="btn prev-btn">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                    </svg>
                                </button>
                                <button class="btn play-btn">
                                    <svg class="play-icon" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <svg class="pause-icon" viewBox="0 0 24 24" style="display: none;">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                    </svg>
                                </button>
                                <button class="btn next-btn">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                                <button class="btn repeat-btn">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="progress-panel">
                                <div class="progress-bar">
                                    <div class="progress-current"></div>
                                    <div class="progress-indicator"></div>
                                </div>
                                <div class="time-display">
                                    <span class="current-time">0:00</span>
                                    <span class="total-time">0:00</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Playlist Section -->
                        <div class="playlist-section">
                            <div class="playlist-title">
                                <svg viewBox="0 0 24 24">
                                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                                </svg>
                                <span>Soundtrack</span>
                            </div>
                            <div class="song-navigation">
                                <!-- Song items will be added here dynamically -->
                            </div>
                        </div>
                        
                        <!-- Social & Sharing Panel -->
                        <div class="social-panel">
                            <div class="panel-tabs">
                                <div class="panel-tab active" data-tab="share">Share Track</div>
                                <div class="panel-tab" data-tab="services">Streaming</div>
                                <div class="panel-tab" data-tab="artist">Follow Artist</div>
                            </div>
                            
                            <!-- Share Tab -->
                            <div class="panel-content active" data-content="share">
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
                                    </button>
                                    <button class="share-button share-whatsapp" title="Share on WhatsApp">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375a9.869 9.869 0 0 1-1.516-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.891-9.885 9.891m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                        </svg>
                                    </button>
                                    <button class="share-button share-email" title="Share via Email">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                    </button>
                                    <button class="share-button share-copy" title="Copy Link">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Streaming Services Tab -->
                            <div class="panel-content" data-content="services">
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
                                            <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.664.113 1.322.255 1.966.28 1.262.876 2.36 1.89 3.21.906.77 1.964 1.22 3.15 1.45.39.07.786.115 1.185.146.414.027.828.044 1.242.044.187 0 .375-.007.562-.013h9.17c.14-.01.284-.013.425-.025.627-.047 1.245-.108 1.847-.29 1.22-.36 2.24-1.054 3.02-2.076.55-.738.898-1.563 1.088-2.455.116-.53.176-1.07.204-1.613.016-.31.022-.617.03-.928v-9.17c-.01-.278-.018-.554-.036-.83-.04-.666-.11-1.305-.27-1.933-.367-1.432-1.108-2.596-2.297-3.466-.757-.553-1.604-.895-2.534-1.085-.444-.09-.894-.142-1.35-.164-.134-.007-.268-.016-.4-.023zm-12.24 4.53c1.234.057 2.407.283 3.534.767 1.626.7 2.924 1.787 3.847 3.307.347.575.598 1.18.778 1.812.083.29.142.59.18.888.042.33.037.666.053 1l.008.19c.012.586-.04 1.16-.2 1.726-.386 1.372-1.08 2.57-2.126 3.552-.798.748-1.723 1.283-2.776 1.623-.788.257-1.6.39-2.428.453-.15.01-.302.022-.452.027-.08.003-.16.003-.238.003h-10.8c-.14 0-.276-.01-.414-.023-.735-.065-1.456-.192-2.148-.46-1.06-.41-1.955-1.042-2.698-1.893-.723-.825-1.24-1.764-1.563-2.812C1.518 19.3 1.37 18.72 1.3 18.132c-.043-.373-.076-.75-.076-1.128 0-.37 0-.738.025-1.107.05-.632.164-1.252.352-1.85.42-1.32 1.103-2.45 2.08-3.382C4.554 9.84 5.64 9.35 6.865 9.111c.81-.158 1.624-.23 2.442-.256.27-.007.54-.01.813-.01h1.142c.193 0 .387.01.58.02zm.037 2.21c-.976.035-1.95.04-2.927.012-.78-.036-1.557-.13-2.31-.368-.8-.255-1.47-.696-1.964-1.42-.25-.365-.415-.775-.484-1.218-.07-.442.02-.872.233-1.263.4-.726 1.037-1.15 1.808-1.35.324-.083.655-.113.99-.124.36-.012.735-.002 1.11-.002h8.064c.314.01.629.024.942.08.78.14 1.466.44 1.983 1.08.87.108.155.226.227.352.128.225.203.466.217.72.047.882-.308 1.534-1.048 1.982-.46.28-.96.44-1.482.524-.216.035-.435.057-.654.067-.388.02-.777.027-1.166.033-.33.004-.66.01-.99.01zm8.92 3.655c-.076-.662-.213-1.306-.482-1.908-.546-1.228-1.336-2.257-2.353-3.124-.86-.736-1.833-1.288-2.904-1.687-1.237-.46-2.523-.7-3.843-.75-.68-.027-1.362-.02-2.043-.02H7.45c-.32.01-.634.026-.946.096-.538.123-1.027.33-1.403.78-.215.26-.348.55-.355.878-.004.15 0 .3.022.45.095.667.445 1.17 1.02 1.53.417.261.88.413 1.36.512.508.103 1.022.143 1.536.165.936.043 1.873.03 2.808.012.36-.005.72-.036 1.078-.077 1.34-.15 2.616-.56 3.788-1.28.882-.54 1.643-1.2 2.277-2.016.363-.467.636-.986.82-1.56zm-7.82 1.98c.057-.196.123-.39.17-.59.148-.61.213-1.234.193-1.87-.022-.69-.155-1.362-.446-1.985-.16-.342-.367-.655-.633-.93-.373-.39-.826-.653-1.325-.83-.262-.093-.53-.158-.803-.2-.34-.05-.688-.073-1.035-.073H5.23c-.66 0-1.303.14-1.91.411-.598.27-1.087.662-1.45 1.2-.326.484-.54 1.016-.66 1.582-.067.31-.1.625-.12.946-.023.428-.01.856.046 1.282.112.836.36 1.61.83 2.31.552.82 1.26 1.478 2.11 1.976.66.386 1.367.662 2.116.83.56.125 1.127.19 1.702.212.32.01.64.01.96.01h.63c.16-.012.32-.024.48-.04 1.007-.1 1.967-.36 2.872-.84.997-.53 1.845-1.22 2.525-2.1.413-.535.747-1.11.98-1.73.172-.46.282-.94.338-1.424.012-.105.023-.21.023-.327H8.893v.004z"/>
                                        </svg>
                                        <span>Apple Music</span>
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Artist Social Links Tab -->
                            <div class="panel-content" data-content="artist">
                                <div class="artist-social-links">
                                    <a href="#" class="artist-social-link artist-facebook" target="_blank" title="Facebook">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                                        </svg>
                                    </a>
                                    <a href="#" class="artist-social-link artist-twitter" target="_blank" title="Twitter">
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
                                            <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.857.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 01.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z"/>
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
}

// Register the custom element
window.customElements.define('retro-vinyl-player', RetroVinylPlayer);
