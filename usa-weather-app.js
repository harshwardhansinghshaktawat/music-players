class USAWeatherApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    console.log('✅ USAWeatherApp: Constructor called');
  }

  connectedCallback() {
    console.log('✅ USAWeatherApp: Connected to DOM');
    this.render();
    this.initializeApp();
  }

  render() {
    console.log('🎨 Rendering Weather App');
    
    this.shadowRoot.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .weather-container {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          color: #333;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .location-btn {
          background: white;
          border: none;
          padding: 12px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 auto 30px;
          transition: transform 0.2s;
          font-family: inherit;
        }

        .location-btn:hover {
          transform: scale(1.05);
        }

        .loading {
          text-align: center;
          color: white;
          font-size: 1.2rem;
          padding: 40px;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error {
          background: rgba(239, 68, 68, 0.95);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .alerts {
          margin-bottom: 20px;
        }

        .alert-card {
          background: rgba(239, 68, 68, 0.95);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .alert-card.warning {
          background: rgba(251, 191, 36, 0.95);
          color: #1f2937;
        }

        .alert-card h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .current-weather {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        }

        .current-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .location-name {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .current-time {
          color: #6b7280;
          font-size: 1rem;
        }

        .current-main {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .weather-icon {
          font-size: 8rem;
          line-height: 1;
        }

        .temp-display {
          flex: 1;
          min-width: 200px;
        }

        .current-temp {
          font-size: 5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 8px;
        }

        .weather-desc {
          font-size: 1.5rem;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .current-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .detail-card {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .detail-label {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .detail-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1f2937;
        }

        .section-title {
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 20px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .forecast-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .forecast-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s;
          backdrop-filter: blur(10px);
        }

        .forecast-card:hover {
          transform: translateY(-5px);
        }

        .forecast-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .forecast-day {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1f2937;
        }

        .forecast-date {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .forecast-main {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
        }

        .forecast-icon {
          font-size: 4rem;
        }

        .forecast-temp {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .forecast-desc {
          color: #4b5563;
          font-size: 1rem;
          margin-bottom: 12px;
          min-height: 48px;
        }

        .forecast-details {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .forecast-detail {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .hourly-forecast {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          overflow-x: auto;
        }

        .hourly-scroll {
          display: flex;
          gap: 16px;
          padding-bottom: 10px;
        }

        .hourly-card {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border-radius: 12px;
          padding: 20px;
          min-width: 120px;
          text-align: center;
          flex-shrink: 0;
        }

        .hourly-time {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
          font-size: 1rem;
        }

        .hourly-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .hourly-temp {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8px;
        }

        .hourly-wind {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .detail-text {
          color: #4b5563;
          line-height: 1.6;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }

          .current-weather {
            padding: 24px;
          }

          .location-name {
            font-size: 1.5rem;
          }

          .current-temp {
            font-size: 3.5rem;
          }

          .weather-icon {
            font-size: 5rem;
          }

          .forecast-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="weather-container">
        <div class="container">
          <div class="header">
            <h1>🌤️ USA Weather Forecast</h1>
            <p>Powered by National Weather Service</p>
          </div>

          <button class="location-btn" id="locationBtn">
            📍 Use My Location
          </button>

          <div id="loading" class="loading" style="display: none;">
            <div class="spinner"></div>
            <p>Loading weather data...</p>
          </div>

          <div id="error" class="error" style="display: none;"></div>

          <div id="alerts" class="alerts"></div>

          <div id="weatherContent" style="display: none;">
            <div class="current-weather" id="currentWeather"></div>

            <h2 class="section-title">7-Day Forecast</h2>
            <div class="forecast-grid" id="forecastGrid"></div>

            <h2 class="section-title">Hourly Forecast</h2>
            <div class="hourly-forecast">
              <div class="hourly-scroll" id="hourlyForecast"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeApp() {
    this.API_BASE = 'https://api.weather.gov';
    this.USER_AGENT = '(websitefreelancer.com, marshalbana@hotmail.com)';

    this.weatherIcons = {
      'clear': '☀️',
      'sunny': '☀️',
      'fair': '🌤️',
      'partly cloudy': '⛅',
      'mostly cloudy': '🌥️',
      'cloudy': '☁️',
      'overcast': '☁️',
      'rain': '🌧️',
      'showers': '🌦️',
      'thunderstorm': '⛈️',
      'snow': '🌨️',
      'sleet': '🌨️',
      'fog': '🌫️',
      'wind': '💨',
      'hot': '🌡️',
      'cold': '❄️'
    };

    // Setup event listeners
    const locationBtn = this.shadowRoot.getElementById('locationBtn');
    locationBtn.addEventListener('click', () => this.getUserLocation());

    // Auto-load weather on initialization
    this.getUserLocation();
  }

  getWeatherIcon(description) {
    if (!description) return '🌤️';
    const desc = description.toLowerCase();
    for (const [key, icon] of Object.entries(this.weatherIcons)) {
      if (desc.includes(key)) return icon;
    }
    return '🌤️';
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  showLoading() {
    this.shadowRoot.getElementById('loading').style.display = 'block';
    this.shadowRoot.getElementById('weatherContent').style.display = 'none';
    this.shadowRoot.getElementById('error').style.display = 'none';
  }

  hideLoading() {
    this.shadowRoot.getElementById('loading').style.display = 'none';
  }

  showError(message) {
    const errorDiv = this.shadowRoot.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    this.hideLoading();
  }

  async fetchWithUserAgent(url) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.USER_AGENT,
        'Accept': 'application/geo+json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  getUserLocation() {
    if ('geolocation' in navigator) {
      this.showLoading();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.getWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          this.showError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      this.showError('Geolocation is not supported by your browser.');
    }
  }

  async getWeatherByCoords(lat, lon) {
    try {
      this.showLoading();

      // Get point data
      console.log(`Fetching point data for: ${lat}, ${lon}`);
      const pointData = await this.fetchWithUserAgent(`${this.API_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
      
      if (!pointData.properties) {
        throw new Error('Invalid point data received');
      }

      const { properties } = pointData;
      const location = `${properties.relativeLocation.properties.city}, ${properties.relativeLocation.properties.state}`;

      console.log('Location:', location);

      // Fetch forecast and hourly forecast
      const [forecastData, hourlyData] = await Promise.all([
        this.fetchWithUserAgent(properties.forecast),
        this.fetchWithUserAgent(properties.forecastHourly)
      ]);

      // Fetch active alerts
      let alertsData = null;
      try {
        alertsData = await this.fetchWithUserAgent(`${this.API_BASE}/alerts/active?point=${lat},${lon}`);
      } catch (e) {
        console.warn('Could not fetch alerts:', e);
      }

      this.displayWeather(location, forecastData, hourlyData, alertsData);
      this.hideLoading();

    } catch (error) {
      console.error('Weather fetch error:', error);
      this.showError(`Unable to fetch weather data: ${error.message}. Please make sure you're in the USA.`);
    }
  }

  displayAlerts(alertsData) {
    const alertsDiv = this.shadowRoot.getElementById('alerts');
    alertsDiv.innerHTML = '';

    if (!alertsData || !alertsData.features || alertsData.features.length === 0) {
      return;
    }

    alertsData.features.forEach(alert => {
      const props = alert.properties;
      const severity = props.severity?.toLowerCase() || 'warning';
      
      const alertCard = document.createElement('div');
      alertCard.className = `alert-card ${severity === 'severe' || severity === 'extreme' ? '' : 'warning'}`;
      
      alertCard.innerHTML = `
        <h3>⚠️ ${props.event || 'Weather Alert'}</h3>
        <p><strong>Headline:</strong> ${props.headline || 'N/A'}</p>
        <p><strong>Description:</strong> ${props.description || 'No description available'}</p>
        <p style="margin-top: 12px;"><small>Effective: ${this.formatDate(props.effective)} | Expires: ${this.formatDate(props.expires)}</small></p>
      `;
      
      alertsDiv.appendChild(alertCard);
    });
  }

  displayWeather(location, forecastData, hourlyData, alertsData) {
    // Display alerts
    this.displayAlerts(alertsData);

    // Current weather (use first period)
    const current = forecastData.properties.periods[0];
    const currentWeatherDiv = this.shadowRoot.getElementById('currentWeather');
    
    currentWeatherDiv.innerHTML = `
      <div class="current-header">
        <div>
          <div class="location-name">${location}</div>
          <div class="current-time">Updated: ${this.formatDate(current.startTime)}</div>
        </div>
      </div>
      <div class="current-main">
        <div class="weather-icon">${this.getWeatherIcon(current.shortForecast)}</div>
        <div class="temp-display">
          <div class="current-temp">${current.temperature}°${current.temperatureUnit}</div>
          <div class="weather-desc">${current.shortForecast}</div>
        </div>
      </div>
      <div class="current-details">
        <div class="detail-card">
          <div class="detail-label">Wind</div>
          <div class="detail-value">${current.windSpeed}</div>
          <div class="detail-label" style="margin-top: 4px;">${current.windDirection}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Humidity</div>
          <div class="detail-value">${current.relativeHumidity?.value || 'N/A'}%</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Day/Night</div>
          <div class="detail-value">${current.isDaytime ? '☀️ Day' : '🌙 Night'}</div>
        </div>
      </div>
      <div class="detail-text">
        <p>${current.detailedForecast}</p>
      </div>
    `;

    // 7-Day forecast
    const forecastGrid = this.shadowRoot.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    forecastData.properties.periods.slice(0, 14).forEach((period, index) => {
      const card = document.createElement('div');
      card.className = 'forecast-card';
      
      card.innerHTML = `
        <div class="forecast-header">
          <div>
            <div class="forecast-day">${period.name}</div>
            <div class="forecast-date">${this.formatDate(period.startTime)}</div>
          </div>
        </div>
        <div class="forecast-main">
          <div class="forecast-icon">${this.getWeatherIcon(period.shortForecast)}</div>
          <div class="forecast-temp">${period.temperature}°${period.temperatureUnit}</div>
        </div>
        <div class="forecast-desc">${period.shortForecast}</div>
        <div class="forecast-details">
          <div class="forecast-detail">
            💨 ${period.windSpeed} ${period.windDirection}
          </div>
          ${period.probabilityOfPrecipitation?.value ? `
            <div class="forecast-detail">
              💧 ${period.probabilityOfPrecipitation.value}% rain
            </div>
          ` : ''}
        </div>
      `;
      
      forecastGrid.appendChild(card);
    });

    // Hourly forecast (next 24 hours)
    const hourlyForecast = this.shadowRoot.getElementById('hourlyForecast');
    hourlyForecast.innerHTML = '';

    hourlyData.properties.periods.slice(0, 24).forEach(hour => {
      const card = document.createElement('div');
      card.className = 'hourly-card';
      
      card.innerHTML = `
        <div class="hourly-time">${this.formatTime(hour.startTime)}</div>
        <div class="hourly-icon">${this.getWeatherIcon(hour.shortForecast)}</div>
        <div class="hourly-temp">${hour.temperature}°</div>
        <div class="hourly-wind">${hour.windSpeed}</div>
      `;
      
      hourlyForecast.appendChild(card);
    });

    this.shadowRoot.getElementById('weatherContent').style.display = 'block';
  }
}

customElements.define('usa-weather-app', USAWeatherApp);
console.log('✅ usa-weather-app custom element registered');
