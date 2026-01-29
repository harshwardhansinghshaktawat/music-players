class D3WorldMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapLoaded = false;
    this.handleResize = this.handleResize.bind(this);
    this.activeTooltip = null;
    this.resizeTimeout = null;
    this.countriesData = null; // Store for reuse during resize
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
  }

  static get observedAttributes() {
    return ['map-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'map-data' && oldValue !== newValue && this.mapLoaded) {
      this.updateMarkers();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 400px;
        }
        
        .map-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }
        
        .map-wrapper {
          flex: 1;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        
        #map {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Standardized Styles */
        .country { fill: #ffffff; stroke: #667eea; stroke-width: 0.5; opacity: 0.9; }
        .country:hover { fill: #f0f0f0; opacity: 1; }
        .location-marker { cursor: pointer; transform-origin: center bottom; }
        .marker-pin-recent { fill: #48bb78; }
        .marker-pin-old { fill: #4299e1; }
        
        .tooltip {
          position: absolute;
          background: rgba(26, 32, 44, 0.95);
          color: white;
          padding: 10px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          z-index: 1000;
          transition: opacity 0.2s;
        }
        .tooltip.active { opacity: 1; }

        .bottom-stats {
          background: white;
          padding: 12px;
          display: flex;
          justify-content: space-around;
          border-top: 1px solid #eee;
        }
        .stat-value { font-weight: 800; color: #764ba2; }
        .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; }
      </style>

      <div class="map-container">
        <div class="map-wrapper" id="mapWrapper">
          <div class="loading" id="loading">Loading world map...</div>
          <svg id="map">
            <defs>
              <g id="pin-recent"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" class="marker-pin-recent"/></g>
              <g id="pin-old"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" class="marker-pin-old"/></g>
            </defs>
          </svg>
          <div class="tooltip" id="tooltip"></div>
        </div>
        <div class="bottom-stats">
            <div>Cities: <span class="stat-value" id="cityCount">0</span></div>
            <div>Total Visits: <span class="stat-value" id="totalVisits">0</span></div>
        </div>
      </div>
    `;
    this.loadD3AndMap();
  }

  async loadD3AndMap() {
    if (!window.d3) await this.loadScript('https://d3js.org/d3.v7.min.js');
    if (!window.topojson) await this.loadScript('https://unpkg.com/topojson@3');
    await this.initializeMap();
    window.addEventListener('resize', this.handleResize);
  }

  loadScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  async initializeMap() {
    const mapWrapper = this.shadowRoot.getElementById('mapWrapper');
    const svg = window.d3.select(this.shadowRoot.getElementById('map'));
    
    const width = mapWrapper.clientWidth;
    const height = mapWrapper.clientHeight;

    // 1. Initial Projection Setup
    this.projection = window.d3.geoNaturalEarth1();
    this.path = window.d3.geoPath().projection(this.projection);

    try {
      const worldData = await window.d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      this.countriesData = window.topojson.feature(worldData, worldData.objects.countries);

      // 2. CRITICAL: Fit the map to the container size
      this.projection.fitSize([width, height], this.countriesData);

      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .append('g')
         .attr('class', 'countries')
         .selectAll('path')
         .data(this.countriesData.features)
         .enter()
         .append('path')
         .attr('class', 'country')
         .attr('d', this.path);

      this.markersGroup = svg.append('g').attr('class', 'markers');
      this.shadowRoot.getElementById('loading').style.display = 'none';
      this.mapLoaded = true;
      this.updateMarkers();
    } catch (e) { console.error(e); }
  }

  handleResize() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (!this.mapLoaded || !this.countriesData) return;

      const mapWrapper = this.shadowRoot.getElementById('mapWrapper');
      const width = mapWrapper.clientWidth;
      const height = mapWrapper.clientHeight;

      // Update Projection to fill new size
      this.projection.fitSize([width, height], this.countriesData);
      
      const svg = window.d3.select(this.shadowRoot.getElementById('map'));
      svg.attr('viewBox', `0 0 ${width} ${height}`);
      
      // Update paths
      svg.selectAll('.country').attr('d', this.path);
      
      // Update marker positions
      this.updateMarkers();
    }, 150);
  }

  updateMarkers() {
    if (!this.mapLoaded) return;
    const mapData = this.getAttribute('map-data');
    if (!mapData) return;

    const locations = JSON.parse(mapData);
    this.markersGroup.selectAll('*').remove();

    locations.forEach((loc) => {
      const coords = this.projection([loc.lng, loc.lat]);
      if (!coords) return;

      const [x, y] = coords;
      const marker = this.markersGroup.append('g')
        .attr('class', 'location-marker')
        .attr('transform', `translate(${x}, ${y})`);

      marker.append('use')
        .attr('href', loc.isRecent ? '#pin-recent' : '#pin-old')
        .attr('x', -12).attr('y', -24)
        .attr('width', 24).attr('height', 24);
    });

    this.shadowRoot.getElementById('cityCount').textContent = locations.length;
  }
}

customElements.define('d3-world-map-element', D3WorldMapElement);
