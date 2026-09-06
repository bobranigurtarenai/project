const express = require('express');
const app = express();

app.set('trust proxy', true);

app.get('/', (req, res) => {
  const visitorIp = req.ip || req.headers['x-forwarded-for'];
  console.log(`[VISITOR ALERT] New connection from IP: ${visitorIp}`);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
        }
        img {
          max-width: 90%;
          height: auto;
          border-radius: 8px;
        }
        h1 {
          color: #333;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <img src="https://i.kym-cdn.com/entries/icons/original/000/000/091/Trollface.png" alt="Trollface">
      <h1>You got tricked!</h1>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
         
