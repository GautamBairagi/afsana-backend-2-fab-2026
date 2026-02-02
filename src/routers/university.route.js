import express from 'express';
import { createUniversity, deleteUniversity, getAllUniversities, getUniversityById, updateUniversity } from '../controllers/university.controller.js';
import { upload } from '../middlewares/upload.js';
const router = express.Router();

router.post('/universities', createUniversity);
router.get('/universities', getAllUniversities);
router.get('/universities/:id', getUniversityById);
router.put('/universities/:id', updateUniversity);
router.delete('/universities/:id', deleteUniversity);

export default router;


