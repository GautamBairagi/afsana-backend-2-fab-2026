import db from '../src/config/db.js';

async function syncExistingApplications() {
    console.log("Starting sync of existing applications...");
    try {
        // Find applications that don't have a record in visa_process
        const [apps] = await db.query(`
            SELECT sap.* 
            FROM studentapplicationprocess sap
            LEFT JOIN visa_process vp ON sap.student_id = vp.student_id AND sap.university_id = vp.university_id
            WHERE vp.id IS NULL
        `);

        console.log(`Found ${apps.length} applications to sync.`);

        for (const app of apps) {
            const student_id = app.student_id;
            const university_id = app.university_id;

            // Fetch student info
            const [studentData] = await db.query(`
                SELECT s.*, u.email 
                FROM students s 
                LEFT JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?
            `, [student_id]);

            if (studentData.length > 0) {
                const student = studentData[0];
                
                // Fetch university name
                const [uniData] = await db.query("SELECT name FROM universities WHERE id = ?", [university_id]);
                const universityName = uniData[0]?.name || 'Unknown University';

                // Fetch Counselor Name
                let counselorName = '';
                if (student.counselor_id) {
                    const [counselor] = await db.query("SELECT full_name FROM users WHERE counselor_id = ?", [student.counselor_id]);
                    counselorName = counselor[0]?.full_name || '';
                }

                const visaData = {
                    student_id: student_id,
                    university_id: university_id,
                    full_name: student.full_name,
                    email: student.email || '',
                    phone: student.mobile_number || '',
                    date_of_birth: student.date_of_birth,
                    passport_no: student.passport_1_no || '',
                    applied_program: universityName, 
                    intake: 'Jan-2025', 
                    assigned_counselor: counselorName,
                    counselor_id: student.counselor_id,
                    processor_id: student.processor_id,
                    registration_date: new Date().toISOString().split('T')[0],
                    source: 'University Application',
                    registration_visa_processing_stage: 1
                };

                await db.query("INSERT INTO visa_process SET ?", [visaData]);
                console.log(`✅ Synced student ${student_id} (${student.full_name}) for university ${university_id} (Processor: ${student.processor_id})`);
            } else {
                console.log(`❌ Student data not found for ID: ${student_id}`);
            }
        }

        console.log("Sync completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Sync failed:", err);
        process.exit(1);
    }
}

syncExistingApplications();
