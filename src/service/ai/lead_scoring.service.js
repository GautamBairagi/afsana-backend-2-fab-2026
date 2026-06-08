import db from '../../config/db.js';
import { callOpenAI } from './openai.service.js';
import { getPromptTemplate } from './ai_config.service.js';

/**
 * AI Lead Scoring Service
 * Scores a lead from 0–100 using OpenAI based on student profile fields.
 * Saves result to inquiries.ai_score + lead_score_history table.
 */

/**
 * Build a structured student profile string from an inquiry row
 * Column mapping for afsana-db-3-june schema:
 * - phone_number (not phone)
 * - overall_score (not ielts_overall) — check test_type for IELTS vs PTE
 * - listening_score, reading_score, writing_score, speaking_score
 * - study_level (not education_level)
 * - education_background (JSON array with GPA)
 * - preferred_countries (JSON array)
 */
function buildProfileSummary(inquiry) {
    // Parse GPA from education_background JSON if available
    let gpa = 'N/A';
    if (inquiry.education_background) {
        try {
            const edu = typeof inquiry.education_background === 'string'
                ? JSON.parse(inquiry.education_background)
                : inquiry.education_background;
            if (Array.isArray(edu) && edu.length > 0) {
                gpa = edu.map(e => `${e.level || ''}: ${e.gpa || e.percentage || 'N/A'} (${e.year || 'N/A'})`).join(', ');
            }
        } catch { gpa = 'N/A'; }
    }

    // Detect test type
    const testType = (inquiry.test_type || inquiry.test_name || '').toLowerCase();
    const isIelts = testType.includes('ielts') || testType === '';
    const isPte = testType.includes('pte');

    return `
Student Profile:
- Name: ${inquiry.full_name || 'N/A'}
- Phone: ${inquiry.phone_number || 'N/A'}
- Email: ${inquiry.email || 'N/A'}
- Country of Interest: ${inquiry.country || 'N/A'}
- Course: ${inquiry.course_name || 'N/A'}
- Education Level: ${inquiry.study_level || inquiry.highest_level || 'N/A'}
- Academic Scores (GPA/Percentage): ${gpa}
- HSC Score: ${inquiry.hsc || 'N/A'} | SSC: ${inquiry.ssc || 'N/A'} | Bachelor: ${inquiry.bachelor || 'N/A'}
- English Test Type: ${inquiry.test_type || inquiry.test_name || 'Not specified'}
- ${isIelts ? 'IELTS' : isPte ? 'PTE' : 'Test'} Overall: ${inquiry.overall_score || 'N/A'}
- ${isIelts ? 'IELTS' : 'Test'} Listening: ${inquiry.listening_score || 'N/A'}
- ${isIelts ? 'IELTS' : 'Test'} Reading: ${inquiry.reading_score || 'N/A'}
- ${isIelts ? 'IELTS' : 'Test'} Writing: ${inquiry.writing_score || 'N/A'}
- ${isIelts ? 'IELTS' : 'Test'} Speaking: ${inquiry.speaking_score || 'N/A'}
- Budget: ${inquiry.budget || 'N/A'}
- Study Gap: ${inquiry.study_gap || 'None mentioned'}
- Visa Refused Before: ${inquiry.visa_refused || 'No'}
- Refusal Reason: ${inquiry.refusal_reason || 'N/A'}
- Preferred Intake: ${inquiry.intake || 'N/A'}
- Inquiry Type: ${inquiry.inquiry_type || 'N/A'}
- Additional Notes: ${inquiry.additionalNotes || inquiry.notes || 'None'}
- Current Status: ${inquiry.status || 'N/A'}
- Priority: ${inquiry.priority || 'N/A'}
- Passport Available: ${inquiry.passport ? 'Yes' : 'Unknown'}
`.trim();
}


/**
 * Score a single lead using AI
 * @param {number} leadId - The inquiry ID
 * @param {number|null} userId - The user triggering the scoring (for logging)
 * @returns {{ success: boolean, score: number, category: string, result: object, error?: string }}
 */
