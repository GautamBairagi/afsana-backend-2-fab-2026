import express from 'express';
import { 
  uploadDocument, 
  getStudentDocuments, 
  getAllStudentDocuments,
  updateDocumentStatus, 
  deleteDocument 
} from '../controllers/studentUploads.controller.js';

const router = express.Router();

router.post('/studentUploads', uploadDocument);
router.get('/studentUploads', getAllStudentDocuments);
router.get('/studentUploads/:student_id', getStudentDocuments);
router.put('/studentUploads/:id/status', updateDocumentStatus);
router.delete('/studentUploads/:id', deleteDocument);

export default router;
