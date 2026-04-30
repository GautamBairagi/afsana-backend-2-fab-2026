import db from '../config/db.js';
import { io } from '../server.js';

/**
 * Send a notification to one or more users and emit a socket event.
 * @param {Object} options
 * @param {number} [options.student_id]
 * @param {number} [options.counselor_id]
 * @param {number} [options.processor_id]
 * @param {number} [options.user_id] - Admin user ID
 * @param {number} [options.staff_id]
 * @param {string} options.message
 * @param {Object} [options.socketData] - Optional extra data for socket emission
 */
export const sendNotification = async ({
  student_id = null,
  counselor_id = null,
  processor_id = null,
  user_id = null,
  staff_id = null,
  message,
  socketData = {}
}) => {
  try {
    const query = `
      INSERT INTO dashboard_notifications 
      (student_id, counselor_id, processor_id, user_id, staff_id, sNotification, cNotification, pNotification, aNotification, staffNotification, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student_id,
      counselor_id,
      processor_id,
      user_id,
      staff_id,
      student_id ? 1 : 0,
      counselor_id ? 1 : 0,
      processor_id ? 1 : 0,
      user_id ? 1 : 0,
      staff_id ? 1 : 0,
      message
    ];

    await db.query(query, values);

    // 📢 Emit socket event for real-time update
    io.emit("dashboardUpdated", {
      student_id,
      counselor_id,
      processor_id,
      user_id,
      staff_id,
      message,
      ...socketData
    });

    console.log(`✅ Notification sent: "${message}" to ${[
      student_id && `Student:${student_id}`,
      counselor_id && `Counselor:${counselor_id}`,
      processor_id && `Processor:${processor_id}`,
      user_id && `Admin:${user_id}`,
      staff_id && `Staff:${staff_id}`
    ].filter(Boolean).join(', ')}`);

  } catch (error) {
    console.error("❌ Error in sendNotification utility:", error);
  }
};
