class MapLibreWorldMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapLoaded = false;
    this.markers = [];
    this.activePopup = null;
    console.log('✅ MapLibreWorldMap: Constructor called');
  }

  connectedCallback() {
    console.log('✅ MapLibreWorldMap: Connected to DOM');
    this.render();
  }

  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
    }
  }

  static get observedAttributes() {
    return ['map-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'map-data' && oldValue !== newValue && this.mapLoaded) {
      console.log('🔄 Map data changed, updating markers');
      this.updateMarkers();
    }
  }

  render() {
    console.log('🎨 Rendering MapLibre World Map');
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 600px;
        }
        
        .map-container {
          width: 100%;
          height: 100%;
          min-height: 600px;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
        }
        
        .map-wrapper {
          flex: 1;
          position: relative;
          min-height: 0;
        }
        
        #map {
          width: 100%;
          height: 100%;
        }
        
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          color: white;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          background: rgba(102, 126, 234, 0.9);
          padding: 20px 40px;
          border-radius: 12px;
        }
        
        /* Bottom Stats Bar */
        .bottom-stats {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          padding: 16px 24px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 20px;
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        
        .stats-group {
          display: flex;
          gap: 32px;
          align-items: center;
          flex: 1;
          justify-content: center;
        }
        
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 100px;
        }
        
        .stat-label {
          color: #718096;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }
        
        .stat-divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0));
        }
        
        .legend-group {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #4a5568;
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .legend-dot.recent {
          background: #48bb78;
          box-shadow: 0 0 8px rgba(72, 187, 120, 0.5);
        }
        
        .legend-dot.old {
          background: #4299e1;
          box-shadow: 0 0 8px rgba(66, 153, 225, 0.5);
        }
        
        .map-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #2d3748;
        }
        
        /* Custom Marker Styles */
        .custom-marker {
          cursor: pointer;
          position: relative;
        }
        
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }
        
        .custom-marker:hover .marker-pin {
          transform: scale(1.2);
        }
        
        .marker-pin.recent {
          background: linear-gradient(135deg, #48bb78, #38a169);
        }
        
        .marker-pin.old {
          background: linear-gradient(135deg, #4299e1, #3182ce);
        }
        
        .marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(72, 187, 120, 0.4);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        
        /* MapLibre Popup Customization */
        .maplibregl-popup-content {
          background: linear-gradient(135deg, rgba(26, 32, 44, 0.98), rgba(45, 55, 72, 0.98));
          color: white;
          padding: 16px 20px;
          border-radius: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          min-width: 220px;
        }
        
        .maplibregl-popup-tip {
          border-top-color: rgba(26, 32, 44, 0.98) !important;
        }
        
        .popup-title {
          font-size: 16px;
          font-weight: 700;
          color: #63b3ed;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .popup-row {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
          font-size: 13px;
        }
        
        .popup-label {
          color: #a0aec0;
        }
        
        .popup-value {
          color: #e2e8f0;
          font-weight: 600;
        }
        
        .popup-highlight {
          background: rgba(72, 187, 120, 0.2);
          padding: 6px 12px;
          border-radius: 6px;
          margin-top: 10px;
          text-align: center;
          color: #9ae6b4;
          font-weight: 600;
          font-size: 12px;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .bottom-stats {
            padding: 12px 16px;
          }
          
          .stats-group {
            gap: 20px;
          }
          
          .stat-card {
            min-width: 80px;
          }
          
          .stat-value {
            font-size: 24px;
          }
          
          .stat-label {
            font-size: 11px;
          }
        }
        
        @media (max-width: 768px) {
          .bottom-stats {
            flex-direction: column;
            padding: 12px;
            gap: 12px;
          }
          
          .stats-group {
            width: 100%;
            gap: 16px;
          }
          
          .stat-divider {
            display: none;
          }
          
          .legend-group {
            width: 100%;
            justify-content: center;
            padding-top: 8px;
            border-top: 1px solid rgba(0,0,0,0.1);
          }
          
          .stat-card {
            min-width: 70px;
          }
          
          .stat-value {
            font-size: 20px;
          }
          
          .map-title {
            display: none;
          }
        }
      </style>

      <div class="map-container">
        <div class="map-wrapper">
          <div class="loading" id="loading">Loading map...</div>
          <div id="map"></div>
        </div>
        
        <div class="bottom-stats">
          <div class="map-title">
            🌍 Live Visitor Map
          </div>
          
          <div class="stats-group">
            <div class="stat-card">
              <div class="stat-value" id="cityCount">0</div>
              <div class="stat-label">Cities</div>
            </div>
            
            <div class="stat-divider"></div>
            
            <div class="stat-card">
              <div class="stat-value" id="totalVisits">0</div>
              <div class="stat-label">Total Visits</div>
            </div>
            
            <div class="stat-divider"></div>
            
            <div class="stat-card">
              <div class="stat-value" id="recentCount">0</div>
              <div class="stat-label">Last 24 Hours</div>
            </div>
          </div>
          
          <div class="legend-group">
            <div class="legend-item">
              <div class="legend-dot recent"></div>
              <span>Recent</span>
            </div>
            
            <div class="legend-item">
              <div class="legend-dot old"></div>
              <span>Earlier</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.loadMapLibreAndMap();
  }

  async loadMapLibreAndMap() {
    try {
      console.log('📦 Loading MapLibre GL JS...');
      
      // Load MapLibre GL JS CSS
      if (!document.querySelector('link[href*="maplibre-gl"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }
      
      // Load MapLibre GL JS script
      if (!window.maplibregl) {
        await this.loadScript('https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!window.maplibregl) {
        throw new Error('MapLibre GL JS failed to load');
      }
      console.log('✅ MapLibre GL JS loaded');
      
      await this.initializeMap();
      
    } catch (error) {
      console.error('❌ Error loading MapLibre:', error);
      this.shadowRoot.getElementById('loading').textContent = 'Error loading map';
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        console.log(`✅ Script loaded: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load ${src}`));
      };
      
      document.head.appendChild(script);
    });
  }

  async initializeMap() {
    console.log('🗺️ Initializing MapLibre map...');
    
    const mapDiv = this.shadowRoot.getElementById('map');
    const loading = this.shadowRoot.getElementById('loading');
    
    try {
      // Initialize MapLibre GL JS map
      this.map = new window.maplibregl.Map({
        container: mapDiv,
        style: {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [{
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 19
          }]
        },
        center: [0, 20],
        zoom: 1.5,
        minZoom: 1,
        maxZoom: 18
      });
      
      this.map.on('load', () => {
        console.log('✅ Map loaded');
        loading.style.display = 'none';
        this.mapLoaded = true;
        
        // Add navigation controls
        this.map.addControl(new window.maplibregl.NavigationControl(), 'top-right');
        
        const mapData = this.getAttribute('map-data');
        if (mapData) {
          console.log('📍 Initial map data found, rendering markers');
          this.updateMarkers();
        }
      });
      
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      loading.textContent = 'Error loading map';
    }
  }

  updateMarkers() {
    if (!this.mapLoaded) {
      console.log('⏳ Map not loaded yet');
      return;
    }
    
    const mapData = this.getAttribute('map-data');
    if (!mapData) {
      console.log('⚠️ No map data attribute');
      return;
    }
    
    try {
      const locations = JSON.parse(mapData);
      console.log('\n========== UPDATING MARKERS ==========');
      console.log('📍 Total cities:', locations.length);
      
      if (locations.length === 0) {
        console.log('⚠️ No locations to display');
        return;
      }
      
      // Remove old markers
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
      console.log('🧹 Cleared old markers');
      
      // Calculate statistics
      let recentCount = 0;
      let totalVisits = 0;
      const countries = new Set();
      
      // Add new markers
      locations.forEach((location, index) => {
        if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
          console.error(`❌ Invalid location ${index}:`, location);
          return;
        }
        if (isNaN(location.lat) || isNaN(location.lng)) {
          console.error(`❌ NaN in location ${index}:`, location);
          return;
        }
        
        const isRecent = location.isRecent;
        
        // Statistics
        if (isRecent) recentCount++;
        totalVisits += location.totalVisits || 0;
        if (location.country) countries.add(location.country);
        
        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        
        const pinEl = document.createElement('div');
        pinEl.className = `marker-pin ${isRecent ? 'recent' : 'old'}`;
        pinEl.textContent = location.totalVisits > 99 ? '99+' : location.totalVisits;
        
        markerEl.appendChild(pinEl);
        
        // Add pulse animation for recent visitors
        if (isRecent) {
          const pulseEl = document.createElement('div');
          pulseEl.className = 'marker-pulse';
          markerEl.appendChild(pulseEl);
        }
        
        // Create popup content
        const popupContent = `
          <div class="popup-title">📍 ${location.title || 'Visitor Location'}</div>
          <div class="popup-row">
            <span class="popup-label">Total Visits:</span>
            <span class="popup-value">${location.totalVisits || 1}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Unique Visitors:</span>
            <span class="popup-value">${location.visitorCount || 1}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Last Visit:</span>
            <span class="popup-value">${location.lastVisit || 'Unknown'}</span>
          </div>
          ${isRecent ? '<div class="popup-highlight">🟢 Active in last 24h</div>' : ''}
        `;
        
        // Create popup
        const popup = new window.maplibregl.Popup({
          offset: 15,
          closeButton: false,
          closeOnClick: false
        }).setHTML(popupContent);
        
        // Create marker
        const marker = new window.maplibregl.Marker({
          element: markerEl,
          anchor: 'center'
        })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(this.map);
        
        // Add hover events
        markerEl.addEventListener('mouseenter', () => {
          popup.addTo(this.map);
        });
        
        markerEl.addEventListener('mouseleave', () => {
          popup.remove();
        });
        
        this.markers.push(marker);
      });
      
      console.log('\n📊 STATISTICS');
      console.log('Cities:', locations.length);
      console.log('Total Visits:', totalVisits);
      console.log('Recent (24h):', recentCount);
      console.log('Countries:', countries.size);
      console.log('======================================\n');
      
      // Update statistics
      this.shadowRoot.getElementById('cityCount').textContent = locations.length;
      this.shadowRoot.getElementById('totalVisits').textContent = totalVisits;
      this.shadowRoot.getElementById('recentCount').textContent = recentCount;
      
      // Fit map to show all markers if we have locations
      if (locations.length > 0 && locations.length < 100) {
        const bounds = new window.maplibregl.LngLatBounds();
        locations.forEach(location => {
          bounds.extend([location.lng, location.lat]);
        });
        this.map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 5
        });
      }
      
    } catch (error) {
      console.error('❌ Error updating markers:', error);
    }
  }
}

customElements.define('maplibre-world-map', MapLibreWorldMap);
console.log('✅ maplibre-world-map custom element registered');
