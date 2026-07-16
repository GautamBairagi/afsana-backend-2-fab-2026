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

console.log('Connected to DB:', process.env.DB_NAME);

try {
  const [counselors] = await pool.query('SELECT c.id AS counselor_id, c.user_id AS c_user_id, u.id AS u_id, u.counselor_id AS u_counselor_id, u.full_name, u.email FROM counselors c LEFT JOIN users u ON c.id = u.counselor_id');
  console.log('--- COUNSELORS & USERS JOIN ---');
  console.table(counselors);

  const [usersRoleCounselor] = await pool.query('SELECT id AS user_table_id, counselor_id, full_name, email, role FROM users WHERE role = "counselor" OR counselor_id IS NOT NULL');
  console.log('--- USERS WHERE role="counselor" OR counselor_id IS NOT NULL ---');
  console.table(usersRoleCounselor);

  const [inquiryGroup] = await pool.query('SELECT counselor_id, COUNT(*) AS total_inquiries FROM inquiries GROUP BY counselor_id');
  console.log('--- INQUIRIES GROUP BY counselor_id ---');
  console.table(inquiryGroup);

  const [inquirySamples] = await pool.query('SELECT id, student_name, full_name, counselor_id, lead_status FROM inquiries WHERE counselor_id IS NOT NULL AND counselor_id != "" LIMIT 10');
  console.log('--- SAMPLE INQUIRIES WITH counselor_id ---');
  console.table(inquirySamples);
} catch (err) {
  console.error('Query Error:', err);
} finally {
  await pool.end();
  process.exit(0);
}
