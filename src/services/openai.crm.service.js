import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// The system prompt instructs AI to be concise for WhatsApp
const WHATSAPP_SYSTEM_PROMPT = `You are a helpful study abroad assistant for "Study First Info".
CRITICAL RULES for WhatsApp:
1. Keep replies SHORT, human-like, and conversational (1-3 sentences max).
2. Do not send long paragraphs or heavy formatting.
3. Ask only ONE question at a time to keep the conversation flowing.
4. Your goal is to politely collect: Name, Country Preference, Budget, and IELTS/PTE score.
5. You MUST output a valid JSON object at the very end of your response, enclosed in triple backticks \`\`\`json ... \`\`\`. 
This JSON must contain the lead data you have gathered so far in the conversation. Use null if you don't know yet.
Example JSON format:
\`\`\`json
{
  "lead_score": 0,
  "country": null,
  "budget": null,
  "intent": "exploring",
  "priority": "cold",
  "name": null,
  "ielts": null
}
\`\`\`
Rules for JSON:
- Calculate 'lead_score' (max 100) based on how much data is collected (e.g. 25 points per field).
- Priority should be 'hot' if budget and IELTS are provided, otherwise 'warm' or 'cold'.
- Do NOT mention the JSON block in your friendly text. Hide it completely at the bottom.
`;

/**
 * Process a WhatsApp message using OpenAI and chat history
 * @param {string} newMessage - The latest message from the student
 * @param {Array} chatHistory - Array of past messages from the DB
 * @returns {Promise<Object>} The AI's text reply and extracted JSON data
 */
export const processWhatsappMessage = async (newMessage, chatHistory = []) => {
    try {
        // Format chat history for OpenAI
        const messages = [
            { role: 'system', content: WHATSAPP_SYSTEM_PROMPT },
            ...chatHistory.map(chat => ({
                role: chat.sender === 'ai' ? 'assistant' : 'user',
                content: chat.message || ''
            })),
            { role: 'user', content: newMessage }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // using the fast and smart model
            messages: messages,
            temperature: 0.7,
        });

        const fullReply = response.choices[0].message.content;

        // Extract JSON data
        let extractedData = null;
        let textReply = fullReply;

        const jsonMatch = fullReply.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                extractedData = JSON.parse(jsonMatch[1]);
                // Remove JSON from the reply shown to user
                textReply = fullReply.replace(/```json\n[\s\S]*?\n```/, '').trim();
            } catch (err) {
                console.error("[OpenAI Service] Failed to parse JSON", err.message);
            }
        }

        return {
            success: true,
            reply: textReply,
            extractedData: extractedData
        };
    } catch (error) {
        console.error('[OpenAI Service] Error processing message:', error.message);
        return { success: false, error: error.message };
    }
};
