import db from '../config/db.js';

export const saveMessage = async ({ sender_id, receiver_id, chatId, message, timestamp, status }) => {
  const query = `INSERT INTO messages (chatId, sender_id, receiver_id, message, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [chatId, sender_id, receiver_id, message, timestamp, status];
  const [result] = await db.query(query, values);
  return result.insertId;
};

export const getPendingMessages = async (receiver_id) => {
  const query = `SELECT id, chatId, sender_id, message, timestamp FROM messages WHERE receiver_id = ? AND status = 'sent'`;
  const [rows] = await db.execute(query, [receiver_id]);
  return rows;
};

export const updateMessageStatus = async (messageIds, status) => {
  const query = `UPDATE messages SET status = ? WHERE id IN (?)`;
  await db.query(query, [status, messageIds]);
};

// export const getChatHistory = async (user1, user2) => {
//   const chatId = [user1, user2].sort((a, b) => a - b).join('_');
//   const query = `SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC`;
//   const [rows] = await db.execute(query, [chatId]);
//   return rows;
// };


export const getChatHistory = async (chatId, limit = 50, offset = 0) => {
  const query = `
    SELECT * FROM messages 
    WHERE chatId = ? 
    ORDER BY timestamp ASC 
    LIMIT ? OFFSET ?
  `;

  try {
    const [rows] = await db.query(query, [chatId, limit, offset]);
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
      chatId, 
      MAX(timestamp) as lastMessageTime 
    FROM messages 
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
