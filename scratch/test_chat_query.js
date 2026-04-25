import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testQuery(userId) {
  try {
    console.log(`Testing userDetails query for userId: ${userId}`);
    const [userRows] = await db.query(
        `SELECT u.id, u.full_name, u.role, 
            (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
            (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
         FROM users u 
         WHERE (role IN ('admin', 'counselor', 'student', 'processors')
            OR u.id IN (SELECT DISTINCT sender_id FROM chats WHERE receiver_id = ?)
            OR u.id IN (SELECT DISTINCT receiver_id FROM chats WHERE sender_id = ?))
         GROUP BY u.id
         ORDER BY last_message_time DESC LIMIT 10`,
        [userId, userId, userId, userId, userId]
    );

    console.log("Results:");
    if (userRows.length === 0) {
        console.log("No users found.");
    } else {
        console.table(userRows.map(u => ({
            id: u.id,
            name: u.full_name,
            role: u.role,
            unread: u.unread_count,
            last_time: u.last_message_time
        })));
    }

  } catch (err) {
    console.error("Error testing query:", err.message);
  } finally {
    await db.end();
  }
}

// Testing with Admin ID 135
testQuery('135');
