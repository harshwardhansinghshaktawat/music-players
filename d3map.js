class VisitorMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mapData = [];
    this.isD3Loaded = false;
    this.worldData = null;
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
        if (this.isD3Loaded && this.worldData) {
          this.renderMap();
        }
      } catch (e) {
        console.error('Error parsing map-data', e);
      }
    }
  }

  loadD3() {
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

  async init() {
    this.isD3Loaded = true;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        
        /* 1. Ensure container fills the Wix Widget */
        .map-container { 
          width: 100%; 
          height: 100%; 
          background: #f0f4f8; 
          position: relative; 
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* 2. SVG Responsiveness Strategy */
        svg { 
          display: block; 
          width: 100%; 
          height: 100%; 
          /* This ensures the map scales proportionally without distortion */
          max-height: 100%; 
        }
        
        .country { fill: #cbd5e0; stroke: #fff; stroke-width: 0.5px; transition: fill 0.2s; }
        .country:hover { fill: #a0aec0; }
        
        .marker { cursor: pointer; transition: transform 0.2s; }
        .marker:hover { transform: scale(1.5); }
        .marker-recent { fill: #48bb78; stroke: #fff; stroke-width: 1px; }
        .marker-old { fill: #667eea; stroke: #fff; stroke-width: 1px; }

        .tooltip {
          position: absolute;
          background: rgba(26, 32, 44, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
          white-space: nowrap;
        }
        
        .stats {
          position: absolute; top: 10px; right: 10px;
          background: rgba(255, 255, 255, 0.9); 
          padding: 8px 12px;
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-family: sans-serif; font-size: 11px;
          backdrop-filter: blur(4px);
        }
        .stats h3 { margin: 0 0 5px 0; font-size: 12px; color: #2d3748; }
        .stat-row { display: flex; justify-content: space-between; gap: 10px; margin: 2px 0; color: #718096; }
        .stat-val { font-weight: bold; color: #2d3748; }
      </style>
      
      <div class="map-container" id="container">
        <svg id="viz" viewBox="0 0 960 500" preserveAspectRatio="xMidYMid meet"></svg>
        
        <div class="tooltip" id="tooltip"></div>
        <div class="stats" id="statsPanel">
           <h3>Visitor Stats</h3>
           <div class="stat-row"><span>Total:</span> <span class="stat-val" id="count-total">0</span></div>
           <div class="stat-row"><span>Recent:</span> <span class="stat-val" id="count-recent">0</span></div>
        </div>
      </div>
    `;

    try {
      const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
      this.worldData = await response.json();
      this.renderMap();
    } catch (err) {
      console.error('Failed to load map topology', err);
    }
  }

  renderMap() {
    if (!this.worldData || !window.d3) return;

    // Use specific logical dimensions (Standard D3 aspect ratio)
    const logicalWidth = 960;
    const logicalHeight = 500;

    const svg = d3.select(this.shadowRoot.getElementById('viz'));
    svg.selectAll("*").remove(); 

    // --- PROJECTION ---
    // fitSize ensures the map fills our logical 960x500 box perfectly
    const countriesObj = topojson.feature(this.worldData, this.worldData.objects.countries);
    
    const projection = d3.geoMercator()
      .fitSize([logicalWidth, logicalHeight], countriesObj);
      
    const path = d3.geoPath().projection(projection);

    // --- DRAWING ---
    const g = svg.append("g");

    // Draw Countries
    g.selectAll("path")
      .data(countriesObj.features)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "country");

    // --- MARKERS ---
    const tooltip = d3.select(this.shadowRoot.getElementById('tooltip'));
    
    // Stats
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let recent = 0;

    const validPoints = this.mapData.filter(d => 
      !isNaN(d.lat) && !isNaN(d.lng) && d.lat !== 0 && d.lng !== 0
    );

    g.selectAll("circle")
      .data(validPoints)
      .enter().append("circle")
      .attr("cx", d => projection([d.lng, d.lat])[0]) 
      .attr("cy", d => projection([d.lng, d.lat])[1])
      .attr("r", 4) // Fixed size relative to 960px width
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
        // D3 pointer gives coordinates relative to the SVG 960x500 canvas
        // We need coordinates relative to the container for the tooltip
        const container = this.shadowRoot.getElementById('container');
        const [x, y] = d3.pointer(event, container);
        
        tooltip.style("left", (x + 10) + "px")
               .style("top", (y - 20) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    this.shadowRoot.getElementById('count-total').innerText = validPoints.length;
    this.shadowRoot.getElementById('count-recent').innerText = recent;

    // --- ZOOM BEHAVIOR ---
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [logicalWidth, logicalHeight]])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
  }
}

customElements.define('visitor-map-element', VisitorMapElement);
