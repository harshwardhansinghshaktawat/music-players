class VisitorMapElement extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._map = null;
        this._markers = [];
        this._infoWindow = null;
        this._mapData = null;
        
        this._root = document.createElement('div');
        this._root.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    box-sizing: border-box;
                }
                
                *, *::before, *::after {
                    box-sizing: inherit;
                }
                
                .map-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    background: #e5e3df;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                #map {
                    width: 100%;
                    height: 100%;
                }
                
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
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
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-text {
                    margin-top: 1rem;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    color: #666;
                }
                
                .error-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 400px;
                    font-family: Arial, sans-serif;
                }
                
                .error-message h3 {
                    margin: 0 0 1rem 0;
                    color: #e74c3c;
                }
                
                .error-message p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }
                
                /* Info Window Styles */
                .info-window-content {
                    font-family: Arial, sans-serif;
                    padding: 8px;
                    max-width: 250px;
                }
                
                .info-window-title {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 8px;
                    color: #333;
                }
                
                .info-window-location {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: flex-start;
                }
                
                .info-window-location svg {
                    width: 16px;
                    height: 16px;
                    margin-right: 6px;
                    flex-shrink: 0;
                    fill: #4285f4;
                }
                
                .info-window-timestamp {
                    font-size: 12px;
                    color: #999;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #eee;
                }
                
                .info-window-coords {
                    font-size: 11px;
                    color: #999;
                    margin-top: 4px;
                    font-family: monospace;
                }
                
                /* Map Controls */
                .map-stats {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    font-family: Arial, sans-serif;
                    z-index: 100;
                }
                
                .map-stats-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 4px;
                }
                
                .map-stats-count {
                    font-size: 24px;
                    font-weight: 700;
                    color: #4285f4;
                }
                
                .map-stats-label {
                    font-size: 12px;
                    color: #666;
                }
                
                .zoom-controls {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    z-index: 100;
                }
                
                .zoom-btn {
                    width: 40px;
                    height: 40px;
                    background: white;
                    border: none;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 600;
                    color: #666;
                    transition: all 0.2s ease;
                }
                
                .zoom-btn:hover {
                    background: #f5f5f5;
                    color: #333;
                    transform: scale(1.05);
                }
                
                .zoom-btn:active {
                    transform: scale(0.95);
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .map-stats {
                        top: auto;
                        bottom: 10px;
                        left: 10px;
                        padding: 8px 12px;
                    }
                    
                    .map-stats-title {
                        font-size: 12px;
                    }
                    
                    .map-stats-count {
                        font-size: 20px;
                    }
                    
                    .zoom-controls {
                        top: 10px;
                        right: 10px;
                    }
                    
                    .zoom-btn {
                        width: 36px;
                        height: 36px;
                        font-size: 18px;
                    }
                }
            </style>
            
            <div class="map-container">
                <div class="loading-overlay">
                    <div class="spinner"></div>
                    <div class="loading-text">Loading map...</div>
                </div>
                <div id="map"></div>
                <div class="map-stats">
                    <div class="map-stats-title">Visitors</div>
                    <div class="map-stats-count">0</div>
                    <div class="map-stats-label">locations</div>
                </div>
                <div class="zoom-controls">
                    <button class="zoom-btn zoom-in" title="Zoom In">+</button>
                    <button class="zoom-btn zoom-out" title="Zoom Out">−</button>
                    <button class="zoom-btn zoom-reset" title="Reset Zoom">⊙</button>
                </div>
            </div>
        `;
        
        this._shadow.appendChild(this._root);
        this._setupControls();
    }
    
    static get observedAttributes() {
        return ['map-data', 'api-key', 'initial-zoom', 'center-lat', 'center-lng', 'map-style'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) return;
        
        if (name === 'map-data' && newValue) {
            try {
                const data = JSON.parse(newValue);
                this._mapData = data;
                this._render();
            } catch (e) {
                console.error('Error parsing map data:', e);
            }
        } else if (name === 'api-key' && newValue) {
            this._apiKey = newValue;
            this._loadGoogleMapsAPI();
        }
    }
    
    connectedCallback() {
        // Check if API key is provided
        if (this._apiKey) {
            this._loadGoogleMapsAPI();
        } else {
            console.warn('Google Maps API key not provided. Add api-key attribute to the element.');
        }
    }
    
    disconnectedCallback() {
        // Clean up markers
        this._clearMarkers();
    }
    
    _setupControls() {
        // Zoom controls
        const zoomIn = this._shadow.querySelector('.zoom-in');
        const zoomOut = this._shadow.querySelector('.zoom-out');
        const zoomReset = this._shadow.querySelector('.zoom-reset');
        
        zoomIn.addEventListener('click', () => {
            if (this._map) {
                this._map.setZoom(this._map.getZoom() + 1);
            }
        });
        
        zoomOut.addEventListener('click', () => {
            if (this._map) {
                this._map.setZoom(this._map.getZoom() - 1);
            }
        });
        
        zoomReset.addEventListener('click', () => {
            if (this._map && this._mapData && this._mapData.locations) {
                this._fitBounds();
            }
        });
    }
    
    _loadGoogleMapsAPI() {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            this._initMap();
            return;
        }
        
        // Check if script is already loading
        if (window.googleMapsLoading) {
            window.googleMapsLoading.then(() => this._initMap());
            return;
        }
        
        // Load Google Maps script
        window.googleMapsLoading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this._apiKey}&libraries=marker`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                resolve();
                this._initMap();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API'));
                this._showError('Failed to load Google Maps API');
            };
            document.head.appendChild(script);
        });
    }
    
    _initMap() {
        const mapElement = this._shadow.getElementById('map');
        
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }
        
        // Default center (world view)
        const defaultCenter = { lat: 20, lng: 0 };
        const defaultZoom = 2;
        
        // Create map
        this._map = new google.maps.Map(mapElement, {
            center: defaultCenter,
            zoom: defaultZoom,
            styles: this._getMapStyle(),
            mapTypeControl: true,
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            },
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP
            },
            zoomControl: false // We have custom zoom controls
        });
        
        // Create info window
        this._infoWindow = new google.maps.InfoWindow();
        
        // Hide loading overlay
        this._hideLoading();
        
        // Render markers if data is available
        if (this._mapData) {
            this._render();
        }
    }
    
    _render() {
        if (!this._map || !this._mapData || !this._mapData.locations) {
            return;
        }
        
        // Clear existing markers
        this._clearMarkers();
        
        const locations = this._mapData.locations;
        
        // Update stats
        this._updateStats(locations.length);
        
        // Create markers for each location
        locations.forEach((location, index) => {
            if (!location.latitude || !location.longitude) {
                console.warn('Location missing coordinates:', location);
                return;
            }
            
            const position = {
                lat: parseFloat(location.latitude),
                lng: parseFloat(location.longitude)
            };
            
            // Create marker
            const marker = new google.maps.Marker({
                position: position,
                map: this._map,
                title: location.title || `Location ${index + 1}`,
                animation: google.maps.Animation.DROP,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                            <path fill="#EA4335" d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28s12-19 12-28c0-6.627-5.373-12-12-12z"/>
                            <circle cx="16" cy="12" r="6" fill="white"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 40),
                    anchor: new google.maps.Point(16, 40)
                }
            });
            
            // Add click listener for info window
            marker.addListener('click', () => {
                this._showInfoWindow(marker, location);
            });
            
            this._markers.push(marker);
        });
        
        // Fit map to show all markers
        if (this._markers.length > 0) {
            this._fitBounds();
        }
    }
    
    _showInfoWindow(marker, location) {
        const content = this._createInfoWindowContent(location);
        this._infoWindow.setContent(content);
        this._infoWindow.open(this._map, marker);
    }
    
    _createInfoWindowContent(location) {
        const container = document.createElement('div');
        container.className = 'info-window-content';
        
        // Title
        const title = document.createElement('div');
        title.className = 'info-window-title';
        title.textContent = location.title || 'Visitor Location';
        container.appendChild(title);
        
        // Location details
        if (location.city || location.state || location.country) {
            const locationDiv = document.createElement('div');
            locationDiv.className = 'info-window-location';
            
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('viewBox', '0 0 24 24');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z');
            icon.appendChild(path);
            locationDiv.appendChild(icon);
            
            const locationText = document.createElement('div');
            const parts = [];
            if (location.city && location.city !== 'Unknown City') parts.push(location.city);
            if (location.state && location.state !== '') parts.push(location.state);
            if (location.country && location.country !== 'Unknown Country') parts.push(location.country);
            locationText.textContent = parts.join(', ') || 'Unknown Location';
            locationDiv.appendChild(locationText);
            
            container.appendChild(locationDiv);
        }
        
        // Coordinates
        const coords = document.createElement('div');
        coords.className = 'info-window-coords';
        coords.textContent = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        container.appendChild(coords);
        
        // Timestamp
        if (location.timestamp) {
            const timestamp = document.createElement('div');
            timestamp.className = 'info-window-timestamp';
            const date = new Date(location.timestamp);
            timestamp.textContent = `Visited: ${this._formatDate(date)}`;
            container.appendChild(timestamp);
        }
        
        return container;
    }
    
    _formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
            }
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    _fitBounds() {
        if (!this._map || this._markers.length === 0) return;
        
        const bounds = new google.maps.LatLngBounds();
        this._markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        
        this._map.fitBounds(bounds);
        
        // Adjust zoom if only one marker
        if (this._markers.length === 1) {
            google.maps.event.addListenerOnce(this._map, 'bounds_changed', () => {
                if (this._map.getZoom() > 15) {
                    this._map.setZoom(15);
                }
            });
        }
    }
    
    _clearMarkers() {
        this._markers.forEach(marker => {
            marker.setMap(null);
        });
        this._markers = [];
    }
    
    _updateStats(count) {
        const countElement = this._shadow.querySelector('.map-stats-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }
    
    _hideLoading() {
        const loadingOverlay = this._shadow.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
    }
    
    _showError(message) {
        const container = this._shadow.querySelector('.map-container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>Error Loading Map</h3>
            <p>${message}</p>
        `;
        container.appendChild(errorDiv);
        this._hideLoading();
    }
    
    _getMapStyle() {
        // Clean, modern map style
        return [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#e9e9e9"}, {"lightness": 17}]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}, {"lightness": 20}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#ffffff"}, {"lightness": 17}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#ffffff"}, {"lightness": 29}, {"weight": 0.2}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}, {"lightness": 18}]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}, {"lightness": 16}]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}, {"lightness": 21}]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"lightness": 16}]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{"saturation": 36}, {"color": "#333333"}, {"lightness": 40}]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{"color": "#f2f2f2"}, {"lightness": 19}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#fefefe"}, {"lightness": 20}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#fefefe"}, {"lightness": 17}, {"weight": 1.2}]
            }
        ];
    }
}

// Register the custom element
customElements.define('visitor-map', VisitorMapElement);
