import express from 'express';
import { askAiChatbot } from '../controllers/aiChatController.js';
import { askConversationalBot } from '../controllers/conversationalAi.controller.js';
const router = express.Router();

router.post('/aichat/ask', askAiChatbot);
router.post('/aichat/conversational-ask', askConversationalBot);

export default router;  




