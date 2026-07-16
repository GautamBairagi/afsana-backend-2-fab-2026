import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const pool = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306
});

try {
  const [rows] = await pool.query(`
    SELECT 
      c.*, 
      u.email, u.full_name, u.role,
      (SELECT COUNT(*) FROM inquiries WHERE counselor_id = c.id) AS assigned_leads_count
    FROM counselors c 
    JOIN users u ON c.id = u.counselor_id
  `);
  console.log('--- EXACT QUERY FROM getAllCounselor ---');
  console.table(rows.map(r => ({ id: r.id, full_name: r.full_name, assigned_leads_count: r.assigned_leads_count })));
} catch (err) {
  console.error('Error:', err);
} finally {
  await pool.end();
  process.exit(0);
}
