import express from 'express';
import { createFollowUp, deleteFollowUp, getAllFollowUps, getFollowUpById, updateFollowUp } from '../controllers/follow_ups.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.post('/followUp', createFollowUp);
router.get('/followUp', getAllFollowUps);
router.get('/followUp/:id', getFollowUpById);
router.put('/followUp/:id', updateFollowUp);
router.delete('/followUp/:id', deleteFollowUp);

export default router;
