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
                        
                        <div class="service-links"></div>
                        
                        <div class="social-share-container">
                            <h4 class="social-share-title">Share</h4>
                            <div class="social-share-buttons">
                                <button class="share-button share-facebook">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.84-.98 8.56-4.98 8.56-9.95z"/>
                                    </svg>
                                </button>
                                <button class="share-button share-twitter">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38c-.83.5-1.75.85-2.72 1.05A4.28 4.28 0 0 0 15.5 4c-2.36 0-4.28 1.92-4.28 4.29 0 .34.04.67.11 1-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07c.54 1.69 2.11 2.92 3.96 2.96A8.58 8.58 0 0 1 2 19.54a12.14 12.14 0 0 0 6.58 1.93c7.9 0 12.22-6.54 12.22-12.21 0-.19 0-.37-.01-.56A8.7 8.7 0 0 0 22.46 6z"/>
                                    </svg>
                                </button>
                                <button class="share-button share-whatsapp">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.84.5 3.56 1.36 5.03L2 22l4.97-1.36C8.44 21.5 10.16 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm3.73 14.07c-.24.68-.9 1.12-1.58 1.18-.43.03-.99-.03-1.62-.27-1.38-.53-2.54-1.62-3.06-2.97-.18-.47-.27-.98-.27-1.5 0-.65.35-1.27.97-1.62l.38-.18c.21-.1.4-.27.47-.47.07-.21.03-.43-.03-.62l-.3-.68c-.15-.35-.5-.62-.85-.65-.35-.03-.71.18-1.03.5-.74.74-.97 1.88-.65 2.94.65 2.15 2.5 3.88 4.65 4.53.91.27 1.74.15 2.38-.18.35-.18.62-.47.74-.82.12-.35.06-.71-.15-.97l-.35-.41z"/>
                                    </svg>
                                </button>
                                <button class="share-button share-email">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </button>
                                <button class="share-button share-copy">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="artist-social-container">
                            <h4 class="artist-social-title">Follow Artist</h4>
                            <div class="artist-social-links"></div>
                        </div>
                    </div>
                </div>
                
                <div class="playlist-section">
                    <h3 class="playlist-title">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 13h12v-2H3v2zm0-5h18V6H3v2zm0 10h6v-2H3v2z"/>
                        </svg>
                        Playlist
                    </h3>
                    <div class="song-navigation"></div>
                </div>
            </div>
        `;
        this._shadow.appendChild(this._root);
        
        this._playerData = null;
        this._audioElement = null;
        this._canvas = null;
        this._canvasCtx = null;
        this._audioContext = null;
        this._analyser = null;
        this._dataArray = null;
        this._source = null;
        this._animationFrameId = null;
    }

    static get observedAttributes() {
        return ['player-data'];
    }

    connectedCallback() {
        this._loadWaveSurferScript().then(() => {
            this._initializeWaveSurfer();
            this._setupEventListeners();
        }).catch(err => console.error('Failed to load WaveSurfer.js:', err));
    }

    disconnectedCallback() {
        if (this._audioElement) {
            this._audioElement.pause();
            this._audioElement = null;
        }
        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'player-data' && newValue !== oldValue) {
            try {
                console.log("Received player data:", newValue);
                this._playerData = JSON.parse(newValue);
                console.log("Parsed player data:", this._playerData);
                
                if (this._playerData && this._playerData.songs) {
                    this._playerData.songs = this._playerData.songs.map(song => ({
                        title: song.title || 'Unknown Title',
                        artist: song.artist || 'Unknown Artist',
                        album: song.album || '',
                        audioFile: song.audioFile || '',
                        coverImage: song.coverImage || '',
                        streamingLinks: song.streamingLinks || {},
                        artistSocial: song.artistSocial || {},
                        purchaseLink: song.purchaseLink || null,
                        shareUrl: song.shareUrl || window.location.href
                    }));
                    this.render();
                    
                    // Ensure audio element exists before loading
                    if (!this._audioElement) {
                        console.log("Audio element not yet initialized, waiting...");
                        this._loadWaveSurferScript().then(() => {
                            this._initializeWaveSurfer();
                            this._loadInitialSong();
                        });
                    } else {
                        this._loadInitialSong();
                    }
                }
            } catch (e) {
                console.error("Error parsing player data:", e);
            }
        }
    }

    _loadWaveSurferScript() {
        if (window.WaveSurfer) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/wavesurfer.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    _initializeWaveSurfer() {
        if (!window.WaveSurfer) return;

        this._canvas = this._shadow.querySelector('#audioVisualizer');
        this._canvasCtx = this._canvas.getContext('2d');
        const visualizerContainer = this._shadow.querySelector('.visualizer-container');
        this._canvas.width = visualizerContainer.clientWidth;
        this._canvas.height = visualizerContainer.clientHeight;

        this._audioElement = document.createElement('audio');
        this._audioElement.crossOrigin = 'anonymous';
        this._audioElement.setAttribute('preload', 'auto');

        this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this._analyser = this._audioContext.createAnalyser();
        this._analyser.fftSize = 256;
        this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);

        this._source = this._audioContext.createMediaElementSource(this._audioElement);
        this._source.connect(this._analyser);
        this._analyser.connect(this._audioContext.destination);

        this._audioElement.addEventListener('loadedmetadata', () => {
            const duration = this._formatTime(this._audioElement.duration);
            this._shadow.querySelector('.total-time').textContent = duration;
        });

        this._audioElement.addEventListener('timeupdate', () => {
            const currentTime = this._formatTime(this._audioElement.currentTime);
            this._shadow.querySelector('.current-time').textContent = currentTime;
            const progress = (this._audioElement.currentTime / this._audioElement.duration) * 100;
            this._shadow.querySelector('.progress-current').style.width = `${progress}%`;
            this._shadow.querySelector('.progress-indicator').style.left = `${progress}%`;
        });

        this._audioElement.addEventListener('play', () => {
            this._isPlaying = true;
            this._shadow.querySelector('.cover-container').classList.add('playing');
            this._audioContext.resume().then(() => this._animateVisualizer());
        });

        this._audioElement.addEventListener('pause', () => {
            this._isPlaying = false;
            this._shadow.querySelector('.cover-container').classList.remove('playing');
            if (this._animationFrameId) {
                cancelAnimationFrame(this._animationFrameId);
                this._animationFrameId = null;
            }
        });

        this._audioElement.addEventListener('ended', () => {
            this._playNextSong();
        });
    }

    _loadInitialSong() {
        if (this._playerData && this._playerData.songs && this._playerData.songs.length > 0) {
            const currentSong = this._playerData.songs[this._playerData.currentIndex];
            if (currentSong && currentSong.audioFile) {
                console.log("Initial song load:", currentSong.audioFile);
                this._loadSong(currentSong.audioFile);
            } else {
                console.warn("No valid audioFile for current song:", currentSong);
            }
        }
    }

    _loadSong(url) {
        if (this._audioElement) {
            console.log("Loading song:", url);
            this._audioElement.src = url;
            this._audioElement.load();
            this._audioElement.onerror = () => {
                console.error("Failed to load audio file:", url);
                alert("Error loading audio file. Please check the file URL.");
            };
        } else {
            console.warn("Audio element not initialized yet");
        }
    }

    _setupEventListeners() {
        const playBtn = this._shadow.querySelector('.play-btn');
        const prevBtn = this._shadow.querySelector('.prev-btn');
        const nextBtn = this._shadow.querySelector('.next-btn');
        const shuffleBtn = this._shadow.querySelector('.shuffle-btn');
        const repeatBtn = this._shadow.querySelector('.repeat-btn');
        const muteBtn = this._shadow.querySelector('.mute-btn');
        const volumeSlider = this._shadow.querySelector('.volume-slider');
        const progressBar = this._shadow.querySelector('.progress-bar');
        const buyNowBtn = this._shadow.querySelector('.buy-now-btn');
        const songItems = this._shadow.querySelectorAll('.song-item');
        const themeOptions = this._shadow.querySelectorAll('.theme-option');
        const shareButtons = this._shadow.querySelectorAll('.share-button');

        playBtn.addEventListener('click', () => this._togglePlay());
        prevBtn.addEventListener('click', () => this._playPreviousSong());
        nextBtn.addEventListener('click', () => this._playNextSong());
        shuffleBtn.addEventListener('click', () => this._toggleShuffle());
        repeatBtn.addEventListener('click', () => this._toggleRepeat());
        muteBtn.addEventListener('click', () => this._toggleMute());
        volumeSlider.addEventListener('input', (e) => this._setVolume(e.target.value));
        progressBar.addEventListener('click', (e) => this._seek(e));
        buyNowBtn.addEventListener('click', () => this._handleBuyNow());

        songItems.forEach((item, index) => {
            item.addEventListener('click', () => this._playSongAtIndex(index));
        });

        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                this._setTheme(theme);
            });
        });

        shareButtons.forEach(button => {
            button.addEventListener('click', () => {
                const platform = button.classList[1].split('-')[1];
                this._shareSong(platform);
            });
        });
    }

    _togglePlay() {
        if (!this._audioElement) return;
        if (this._isPlaying) {
            this._audioElement.pause();
            this._shadow.querySelector('.play-icon').style.display = 'block';
            this._shadow.querySelector('.pause-icon').style.display = 'none';
        } else {
            this._audioElement.play();
            this._shadow.querySelector('.play-icon').style.display = 'none';
            this._shadow.querySelector('.pause-icon').style.display = 'block';
        }
    }

    _playPreviousSong() {
        if (!this._playerData || !this._playerData.songs) return;
        this._playerData.currentIndex = (this._playerData.currentIndex - 1 + this._playerData.songs.length) % this._playerData.songs.length;
        this.render();
        this._loadSong(this._playerData.songs[this._playerData.currentIndex].audioFile);
        if (this._isPlaying) this._audioElement.play();
    }

    _playNextSong() {
        if (!this._playerData || !this._playerData.songs) return;
        this._playerData.currentIndex = (this._playerData.currentIndex + 1) % this._playerData.songs.length;
        this.render();
        this._loadSong(this._playerData.songs[this._playerData.currentIndex].audioFile);
        if (this._isPlaying) this._audioElement.play();
    }

    _playSongAtIndex(index) {
        if (!this._playerData || !this._playerData.songs || index >= this._playerData.songs.length) return;
        this._playerData.currentIndex = index;
        this.render();
        this._loadSong(this._playerData.songs[this._playerData.currentIndex].audioFile);
        if (this._isPlaying) this._audioElement.play();
    }

    _toggleShuffle() {
        // Implement shuffle logic if needed
        console.log("Shuffle toggled");
    }

    _toggleRepeat() {
        // Implement repeat logic if needed
        console.log("Repeat toggled");
    }

    _toggleMute() {
        if (!this._audioElement) return;
        this._audioElement.muted = !this._audioElement.muted;
        const volumeIcon = this._shadow.querySelector('.volume-icon');
        const muteIcon = this._shadow.querySelector('.mute-icon');
        if (this._audioElement.muted) {
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'block';
        } else {
            volumeIcon.style.display = 'block';
            muteIcon.style.display = 'none';
        }
    }

    _setVolume(value) {
        if (!this._audioElement) return;
        this._audioElement.volume = value;
        this._currentVolume = value;
        if (value > 0) {
            this._audioElement.muted = false;
            this._shadow.querySelector('.volume-icon').style.display = 'block';
            this._shadow.querySelector('.mute-icon').style.display = 'none';
        }
    }

    _seek(e) {
        if (!this._audioElement || !this._audioElement.duration) return;
        const rect = e.target.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const progress = offsetX / rect.width;
        this._audioElement.currentTime = progress * this._audioElement.duration;
    }

    _handleBuyNow() {
        if (this._playerData && this._playerData.songs[this._playerData.currentIndex].purchaseLink) {
            window.open(this._playerData.songs[this._playerData.currentIndex].purchaseLink, '_blank');
        }
    }

    _shareSong(platform) {
        if (!this._playerData || !this._playerData.songs[this._playerData.currentIndex]) return;
        const shareUrl = this._playerData.songs[this._playerData.currentIndex].shareUrl;
        const title = `${this._playerData.songs[this._playerData.currentIndex].title} by ${this._playerData.songs[this._playerData.currentIndex].artist}`;
        let url = '';

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + shareUrl)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check out this song: ' + shareUrl)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'));
                return;
        }
        if (url) window.open(url, '_blank');
    }

    _setTheme(theme) {
        this.className = '';
        if (theme && theme !== 'default') {
            this.classList.add(`theme-${theme}`);
        }
        this._shadow.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.getAttribute('data-theme') === theme || (theme === 'default' && opt.classList.contains('theme-epic'))) {
                opt.classList.add('active');
            }
        });
    }

    _formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    _animateVisualizer() {
        if (!this._isPlaying || !this._analyser) return;

        this._analyser.getByteFrequencyData(this._dataArray);
        this._canvasCtx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        const barWidth = (this._canvas.width / this._dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < this._dataArray.length; i++) {
            const barHeight = (this._dataArray[i] / 255) * this._canvas.height;
            const gradient = this._canvasCtx.createLinearGradient(0, this._canvas.height - barHeight, 0, this._canvas.height);
            gradient.addColorStop(0, getComputedStyle(this).getPropertyValue('--visualizer-color-start'));
            gradient.addColorStop(1, getComputedStyle(this).getPropertyValue('--visualizer-color-end'));

            this._canvasCtx.fillStyle = gradient;
            this._canvasCtx.fillRect(x, this._canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth + 1;
        }

        this._animationFrameId = requestAnimationFrame(() => this._animateVisualizer());
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

        console.log("Rendering song:", song);

        this._shadow.querySelector('.title').textContent = song.title;
        this._shadow.querySelector('.artist').textContent = song.artist;
        this._shadow.querySelector('.album').textContent = song.album;
        this._shadow.querySelector('.album-cover').src = song.coverImage || 'https://via.placeholder.com/300';
        this._shadow.querySelector('.buy-now-btn').style.display = song.purchaseLink ? 'block' : 'none';

        const serviceLinks = this._shadow.querySelector('.service-links');
        serviceLinks.innerHTML = '';
        Object.entries(song.streamingLinks).forEach(([service, url]) => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = `service-link service-${service.toLowerCase()}`;
            link.innerHTML = this._getServiceIcon(service) + `<span>${service}</span>`;
            serviceLinks.appendChild(link);
        });

        const artistSocialLinks = this._shadow.querySelector('.artist-social-links');
        artistSocialLinks.innerHTML = '';
        Object.entries(song.artistSocial).forEach(([platform, url]) => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = `artist-social-link artist-${platform.toLowerCase()}`;
            link.innerHTML = this._getSocialIcon(platform);
            artistSocialLinks.appendChild(link);
        });

        const songNavigation = this._shadow.querySelector('.song-navigation');
        songNavigation.innerHTML = '';
        songs.forEach((s, idx) => {
            const item = document.createElement('div');
            item.className = `song-item ${idx === currentIndex ? 'active' : ''}`;
            item.innerHTML = `
                <div class="song-item-info">
                    <div class="song-item-title">${s.title}</div>
                    <div class="song-item-artist">${s.artist}</div>
                </div>
            `;
            item.addEventListener('click', () => this._playSongAtIndex(idx));
            songNavigation.appendChild(item);
        });

        this._setupEventListeners();
    }

    _getServiceIcon(service) {
        const icons = {
            Spotify: '<svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
            YouTube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            SoundCloud: '<svg viewBox="0 0 24 24"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.105.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.093-.09-.093m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.075.075.135.15.135.074 0 .135-.06.15-.135l.225-2.55-.225-2.623c0-.06-.06-.135-.135-.135l-.031-.017zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444.033.015zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.225-.225-.225m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456-.016.015zm.749-.134c-.135 0-.255.119-.255.254l-.15 5.322.15 2.473c0 .15.12.255.255.255s.255-.105.255-.255l.15-2.473-.15-5.307c0-.148-.12-.254-.271-.254l.016-.015zm.749-.15c-.15 0-.285.135-.285.285L9.7 14.77l.135 2.458c0 .149.135.27.285.27s.27-.12.27-.27l.15-2.458-.15-5.03c0-.15-.135-.27-.285-.27m1.005.166c-.164 0-.284.135-.284.285l-.121 4.695.121 2.428c0 .15.12.285.284.285.15 0 .285-.135.285-.285l.135-2.428-.135-4.695c0-.165-.135-.285-.284-.285m.75-.045c-.165 0-.3.135-.3.3l-.105 4.725.105 2.4c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.12-2.4-.12-4.725c-.014-.164-.149-.3-.3-.3m.884-.05c-.194 0-.315.135-.315.345l-.09 4.78.09 2.4c0 .164.136.314.315.314.165 0 .314-.15.314-.314l.091-2.4-.091-4.78c0-.194-.164-.345-.314-.345m.914-.095c-.196 0-.346.149-.346.345L14.6 14.725l.076 2.383c0 .209.15.36.345.36.21 0 .36-.165.36-.36l.09-2.403-.09-4.702c0-.209-.165-.36-.36-.36m1.035-.074c-.21 0-.376.18-.376.375l-.075 4.46.075 2.374c0 .194.166.374.376.374.195 0 .375-.18.375-.374l.074-2.374-.074-4.46c0-.21-.18-.376-.375-.376m1.05-.595c-.061 0-.105.045-.105.09l-.061 5.297.06 2.335c0 .06.045.104.106.104.059 0 .104-.044.104-.104l.075-2.335-.074-5.327c0-.046-.045-.075-.105-.075m.509.137c-.075 0-.135.06-.135.135l-.045 5.172.045 2.321c0 .074.06.15.135.15.09 0 .149-.076.149-.15l.06-2.321-.06-5.172c0-.074-.06-.135-.149-.135l.015-.007zm.958.137c-.103 0-.164.08-.164.165l-.046 5.041.047 2.335c0 .105.074.18.164.18.105 0 .18-.075.18-.18l.052-2.335-.052-5.04c0-.09-.075-.166-.179-.166m.904-.061c-.12 0-.194.09-.194.18l-.029 5.017.029 2.329c0 .104.074.18.194.18.109 0 .18-.075.193-.18l.052-2.329-.044-5.033c0-.09-.089-.165-.193-.165l-.008.001zm1.214.196c-.09 0-.18.08-.18.18l-.044 4.856.045 2.321c0 .104.09.18.18.18.104 0 .18-.076.189-.18l.029-2.321-.029-4.871c0-.107-.088-.178-.19-.165zm1.169.815c0-.09-.082-.165-.18-.165-.089 0-.164.075-.171.164l-.045 4.071.046 2.336c0 .09.075.164.18.164.094 0 .179-.074.18-.164l.044-2.336-.053-4.07zm1.349-.627c-.119 0-.209.084-.209.203l-.044 4.5.044 2.307c0 .119.105.209.209.209.104 0 .179-.09.194-.209l.052-2.307-.052-4.5c0-.12-.09-.204-.194-.204l.001.001zm.825-.209c-.135 0-.219.09-.224.224l-.046 4.513.046 2.294c.005.134.089.224.225.224.119 0 .224-.09.229-.224l.044-2.294-.044-4.513c0-.134-.109-.225-.229-.225m.875-.118c-.149 0-.23.105-.234.233l-.044 4.605.044 2.257c0 .133.09.239.234.239.136 0 .24-.105.244-.24l.046-2.255-.044-4.606c-.009-.134-.113-.237-.245-.233h-.001zm.988.008c-.146 0-.255.105-.255.254l-.029 4.597.029 2.254c0 .15.109.254.255.254.149 0 .254-.104.259-.254l.03-2.254-.03-4.596c-.005-.16-.114-.255-.259-.255m1.004.385c-.03-.12-.135-.215-.255-.215-.135 0-.245.9-.255"/></svg>',
            Apple: '<svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .79-3.31.81-1.35-.03-2.23-1.26-3.06-2.47.01-.01.02-.03.04-.05C5 18.05 7.07 14.92 7.07 11.99c0-2.76-1.8-4.22-3.47-4.22-1.04 0-2.07.54-2.93 1.48C.22 9.99 0 10.97 0 11.99c0 3.94 2.42 7.42 6.05 9.98.81.58 1.73.99 2.77.99h.03c1.53 0 2.47-.81 3.99-.81s2.45.81 3.99.81h.03c1.04 0 1.96-.41 2.77-.99 1.63-1.16 2.93-2.92 3.66-5.02-.11-.03-3.39-1.24-3.44-4.92 0-3.13 2.49-4.79 2.5-4.81-.02-.03-.24-.41-.62-.87-.87-1.07-2.14-1.62-3.42-1.62-1.52 0-2.93.81-3.81 2.05-.87-1.24-2.28-2.05-3.81-2.05-2.47 0-4.45 1.99-4.45 4.45 0 1.36.58 3.05 1.55 4.45zm-3.06-12.49c0-1.24-.99-2.23-2.23-2.23-1.24 0-2.23.99-2.23 2.23 0 1.24.99 2.23 2.23 2.23 1.24 0 2.23-.99 2.23-2.23z"/></svg>'
        };
        return icons[service] || '';
    }

    _getSocialIcon(platform) {
        const icons = {
            Facebook: '<svg viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.84-.98 8.56-4.98 8.56-9.95z"/></svg>',
            Twitter: '<svg viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38c-.83.5-1.75.85-2.72 1.05A4.28 4.28 0 0 0 15.5 4c-2.36 0-4.28 1.92-4.28 4.29 0 .34.04.67.11 1-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07c.54 1.69 2.11 2.92 3.96 2.96A8.58 8.58 0 0 1 2 19.54a12.14 12.14 0 0 0 6.58 1.93c7.9 0 12.22-6.54 12.22-12.21 0-.19 0-.37-.01-.56A8.7 8.7 0 0 0 22.46 6z"/></svg>',
            Instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.27.06 2.14.26 2.9.56.78.31 1.44.72 2.1 1.38s1.07 1.32 1.38 2.1c.3.76.5 1.63.56 2.9.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.27-.26 2.14-.56 2.9-.31.78-.72 1.44-1.38 2.1s-1.32 1.07-2.1 1.38c-.76.3-1.63.5-2.9.56-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.27-.06-2.14-.26-2.9-.56-.78-.31-1.44-.72-2.1-1.38S2.7 19.9 2.4 19.12c-.3-.76-.5-1.63-.56-2.9C2.01 15.74 2 15.36 2 12.16s.01-3.58.07-4.85c.06-1.27.26-2.14.56-2.9.31-.78.72-1.44 1.38-2.1S5.38 2.7 6.16 2.4c.76-.3 1.63-.5 2.9-.56C10.42 2.01 10.8 2 12 2.16m0 2.24c-3.12 0-3.5.01-4.73.07-1.23.06-2.06.25-2.8.53-.73.28-1.35.66-1.97 1.28S3.47 7.6 3.2 8.33c-.28.74-.47 1.57-.53 2.8-.06 1.23-.07 1.61-.07 4.73s.01 3.5.07 4.73c.06 1.23.25 2.06.53 2.8.28.73.66 1.35 1.28 1.97s1.24 1 1.97 1.28c.74.28 1.57.47 2.8.53 1.23.06 1.61.07 4.73.07s3.5-.01 4.73-.07c1.23-.06 2.06-.25 2.8-.53.73-.28 1.35-.66 1.97-1.28s1-1.24 1.28-1.97c.28-.74.47-1.57.53-2.8.06-1.23.07-1.61.07-4.73s-.01-3.5-.07-4.73c-.06-1.23-.25-2.06-.53-2.8-.28-.73-.66-1.35-1.28-1.97s-1.24-1-1.97-1.28c-.74-.28-1.57-.47-2.8-.53-1.23-.06-1.61-.07-4.73-.07zm0 2.45a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm5.65-9.65a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6z"/></svg>',
            YouTube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            TikTok: '<svg viewBox="0 0 24 24"><path d="M12.53.02C13.84 0 15.14.01 16.44.01c1.3 0 2.61.01 3.91.04.78.02 1.56.1 2.33.25.77.15 1.5.41 2.17.78.67.37 1.25.87 1.72 1.45.47.58.84 1.23 1.06 1.92.22.69.33 1.41.33 2.14v.01c0 1.3-.01 2.61-.04 3.91-.02.78-.1 1.56-.25 2.33-.15.77-.41 1.5-.78 2.17-.37.67-.87 1.25-1.45 1.72-.58.47-1.23.84-1.92 1.06-.69.22-1.41.33-2.14.33h-.01c-1.3 0-2.61-.01-3.91-.04-.78-.02-1.56-.1-2.33-.25-.77-.15-1.5-.41-2.17-.78-.67-.37-1.25-.87-1.72-1.45-.47-.58-.84-1.23-1.06-1.92-.22-.69-.33-1.41-.33-2.14v-.01c0-1.3.01-2.61.04-3.91.02-.78.1-1.56.25-2.33.15-.77.41-1.5.78-2.17.37-.67.87-1.25 1.45-1.72.58-.47 1.23-.84 1.92-1.06.69-.22 1.41-.33 2.14-.33h.01zM12 5.84c-.72 0-1.43.11-2.11.33-.68.22-1.3.55-1.83 1-.53.45-.96 1-.27 1.65.27.26.62.45 1 .57v-3.6c-.38-.12-.73-.31-1-.57-.69-.65-.26-1.2.27-1.65.53-.45 1.15-.78 1.83-1 .68-.22 1.39-.33 2.11-.33V5.84zM9.89 18.6c1.07-.02 2.11-.34 2.97-.96.86-.62 1.52-1.49 1.9-2.54.38-1.05.45-2.19.2-3.27-.25-1.08-.85-2.06-1.7-2.81-.85-.75-1.89-1.27-3-1.48v7.06c-.38.12-.73.31-1 .57-.69.65-.26 1.2.27 1.65.53.45 1.15.78 1.83 1 .27.09.55.15.83.19-.27-.04-.55-.1-.83-.19z"/></svg>',
            Website: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
        };
        return icons[platform] || '';
    }
}

customElements.define('enhanced-music-player', EnhancedMusicPlayer);
