import db from '../src/config/db.js';

// Test: what will donI (student_id=153) be allowed to see?
const student_id = 153;

const [rows] = await db.query('SELECT u.id FROM users u WHERE u.student_id = ?', [student_id]);
const userId = rows[0]?.id;
console.log('Student userId:', userId);

const [info] = await db.query('SELECT counselor_id, processor_id FROM students WHERE id = ?', [student_id]);
console.log('Student assignments:', info[0]);

const allowedIds = [];
const [admins] = await db.query("SELECT id, full_name FROM users WHERE LOWER(role) IN ('admin', 'masteradmin')");
admins.forEach(a => { allowedIds.push(a.id); console.log('Admin:', a.id, a.full_name); });

if (info[0]?.counselor_id) {
  const [cUser] = await db.query('SELECT id, full_name FROM users WHERE counselor_id = ?', [info[0].counselor_id]);
  cUser.forEach(u => { allowedIds.push(u.id); console.log('Counselor:', u.id, u.full_name); });
}
if (info[0]?.processor_id) {
  const [pUser] = await db.query('SELECT id, full_name FROM users WHERE id = ?', [info[0].processor_id]);
  pUser.forEach(u => console.log('Processor:', u.id, u.full_name));
  allowedIds.push(info[0].processor_id);
}

console.log('Final allowed IDs for donI:', allowedIds);
process.exit(0);
