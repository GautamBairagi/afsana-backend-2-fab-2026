import db from '../src/config/db.js';

async function checkStages() {
    try {
        const [rows] = await db.query("SELECT * FROM visa_process WHERE student_id = 153");
        if (rows.length > 0) {
            const data = rows[0];
            const stages = {};
            Object.keys(data).forEach(k => {
                if (k.includes('stage')) {
                    stages[k] = data[k];
                }
            });
            console.log(JSON.stringify(stages, null, 2));
        } else {
            console.log("No record found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStages();
