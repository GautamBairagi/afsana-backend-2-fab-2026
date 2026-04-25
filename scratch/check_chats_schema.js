import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkSchema() {
  try {
    console.log("Checking 'chats' table:");
    const [chatsCols] = await db.query("SHOW COLUMNS FROM chats");
    console.table(chatsCols);

    console.log("\nChecking 'messages' table:");
    const [messagesCols] = await db.query("SHOW COLUMNS FROM messages");
    console.table(messagesCols);

    const [chatsCount] = await db.query("SELECT COUNT(*) as count FROM chats");
    console.log(`\n'chats' table count: ${chatsCount[0].count}`);

    const [messagesCount] = await db.query("SELECT COUNT(*) as count FROM messages");
    console.log(`'messages' table count: ${messagesCount[0].count}`);

  } catch (err) {
    console.error("Error checking schema:", err.message);
  } finally {
    await db.end();
  }
}

checkSchema();
