import { callOpenAI } from '../service/ai/openai.service.js';
import { getAiConfig, getPromptTemplate } from '../service/ai/ai_config.service.js';

/**
 * AI Chat Controller (Phase 3 – Centralized Service)
 * Uses the ai_prompt_templates table for the system prompt.
 * All calls go through openai.service.js which handles logging and cost control.
 * Static FAQs retained as a fast-path for common queries.
 */

// Fast-path FAQ answers (no token cost)
const faqAnswers = {
    "what is the admission process?": "The admission process starts with student registration. After that, you can apply to multiple universities. Our counselors will guide you through each step.",
    "how can i apply to a university?": "Go to 'Apply University' in the Student Management section. Select your preferred universities and submit the forms. You can apply to multiple universities.",
    "how do i track my application?": "Go to 'Application Management' to view your submitted applications and the related documents.",
    "where do i upload documents?": "You can upload documents during the university application and visa process steps, or in the 'Student Details' section.",
    "how to pay fees?": "Go to the 'Payments & Invoices' section to view and pay your pending fees.",
    "how do i track visa process?": "Click on the 'Visa Processing' tab in your dashboard to check your current visa process stage.",
    "what is student decision?": "This section shows your admission result from universities — Accepted, Rejected, or Waitlisted.",
    "what is task management?": "It shows tasks assigned to you, such as document uploads or instructions from your counselor.",
    "i need help": "You can contact your assigned counselor directly from the dashboard, or use this chat for quick questions.",
    "how i connect to you": "Click the chat icon at the top or go to 'Communication' in the menu to message your assigned counselor.",
};

/**
 * POST /api/aichat/ask
 * Body: { message, studentName?, country?, course?, conversationHistory? }
 */
export const askAiChatbot = async (req, res) => {
    const { message, studentName, country, course, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }

    try {
        const lowerMessage = message.toLowerCase().trim();

        // Step 1: Fast-path FAQ check (zero token cost)
        if (faqAnswers[lowerMessage]) {
            return res.status(200).json({
                success: true,
                reply: faqAnswers[lowerMessage],
                source: 'faq',
            });
        }

        // Step 2: Get system prompt from DB template
        const config = await getAiConfig();
        let systemPrompt = config.system_prompt_chat || 'You are a helpful Study Abroad AI Assistant.';

        // Try to get the enhanced chat template
        const template = await getPromptTemplate('chat', 'Website Chat Assistant');
        if (template) {
            systemPrompt = template.prompt_text;
        }

        // Personalize system prompt if student context provided
        if (studentName || country || course) {
            const context = [];
            if (studentName) context.push(`Student Name: ${studentName}`);
            if (country) context.push(`Country of Interest: ${country}`);
            if (course) context.push(`Course of Interest: ${course}`);
            systemPrompt += `\n\nCurrent Student Context:\n${context.join('\n')}`;
        }

        // Step 3: Build conversation history for multi-turn
        const messages = [{ role: 'system', content: systemPrompt }];

        // Add prior conversation turns (max last 10 turns to avoid token bloat)
        const recentHistory = conversationHistory.slice(-10);
        for (const turn of recentHistory) {
            if (turn.role && turn.content) {
                messages.push({ role: turn.role, content: turn.content });
            }
        }

        // Add the current user message
        messages.push({ role: 'user', content: message });

        // Step 4: Call centralized OpenAI service
        const userId = req.user?.id || null;
        const result = await callOpenAI({
            messages,
            module: 'chat',
            userId,
        });

        if (result.success) {
            return res.status(200).json({
                success: true,
                reply: result.reply,
                source: 'ai',
                tokens: result.usage,
            });
        } else {
            return res.status(503).json({
                success: false,
                error: result.error || 'AI chatbot temporarily unavailable',
            });
        }

    } catch (err) {
        console.error('[AI Chat] Error:', err.message);
        return res.status(500).json({ success: false, error: 'AI chatbot failed to respond. Please try again.' });
    }
};
