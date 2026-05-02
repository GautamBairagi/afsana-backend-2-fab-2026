
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
        console.log('--- Assigned to staff 56 ---');
        const [assigned] = await connection.execute('SELECT id, full_name, assigned_staff_id, branch FROM inquiries WHERE assigned_staff_id = 56');
        console.table(assigned);

        console.log('--- Dhaka branch inquiries ---');
        const [dhaka] = await connection.execute('SELECT id, full_name, assigned_staff_id, branch FROM inquiries WHERE branch = "Dhaka" LIMIT 10');
        console.table(dhaka);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
