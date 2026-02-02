import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

// GET notifications by user
router.get('/getNotifications/:user_id', getNotifications);

// Mark single notification as read
router.put('/read/:id', markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all/:user_id', markAllNotificationsAsRead);

export default router;
