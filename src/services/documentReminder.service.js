import db from '../config/db.js';
import { sendCloudWhatsAppMessage } from './whatsappCloud.service.js';
import { getPhoneIdByBranch } from '../config/branchMapping.js';

export const runDocumentReminder = async () => {
    try {
        console.log("[Document Reminder] Starting daily missing document check...");

        // Find inquiries that are active but missing essential documents
        // We assume active leads are those where lead_status is not '0' and not 'Converted'
        // And where we have their WhatsApp number.
        const [leads] = await db.query(`
            SELECT id, phone_number, full_name, passport, sop, ielts, certificates, branch
            FROM inquiries
            WHERE source IN ('Whatsapp', 'WhatsApp AI')
            AND lead_status NOT IN ('0', 'Converted', 'Rejected')
        `);

        for (const lead of leads) {
            let missingDocs = [];

            if (!lead.passport || lead.passport.trim() === '') missingDocs.push('Passport Copy');
            if (!lead.certificates || lead.certificates.trim() === '') missingDocs.push('Academic Certificates');
            // IELTS and SOP might be optional depending on country, but let's remind if empty
            if (!lead.ielts || lead.ielts.trim() === '') missingDocs.push('IELTS/PTE Scorecard');
            if (!lead.sop || lead.sop.trim() === '') missingDocs.push('SOP (Statement of Purpose)');

            if (missingDocs.length > 0 && lead.phone_number) {
                // To avoid spamming everyday, we only send reminder every 3 days.
                // We can check drip_campaign_logs for 'doc_reminder' sent recently.
                const [recentReminders] = await db.query(`
                    SELECT id FROM drip_campaign_logs 
                    WHERE lead_id = ? AND campaign_type = 'doc_reminder'
                    AND sent_date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
                `, [lead.id]);

                if (recentReminders.length === 0) {
                    const docsString = missingDocs.map(d => `- ${d}`).join('\n');
                    const messageText = `Hello ${lead.full_name},\n\nThis is an automated reminder from Study First Info. To proceed with your application smoothly, please provide the following pending documents:\n\n${docsString}\n\nYou can reply with the photos/PDFs directly in this chat!`;
                    
                    const phoneId = getPhoneIdByBranch(lead.branch);
                    const success = await sendCloudWhatsAppMessage(lead.phone_number, messageText, phoneId);
                    
                    const status = success ? 'sent' : 'failed';
                    await db.query(`
                        INSERT INTO drip_campaign_logs (lead_id, campaign_type, status, scheduled_date, sent_date)
                        VALUES (?, 'doc_reminder', ?, NOW(), NOW())
                    `, [lead.id, status]);

                    console.log(`[Document Reminder] Sent to lead ID ${lead.id} (${lead.phone_number}) via Branch: ${lead.branch}`);
                }
            }
        }

        console.log("[Document Reminder] Daily check completed.");
    } catch (error) {
        console.error("[Document Reminder] Error running document reminder:", error);
    }
};
