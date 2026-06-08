import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const pool = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306
});

console.log('Connected to DB:', process.env.DB_NAME);

const [allTables] = await pool.query('SHOW TABLES');
console.log('All tables:', allTables.map(t => Object.values(t)[0]).join(', '));

await pool.end();
process.exit(0);
