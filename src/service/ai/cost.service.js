import db from '../../config/db.js';

/**
 * AI Cost Control Service
 * Enforces daily and monthly spending limits on OpenAI usage.
 */

/**
 * Check if we are within cost limits before making an AI call
 * @returns {{ allowed: boolean, reason: string|null, usage: object }}
 */
export const checkCostLimits = async () => {
    try {
        // Get cost limits
        const [limits] = await db.query(`SELECT * FROM ai_cost_limits LIMIT 1`);
        if (limits.length === 0) {
            return { allowed: true, reason: null, usage: {} };
        }

        const config = limits[0];

        // Get today's total cost
        const [todayUsage] = await db.query(`
            SELECT COALESCE(SUM(cost_estimate), 0) as daily_cost, COUNT(*) as daily_requests
            FROM ai_logs 
            WHERE DATE(created_at) = CURDATE() AND status = 'success'
        `);

        // Get this month's total cost
        const [monthlyUsage] = await db.query(`
            SELECT COALESCE(SUM(cost_estimate), 0) as monthly_cost, COUNT(*) as monthly_requests
            FROM ai_logs 
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status = 'success'
        `);

        const dailyCost = parseFloat(todayUsage[0].daily_cost);
        const monthlyCost = parseFloat(monthlyUsage[0].monthly_cost);
        const dailyLimit = parseFloat(config.daily_limit);
        const monthlyLimit = parseFloat(config.monthly_limit);
        const isHardLimit = config.is_hard_limit === 1;

        const usage = {
            daily_cost: dailyCost,
            daily_limit: dailyLimit,
            daily_percentage: dailyLimit > 0 ? ((dailyCost / dailyLimit) * 100).toFixed(1) : 0,
            monthly_cost: monthlyCost,
            monthly_limit: monthlyLimit,
            monthly_percentage: monthlyLimit > 0 ? ((monthlyCost / monthlyLimit) * 100).toFixed(1) : 0,
            daily_requests: todayUsage[0].daily_requests,
            monthly_requests: monthlyUsage[0].monthly_requests,
        };

        // Check hard limits
        if (isHardLimit) {
            if (dailyCost >= dailyLimit) {
                return { allowed: false, reason: `Daily AI spending limit reached ($${dailyCost.toFixed(2)} / $${dailyLimit.toFixed(2)})`, usage };
            }
            if (monthlyCost >= monthlyLimit) {
                return { allowed: false, reason: `Monthly AI spending limit reached ($${monthlyCost.toFixed(2)} / $${monthlyLimit.toFixed(2)})`, usage };
            }
        }

        return { allowed: true, reason: null, usage };

    } catch (err) {
        console.error('[Cost Service] Error checking limits:', err.message);
        // Allow on error to not block AI functionality
        return { allowed: true, reason: null, usage: {} };
    }
};

/**
 * Get current cost usage summary
 */
export const getCostSummary = async () => {
    try {
        const [limits] = await db.query(`SELECT * FROM ai_cost_limits LIMIT 1`);
        const config = limits[0] || { daily_limit: 10, monthly_limit: 200 };

        const result = await checkCostLimits();
        return {
            limits: config,
            usage: result.usage,
        };
    } catch (err) {
        console.error('[Cost Service] Summary error:', err.message);
        return null;
    }
};

/**
 * Update cost limits
 */
export const updateCostLimits = async ({ daily_limit, monthly_limit, per_request_limit, alert_threshold_percent, is_hard_limit }) => {
    try {
        await db.query(
            `UPDATE ai_cost_limits SET 
                daily_limit = COALESCE(?, daily_limit),
                monthly_limit = COALESCE(?, monthly_limit),
                per_request_limit = COALESCE(?, per_request_limit),
                alert_threshold_percent = COALESCE(?, alert_threshold_percent),
                is_hard_limit = COALESCE(?, is_hard_limit)
             WHERE id = 1`,
            [daily_limit, monthly_limit, per_request_limit, alert_threshold_percent, is_hard_limit]
        );
        return true;
    } catch (err) {
        console.error('[Cost Service] Update error:', err.message);
        return false;
    }
};
