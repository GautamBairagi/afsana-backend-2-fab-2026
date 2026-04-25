import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function migrate() {
  try {
    console.log("Migrating data from 'messages' to 'chats'...");
    
    // Check if messages table has anything unique
    const [messages] = await db.query("SELECT * FROM messages");
    
    for (const msg of messages) {
        // Check if message already exists in chats to avoid duplicates
        const [exists] = await db.query(
            "SELECT id FROM chats WHERE sender_id = ? AND receiver_id = ? AND message = ? AND created_at = ?",
            [msg.sender_id, msg.receiver_id, msg.message, msg.timestamp]
        );
        
        if (exists.length === 0) {
            console.log(`Migrating message: ${msg.message}`);
            await db.query(
                "INSERT INTO chats (sender_id, receiver_id, message, created_at, type) VALUES (?, ?, ?, ?, 'text')",
                [msg.sender_id, msg.receiver_id, msg.message, msg.timestamp]
            );
        } else {
            console.log("Message already exists in chats, skipping.");
        }
    }
    
    console.log("Migration completed successfully.");

  } catch (err) {
    console.error("Error migrating data:", err.message);
  } finally {
    await db.end();
  }
}

migrate();
