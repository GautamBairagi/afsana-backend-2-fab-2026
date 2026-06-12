import express from 'express';
import { getScannerStatus, sendMessage } from '../services/whatsappScanner.service.js';
import QRCode from 'qrcode';

const router = express.Router();

router.get('/qr-status', (req, res) => {
    try {
        const { status, qr } = getScannerStatus();
        res.status(200).json({ success: true, status, qr });
    } catch (error) {
        console.error('[WhatsApp Scanner API] Error fetching status:', error);
        res.status(500).json({ success: false, error: 'Failed to get scanner status' });
    }
});

// ✅ Browser me seedha QR Code image dikhaye
router.get('/qr', async (req, res) => {
    try {
        const { status, qr } = getScannerStatus();

        if (status === 'CONNECTED') {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp Scanner</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; flex-direction: column; }
                        .box { background: #1a1a2e; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 0 30px rgba(37,211,102,0.3); }
                        h2 { color: #25d366; margin-bottom: 10px; }
                        p { color: #aaa; }
                        .badge { background: #25d366; color: white; padding: 8px 20px; border-radius: 20px; font-size: 16px; margin-top: 10px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <h2>✅ WhatsApp Connected!</h2>
                        <p>Scanner is already active and running.</p>
                        <span class="badge">🟢 CONNECTED</span>
                    </div>
                </body>
                </html>
            `);
        }

        if (!qr) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <meta charset="UTF-8">
                    <meta http-equiv="refresh" content="3">
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; flex-direction: column; }
                        .box { background: #1a1a2e; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 0 30px rgba(255,193,7,0.3); }
                        h2 { color: #ffc107; }
                        p { color: #aaa; }
                        .spinner { width: 50px; height: 50px; border: 5px solid #333; border-top: 5px solid #25d366; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
                        @keyframes spin { to { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <h2>⏳ QR Loading...</h2>
                        <div class="spinner"></div>
                        <p>WhatsApp scanner initialize ho raha hai...<br>Page auto-refresh ho raha hai.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // QR string ko image me convert karo
        const qrImageDataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>WhatsApp QR Code - Scan Now</title>
                <meta charset="UTF-8">
                <meta http-equiv="refresh" content="30">
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }
                    .card { background: #1a1a2e; border-radius: 20px; padding: 40px 50px; text-align: center; box-shadow: 0 0 40px rgba(37,211,102,0.25); border: 1px solid #25d36630; max-width: 420px; width: 90%; }
                    .logo { font-size: 36px; margin-bottom: 8px; }
                    h1 { color: #25d366; font-size: 22px; margin-bottom: 6px; }
                    .subtitle { color: #888; font-size: 14px; margin-bottom: 24px; }
                    .qr-box { background: white; padding: 16px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
                    .qr-box img { display: block; width: 300px; height: 300px; }
                    .status { margin-top: 20px; color: #ffc107; font-size: 13px; background: #ffc10718; padding: 8px 16px; border-radius: 20px; display: inline-block; }
                    .refresh { margin-top: 16px; color: #555; font-size: 12px; }
                    .steps { margin-top: 24px; text-align: left; border-top: 1px solid #ffffff15; padding-top: 20px; }
                    .steps p { color: #999; font-size: 13px; line-height: 2; }
                    .steps span { color: #25d366; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">📱</div>
                    <h1>WhatsApp Scanner</h1>
                    <p class="subtitle">Apna WhatsApp se scan karein</p>
                    <div class="qr-box">
                        <img src="${qrImageDataUrl}" alt="WhatsApp QR Code" />
                    </div>
                    <div class="status">🔄 Status: ${status}</div>
                    <p class="refresh">⏱ Page auto-refresh hoga 30 seconds me</p>
                    <div class="steps">
                        <p><span>1.</span> WhatsApp kholein</p>
                        <p><span>2.</span> Settings → Linked Devices</p>
                        <p><span>3.</span> "Link a Device" tap karein</p>
                        <p><span>4.</span> Upar wala QR scan karein ✅</p>
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('[WhatsApp Scanner API] QR page error:', error);
        res.status(500).send('QR generate karne me error aaya.');
    }
});

// ✅ POST: WhatsApp pe message bhejo
router.post('/send-message', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ success: false, error: 'phone aur message dono required hain.' });
        }

        // Phone clean karo - sirf numbers rakho
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        await sendMessage(cleanPhone, message);
        res.status(200).json({ success: true, message: `Message sent to ${cleanPhone}` });
    } catch (error) {
        console.error('[WhatsApp Send] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ GET: Browser me test karne ke liye ek sundar form
router.get('/test-ui', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp Message Tester</title>
            <meta charset="UTF-8">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
                .card { background: #1a1a2e; border-radius: 20px; padding: 40px; width: 100%; max-width: 480px; box-shadow: 0 0 40px rgba(37,211,102,0.2); border: 1px solid #25d36630; }
                .logo { text-align: center; font-size: 40px; margin-bottom: 10px; }
                h1 { text-align: center; color: #25d366; font-size: 22px; margin-bottom: 6px; }
                .sub { text-align: center; color: #666; font-size: 13px; margin-bottom: 30px; }
                label { display: block; color: #aaa; font-size: 13px; margin-bottom: 6px; margin-top: 18px; }
                input, textarea { width: 100%; background: #0d0d1a; border: 1px solid #25d36640; border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 15px; outline: none; transition: border 0.2s; }
                input:focus, textarea:focus { border-color: #25d366; }
                textarea { resize: vertical; min-height: 120px; font-family: inherit; }
                .hint { color: #555; font-size: 11px; margin-top: 5px; }
                button { width: 100%; margin-top: 24px; background: #25d366; border: none; color: white; padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; }
                button:hover { background: #1ebe57; transform: translateY(-1px); }
                button:active { transform: translateY(0); }
                .result { margin-top: 20px; padding: 14px 18px; border-radius: 10px; font-size: 14px; display: none; }
                .result.success { background: #25d36620; color: #25d366; border: 1px solid #25d36640; }
                .result.error { background: #ff525220; color: #ff5252; border: 1px solid #ff525240; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="logo">💬</div>
                <h1>WhatsApp Message Tester</h1>
                <p class="sub">Lead ko directly WhatsApp message bhejein</p>

                <label>📱 Phone Number (Country code ke saath)</label>
                <input type="text" id="phone" placeholder="e.g. 919876543210" />
                <p class="hint">Format: 91 (India) + 10 digit number, bina + ke</p>

                <label>✉️ Message</label>
                <textarea id="message" placeholder="Yahan apna message likhein...">Namaste! Afsana Consultancy ki taraf se aapko contact kar rahe hain. Kya hum aapki study abroad journey mein help kar sakte hain?</textarea>

                <button onclick="sendMsg()">🚀 Message Bhejo</button>
                <div class="result" id="result"></div>
            </div>

            <script>
                async function sendMsg() {
                    const phone = document.getElementById('phone').value.trim();
                    const message = document.getElementById('message').value.trim();
                    const resultEl = document.getElementById('result');

                    if (!phone || !message) {
                        resultEl.className = 'result error';
                        resultEl.style.display = 'block';
                        resultEl.textContent = '❌ Phone aur message dono bharo!';
                        return;
                    }

                    resultEl.className = 'result';
                    resultEl.style.display = 'block';
                    resultEl.style.background = '#ffc10720';
                    resultEl.style.color = '#ffc107';
                    resultEl.style.border = '1px solid #ffc10740';
                    resultEl.textContent = '⏳ Sending...';

                    try {
                        const res = await fetch('/api/whatsapp-scanner/send-message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone, message })
                        });
                        const data = await res.json();
                        if (data.success) {
                            resultEl.className = 'result success';
                            resultEl.textContent = '✅ Message successfully bhej diya! Number: ' + phone;
                        } else {
                            resultEl.className = 'result error';
                            resultEl.textContent = '❌ Error: ' + data.error;
                        }
                    } catch(e) {
                        resultEl.className = 'result error';
                        resultEl.textContent = '❌ Network error: ' + e.message;
                    }
                }

                // Enter key se bhi send ho
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'Enter') sendMsg();
                });
            </script>
        </body>
        </html>
    `);
});

export default router;
