import db from '../src/config/db.js';

async function checkAllRecords() {
    try {
        const [rows] = await db.query("SELECT id, university_id, registration_visa_processing_stage, documents_visa_processing_stage, tuition_fee_visa_processing_stage, appointment_visa_processing_stage FROM visa_process WHERE student_id = 153");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAllRecords();
