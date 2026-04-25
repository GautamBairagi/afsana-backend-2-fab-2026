import db from '../src/config/db.js';

async function checkProcessor() {
    try {
        const [users] = await db.query("SELECT id, full_name, role FROM users WHERE full_name LIKE '%donP%'");
        console.log("Users:", users);
        if (users.length > 0) {
            const pId = users[0].id;
            const [studentCount] = await db.query("SELECT COUNT(*) as count FROM students WHERE processor_id = ?", [pId]);
            const [visaCount] = await db.query("SELECT COUNT(*) as count FROM visa_process WHERE processor_id = ?", [pId]);
            console.log(`Processor ID ${pId} has ${studentCount[0].count} students and ${visaCount[0].count} visa processes.`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProcessor();
