import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Send an outbound message using Meta's Official WhatsApp Cloud API
 * @param {string} to - The recipient phone number (with country code, no +)
 * @param {string} text - The message text
 * @param {string} phoneNumberId - The Phone Number ID from which to send the message
 * @returns {Promise<boolean>} True if successful
 */
export const sendCloudWhatsAppMessage = async (to, text, phoneNumberId) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        
        // If credentials are not set, fail gracefully
        if (!token || !phoneNumberId) {
            console.warn("[Meta API] Token or Phone Number ID is missing. Message not sent.");
            return false;
        }

        const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: {
                preview_url: true,
                body: text
            }
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        await axios.post(url, payload, config);
        return true;
    } catch (error) {
        console.error("[Meta API] Failed to send message:", error.response?.data || error.message);
        return false;
    }
};
