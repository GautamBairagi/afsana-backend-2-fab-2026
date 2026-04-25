import db from '../src/config/db.js';

async function checkAllStages() {
    try {
        const [rows] = await db.query("SELECT * FROM visa_process WHERE student_id = 153");
        if (rows.length > 0) {
            const data = rows[0];
            console.log("Stage Flags for student 153:");
            Object.keys(data).forEach(k => {
                if (k.includes('stage')) {
                    console.log(`${k}: ${data[k]}`);
                }
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAllStages();
