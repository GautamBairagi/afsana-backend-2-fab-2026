import db from '../src/config/db.js';

async function findStudent() {
    try {
        const [rows] = await db.query("SELECT id, full_name, mobile_number FROM students WHERE full_name LIKE '%donl%' OR mobile_number LIKE '%909090909%'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findStudent();
