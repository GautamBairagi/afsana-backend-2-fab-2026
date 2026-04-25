import db from '../src/config/db.js';

async function checkVisaData() {
    try {
        const [rows] = await db.query("SELECT * FROM visa_process WHERE student_id = 153");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkVisaData();
