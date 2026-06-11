import express from 'express';
import { getScannerStatus } from '../services/whatsappScanner.service.js';
import QRCode from 'qrcode';

const router = express.Router();

// ✅ JSON status API
router.get('/qr-status', (req, res) => {
    try {
        const { status, qr } = getScannerStatus();
        res.status(200).json({ success: true, status, qr });
    } catch (error) {
        console.error('[WhatsApp Scanner API] Error fetching status:', error);
        res.status(500).json({ success: false, error: 'Failed to get scanner status' });
    }
});

// ✅ Browser QR page — open this URL to scan WhatsApp
router.get('/qr', async (req, res) => {
    try {
        const { status, qr } = getScannerStatus();

        if (status === 'CONNECTED') {
            return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
            <title>WhatsApp Scanner</title>
            <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0d1117;color:#fff;}
            .badge{background:#25D366;color:#fff;padding:12px 28px;border-radius:50px;font-size:20px;font-weight:bold;}</style>
            </head><body><div class="badge">✅ WhatsApp Connected!</div><p style="margin-top:16px;color:#aaa;">Status: ${status}</p></body></html>`);
        }

        if (!qr) {
            return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WhatsApp Scanner</title>
            <meta http-equiv="refresh" content="3">
            <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0d1117;color:#fff;}
            .spinner{width:48px;height:48px;border:5px solid #333;border-top-color:#25D366;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:24px;}
            @keyframes spin{to{transform:rotate(360deg);}}</style>
            </head><body><div class="spinner"></div><p>Waiting for QR Code... (auto-refreshing)</p><p style="color:#aaa;font-size:13px;">Status: ${status}</p></body></html>`);
        }

        // Generate QR as base64 PNG image
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2, color: { dark: '#000', light: '#fff' } });

        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="30">
  <title>WhatsApp QR Scanner</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0d1117;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 20px;
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #25D366;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #8b949e;
      font-size: 14px;
      text-align: center;
    }
    .qr-wrap {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
    }
    .qr-wrap img { display: block; border-radius: 8px; }
    .steps {
      color: #8b949e;
      font-size: 13px;
      line-height: 1.8;
      text-align: left;
      list-style: none;
      padding: 0;
    }
    .steps li::before { content: "👉 "; }
    .status {
      background: #21262d;
      color: #58a6ff;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
    }
    .refresh { color: #444; font-size: 11px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📱 WhatsApp Scanner</div>
    <p class="subtitle">Scan this QR code with WhatsApp to connect</p>
    <div class="qr-wrap">
      <img src="${qrDataUrl}" width="280" height="280" alt="WhatsApp QR Code" />
    </div>
    <ol class="steps">
      <li>Open WhatsApp on your phone</li>
      <li>Tap Menu → Linked Devices</li>
      <li>Tap "Link a Device" and scan</li>
    </ol>
    <span class="status">Status: ${status}</span>
    <span class="refresh">Auto-refreshes every 30 seconds</span>
  </div>
</body>
</html>`);

    } catch (error) {
        console.error('[WhatsApp QR Page] Error:', error);
        res.status(500).send('Error generating QR code');
    }
});

export default router;

