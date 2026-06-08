import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { handleSocketConnection } from './controllers/MessageCtrl.js';

const PORT = process.env.PORT || 5000;

const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      "https://apply.studyfirstinfo.com",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://afsana-crm-project.netlify.app",
      "https://student-crm-g.netlify.app"
    ]
  }
});

handleSocketConnection(io);

import { initializeWhatsApp, latestQR } from './services/whatsappWeb.service.js';
initializeWhatsApp();

app.get('/api/whatsapp/qr', (req, res) => {
  if (latestQR) {
    res.send(`
      <html>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f0f2f5; font-family:Arial;">
          <div style="background:white; padding:40px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center;">
            <h2>Scan WhatsApp QR Code</h2>
            <img src="${latestQR}" style="width:300px; height:300px; border:1px solid #ddd; padding:10px; border-radius:10px;" />
            <p style="color:#555; margin-top:20px;">Open WhatsApp on your phone and scan to link the AI CRM.</p>
          </div>
          <script>
             // Auto-refresh every 5 seconds to check if connected
             setTimeout(() => { window.location.reload(); }, 5000);
          </script>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f0f2f5; font-family:Arial;">
          <div style="background:white; padding:40px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center;">
            <h2 style="color:green;">✅ WhatsApp is Connected!</h2>
            <p>The AI Chatbot is already running. You can close this window.</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>afsana Backend</title>
        <style>
          body {
            background: linear-gradient(to right, #4facfe, #00f2fe);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
          }
          h1 {
            font-size: 3rem;
            text-align: center;
            background-color: #ffffffaa;
            padding: 20px 40px;
            border-radius: 20px;
            color: #333;
            box-shadow: 0 15px 30px rgba(0,0,0,0.2);
          }
        </style>
      </head>
      <body>
        <h1>🚀 Alvore Backend is Working! 🎉</h1>
      </body>
    </html>
  `);
});




server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
