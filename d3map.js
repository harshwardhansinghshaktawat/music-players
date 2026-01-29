class VisitorMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapData = [];
    this.isD3Loaded = false;
    this.worldData = null;
  }

  connectedCallback() {
    console.log('✅ VisitorMapElement: Live Connected');
    this.renderInitialUI(); // Draw the container immediately
    this.loadDependencies();
  }

  static get observedAttributes() {
    return ['map-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'map-data' && oldValue !== newValue) {
      try {
        if (!newValue) return;
        this.mapData = JSON.parse(newValue);
        if (this.isD3Loaded && this.worldData) {
          this.renderMap();
        }
      } catch (e) {
        this.logError('Data Parse Error', e.message);
      }
    }
  }

  // 1. DRAW CONTAINER & ERROR LOGGING AREA
  renderInitialUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; min-height: 400px; }
        .map-container { 
          width: 100%; height: 100%; background: #f0f4f8; position: relative; 
          display: flex; justify-content: center; align-items: center;
        }
        svg { display: block; width: 100%; height: 100%; max-height: 100%; position: absolute; top:0; left:0;}
        
        .loading-msg { 
          font-family: sans-serif; color: #718096; font-size: 14px; 
          background: rgba(255,255,255,0.8); padding: 10px; border-radius: 4px;
          position: absolute; z-index: 20;
        }
        .error-msg { 
          font-family: monospace; color: white; font-size: 12px; 
          background: #e53e3e; padding: 15px; border-radius: 4px;
          position: absolute; z-index: 30; max-width: 80%;
          display: none; /* Hidden by default */
        }
        
        /* Map Styles */
        .country { fill: #cbd5e0; stroke: #fff; stroke-width: 0.5px; }
        .marker { cursor: pointer; transition: transform 0.2s; }
        .marker:hover { transform: scale(1.5); }
        .marker-recent { fill: #48bb78; stroke: #fff; stroke-width: 1px; }
        .marker-old { fill: #667eea; stroke: #fff; stroke-width: 1px; }
        
        /* Tooltip & Stats */
        .tooltip {
          position: absolute; background: rgba(26, 32, 44, 0.95); color: white;
          padding: 8px 12px; border-radius: 4px; font-size: 12px;
          pointer-events: none; opacity: 0; transition: opacity 0.2s; z-index: 10;
          white-space: nowrap; top: 0; left: 0;
        }
        .stats {
          position: absolute; top: 10px; right: 10px;
          background: rgba(255, 255, 255, 0.9); padding: 8px 12px;
          border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-family: sans-serif; font-size: 11px; z-index: 15;
        }
      </style>
      
      <div class="map-container" id="container">
        <div id="loading" class="loading-msg">Initializing Map...</div>
        <div id="error" class="error-msg"></div>
        <svg id="viz" viewBox="0 0 960 500" preserveAspectRatio="xMidYMid meet"></svg>
        <div class="tooltip" id="tooltip"></div>
        <div class="stats">
           <div>Total: <strong id="count-total">0</strong></div>
           <div>Recent: <strong id="count-recent">0</strong></div>
        </div>
      </div>
    `;
  }

  // 2. VISUAL ERROR LOGGER (So we can see what's happening on Live)
  logError(title, detail) {
    console.error(title, detail);
    const errEl = this.shadowRoot.getElementById('error');
    const loadEl = this.shadowRoot.getElementById('loading');
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerHTML = `<strong>${title}</strong><br/>${detail}`;
    }
    if (loadEl) loadEl.style.display = 'none';
  }

  // 3. LOAD SCRIPTS SEQUENTIALLY
  loadDependencies() {
    if (window.d3 && window.topojson) {
      this.fetchTopology();
      return;
    }

    const scriptD3 = document.createElement('script');
    scriptD3.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'; // CDNJS is more reliable than d3js.org
    scriptD3.crossOrigin = "anonymous"; 
    
    scriptD3.onload = () => {
      const scriptTopo = document.createElement('script');
      scriptTopo.src = 'https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js';
      scriptTopo.crossOrigin = "anonymous"; 
      
      scriptTopo.onload = () => this.fetchTopology();
      scriptTopo.onerror = () => this.logError('Script Error', 'Failed to load TopoJSON');
      
      this.shadowRoot.appendChild(scriptTopo);
    };
    
    scriptD3.onerror = () => this.logError('Script Error', 'Failed to load D3.js. Check CSP.');
    this.shadowRoot.appendChild(scriptD3);
  }

  // 4. FETCH DATA
  async fetchTopology() {
    this.shadowRoot.getElementById('loading').innerText = 'Downloading Map Data...';
    try {
      // Using GitHub Raw as it often has better CORS headers than unpkg
      const response = await fetch('https://raw.githubusercontent.com/d3/world-atlas/master/countries-110m.json');
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.worldData = await response.json();
      this.isD3Loaded = true;
      this.shadowRoot.getElementById('loading').style.display = 'none';
      this.renderMap();
    } catch (err) {
      this.logError('Data Fetch Error', `Could not load map data.<br>${err.message}`);
    }
  }

  renderMap() {
    if (!this.worldData || !window.d3) return;

    const svg = d3.select(this.shadowRoot.getElementById('viz'));
    svg.selectAll("*").remove(); 

    const countriesObj = topojson.feature(this.worldData, this.worldData.objects.countries);
    const projection = d3.geoMercator().fitSize([960, 500], countriesObj);
    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");

    // Draw Countries
    g.selectAll("path")
      .data(countriesObj.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "country");

    // Draw Markers
    const tooltip = d3.select(this.shadowRoot.getElementById('tooltip'));
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let recent = 0;

    const validPoints = this.mapData.filter(d => d.lat && d.lng);

    g.selectAll("circle")
      .data(validPoints)
      .enter().append("circle")
      .attr("cx", d => projection([d.lng, d.lat])[0]) 
      .attr("cy", d => projection([d.lng, d.lat])[1])
      .attr("r", 4)
      .attr("class", d => {
        const isRecent = d.timestamp && new Date(d.timestamp) > oneDayAgo;
        if(isRecent) recent++;
        return isRecent ? "marker marker-recent" : "marker marker-old";
      })
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
               .html(`<strong>${d.title || 'Visitor'}</strong><br/>${d.time || ''}`);
      })
      .on("mousemove", (event) => {
        const [x, y] = d3.pointer(event, this.shadowRoot.getElementById('container'));
        tooltip.style("left", (x + 10) + "px").style("top", (y - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    this.shadowRoot.getElementById('count-total').innerText = validPoints.length;
    this.shadowRoot.getElementById('count-recent').innerText = recent;

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [960, 500]])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);
  }
}

customElements.define('visitor-map-element', VisitorMapElement);
