import db from './src/config/db.js';

db.execute("SELECT c.user_id as id, u.full_name, c.phone FROM counselors c JOIN users u ON c.user_id = u.id WHERE c.status = 'active' AND c.phone IS NOT NULL AND c.phone != '' ORDER BY c.last_assigned_at ASC LIMIT 1").then(res => { console.log(res[0]); process.exit(0); }).catch(e => { console.log(e); process.exit(1); });
