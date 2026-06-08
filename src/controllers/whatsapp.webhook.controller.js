import db from '../config/db.js';
import { sendWhatsappTextMessage, markMessageAsRead } from '../services/whatsappApi.service.js';
import { processWhatsappMessage } from '../services/openai.crm.service.js';

// Simple in-memory rate limiter: { '919876543210': timestamp }
const rateLimiter = {};

export const verifyWhatsappWebhook = (req, res) => {
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'afsana_wa_token';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[WhatsApp Webhook] Verified');
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
    return res.status(400).send('Bad Request');
};

export const handleWhatsappMessage = async (req, res) => {
    const body = req.body;
    
    // Always return 200 immediately to prevent Meta from retrying
    res.status(200).send('EVENT_RECEIVED');

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0] && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
            const messageObj = body.entry[0].changes[0].value.messages[0];
            const metadata = body.entry[0].changes[0].value.metadata;
            
            const phone_number_id = metadata.phone_number_id;
            const from_phone = messageObj.from;
            const message_id = messageObj.id;
            const message_type = messageObj.type;

            // LOOP PROTECTION: Only process 'text' messages for now
            if (message_type !== 'text') {
                return;
            }

            const msg_body = messageObj.text.body;

            // RATE LIMITING (Max 1 response every 5 seconds per user)
            const now = Date.now();
            if (rateLimiter[from_phone] && now - rateLimiter[from_phone] < 5000) {
                console.log(`[Rate Limit] Ignored spam message from ${from_phone}`);
                return;
            }
            rateLimiter[from_phone] = now;

            try {
                // 1. Mark as read
                const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
                if (accessToken) {
                    await markMessageAsRead(phone_number_id, accessToken, message_id);
                }

                // 2. Handle Lead in DB (Duplicate Protection)
                // Note: Your schema might differ slightly, adjust if needed
                let [leads] = await db.query(`SELECT id FROM leads WHERE phone = ? LIMIT 1`, [from_phone]);
                let lead_id = null;

                if (leads.length > 0) {
                    lead_id = leads[0].id;
                    // Update interaction time
                    await db.query(`UPDATE leads SET last_interaction_time = NOW() WHERE id = ?`, [lead_id]);
                } else {
                    // Create new lead
                    const [insertResult] = await db.query(
                        `INSERT INTO leads (phone, name, email, source_platform, ai_status, last_interaction_time) VALUES (?, ?, ?, ?, ?, NOW())`, 
                        [from_phone, 'WhatsApp User', `${from_phone}@whatsapp.com`, 'whatsapp_direct', 'handled_by_ai']
                    );
                    lead_id = insertResult.insertId;
                }

                // 2.5 Ensure Chat Session Exists
                await db.query(
                    `INSERT IGNORE INTO chat_sessions (session_token, lead_id) VALUES (?, ?)`,
                    [from_phone, lead_id]
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
                // Reverse to chronological order
                history.reverse();

                // 5. Call OpenAI
                console.log(`[WhatsApp AI] Processing message for ${from_phone}...`);
                const aiResult = await processWhatsappMessage(msg_body, history);

                let replyText = "";
                if (aiResult.success) {
                    replyText = aiResult.reply;

                    // Update Lead Table with extracted JSON
                    if (aiResult.extractedData) {
                        const { lead_score, name, country } = aiResult.extractedData;
                        const updateFields = [];
                        const updateVals = [];
                        if (lead_score) { updateFields.push('lead_score = ?'); updateVals.push(lead_score); }
                        if (name && name !== 'null') { updateFields.push('name = ?'); updateVals.push(name); }
                        if (country && country !== 'null') { updateFields.push('preferred_countries = ?'); updateVals.push(country); }
                        
                        if (updateFields.length > 0) {
                            updateVals.push(lead_id);
                            await db.query(`UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`, updateVals);
                        }
                    }
                } else {
                    // Fallback
                    replyText = "Thank you for contacting Study First. We are experiencing a high volume of inquiries, one of our counselors will respond shortly.";
                }

                // 6. Send Reply via WhatsApp API
                if (accessToken && phone_number_id) {
                    await sendWhatsappTextMessage(phone_number_id, accessToken, from_phone, replyText);
                } else {
                    console.log(`[WhatsApp API Simulated] To ${from_phone}: ${replyText}`);
                }

                // 7. Save AI Reply to DB
                await db.query(
                    `INSERT INTO chat_messages (session_token, platform, sender, message) VALUES (?, ?, ?, ?)`,
                    [from_phone, 'whatsapp', 'ai', replyText]
                );

            } catch (err) {
                console.error("[WhatsApp Controller Error]:", err.message);
            }
        }
    }
};
