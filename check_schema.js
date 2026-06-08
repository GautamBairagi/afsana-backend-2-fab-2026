import db from './src/config/db.js';

async function check() {
    try {
        const [rows] = await db.query('DESCRIBE inquiries');
        console.log(rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
