class VisitorMapElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['map-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'map-data' && oldValue !== newValue) {
      this.updateMarkers();
    }
  }

  // Convert latitude/longitude to SVG x,y coordinates
  latLongToXY(lat, lon) {
    // SVG viewBox: 0 0 1000 647
    const width = 1000;
    const height = 647;
    
    // Mercator projection
    const x = (lon + 180) * (width / 360);
    
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (height / 2) - (width * mercN / (2 * Math.PI));
    
    return { x, y };
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        .map-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: #f0f4f8;
        }
        svg {
          width: 100%;
          height: 100%;
        }
        path {
          fill: #e2e8f0;
          stroke: white;
          stroke-width: 0.5;
          transition: fill 0.2s;
        }
        path:hover {
          fill: #cbd5e0;
        }
        .marker {
          cursor: pointer;
          transition: all 0.3s;
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
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1000;
          display: none;
          white-space: nowrap;
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
      </style>

      <div class="map-container">
        <svg id="worldMap" enable-background="new 0 0 1000 647" viewBox="0 0 1000 647" xmlns="http://www.w3.org/2000/svg">
          <defs><style type="text/css"><![CDATA[path { fill-rule: evenodd; }]]></style></defs>
          <g id="countries">
            ${this.getSVGPaths()}
          </g>
          <g id="markers"></g>
        </svg>
        
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

    this.updateMarkers();
  }

  getSVGPaths() {
    // SVG paths from the provided map
    return `<path d="M705.095473,347.358975L703.185541,347.101503L699.259904,349.734781L698.161758,348.598999L698.420314,345.662495L696.381534,343.613834L692.809190,346.703602L691.914707,348.301657L690.980523,347.628542L688.972844,348.746781L688.125371,348.323054L686.033561,347.587345L684.488245,347.564174L683.652811,347.455957L682.344409,346.520899L681.909851,347.764979L679.572241,348.438463L679.018582,351.205398L675.266223,352.766604L674.686909,354.312810L672.595672,354.766275L669.767179,353.474360L668.636641,357.694527L667.874589,360.130031L669.081805,360.621575L667.895801,362.437648L669.021466,367.138651L671.122018,367.686762L671.349186,369.770679L668.833711,372.682517L673.480983,374.311011L680.406385,373.822025L684.010834,372.494781L684.107864,369.760841L685.653897,367.928997L692.251661,365.986526L692.098448,364.018170L693.276139,362.026616L695.041314,361.187620L693.951194,358.982338L696.589497,359.086936L697.236317,356.586326L698.617671,355.165008L697.644933,352.022243L699.264491,350.523488L706.834993,348.754680L708.449535,348.364676L707.955785,347.364479L705.095473,347.358975Z" data-name="Afghanistan" title="Afghanistan"/><path d="M533.912343,476.918513L536.711025,483.262952L535.858536,484.375514L537.129530,488.355179L537.812898,493.063148L534.668805,497.355167L532.283612,506.335245L532.544605,508.158632L535.539640,507.112288L539.410384,508.307418L550.652983,508.182051L552.574668,509.575824L559.289241,509.988263L564.386549,508.801668L562.576657,506.987947L560.705566,504.621497L560.833267,495.505393L566.608353,495.541271L566.613226,490.793957L566.320129,489.916505L565.057018,489.749969L561.447266,490.362855L561.595606,487.006235L560.466932,484.234058L560.875548,482.543134L560.262552,479.701652L553.854119,479.322996L548.460990,481.878069L545.965438,477.834577L545.281354,475.755476L537.096996,475.718592L534.176058,476.376303L533.912343,476.918513Z" data-name="Angola" title="Angola"/>`;
  }

  updateMarkers() {
    const mapData = this.getAttribute('map-data');
    if (!mapData) return;

    try {
      const locations = JSON.parse(mapData);
      const markersGroup = this.shadowRoot.getElementById('markers');
      const tooltip = this.shadowRoot.getElementById('tooltip');
      
      if (!markersGroup) return;

      // Clear existing markers
      markersGroup.innerHTML = '';

      // Calculate statistics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let recentCount = 0;
      const countries = new Set();

      // Add markers
      locations.forEach(location => {
        const { x, y } = this.latLongToXY(location.lat, location.lng);
        
        const isRecent = location.timestamp && new Date(location.timestamp) > oneDayAgo;
        if (isRecent) recentCount++;
        if (location.country) countries.add(location.country);

        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x);
        marker.setAttribute('cy', y);
        marker.setAttribute('r', '5');
        marker.setAttribute('class', `marker ${isRecent ? 'marker-recent' : 'marker-old'}`);

        // Tooltip on hover
        marker.addEventListener('mouseenter', (e) => {
          tooltip.style.display = 'block';
          tooltip.innerHTML = `
            <strong>${location.title || 'Visitor'}</strong><br>
            ${location.time || ''}<br>
            <small>Lat: ${location.lat.toFixed(2)}, Lng: ${location.lng.toFixed(2)}</small>
          `;
        });

        marker.addEventListener('mousemove', (e) => {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY + 10 + 'px';
        });

        marker.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });

        markersGroup.appendChild(marker);
      });

      // Update statistics
      this.shadowRoot.getElementById('totalCount').textContent = locations.length;
      this.shadowRoot.getElementById('countryCount').textContent = countries.size;
      this.shadowRoot.getElementById('recentCount').textContent = recentCount;

    } catch (e) {
      console.error('Error updating markers:', e);
    }
  }
}

customElements.define('visitor-map-element', VisitorMapElement);
