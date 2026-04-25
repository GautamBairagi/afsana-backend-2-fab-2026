import db from '../src/config/db.js';

async function checkSchema() {
    try {
        const [rows] = await db.query("DESCRIBE chats");
        console.log("CHATS_SCHEMA:" + JSON.stringify(rows));
        const [userRows] = await db.query("DESCRIBE users");
        console.log("USERS_SCHEMA:" + JSON.stringify(userRows));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
