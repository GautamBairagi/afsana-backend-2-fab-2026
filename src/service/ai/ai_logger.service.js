import db from '../../config/db.js';

/**
 * AI Logger Service
 * Writes every AI request/response to the ai_logs table for audit and analytics.
 */

/**
 * Log an AI request to the database
 */
export const logAiRequest = async ({
    userId = null,
    leadId = null,
    module = 'general',
    prompt = '',
    response = '',
    tokensUsed = 0,
    promptTokens = 0,
    completionTokens = 0,
    model = 'gpt-4o',
    status = 'success',
    errorMessage = null,
}) => {
    try {
        // Calculate cost estimate (GPT-4o pricing: ~$2.50/1M input, ~$10/1M output)
        const inputCost = (promptTokens / 1000000) * 2.50;
        const outputCost = (completionTokens / 1000000) * 10.00;
        const costEstimate = parseFloat((inputCost + outputCost).toFixed(6));

        await db.query(
            `INSERT INTO ai_logs 
                (user_id, lead_id, module, prompt, response, tokens_used, prompt_tokens, completion_tokens, cost_estimate, model_used, status, error_message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, leadId, module, prompt, response, tokensUsed, promptTokens, completionTokens, costEstimate, model, status, errorMessage]
        );
    } catch (err) {
        console.error('[AI Logger] Failed to log AI request:', err.message);
    }
};

/**
 * Get AI usage analytics
 */
export const getAiAnalytics = async () => {
    try {
        // Total requests & tokens
        const [totals] = await db.query(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(tokens_used) as total_tokens,
                SUM(cost_estimate) as total_cost,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_requests,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_requests
            FROM ai_logs
        `);

        // Today's usage
        const [today] = await db.query(`
            SELECT 
                COUNT(*) as requests,
                COALESCE(SUM(tokens_used), 0) as tokens,
                COALESCE(SUM(cost_estimate), 0) as cost
            FROM ai_logs 
            WHERE DATE(created_at) = CURDATE()
        `);

        // This month's usage
        const [monthly] = await db.query(`
            SELECT 
                COUNT(*) as requests,
                COALESCE(SUM(tokens_used), 0) as tokens,
                COALESCE(SUM(cost_estimate), 0) as cost
            FROM ai_logs 
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        `);

        // Module-wise breakdown
        const [moduleUsage] = await db.query(`
            SELECT 
                module,
                COUNT(*) as requests,
                SUM(tokens_used) as tokens,
                SUM(cost_estimate) as cost
            FROM ai_logs
            GROUP BY module
            ORDER BY requests DESC
        `);

        // Last 7 days daily trend
        const [dailyTrend] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                SUM(tokens_used) as tokens,
                SUM(cost_estimate) as cost
            FROM ai_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        return {
            totals: totals[0],
            today: today[0],
            monthly: monthly[0],
            moduleUsage,
            dailyTrend,
        };
    } catch (err) {
        console.error('[AI Logger] Analytics error:', err.message);
        return null;
    }
};

/**
 * Get recent AI logs with pagination
 */
export const getRecentLogs = async (page = 1, limit = 20, module = null) => {
    try {
        const offset = (page - 1) * limit;
        let query = `SELECT id, user_id, lead_id, module, LEFT(prompt, 200) as prompt_preview, LEFT(response, 200) as response_preview, tokens_used, cost_estimate, model_used, status, created_at FROM ai_logs`;
        const params = [];

        if (module) {
            query += ` WHERE module = ?`;
            params.push(module);
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [logs] = await db.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM ai_logs`;
        if (module) countQuery += ` WHERE module = ?`;
        const [countResult] = await db.query(countQuery, module ? [module] : []);

        return { logs, total: countResult[0].total, page, limit };
    } catch (err) {
        console.error('[AI Logger] Get logs error:', err.message);
        return { logs: [], total: 0, page, limit };
    }
};
