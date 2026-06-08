import db from '../../config/db.js';
import { callOpenAI } from './openai.service.js';
import { getPromptTemplate } from './ai_config.service.js';

/**
 * AI Country Recommendation Service
 * Uses the country_requirements knowledge base + student profile to recommend countries via OpenAI.
 */

/**
 * Fetch all active countries from the knowledge base
 */
async function getAllCountries() {
    const [rows] = await db.query(`
        SELECT 
            country_name, ielts_min_overall, ielts_min_each, pte_min,
            budget_min_usd, budget_max_usd, visa_difficulty,
            study_gap_policy, intake_months, post_study_work, notes
        FROM country_requirements
        WHERE is_active = 1
        ORDER BY country_name
    `);
    return rows;
}

/**
 * Fetch scholarships for given countries
 */
async function getScholarshipsForCountries(countryNames) {
    if (!countryNames || countryNames.length === 0) return [];
    const placeholders = countryNames.map(() => '?').join(', ');
    const [rows] = await db.query(
        `SELECT country_name, scholarship_name, provider, amount_usd, coverage_type, min_ielts, min_gpa, deadline_notes
         FROM kb_scholarships
         WHERE is_active = 1 AND country_name IN (${placeholders})
         LIMIT 15`,
        countryNames
    );
    return rows;
}

/**
 * Build the country knowledge base context string for the prompt
 */
function buildCountryContext(countries) {
    return countries.map(c => `
Country: ${c.country_name}
- IELTS: Min Overall ${c.ielts_min_overall}, Min Each Band ${c.ielts_min_each}
- PTE: Min ${c.pte_min}
- Budget Range: $${c.budget_min_usd?.toLocaleString()} – $${c.budget_max_usd?.toLocaleString()} USD/year
- Visa Difficulty: ${c.visa_difficulty}
- Study Gap Policy: ${c.study_gap_policy}
- Intake Months: ${c.intake_months}
- Post-Study Work: ${c.post_study_work}
- Notes: ${c.notes || 'N/A'}
`.trim()).join('\n\n');
}

/**
 * Get AI-powered country recommendations for a student
 * @param {Object} studentProfile
 * @param {number|null} userId
 * @param {number|null} leadId
 * @returns {{ success, recommendations, risky, budget_analysis, reasoning, scholarships }}
 */
export const getCountryRecommendations = async (studentProfile, userId = null, leadId = null) => {
    try {
        // 1. Load countries from KB
        const countries = await getAllCountries();
        if (countries.length === 0) {
            return { success: false, error: 'No country data available in knowledge base.' };
        }

        // 2. Build prompt
        const template = await getPromptTemplate('country_recommendation', 'Country Recommendation Prompt');
        const basePrompt = template?.prompt_text || 'Recommend study abroad countries based on the student profile and available countries.';

        const countryContext = buildCountryContext(countries);
        const countryNames = countries.map(c => c.country_name).join(', ');

        const userMessage = `
${basePrompt}

AVAILABLE COUNTRIES IN OUR SYSTEM:
${countryNames}

COUNTRY DETAILS FROM KNOWLEDGE BASE:
${countryContext}

STUDENT PROFILE:
- Name: ${studentProfile.name || 'N/A'}
- Education Level: ${studentProfile.education_level || 'N/A'}
- GPA / Percentage: ${studentProfile.gpa || 'N/A'}
- IELTS Overall: ${studentProfile.ielts_overall || 'Not taken'}
- IELTS Bands (L/R/W/S): ${studentProfile.ielts_listening || '-'}/${studentProfile.ielts_reading || '-'}/${studentProfile.ielts_writing || '-'}/${studentProfile.ielts_speaking || '-'}
- PTE Score: ${studentProfile.pte_score || 'Not taken'}
- Budget (USD/year): ${studentProfile.budget || 'N/A'}
- Study Gap (years): ${studentProfile.study_gap || 0}
- Preferred Country: ${studentProfile.preferred_country || 'Open to suggestions'}
- Course of Interest: ${studentProfile.course || 'N/A'}
- Career Goal: ${studentProfile.career_goal || 'N/A'}
- Passport Country: ${studentProfile.passport_country || 'N/A'}

Return ONLY valid JSON (no markdown, no explanation):
{
  "recommended": [
    {
      "country": "<name>",
      "match_score": <0-100>,
      "reasons": ["<reason1>", "<reason2>"],
      "estimated_annual_cost_usd": <number>,
      "intake": "<months>",
      "visa_difficulty": "<Easy|Moderate|Hard|Very Hard>"
    }
  ],
  "risky": [
    {
      "country": "<name>",
      "risk_reason": "<why it's risky for this student>"
    }
  ],
  "not_recommended": ["<country1>", "<country2>"],
  "budget_analysis": "<brief budget assessment>",
  "overall_profile_assessment": "<2-3 sentences>",
  "top_recommendation": "<single best country name>",
  "reasoning": "<overall reasoning for recommendations>"
}
`.trim();

        // 3. Call AI
        const aiResult = await callOpenAI({
            messages: [
                { role: 'system', content: 'You are an expert international education counselor with deep knowledge of study abroad requirements. Always base recommendations strictly on the provided country data. Never recommend countries not listed.' },
                { role: 'user', content: userMessage },
            ],
            module: 'country_recommendation',
            userId,
            leadId,
        });

        if (!aiResult.success) {
            return { success: false, error: aiResult.error };
        }

        // 4. Parse response
        let parsed;
        try {
            const cleanJson = aiResult.reply
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/gi, '')
                .trim();
            parsed = JSON.parse(cleanJson);
        } catch {
            return { success: false, error: 'AI returned invalid JSON for country recommendations.' };
        }

        // 5. Fetch scholarships for recommended countries
        const recommendedCountryNames = (parsed.recommended || []).map(r => r.country);
        const scholarships = await getScholarshipsForCountries(recommendedCountryNames);

        return {
            success: true,
            recommended: parsed.recommended || [],
            risky: parsed.risky || [],
            not_recommended: parsed.not_recommended || [],
            budget_analysis: parsed.budget_analysis || '',
            overall_assessment: parsed.overall_profile_assessment || '',
            top_recommendation: parsed.top_recommendation || '',
            reasoning: parsed.reasoning || '',
            scholarships,
            tokens: aiResult.usage,
        };

    } catch (err) {
        console.error('[Country Recommendation] Error:', err.message);
        return { success: false, error: err.message };
    }
};

/**
 * Get all countries from knowledge base (for frontend dropdowns)
 */
export const getAllCountryRequirements = async () => {
    try {
        const [rows] = await db.query(`SELECT * FROM country_requirements WHERE is_active = 1 ORDER BY country_name`);
        return rows;
    } catch (err) {
        console.error('[Country Recommendation] Get countries error:', err.message);
        return [];
    }
};

/**
 * Get visa requirements for a country
 */
export const getVisaRequirementsForCountry = async (countryName) => {
    try {
        const [countryRows] = await db.query(
            `SELECT id FROM country_requirements WHERE country_name = ? AND is_active = 1`,
            [countryName]
        );
        if (countryRows.length === 0) return [];

        const [docs] = await db.query(
            `SELECT * FROM visa_requirements WHERE country_id = ? ORDER BY is_mandatory DESC, document_type ASC`,
            [countryRows[0].id]
        );
        return docs;
    } catch (err) {
        console.error('[Country Recommendation] Visa requirements error:', err.message);
        return [];
    }
};
