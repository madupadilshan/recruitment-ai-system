// recruitment-ai-system/backend/controllers/messageController.js

import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// Get user's conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      "participants.userId": userId,
      status: "active"
    })
    .populate("participants.userId", "name email role")
    .populate("lastMessage.sender", "name")
    .populate("context.jobId", "title")
    .sort({ updatedAt: -1 });
    
    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => 
        p.userId._id.toString() !== userId
      );
      
      return {
        id: conv._id,
        title: conv.title || `Chat with ${otherParticipant?.userId.name}`,
        otherUser: {
          id: otherParticipant?.userId._id,
          name: otherParticipant?.userId.name,
          email: otherParticipant?.userId.email,
          role: otherParticipant?.userId.role
        },
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCounts.get(userId) || 0,
        context: conv.context,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json({ conversations: formattedConversations });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId.toString() === userId)) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }
    
    // Get messages with pagination
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .populate("sender", "name email role")
    .populate("receiver", "name email role")
    .populate("replyTo", "content.text sender")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
    
    // Mark messages as read
    await Message.updateMany({
      conversation: conversationId,
      receiver: userId,
      "status.read": null
    }, {
      "status.read": new Date()
    });
    
    // Update conversation unread count
    conversation.unreadCounts.set(userId, 0);
    await conversation.save();
    
    res.json({ 
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        hasMore: messages.length === limit
      }
    });
    
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, conversationId, context = {}, replyToId } = req.body;
    const senderId = req.user.id;
    
    if (!receiverId && !conversationId) {
      return res.status(400).json({ error: "Either receiverId or conversationId required" });
    }
    
    if (!content?.text && !content?.fileUrl) {
      return res.status(400).json({ error: "Message content required" });
    }
    
    let conversation;
    
    if (conversationId) {
      // Use existing conversation
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      // Create or find conversation
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      
      const sender = await User.findById(senderId);
      
      conversation = await Conversation.findOrCreate(
        { userId: senderId, role: sender.role },
        { userId: receiverId, role: receiver.role },
        context
      );
    }
    
    // Get receiver ID from conversation if not provided
    const finalReceiverId = receiverId || conversation.participants.find(p => 
      p.userId.toString() !== senderId
    ).userId;
    
    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: finalReceiverId,
      content: {
        text: content.text || "",
        fileUrl: content.fileUrl || "",
        fileName: content.fileName || "",
        fileSize: content.fileSize || 0,
        messageType: content.messageType || "text"
      },
      context: {
        jobId: context.jobId || conversation.context?.jobId,
        applicationId: context.applicationId || conversation.context?.applicationId
      },
      replyTo: replyToId || null
    });
    
    await message.save();
    await message.populate("sender", "name email role");
    await message.populate("receiver", "name email role");
    
    // Update conversation
    conversation.lastMessage = {
      content: content.text || `📎 ${content.fileName || 'File'}`,
      sender: senderId,
      timestamp: new Date(),
      messageType: content.messageType || "text"
    };
    
    // Update unread count for receiver
    const currentUnread = conversation.unreadCounts.get(finalReceiverId.toString()) || 0;
    conversation.unreadCounts.set(finalReceiverId.toString(), currentUnread + 1);
    
    conversation.updatedAt = new Date();
    await conversation.save();
    
    // Emit real-time message via Socket.io
    if (global.io && global.connectedUsers) {
      const receiverSocketId = global.connectedUsers.get(finalReceiverId.toString());
      
      if (receiverSocketId) {
        global.io.to(receiverSocketId).emit("new_message", {
          type: "new_message",
          message: message,
          conversationId: conversation._id,
          timestamp: new Date()
        });
        
        console.log(`📨 Real-time message sent to user ${finalReceiverId}`);
      }
      
      // Also emit to sender for confirmation
      const senderSocketId = global.connectedUsers.get(senderId);
      if (senderSocketId) {
        global.io.to(senderSocketId).emit("message_sent", {
          type: "message_sent",
          message: message,
          conversationId: conversation._id
        });
      }
    }
    
    res.status(201).json({ message, conversationId: conversation._id });
    
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Start conversation with a user
export const startConversation = async (req, res) => {
  try {
    const { userId: receiverId, context = {} } = req.body;
    const senderId = req.user.id;
    
    console.log("🔄 Starting conversation:");
    console.log("  Sender ID:", senderId);
    console.log("  Receiver ID:", receiverId);
    console.log("  Context:", context);
    
    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }
    
    if (senderId === receiverId) {
      return res.status(400).json({ error: "Cannot start conversation with yourself" });
    }
    
    // Get user details
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);
    
    console.log("👤 Sender found:", sender ? sender.name : "Not found");
    console.log("👤 Receiver found:", receiver ? receiver.name : "Not found");
    
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }
    
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Create or get existing conversation
    const conversation = await Conversation.findOrCreate(
      { userId: senderId, role: sender.role },
      { userId: receiverId, role: receiver.role },
      context
    );
    
    await conversation.populate("participants.userId", "name email role");
    
    if (context.jobId) {
      await conversation.populate("context.jobId", "title");
    }
    
    console.log("✅ Conversation ready:", conversation._id);
    
    res.json({ 
      conversationId: conversation._id,
      conversation: conversation
    });
    
  } catch (err) {
    console.error("❌ Start conversation error:", err);
    res.status(500).json({ error: err.message || "Failed to start conversation" });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Update messages
    await Message.updateMany({
      conversation: conversationId,
      receiver: userId,
      "status.read": null
    }, {
      "status.read": new Date()
    });
    
    // Update conversation unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCounts.${userId}`]: 0
    });
    
    res.json({ success: true });
    
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId.toString() === userId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Soft delete for the user (remove from their participant list)
    conversation.participants = conversation.participants.filter(p => 
      p.userId.toString() !== userId
    );
    
    if (conversation.participants.length === 0) {
      // If no participants left, mark conversation as deleted
      conversation.isDeleted = true;
      conversation.deletedAt = new Date();
    }
    
    await conversation.save();
    
    res.json({ success: true });
    
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: err.message });
  }
};