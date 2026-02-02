


import express from 'express';
import { uploadDocuments, getDocuments} from '../controllers/studentDocController.js';

const router = express.Router();
router.post('/postDocuments/:student_id', uploadDocuments);

// Get documents by student ID
router.get('/getDocuments/:student_id', getDocuments);

export default router;  
