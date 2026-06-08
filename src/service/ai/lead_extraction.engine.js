import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize OpenAI conditionally
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Uses OpenAI Function Calling / Structured Outputs to silently extract lead data
 * from the conversation history.
 * @param {Array} messages - The array of conversation messages [{role, content}]
 * @returns {Promise<Object>} The extracted lead data object
 */
export const extractLeadData = async (messages) => {
    if (!openai) {
        console.error('[AI Extraction Engine] OpenAI API Key is missing.');
        return {};
    }

    try {
        const tools = [
            {
                type: "function",
                function: {
                    name: "extract_lead_profile",
                    description: "Extract the student's profile information from the ongoing conversation. Only extract explicit information provided by the user.",
                    parameters: {
                        type: "object",
                        properties: {
                            full_name: { type: "string", description: "The full name of the student. E.g. 'Rahul Kumar'" },
                            phone: { type: "string", description: "The student's mobile number or WhatsApp number." },
                            email: { type: "string", description: "The student's email address." },
                            country_interest: { type: "string", description: "The country they want to study in. E.g. 'UK', 'USA'" },
                            ielts_score: { type: "string", description: "Their IELTS or PTE score if mentioned." },
                            budget: { type: "string", description: "Their expected budget for studying." },
                            education_level: { type: "string", description: "Their highest education level. E.g. 'BBA', 'HSC', 'BSc'" }
                        },
                        required: []
                    }
                }
            }
        ];

        // Format messages for extraction (system prompt to guide the extractor)
        const extractionMessages = [
            {
                role: "system",
                content: "You are an internal data extraction engine. Analyze the following conversation and extract the student's profile using the provided tool. Do not hallucinate data."
            },
            ...messages
        ];

        // Call OpenAI specifically for tool calling
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast model for extraction
            messages: extractionMessages,
            tools: tools,
            tool_choice: { type: "function", function: { name: "extract_lead_profile" } },
            temperature: 0.1,
        });

        // Parse tool call arguments
        const toolCall = response.choices[0]?.message?.tool_calls?.[0];
        if (toolCall && toolCall.function && toolCall.function.arguments) {
            const extractedData = JSON.parse(toolCall.function.arguments);
            return extractedData;
        }

        return {};
    } catch (error) {
        console.error('[AI Extraction Engine] Error extracting data:', error.message);
        return {};
    }
};

/**
 * Evaluates the completeness score of the extracted lead.
 * @param {Object} data 
 * @returns {Number} Score from 0 to 100
 */
export const calculateLeadCompleteness = (data) => {
    let score = 0;
    if (data.full_name) score += 20;
    if (data.phone) score += 30; // Phone is highly critical
    if (data.email) score += 10;
    if (data.country_interest) score += 10;
    if (data.ielts_score) score += 10;
    if (data.budget) score += 10;
    if (data.education_level) score += 10;
    return score;
};
