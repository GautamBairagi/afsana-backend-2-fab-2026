import db from '../src/config/db.js';

async function addIsReadColumn() {
    try {
        console.log("Checking for is_read column...");
        const [rows] = await db.query("DESCRIBE chats");
        const hasIsRead = rows.some(row => row.Field === 'is_read');
        
        if (!hasIsRead) {
            console.log("Adding is_read column to chats table...");
            await db.query("ALTER TABLE chats ADD COLUMN is_read TINYINT(1) DEFAULT 0");
            console.log("is_read column added successfully.");
        } else {
            console.log("is_read column already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

addIsReadColumn();
