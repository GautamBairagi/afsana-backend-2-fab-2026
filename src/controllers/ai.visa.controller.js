import { analyzeVisaRisk } from '../service/ai/visa_analysis.service.js';

/**
 * AI Visa Controller
 * POST /api/ai/visa/analyze/:id — Analyze visa risk for a lead
 */
export const aiVisaRiskAnalysis = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, message: 'Invalid lead ID' });
        }

        const { country } = req.body;
        if (!country || country.trim() === '') {
            return res.status(400).json({ success: false, message: 'Target country is required in request body' });
        }

        const userId = req.user?.id || null;
        const result = await analyzeVisaRisk(leadId, country.trim(), userId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, ...result });

    } catch (err) {
        console.error('[Visa Controller] Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
