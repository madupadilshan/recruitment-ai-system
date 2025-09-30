// recruitment-ai-system/backend/models/Conversation.js

import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["recruiter", "candidate"], required: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
  }],
  
  // Conversation metadata
  title: { type: String, default: "" }, // Optional custom title
  
  // Context for job-related conversations
  context: {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    jobTitle: { type: String, default: "" },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null }
  },
  
  // Last message info for quick access
  lastMessage: {
    content: { type: String, default: "" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    timestamp: { type: Date, default: Date.now },
    messageType: { type: String, enum: ["text", "file", "image"], default: "text" }
  },
  
  // Conversation status
  status: {
    type: String,
    enum: ["active", "archived", "blocked"],
    default: "active"
  },
  
  // Unread message counts for each participant
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Conversation settings
  settings: {
    muteNotifications: { type: Boolean, default: false },
    allowFileSharing: { type: Boolean, default: true }
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
  
}, { timestamps: true });

// Ensure unique conversations between participants
conversationSchema.index({ 
  "participants.userId": 1 
}, { unique: false });

// Index for quick lookups
conversationSchema.index({ "participants.userId": 1, status: 1, updatedAt: -1 });
conversationSchema.index({ "context.jobId": 1 });

// Helper method to find or create conversation
conversationSchema.statics.findOrCreate = async function(participant1, participant2, context = {}) {
  try {
    // Sort participants to ensure consistent conversation lookup
    const sortedParticipants = [participant1, participant2].sort((a, b) => 
      a.userId.toString().localeCompare(b.userId.toString())
    );
    
    console.log("🔍 Looking for conversation between:", sortedParticipants);
    
    let conversation = await this.findOne({
      $and: [
        { "participants.userId": sortedParticipants[0].userId },
        { "participants.userId": sortedParticipants[1].userId },
        { status: { $ne: "blocked" } }
      ]
    });
    
    if (!conversation) {
      console.log("📝 Creating new conversation");
      conversation = new this({
        participants: sortedParticipants,
        context: context,
        status: "active"
      });
      await conversation.save();
      console.log("✅ New conversation created:", conversation._id);
    } else {
      console.log("✅ Existing conversation found:", conversation._id);
    }
    
    return conversation;
  } catch (error) {
    console.error("❌ Error in findOrCreate:", error);
    throw error;
  }
};

export default mongoose.model("Conversation", conversationSchema);