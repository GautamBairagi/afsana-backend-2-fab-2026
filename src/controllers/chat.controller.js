import { saveMessage, getPendingMessages, updateMessageStatus, getChatHistory, getChatList } from '../models/chat.model.js';
import db from '../config/db.js';
export const sendMessage = async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  console.log(req.body);
  const chatId = [sender_id, receiver_id].sort((a, b) => a - b).join('_');
  const timestamp = new Date().toISOString();
  const formattedTimestamp = timestamp.split('.')[0].replace('T', ' ');
  try {
    const messageId = await saveMessage({ sender_id, receiver_id, chatId, message, timestamp: formattedTimestamp, status: 'sent' });
    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getChatMessages = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const chatHistory = await getChatHistory(user1, user2);
    res.json({ success: true, chatHistory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getChatListcontroller = async (req, res) => {
  const { userId } = req.params;
  console.log("req : ", req.params);
  try {
    const chatList = await db.query("SELECT * FROM messages WHERE user_id = ?", [userId]);
    res.json({ success: true, chatList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};