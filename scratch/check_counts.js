import db from '../src/config/db.js';

async function checkCounts() {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [studentCount] = await db.query('SELECT COUNT(*) as count FROM students');
        const [counselorCount] = await db.query('SELECT COUNT(*) as count FROM counselors');
        const [staffCount] = await db.query('SELECT COUNT(*) as count FROM staff');
        
        console.log('--- Table Counts ---');
        console.log('Users:', userCount[0].count);
        console.log('Students:', studentCount[0].count);
        console.log('Counselors:', counselorCount[0].count);
        console.log('Staff:', staffCount[0].count);

        // Check for links
        const [linkedStudents] = await db.query('SELECT COUNT(*) as count FROM users WHERE student_id IS NOT NULL AND student_id != 0');
        const [linkedCounselors] = await db.query('SELECT COUNT(*) as count FROM users WHERE counselor_id IS NOT NULL AND counselor_id != 0');
        
        console.log('\n--- Link Counts ---');
        console.log('Users linked to Students:', linkedStudents[0].count);
        console.log('Users linked to Counselors:', linkedCounselors[0].count);

        process.exit(0);
    } catch (error) {
        console.error('Error checking counts:', error);
        process.exit(1);
    }
}

checkCounts();
