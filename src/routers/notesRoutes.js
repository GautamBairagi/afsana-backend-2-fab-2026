import express from 'express';
import { createNote, getNotesByInquiryId, updateNote, deleteNote } from '../controllers/notes.controller.js';

const router = express.Router();

// Create Follow-Up History
router.post('/createNote', createNote);
router.get('/getNotesByInquiryId/:inquiry_id', getNotesByInquiryId);
router.patch('/updateNote/:id', updateNote);
router.delete('/deleteNote/:id', deleteNote);



export default router;