export const scoreLeadWithAI = async (leadId, userId = null) => {
    try {
        // 1. Fetch the inquiry from DB
        const [rows] = await db.query(
            `SELECT * FROM inquiries WHERE id = ?`,
            [leadId]
        );

        if (rows.length === 0) {
            return { success: false, error: `Lead #${leadId} not found.` };
        }

        const inquiry = rows[0];

        // 2. Get prompt template from DB
        let systemPrompt = 'You are an AI lead qualification expert for an international education consultancy.';
        let userPromptTemplate = null;

        const template = await getPromptTemplate('lead_qualification', 'Lead Qualification Prompt');
        if (template) {
            userPromptTemplate = template.prompt_text;
        } else {
            // Fallback prompt
            userPromptTemplate = `Analyze the following student profile and determine their eligibility and quality as a lead for international education consultancy services.

Consider these factors:
- Academic performance (GPA/percentage)
- English proficiency (IELTS/PTE scores)
- Financial capacity (budget)
- Study gap (penalize gaps > 3 years heavily)
- Country of interest and its visa difficulty
- Course clarity and suitability
- Completeness of profile (missing fields = lower score)

Return ONLY valid JSON in this exact format (no explanation, no markdown):
{
  "score": <0-100 integer>,
  "category": "<Hot Lead|Warm Lead|Cold Lead|Low Quality>",
  "risks": ["<risk 1>", "<risk 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "next_steps": ["<action 1>", "<action 2>"],
  "reasoning": "<brief 2-3 sentence explanation>"
}

Categories:
- Hot Lead: 90-100 (Excellent profile, high conversion probability)
- Warm Lead: 70-89 (Good profile, needs some follow-up)
- Cold Lead: 40-69 (Average profile, significant effort needed)
- Low Quality: 0-39 (Incomplete or poor profile)`;
        }

        const profileSummary = buildProfileSummary(inquiry);

        // 3. Call OpenAI
        const aiResult = await callOpenAI({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${userPromptTemplate}\n\n${profileSummary}` },
            ],
            module: 'lead_qualification',
            userId,
            leadId,
        });

        if (!aiResult.success) {
            return { success: false, error: aiResult.error };
        }

        // 4. Parse JSON response
        let parsed;
        try {
            // Strip markdown code blocks if present
            const cleanJson = aiResult.reply
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/gi, '')
                .trim();
            parsed = JSON.parse(cleanJson);
        } catch (parseErr) {
            console.error('[Lead Scoring] Failed to parse AI response:', aiResult.reply);
            return { success: false, error: 'AI returned invalid JSON. Raw: ' + aiResult.reply.substring(0, 200) };
        }

        const score = parseInt(parsed.score) || 0;
        const category = parsed.category || 'Cold Lead';
        const reasoning = parsed.reasoning || '';
        const fullSummary = `Score: ${score} | Category: ${category} | ${reasoning}`;

        // 5. Save score to inquiries table
        await db.query(
            `UPDATE inquiries SET ai_score = ?, ai_summary = ? WHERE id = ?`,
            [score, fullSummary, leadId]
        );

        // 6. Insert into lead_score_history
        await db.query(
            `INSERT INTO lead_score_history (lead_id, score, category, reason, scored_by) VALUES (?, ?, ?, ?, 'ai')`,
            [leadId, score, category, JSON.stringify({
                reasoning,
                risks: parsed.risks || [],
                strengths: parsed.strengths || [],
                next_steps: parsed.next_steps || [],
            })]
        );

        return {
            success: true,
            leadId,
            score,
            category,
            result: {
                score,
                category,
                risks: parsed.risks || [],
                strengths: parsed.strengths || [],
                next_steps: parsed.next_steps || [],
                reasoning,
            },
            tokens: aiResult.usage,
        };

    } catch (err) {
        console.error('[Lead Scoring] Unexpected error:', err.message);
        return { success: false, error: err.message };
    }
};

/**
 * Get score history for a lead
 * @param {number} leadId
 */
export const getLeadScoreHistory = async (leadId) => {
    try {
        const [rows] = await db.query(
            `SELECT id, lead_id, score, category, reason, scored_by, created_at 
             FROM lead_score_history 
             WHERE lead_id = ? 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [leadId]
        );

        // Parse reason JSON for each row
        return rows.map(row => ({
            ...row,
            reason: (() => {
                try { return JSON.parse(row.reason); }
                catch { return row.reason; }
            })()
        }));
    } catch (err) {
        console.error('[Lead Scoring] Score history error:', err.message);
        return [];
    }
};
