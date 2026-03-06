/**
 * Music Player App Dashboard
 * Custom Web Component for managing song data in CMS
 * Collection: @v-blog/music-player-app/Songs
 */

class MusicPlayerDashboard extends HTMLElement {
    constructor() {
        super();
        // View states
        this._currentView = 'list';        // 'list' or 'editor'
        this._initialized = false;
        
        // Data storage
        this._songs = [];                  // All songs in collection
        this._editSong = null;             // Currently editing song
        
        // Song metadata
        this._meta = this._freshMeta();
        
        // UI state
        this._progressVisible = false;
        this._progressMessage = '';
        this._progressPercent = 0;
    }

    _freshMeta() {
        return {
            // Basic Info
            title: '',
            artist: '',
            album: '',
            genre: '',
            duration: '',
            
            // Media
            audioFile: '',
            coverImage: '',
            
            // Links - Music Platforms
            spotifyLink: '',
            appleMusicLink: '',
            soundcloudLink: '',
            shareUrl: '',
            buyPrice: '',
            
            // Artist Social Links
            artistFacebookLink: '',
            artistTwitterLink: '',
            artistInstagramLink: '',
            artistYouTubeLink: '',
            artistTikTokLink: '',
            artistWebsiteLink: '',
        };
    }

    static get observedAttributes() {
        return [
            'song-list', 
            'upload-result', 
            'save-result', 
            'delete-result', 
            'notification'
        ];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!newVal || newVal === oldVal) return;
        if (!this._initialized) return;
        
