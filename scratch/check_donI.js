import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/kiaan/afsana-ak/afsanaBackend22/.env' });

async function checkVisaProcess() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'afsana',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("Checking visa_process records for student_id = 153...");
        const [rows] = await db.query("SELECT vp.id, vp.student_id, vp.university_id, u.name as university_name FROM visa_process vp LEFT JOIN universities u ON vp.university_id = u.id WHERE vp.student_id = 153");
        console.table(rows);

    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

checkVisaProcess();
