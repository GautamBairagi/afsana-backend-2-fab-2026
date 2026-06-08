import express from 'express';
import {
    getSettings,
    updateSettings,
    getAnalytics,
    getLogs,
    getPrompts,
    createOrUpdatePrompt,
    getCosts,
    updateCosts,
} from '../controllers/ai.settings.controller.js';
import {
    recommendCountries,
    recommendCountriesFromLead,
    getCountries,
    getVisaRequirements,
    getScholarships,
    getFaqArticles,
    aiEligibilityCheck
} from '../controllers/ai.recommendation.controller.js';
import {
    aiGenerateDraft,
    aiLeadHealth,
    aiDailyPriorities,
    aiStudentInsights
} from '../controllers/ai.counselor.controller.js';
import { aiVisaRiskAnalysis } from '../controllers/ai.visa.controller.js';

const router = express.Router();

// ─────────────────────────────────────────────
// AI Settings
// ─────────────────────────────────────────────
router.get('/ai/settings', getSettings);
router.put('/ai/settings', updateSettings);

// ─────────────────────────────────────────────
// AI Analytics & Logs
// ─────────────────────────────────────────────
router.get('/ai/analytics', getAnalytics);
router.get('/ai/logs', getLogs);

// ─────────────────────────────────────────────
// AI Prompt Templates
// ─────────────────────────────────────────────
router.get('/ai/prompts', getPrompts);
router.post('/ai/prompts', createOrUpdatePrompt);

// ─────────────────────────────────────────────
// AI Cost Control
// ─────────────────────────────────────────────
router.get('/ai/costs', getCosts);
router.put('/ai/costs', updateCosts);

// ─────────────────────────────────────────────
// AI Country Recommendations
// ─────────────────────────────────────────────
router.post('/ai/recommend/countries', recommendCountries);                          // From raw profile
router.post('/ai/recommend/countries-from-lead/:id', recommendCountriesFromLead);   // From existing lead
router.post('/ai/eligibility', aiEligibilityCheck);                                  // Eligibility Check from chatbot

// ─────────────────────────────────────────────
// Knowledge Base APIs
// ─────────────────────────────────────────────
router.get('/ai/countries', getCountries);                                            // List all countries
router.get('/ai/countries/:name/visa-requirements', getVisaRequirements);            // Visa docs by country
router.get('/ai/scholarships', getScholarships);                                      // List scholarships
router.get('/ai/faq', getFaqArticles);                                               // Search FAQ articles

// ─────────────────────────────────────────────
// AI Counselor & Student Assistant
// ─────────────────────────────────────────────
router.post('/ai/counselor/draft', aiGenerateDraft);                                   // Generate WhatsApp/Email draft
router.get('/ai/counselor/lead/:id/health', aiLeadHealth);                            // Lead health assessment
router.get('/ai/counselor/:counselorId/daily-priorities', aiDailyPriorities);         // Daily priority list
router.get('/ai/student/:id/insights', aiStudentInsights);                            // Student Dashboard AI Insights

// ─────────────────────────────────────────────
// AI Visa Analysis (Phase 6)
// ─────────────────────────────────────────────
router.post('/ai/visa/analyze/:id', aiVisaRiskAnalysis);  // AI visa risk for a lead

export default router;
