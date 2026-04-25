import db from '../src/config/db.js';
async function check() {
  try {
    const [orphans] = await db.query('SELECT id, email, created_at FROM users WHERE role = "student" AND student_id IS NULL');
    console.log('Orphaned users:', orphans);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
