import db from './src/config/db.js';

async function run() {
    try {
        console.log("Adding columns to inquiries table...");
        // Check if columns exist first to avoid errors on retry
        const [columns] = await db.query(`SHOW COLUMNS FROM inquiries`);
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('created_by')) {
            await db.query(`ALTER TABLE inquiries ADD COLUMN created_by INT NULL`);
            console.log("created_by added.");
        } else {
            console.log("created_by already exists.");
        }

        if (!columnNames.includes('assigned_by')) {
            await db.query(`ALTER TABLE inquiries ADD COLUMN assigned_by INT NULL`);
            console.log("assigned_by added.");
        } else {
            console.log("assigned_by already exists.");
        }

        console.log("Database updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating database:", err.message);
        process.exit(1);
    }
}

run();
