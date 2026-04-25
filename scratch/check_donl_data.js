import db from '../src/config/db.js';

async function checkData() {
    try {
        const [rows] = await db.query("SELECT * FROM visa_process WHERE full_name LIKE '%donl%' OR student_id = 909090909");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
