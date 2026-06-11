import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import db from '../config/db.js';
import { processWhatsappMessage } from './openai.crm.service.js';
import { autoAssignLead } from '../service/autoAssign.service.js';

let client;

export const initWhatsAppScanner = () => {
    console.log('[WhatsApp Scanner] Initializing...');

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        }
    });

    client.on('qr', (qr) => {
        console.log('[WhatsApp Scanner] Please scan this QR code with your WhatsApp to test the AI:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('[WhatsApp Scanner] WhatsApp Client is ready and connected!');
    });

    client.on('auth_failure', msg => {
        console.error('[WhatsApp Scanner] Authentication failure:', msg);
    });

    const rateLimiter = {};

    client.on('message', async (message) => {
        // Only respond to text messages from individuals (not groups, not status)
        if (message.type !== 'chat' || message.from.includes('@g.us') || message.from === 'status@broadcast') return;

        const from_phone = message.from.split('@')[0]; // e.g. 917745921177
        const msg_body = message.body;
        const branch_name = "Dhaka"; // Defaulting to Dhaka for scanner tests

        console.log(`[WhatsApp Scanner] Received message from ${from_phone}: ${msg_body}`);

        // RATE LIMITING
        const now = Date.now();
        if (rateLimiter[from_phone] && now - rateLimiter[from_phone] < 5000) {
            console.log(`[WhatsApp Scanner] Ignored spam message from ${from_phone}`);
            return;
        }
        rateLimiter[from_phone] = now;

        try {
            // 1. Handle Lead in DB
            let [inquiries] = await db.query(`SELECT id FROM inquiries WHERE phone_number = ? LIMIT 1`, [from_phone]);
            let inquiry_id = null;

            if (inquiries.length > 0) {
                inquiry_id = inquiries[0].id;
                await db.query(`UPDATE inquiries SET updated_at = NOW(), branch = ? WHERE id = ?`, [branch_name, inquiry_id]);
            } else {
                const [insertResult] = await db.query(
                    `INSERT INTO inquiries (phone_number, full_name, email, source, inquiry_type, new_leads, date_of_inquiry, branch) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`, 
                    [from_phone, 'WhatsApp Scanner User', `${from_phone}@scanner.com`, 'WhatsApp AI', 'student_visa', 'New Lead', branch_name]
                );
                inquiry_id = insertResult.insertId;
                await autoAssignLead(inquiry_id);
            }

            // 2. Ensure Chat Session Exists
            await db.query(
                `INSERT IGNORE INTO chat_sessions (session_token, lead_id) VALUES (?, ?)`,
                [from_phone, inquiry_id]
            );

            // 3. Save incoming message
            await db.query(
                `INSERT INTO chat_messages (session_token, platform, sender, message) VALUES (?, ?, ?, ?)`,
                [from_phone, 'whatsapp', 'user', msg_body]
            );

            // 4. Fetch history (last 10 messages)
            const [history] = await db.query(
                `SELECT sender, message FROM chat_messages WHERE session_token = ? AND platform = 'whatsapp' ORDER BY id DESC LIMIT 10`,
                [from_phone]
            );
            history.reverse();

            // 5. Call OpenAI
            console.log(`[WhatsApp Scanner AI] Processing...`);
            const aiResult = await processWhatsappMessage(msg_body, history);

            if (aiResult.success && aiResult.reply) {
                // Save AI reply to DB
                await db.query(
                    `INSERT INTO chat_messages (session_token, platform, sender, message) VALUES (?, ?, ?, ?)`,
                    [from_phone, 'whatsapp', 'ai', aiResult.reply]
                );

                // Update extracted JSON data if found
                if (aiResult.extractedData) {
                    await db.query(`UPDATE chat_sessions SET extracted_data = ? WHERE session_token = ?`, [JSON.stringify(aiResult.extractedData), from_phone]);
                }

                // Send reply back to WhatsApp
                await message.reply(aiResult.reply);
                console.log(`[WhatsApp Scanner AI] Replied to ${from_phone}`);
            }

        } catch (error) {
            console.error('[WhatsApp Scanner] Error processing message:', error);
        }
    });

    client.initialize();
};
