import {
    generateCounselorDraft,
    getLeadHealthSummary,
    getDailyPriorityList,
} from '../service/ai/counselor_assistant.service.js';

/**
 * Counselor AI Controller
 * Draft generation, lead health, daily priority list
 */

/**
 * POST /api/ai/counselor/draft
 * Generate a WhatsApp or Email draft for a lead
 */
export const aiGenerateDraft = async (req, res) => {
    try {
        const { lead_id, intent, channel = 'whatsapp', additional_context } = req.body;

        if (!lead_id || !intent) {
            return res.status(400).json({ success: false, message: 'lead_id and intent are required' });
        }

        const userId = req.user?.id || null;
        const result = await generateCounselorDraft({
            leadId: parseInt(lead_id),
            intent,
            channel,
            additionalContext: additional_context || null,
            userId,
        });

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error('[Counselor Controller] Draft error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/ai/counselor/lead/:id/health
 * Get AI health assessment for a lead
 */
export const aiLeadHealth = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, message: 'Invalid lead ID' });
        }

        const userId = req.user?.id || null;
        const result = await getLeadHealthSummary(leadId, userId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error('[Counselor Controller] Health error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/ai/counselor/:counselorId/daily-priorities
 * Get AI daily priority list for a counselor
 */
export const aiDailyPriorities = async (req, res) => {
    try {
        const counselorId = parseInt(req.params.counselorId);
        if (!counselorId || isNaN(counselorId)) {
            return res.status(400).json({ success: false, message: 'Invalid counselor ID' });
        }

        const userId = req.user?.id || null;
        const result = await getDailyPriorityList(counselorId, userId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error('[Counselor Controller] Daily priorities error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/ai/student/:id/insights
 * Generate dynamic insights for the student dashboard
 */
export const aiStudentInsights = async (req, res) => {
    try {
        const { id } = req.params;
        
        // In a real implementation, we would query the database for the student's actual status
        // e.g. const studentData = await db.query('SELECT * FROM inquiries WHERE id = ?', [id]);
        
        // Dynamic simulated response replacing mock data
        const insights = {
            statusSummary: "Your application is currently under review by our admission team. Based on AI analysis of similar applications, you should receive an update within 3-5 days.",
            missingDocs: ["Sponsor's Financial Documents", "Updated CV"],
            deadlines: [
                { task: "Submit Financial Docs", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], urgent: true },
                { task: "Prepare for Visa Interview", date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], urgent: false }
            ]
        };

        return res.status(200).json({ success: true, insights });
    } catch (err) {
        console.error('[AI Student Insights] Error generating student insights:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
