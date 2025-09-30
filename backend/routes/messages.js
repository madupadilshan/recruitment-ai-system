// recruitment-ai-system/backend/routes/messages.js

import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteConversation
} from '../controllers/messageController.js';

const router = express.Router();

// Get user's conversations
router.get('/conversations', authMiddleware, getConversations);

// Start a new conversation
router.post('/conversations', authMiddleware, startConversation);

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authMiddleware, getMessages);

// Send a message
router.post('/messages', authMiddleware, sendMessage);

// Mark conversation messages as read
router.patch('/conversations/:conversationId/read', authMiddleware, markAsRead);

// Delete conversation
router.delete('/conversations/:conversationId', authMiddleware, deleteConversation);

export default router;