        try {
            const data = JSON.parse(newVal);
            
            if (name === 'song-list') this._onSongList(data);
            else if (name === 'upload-result') this._onUploadResult(data);
            else if (name === 'save-result') this._onSaveResult(data);
            else if (name === 'delete-result') this._onDeleteResult(data);
            else if (name === 'notification') this._toast(data.type, data.message);
        } catch(e) {
            console.error('Parse error:', e);
        }
    }

    connectedCallback() {
        if (this._initialized) return;
        
        requestAnimationFrame(() => {
            this._inject();
            this._wire();
            this._initialized = true;
            
            // Request initial data
            this._emit('load-song-list', {});
        });
    }

    disconnectedCallback() {
        // Cleanup if needed
    }

    // ===== ICON HELPER =====
    _icon(k) {
        const I = {
            plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
            edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
            back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
            image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
            link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        };
        return I[k] || I.edit;
    }

    // ===== STYLES =====
    _styles() {
        return `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

music-player-dashboard {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 720px;
    font-family: 'Poppins', sans-serif;
    --ink: #111;
    --ink2: #444;
    --ink3: #888;
    --paper: #fafaf8;
    --paper2: #f2f1ee;
    --paper3: #e8e6e1;
    --border: #ddd9d2;
    --accent: #1db954;
    --accent2: #1ed760;
    --red: #cf1322;
    --blue: #1677ff;
    --orange: #fa8c16;
    --r: 8px;
    --shadow-sm: 0 2px 8px rgba(0,0,0,.08);
    --shadow: 0 8px 32px rgba(0,0,0,.14);
    background: var(--paper);
    color: var(--ink);
}

music-player-dashboard .mpd-host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 720px;
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow);
}

/* Top Bar */
music-player-dashboard .mpd-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 20px;
    background: var(--ink);
    color: #fff;
    flex-shrink: 0;
    gap: 10px;
}

music-player-dashboard .mpd-brand {
    font-family: 'Poppins', sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -.5px;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
}

music-player-dashboard .mpd-brand svg {
    width: 20px;
    height: 20px;
    color: var(--accent2);
}

music-player-dashboard .mpd-top-acts {
    display: flex;
    gap: 8px;
    align-items: center;
}

/* Buttons */
music-player-dashboard .mpd-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 15px;
    border: none;
    border-radius: var(--r);
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, opacity .15s;
    white-space: nowrap;
}

music-player-dashboard .mpd-btn svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

music-player-dashboard .mpd-btn-ghost {
    background: rgba(255,255,255,.12);
    color: #fff;
    border: 1px solid rgba(255,255,255,.2);
}

music-player-dashboard .mpd-btn-ghost:hover {
    background: rgba(255,255,255,.22);
}

music-player-dashboard .mpd-btn-accent {
    background: var(--accent);
    color: #fff;
}

music-player-dashboard .mpd-btn-accent:hover {
    background: var(--accent2);
}

music-player-dashboard .mpd-btn-light {
    background: var(--paper2);
    color: var(--ink2);
    border: 1px solid var(--border);
}

music-player-dashboard .mpd-btn-light:hover {
    background: var(--paper3);
}

music-player-dashboard .mpd-btn-red {
    background: #fff2f0;
    color: #a8071a;
    border: 1px solid #ffccc7;
}

music-player-dashboard .mpd-btn-red:hover {
    background: #ffccc7;
}

music-player-dashboard .mpd-btn-sm {
    padding: 5px 10px;
    font-size: 12px;
}

music-player-dashboard .mpd-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
    pointer-events: none;
}

/* Progress Overlay */
music-player-dashboard .mpd-progress-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,.45);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s;
}

music-player-dashboard .mpd-progress-overlay.active {
    opacity: 1;
    pointer-events: all;
}

music-player-dashboard .mpd-progress-card {
    background: #fff;
    border-radius: 12px;
    padding: 28px 36px;
    min-width: 340px;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
    text-align: center;
}

music-player-dashboard .mpd-progress-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--ink);
}

music-player-dashboard .mpd-progress-subtitle {
    font-size: 13px;
    color: var(--ink3);
    margin-bottom: 18px;
}

music-player-dashboard .mpd-progress-track {
    width: 100%;
    height: 8px;
    background: var(--paper3);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
}

music-player-dashboard .mpd-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 4px;
    transition: width .3s ease;
    width: 0%;
}

music-player-dashboard .mpd-progress-percent {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
}

/* List View */
music-player-dashboard .mpd-list-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

music-player-dashboard .mpd-list-view.hidden {
    display: none;
}

music-player-dashboard .mpd-list-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 22px;
    border-bottom: 1px solid var(--border);
    background: var(--paper);
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 10px;
}

music-player-dashboard .mpd-list-heading {
    font-size: 16px;
    font-weight: 700;
}

music-player-dashboard .mpd-list-count {
    font-size: 13px;
    color: var(--ink3);
    margin-left: 6px;
}

music-player-dashboard .mpd-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    min-height: 0;
}

music-player-dashboard .mpd-list-scroll::-webkit-scrollbar {
    width: 5px;
}

music-player-dashboard .mpd-list-scroll::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}

music-player-dashboard .mpd-state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 14px;
    color: var(--ink3);
    text-align: center;
}

music-player-dashboard .mpd-state-box svg {
    width: 44px;
    height: 44px;
    opacity: .35;
}

music-player-dashboard .mpd-state-box p {
    font-size: 15px;
}

/* Songs Table */
music-player-dashboard .mpd-songs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

music-player-dashboard .mpd-songs-table th {
    text-align: left;
    padding: 9px 13px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--ink3);
    border-bottom: 2px solid var(--border);
    background: var(--paper2);
}

music-player-dashboard .mpd-songs-table td {
    padding: 11px 13px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
}

music-player-dashboard .mpd-songs-table tr:hover td {
    background: #f9f7f2;
}

music-player-dashboard .mpd-col-title {
    font-weight: 600;
    max-width: 200px;
}

music-player-dashboard .mpd-song-title {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

music-player-dashboard .mpd-song-artist {
    font-size: 11px;
    color: var(--ink3);
    margin-top: 2px;
}

music-player-dashboard .mpd-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .4px;
    background: #d1fae5;
    color: #065f46;
}

music-player-dashboard .mpd-row-actions {
    display: flex;
    gap: 6px;
}

/* Editor View */
music-player-dashboard .mpd-editor-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

music-player-dashboard .mpd-editor-view.hidden {
    display: none;
}

music-player-dashboard .mpd-editor-bar {
    display: flex;
    align-items: center;
    height: 45px;
    padding: 0 14px;
    background: var(--paper2);
    border-bottom: 2px solid var(--border);
    gap: 3px;
    flex-shrink: 0;
}

music-player-dashboard .mpd-editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

music-player-dashboard .mpd-editor-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

music-player-dashboard .mpd-editor-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    min-height: 0;
}

music-player-dashboard .mpd-editor-scroll::-webkit-scrollbar {
    width: 5px;
}

music-player-dashboard .mpd-editor-scroll::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}

music-player-dashboard .mpd-section {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 20px;
    margin-bottom: 16px;
}

music-player-dashboard .mpd-section-title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 14px;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--ink);
}

music-player-dashboard .mpd-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

music-player-dashboard .mpd-fields.full {
    grid-template-columns: 1fr;
}

music-player-dashboard .mpd-field {
    display: flex;
    flex-direction: column;
}

music-player-dashboard .mpd-field label {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink3);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: .5px;
}

music-player-dashboard .mpd-field input,
music-player-dashboard .mpd-field textarea,
music-player-dashboard .mpd-field select {
    padding: 10px 12px;
    border: 1.5px solid var(--border);
    border-radius: 5px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    background: var(--paper);
    color: var(--ink);
    outline: none;
    transition: border-color .15s;
}

music-player-dashboard .mpd-field input:focus,
music-player-dashboard .mpd-field textarea:focus,
music-player-dashboard .mpd-field select:focus {
    border-color: var(--accent);
}

music-player-dashboard .mpd-field textarea {
    resize: vertical;
    min-height: 70px;
}

/* Image Upload Zone */
music-player-dashboard .mpd-img-zone {
    border: 2px dashed var(--border);
    border-radius: var(--r);
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all .2s;
    background: var(--paper2);
    margin-bottom: 12px;
}

music-player-dashboard .mpd-img-zone:hover {
    border-color: var(--accent);
    background: #f9f5f0;
}

music-player-dashboard .mpd-img-zone svg {
    width: 28px;
    height: 28px;
    color: var(--ink3);
    margin-bottom: 6px;
}

music-player-dashboard .mpd-img-zone p {
    font-size: 12px;
    color: var(--ink3);
    margin: 0;
}

music-player-dashboard .mpd-img-zone input[type=file] {
    display: none;
}

music-player-dashboard .mpd-img-prev {
    max-width: 100%;
    max-height: 200px;
    border-radius: 5px;
    margin-top: 10px;
    object-fit: cover;
}

/* Inline Progress */
music-player-dashboard .mpd-inline-progress {
    display: none;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: var(--r);
    font-size: 12px;
    color: #614700;
    margin-top: 6px;
}

music-player-dashboard .mpd-inline-progress.active {
    display: flex;
}

music-player-dashboard .mpd-inline-progress-track {
    flex: 1;
    height: 5px;
    background: #fff3cd;
    border-radius: 3px;
    overflow: hidden;
}

music-player-dashboard .mpd-inline-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent2), #1db954);
    border-radius: 3px;
    transition: width .3s ease;
    width: 0%;
}

/* Toast Notifications */
music-player-dashboard .mpd-toasts {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 7px;
}

music-player-dashboard .mpd-toast {
    padding: 11px 16px;
    border-radius: var(--r);
    font-size: 13px;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
    animation: mpdToastIn .25s ease;
    max-width: 340px;
    font-family: 'Poppins', sans-serif;
}

@keyframes mpdToastIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

music-player-dashboard .mpd-toast-success {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #135200;
}

music-player-dashboard .mpd-toast-error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: #a8071a;
}

music-player-dashboard .mpd-toast-info {
    background: #e6f4ff;
    border: 1px solid #91caff;
    color: #003eb3;
}

/* Responsive */
@media (max-width: 900px) {
    music-player-dashboard .mpd-fields {
        grid-template-columns: 1fr;
    }
    
    music-player-dashboard .mpd-embed-dialog {
        min-width: 300px;
    }
}

@keyframes mpdSpin {
    to { transform: rotate(360deg); }
}

music-player-dashboard .mpd-spin-anim {
    animation: mpdSpin .7s linear infinite;
}
`;
    }

    // ===== HTML SHELL =====
    _shellHTML() {
        return `
<div class="mpd-host">
    <div class="mpd-top-bar">
        <div class="mpd-brand">
            ${this._icon('music')}
            <span>Music<strong>Manager</strong></span>
        </div>
        <div class="mpd-top-acts" id="topActs"></div>
    </div>

    <div class="mpd-list-view" id="listView">
        <div class="mpd-list-bar">
            <div>
                <span class="mpd-list-heading">Songs</span>
                <span class="mpd-list-count" id="listCount"></span>
            </div>
            <button class="mpd-btn mpd-btn-accent" id="newSongBtn">
                ${this._icon('plus')} Add Song
            </button>
        </div>
        <div class="mpd-list-scroll" id="listScroll">
            <div class="mpd-state-box" id="listLoading">
                <svg class="mpd-spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity=".2"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                <p>Loading songs…</p>
            </div>
            <div id="listContent" style="display:none"></div>
        </div>
    </div>

    <div class="mpd-editor-view hidden" id="editorView">
        <div class="mpd-editor-bar">
            <button class="mpd-btn mpd-btn-ghost" id="backBtn">
                ${this._icon('back')} All Songs
            </button>
            <div style="flex: 1;"></div>
            <button class="mpd-btn mpd-btn-light mpd-btn-sm" id="saveDraftBtn">
                ${this._icon('save')} Save
            </button>
            <button class="mpd-btn mpd-btn-accent" id="publishBtn">
                ${this._icon('check')} Save & Close
            </button>
        </div>

        <div class="mpd-editor-body">
            <div class="mpd-editor-main">
                <div class="mpd-editor-scroll" id="editorScroll">
                    <!-- Basic Info Section -->
                    <div class="mpd-section">
                        <div class="mpd-section-title">Basic Information</div>
                        <div class="mpd-fields">
                            <div class="mpd-field">
                                <label>Song Title *</label>
                                <input type="text" id="title" data-m="title" placeholder="Song title">
                            </div>
                            <div class="mpd-field">
                                <label>Artist *</label>
                                <input type="text" id="artist" data-m="artist" placeholder="Artist name">
                            </div>
                            <div class="mpd-field">
                                <label>Album</label>
                                <input type="text" id="album" data-m="album" placeholder="Album name">
                            </div>
                            <div class="mpd-field">
                                <label>Genre</label>
                                <input type="text" id="genre" data-m="genre" placeholder="Music genre">
                            </div>
                            <div class="mpd-field">
                                <label>Duration (MM:SS)</label>
                                <input type="text" id="duration" data-m="duration" placeholder="e.g., 3:45">
                            </div>
                            <div class="mpd-field">
                                <label>Buy Price</label>
                                <input type="text" id="buyPrice" data-m="buyPrice" placeholder="$9.99">
                            </div>
                        </div>
                    </div>

                    <!-- Media Section -->
                    <div class="mpd-section">
                        <div class="mpd-section-title">Media Files</div>
                        
                        <div class="mpd-field mpd-fields full">
                            <label>Cover Image</label>
                            <div class="mpd-img-zone" id="coverZone">
                                <input type="file" id="coverFile" accept="image/*">
                                ${this._icon('image')}
                                <p>Click or drag to upload cover art</p>
                                <img class="mpd-img-prev" id="coverPrev" style="display:none">
                            </div>
                            <div class="mpd-inline-progress" id="coverProgress">
                                <span id="coverProgressLabel">Uploading...</span>
                                <div class="mpd-inline-progress-track"><div class="mpd-inline-progress-fill" id="coverProgressFill"></div></div>
                            </div>
                        </div>

                        <div class="mpd-field mpd-fields full">
                            <label>Audio File URL</label>
                            <input type="url" id="audioFile" data-m="audioFile" placeholder="https://example.com/song.mp3">
                        </div>
                    </div>

                    <!-- Music Platform Links -->
                    <div class="mpd-section">
                        <div class="mpd-section-title">Music Platform Links</div>
                        <div class="mpd-fields">
                            <div class="mpd-field">
                                <label>Spotify Link</label>
                                <input type="url" id="spotifyLink" data-m="spotifyLink" placeholder="https://open.spotify.com/...">
                            </div>
                            <div class="mpd-field">
                                <label>Apple Music Link</label>
                                <input type="url" id="appleMusicLink" data-m="appleMusicLink" placeholder="https://music.apple.com/...">
                            </div>
                            <div class="mpd-field">
                                <label>SoundCloud Link</label>
                                <input type="url" id="soundcloudLink" data-m="soundcloudLink" placeholder="https://soundcloud.com/...">
                            </div>
                            <div class="mpd-field">
                                <label>Share URL</label>
                                <input type="url" id="shareUrl" data-m="shareUrl" placeholder="Public share link">
                            </div>
                        </div>
                    </div>

                    <!-- Artist Social Links -->
                    <div class="mpd-section">
                        <div class="mpd-section-title">Artist Social Links</div>
                        <div class="mpd-fields">
                            <div class="mpd-field">
                                <label>Facebook</label>
                                <input type="url" id="artistFacebookLink" data-m="artistFacebookLink" placeholder="https://facebook.com/...">
                            </div>
                            <div class="mpd-field">
                                <label>Twitter / X</label>
                                <input type="url" id="artistTwitterLink" data-m="artistTwitterLink" placeholder="https://twitter.com/...">
                            </div>
                            <div class="mpd-field">
                                <label>Instagram</label>
                                <input type="url" id="artistInstagramLink" data-m="artistInstagramLink" placeholder="https://instagram.com/...">
                            </div>
                            <div class="mpd-field">
                                <label>YouTube</label>
                                <input type="url" id="artistYouTubeLink" data-m="artistYouTubeLink" placeholder="https://youtube.com/@...">
                            </div>
                            <div class="mpd-field">
                                <label>TikTok</label>
                                <input type="url" id="artistTikTokLink" data-m="artistTikTokLink" placeholder="https://tiktok.com/@...">
                            </div>
                            <div class="mpd-field">
                                <label>Website</label>
                                <input type="url" id="artistWebsiteLink" data-m="artistWebsiteLink" placeholder="https://artistwebsite.com">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="mpd-progress-overlay" id="progressOverlay">
        <div class="mpd-progress-card">
            <div class="mpd-progress-title" id="progressTitle">Processing...</div>
            <div class="mpd-progress-subtitle" id="progressSubtitle">Please wait</div>
            <div class="mpd-progress-track">
                <div class="mpd-progress-fill" id="progressFill"></div>
            </div>
            <div class="mpd-progress-percent" id="progressPercent">0%</div>
        </div>
    </div>

    <div class="mpd-toasts" id="toastArea"></div>
</div>
`;
    }

    // ===== INJECT STYLES & HTML =====
    _inject() {
        // Add styles
        if (!document.getElementById('mpd-styles')) {
            const style = document.createElement('style');
            style.id = 'mpd-styles';
            style.textContent = this._styles();
            document.head.appendChild(style);
        }

        // Add HTML
        const container = document.createElement('div');
        container.className = 'mpd-host';
        container.innerHTML = this._shellHTML();
        
        this.innerHTML = '';
        this.appendChild(container);
    }

    // ===== EVENT WIRING =====
    _wire() {
        // New song button
        this.querySelector('#newSongBtn').addEventListener('click', () => this._openEditor(null));

        // Back button
        this.querySelector('#backBtn').addEventListener('click', () => this._showListView());

        // Save buttons
        this.querySelector('#saveDraftBtn').addEventListener('click', () => this._save());
        this.querySelector('#publishBtn').addEventListener('click', () => this._save(true));

        // Field binding
        this.querySelectorAll('[data-m]').forEach(el => {
            const evt = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(evt, () => {
                const key = el.dataset.m;
                if (el.type === 'checkbox') {
                    this._meta[key] = el.checked;
                } else {
                    this._meta[key] = el.value;
                }
            });
        });

        // Image upload
        this._wireImgZone('coverZone', 'coverFile', 'coverPrev', 'coverImage', 'coverProgress', 'coverProgressFill', 'coverProgressLabel');
    }

    _wireImgZone(zoneId, fileId, prevId, metaKey, progressId, progressFillId, progressLabelId) {
        const zone = this.querySelector(`#${zoneId}`);
        const file = this.querySelector(`#${fileId}`);
        const prev = this.querySelector(`#${prevId}`);
        
        if (!zone || !file) return;

        zone.addEventListener('click', () => file.click());

        file.addEventListener('change', async (e) => {
            const f = e.target.files[0];
            if (!f) return;

            // Show preview
            if (prev) {
                prev.src = URL.createObjectURL(f);
                prev.style.display = 'block';
            }

            const progressEl = this.querySelector(`#${progressId}`);
            const fillEl = this.querySelector(`#${progressFillId}`);
            const labelEl = this.querySelector(`#${progressLabelId}`);

            if (progressEl) progressEl.classList.add('active');
            if (labelEl) labelEl.textContent = 'Converting to WebP...';
            if (fillEl) fillEl.style.width = '20%';

            const webpData = await this._convertToWebP(f);
            const webpFilename = f.name.replace(/\.[^.]+$/, '.webp');

            if (fillEl) fillEl.style.width = '50%';
            if (labelEl) labelEl.textContent = 'Uploading...';

            this._pendingMetaProgress = { progressEl, fillEl, labelEl };

            this._emit('upload-image', {
                fileData: webpData,
                filename: webpFilename,
                metaKey,
                optimize: true
            });
        });
    }

    async _convertToWebP(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        const reader2 = new FileReader();
                        reader2.onloadend = () => {
                            resolve(reader2.result.split(',')[1]);
                        };
                        reader2.readAsDataURL(blob);
                    }, 'image/webp', 1.0);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ===== VIEW MANAGEMENT =====
    _showListView() {
        this.querySelector('#listView').classList.remove('hidden');
        this.querySelector('#editorView').classList.add('hidden');
        this.querySelector('#topActs').innerHTML = '';
        this._currentView = 'list';
        this._emit('load-song-list', {});
    }

    _showEditorView() {
        this.querySelector('#listView').classList.add('hidden');
        this.querySelector('#editorView').classList.remove('hidden');
        this._currentView = 'editor';
        const isNew = !this._editSong;
        
        this.querySelector('#topActs').innerHTML = `
            <span style="color:#fff;font-size:13px;">${isNew ? 'New Song' : 'Edit Song'}</span>
        `;
    }

    _openEditor(song) {
        this._editSong = song;
        this._resetEditorState();
        
        if (song) {
            this._populateEditor(song);
        }
        
        this._showEditorView();
    }

    _resetEditorState() {
        this._meta = this._freshMeta();
        
        // Reset UI
        this.querySelectorAll('[data-m]').forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });

        // Reset image
        const coverPrev = this.querySelector('#coverPrev');
        if (coverPrev) {
            coverPrev.src = '';
            coverPrev.style.display = 'none';
        }
    }

    _populateEditor(data) {
        if (!data) return;

        // Populate meta
        Object.keys(this._meta).forEach(key => {
            if (data[key] !== undefined) {
                this._meta[key] = data[key];
            }
        });

        // Update UI
        this.querySelectorAll('[data-m]').forEach(el => {
            const key = el.dataset.m;
            if (key in this._meta) {
                if (el.type === 'checkbox') {
                    el.checked = !!this._meta[key];
                } else {
                    el.value = this._meta[key] || '';
                }
            }
        });

        // Show cover image
        if (data.coverImage) {
            const prev = this.querySelector('#coverPrev');
            if (prev) {
                prev.src = data.coverImage;
                prev.style.display = 'block';
            }
        }
    }

    // ===== DATA OPERATIONS =====
    _save(closeAfter = false) {
        this._showProgress('Saving Song', 'Preparing data...');
        this._setProgress(30);

        setTimeout(() => {
            this._setProgress(60);
            this._setProgressSubtitle('Sending to server...');
        }, 300);

        this._emit('save-song', {
            ...this._meta,
            _id: this._editSong?._id || null,
            closeAfter
        });
    }

    // ===== DATA EVENTS =====
    _onSongList(data) {
        this.querySelector('#listLoading').style.display = 'none';
        const content = this.querySelector('#listContent');
        content.style.display = 'block';

        this._songs = data.songs || [];
        const total = data.totalCount || this._songs.length;
        this.querySelector('#listCount').textContent = `(${total})`;

        if (!this._songs.length) {
            content.innerHTML = `<div class="mpd-state-box">${this._icon('music')}<p>No songs yet. Click "Add Song" to start!</p></div>`;
            return;
        }

        content.innerHTML = `<table class="mpd-songs-table"><thead><tr><th>Title / Artist</th><th>Album</th><th>Genre</th><th>Duration</th><th>Actions</th></tr></thead><tbody id="songsBody"></tbody></table>`;

        const tbody = content.querySelector('#songsBody');
        this._songs.forEach((song, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="mpd-col-title">
                    <div class="mpd-song-title">${song.title || '(Untitled)'}</div>
                    <div class="mpd-song-artist">${song.artist || 'Unknown Artist'}</div>
                </td>
                <td>${song.album || '—'}</td>
                <td>${song.genre || '—'}</td>
                <td>${song.duration || '—'}</td>
                <td>
                    <div class="mpd-row-actions">
                        <button class="mpd-btn mpd-btn-light mpd-btn-sm edit-btn" data-i="${idx}">${this._icon('edit')} Edit</button>
                        <button class="mpd-btn mpd-btn-red mpd-btn-sm del-btn" data-i="${idx}">${this._icon('trash')} Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.i);
                this._openEditor(this._songs[idx]);
            });
        });

        tbody.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const song = this._songs[parseInt(btn.dataset.i)];
                if (confirm(`Delete "${song.title}" by ${song.artist}?\n\nThis cannot be undone.`)) {
                    this._emit('delete-song', { id: song._id });
                }
            });
        });
    }

    _onUploadResult(data) {
        if (data.metaKey && data.url) {
            this._meta[data.metaKey] = data.url;
            
            const prev = this.querySelector(`#${data.metaKey === 'coverImage' ? 'coverPrev' : 'coverPrev'}`);
            if (prev) {
                prev.src = data.url;
                prev.style.display = 'block';
            }

            if (this._pendingMetaProgress) {
                const { progressEl, fillEl, labelEl } = this._pendingMetaProgress;
                if (fillEl) fillEl.style.width = '100%';
                if (labelEl) labelEl.textContent = 'Upload complete!';
                setTimeout(() => {
                    if (progressEl) progressEl.classList.remove('active');
                    this._pendingMetaProgress = null;
                }, 1500);
            }

            this._toast('success', 'Image uploaded!');
        }
    }

    _onSaveResult(data) {
        if (data.success) {
            this._setProgress(100);
            this._setProgressSubtitle('Done!');
            setTimeout(() => {
                this._hideProgress();
                this._toast('success', data.message || 'Song saved!');
                if (!this._editSong && data.id) {
                    this._editSong = { _id: data.id };
                }
                if (data.closeAfter) {
                    this._showListView();
                    this._emit('load-song-list', {});
                }
            }, 500);
        } else {
            this._hideProgress();
            this._toast('error', data.message || 'Save failed.');
        }
    }

    _onDeleteResult(data) {
        if (data.success) {
            this._toast('success', 'Song deleted.');
            this._emit('load-song-list', {});
        } else {
            this._toast('error', 'Delete failed: ' + (data.message || ''));
        }
    }

    // ===== PROGRESS =====
    _showProgress(title, subtitle) {
        const overlay = this.querySelector('#progressOverlay');
        const titleEl = this.querySelector('#progressTitle');
        const subtitleEl = this.querySelector('#progressSubtitle');
        const fillEl = this.querySelector('#progressFill');
        const percentEl = this.querySelector('#progressPercent');

        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (fillEl) fillEl.style.width = '0%';
        if (percentEl) percentEl.textContent = '0%';
        if (overlay) overlay.classList.add('active');
    }

    _setProgress(percent) {
        const fillEl = this.querySelector('#progressFill');
        const percentEl = this.querySelector('#progressPercent');
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
    }

    _setProgressSubtitle(text) {
        const subtitleEl = this.querySelector('#progressSubtitle');
        if (subtitleEl) subtitleEl.textContent = text;
    }

    _hideProgress() {
        const overlay = this.querySelector('#progressOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    // ===== TOAST =====
    _toast(type, msg) {
        const area = this.querySelector('#toastArea');
        if (!area) return;

        const t = document.createElement('div');
        t.className = `mpd-toast mpd-toast-${type}`;
        t.textContent = msg;
        area.appendChild(t);

        setTimeout(() => t.remove(), 5000);
    }

    // ===== EMIT =====
    _emit(name, detail) {
        this.dispatchEvent(
            new CustomEvent(name, {
                detail,
                bubbles: true,
                composed: true
            })
        );
    }
}

customElements.define('music-player-dashboard', MusicPlayerDashboard);
