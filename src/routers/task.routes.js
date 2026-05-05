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
  reminder_task,
  getTasksByProcessor
} from '../controllers/task.controller.js';

import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/task', createTask);
router.post('/tasks', createTask); // Add plural variant
router.get('/task', getAllTasks);
router.get('/tasks', getAllTasks); // Add plural variant
router.get('/task/:counselor_id', getTaskByCounselorID);
router.get('/tasks/processor/:processor_id', getTasksByProcessor); // Corrected to use specific controller
router.get('/student_task/:student_id', getTaskByStudentID)
router.get('/task/:id', getTaskById);
router.get('/tasks/:id', getTaskById); // Add plural variant
router.put('/task/:id', updateTask);
router.put('/tasks/:id', updateTask); // Add plural variant
router.delete('/task/:id', deleteTask);
router.delete('/tasks/:id', deleteTask); // Add plural variant
router.patch('/update_task/:id',updateTaskNotesAndStatus);
router.patch('/tasks/:id', updateTaskNotesAndStatus); // Add for consistency
router.get("/tasks/reminder", reminder_task);

export default router;
