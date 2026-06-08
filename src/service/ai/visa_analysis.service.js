import db from '../../config/db.js';
import { callOpenAI } from './openai.service.js';
import { getPromptTemplate } from './ai_config.service.js';

/**
 * Visa Analysis Service (Phase 6)
 * AI-powered visa risk analysis, interview tips, and document checklist generation.
 */

/**
 * Perform AI visa risk analysis for a student + country
 * @param {number} leadId - The inquiry ID
 * @param {string} targetCountry - Country they're applying to
 * @param {number|null} userId
 */
export const analyzeVisaRisk = async (leadId, targetCountry, userId = null) => {
    try {
        // 1. Fetch student profile
        const [leadRows] = await db.query(`SELECT * FROM inquiries WHERE id = ?`, [leadId]);
        if (leadRows.length === 0) {
            return { success: false, error: `Lead #${leadId} not found` };
        }
        const lead = leadRows[0];

        // 2. Fetch country requirements from KB
        const [countryRows] = await db.query(
            `SELECT * FROM country_requirements WHERE country_name = ? AND is_active = 1`,
            [targetCountry]
        );
        const country = countryRows[0] || null;

        // 3. Fetch visa requirements (mandatory documents)
        let visaDocs = [];
        if (country) {
            const [docRows] = await db.query(
                `SELECT document_type, is_mandatory, description FROM visa_requirements WHERE country_id = ?`,
                [country.id]
            );
            visaDocs = docRows;
        }

        const countryContext = country
            ? `
Country: ${targetCountry}
IELTS Min: ${country.ielts_min_overall} overall, ${country.ielts_min_each} per band
Budget Required: $${country.budget_min_usd?.toLocaleString()} – $${country.budget_max_usd?.toLocaleString()} USD/year
Visa Difficulty: ${country.visa_difficulty}
Study Gap Policy: ${country.study_gap_policy}
Post-Study Work: ${country.post_study_work}
`.trim()
            : `Country: ${targetCountry} (No KB data available)`;

        const docsContext = visaDocs.length > 0
            ? visaDocs.map(d => `- ${d.document_type} (${d.is_mandatory ? 'MANDATORY' : 'Optional'}): ${d.description || ''}`).join('\n')
            : 'No specific document requirements in KB.';

        // 4. Get prompt template
        const template = await getPromptTemplate('visa_analysis', 'Visa Risk Analysis Prompt');

        const userMessage = `
${template?.prompt_text || 'Analyze the visa application risk for this student.'}

TARGET COUNTRY: ${targetCountry}

COUNTRY REQUIREMENTS:
${countryContext}

REQUIRED DOCUMENTS CHECKLIST:
${docsContext}

STUDENT PROFILE:
- Name: ${lead.full_name}
- Education Level: ${lead.study_level || lead.highest_level || 'N/A'}
- HSC Score: ${lead.hsc || 'N/A'} | SSC: ${lead.ssc || 'N/A'} | Bachelor: ${lead.bachelor || 'N/A'}
- English Test: ${lead.test_type || lead.test_name || 'Not taken'}
- Overall Score: ${lead.overall_score || 'N/A'}
- Bands (L/R/W/S): ${lead.listening_score || '-'}/${lead.reading_score || '-'}/${lead.writing_score || '-'}/${lead.speaking_score || '-'}
- Budget: ${lead.budget || 'N/A'}
- Study Gap: ${lead.study_gap || 'None mentioned'}
- Visa Refused Before: ${lead.visa_refused || 'No'} — Reason: ${lead.refusal_reason || 'N/A'}
- Passport: ${lead.passport ? 'Available' : 'Not mentioned'}
- AI Lead Score: ${lead.ai_score || 'N/A'}

Return ONLY valid JSON (no markdown):
{
  "risk_level": "<Low|Medium|High|Very High>",
  "risk_score": <0-100>,
  "risk_factors": [
    {"factor": "<risk name>", "severity": "<Low|Medium|High>", "detail": "<explanation>"}
  ],
  "strengths": ["<strength1>", "<strength2>"],
  "recommendations": ["<action1>", "<action2>"],
  "interview_tips": ["<tip1>", "<tip2>", "<tip3>"],
  "document_checklist": [
    {"document": "<name>", "status": "<Required|Recommended>", "note": "<specific advice>"}
  ],
  "approval_probability": "<percentage estimate e.g. 70-80%>",
  "summary": "<2-3 sentence overall assessment>"
}
`.trim();

        const aiResult = await callOpenAI({
            messages: [
                { role: 'system', content: 'You are an expert visa consultant with deep knowledge of international student visa requirements. Never claim certainty about visa approval. Always frame recommendations as guidance, not guarantees.' },
                { role: 'user', content: userMessage },
            ],
            module: 'visa_analysis',
            userId,
            leadId,
        });

        if (!aiResult.success) {
            return { success: false, error: aiResult.error };
        }

        let parsed;
        try {
            const clean = aiResult.reply.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
            parsed = JSON.parse(clean);
        } catch {
            return { success: false, error: 'AI returned invalid visa analysis format.' };
        }

        return {
            success: true,
            leadId,
            country: targetCountry,
            ...parsed,
            disclaimer: 'This is AI-generated guidance only. Visa decisions are at the sole discretion of the relevant embassy/immigration authority. Never rely solely on this analysis.',
            tokens: aiResult.usage,
        };

    } catch (err) {
        console.error('[Visa Analysis] Error:', err.message);
        return { success: false, error: err.message };
    }
};
