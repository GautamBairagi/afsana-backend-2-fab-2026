import express from 'express';

import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskByCounselorID,
  getTaskByStudentID,
  updateTaskNotesAndStatus,
  reminder_task
} from '../controllers/task.controller.js';

import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/task', createTask);
router.get('/task', getAllTasks);
router.get('/task/:counselor_id', getTaskByCounselorID);
router.get('/student_task/:student_id', getTaskByStudentID)
router.get('/task/:id', getTaskById);
router.put('/task/:id', updateTask);
router.delete('/task/:id', deleteTask);
router.patch('/update_task/:id',updateTaskNotesAndStatus);
router.get("/tasks/reminder", reminder_task);

export default router;
