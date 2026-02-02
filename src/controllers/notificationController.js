import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();



// Get all notifications for a user
export const getNotifications = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [notifications] = await db.query(
      `SELECT * FROM notifications WHERE receiverss_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark a single notification as read
export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark Notification Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (req, res) => {
  const { user_id } = req.params;
  try {
    await db.query(`UPDATE notifications SET is_read = 1 WHERE receiverss_id = ?`, [user_id]);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark All Notification Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
