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

// 2. Main Route: Renders landing page and fetches ISP data
app.get('/', async (req, res) => {
  const visitorIp = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
  
  let ispName = 'Unknown ISP';
  let countryName = 'Unknown Location';
  let cityName = 'Unknown City';

  // Fetch location & network metadata from IP API
  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${visitorIp}`);
    const geoData = await geoResponse.json();
    
    if (geoData.status === 'success') {
      ispName = geoData.isp || geoData.org || 'Unknown ISP';
      countryName = geoData.country || 'Unknown Location';
      cityName = geoData.city || 'Unknown City';
    }
  } catch (error) {
    console.log('Error fetching IP data:', error.message);
  }

  // Log server-side access immediately
  console.log(`[VISITOR ALERT] IP: ${visitorIp} | Location: ${cityName}, ${countryName} | ISP: ${ispName}`);

  // Send HTML page with embedded script for client-side device checks
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
          height: 100vh;
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
      </style>
    </head>
    <body>
      <img src="https://i.kym-cdn.com/entries/icons/original/000/000/091/Trollface.png" alt="Trollface">
      <h1>You got tricked!</h1>
      <p>Greetings to someone connecting via <strong>${ispName}</strong> in <strong>${countryName}</strong>.</p>

      <script>
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

          // Read battery status if supported by browser
          if ('getBattery' in navigator) {
            try {
              const battery = await navigator.getBattery();
              payload.batteryLevel = Math.round(battery.level * 100);
              payload.isCharging = battery.charging;
            } catch (e) {
              // Ignore if blocked or unavailable
            }
          }

          // Send telemetry back to server
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

// trigger build
         
