
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/Users/bc/Desktop/new afsana/afsana_backend/.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

async function check() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [users] = await connection.execute('SELECT id, full_name, role, staff_id FROM users WHERE full_name LIKE "%donS%"');
        console.table(users);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
