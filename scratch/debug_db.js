import db from '../src/config/db.js';

async function test() {
    try {
        const [rows] = await db.query('SELECT * FROM visa_process WHERE student_id = ?', [153]);
        console.log('VISA PROCESS:', JSON.stringify(rows, null, 2));
        
        const [students] = await db.query('SELECT * FROM students WHERE id = ?', [153]);
        console.log('STUDENT:', JSON.stringify(students, null, 2));

        const [users] = await db.query('SELECT * FROM users WHERE student_id = ?', [153]);
        console.log('USER:', JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
