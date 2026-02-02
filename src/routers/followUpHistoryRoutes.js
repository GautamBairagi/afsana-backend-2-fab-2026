import express from 'express';
import {deleteFollowUp, createFollowUpHistory, getInquiriesWithFollowUp, updateFollowUpStatus, getFollowUpHistoryByInquiryId, getInquiryWithFollowUpById } from '../controllers/followUpHistory.controller.js';

const router = express.Router();

// Create Follow-Up History
router.post('/followup-history', createFollowUpHistory);
router.get('/followup-history/:counselor_id', getInquiriesWithFollowUp);
router.put('/updateFollowUpStatus', updateFollowUpStatus);
router.get('/getFollowUpHistoryByInquiryId/:inquiry_id', getFollowUpHistoryByInquiryId);
router.get('/followup-history/:inquiry_id', getInquiryWithFollowUpById);
router.delete("/deletefollowup-history/:id", deleteFollowUp);



export default router;





