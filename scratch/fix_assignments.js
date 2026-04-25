import db from '../src/config/db.js';

async function fixAssignments() {
    try {
        console.log("Fixing processor and counselor assignments in visa_process...");
        
        // Update visa_process records that have 0 or NULL for processor/counselor
        const [rows] = await db.query(`
            SELECT vp.id, vp.student_id, s.processor_id as correct_processor, s.counselor_id as correct_counselor
            FROM visa_process vp
            JOIN students s ON vp.student_id = s.id
            WHERE (vp.processor_id IS NULL OR vp.processor_id = 0 OR vp.counselor_id IS NULL OR vp.counselor_id = 0)
        `);

        console.log(`Found ${rows.length} records to fix.`);

        for (const row of rows) {
            await db.query(
                "UPDATE visa_process SET processor_id = ?, counselor_id = ? WHERE id = ?",
                [row.correct_processor, row.correct_counselor, row.id]
            );
            console.log(`Updated visa_process ID ${row.id} for student ${row.student_id}`);
        }

        console.log("Fix completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixAssignments();
