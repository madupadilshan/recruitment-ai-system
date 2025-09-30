// recruitment-ai-system/backend/models/Job.js

import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // ✅ Existing AI matching fields
  requiredSkills: [{ type: String }],
  requiredYears: { type: Number, default: 0 },
  
  // ✅ NEW: Advanced Search Fields
  location: {
    city: { type: String, default: "" },
    country: { type: String, default: "Sri Lanka" },
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false }
  },
  
  salary: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: "LKR" },
    period: { type: String, default: "monthly", enum: ["hourly", "daily", "monthly", "annually"] }
  },
  
  company: {
    name: { type: String, default: "" },
    size: { type: String, default: "startup", enum: ["startup", "small", "medium", "large", "enterprise"] },
    industry: { type: String, default: "" }
  },
  
  jobType: { 
    type: String, 
    default: "full-time", 
    enum: ["full-time", "part-time", "contract", "internship", "freelance"] 
  },
  
  urgency: {
    type: String,
    default: "normal",
    enum: ["low", "normal", "high", "urgent"]
  },
  
  benefits: [{ type: String }], // e.g., ["health insurance", "flexible hours", "remote work"]
  
  // ✅ Search optimization
  searchKeywords: [{ type: String }], // Auto-generated from title, description, skills
  
}, { timestamps: true });

// ✅ Pre-save middleware to generate search keywords
jobSchema.pre('save', function(next) {
  // Generate search keywords from title, description, and skills
  const keywords = [];
  
  // Add title words
  if (this.title) {
    keywords.push(...this.title.toLowerCase().split(' ').filter(word => word.length > 2));
  }
  
  // Add description words (first 100 words)
  if (this.description) {
    const descWords = this.description.toLowerCase()
      .replace(/[^\w\s]/gi, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 20);
    keywords.push(...descWords);
  }
  
  // Add skills
  if (this.requiredSkills && this.requiredSkills.length > 0) {
    keywords.push(...this.requiredSkills.map(skill => skill.toLowerCase()));
  }
  
  // Add location
  if (this.location && this.location.city) {
    keywords.push(this.location.city.toLowerCase());
  }
  
  // Add company info
  if (this.company && this.company.name) {
    keywords.push(this.company.name.toLowerCase());
  }
  
  // Remove duplicates and empty strings
  this.searchKeywords = [...new Set(keywords)].filter(Boolean);
  
  next();
});

export default mongoose.model("Job", jobSchema);