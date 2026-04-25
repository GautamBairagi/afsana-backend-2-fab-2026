import db from '../src/config/db.js';

async function checkSchema() {
    try {
        const [studentRows] = await db.query("DESCRIBE students");
        console.log("STUDENTS_SCHEMA:" + JSON.stringify(studentRows));
        
        const [visaRows] = await db.query("DESCRIBE visa_process");
        console.log("VISA_PROCESS_SCHEMA:" + JSON.stringify(visaRows));
        
        const [applyRows] = await db.query("DESCRIBE studentapplicationprocess");
        console.log("APPLY_SCHEMA:" + JSON.stringify(applyRows));
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
