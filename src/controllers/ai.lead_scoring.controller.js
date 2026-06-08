import { scoreLeadWithAI, getLeadScoreHistory } from '../service/ai/lead_scoring.service.js';

/**
 * AI Lead Scoring Controller
 * Exposes POST /api/inquiries/:id/ai-score
 *         GET  /api/inquiries/:id/ai-score/history
 */

/**
 * POST /api/inquiries/:id/ai-score
 * Trigger AI scoring for a specific lead
 */
export const aiScoreLead = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, message: 'Invalid lead ID' });
        }

        // userId from auth middleware if available
        const userId = req.user?.id || null;

        console.log(`[AI Score] Scoring lead #${leadId}...`);

        const result = await scoreLeadWithAI(leadId, userId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({
            success: true,
            message: `Lead #${leadId} scored successfully`,
            leadId: result.leadId,
            score: result.score,
            category: result.category,
            details: result.result,
            tokens: result.tokens,
        });

    } catch (err) {
        console.error('[AI Score Controller] Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error during AI scoring' });
    }
};

/**
 * GET /api/inquiries/:id/ai-score/history
 * Get the score history for a specific lead
 */
export const aiLeadScoreHistory = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, message: 'Invalid lead ID' });
        }

        const history = await getLeadScoreHistory(leadId);
        return res.status(200).json({ success: true, leadId, history });

    } catch (err) {
        console.error('[AI Score History Controller] Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
