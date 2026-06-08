import { callOpenAI } from './openai.service.js';

/**
 * Generates a follow-up draft (Email/WhatsApp) based on inquiry and past notes
 */
export const generateFollowUpDraft = async (inquiryData, previousNotes) => {
    // TODO: Construct prompt to write a personalized message
    return { status: 'success', draft: 'Draft message placeholder' };
};

/**
 * Analyzes daily tasks and suggests priorities for the counselor
 */
export const getDailyPriorities = async (counselorId) => {
    return { status: 'success', priorities: [] };
};
