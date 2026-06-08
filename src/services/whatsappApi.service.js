import axios from 'axios';

const META_API_URL = 'https://graph.facebook.com/v19.0';

/**
 * Send a plain text message to a user via WhatsApp Cloud API
 * @param {string} phoneNumberId - The sender's Meta Phone Number ID
 * @param {string} accessToken - Meta System User Access Token
 * @param {string} toPhoneNumber - Recipient's phone number (with country code, no +)
 * @param {string} textMessage - The message content
 * @returns {Promise<Object>} Response from Meta API
 */
export const sendWhatsappTextMessage = async (phoneNumberId, accessToken, toPhoneNumber, textMessage) => {
    try {
        const response = await axios({
            method: 'POST',
            url: `${META_API_URL}/${phoneNumberId}/messages`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: toPhoneNumber,
                type: 'text',
                text: {
                    preview_url: false,
                    body: textMessage
                }
            }
        });
        console.log(`[WhatsApp API] Sent message to ${toPhoneNumber}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('[WhatsApp API] Error sending text message:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (phoneNumberId, accessToken, messageId) => {
    try {
        await axios({
            method: 'POST',
            url: `${META_API_URL}/${phoneNumberId}/messages`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            }
        });
    } catch (error) {
        console.error('[WhatsApp API] Error marking as read:', error.message);
    }
};
