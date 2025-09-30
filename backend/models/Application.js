// recruitment-ai-system/backend/models/Application.js

import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  cvText: String,
  // ✅ Changed 'score' to 'analysis' to store the detailed JSON object
  analysis: { type: mongoose.Schema.Types.Mixed } 
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);