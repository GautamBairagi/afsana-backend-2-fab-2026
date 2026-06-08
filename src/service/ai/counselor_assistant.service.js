import db from '../../config/db.js';
import { callOpenAI } from './openai.service.js';
import { getPromptTemplate } from './ai_config.service.js';

/**
 * Counselor AI Assistant Service
 * Generates WhatsApp/Email drafts, lead health summaries, daily priority lists.
 */

// ──────────────────────────────────────────────────
// DRAFT GENERATION
// ──────────────────────────────────────────────────

/**
 * Generate a WhatsApp/Email draft message for a counselor to send to a student
 * @param {Object} options
 * @param {number} options.leadId - Inquiry/lead ID
 * @param {string} options.intent - e.g., "follow-up", "document reminder", "welcome message", "appointment confirmation"
 * @param {string} options.channel - "whatsapp" | "email"
 * @param {string|null} options.additionalContext - Any extra context from the counselor
 * @param {number|null} options.userId
 */
export const generateCounselorDraft = async ({ leadId, intent, channel = 'whatsapp', additionalContext = null, userId = null }) => {
    try {
        // Fetch lead profile — using correct column names for afsana-db-3-june
        const [rows] = await db.query(
            `SELECT full_name, phone_number, email, country, course_name, status, ai_score, ai_summary FROM inquiries WHERE id = ?`,
            [leadId]
        );
        if (rows.length === 0) {
            return { success: false, error: `Lead #${leadId} not found` };
        }
        const lead = rows[0];

        // Get prompt template
        const template = await getPromptTemplate('counselor_draft', 'Counselor Email/WhatsApp Draft');
        const baseInstruction = template?.prompt_text || 'Draft a professional and friendly message for the counselor.';

        const channelGuidance = channel === 'whatsapp'
            ? 'Format for WhatsApp: Keep it short (max 3 paragraphs), conversational, no HTML. Use line breaks.'
            : 'Format for Email: Include a proper subject line. Use professional tone. Can be longer.';

        const userMessage = `
${baseInstruction}

${channelGuidance}

STUDENT INFORMATION:
- Name: ${lead.full_name}
- Phone: ${lead.phone_number || 'N/A'}
- Email: ${lead.email || 'N/A'}
- Interested in: ${lead.course_name || 'N/A'} in ${lead.country || 'N/A'}
- Current Status: ${lead.status || 'N/A'}
- AI Lead Score: ${lead.ai_score || 'Not scored'}
- AI Summary: ${lead.ai_summary || 'N/A'}

INTENT: ${intent}
${additionalContext ? `\nADDITIONAL CONTEXT FROM COUNSELOR:\n${additionalContext}` : ''}

${channel === 'email'
    ? 'Return JSON: {"subject": "<email subject>", "body": "<email body>"}'
    : 'Return JSON: {"message": "<whatsapp message>"}'
}
`.trim();

        const aiResult = await callOpenAI({
            messages: [
                { role: 'system', content: 'You are an expert education counselor assistant. Write natural, effective messages that build rapport and drive student action.' },
                { role: 'user', content: userMessage },
            ],
            module: 'counselor_draft',
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
            // Return raw text if JSON parse fails
            return {
                success: true,
                draft: { message: aiResult.reply },
                channel,
                tokens: aiResult.usage,
            };
        }

        return {
            success: true,
            draft: parsed,
            channel,
            tokens: aiResult.usage,
        };

    } catch (err) {
        console.error('[Counselor Assistant] Draft error:', err.message);
        return { success: false, error: err.message };
    }
};

// ──────────────────────────────────────────────────
// LEAD HEALTH SUMMARY
// ──────────────────────────────────────────────────

/**
 * Generate an AI health summary for a lead (active/needs attention/at risk)
 * @param {number} leadId
 * @param {number|null} userId
 */
export const getLeadHealthSummary = async (leadId, userId = null) => {
    try {
        // Get lead + recent activity — correct columns for afsana-db-3-june
        const [leadRows] = await db.query(
            `SELECT i.id, i.full_name, i.status, i.priority, i.country, i.course_name,
                    i.ai_score, i.ai_summary,
                    fh.last_followup_date, fh.next_followup_date
             FROM inquiries i
             LEFT JOIN followuphistory fh ON fh.inquiry_id = i.id
             WHERE i.id = ? LIMIT 1`,
            [leadId]
        );

        if (leadRows.length === 0) {
            return { success: false, error: `Lead #${leadId} not found` };
        }
        const lead = leadRows[0];

        // Get recent follow-ups
        const [recentFollowups] = await db.query(
            `SELECT created_at, note FROM followuphistory WHERE inquiry_id = ? ORDER BY created_at DESC LIMIT 5`,
            [leadId]
        );

        const followupSummary = recentFollowups.length > 0
            ? recentFollowups.map(f => `[${f.created_at?.toISOString?.()?.split('T')[0] || 'unknown date'}]: ${f.note || 'No note'}`).join('\n')
            : 'No follow-up history found.';

        const daysSinceLastFollowup = lead.last_followup_date
            ? Math.floor((Date.now() - new Date(lead.last_followup_date).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        const userMessage = `
Analyze this student lead and provide a health assessment.

LEAD PROFILE:
- Name: ${lead.full_name}
- Status: ${lead.status}
- Priority: ${lead.priority || 'Normal'}
- AI Score: ${lead.ai_score || 'Not scored'}
- Country Interest: ${lead.country}
- Course: ${lead.course_name}
- Days Since Last Follow-up: ${daysSinceLastFollowup !== null ? daysSinceLastFollowup : 'Unknown'}
- Next Follow-up Date: ${lead.next_followup_date || 'Not scheduled'}

RECENT ACTIVITY:
${followupSummary}

Return JSON:
{
  "health_status": "<Green|Yellow|Red>",
  "health_label": "<Active|Needs Attention|At Risk>",
  "summary": "<2-3 sentence summary of lead health>",
  "action_required": "<specific next action counselor should take>",
  "urgency": "<Low|Medium|High|Critical>",
  "risk_factors": ["<risk1>", "<risk2>"],
  "positive_signals": ["<signal1>", "<signal2>"]
}
`.trim();

        const aiResult = await callOpenAI({
            messages: [
                { role: 'system', content: 'You are a CRM lead health analyst. Provide clear, actionable assessments for counselors.' },
                { role: 'user', content: userMessage },
            ],
            module: 'counselor_health',
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
            return { success: false, error: 'AI returned invalid health summary format.' };
        }

        return { success: true, leadId, ...parsed, tokens: aiResult.usage };

    } catch (err) {
        console.error('[Counselor Assistant] Health summary error:', err.message);
        return { success: false, error: err.message };
    }
};

// ──────────────────────────────────────────────────
// DAILY PRIORITY LIST
// ──────────────────────────────────────────────────

/**
 * Generate a counselor's daily AI priority list
 * @param {number} counselorId
 * @param {number|null} userId
 */
export const getDailyPriorityList = async (counselorId, userId = null) => {
    try {
        // Get counselor's active leads — correct column names for afsana-db-3-june
        const [leads] = await db.query(
            `SELECT i.id, i.full_name, i.phone_number, i.country, i.course_name, i.status,
                    i.ai_score, i.priority, i.created_at,
                    fh.last_followup_date, fh.next_followup_date
             FROM inquiries i
             LEFT JOIN followuphistory fh ON fh.inquiry_id = i.id
             WHERE i.counselor_id = ?
             AND i.status NOT IN ('Closed', 'Rejected', 'Lost')
             ORDER BY i.ai_score DESC, i.priority DESC, fh.next_followup_date ASC
             LIMIT 20`,
            [counselorId]
        );

        if (leads.length === 0) {
            return { success: true, priorities: [], message: 'No active leads found.' };
        }

        const leadsContext = leads.map((l, i) => {
            const daysSince = l.last_followup_date
                ? Math.floor((Date.now() - new Date(l.last_followup_date).getTime()) / (1000 * 60 * 60 * 24))
                : 'Never';
            return `${i + 1}. [Lead #${l.id}] ${l.full_name} | Score: ${l.ai_score || 'N/A'} | Status: ${l.status} | Country: ${l.country} | Last Contact: ${daysSince} days ago | Next Follow-up: ${l.next_followup_date || 'Not set'}`;
        }).join('\n');

        const aiResult = await callOpenAI({
            messages: [
                { role: 'system', content: 'You are an AI productivity assistant for education counselors. Create clear, actionable daily priority lists.' },
                { role: 'user', content: `Based on this counselor's active leads, create a prioritized action plan for today.\n\nLEADS:\n${leadsContext}\n\nReturn JSON: {"priorities": [{"lead_id": <number>, "name": "<name>", "priority_rank": <1-N>, "action": "<specific action>", "reason": "<why this is priority>", "channel": "<call|whatsapp|email>"}], "summary": "<brief overview>", "focus_count": <number>}` },
            ],
            module: 'counselor_priority',
            userId,
        });

        if (!aiResult.success) {
            return { success: false, error: aiResult.error };
        }

        let parsed;
        try {
            const clean = aiResult.reply.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
            parsed = JSON.parse(clean);
        } catch {
            return { success: false, error: 'AI returned invalid priority list format.' };
        }

        return { success: true, counselorId, ...parsed, tokens: aiResult.usage };

    } catch (err) {
        console.error('[Counselor Assistant] Daily priority error:', err.message);
        return { success: false, error: err.message };
    }
};
