import db from '../src/config/db.js';

async function findData() {
    try {
        const [rows] = await db.query("SELECT * FROM visa_process WHERE student_id = 153");
        rows.forEach(row => {
            let filledFields = Object.keys(row).filter(k => row[k] !== null && row[k] !== '' && row[k] !== 0).length;
            console.log(`Record ID: ${row.id}, University ID: ${row.university_id}, Filled Fields: ${filledFields}`);
            if (row.registration_visa_processing_stage === 1) console.log("  - Registration: 1");
            if (row.documents_visa_processing_stage === 1) console.log("  - Documents: 1");
            if (row.tuition_fee_visa_processing_stage === 1) console.log("  - Tuition Fee: 1");
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findData();
