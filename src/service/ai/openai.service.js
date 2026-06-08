import axios from 'axios';
import dotenv from 'dotenv';
import { getAiConfig } from './ai_config.service.js';
import { logAiRequest } from './ai_logger.service.js';
import { checkCostLimits } from './cost.service.js';

dotenv.config();

/**
 * Centralized OpenAI Service
 * ALL OpenAI API calls MUST go through this service.
 * No direct OpenAI calls anywhere else in the codebase.
 */

// Get the API key (supports both plain and base64-encoded)
function getApiKey() {
    if (process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY;
    }
    if (process.env.ENCODED_OPENAI_API_KEY) {
        return Buffer.from(process.env.ENCODED_OPENAI_API_KEY, 'base64').toString('utf-8');
    }
    throw new Error('No OpenAI API key found in environment variables.');
}

/**
 * Main function to call OpenAI Chat Completions API
 * @param {Object} options
 * @param {Array} options.messages - Array of {role, content} objects
 * @param {string} options.module - Module name for logging (e.g., 'chat', 'scoring')
 * @param {number|null} options.userId - User ID making the request
 * @param {number|null} options.leadId - Lead ID if applicable
 * @param {Object} options.overrides - Override model/temperature/max_tokens
 * @returns {Object} { success, reply, usage, error }
 */
export const callOpenAI = async ({ messages, module = 'general', userId = null, leadId = null, overrides = {} }) => {
    try {
        // 1. Get config from database
        const config = await getAiConfig();

        // 2. Check if module is enabled
        const enabledModules = JSON.parse(config.enabled_modules || '{}');
        if (enabledModules[module] === false) {
            return { success: false, reply: null, error: `AI module "${module}" is currently disabled.` };
        }

        // 3. Check cost limits before making the call
        const costCheck = await checkCostLimits();
        if (!costCheck.allowed) {
            return { success: false, reply: null, error: costCheck.reason };
        }

        // 4. Build request parameters
        const model = overrides.model || config.model || 'gpt-4o';
        const temperature = overrides.temperature || parseFloat(config.temperature) || 0.7;
        const max_tokens = overrides.max_tokens || parseInt(config.max_tokens) || 2000;

        const apiKey = getApiKey();

        // 5. Make the API call
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model,
                messages,
                temperature,
                max_tokens,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000, // 60 second timeout
            }
        );

        const reply = response.data.choices[0].message.content;
        const usage = response.data.usage || {};

        // 6. Log the request
        await logAiRequest({
            userId,
            leadId,
            module,
            prompt: messages.map(m => `[${m.role}]: ${m.content}`).join('\n').substring(0, 5000),
            response: reply.substring(0, 5000),
            tokensUsed: usage.total_tokens || 0,
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            model,
            status: 'success',
        });

        return {
            success: true,
            reply,
            usage: {
                total_tokens: usage.total_tokens || 0,
                prompt_tokens: usage.prompt_tokens || 0,
                completion_tokens: usage.completion_tokens || 0,
            },
        };

    } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;

        // Log failed request
        await logAiRequest({
            userId,
            leadId,
            module,
            prompt: messages.map(m => `[${m.role}]: ${m.content}`).join('\n').substring(0, 5000),
            response: '',
            tokensUsed: 0,
            promptTokens: 0,
            completionTokens: 0,
            model: 'unknown',
            status: 'error',
            errorMessage: errorMsg,
        });

        console.error(`[OpenAI Service] Error in module "${module}":`, errorMsg);
        return { success: false, reply: null, error: errorMsg };
    }
};

/**
 * Convenience: Simple single-prompt call
 */
export const askAI = async (prompt, module = 'general', userId = null, leadId = null) => {
    const config = await getAiConfig();
    const systemPrompt = config.system_prompt_chat || 'You are a helpful assistant.';

    return callOpenAI({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        module,
        userId,
        leadId,
    });
};
