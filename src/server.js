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
      "http://localhost:3000",
      "https://afsana-crm-project.netlify.app",
      "https://student-crm-g.netlify.app"
    ]
  }
});

handleSocketConnection(io);

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
