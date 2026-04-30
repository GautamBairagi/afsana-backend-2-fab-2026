import db from '../src/config/db.js';

async function check() {
    try {
        console.log("Checking studentapplicationprocess table...");
        const [columns] = await db.query(`SHOW COLUMNS FROM studentapplicationprocess`);
        console.log("Columns:", columns.map(c => c.Field));
        
        console.log("\nChecking visa_process table...");
        const [vColumns] = await db.query(`SHOW COLUMNS FROM visa_process`);
        console.log("Columns:", vColumns.map(c => c.Field));
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

check();
