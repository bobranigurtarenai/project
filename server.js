const express = require('express');
const app = express();

// Enable trust proxy so Express correctly reads headers passed by Railway
app.set('trust proxy', true);

app.get('/', (req, res) => {
  // Extract visitor IP address
  const visitorIp = req.ip || req.headers['x-forwarded-for'];

  // Log IP address to Railway output stream
  console.log(`[VISITOR ALERT] New connection from IP: ${visitorIp}`);

  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h1>Server Status: Online</h1>
        <p>Your request has been logged successfully.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
