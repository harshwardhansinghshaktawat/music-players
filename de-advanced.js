class D3WorldMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapLoaded = false;
    this.handleResize = this.handleResize.bind(this);
    this.activeTooltip = null;
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
    if (name === 'map-data' && oldValue !== newValue && this.mapLoaded) {
      console.log('🔄 Map data changed, updating markers');
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        #map {
          width: 100%;
          height: 100%;
          display: block;
        }
        
        .country {
          fill: #ffffff;
          stroke: #667eea;
          stroke-width: 0.5;
          transition: fill 0.3s ease;
          opacity: 0.9;
        }
        
        .country:hover {
          fill: #f0f0f0;
          opacity: 1;
        }
        
        .location-marker {
          cursor: pointer;
          transition: opacity 0.3s ease;
          transform-origin: center bottom;
          transform-box: fill-box;
        }
        
        .location-marker:hover {
          opacity: 0.8;
        }
        
        .marker-pin-recent {
          fill: #48bb78;
          filter: drop-shadow(0 4px 8px rgba(72, 187, 120, 0.5));
        }
        
        .marker-pin-old {
          fill: #4299e1;
          filter: drop-shadow(0 4px 8px rgba(66, 153, 225, 0.5));
        }
        
        .marker-pulse {
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          opacity: 0;
          transform-origin: center bottom;
          transform-box: fill-box;
          animation: pulse-ring 2s ease-out infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            r: 4;
            opacity: 0.8;
          }
          100% {
            r: 20;
            opacity: 0;
          }
        }
        
        .visit-badge {
          pointer-events: none;
        }
        
        .visit-badge-bg {
          fill: white;
          stroke: #2d3748;
          stroke-width: 1;
        }
        
        .visit-badge-text {
          fill: #2d3748;
          font-size: 10px;
          font-weight: 700;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          text-anchor: middle;
          dominant-baseline: middle;
        }
        
        .tooltip {
          position: absolute;
          background: linear-gradient(135deg, rgba(26, 32, 44, 0.98), rgba(45, 55, 72, 0.98));
          color: white;
          padding: 14px 18px;
          border-radius: 10px;
          font-size: 13px;
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.2s ease, transform 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          min-width: 200px;
        }
        
        .tooltip.active {
          opacity: 1;
          transform: translateY(0);
        }
        
        .tooltip strong {
          display: block;
          font-size: 15px;
          margin-bottom: 6px;
          color: #63b3ed;
        }
        
        .tooltip-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
          font-size: 12px;
        }
        
        .tooltip-label {
          color: #a0aec0;
          margin-right: 12px;
        }
        
        .tooltip-value {
          color: #e2e8f0;
          font-weight: 600;
        }
        
        .tooltip-highlight {
          background: rgba(72, 187, 120, 0.2);
          padding: 4px 10px;
          border-radius: 6px;
          margin-top: 6px;
          text-align: center;
          color: #9ae6b4;
          font-weight: 600;
        }
        
        .stats-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          padding: 20px 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          z-index: 10;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .stats-panel h3 {
          margin: 0 0 14px 0;
          font-size: 16px;
          color: #2d3748;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
          font-size: 14px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .stat-item:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          color: #718096;
          font-weight: 500;
          margin-right: 16px;
        }
        
        .stat-value {
          font-weight: 700;
          color: #2d3748;
          font-size: 18px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          padding: 16px 20px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          z-index: 10;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin: 8px 0;
          font-size: 13px;
          font-weight: 500;
          color: #4a5568;
        }
        
        .legend-icon {
          width: 16px;
          height: 20px;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
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
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .stats-panel {
            top: 10px;
            right: 10px;
            padding: 12px 16px;
          }
          
          .stats-panel h3 {
            font-size: 14px;
          }
          
          .stat-item {
            font-size: 12px;
            margin: 6px 0;
          }
          
          .stat-value {
            font-size: 16px;
          }
          
          .legend {
            bottom: 10px;
            left: 10px;
            padding: 12px 16px;
          }
          
          .legend-item {
            font-size: 11px;
            margin: 6px 0;
          }
        }
      </style>

      <div class="map-container" id="container">
        <div class="loading" id="loading">Loading world map...</div>
        <svg id="map">
          <defs>
            <!-- Location Pin Icon - Recent (Green) -->
            <g id="pin-recent">
              <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" 
                    class="marker-pin-recent"/>
            </g>
            
            <!-- Location Pin Icon - Old (Blue) -->
            <g id="pin-old">
              <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" 
                    class="marker-pin-old"/>
            </g>
          </defs>
        </svg>
        
        <div class="stats-panel">
          <h3>🌍 Live Visitor Map</h3>
          <div class="stat-item">
            <span class="stat-label">Cities</span>
            <span class="stat-value" id="cityCount">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Visits</span>
            <span class="stat-value" id="totalVisits">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last 24 Hours</span>
            <span class="stat-value" id="recentCount">0</span>
          </div>
        </div>

        <div class="legend">
          <div class="legend-item">
            <div class="legend-icon">
              <svg width="16" height="20" viewBox="0 0 24 24">
                <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" 
                      fill="#48bb78"/>
              </svg>
            </div>
            <span>Recent (24h)</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon">
              <svg width="16" height="20" viewBox="0 0 24 24">
                <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" 
                      fill="#4299e1"/>
              </svg>
            </div>
            <span>Earlier Visits</span>
          </div>
        </div>

        <div class="tooltip" id="tooltip"></div>
      </div>
    `;
    
    this.loadD3AndMap();
  }

  async loadD3AndMap() {
    try {
      console.log('📦 Loading D3.js libraries...');
      
      if (!window.d3) {
        await this.loadScript('https://d3js.org/d3.v7.min.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!window.d3) {
        throw new Error('D3.js failed to load');
      }
      console.log('✅ D3.js loaded');
      
      if (!window.topojson) {
        await this.loadScript('https://unpkg.com/topojson@3');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!window.topojson) {
        throw new Error('TopoJSON failed to load');
      }
      console.log('✅ TopoJSON loaded');
      
      await this.initializeMap();
      window.addEventListener('resize', this.handleResize);
      
    } catch (error) {
      console.error('❌ Error loading libraries:', error);
      this.shadowRoot.getElementById('loading').textContent = 'Error loading map';
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
    
    svg.selectAll('.country').attr('d', this.path);
    
    if (this.getAttribute('map-data')) {
      this.updateMarkers();
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (src.includes('d3.v7') && window.d3) {
        resolve();
        return;
      }
      if (src.includes('topojson') && window.topojson) {
        resolve();
        return;
      }
      
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
    console.log('🗺️ Initializing D3 map...');
    
    const container = this.shadowRoot.getElementById('container');
    const svg = window.d3.select(this.shadowRoot.getElementById('map'));
    const loading = this.shadowRoot.getElementById('loading');
    
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 600;
    
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    this.projection = window.d3.geoNaturalEarth1()
      .scale(width / 6)
      .translate([width / 2, height / 2]);
    
    this.path = window.d3.geoPath().projection(this.projection);
    
    try {
      console.log('📥 Fetching world map data...');
      const worldData = await window.d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      console.log('✅ World data loaded');
      
      const countries = window.topojson.feature(worldData, worldData.objects.countries);
      
      svg.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', this.path);
      
      this.markersGroup = svg.append('g').attr('class', 'markers');
      
      loading.style.display = 'none';
      this.mapLoaded = true;
      
      const mapData = this.getAttribute('map-data');
      if (mapData) {
        console.log('📍 Initial map data found, rendering markers');
        this.updateMarkers();
      }
      
    } catch (error) {
      console.error('❌ Error loading map data:', error);
      loading.textContent = 'Error loading map data';
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
      console.log('\n========== UPDATING CITY-LEVEL MARKERS ==========');
      console.log('📍 Total cities:', locations.length);
      
      if (locations.length === 0) {
        console.log('⚠️ No locations to display');
        return;
      }
      
      const tooltip = this.shadowRoot.getElementById('tooltip');
      const container = this.shadowRoot.getElementById('container');
      
      this.markersGroup.selectAll('*').remove();
      console.log('🧹 Cleared old markers');
      
      // Calculate statistics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let recentCount = 0;
      let totalVisits = 0;
      const countries = new Set();
      
      // Add markers
      locations.forEach((location, index) => {
        if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
          console.error(`❌ Invalid location ${index}:`, location);
          return;
        }
        if (isNaN(location.lat) || isNaN(location.lng)) {
          console.error(`❌ NaN in location ${index}:`, location);
          return;
        }
        
        const coords = this.projection([location.lng, location.lat]);
        if (!coords) {
          console.error(`❌ Projection failed for location ${index}:`, location);
          return;
        }
        
        const [x, y] = coords;
        const isRecent = location.isRecent;
        
        // Statistics
        if (isRecent) recentCount++;
        totalVisits += location.totalVisits || 0;
        if (location.country) countries.add(location.country);
        
        // Create marker group
        const markerGroup = this.markersGroup.append('g')
          .attr('class', 'location-marker')
          .attr('transform', `translate(${x}, ${y})`);
        
        // Add pulse animation for recent visitors
        if (isRecent) {
          markerGroup.append('circle')
            .attr('cx', 0)
            .attr('cy', -10)
            .attr('r', 4)
            .attr('class', 'marker-pulse')
            .style('color', '#48bb78');
        }
        
        // Add location pin icon
        markerGroup.append('use')
          .attr('href', isRecent ? '#pin-recent' : '#pin-old')
          .attr('x', -12)
          .attr('y', -24)
          .attr('width', 24)
          .attr('height', 24);
        
        // Add visit count badge if more than 1 visit
        if (location.totalVisits > 1) {
          const badge = markerGroup.append('g')
            .attr('class', 'visit-badge')
            .attr('transform', 'translate(8, -20)');
          
          badge.append('circle')
            .attr('class', 'visit-badge-bg')
            .attr('r', 10);
          
          badge.append('text')
            .attr('class', 'visit-badge-text')
            .text(location.totalVisits > 99 ? '99+' : location.totalVisits);
        }
        
        // Tooltip events - NO TRANSFORM on hover to prevent fluctuation
        let enterTimeout;
        let leaveTimeout;
        
        markerGroup.on('mouseenter', () => {
          clearTimeout(leaveTimeout);
          clearTimeout(enterTimeout);
          
          enterTimeout = setTimeout(() => {
            this.activeTooltip = index;
            tooltip.innerHTML = `
              <strong>📍 ${location.title || 'Visitor Location'}</strong>
              <div class="tooltip-row">
                <span class="tooltip-label">Total Visits:</span>
                <span class="tooltip-value">${location.totalVisits || 1}</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-label">Unique Visitors:</span>
                <span class="tooltip-value">${location.visitorCount || 1}</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-label">Last Visit:</span>
                <span class="tooltip-value">${location.lastVisit || 'Unknown'}</span>
              </div>
              ${isRecent ? '<div class="tooltip-highlight">🟢 Active in last 24h</div>' : ''}
            `;
            tooltip.classList.add('active');
          }, 100);
        });
        
        markerGroup.on('mousemove', (event) => {
          if (this.activeTooltip !== index) return;
          
          const rect = container.getBoundingClientRect();
          const left = event.clientX - rect.left;
          const top = event.clientY - rect.top;
          
          const tooltipWidth = 220;
          const tooltipHeight = 140;
          
          let finalLeft = left + 15;
          let finalTop = top + 15;
          
          if (finalLeft + tooltipWidth > rect.width) {
            finalLeft = left - tooltipWidth - 15;
          }
          if (finalTop + tooltipHeight > rect.height) {
            finalTop = top - tooltipHeight - 15;
          }
          
          tooltip.style.left = `${finalLeft}px`;
          tooltip.style.top = `${finalTop}px`;
        });
        
        markerGroup.on('mouseleave', () => {
          clearTimeout(enterTimeout);
          clearTimeout(leaveTimeout);
          
          leaveTimeout = setTimeout(() => {
            if (this.activeTooltip === index) {
              tooltip.classList.remove('active');
              this.activeTooltip = null;
            }
          }, 100);
        });
        
        console.log(`✅ Marker ${index + 1}: ${location.title} - ${location.totalVisits} visits`);
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
      
    } catch (error) {
      console.error('❌ Error updating markers:', error);
    }
  }
}

customElements.define('d3-world-map-element', D3WorldMapElement);
console.log('✅ d3-world-map-element registered');
