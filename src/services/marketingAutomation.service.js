import db from '../config/db.js';
import { sendCloudWhatsAppMessage } from './whatsappCloud.service.js';
import { getPhoneIdByBranch } from '../config/branchMapping.js';
export const runDripCampaign = async () => {
    try {
        console.log("[Marketing Automation] Starting daily drip campaign check...");

        // Find leads from inquiries table where the source is 'Whatsapp' and updated_at is in the past
        // We will check for 1, 3, 7, 14 days inactivity
        const [leads] = await db.query(`
            SELECT id, phone_number, full_name, updated_at, country, branch
            FROM inquiries
            WHERE source IN ('Whatsapp', 'WhatsApp AI')
            AND lead_status != 'Converted'
        `);

        for (const lead of leads) {
            const now = new Date();
            const lastInteraction = new Date(lead.updated_at);
            const diffTime = Math.abs(now - lastInteraction);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Difference in full days

            let campaignType = null;
            let messageText = null;

            if (diffDays === 1) {
                campaignType = 'day_1_brochure';
                messageText = `Hi ${lead.full_name}, it's been a day since we last spoke!\n\nHere is a quick *Country Guide* for ${lead.country || 'studying abroad'}. Let me know if you want to proceed with your application.\n\n🔗 Link: https://example.com/country-guide.pdf`;
            } else if (diffDays === 3) {
                campaignType = 'day_3_story';
                messageText = `Hello ${lead.full_name}!\n\nDid you know? Thousands of students successfully get their visas with Study First Info.\n\nWatch this success story video to see how we can help you achieve your dream:\n📺 https://example.com/success-video`;
            } else if (diffDays === 7) {
                campaignType = 'day_7_scholarship';
                messageText = `Hi ${lead.full_name},\n\nGreat news! Several universities are currently offering *Scholarships* for upcoming intakes.\n\nIf you want to apply, reply 'YES' and I'll connect you with an expert counselor immediately.`;
            } else if (diffDays === 14) {
                campaignType = 'day_14_assessment';
                messageText = `Hello ${lead.full_name},\n\nWe are offering a *Free Profile Assessment* this week. You can book a direct online consultation or office visit with us to discuss your options.\n\nReply 'BOOK' to schedule an appointment.`;
            }

            if (campaignType && messageText && lead.phone_number) {
                // Check if we already sent this specific campaign to this lead
                const [existingLogs] = await db.query(`
                    SELECT id FROM drip_campaign_logs 
                    WHERE lead_id = ? AND campaign_type = ?
                `, [lead.id, campaignType]);

                if (existingLogs.length === 0) {
                    // Send message via Meta Cloud API
                    const phoneId = getPhoneIdByBranch(lead.branch);
                    const success = await sendCloudWhatsAppMessage(lead.phone_number, messageText, phoneId);
                    
                    // Log the campaign
                    const status = success ? 'sent' : 'failed';
                    await db.query(`
                        INSERT INTO drip_campaign_logs (lead_id, campaign_type, status, scheduled_date, sent_date)
                        VALUES (?, ?, ?, NOW(), NOW())
                    `, [lead.id, campaignType, status]);

                    console.log(`[Drip Campaign] Sent ${campaignType} to lead ID ${lead.id} (${lead.phone_number}) via Branch: ${lead.branch}`);
                }
            }
        }
        
        console.log("[Marketing Automation] Daily check completed.");
    } catch (error) {
        console.error("[Marketing Automation] Error running drip campaign:", error);
    }
};
