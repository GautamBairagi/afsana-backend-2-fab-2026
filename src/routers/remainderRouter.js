import express from 'express';
import {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder ,
  getPendingNotifications , 
  updateNotificationStatus
} from '../controllers/remainderCtrl.js';

const router = express.Router();

// POST - Create new reminder
router.post('/remainder', createReminder);

// GET - Get all reminders
router.get('/remainder', getReminders);

// GET - Get a single reminder by ID
router.get('/remainder/:id', getReminderById); 

// PUT - Update a reminder
router.put('/remainder/:id', updateReminder);

// DELETE - Delete a reminder
router.delete('/remainder/:id', deleteReminder);
router.get('/notification', getPendingNotifications);
router.patch('/notifications/update-status', updateNotificationStatus);

export default router;
