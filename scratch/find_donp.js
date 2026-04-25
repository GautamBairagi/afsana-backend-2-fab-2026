import db from '../src/config/db.js';

async function findUser() {
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE full_name LIKE '%don%'");
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUser();
