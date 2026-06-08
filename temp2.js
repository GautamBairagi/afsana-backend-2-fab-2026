import db from './src/config/db.js';

db.execute("SELECT c.user_id, c.phone, c.status, u.id as u_id, u.full_name FROM counselors c LEFT JOIN users u ON c.user_id = u.id").then(res => { console.log(res[0]); process.exit(0); }).catch(e => { console.log(e); process.exit(1); });
