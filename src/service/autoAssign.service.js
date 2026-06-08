import db from '../config/db.js';

export const autoAssignLead = async (leadId) => {
    try {
        // Step 1: Find an active, available counselor with a phone number using a single atomic-like subquery.
        // We order by the last time they were assigned a lead (last_assigned_at).
        const query = `
            SELECT c.id as counselor_id, u.full_name, c.phone 
            FROM counselors c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.status = 'active'
            AND c.phone IS NOT NULL AND c.phone != ''
            ORDER BY c.last_assigned_at ASC
            LIMIT 1
            FOR UPDATE;
        `;
        const [counselors] = await db.execute(query);

        if (counselors.length === 0) {
            console.log('[AutoAssign] No active counselors available.');
            return { success: false, reason: 'NO_COUNSELORS_AVAILABLE' };
        }

        const counselor = counselors[0];
        const counselorName = counselor.full_name || 'Expert Counselor';

        // Step 2: Update the lead with the assigned counselor
        const updateQuery = `
            UPDATE inquiries 
            SET counselor_id = ?
            WHERE id = ?
        `;
        await db.execute(updateQuery, [counselor.counselor_id, leadId]);

        // Step 3: Update the counselor's last assigned time
        await db.execute(
            `UPDATE counselors SET last_assigned_at = NOW() WHERE id = ?`,
            [counselor.counselor_id]
        );

        console.log(`[AutoAssign] Lead ${leadId} assigned to Counselor ${counselor.full_name} (${counselor.phone})`);

        return { 
            success: true, 
            counselor: {
                id: counselor.counselor_id,
                name: counselorName,
                phone: counselor.phone
            }
        };

    } catch (error) {
        console.error('[AutoAssign] Error assigning lead:', error);
        return { success: false, error: error.message };
    }
};
