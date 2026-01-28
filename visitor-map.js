class VisitorMapElement extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._map = null;
        this._markers = [];
        this._markerLayer = null;
        this._mapData = null;
        this._tileLayer = 'osm'; // Default tile provider
        
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                /* Import Leaflet CSS from CDN */
                @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
                
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                
                .map-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }
                
                #map {
                    width: 100%;
                    height: 100%;
                    z-index: 0;
                }
                
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    color: white;
                    z-index: 1000;
                    transition: opacity 0.3s ease;
                }
                
                .loading-overlay.hidden {
                    opacity: 0;
                    pointer-events: none;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .loading-text {
                    margin-top: 20px;
                    font-size: 16px;
                    font-weight: 500;
                }
                
                .stats-panel {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    min-width: 200px;
                }
                
                .stats-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a202c;
                    margin: 0 0 15px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .stats-title svg {
                    width: 24px;
                    height: 24px;
                    fill: #667eea;
                }
                
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .stat-item:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }
                
                .stat-label {
                    font-size: 14px;
                    color: #718096;
                    font-weight: 500;
                }
                
                .stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #667eea;
                }
                
                .controls-panel {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 1000;
                }
                
                .control-btn {
                    background: white;
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }
                
                .control-btn:hover {
                    background: #f7fafc;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                }
                
                .control-btn:active {
                    transform: translateY(0);
                }
                
                .control-btn svg {
                    width: 20px;
                    height: 20px;
                    fill: #4a5568;
                }
                
                .legend-panel {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .legend-marker {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                
                .legend-marker.recent {
                    background: #48bb78;
                }
                
                .legend-marker.old {
                    background: #667eea;
                }
                
                .legend-label {
                    font-size: 13px;
                    color: #4a5568;
                    font-weight: 500;
                }
                
                /* Leaflet Popup Custom Styles */
                .leaflet-popup-content-wrapper {
                    border-radius: 8px;
                    padding: 0;
                    overflow: hidden;
                }
                
                .leaflet-popup-content {
                    margin: 0;
                    max-width: 300px;
                }
                
                .custom-popup {
                    font-family: 'Inter', sans-serif;
                }
                
                .popup-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                }
                
                .popup-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0 0 5px 0;
                }
                
                .popup-subtitle {
                    font-size: 13px;
                    opacity: 0.9;
                    margin: 0;
                }
                
                .popup-body {
                    padding: 15px;
                }
                
                .popup-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                    font-size: 14px;
                    color: #4a5568;
                }
                
                .popup-row:last-child {
                    margin-bottom: 0;
                }
                
                .popup-icon {
                    width: 16px;
                    height: 16px;
                    fill: #667eea;
                    flex-shrink: 0;
                }
                
                .popup-text {
                    flex: 1;
                }
                
                .popup-label {
                    font-weight: 600;
                    color: #2d3748;
                }
                
                /* Map attribution styling */
                .leaflet-control-attribution {
                    font-size: 10px;
                    background: rgba(255, 255, 255, 0.8) !important;
                }
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .stats-panel {
                        top: 10px;
                        left: 10px;
                        padding: 15px;
                        min-width: 150px;
                    }
                    
                    .stats-title {
                        font-size: 16px;
                    }
                    
                    .stat-value {
                        font-size: 18px;
                    }
                    
                    .controls-panel {
                        top: 10px;
                        right: 10px;
                    }
                    
                    .legend-panel {
                        bottom: 10px;
                        left: 10px;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                }
            </style>
            
            <div class="map-container">
                <div class="loading-overlay">
                    <div class="spinner"></div>
                    <div class="loading-text">Loading Map...</div>
                </div>
                
                <div id="map"></div>
                
                <div class="stats-panel">
                    <div class="stats-title">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Visitor Stats
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Visitors</span>
                        <span class="stat-value" id="totalVisitors">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Countries</span>
                        <span class="stat-value" id="totalCountries">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Last 24h</span>
                        <span class="stat-value" id="recentVisitors">0</span>
                    </div>
                </div>
                
                <div class="controls-panel">
                    <button class="control-btn" id="zoomInBtn" title="Zoom In">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                    <button class="control-btn" id="zoomOutBtn" title="Zoom Out">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 13H5v-2h14v2z"/>
                        </svg>
                    </button>
                    <button class="control-btn" id="resetBtn" title="Reset View">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        </svg>
                    </button>
                    <button class="control-btn" id="layerBtn" title="Change Map Style">
                        <svg viewBox="0 0 24 24">
                            <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="legend-panel">
                    <div class="legend-item">
                        <div class="legend-marker recent"></div>
                        <span class="legend-label">Last 24 hours</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-marker old"></div>
                        <span class="legend-label">Older visits</span>
                    </div>
                </div>
            </div>
        `;
        
        this._shadow.appendChild(this._root);
    }
    
    static get observedAttributes() {
        return ['map-data', 'tile-layer', 'zoom-level'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) return;
        
        if (name === 'map-data' && newValue) {
            try {
                this._mapData = JSON.parse(newValue);
                if (this._map) {
                    this._updateMap();
                }
            } catch (e) {
                console.error('Error parsing map data:', e);
            }
        } else if (name === 'tile-layer' && newValue) {
            this._tileLayer = newValue;
            if (this._map) {
                this._changeTileLayer(newValue);
            }
        } else if (name === 'zoom-level' && newValue) {
            this._zoomLevel = parseInt(newValue) || 2;
        }
    }
    
    connectedCallback() {
        this._tileLayer = this.getAttribute('tile-layer') || 'osm';
        this._zoomLevel = parseInt(this.getAttribute('zoom-level')) || 2;
        
        this._loadLeafletScript().then(() => {
            this._initializeMap();
            this._setupEventListeners();
        });
    }
    
    disconnectedCallback() {
        if (this._map) {
            this._map.remove();
        }
    }
    
    _loadLeafletScript() {
        return new Promise((resolve, reject) => {
            // Check if Leaflet is already loaded
            if (window.L) {
                resolve();
                return;
            }
            
            // Load Leaflet script from CDN
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.async = true;
            script.defer = true;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            
            document.head.appendChild(script);
        });
    }
    
    _initializeMap() {
        const mapElement = this._shadow.getElementById('map');
        
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }
        
        // Initialize Leaflet map
        this._map = L.map(mapElement, {
            center: [20, 0],
            zoom: this._zoomLevel,
            zoomControl: false, // We have custom controls
            attributionControl: true
        });
        
        // Add tile layer
        this._addTileLayer(this._tileLayer);
        
        // Create marker layer
        this._markerLayer = L.layerGroup().addTo(this._map);
        
        // Hide loading overlay
        const loadingOverlay = this._shadow.querySelector('.loading-overlay');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 500);
        }
        
        // Update map if data is already available
        if (this._mapData) {
            this._updateMap();
        }
    }
    
    _addTileLayer(layerType) {
        // Remove existing tile layer if any
        if (this._currentTileLayer) {
            this._map.removeLayer(this._currentTileLayer);
        }
        
        // Different free tile providers
        const tileLayers = {
            // OpenStreetMap - Classic and reliable
            osm: {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            },
            
            // CartoDB Positron - Light and clean
            positron: {
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap © CartoDB',
                maxZoom: 19
            },
            
            // CartoDB Dark Matter - Dark theme
            dark: {
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap © CartoDB',
                maxZoom: 19
            },
            
            // CartoDB Voyager - Colorful
            voyager: {
                url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap © CartoDB',
                maxZoom: 19
            },
            
            // Stamen Terrain - Topographic
            terrain: {
                url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
                attribution: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap',
                maxZoom: 18
            },
            
            // Stamen Toner - High contrast B&W
            toner: {
                url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
                attribution: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap',
                maxZoom: 18
            },
            
            // Esri World Street Map
            esri: {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                attribution: 'Tiles © Esri',
                maxZoom: 19
            },
            
            // Esri World Imagery - Satellite
            satellite: {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: 'Tiles © Esri',
                maxZoom: 19
            }
        };
        
        const layer = tileLayers[layerType] || tileLayers.osm;
        
        this._currentTileLayer = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            maxZoom: layer.maxZoom,
            subdomains: ['a', 'b', 'c']
        }).addTo(this._map);
    }
    
    _changeTileLayer(layerType) {
        this._addTileLayer(layerType);
    }
    
    _setupEventListeners() {
        // Zoom controls
        const zoomInBtn = this._shadow.getElementById('zoomInBtn');
        const zoomOutBtn = this._shadow.getElementById('zoomOutBtn');
        const resetBtn = this._shadow.getElementById('resetBtn');
        const layerBtn = this._shadow.getElementById('layerBtn');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this._map.zoomIn();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this._map.zoomOut();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this._fitMapToMarkers();
            });
        }
        
        if (layerBtn) {
            layerBtn.addEventListener('click', () => {
                this._cycleMapStyle();
            });
        }
    }
    
    _cycleMapStyle() {
        const styles = ['osm', 'positron', 'dark', 'voyager', 'terrain', 'satellite'];
        const currentIndex = styles.indexOf(this._tileLayer);
        const nextIndex = (currentIndex + 1) % styles.length;
        this._tileLayer = styles[nextIndex];
        this._changeTileLayer(this._tileLayer);
    }
    
    _updateMap() {
        if (!this._map || !this._mapData || !this._mapData.locations) {
            console.warn('Map or map data not ready');
            return;
        }
        
        // Clear existing markers
        this._clearMarkers();
        
        const locations = this._mapData.locations;
        
        if (locations.length === 0) {
            console.warn('No locations to display');
            return;
        }
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        let recentCount = 0;
        const countries = new Set();
        const bounds = [];
        
        // Create markers for each location
        locations.forEach((location, index) => {
            if (!location.latitude || !location.longitude) {
                console.warn('Invalid location data:', location);
                return;
            }
            
            const lat = parseFloat(location.latitude);
            const lng = parseFloat(location.longitude);
            
            // Determine if this is a recent visit
            const visitDate = location.timestamp ? new Date(location.timestamp) : null;
            const isRecent = visitDate && visitDate > oneDayAgo;
            
            if (isRecent) recentCount++;
            if (location.country && location.country !== 'Unknown Country') {
                countries.add(location.country);
            }
            
            // Create custom icon
            const iconHtml = `
                <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28s12-19 12-28c0-6.627-5.373-12-12-12z" 
                          fill="${isRecent ? '#48bb78' : '#667eea'}" 
                          stroke="white" 
                          stroke-width="2"/>
                    <circle cx="16" cy="12" r="5" fill="white"/>
                </svg>
            `;
            
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [32, 40],
                iconAnchor: [16, 40],
                popupAnchor: [0, -40]
            });
            
            // Create marker
            const marker = L.marker([lat, lng], { icon: customIcon });
            
            // Create popup content
            const popupContent = this._createPopupContent(location, isRecent);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            });
            
            // Add to marker layer
            marker.addTo(this._markerLayer);
            this._markers.push(marker);
            bounds.push([lat, lng]);
        });
        
        // Update statistics
        this._updateStats(locations.length, countries.size, recentCount);
        
        // Fit map to show all markers
        if (bounds.length > 0) {
            this._map.fitBounds(bounds, { padding: [50, 50] });
            
            // Adjust zoom if only one location
            if (bounds.length === 1) {
                this._map.setZoom(10);
            }
        }
    }
    
    _createPopupContent(location, isRecent) {
        const visitDate = location.timestamp ? new Date(location.timestamp) : null;
        const dateStr = visitDate ? this._formatDate(visitDate) : 'Unknown';
        
        // Build location string
        const locationParts = [];
        if (location.city && location.city !== 'Unknown City') locationParts.push(location.city);
        if (location.state) locationParts.push(location.state);
        if (location.country && location.country !== 'Unknown Country') locationParts.push(location.country);
        const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';
        
        return `
            <div class="custom-popup">
                <div class="popup-header">
                    <div class="popup-title">${location.title || 'Visitor Location'}</div>
                    <div class="popup-subtitle">${isRecent ? '🟢 Recent Visit' : '📍 Previous Visit'}</div>
                </div>
                <div class="popup-body">
                    <div class="popup-row">
                        <svg class="popup-icon" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span class="popup-text">
                            <span class="popup-label">Location:</span> ${locationStr}
                        </span>
                    </div>
                    <div class="popup-row">
                        <svg class="popup-icon" viewBox="0 0 24 24">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        <span class="popup-text">
                            <span class="popup-label">Time:</span> ${dateStr}
                        </span>
                    </div>
                    <div class="popup-row">
                        <svg class="popup-icon" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span class="popup-text">
                            <span class="popup-label">Coordinates:</span> ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    _formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }
    
    _updateStats(total, countries, recent) {
        const totalElement = this._shadow.getElementById('totalVisitors');
        const countriesElement = this._shadow.getElementById('totalCountries');
        const recentElement = this._shadow.getElementById('recentVisitors');
        
        if (totalElement) totalElement.textContent = total;
        if (countriesElement) countriesElement.textContent = countries;
        if (recentElement) recentElement.textContent = recent;
    }
    
    _clearMarkers() {
        if (this._markerLayer) {
            this._markerLayer.clearLayers();
            this._markers = [];
        }
    }
    
    _fitMapToMarkers() {
        if (!this._markers || this._markers.length === 0) return;
        
        const bounds = this._markers.map(marker => marker.getLatLng());
        this._map.fitBounds(bounds, { padding: [50, 50] });
        
        if (this._markers.length === 1) {
            this._map.setZoom(10);
        }
    }
}

customElements.define('visitor-map-element', VisitorMapElement);
