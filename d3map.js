class VisitorMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapData = []; // Store data locally
    this.isD3Loaded = false;
  }

  connectedCallback() {
    console.log('✅ VisitorMapElement: Connected');
    this.loadD3();
  }

  static get observedAttributes() {
    return ['map-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'map-data' && oldValue !== newValue) {
      try {
        this.mapData = JSON.parse(newValue);
        if (this.isD3Loaded) {
          this.renderMap(); // Re-render if data changes and D3 is ready
        }
      } catch (e) {
        console.error('Error parsing map-data', e);
      }
    }
  }

  // 1. Dynamically Load D3.js and TopoJSON libraries
  loadD3() {
    // Check if D3 is already loaded in the window
    if (window.d3 && window.topojson) {
      this.init();
      return;
    }

    const scriptD3 = document.createElement('script');
    scriptD3.src = 'https://d3js.org/d3.v7.min.js';
    scriptD3.onload = () => {
      const scriptTopo = document.createElement('script');
      scriptTopo.src = 'https://unpkg.com/topojson@3';
      scriptTopo.onload = () => this.init();
      this.shadowRoot.appendChild(scriptTopo);
    };
    this.shadowRoot.appendChild(scriptD3);
  }

  // 2. Fetch Map Geometry (The "Shape" of the world)
  async init() {
    this.isD3Loaded = true;
    
    // Create base HTML structure
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; font-family: sans-serif; }
        .map-container { width: 100%; height: 100%; background: #f0f4f8; position: relative; overflow: hidden; }
        .country { fill: #e2e8f0; stroke: #fff; stroke-width: 0.5px; transition: fill 0.2s; }
        .country:hover { fill: #cbd5e0; }
        
        .marker { cursor: pointer; transition: transform 0.2s; }
        .marker:hover { transform: scale(1.5); }
        .marker-recent { fill: #48bb78; stroke: #fff; stroke-width: 1.5px; }
        .marker-old { fill: #667eea; stroke: #fff; stroke-width: 1.5px; }

        /* Floating Tooltip */
        .tooltip {
          position: absolute;
          background: rgba(26, 32, 44, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }
        
        /* Stats Panel */
        .stats {
          position: absolute; top: 10px; right: 10px;
          background: white; padding: 10px 15px;
          border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-size: 12px;
        }
        .stats h3 { margin: 0 0 5px 0; font-size: 13px; color: #2d3748; }
        .stat-row { display: flex; justify-content: space-between; margin: 3px 0; color: #718096; }
        .stat-val { font-weight: bold; color: #2d3748; }
      </style>
      
      <div class="map-container" id="container">
        <svg id="viz" width="100%" height="100%"></svg>
        <div class="tooltip" id="tooltip"></div>
        <div class="stats" id="statsPanel">
           <h3>Visitor Stats</h3>
           <div class="stat-row"><span>Total:</span> <span class="stat-val" id="count-total">0</span></div>
           <div class="stat-row"><span>Recent:</span> <span class="stat-val" id="count-recent">0</span></div>
        </div>
      </div>
    `;

    // Fetch Standard World Atlas TopoJSON (Free, Open Source Data)
    try {
      const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
      this.worldData = await response.json();
      this.renderMap();
    } catch (err) {
      console.error('Failed to load map topology', err);
    }
  }

  // 3. Render the Map and Markers mathematically
  renderMap() {
    if (!this.worldData || !window.d3) return;

    const svg = d3.select(this.shadowRoot.getElementById('viz'));
    svg.selectAll("*").remove(); // Clear previous render

    // Get container dimensions
    const container = this.shadowRoot.getElementById('container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // --- PROJECTION SETUP (The Magic Part) ---
    // GeoMercator is standard web map projection. 
    // You can switch to d3.geoNaturalEarth1() for a rounder look.
    const projection = d3.geoMercator()
      .scale(width / 6.5) // Adjust scale based on width
      .translate([width / 2, height / 1.5]); // Center the map

    const path = d3.geoPath().projection(projection);

    // Draw Countries
    const countries = topojson.feature(this.worldData, this.worldData.objects.countries);
    
    const g = svg.append("g");

    g.selectAll("path")
      .data(countries.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "country");

    // --- DRAW MARKERS ---
    const tooltip = d3.select(this.shadowRoot.getElementById('tooltip'));
    
    // Stats calculation
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let recent = 0;

    // Filter valid data
    const validPoints = this.mapData.filter(d => 
      !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0
    );

    // Draw dots
    g.selectAll("circle")
      .data(validPoints)
      .enter().append("circle")
      .attr("cx", d => projection([d.lng, d.lat])[0]) // Project [Long, Lat] -> [X, Y]
      .attr("cy", d => projection([d.lng, d.lat])[1])
      .attr("r", 5)
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
        // Tooltip follows mouse
        const [x, y] = d3.pointer(event, container);
        tooltip.style("left", (x + 10) + "px")
               .style("top", (y - 20) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Update Stats text
    this.shadowRoot.getElementById('count-total').innerText = validPoints.length;
    this.shadowRoot.getElementById('count-recent').innerText = recent;

    // Optional: Add Zoom/Pan support
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
  }
}

customElements.define('visitor-map-element', VisitorMapElement);
