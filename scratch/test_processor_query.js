import db from '../src/config/db.js';

async function testProcessorQuery() {
    try {
        const processor_id = 1; // Assuming 1 exists
        const query = `
      SELECT 
        vp.*,
        s.country,
        u.name AS university_name,
        u.logo_url,
        u.location
      FROM visa_process vp
      INNER JOIN (
          SELECT student_id, university_id, MAX(id) as max_id
          FROM visa_process
          GROUP BY student_id, university_id
      ) latest ON vp.id = latest.max_id
      LEFT JOIN students s ON vp.student_id = s.id
      LEFT JOIN universities u ON vp.university_id = u.id
      WHERE vp.processor_id = ?
    `;
        const [rows] = await db.query(query, [processor_id]);
        console.log('Total Rows:', rows.length);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testProcessorQuery();
