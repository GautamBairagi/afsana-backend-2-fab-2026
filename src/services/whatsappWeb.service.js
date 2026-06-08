import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import db from '../config/db.js';
import { processWhatsappMessage } from './openai.crm.service.js';
import { autoAssignLead } from '../service/autoAssign.service.js';

import qrcodeImage from 'qrcode';

export let latestQR = null;

export const initializeWhatsApp = () => {
    console.log("Starting WhatsApp Web Client initialization...");
    
    // LocalAuth saves the session so you don't have to scan QR code every time server restarts
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', async (qr) => {
        console.log('\n=========================================');
        console.log('📱 SCAN THIS QR CODE WITH WHATSAPP 📱');
        console.log('=========================================\n');
        qrcode.generate(qr, { small: true });
        
        // Save QR code as image data URL for browser viewing
        try {
            latestQR = await qrcodeImage.toDataURL(qr);
        } catch (err) {
            console.error("Error generating QR code image:", err);
        }
    });

    client.on('ready', () => {
        latestQR = null; // Clear it when connected
        console.log('\n✅ WhatsApp Web AI Client is READY and CONNECTED!\n');
    });

    client.on('message', async (msg) => {
        // Ignore status messages or group messages
        if (msg.isStatus) return;
        // Check if from property exists, and check if it's a group
        if (msg.from && msg.from.includes('@g.us')) return; 

        // Extract raw phone number (e.g. 919876543210)
        const from_phone = msg.from.split('@')[0]; 
        const msg_body = msg.body;

        try {
            // 1. Handle Lead in DB (Duplicate Protection)
            let [inquiries] = await db.query(`SELECT id FROM inquiries WHERE phone_number = ? LIMIT 1`, [from_phone]);
            let inquiry_id = null;

            if (inquiries.length > 0) {
                inquiry_id = inquiries[0].id;
                await db.query(`UPDATE inquiries SET updated_at = NOW() WHERE id = ?`, [inquiry_id]);
            } else {
                // Create new lead in inquiries table
                const [insertResult] = await db.query(
                    `INSERT INTO inquiries (phone_number, full_name, email, source, inquiry_type, new_leads, date_of_inquiry) VALUES (?, ?, ?, ?, ?, ?, NOW())`, 
                    [from_phone, 'WhatsApp User', `${from_phone}@whatsapp.com`, 'Whatsapp', 'student_visa', 'New Lead']
                );
                inquiry_id = insertResult.insertId;
                
                // Auto-assign the new lead
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
            console.log(`\n[WhatsApp AI] Processing message from ${from_phone}...`);
            const aiResult = await processWhatsappMessage(msg_body, history);

            let replyText = "Thank you for contacting Study First. We will get back to you shortly.";
            if (aiResult.success) {
                replyText = aiResult.reply;

                // Update Inquiries Table with extracted JSON
                if (aiResult.extractedData) {
                    const { priority, name, country, budget, test_type, overall_score } = aiResult.extractedData;
                    const updateFields = [];
                    const updateVals = [];
                    if (priority && priority !== 'null') { updateFields.push('priority = ?'); updateVals.push(priority); }
                    if (name && name !== 'null') { updateFields.push('full_name = ?'); updateVals.push(name); }
                    if (country && country !== 'null') { updateFields.push('country = ?'); updateVals.push(country); }
                    if (budget && budget !== 'null') { updateFields.push('budget = ?'); updateVals.push(budget); }
                    if (test_type && test_type !== 'null') { updateFields.push('test_type = ?'); updateVals.push(test_type); }
                    if (overall_score && overall_score !== 'null') { updateFields.push('overall_score = ?'); updateVals.push(overall_score); }
                    
                    if (updateFields.length > 0) {
                        updateVals.push(inquiry_id);
                        await db.query(`UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`, updateVals);
                    }
                }
            }

            // 6. Send Reply back to student via WhatsApp
            await client.sendMessage(msg.from, replyText);
            console.log(`[WhatsApp AI Replied] To ${from_phone}: ${replyText.substring(0, 50)}...`);

            // 7. Save AI Reply to DB
            await db.query(
                `INSERT INTO chat_messages (session_token, platform, sender, message) VALUES (?, ?, ?, ?)`,
                [from_phone, 'whatsapp', 'ai', replyText]
            );

        } catch (err) {
            console.error('[WhatsApp Web Service Error]:', err);
        }
    });

    client.initialize();
};
