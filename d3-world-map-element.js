class D3WorldMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapLoaded = false;
    this.handleResize = this.handleResize.bind(this);
    console.log('✅ D3WorldMapElement: Constructor called');
  }

  connectedCallback() {
    console.log('✅ D3WorldMapElement: Connected to DOM');
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }

  static get observedAttributes() {
    return ['map-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('🔄 Attribute changed:', name);
    if (name === 'map-data' && oldValue !== newValue && this.mapLoaded) {
      this.updateMarkers();
    }
  }

  render() {
    console.log('🎨 Rendering D3 World Map');
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 500px;
        }
        .map-container {
          width: 100%;
          height: 100%;
          min-height: 500px;
          position: relative;
          background: #f0f4f8;
          overflow: hidden;
        }
        #map {
          width: 100%;
          height: 100%;
          display: block;
        }
        .country {
          fill: #e2e8f0;
          stroke: white;
          stroke-width: 0.5;
          transition: fill 0.2s;
        }
        .country:hover {
          fill: #cbd5e0;
        }
        .marker {
          cursor: pointer;
          transition: transform 0.3s ease-out;
        }
        .marker:hover {
          transform: scale(1.5);
        }
        .marker-recent {
          fill: #48bb78;
          stroke: white;
          stroke-width: 2;
        }
        .marker-old {
          fill: #667eea;
          stroke: white;
          stroke-width: 2;
        }
        .tooltip {
          position: absolute;
          background: rgba(26, 32, 44, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1000;
          display: none;
          white-space: nowrap;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stats-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-family: Arial, sans-serif;
          z-index: 10;
        }
        .stats-panel h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #2d3748;
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 13px;
        }
        .stat-label {
          color: #718096;
          margin-right: 10px;
        }
        .stat-value {
          font-weight: bold;
          color: #2d3748;
        }
        .legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-family: Arial, sans-serif;
          z-index: 10;
        }
        .legend-item {
          display: flex;
          align-items: center;
          margin: 5px 0;
          font-size: 12px;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: Arial, sans-serif;
          color: #4a5568;
          font-size: 16px;
        }
      </style>

      <div class="map-container" id="container">
        <div class="loading" id="loading">Loading map...</div>
        <svg id="map"></svg>
        
        <div class="stats-panel">
          <h3>📍 Visitor Statistics</h3>
          <div class="stat-item">
            <span class="stat-label">Total Visitors:</span>
            <span class="stat-value" id="totalCount">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Countries:</span>
            <span class="stat-value" id="countryCount">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last 24h:</span>
            <span class="stat-value" id="recentCount">0</span>
          </div>
        </div>

        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background: #48bb78;"></div>
            <span>Recent (24h)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #667eea;"></div>
            <span>Older visits</span>
          </div>
        </div>

        <div class="tooltip" id="tooltip"></div>
      </div>
    `;
    
    this.loadD3AndMap();
  }

  async loadD3AndMap() {
    try {
      console.log('📦 Loading D3.js library...');
      
      // Wait for D3.js to load
      if (!window.d3) {
        await this.loadScript('https://d3js.org/d3.v7.min.js');
        // Wait a bit for D3 to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!window.d3) {
        throw new Error('D3.js failed to load');
      }
      console.log('✅ D3.js loaded');
      
      // Wait for TopoJSON to load
      if (!window.topojson) {
        await this.loadScript('https://unpkg.com/topojson@3');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!window.topojson) {
        throw new Error('TopoJSON failed to load');
      }
      console.log('✅ TopoJSON loaded');
      
      // Initialize map
      await this.initializeMap();
      
      // Add resize handler
      window.addEventListener('resize', this.handleResize);
      
    } catch (error) {
      console.error('❌ Error loading D3:', error);
      this.shadowRoot.getElementById('loading').textContent = 'Error loading map libraries';
    }
  }

  handleResize() {
    if (!this.mapLoaded) return;
    
    const container = this.shadowRoot.getElementById('container');
    const svg = window.d3.select(this.shadowRoot.getElementById('map'));
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.attr('width', width).attr('height', height);
    
    this.projection
      .scale(width / 6)
      .translate([width / 2, height / 2]);
    
    // Redraw countries
    svg.selectAll('.country').attr('d', this.path);
    
    // Update markers if they exist
    if (this.getAttribute('map-data')) {
      this.updateMarkers();
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (src.includes('d3.v7') && window.d3) {
        console.log('D3 already loaded');
        resolve();
        return;
      }
      if (src.includes('topojson') && window.topojson) {
        console.log('TopoJSON already loaded');
        resolve();
        return;
      }
      
      // Check if script tag already exists
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        console.log('Script tag exists, waiting for load...');
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
        return;
      }
      
      // Create new script
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        console.log(`✅ Script loaded: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`❌ Failed to load: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };
      
      document.head.appendChild(script);
      console.log(`📥 Loading script: ${src}`);
    });
  }

  async initializeMap() {
    console.log('🗺️ Initializing D3 map...');
    
    const container = this.shadowRoot.getElementById('container');
    const svg = window.d3.select(this.shadowRoot.getElementById('map'));
    const loading = this.shadowRoot.getElementById('loading');
    
    // Get container dimensions
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 600;
    
    console.log('Container dimensions:', width, 'x', height);
    
    // Set SVG dimensions with viewBox for responsiveness
    const aspect = width / height;
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Create projection - using Natural Earth for better world view
    this.projection = window.d3.geoNaturalEarth1()
      .scale(width / 6)
      .translate([width / 2, height / 2]);
    
    this.path = window.d3.geoPath().projection(this.projection);
    
    console.log('✅ Projection created');
    
    try {
      // Load world map data
      console.log('📥 Fetching world map data...');
      const worldData = await window.d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      console.log('✅ World data loaded');
      
      // Convert TopoJSON to GeoJSON
      const countries = window.topojson.feature(worldData, worldData.objects.countries);
      console.log('✅ Countries extracted:', countries.features.length);
      
      // Draw countries
      svg.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', this.path);
      
      console.log('✅ Map rendered');
      
      // Create markers group
      this.markersGroup = svg.append('g').attr('class', 'markers');
      
      loading.style.display = 'none';
      this.mapLoaded = true;
      
      // Update markers if data already exists
      const mapData = this.getAttribute('map-data');
      if (mapData) {
        console.log('📍 Map data already exists, updating markers');
        this.updateMarkers();
      }
      
    } catch (error) {
      console.error('❌ Error loading map data:', error);
      loading.textContent = 'Error loading map data';
    }
  }

  updateMarkers() {
    console.log('\n==========================================');
    console.log('🚀 UPDATE MARKERS (D3.js)');
    console.log('==========================================\n');
    
    if (!this.mapLoaded) {
      console.log('⏳ Map not loaded yet, waiting...');
      return;
    }
    
    const mapData = this.getAttribute('map-data');
    if (!mapData) {
      console.error('❌ No map-data attribute');
      return;
    }
    
    try {
      const locations = JSON.parse(mapData);
      console.log('✅ Parsed locations:', locations.length);
      console.log('First location:', locations[0]);
      
      const tooltip = this.shadowRoot.getElementById('tooltip');
      const container = this.shadowRoot.getElementById('container');
      
      // Clear existing markers
      this.markersGroup.selectAll('*').remove();
      console.log('🧹 Cleared old markers');
      
      // Statistics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let recentCount = 0;
      const countries = new Set();
      let validMarkers = 0;
      
      // Add markers
      locations.forEach((location, index) => {
        console.log(`\n--- Location ${index + 1} ---`);
        
        // Validate
        if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
          console.error('❌ Invalid data types');
          return;
        }
        
        if (isNaN(location.lat) || isNaN(location.lng)) {
          console.error('❌ NaN values');
          return;
        }
        
        // Project coordinates using D3
        const coords = this.projection([location.lng, location.lat]);
        
        if (!coords) {
          console.error('❌ Projection failed for:', location.lat, location.lng);
          return;
        }
        
        const [x, y] = coords;
        console.log(`📍 lat=${location.lat}, lng=${location.lng} → x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
        
        // Statistics
        const isRecent = location.timestamp && new Date(location.timestamp) > oneDayAgo;
        if (isRecent) recentCount++;
        if (location.country) countries.add(location.country);
        
        // Create marker using D3
        const marker = this.markersGroup.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 7)
          .attr('class', `marker ${isRecent ? 'marker-recent' : 'marker-old'}`)
          .attr('data-location', location.title || 'Unknown');
        
        // Tooltip events
        marker.on('mouseenter', (event) => {
          tooltip.style.display = 'block';
          tooltip.innerHTML = `
            <strong>${location.title || 'Visitor'}</strong><br>
            ${location.time || 'Unknown Time'}<br>
            <small>Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}</small>
          `;
        });
        
        marker.on('mousemove', (event) => {
          const rect = container.getBoundingClientRect();
          const left = event.clientX - rect.left;
          const top = event.clientY - rect.top;
          tooltip.style.left = `${left + 10}px`;
          tooltip.style.top = `${top + 10}px`;
        });
        
        marker.on('mouseleave', () => {
          tooltip.style.display = 'none';
        });
        
        validMarkers++;
        console.log(`✅ Marker ${index + 1} added`);
      });
      
      console.log('\n==========================================');
      console.log('📊 SUMMARY');
      console.log('==========================================');
      console.log('Total locations:', locations.length);
      console.log('Valid markers:', validMarkers);
      console.log('Recent (24h):', recentCount);
      console.log('Countries:', countries.size);
      console.log('==========================================\n');
      
      // Update stats
      this.shadowRoot.getElementById('totalCount').textContent = locations.length;
      this.shadowRoot.getElementById('countryCount').textContent = countries.size;
      this.shadowRoot.getElementById('recentCount').textContent = recentCount;
      
    } catch (error) {
      console.error('❌ Error in updateMarkers:', error);
    }
  }
}

customElements.define('d3-world-map-element', D3WorldMapElement);
console.log('✅ d3-world-map-element registered');
