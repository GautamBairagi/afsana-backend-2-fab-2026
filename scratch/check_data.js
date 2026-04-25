import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkData() {
  try {
    console.log("Sample data from 'chats' table:");
    const [chatsRows] = await db.query("SELECT * FROM chats LIMIT 1");
    console.log(chatsRows[0]);

    console.log("\nSample data from 'messages' table:");
    const [messagesRows] = await db.query("SELECT * FROM messages LIMIT 1");
    console.log(messagesRows[0]);

  } catch (err) {
    console.error("Error checking data:", err.message);
  } finally {
    await db.end();
  }
}

checkData();
