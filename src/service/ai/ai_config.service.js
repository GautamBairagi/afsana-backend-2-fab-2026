import db from '../../config/db.js';

/**
 * AI Config Service
 * Reads and writes AI settings from the ai_settings table.
 * Caches settings in memory to reduce DB queries.
 */

let configCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get all AI settings as a key-value object
 */
export const getAiConfig = async () => {
    const now = Date.now();
    if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
        return configCache;
    }

    try {
        const [rows] = await db.query(`SELECT setting_key, setting_value FROM ai_settings`);
        const config = {};
        for (const row of rows) {
            config[row.setting_key] = row.setting_value;
        }
        configCache = config;
        cacheTimestamp = now;
        return config;
    } catch (err) {
        console.error('[AI Config] Error loading config:', err.message);
        // Return defaults if DB fails
        return {
            model: 'gpt-4o',
            temperature: '0.7',
            max_tokens: '2000',
            enabled_modules: '{"chat":true,"scoring":true}',
            system_prompt_chat: 'You are a helpful assistant.',
        };
    }
};

/**
 * Get a single setting value
 */
export const getAiSetting = async (key) => {
    const config = await getAiConfig();
    return config[key] || null;
};

/**
 * Update a single setting
 */
export const updateAiSetting = async (key, value, description = null) => {
    try {
        await db.query(
            `INSERT INTO ai_settings (setting_key, setting_value, description) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
            [key, value, description, value]
        );
        // Invalidate cache
        configCache = null;
        return true;
    } catch (err) {
        console.error('[AI Config] Error updating setting:', err.message);
        return false;
    }
};

/**
 * Update multiple settings at once
 */
export const updateAiSettings = async (settings) => {
    try {
        for (const [key, value] of Object.entries(settings)) {
            await db.query(
                `INSERT INTO ai_settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
                [key, value, value]
            );
        }
        configCache = null;
        return true;
    } catch (err) {
        console.error('[AI Config] Error updating settings:', err.message);
        return false;
    }
};

/**
 * Get all prompt templates
 */
export const getPromptTemplates = async (module = null) => {
    try {
        let query = `SELECT * FROM ai_prompt_templates`;
        const params = [];
        if (module) {
            query += ` WHERE module = ?`;
            params.push(module);
        }
        query += ` ORDER BY module, name`;
        const [rows] = await db.query(query, params);
        return rows;
    } catch (err) {
        console.error('[AI Config] Error loading prompts:', err.message);
        return [];
    }
};

/**
 * Get a specific prompt template by module and name
 */
export const getPromptTemplate = async (module, name) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM ai_prompt_templates WHERE module = ? AND name = ? AND is_active = 1`,
            [module, name]
        );
        return rows[0] || null;
    } catch (err) {
        console.error('[AI Config] Error loading prompt:', err.message);
        return null;
    }
};

/**
 * Create or update a prompt template
 */
export const upsertPromptTemplate = async ({ module, name, prompt_text, variables = null, is_active = 1 }) => {
    try {
        await db.query(
            `INSERT INTO ai_prompt_templates (module, name, prompt_text, variables, is_active) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE prompt_text = ?, variables = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP`,
            [module, name, prompt_text, variables, is_active, prompt_text, variables, is_active]
        );
        return true;
    } catch (err) {
        console.error('[AI Config] Error upserting prompt:', err.message);
        return false;
    }
};
