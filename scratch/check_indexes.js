import db from '../src/config/db.js';

async function checkIndexes() {
    try {
        const tables = ['inquiries', 'followuphistory'];
        
        for (const table of tables) {
            console.log(`\n--- Indexes for ${table} ---`);
            const [rows] = await db.query(`SHOW INDEX FROM ${table}`);
            console.table(rows.map(row => ({
                Table: row.Table,
                Non_unique: row.Non_unique,
                Key_name: row.Key_name,
                Column_name: row.Column_name,
                Index_type: row.Index_type
            })));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error checking indexes:', error);
        process.exit(1);
    }
}

checkIndexes();
