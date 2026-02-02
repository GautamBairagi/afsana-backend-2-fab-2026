import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { getUserById } from './models/user.model.js';
import { saveMessage, updateMessageStatus, getPendingMessages, getChatHistory } from './models/chat.model.js';

dotenv.config();

const PORT = process.env.PORT1 || 5000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
      origin: "*",  // Adjust based on your frontend origin
      methods: ["GET", "POST"]
  }
});

const users = {}; // { userId: socketId }
const userRooms = {}; // { userId: [chatId1, chatId2] }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register User
  socket.on('registerUser', async (user_id) => {
    const user = await getUserById(user_id);
    if (!user) return;

    users[user_id] = socket.id;
    userRooms[user_id] = [];

    // Fetch pending messages
    const pendingMessages = await getPendingMessages(user_id);
    if (pendingMessages.length > 0) {
      socket.emit('receiveMessage', pendingMessages);
      const messageIds = pendingMessages.map(msg => msg.id);
      await updateMessageStatus(messageIds, 'delivered');
    }
  });

  // Join Specific Chat Room and Fetch Chat History
  socket.on('joinRoom', async ({ user_id, other_user_id }) => {
    const chatId = [user_id, other_user_id].sort((a, b) => a - b).join('_');
    socket.join(chatId);

    if (!userRooms[user_id]) {
      userRooms[user_id] = [];
    }
    if (!userRooms[user_id].includes(chatId)) {
      userRooms[user_id].push(chatId);
    }

    console.log(`User ${user_id} joined room ${chatId}`);

    // Fetch last 50 messages
    const chatHistory = await getChatHistory(chatId, 50, 0);
    socket.emit('chatHistory', { chatId, messages: chatHistory });
  });

  // Fetch Chat History on Demand
  socket.on('getChatHistory', async ({ chatId, limit, offset }) => {
    try {
      const chatHistory = await getChatHistory(chatId, limit, offset);
      socket.emit('chatHistory', { chatId, messages: chatHistory });
    } catch (err) {
      console.error("Error in getChatHistory:", err.message);
    }
  });

  // Send Message
  socket.on('sendMessage', async ({ sender_id, receiver_id, message }) => {
    const chatId = [sender_id, receiver_id].sort((a, b) => a - b).join('_');

    const timestamp = new Date().toISOString().split('.')[0].replace('T', ' ');
    const chatData = { sender_id, receiver_id, chatId, message, timestamp, status: 'sent' };
    const messageId = await saveMessage(chatData);

    io.to(chatId).emit('receiveMessage', chatData);
    await updateMessageStatus([messageId], 'delivered');
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(users).find(key => users[key] === socket.id);
    if (userId) {
      delete users[userId];
      delete userRooms[userId];
      console.log(`User ${userId} disconnected`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});