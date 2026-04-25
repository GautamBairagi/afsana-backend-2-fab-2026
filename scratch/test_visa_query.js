import db from '../src/config/db.js';

async function testQuery() {
    try {
        const query = `
            SELECT 
                vp.*,
                vp.full_name as student_name, 
                vp.email, 
                vp.phone as mobile_number, 
                s.country,
                u.name as university_name
            FROM visa_process vp
            INNER JOIN (
                SELECT student_id, university_id, MAX(id) as max_id
                FROM visa_process
                GROUP BY student_id, university_id
            ) latest ON vp.id = latest.max_id
            LEFT JOIN students s ON vp.student_id = s.id
            LEFT JOIN universities u ON vp.university_id = u.id
        `;
        const [rows] = await db.query(query);
        console.log('Total Rows:', rows.length);
        if (rows.length > 0) {
            console.log('Sample Row:', rows[0]);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testQuery();
