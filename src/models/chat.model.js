import db from '../config/db.js';

export const saveMessage = async ({ sender_id, receiver_id, chatId, message, timestamp, status }) => {
  // Use 'chats' table. Note: 'chats' table doesn't have 'chatId' column, 
  // but it has 'sender_id', 'receiver_id', 'message', 'created_at', etc.
  const query = `INSERT INTO chats (sender_id, receiver_id, message, created_at, type) VALUES (?, ?, ?, ?, 'text')`;
  const values = [sender_id, receiver_id, message, timestamp];
  const [result] = await db.query(query, values);
  return result.insertId;
};

export const getPendingMessages = async (receiver_id) => {
  const query = `SELECT id, sender_id, message, created_at as timestamp FROM chats WHERE receiver_id = ? AND is_read = 0`;
  const [rows] = await db.execute(query, [receiver_id]);
  return rows;
};

export const updateMessageStatus = async (messageIds, status) => {
  const query = `UPDATE chats SET is_read = 1 WHERE id IN (?)`;
  await db.query(query, [messageIds]);
};

export const getChatHistory = async (user1, user2, limit = 50, offset = 0) => {
  const query = `
    SELECT *, created_at as timestamp FROM chats 
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    ORDER BY created_at ASC 
    LIMIT ? OFFSET ?
  `;

  try {
    const [rows] = await db.query(query, [user1, user2, user2, user1, limit, offset]);
    return rows;
  } catch (err) {
    console.error("Error in getChatHistory:", err.message);
    throw err;
  }
};


// Fetch Chat List
export const getChatList = async (userId) => {
  const query = `
    SELECT 
      CASE 
        WHEN CAST(sender_id AS UNSIGNED) < CAST(receiver_id AS UNSIGNED) 
        THEN CONCAT(sender_id, '_', receiver_id)
        ELSE CONCAT(receiver_id, '_', sender_id)
      END AS chatId,
      MAX(created_at) as lastMessageTime 
    FROM chats 
    WHERE sender_id = ? OR receiver_id = ? 
    GROUP BY chatId 
    ORDER BY lastMessageTime DESC
  `;

  try {
    const [rows] = await db.query(query, [userId, userId]);
    return rows;
  } catch (err) {
    console.error("Error in getChatList:", err.message);
    throw err;
  }
};
