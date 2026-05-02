
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

async function fixBranches() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Starting Fix ---');

        // 1. Update branches table
        const [res1] = await connection.execute('UPDATE branches SET branch_name = "Dhaka" WHERE branch_name = "Dhak"');
        console.log(`Updated branches table: ${res1.affectedRows} rows affected`);

        // 2. Update inquiries table
        const [res2] = await connection.execute('UPDATE inquiries SET branch = "Dhaka" WHERE branch = "Dhak"');
        console.log(`Updated inquiries table: ${res2.affectedRows} rows affected`);

        // 3. Update staff table (just in case, though none found in check)
        const [res3] = await connection.execute('UPDATE staff SET branch = "Dhaka" WHERE branch = "Dhak"');
        console.log(`Updated staff table: ${res3.affectedRows} rows affected`);

        // 4. Check if there's a leads table
        try {
            const [res4] = await connection.execute('UPDATE leads SET branch = "Dhaka" WHERE branch = "Dhak"');
            console.log(`Updated leads table: ${res4.affectedRows} rows affected`);
        } catch (e) {
            console.log('leads table not found or update failed');
        }

        console.log('--- Fix Completed ---');

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

fixBranches();
