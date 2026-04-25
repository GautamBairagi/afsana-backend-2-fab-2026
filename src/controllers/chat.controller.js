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
  try {
    // 1. Get current user's role and assignments
    const [userRows] = await db.query("SELECT role, id, student_id, counselor_id, processor_id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    
    const currentUser = userRows[0];
    console.log(`🔍 Fetching chat list for user: ${userId}, Role: ${currentUser.role}`);
    const allowedContactIds = [];

    // 2. Determine who this user is allowed to chat with
    if (currentUser.role === 'admin' || currentUser.role === 'masteradmin') {
      // Admin/Masteradmin can chat with everyone, no filter needed
    } else {
      // All non-admins can chat with admins and masteradmins
      const [admins] = await db.query("SELECT id FROM users WHERE role IN ('admin', 'masteradmin')");
      admins.forEach(a => allowedContactIds.push(a.id.toString()));

      if (currentUser.role === 'student') {
        const [studentInfo] = await db.query("SELECT counselor_id, processor_id FROM students WHERE id = ?", [currentUser.student_id]);
        if (studentInfo.length > 0) {
          if (studentInfo[0].counselor_id) allowedContactIds.push(studentInfo[0].counselor_id.toString());
          if (studentInfo[0].processor_id) allowedContactIds.push(studentInfo[0].processor_id.toString());
        }
      } else if (currentUser.role === 'counselor') {
        const [students] = await db.query("SELECT id FROM students WHERE counselor_id = ?", [currentUser.id]);
        const studentIds = students.map(s => s.id);
        if (studentIds.length > 0) {
          const [studentUsers] = await db.query("SELECT id FROM users WHERE student_id IN (?)", [studentIds]);
          studentUsers.forEach(u => allowedContactIds.push(u.id.toString()));
        }
      } else if (currentUser.role === 'processor') {
        const [students] = await db.query("SELECT id FROM students WHERE processor_id = ?", [currentUser.id]);
        const studentIds = students.map(s => s.id);
        if (studentIds.length > 0) {
          const [studentUsers] = await db.query("SELECT id FROM users WHERE student_id IN (?)", [studentIds]);
          studentUsers.forEach(u => allowedContactIds.push(u.id.toString()));
        }
      }
    }
    console.log(`✅ Allowed Contact IDs for ${userId}:`, allowedContactIds);

    // 3. Fetch the chat list
    const query = `
      SELECT 
        CASE 
          WHEN CAST(sender_id AS UNSIGNED) < CAST(receiver_id AS UNSIGNED) 
          THEN CONCAT(sender_id, '_', receiver_id)
          ELSE CONCAT(receiver_id, '_', sender_id)
        END AS chatId,
        sender_id,
        receiver_id,
        MAX(created_at) AS lastMessageTime,
        SUM(CASE WHEN receiver_id = ? COLLATE utf8mb4_unicode_ci AND is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
      FROM chats 
      WHERE (sender_id = ? COLLATE utf8mb4_unicode_ci OR receiver_id = ? COLLATE utf8mb4_unicode_ci) AND group_id IS NULL
      GROUP BY chatId 
      ORDER BY lastMessageTime DESC
    `;
    const [rows] = await db.query(query, [userId, userId, userId]);

    // 4. Filter the rows based on allowedContactIds (if not admin)
    let filteredRows = rows;
    if (currentUser.role !== 'admin' && currentUser.role !== 'masteradmin') {
      filteredRows = rows.filter(row => {
        const otherId = row.sender_id.toString() === userId.toString() ? row.receiver_id.toString() : row.sender_id.toString();
        return allowedContactIds.includes(otherId);
      });
    }

    res.json({ success: true, chatList: filteredRows });
  } catch (err) {
    console.error("Chat list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  const { userId, otherUserId } = req.body;
  try {
    const query = `UPDATE chats SET is_read = 1 WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND is_read = 0`;
    await db.query(query, [userId, otherUserId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
