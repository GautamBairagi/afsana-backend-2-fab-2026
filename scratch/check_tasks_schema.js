import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finaltestiingafsana'
});

const [rows] = await db.query('DESCRIBE tasks');
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
