import db from '../config/db.js';
import { callOpenAI } from '../service/ai/openai.service.js';
import { extractLeadData, calculateLeadCompleteness } from '../service/ai/lead_extraction.engine.js';
import { getAiConfig, getPromptTemplate } from '../service/ai/ai_config.service.js';
import { autoAssignLead } from '../service/autoAssign.service.js';

/**
 * Handles the conversational chatbot flow.
 * Saves memory to DB, calls AI for reply, and silently extracts lead data.
 */
export const askConversationalBot = async (req, res) => {
    const { sessionToken, message } = req.body;
    let assignedCounselor = null;

    if (!sessionToken || !message) {
        return res.status(400).json({ success: false, error: 'sessionToken and message are required' });
    }

    try {
        // 1. Ensure Session Exists
        let [sessions] = await db.execute('SELECT * FROM chat_sessions WHERE session_token = ?', [sessionToken]);
        let session = sessions[0];
        
        if (!session) {
            await db.execute('INSERT INTO chat_sessions (session_token, extracted_data) VALUES (?, ?)', [sessionToken, JSON.stringify({})]);
            [sessions] = await db.execute('SELECT * FROM chat_sessions WHERE session_token = ?', [sessionToken]);
            session = sessions[0];
        }

        // 2. Save User Message
        await db.execute('INSERT INTO chat_messages (session_token, sender, message) VALUES (?, ?, ?)', [sessionToken, 'user', message]);

        // 3. Fetch Recent Conversation History (Last 15 messages)
        const [historyRows] = await db.execute('SELECT sender, message FROM chat_messages WHERE session_token = ? ORDER BY id ASC LIMIT 15', [sessionToken]);
        
        const openAiMessages = historyRows.map(row => ({
            role: row.sender === 'user' ? 'user' : 'assistant',
            content: row.message
        }));

        // 4. Generate AI Text Reply (Natural Conversation)
        const config = await getAiConfig();
        let systemPrompt = "You are Afsana AI, a friendly Study Abroad Counselor. Chat naturally with the user. Your ultimate goal is to gently ask for their Name, Phone, Email, IELTS score, Budget, and Country preference. Ask one question at a time. Keep replies concise.";
        const template = await getPromptTemplate('chat', 'Conversational Lead Bot');
        if (template) systemPrompt = template.prompt_text;

        const chatMessages = [{ role: 'system', content: systemPrompt }, ...openAiMessages];
        
        const aiResult = await callOpenAI({
            messages: chatMessages,
            module: 'chat',
            userId: null,
        });

        const aiReplyText = aiResult.success ? aiResult.reply : "I am sorry, I am having trouble connecting to my brain right now. Can you repeat that?";

        // 5. Save AI Reply to DB
        await db.execute('INSERT INTO chat_messages (session_token, sender, message) VALUES (?, ?, ?)', [sessionToken, 'ai', aiReplyText]);

        // 6. Silently Extract Lead Data (Run in parallel/background so it doesn't block response as much, but we need it before sending response to trigger UI)
        let extractedData = session.extracted_data ? JSON.parse(session.extracted_data) : {};
        
        // Append the latest AI reply for context extraction
        const extractionMessages = [...openAiMessages, { role: 'assistant', content: aiReplyText }];
        
        const newExtraction = await extractLeadData(extractionMessages);
        
        // Merge extracted data (preferring new non-null values)
        extractedData = { ...extractedData };
        Object.keys(newExtraction).forEach(key => {
            if (newExtraction[key] && String(newExtraction[key]).trim() !== '') {
                extractedData[key] = newExtraction[key];
            }
        });

        // Save updated extraction to DB
        await db.execute('UPDATE chat_sessions SET extracted_data = ? WHERE session_token = ?', [JSON.stringify(extractedData), sessionToken]);

        // 7. Check Completeness
        const score = calculateLeadCompleteness(extractedData);
        let isLeadCreated = false;
        let crmLeadId = session.lead_id;

        // If score is high and lead not created yet, create it!
        if (score >= 80 && !crmLeadId) {
            const { full_name, phone, email, country_interest, ielts_score, budget, education_level } = extractedData;
            
            // Generate AI Summary
            const summaryPrompt = `Analyze this student profile:
Name: ${full_name || 'N/A'}
Country: ${country_interest || 'N/A'}
Budget: ${budget || 'N/A'}
IELTS: ${ielts_score || 'N/A'}
Education: ${education_level || 'N/A'}

Provide a structured summary exactly in this JSON format without markdown blocks:
{
  "concerns": "brief summary of what student needs",
  "next_steps": "what the counselor should do next",
  "probability": "High",
  "health": "Green"
}`;

            const summaryResult = await callOpenAI({
                messages: [{ role: 'system', content: 'You are an expert CRM analyzer. Reply ONLY in JSON format.' }, { role: 'user', content: summaryPrompt }],
                module: 'chat',
                userId: null
            });
            
            let ai_summary_json = null;
            if (summaryResult.success) {
                 try {
                     // Try parsing to ensure it's valid JSON
                     const parsed = JSON.parse(summaryResult.reply.replace(/```json/g, '').replace(/```/g, '').trim());
                     ai_summary_json = JSON.stringify(parsed);
                 } catch(e) {
                     ai_summary_json = JSON.stringify({ concerns: summaryResult.reply, next_steps: "Follow up immediately", probability: "Medium", health: "Yellow" });
                 }
            }

            // Generate inquiry via DB
            const source = "Conversational AI";
            const insertResult = await db.execute(
                `INSERT INTO inquiries (full_name, phone_number, email, country, budget, overall_score, study_level, source, ai_score, ai_summary) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    full_name || 'Unknown', 
                    phone || 'No Phone', 
                    email || null, 
                    country_interest || null, 
                    budget || null, 
                    ielts_score || null, 
                    education_level || null, 
                    source, 
                    score,
                    ai_summary_json
                ]
            );
            crmLeadId = insertResult[0].insertId;
            await db.execute('UPDATE chat_sessions SET lead_id = ? WHERE session_token = ?', [crmLeadId, sessionToken]);
            isLeadCreated = true;

            // Auto-Assign Counselor
            const assignResult = await autoAssignLead(crmLeadId);
            if (assignResult.success) {
                assignedCounselor = assignResult.counselor;
            }
        }

        // 8. Return response to Frontend
        return res.status(200).json({
            success: true,
            reply: aiReplyText,
            extractedData: extractedData,
            completenessScore: score,
            isLeadCreated: isLeadCreated || !!crmLeadId,
            assignedCounselor
        });

    } catch (err) {
        console.error('[Conversational AI] Error:', err);
        return res.status(500).json({ success: false, error: 'Failed to process chat', details: err.message, stack: err.stack });
    }
};
