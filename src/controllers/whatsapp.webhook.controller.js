import db from '../config/db.js';
import { sendCloudWhatsAppMessage } from '../services/whatsappCloud.service.js';
import { processWhatsappMessage } from '../services/openai.crm.service.js';
import { autoAssignLead } from '../service/autoAssign.service.js';
import { getBranchByPhoneId } from '../config/branchMapping.js';

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
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
            const messageObj = body.entry[0].changes[0].value.messages[0];
            const metadata = body.entry[0].changes[0].value.metadata;
            
            const phone_number_id = metadata.display_phone_number || metadata.phone_number_id; // Usually we use phone_number_id
            const raw_phone_number_id = metadata.phone_number_id;
            const from_phone = messageObj.from;
            const message_type = messageObj.type;

            // LOOP PROTECTION: Only process 'text' messages for now
            if (message_type !== 'text') {
                return;
            }

            const msg_body = messageObj.text.body;
            const branch_name = getBranchByPhoneId(raw_phone_number_id);

            // RATE LIMITING (Max 1 response every 5 seconds per user)
            const now = Date.now();
            if (rateLimiter[from_phone] && now - rateLimiter[from_phone] < 5000) {
                console.log(`[Rate Limit] Ignored spam message from ${from_phone}`);
                return;
            }
            rateLimiter[from_phone] = now;

            try {
                // 1. Handle Lead in DB (Duplicate Protection)
                let [inquiries] = await db.query(`SELECT id FROM inquiries WHERE phone_number = ? LIMIT 1`, [from_phone]);
                let inquiry_id = null;

                if (inquiries.length > 0) {
                    inquiry_id = inquiries[0].id;
                    await db.query(`UPDATE inquiries SET updated_at = NOW(), branch = ? WHERE id = ?`, [branch_name, inquiry_id]);
                } else {
                    // Create new lead in inquiries table
                    const [insertResult] = await db.query(
                        `INSERT INTO inquiries (phone_number, full_name, email, source, inquiry_type, new_leads, date_of_inquiry, branch) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`, 
                        [from_phone, 'WhatsApp User', `${from_phone}@whatsapp.com`, 'WhatsApp AI', 'student_visa', 'New Lead', branch_name]
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
                console.log(`[WhatsApp Cloud AI] Processing message for ${from_phone} via branch ${branch_name}...`);
                const aiResult = await processWhatsappMessage(msg_body, history);

                let replyText = "";
                if (aiResult.success) {
                    replyText = aiResult.reply;

                    // Update Lead Table with extracted JSON
                    if (aiResult.extractedData) {
                        const { lead_score, name, country, appointment_date, appointment_type } = aiResult.extractedData;
                        const updateFields = [];
                        const updateVals = [];
                        
                        if (lead_score) { updateFields.push('priority = ?'); updateVals.push(lead_score); }
                        if (name && name !== 'null') { updateFields.push('full_name = ?'); updateVals.push(name); }
                        if (country && country !== 'null') { updateFields.push('country = ?'); updateVals.push(country); }
                        if (appointment_date && appointment_date !== 'null') { updateFields.push('office_visit_date = ?'); updateVals.push(appointment_date); }
                        if (appointment_type && appointment_type !== 'null') { updateFields.push('inquiry_type = ?'); updateVals.push(appointment_type); }

                        if (updateFields.length > 0) {
                            updateVals.push(inquiry_id);
                            await db.query(`UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`, updateVals);
                        }
                    }
                } else {
                    replyText = "Thank you for contacting Study First. We are experiencing a high volume of inquiries, one of our counselors will respond shortly.";
                }

                // 6. Send Reply via Meta Cloud API
                await sendCloudWhatsAppMessage(from_phone, replyText, raw_phone_number_id);

                // 7. Save AI Reply to DB
                await db.query(
                    `INSERT INTO chat_messages (session_token, platform, sender, message) VALUES (?, ?, ?, ?)`,
                    [from_phone, 'whatsapp', 'ai', replyText]
                );

            } catch (err) {
                console.error("[WhatsApp Webhook Controller Error]:", err);
            }
        }
    }
};
