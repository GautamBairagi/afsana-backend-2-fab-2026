import express from 'express';
import { askAiChatbot } from '../controllers/aiChatController.js';
const router = express.Router();

router.post('/aichat/ask', askAiChatbot);

export default router;  




