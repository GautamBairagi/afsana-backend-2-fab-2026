
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

async function checkBranches() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Branches ---');
        const [branches] = await connection.execute('SELECT * FROM branches');
        console.table(branches);

        console.log('--- Unique branch names in inquiries ---');
        const [inqBranches] = await connection.execute('SELECT DISTINCT branch FROM inquiries');
        console.table(inqBranches);

        console.log('--- Unique branch names in staff ---');
        const [staffBranches] = await connection.execute('SELECT DISTINCT branch FROM staff');
        console.table(staffBranches);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkBranches();
