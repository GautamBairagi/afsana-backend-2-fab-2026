import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/kiaan/afsana-ak/afsanaBackend22/.env' });

async function checkSchema() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'afsana',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("Checking visa_process table schema...");
        const [rows] = await db.query("DESCRIBE visa_process");
        console.table(rows);

        const [indexes] = await db.query("SHOW INDEX FROM visa_process");
        console.log("\nIndexes on visa_process:");
        console.table(indexes);

    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

checkSchema();
