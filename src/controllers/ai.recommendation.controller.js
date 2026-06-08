import {
    getCountryRecommendations,
    getAllCountryRequirements,
    getVisaRequirementsForCountry,
} from '../service/ai/country_recommendation.service.js';
import db from '../config/db.js';

/**
 * AI Recommendation Controller
 * Country recommendations, knowledge base access, visa requirements
 */

/**
 * POST /api/ai/recommend/countries
 * Body: student profile fields
 */
export const recommendCountries = async (req, res) => {
    try {
        const {
            name,
            education_level,
            gpa,
            ielts_overall,
            ielts_listening,
            ielts_reading,
            ielts_writing,
            ielts_speaking,
            pte_score,
            budget,
            study_gap,
            preferred_country,
            course,
            career_goal,
            passport_country,
            lead_id,
        } = req.body;

        const studentProfile = {
            name, education_level, gpa, ielts_overall,
            ielts_listening, ielts_reading, ielts_writing, ielts_speaking,
            pte_score, budget, study_gap, preferred_country,
            course, career_goal, passport_country,
        };

        const userId = req.user?.id || null;
        const leadId = lead_id || null;

        const result = await getCountryRecommendations(studentProfile, userId, leadId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, ...result });

    } catch (err) {
        console.error('[Recommendation Controller] Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/ai/recommend/countries-from-lead/:id
 * Recommend countries using an existing lead's profile from the DB
 */
export const recommendCountriesFromLead = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, message: 'Invalid lead ID' });
        }

        const [rows] = await db.query(`SELECT * FROM inquiries WHERE id = ?`, [leadId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Lead #${leadId} not found` });
        }

        const inquiry = rows[0];

        // Parse GPA from education_background JSON
        let gpa = null;
        if (inquiry.education_background) {
            try {
                const edu = typeof inquiry.education_background === 'string'
                    ? JSON.parse(inquiry.education_background)
                    : inquiry.education_background;
                if (Array.isArray(edu) && edu.length > 0) {
                    gpa = edu.map(e => `${e.level}: ${e.gpa || e.percentage} (${e.year})`).join(', ');
                }
            } catch { gpa = null; }
        }

        // Map to correct column names (afsana-db-3-june schema)
        const studentProfile = {
            name: inquiry.full_name,
            education_level: inquiry.study_level || inquiry.highest_level,
            gpa: gpa || `HSC: ${inquiry.hsc || 'N/A'}, SSC: ${inquiry.ssc || 'N/A'}`,
            ielts_overall: inquiry.overall_score,
            ielts_listening: inquiry.listening_score,
            ielts_reading: inquiry.reading_score,
            ielts_writing: inquiry.writing_score,
            ielts_speaking: inquiry.speaking_score,
            pte_score: (inquiry.test_type || '').toLowerCase().includes('pte') ? inquiry.overall_score : null,
            budget: inquiry.budget,
            study_gap: inquiry.study_gap,
            preferred_country: inquiry.country,
            course: inquiry.course_name,
            career_goal: inquiry.study_field || null,
            passport_country: null,
        };

        const userId = req.user?.id || null;
        const result = await getCountryRecommendations(studentProfile, userId, leadId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        return res.status(200).json({ success: true, leadId, ...result });

    } catch (err) {
        console.error('[Recommendation Controller] Lead-based error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


/**
 * GET /api/ai/countries
 * Get all countries from knowledge base
 */
export const getCountries = async (req, res) => {
    try {
        const countries = await getAllCountryRequirements();
        return res.status(200).json({ success: true, countries });
    } catch (err) {
        console.error('[Recommendation Controller] Get countries error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/ai/countries/:name/visa-requirements
 * Get visa document checklist for a country
 */
export const getVisaRequirements = async (req, res) => {
    try {
        const { name } = req.params;
        const docs = await getVisaRequirementsForCountry(decodeURIComponent(name));
        return res.status(200).json({ success: true, country: name, requirements: docs });
    } catch (err) {
        console.error('[Recommendation Controller] Visa requirements error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/ai/scholarships
 * Get scholarships, optionally filter by country
 */
export const getScholarships = async (req, res) => {
    try {
        const { country } = req.query;
        let query = `SELECT * FROM kb_scholarships WHERE is_active = 1`;
        const params = [];
        if (country) {
            query += ` AND country_name = ?`;
            params.push(country);
        }
        query += ` ORDER BY amount_usd DESC`;
        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, scholarships: rows });
    } catch (err) {
        console.error('[Recommendation Controller] Scholarships error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/ai/faq
 * Get FAQ articles, optionally filter by category
 */
export const getFaqArticles = async (req, res) => {
    try {
        const { category, q } = req.query;
        let query = `SELECT * FROM kb_faq_articles WHERE is_active = 1`;
        const params = [];
        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }
        if (q) {
            query += ` AND (question LIKE ? OR answer LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }
        query += ` ORDER BY view_count DESC, id ASC`;
        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, articles: rows });
    } catch (err) {
        console.error('[Recommendation Controller] FAQ error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/ai/eligibility
 * Dynamic Eligibility Check from Chatbot
 */
export const aiEligibilityCheck = async (req, res) => {
    try {
        const userData = req.body;
        
        // In a real scenario, we would use OpenAI or a scoring algorithm here
        // For now, we simulate a dynamic response based on the actual input
        let score = 50;
        let eligible = false;
        let insights = [];

        if (userData.ielts && parseFloat(userData.ielts) >= 6.0) {
            score += 25;
            insights.push("Your IELTS score is competitive.");
        } else {
            insights.push("Consider retaking IELTS to aim for 6.0+ for better chances.");
        }

        if (userData.budget && parseFloat(userData.budget) > 15) {
            score += 15;
            insights.push("Your budget meets the standard requirements for most countries.");
        }

        if (userData.education) {
            score += 10;
        }

        if (score > 80) score = Math.floor(Math.random() * (95 - 85 + 1) + 85);

        eligible = score >= 70;

        const result = {
            eligible,
            score,
            message: eligible ? "Great news! Your profile looks strong." : "Your profile has potential, but needs improvement.",
            insights
        };

        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error('[AI Recommendation] Error checking eligibility:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
