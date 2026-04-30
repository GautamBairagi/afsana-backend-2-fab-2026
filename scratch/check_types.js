import db from '../src/config/db.js';

async function check() {
    try {
        const [columns] = await db.query(`DESCRIBE studentapplicationprocess`);
        console.log("studentapplicationprocess columns:");
        columns.forEach(c => console.log(`${c.Field}: ${c.Type}`));
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

check();
