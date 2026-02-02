import express from 'express';
import { sendMessage, getChatMessages, getChatListcontroller } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/send', sendMessage);
router.get('/chat/:user1/:user2', getChatMessages);
router.get('/chats/getChatList/:userId',getChatListcontroller);
export default router;