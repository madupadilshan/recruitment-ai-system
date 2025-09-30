// recruitment-ai-system/backend/models/Message.js

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Conversation", 
    required: true 
  },
  
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  content: {
    text: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    messageType: { 
      type: String, 
      enum: ["text", "file", "image"], 
      default: "text" 
    }
  },
  
  status: {
    sent: { type: Date, default: Date.now },
    delivered: { type: Date, default: null },
    read: { type: Date, default: null }
  },
  
  // Message context (optional - for job-related conversations)
  context: {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null }
  },
  
  // For message threading/replies
  replyTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Message", 
    default: null 
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
  
}, { timestamps: true });

// Indexes for better performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ "status.read": 1 });

export default mongoose.model("Message", messageSchema);