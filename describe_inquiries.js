import db from './src/config/db.js';

async function describeInquiries() {
    try {
        const [rows] = await db.query('DESCRIBE inquiries');
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
describeInquiries();
