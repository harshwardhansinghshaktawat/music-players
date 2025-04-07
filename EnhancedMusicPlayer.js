class cinematicplayer extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._wavesurfer = null;
        this._isPlaying = false;
        this._currentVolume = 0.8;
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
                
                /* Theme colors */
                /* Default Epic Theme */
                   :host {
                    --primary-color: #c0a080;
                    --secondary-color: #a08060;
                    --background-color: #121820;
                    --background-gradient: linear-gradient(135deg, #121820, #1c2430);
                    --text-primary: #f0e6d8;
                    --text-secondary: #c0b0a0;
                    --accent-color: #bf4040;
                    --button-hover: #d4b072;
                    --control-bg: rgba(40, 40, 50, 0.6);
                    --card-bg: rgba(30, 30, 40, 0.7);
                    --player-border: 1px solid rgba(192, 160, 128, 0.3);
                    --border-color: rgba(192, 160, 128, 0.3);
                    --shadow-color: rgba(0, 0, 0, 0.5);
                    --visualizer-color-start: #c0a080;
                    --visualizer-color-end: #f0e6d8;
                    --button-text: #121820;
                    --progress-bg: rgba(80, 80, 90, 0.4);
                    --inactive-control: rgba(192, 160, 128, 0.6);
                    display: block;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    font-size: 16px;
                }
                
                /* Dark Drama Theme */
                :host(.theme-dark-drama) {
                    --primary-color: #8c2a2a;
                    --secondary-color: #671f1f;
                    --background-color: #1a1515;
                    --background-gradient: linear-gradient(135deg, #1a1515, #2d2020);
                    --text-primary: #f5e6e6;
                    --text-secondary: #d8bfbf;
                    --accent-color: #d4b072;
                    --button-hover: #a33636;
                    --control-bg: rgba(70, 30, 30, 0.4);
                    --card-bg: rgba(50, 25, 25, 0.5);
                    --border-color: rgba(140, 42, 42, 0.3);
                    --shadow-color: rgba(20, 0, 0, 0.6);
                    --visualizer-color-start: #8c2a2a;
                    --visualizer-color-end: #d4b072;
                    --button-text: #f5e6e6;
                    --progress-bg: rgba(70, 30, 30, 0.4);
                    --inactive-control: rgba(140, 42, 42, 0.7);
                }
                
                /* Sci-Fi Theme */
                :host(.theme-scifi) {
                    --primary-color: #4a9bcf;
                    --secondary-color: #2c7fb4;
                    --background-color: #0c1824;
                    --background-gradient: linear-gradient(135deg, #0c1824, #142838);
                    --text-primary: #e6f5ff;
                    --text-secondary: #a8d0f0;
                    --accent-color: #61e786;
                    --button-hover: #5db8e6;
                    --control-bg: rgba(20, 60, 90, 0.6);
                    --card-bg: rgba(15, 40, 70, 0.7);
                    --border-color: rgba(74, 155, 207, 0.4);
                    --shadow-color: rgba(0, 10, 30, 0.6);
                    --visualizer-color-start: #4a9bcf;
                    --visualizer-color-end: #61e786;
                    --button-text: #0c1824;
                    --progress-bg: rgba(20, 60, 90, 0.4);
                    --inactive-control: rgba(74, 155, 207, 0.6);
                }
                
                /* Noir Theme */
                :host(.theme-noir) {
                    --primary-color: #d8d8d8;
                    --secondary-color: #a0a0a0;
                    --background-color: #121212;
                    --background-gradient: linear-gradient(135deg, #121212, #1e1e1e);
                    --text-primary: #ffffff;
                    --text-secondary: #d0d0d0;
                    --accent-color: #ffffff;
                    --button-hover: #f0f0f0;
                    --control-bg: rgba(50, 50, 50, 0.7);
                    --card-bg: rgba(40, 40, 40, 0.8);
                    --border-color: rgba(216, 216, 216, 0.3);
                    --shadow-color: rgba(0, 0, 0, 0.8);
                    --visualizer-color-start: #d8d8d8;
                    --visualizer-color-end: #ffffff;
                    --button-text: #121212;
                    --progress-bg: rgba(60, 60, 60, 0.6);
                    --inactive-control: rgba(216, 216, 216, 0.6);
                }
                
                /* Western Theme */
                :host(.theme-western) {
                    --primary-color: #b0703c;
                    --secondary-color: #8c5a30;
                    --background-color: #271b12;
                    --background-gradient: linear-gradient(135deg, #271b12, #3a291c);
                    --text-primary: #f4e2ca;
                    --text-secondary: #d7b991;
                    --accent-color: #990000;
                    --button-hover: #c88345;
                    --control-bg: rgba(70, 50, 30, 0.5);
                    --card-bg: rgba(50, 35, 20, 0.6);
                    --border-color: rgba(176, 112, 60, 0.4);
                    --shadow-color: rgba(20, 10, 0, 0.6);
                    --visualizer-color-start: #b0703c;
                    --visualizer-color-end: #f4e2ca;
                    --button-text: #f4e2ca;
                    --progress-bg: rgba(70, 50, 30, 0.5);
                    --inactive-control: rgba(176, 112, 60, 0.7);
                }
                
                /* Fantasy Theme */
                :host(.theme-fantasy) {
                    --primary-color: #9063cd;
                    --secondary-color: #7841b9;
                    --background-color: #1f1635;
                    --background-gradient: linear-gradient(135deg, #1f1635, #2d1f4d);
                    --text-primary: #f0e6ff;
                    --text-secondary: #d8c4f5;
                    --accent-color: #ff9e3e;
                    --button-hover: #a474e0;
                    --control-bg: rgba(60, 40, 100, 0.5);
                    --card-bg: rgba(45, 30, 80, 0.6);
                    --border-color: rgba(144, 99, 205, 0.4);
                    --shadow-color: rgba(10, 0, 30, 0.6);
                    --visualizer-color-start: #9063cd;
                    --visualizer-color-end: #ff9e3e;
                    --button-text: #f0e6ff;
                    --progress-bg: rgba(60, 40, 100, 0.4);
                    --inactive-control: rgba(144, 99, 205, 0.7);
                }
                
                /* Light Theme Gradients for Theme Selector */
                .theme-light-epic {
                    background: linear-gradient(135deg, #e6d8c0, #c0a080);
                }
                
                .theme-light-retro {
                    background: linear-gradient(135deg, #e0c9a6, #a38a65);
                }
                
                .theme-light-elegant {
                    background: linear-gradient(135deg, #d1c5d5, #8c7d96);
                }
                
                .theme-light-pastel {
                    background: linear-gradient(135deg, #bcd0db, #84a0b5);
                }
                
                .theme-light-vintage {
                    background: linear-gradient(135deg, #e8d0b8, #bc9775);
                }
                
                /* Light Themes */
                /* Light Epic Theme */
                :host(.theme-light-epic) {
                    --primary-color: #8a5d3b;
                    --secondary-color: #a47c5b;
                    --background-color: #f5f1e8;
                    --background-gradient: linear-gradient(135deg, #f5f1e8, #efe6d6);
                    --text-primary: #442b1a;
                    --text-secondary: #6a4c38;
                    --accent-color: #b7373b;
                    --button-hover: #9e6e47;
                    --control-bg: rgba(164, 124, 91, 0.2);
                    --card-bg: rgba(138, 93, 59, 0.1);
                    --border-color: rgba(138, 93, 59, 0.3);
                    --shadow-color: rgba(138, 93, 59, 0.3);
                    --visualizer-color-start: #8a5d3b;
                    --visualizer-color-end: #c9ab7c;
                    --button-text: #f5f1e8;
                    --player-border: 1px solid rgba(138, 93, 59, 0.3);
                    --progress-bg: rgba(138, 93, 59, 0.2);
                    --inactive-control: rgba(138, 93, 59, 0.5);
                }
                
                /* Light Retro Theme */
                :host(.theme-light-retro) {
                    --primary-color: #a38a65;
                    --secondary-color: #8a7254;
                    --background-color: #f6efdc;
                    --background-gradient: linear-gradient(135deg, #f6efdc, #ede4cb);
                    --text-primary: #4d3d28;
                    --text-secondary: #6b5a41;
                    --accent-color: #d4412c;
                    --button-hover: #b99c74;
                    --control-bg: rgba(163, 138, 101, 0.2);
                    --card-bg: rgba(163, 138, 101, 0.1);
                    --border-color: rgba(163, 138, 101, 0.3);
                    --shadow-color: rgba(163, 138, 101, 0.3);
                    --visualizer-color-start: #a38a65;
                    --visualizer-color-end: #d5c2a5;
                    --button-text: #f6efdc;
                    --player-border: 1px solid rgba(163, 138, 101, 0.3);
                    --progress-bg: rgba(163, 138, 101, 0.2);
                    --inactive-control: rgba(163, 138, 101, 0.5);
                }
                
                /* Light Elegant Theme */
                :host(.theme-light-elegant) {
                    --primary-color: #8c7d96;
                    --secondary-color: #75677e;
                    --background-color: #f0ecf2;
                    --background-gradient: linear-gradient(135deg, #f0ecf2, #e4dfe8);
                    --text-primary: #443a4c;
                    --text-secondary: #625469;
                    --accent-color: #a8576c;
                    --button-hover: #9c8ca8;
                    --control-bg: rgba(140, 125, 150, 0.2);
                    --card-bg: rgba(140, 125, 150, 0.1);
                    --border-color: rgba(140, 125, 150, 0.3);
                    --shadow-color: rgba(140, 125, 150, 0.3);
                    --visualizer-color-start: #8c7d96;
                    --visualizer-color-end: #c7bcd0;
                    --button-text: #f0ecf2;
                    --player-border: 1px solid rgba(140, 125, 150, 0.3);
                    --progress-bg: rgba(140, 125, 150, 0.2);
                    --inactive-control: rgba(140, 125, 150, 0.5);
                }
                
                /* Light Pastel Theme */
                :host(.theme-light-pastel) {
                    --primary-color: #84a0b5;
                    --secondary-color: #6d8699;
                    --background-color: #edf3f7;
                    --background-gradient: linear-gradient(135deg, #edf3f7, #dfeaf2);
                    --text-primary: #3c5064;
                    --text-secondary: #5a7182;
                    --accent-color: #bd7b8a;
                    --button-hover: #94b4ca;
                    --control-bg: rgba(132, 160, 181, 0.2);
                    --card-bg: rgba(132, 160, 181, 0.1);
                    --border-color: rgba(132, 160, 181, 0.3);
                    --shadow-color: rgba(132, 160, 181, 0.3);
                    --visualizer-color-start: #84a0b5;
                    --visualizer-color-end: #c0d6e6;
                    --button-text: #edf3f7;
                    --player-border: 1px solid rgba(132, 160, 181, 0.3);
                    --progress-bg: rgba(132, 160, 181, 0.2);
                    --inactive-control: rgba(132, 160, 181, 0.5);
                }
                
                /* Light Vintage Theme */
                :host(.theme-light-vintage) {
                    --primary-color: #bc9775;
                    --secondary-color: #a07d5c;
                    --background-color: #f8f2e9;
                    --background-gradient: linear-gradient(135deg, #f8f2e9, #f0e6d6);
                    --text-primary: #5b4835;
                    --text-secondary: #7d6a52;
                    --accent-color: #996049;
                    --button-hover: #d0aa84;
                    --control-bg: rgba(188, 151, 117, 0.2);
                    --card-bg: rgba(188, 151, 117, 0.1);
                    --border-color: rgba(188, 151, 117, 0.3);
                    --shadow-color: rgba(188, 151, 117, 0.3);
                    --visualizer-color-start: #bc9775;
                    --visualizer-color-end: #e2cdb8;
                    --button-text: #f8f2e9;
                    --player-border: 1px solid rgba(188, 151, 117, 0.3);
                    --progress-bg: rgba(188, 151, 117, 0.2);
                    --inactive-control: rgba(188, 151, 117, 0.5);
                }
                
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.8em;
                }
                
                .player-title {
                    font-size: 1.6em;
                    font-weight: 700;
                    margin: 0;
                    font-family: 'Cinzel', serif;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                
                /* Theme Selector */
                .theme-selector {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5em;
                }
                
                .theme-option {
                    width: 1.8em;
                    height: 1.8em;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    position: relative;
                    border: 2px solid transparent;
                    position: relative;
                }
                
                .theme-option:hover {
                    transform: scale(1.15);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                }
                
                .theme-option.active {
                    border: 2px solid var(--text-primary);
                    box-shadow: 0 0 15px var(--primary-color);
                }

                /* Add focus indicator for better accessibility */
                .theme-option:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .theme-epic {
                    background: linear-gradient(135deg, #c0a080, #a08060);
                }
                
                .theme-dark-drama {
                    background: linear-gradient(135deg, #8c2a2a, #671f1f);
                }
                
                .theme-scifi {
                    background: linear-gradient(135deg, #4a9bcf, #2c7fb4);
                }
                
                .theme-noir {
                    background: linear-gradient(135deg, #d8d8d8, #a0a0a0);
                }
                
                .theme-western {
                    background: linear-gradient(135deg, #b0703c, #8c5a30);
                }
                
                .theme-fantasy {
                    background: linear-gradient(135deg, #9063cd, #7841b9);
                }
                
                *, *:before, *:after {
                    box-sizing: inherit;
                }
                
                .player-container {
                    width: 100%;
                    height: 100%;
                    background: var(--background-gradient);
                    border-radius: 24px;
                    padding: 5%;
                    box-shadow: 0 15px 35px var(--shadow-color), 0 0 0 1px var(--border-color);
                    color: var(--text-primary);
                    font-family: 'Montserrat', sans-serif;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    border: var(--player-border);
                }
                
                .player-layout {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 5%;
                    flex: 0 0 auto;
                }
                
                .cover-section {
                    flex: 0 0 35%;
                    max-width: 35%;
                }
                
                .info-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0; /* Important for text overflow */
                }
                
                .cover-container {
                    position: relative;
                    width: 100%;
                    padding-bottom: 100%; /* 1:1 Aspect Ratio - always maintain square */
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 15px 30px var(--shadow-color);
                    transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
                    outline: 1px solid var(--border-color);
                }
                
                .cover-container:hover {
                    transform: scale(1.03);
                    box-shadow: 0 20px 40px var(--shadow-color);
                }
                
                .album-cover {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 16px;
                    filter: brightness(0.95);
                    transition: filter 0.3s ease;
                }
                
                .album-cover:hover {
                    filter: brightness(1.05);
                }
                
                .buy-now-btn {
                    width: 100%;
                    margin-top: 1.2em;
                    padding: 1em;
                    background: var(--accent-color);
                    color: var(--button-text);
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.95em;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    font-family: 'Cinzel', serif;
                }
                
                .buy-now-btn:hover {
                    background: var(--accent-color);
                    opacity: 0.92;
                    transform: translateY(-3px);
                    box-shadow: 0 7px 18px rgba(0, 0, 0, 0.4);
                }

                .buy-now-btn:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .track-info {
                    margin-bottom: 1.2em;
                    min-width: 0; /* Important for text overflow */
                }
                
                .title {
                    font-size: 1.8em;
                    margin: 0 0 0.2em 0;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: 'Cinzel', serif;
                    letter-spacing: 0.03em;
                }
                
                .artist {
                    font-size: 1.2em;
                    margin: 0 0 0.4em 0;
                    color: var(--text-secondary);
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: 'Montserrat', sans-serif;
                }
                
                .album {
                    font-size: 1em;
                    margin: 0;
                    color: var(--text-secondary);
                    opacity: 0.9;
                    font-weight: 400;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: 'Montserrat', sans-serif;
                }
                
                .visualizer-container {
                    width: 100%;
                    height: 120px;
                    background: var(--card-bg);
                    border-radius: 12px;
                    margin: 1em 0;
                    padding: 10px;
                    box-sizing: border-box;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.2);
                }
                
                .audio-visualizer {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                
                .controls-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1em;
                    flex-wrap: wrap;
                }
                
                .playback-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.8em;
                    margin-bottom: 0.6em;
                }
                
                .volume-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.6em;
                    margin-bottom: 0.6em;
                }
                
                .btn {
                    background: var(--control-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    cursor: pointer;
                    width: 2.8em;
                    height: 2.8em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    padding: 0;
                    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
                }
                
                .btn:hover {
                    background: var(--control-bg);
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
                }

                .btn:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .btn svg {
                    width: 1.3em;
                    height: 1.3em;
                    fill: currentColor;
                }
                
                .play-btn {
                    background: var(--primary-color);
                    width: 3.6em;
                    height: 3.6em;
                    color: var(--button-text);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-color);
                }
                
                .play-btn:hover {
                    background: var(--button-hover);
                    transform: translateY(-3px) scale(1.08);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-color);
                }
                
                .play-btn svg {
                    width: 1.6em;
                    height: 1.6em;
                }
                
                .volume-slider {
                    -webkit-appearance: none;
                    width: 100px;
                    height: 8px;
                    background: var(--progress-bg);
                    border-radius: 4px;
                    outline: none;
                    overflow: hidden;
                    cursor: pointer;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
                    border: 1px solid var(--border-color);
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    border: 2px solid var(--button-text);
                    box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
                }

                .volume-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    border: 2px solid var(--button-text);
                    box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
                }

                .volume-slider:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .progress-control {
                    width: 100%;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: var(--progress-bg);
                    border-radius: 4px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                
                .progress-current {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 0%;
                    background: var(--primary-color);
                    border-radius: 4px;
                    transition: width 0.1s linear;
                    box-shadow: 0 0 10px var(--primary-color);
                }
                
                .progress-indicator {
                    position: absolute;
                    top: 50%;
                    left: 0%;
                    width: 16px;
                    height: 16px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    display: none;
                    border: 2px solid var(--button-text);
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
                }
                
                .progress-bar:hover .progress-indicator {
                    display: block;
                }

                .progress-bar:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .time-display {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.6em;
                    font-size: 0.85em;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                
                .service-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.8em;
                    margin-top: 1.2em;
                    padding-top: 1.2em;
                    border-top: 1px solid var(--border-color);
                    margin-bottom: 1.2em;
                }
                
                .service-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5em;
                    padding: 0.6em 1em;
                    background: var(--card-bg);
                    border-radius: 6px;
                    color: var(--text-primary);
                    text-decoration: none;
                    font-size: 0.9em;
                    font-weight: 500;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }
                
                .service-link:hover {
                    background: var(--control-bg);
                    transform: translateY(-3px);
                    box-shadow: 0 5px 12px var(--shadow-color);
                }

                .service-link:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .service-link svg {
                    width: 1.2em;
                    height: 1.2em;
                    fill: currentColor;
                }
                
                .service-spotify {
                    color: #1DB954;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .service-spotify:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .service-youtube {
                    color: #FF0000;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .service-youtube:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .service-soundcloud {
                    color: #FF7700;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .service-soundcloud:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .service-apple {
                    color: #FB2D4E;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .service-apple:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                /* Social Sharing */
                .social-share-container {
                    margin-bottom: 1.2em;
                    padding-bottom: 1.2em;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .social-share-title {
                    font-size: 1.1em;
                    margin: 0 0 0.8em 0;
                    color: var(--text-secondary);
                    font-weight: 500;
                    font-family: 'Cinzel', serif;
                    letter-spacing: 0.05em;
                }
                
                .social-share-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.8em;
                }
                
                .share-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.7em;
                    height: 2.7em;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
                }
                
                .share-button:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px var(--shadow-color);
                }

                .share-button:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .share-button svg {
                    width: 1.3em;
                    height: 1.3em;
                    fill: currentColor;
                }
                
                .share-facebook {
                    color: #1877F2;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .share-facebook:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .share-twitter {
                    color: #1DA1F2;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .share-twitter:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .share-whatsapp {
                    color: #25D366;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .share-whatsapp:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .share-email {
                    color: #D44638;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .share-email:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .share-copy {
                    color: #FFFFFF;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .share-copy:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                /* Artist Social Links */
                .artist-social-container {
                    margin-top: 1.2em;
                    padding-top: 1.2em;
                    border-top: 1px solid var(--border-color);
                }
                
                .artist-social-title {
                    font-size: 1.1em;
                    margin: 0 0 0.8em 0;
                    color: var(--text-secondary);
                    font-weight: 500;
                    font-family: 'Cinzel', serif;
                    letter-spacing: 0.05em;
                }
                
                .artist-social-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.8em;
                }
                
                .artist-social-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.7em;
                    height: 2.7em;
                    border-radius: 50%;
                    background: var(--card-bg);
                    color: var(--text-primary);
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
                }
                
                .artist-social-link:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px var(--shadow-color);
                }

                .artist-social-link:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .artist-social-link svg {
                    width: 1.3em;
                    height: 1.3em;
                    fill: currentColor;
                }
                
                .artist-facebook {
                    color: #1877F2;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .artist-facebook:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .artist-twitter {
                    color: #1DA1F2;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .artist-twitter:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .artist-instagram {
                    color: #E4405F;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .artist-instagram:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .artist-youtube {
                    color: #FF0000;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .artist-youtube:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .artist-tiktok {
                    color: #FFFFFF;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .artist-tiktok:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .artist-website {
                    color: #FFFFFF;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .artist-website:hover {
                    background: rgba(0, 0, 0, 0.8);
                }

                .equalizer {
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    height: 40px;
                    gap: 3px;
                    margin-top: 12px;
                    position: absolute;
                    bottom: 15px;
                    left: 0;
                    right: 0;
                }
                
                .equalizer-bar {
                    background: var(--primary-color);
                    width: 4px;
                    height: 5px;
                    border-radius: 2px;
                    transition: height 0.2s ease;
                    opacity: 0.9;
                    box-shadow: 0 0 8px var(--primary-color);
                }
                
                @keyframes equalize {
                    0% { height: 5px; }
                    50% { height: 25px; }
                    100% { height: 5px; }
                }
                
                .playing .equalizer-bar {
                    animation: equalize 1.5s ease infinite;
                }
                
                .playing .equalizer-bar:nth-child(1) { animation-delay: -1.2s; }
                .playing .equalizer-bar:nth-child(2) { animation-delay: -0.9s; }
                .playing .equalizer-bar:nth-child(3) { animation-delay: -1.5s; }
                .playing .equalizer-bar:nth-child(4) { animation-delay: -0.6s; }
                .playing .equalizer-bar:nth-child(5) { animation-delay: -0.3s; }
                .playing .equalizer-bar:nth-child(6) { animation-delay: -1.8s; }
                .playing .equalizer-bar:nth-child(7) { animation-delay: -1.0s; }
                .playing .equalizer-bar:nth-child(8) { animation-delay: -0.7s; }
                
                /* Song Navigation */
                .playlist-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    margin-top: 1.2em;
                    min-height: 0; /* Important for flex containers */
                }
                
                .playlist-title {
                    font-size: 1.4em;
                    font-weight: 600;
                    margin: 0 0 0.8em 0;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 0.5em;
                    flex: 0 0 auto;
                    font-family: 'Cinzel', serif;
                    letter-spacing: 0.05em;
                }
                
                .playlist-title svg {
                    width: 1.4em;
                    height: 1.4em;
                    fill: currentColor;
                }
                
                .song-navigation {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    margin-bottom: 0.6em;
                    border-top: 1px solid var(--border-color);
                    padding-top: 1.2em;
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-color) var(--card-bg);
                    min-height: 0; /* Important for Firefox */
                }
                
                .song-navigation::-webkit-scrollbar {
                    width: 6px;
                }
                
                .song-navigation::-webkit-scrollbar-track {
                    background: var(--card-bg);
                    border-radius: 3px;
                }
                
                .song-navigation::-webkit-scrollbar-thumb {
                    background-color: var(--primary-color);
                    border-radius: 3px;
                }
                
                .song-item {
                    display: flex;
                    align-items: center;
                    padding: 1em 1.2em;
                    border-radius: 10px;
                    margin-bottom: 0.8em;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    background: var(--card-bg);
                    border-left: 3px solid transparent;
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
                }
                
                .song-item:hover {
                    background: var(--control-bg);
                    transform: translateX(8px);
                    box-shadow: 0 6px 12px var(--shadow-color);
                }

                .song-item:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .song-item.active {
                    background: var(--control-bg);
                    border-left: 3px solid var(--primary-color);
                    font-weight: 600;
                    box-shadow: 0 5px 15px var(--shadow-color);
                }
                
                .song-item-info {
                    flex: 1;
                    min-width: 0; /* Important for text overflow */
                }
                
                .song-item-title {
                    font-weight: 600;
                    font-size: 1.1em;
                    margin-bottom: 0.4em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: 'Montserrat', sans-serif;
                }
                
                .song-item-artist {
                    font-size: 0.9em;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: 'Montserrat', sans-serif;
                }
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .player-layout {
                        flex-direction: column;
                    }
                    
                    .cover-section {
                        flex: 0 0 auto;
                        max-width: 85%;
                        margin: 0 auto 1.8em auto;
                    }
                    
                    .info-section {
                        width: 100%;
                    }
                    
                    .visualizer-container {
                        height: 90px;
                    }
                    
                    .controls-main {
                        justify-content: center;
                    }
                    
                    .playback-controls {
                        width: 100%;
                        justify-content: center;
                        margin-bottom: 1.2em;
                        gap: 0.9em;
                    }
                    
                    .btn {
                        width: 3em;
                        height: 3em;
                    }
                    
                    .btn svg {
                        width: 1.5em;
                        height: 1.5em;
                    }
                    
                    .play-btn {
                        width: 3.8em;
                        height: 3.8em;
                    }
                    
                    .play-btn svg {
                        width: 1.8em;
                        height: 1.8em;
                    }
                    
                    .volume-controls {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .service-links {
                        justify-content: center;
                    }
                    
                    .song-navigation {
                        max-height: 200px;
                    }
                    
                    .title {
                        font-size: 1.7em;
                    }
                    
                    .artist {
                        font-size: 1.3em;
                    }
                    
                    .album {
                        font-size: 1.1em;
                    }
                    
                    .song-item-title {
                        font-size: 1.2em;
                    }
                    
                    .song-item-artist {
                        font-size: 1em;
                    }
                }
                
                @media (max-width: 480px) {
                    .player-container {
                        padding: 1.5em;
                        border-radius: 16px;
                    }
                    
                    .cover-section {
                        max-width: 100%;
                    }
                    
                    .title {
                        font-size: 1.8em;
                    }
                    
                    .artist {
                        font-size: 1.4em;
                    }
                    
                    .album {
                        font-size: 1.2em;
                    }
                    
                    .buy-now-btn {
                        padding: 1.2em;
                        font-size: 1.2em;
                        margin-top: 1.5em;
                    }
                    
                    .btn {
                        width: 3.8em;
                        height: 3.8em;
                    }
                    
                    .btn svg {
                        width: 1.8em;
                        height: 1.8em;
                    }
                    
                    .play-btn {
                        width: 4.5em;
                        height: 4.5em;
                    }
                    
                    .play-btn svg {
                        width: 2.2em;
                        height: 2.2em;
                    }
                    
                    .visualizer-container {
                        height: 90px;
                        margin: 1.5em 0;
                    }
                    
                    .playlist-title {
                        font-size: 1.6em;
                    }
                    
                    .song-item {
                        padding: 1.2em 1.4em;
                        margin-bottom: 1em;
                    }
                    
                    .song-item-title {
                        font-size: 1.3em;
                        margin-bottom: 0.5em;
                    }
                    
                    .song-item-artist {
                        font-size: 1.1em;
                    }
                    
                    .service-link {
                        padding: 0.9em 1.2em;
                        font-size: 1.2em;
                        margin-right: 0.6em;
                        margin-bottom: 0.6em;
                    }
                    
                    .service-link svg {
                        width: 1.5em;
                        height: 1.5em;
                    }
                    
                    .time-display {
                        font-size: 1.1em;
                        margin-top: 0.8em;
                    }
                    
                    .volume-slider {
                        width: 140px;
                        height: 10px;
                    }
                    
                    .volume-slider::-webkit-slider-thumb {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .progress-bar {
                        height: 10px;
                    }
                    
                    .progress-indicator {
                        width: 20px;
                        height: 20px;
                    }
                }
                
                /* Make sure everything fits inside the container at any height */
                @media (max-height: 600px) {
                    .song-navigation {
                        max-height: 120px;
                    }
                    
                    .visualizer-container {
                        height: 60px;
                    }
                }
                
                /* Specific adjustments for larger phones in landscape mode */
                @media (max-width: 900px) and (max-height: 450px) {
                    .player-layout {
                        flex-direction: row;
                    }
                    
                    .cover-section {
                        flex: 0 0 30%;
                        max-width: 30%;
                    }
                    
                    .song-navigation {
                        max-height: 80px;
                    }
                    
                    .visualizer-container {
                        height: 50px;
                    }
                }

                /* Accessibility focus visible styles */
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
                
                /* Background Cinematic Effects */
                .player-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(circle at 20% 30%, rgba(192, 160, 128, 0.1) 0%, transparent 60%),
                        radial-gradient(circle at 80% 70%, rgba(192, 160, 128, 0.1) 0%, transparent 60%);
                    pointer-events: none;
                    border-radius: 24px;
                    z-index: -1;
                }
                
                /* Film Grain Effect */
                .player-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==');
                    pointer-events: none;
                    opacity: 0.4;
                    border-radius: 24px;
                    z-index: 1;
                    mix-blend-mode: overlay;
                }
                
                /* Glow effects for controls */
                .btn:hover::after,
                .play-btn:hover::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    box-shadow: 0 0 15px var(--primary-color);
                    opacity: 0.6;
                    z-index: -1;
                }
                
                /* Vignette effect */
                .cover-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 16px;
                    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.8);
                    pointer-events: none;
                }
            </style>
            
            <div class="player-container">
                <!-- Player Header with Title and Theme Selector -->
                <div class="player-header">
                    <h1 class="player-title">Cinematic Player</h1>
                    <div class="theme-selector">
                        <!-- Dark Themes -->
                        <div class="theme-option theme-epic active" data-theme="default" title="Epic Theme"></div>
                        <div class="theme-option theme-dark-drama" data-theme="dark-drama" title="Dark Drama Theme"></div>
                        <div class="theme-option theme-scifi" data-theme="scifi" title="Sci-Fi Theme"></div>
                        <div class="theme-option theme-noir" data-theme="noir" title="Noir Theme"></div>
                        <div class="theme-option theme-western" data-theme="western" title="Western Theme"></div>
                        <div class="theme-option theme-fantasy" data-theme="fantasy" title="Fantasy Theme"></div>
                        
                        <!-- Light Themes -->
                        <div class="theme-option theme-light-epic" data-theme="light-epic" title="Light Epic Theme"></div>
                        <div class="theme-option theme-light-retro" data-theme="light-retro" title="Light Retro Theme"></div>
                        <div class="theme-option theme-light-elegant" data-theme="light-elegant" title="Light Elegant Theme"></div>
                        <div class="theme-option theme-light-pastel" data-theme="light-pastel" title="Light Pastel Theme"></div>
                        <div class="theme-option theme-light-vintage" data-theme="light-vintage" title="Light Vintage Theme"></div>
                    </div>
                </div>
                
                <div class="player-layout">
                    <div class="cover-section">
                        <div class="cover-container">
                            <img class="album-cover" src="" alt="Album Cover">
                            <div class="equalizer">
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                            </div>
                        </div>
                        <button class="buy-now-btn">Buy Now</button>
                    </div>
                    
                    <div class="info-section">
                        <div class="track-info">
                            <h2 class="title">Song Title</h2>
                            <h3 class="artist">Artist Name</h3>
                            <p class="album">Album Name</p>
                        </div>
                        
                        <div class="visualizer-container">
                            <canvas class="audio-visualizer" id="audioVisualizer"></canvas>
                        </div>
                        
                        <div class="controls-main">
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
                            
                            <div class="volume-controls">
                                <button class="btn mute-btn">
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
                        
                        <div class="progress-control">
                            <div class="progress-bar">
                                <div class="progress-current"></div>
                                <div class="progress-indicator"></div>
                            </div>
                            <div class="time-display">
                                <span class="current-time">0:00</span>
                                <span class="total-time">0:00</span>
                            </div>
                        </div>
                        
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
                                    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.664.113 1.322.255 1.966.28 1.262.876 2.36 1.89 3.21.906.77 1.964 1.22 3.15 1.45.39.07.786.115 1.185.146.414.027.828.044 1.242.044.187 0 .375-.007.562-.013h9.17c.14-.01.284-.013.425-.025.627-.047 1.245-.108 1.847-.29 1.22-.36 2.24-1.054 3.02-2.076.55-.738.898-1.563 1.088-2.455.116-.53.176-1.07.204-1.613.016-.31.022-.617.03-.928v-9.17c-.01-.278-.018-.554-.036-.83-.04-.666-.11-1.305-.27-1.933-.367-1.432-1.108-2.596-2.297-3.466-.757-.553-1.604-.895-2.534-1.085-.444-.09-.894-.142-1.35-.164-.134-.007-.268-.016-.4-.023zm-12.24 4.53c1.234.057 2.407.283 3.534.767 1.626.7 2.924 1.787 3.847 3.307.347.575.598 1.18.778 1.812.083.29.142.59.18.888.042.33.037.666.053 1l.008.19c.012.586-.04 1.16-.2 1.726-.386 1.372-1.08 2.57-2.126 3.552-.798.748-1.723 1.283-2.776 1.623-.788.257-1.6.39-2.428.453-.15.01-.302.022-.452.027-.08.003-.16.003-.238.003h-10.8c-.14 0-.276-.01-.414-.023-.735-.065-1.456-.192-2.148-.46-1.06-.41-1.955-1.042-2.698-1.893-.723-.825-1.24-1.764-1.563-2.812C1.518 19.3 1.37 18.72 1.3 18.132c-.043-.373-.076-.75-.076-1.128 0-.37 0-.738.025-1.107.05-.632.164-1.252.352-1.85.42-1.32 1.103-2.45 2.08-3.382C4.554 9.84 5.64 9.35 6.865 9.111c.81-.158 1.624-.23 2.442-.256.27-.007.54-.01.813-.01h1.142c.193 0 .387.01.58.02zm.037 2.21c-.976.035-1.95.04-2.927.012-.78-.036-1.557-.13-2.31-.368-.8-.255-1.47-.696-1.964-1.42-.25-.365-.415-.775-.484-1.218-.07-.442.02-.872.233-1.263.4-.726 1.037-1.15 1.808-1.35.324-.083.655-.113.99-.124.36-.012.735-.002 1.11-.002h8.064c.314.01.629.024.942.08.78.14 1.466.44 1.983 1.08.87.108.155.226.227.352.128.225.203.466.217.72.047.882-.308 1.534-1.048 1.982-.46.28-.96.44-1.482.524-.216.035-.435.057-.654.067-.388.02-.777.027-1.166.033-.33.004-.66.01-.99.01zm8.92 3.655c-.076-.662-.213-1.306-.482-1.908-.546-1.228-1.336-2.257-2.353-3.124-.86-.736-1.833-1.288-2.904-1.687-1.237-.46-2.523-.7-3.843-.75-.68-.027-1.362-.02-2.043-.02H7.45c-.32.01-.634.026-.946.096-.538.123-1.027.33-1.403.78-.215.26-.348.55-.355.878-.004.15 0 .3.022.45.095.667.445 1.17 1.02 1.53.417.261.88.413 1.36.512.508.103 1.022.143 1.536.165.936.043 1.873.03 2.808.012.36-.005.72-.036 1.078-.077 1.34-.15 2.616-.56 3.788-1.28.882-.54 1.643-1.2 2.277-2.016.363-.467.636-.986.82-1.56zm-7.82 1.98c.057-.196.123-.39.17-.59.148-.61.213-1.234.193-1.87-.022-.69-.155-1.362-.446-1.985-.16-.342-.367-.655-.633-.93-.373-.39-.826-.653-1.325-.83-.262-.093-.53-.158-.803-.2-.34-.05-.688-.073-1.035-.073H5.23c-.66 0-1.303.14-1.91.411-.598.27-1.087.662-1.45 1.2-.326.484-.54 1.016-.66 1.582-.067.31-.1.625-.12.946-.023.428-.01.856.046 1.282.112.836.36 1.61.83 2.31.552.82 1.26 1.478 2.11 1.976.66.386 1.367.662 2.116.83.56.125 1.127.19 1.702.212.32.01.64.01.96.01h.63c.16-.012.32-.024.48-.04 1.007-.1 1.967-.36 2.872-.84.997-.53 1.845-1.22 2.525-2.1.413-.535.747-1.11.98-1.73.172-.46.282-.94.338-1.424.012-.105.023-.21.023-.327H8.893v.004zm4.287-2.23c-.01-.01-.014-.023-.02-.033-.267-.473-.686-.79-1.18-1.037-.3-.15-.613-.26-.947-.324-.437-.088-.877-.105-1.318-.07-.077.007-.154.013-.217.02v3.773h.005c.51.012.102.03.158.03 1.244.05 2.49.04 3.735-.035.263-.015.525-.054.784-.096.26-.042.514-.107.768-.167.69-.16 1.338-.42 1.956-.767.27-.15.525-.317.775-.49.425-.293.797-.63 1.085-1.06.076-.113.144-.23.2-.354.15-.327.23-.673.27-1.026.032-.29.036-.58.036-.87 0-.128-.01-.246-.035-.358-.066-.297-.186-.57-.385-.805-.29-.345-.655-.6-1.052-.82-.335-.182-.683-.343-1.04-.48-.237-.09-.476-.18-.714-.26-.44-.15-.903-.234-1.36-.337-.65-.15-1.3-.295-1.93-.518-.327-.116-.643-.25-.9-.5-.238-.228-.35-.5-.35-.814-.004-.11 0-.223.024-.333.066-.31.215-.56.47-.747.343-.252.73-.358 1.128-.41.245-.033.494-.04.74-.043.655-.01 1.31.013 1.96.137.4.077.795.196 1.145.407.516.307.855.74 1.013 1.33.01.04.03.077.055.142h3.58c-.017-.106-.026-.192-.045-.274-.096-.444-.257-.864-.49-1.252-.46-.766-1.084-1.347-1.85-1.777-.748-.42-1.56-.646-2.413-.764-.443-.062-.89-.084-1.34-.086-.32 0-.646.01-.967.034-.56.04-1.1.14-1.629.31-.52.168-1.013.396-1.46.705-.964.666-1.634 1.5-1.965 2.582-.12.396-.19.803-.21 1.214-.024.544.01 1.084.134 1.612.14.598.387 1.13.75 1.606.36.473.795.88 1.29 1.214.358.243.74.447 1.133.622.326.144.66.27.996.39.364.13.732.244 1.103.352.
63 18-32c.12-.042.514-.107.768-.167.69-.16 1.338-.42 1.956-.767.27-.15.525-.317.775-.49.425-.293.797-.63 1.085-1.06.076-.113.144-.23.2-.354.15-.327.23-.673.27-1.026.032-.29.036-.58.036-.87 0-.128-.01-.246-.035-.358-.066-.297-.186-.57-.385-.805-.29-.345-.655-.6-1.052-.82-.335-.182-.683-.343-1.04-.48-.237-.09-.476-.18-.714-.26-.44-.15-.903-.234-1.36-.337-.65-.15-1.3-.295-1.93-.518-.327-.116-.643-.25-.9-.5-.238-.228-.35-.5-.35-.814-.004-.11 0-.223.024-.333.066-.31.215-.56.47-.747.343-.252.73-.358 1.128-.41.245-.033.494-.04.74-.043.655-.01 1.31.013 1.96.137.4.077.795.196 1.145.407.516.307.855.74 1.013 1.33.01.04.03.077.055.142h3.58c-.017-.106-.026-.192-.045-.274-.096-.444-.257-.864-.49-1.252-.46-.766-1.084-1.347-1.85-1.777-.748-.42-1.56-.646-2.413-.764-.443-.062-.89-.084-1.34-.086-.32 0-.646.01-.967.034-.56.04-1.1.14-1.629.31-.52.168-1.013.396-1.46.705-.964.666-1.634 1.5-1.965 2.582-.12.396-.19.803-.21 1.214-.024.544.01 1.084.134 1.612.14.598.387 1.13.75 1.606.36.473.795.88 1.29 1.214.358.243.74.447 1.133.622.326.144.66.27.996.39.364.13.732.244 1.103.352.63.18 1.26.356 1.855.642.46.22.887.483 1.22.873.22.256.374.54.425.864.082.514.012.994-.357 1.4-.174.19-.388.33-.623.43-.47.2-.976.285-1.49.31-.445.02-.89.008-1.335-.03-.348-.03-.688-.09-1.023-.18-.49-.132-.956-.324-1.332-.684-.344-.33-.58-.73-.716-1.2-.012-.04-.03-.078-.048-.12h-3.558c0 .146.01.268.023.39.05.436.142.86.313 1.264.093.218.21.424.336.623.565.886 1.34 1.536 2.263 2.01.576.297 1.19.49 1.83.602.36.064.726.096 1.092.11.302.01.603.005.902.005.12-.006.233-.016.348-.027.712-.07 1.41-.19 2.087-.432.572-.207 1.11-.474 1.596-.84.304-.228.58-.485.83-.77.58-.665.96-1.42 1.103-2.293.048-.288.07-.578.08-.868.004-.077 0-.154 0-.268z"/>
                                </svg>
                                <span>Apple Music</span>
                            </a>
                        </div>
                        <div class="social-share-container">
                                <div class="social-share-title">Share this soundtrack</div>
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
                            
                            <!-- Artist Social Links -->
                            <div class="artist-social-container">
                                <div class="artist-social-title">Follow Artist</div>
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
                    
                    <!-- Song List / Playlist -->
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
        
        // Clear canvas with a slight fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw visualization with cinematic effects
        const visualizerStartColor = getComputedStyle(this).getPropertyValue('--visualizer-color-start') || '#c0a080';
        const visualizerEndColor = getComputedStyle(this).getPropertyValue('--visualizer-color-end') || '#f0e6d8';
        
        const barCount = Math.min(this._dataArray.length / 2, 64); // Use fewer bars for more cinematic look
        const barWidth = canvas.width / barCount * 0.7; // 70% of available space
        const barSpacing = canvas.width / barCount * 0.3; // 30% spacing
        
        for (let i = 0; i < barCount; i++) {
            // Create gradient for bar
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, visualizerStartColor);
            gradient.addColorStop(1, visualizerEndColor);
            ctx.fillStyle = gradient;
            
            // Calculate bar height based on frequency data with smoothing
            const index = Math.floor(i * this._dataArray.length / barCount);
            const value = this._dataArray[index];
            const percent = value / 255;
            const barHeight = percent * canvas.height * 0.8; // Max 80% of canvas height
            
            // Draw bar with reflection effect
            const x = i * (barWidth + barSpacing);
            const y = canvas.height - barHeight;
            
            // Main bar with rounded corners
            this._roundRect(ctx, x, y, barWidth, barHeight, 4);
            
            // Add glow effect
            ctx.shadowColor = visualizerStartColor;
            ctx.shadowBlur = 15 * percent;
            ctx.fill();
            
            // Add reflection (subtle reversed bar below)
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.2;
            this._roundRect(ctx, x, canvas.height, barWidth, barHeight * 0.3, 0);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Add particle effects for more cinematic feel
        if (this._particles === undefined) {
            this._particles = [];
            for (let i = 0; i < 30; i++) {
                this._particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 0.5 + 0.2
                });
            }
        }
        
        // Draw particles
        ctx.fillStyle = visualizerEndColor;
        ctx.shadowBlur = 4;
        ctx.shadowColor = visualizerStartColor;
        
        for (let i = 0; i < this._particles.length; i++) {
            const p = this._particles[i];
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Move particles upward for a floating effect
            p.y -= p.speed;
            
            // Reset particles that go off screen
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    // Helper to draw rounded rectangles
    _roundRect(ctx, x, y, width, height, radius) {
        if (height < radius * 2) radius = height / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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
                    localStorage.setItem('musicPlayerTheme', option.dataset.theme);
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
            const savedTheme = localStorage.getItem('musicPlayerTheme');
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
            'theme-dark-drama', 'theme-scifi', 'theme-noir', 'theme-western', 'theme-fantasy',
            'theme-light-epic', 'theme-light-retro', 'theme-light-elegant', 
            'theme-light-pastel', 'theme-light-vintage'
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
        const titleElement = this._shadow.querySelector('.title');
        const artistElement = this._shadow.querySelector('.artist');
        const albumElement = this._shadow.querySelector('.album');
        
        if (titleElement) titleElement.textContent = song.title || 'Unknown Title';
        if (artistElement) artistElement.textContent = song.artist || 'Unknown Artist';
        if (albumElement) albumElement.textContent = song.album || '';
        
        // Set cover image
        const coverImg = this._shadow.querySelector('.album-cover');
        if (coverImg) {
            if (song.coverImage) {
                coverImg.src = song.coverImage;
            } else {
                coverImg.src = 'https://via.placeholder.com/500?text=Cinematic+Score';
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
            console.log("Loading audio:", song.audioFile); // For debugging
            this._loadSong(song.audioFile);
        } else {
            console.warn("Audio element not initialized or no audio file available");
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
                
                if (index === this._playerData.currentIndex) {
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
        
        const playIcon = this._shadow.querySelector('.play-icon');
        const pauseIcon = this._shadow.querySelector('.pause-icon');
        const equalizer = this._shadow.querySelector('.equalizer');
        
        if (isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (equalizer) equalizer.classList.add('playing');
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (equalizer) equalizer.classList.remove('playing');
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
                shuffleBtn.style.color = getComputedStyle(this).getPropertyValue('--primary-color') || '#c0a080';
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
                repeatBtn.style.color = getComputedStyle(this).getPropertyValue('--primary-color') || '#c0a080';
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
        
        const song = this._playerData.songs[this._playerData.currentIndex];
        if (!song) return;
        
        const songTitle = song.title || 'Unknown Title';
        const artistName = song.artist || 'Unknown Artist';
        const shareText = `Listen to "${songTitle}" by ${artistName}`;
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
                window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
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
        
        const song = this._playerData.songs[this._playerData.currentIndex];
        
        if (song && song.purchaseLink) {
            window.open(song.purchaseLink, '_blank');
        } else {
            alert('Purchase link not available for this soundtrack.');
        }
    }
}

// Register the custom element
window.customElements.define('cinematic-player', EnhancedMusicPlayer);
