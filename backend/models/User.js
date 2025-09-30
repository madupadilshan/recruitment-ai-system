import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["candidate", "recruiter"], default: "candidate" },

    // Enhanced candidate profile fields from CV analysis
    profileSummary: { type: String },
    skills: [{ type: String }],
    
    // Professional details extracted from CV
    experience: {
      totalYears: { type: Number, default: 0 },
      positions: [{
        title: String,
        company: String,
        duration: String,
        description: String
      }]
    },
    
    education: [{
      degree: String,
      institution: String,
      year: String,
      field: String
    }],
    
    // Contact and personal info
    phone: { type: String },
    location: { type: String },
    linkedIn: { type: String },
    portfolio: { type: String },
    
    // AI extracted insights
    aiProfileInsights: {
      experienceLevel: String, // Junior, Mid-level, Senior
      domainExpertise: [String], // Web Development, Data Science, etc.
      keyStrengths: [String],
      recommendedRoles: [String],
      lastAnalyzed: { type: Date }
    },
    
    // 🚀 Advanced AI Analysis Fields
    softSkills: [{ type: String }], // Communication, Leadership, etc.
    languages: [{
      language: String,
      proficiency: String // Basic, Intermediate, Advanced, Native
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      verified: { type: Boolean, default: false }
    }],
    tools: [{ type: String }], // Software tools and technologies
    frameworks: [{ type: String }], // React, Angular, Django, etc.
    
    // Achievement and Impact Metrics
    achievements: [{
      description: String,
      impact: String,
      metrics: String,
      category: String // Leadership, Technical, Innovation, etc.
    }],
    impactScore: { type: Number, default: 0, min: 0, max: 100 },
    leadershipScore: { type: Number, default: 0, min: 0, max: 100 },
    innovationScore: { type: Number, default: 0, min: 0, max: 100 },
    
    // CV Quality and Validation Metrics
    cvQualityScore: { type: Number, default: 0, min: 0, max: 100 },
    atsCompatibility: { type: Number, default: 0, min: 0, max: 100 },
    
    // Experience Validation
    experienceValidation: {
      verificationScore: { type: Number, default: 0, min: 0, max: 100 },
      inconsistencies: [String],
      lastValidated: Date,
      companyVerifications: [{
        company: String,
        verified: Boolean,
        source: String
      }]
    },
    
    // Multi-language Support
    preferredLanguage: { type: String, default: 'english' },
    cvLanguages: [String], // Languages detected in CV
    
    // Profile completion status
    profileComplete: { type: Boolean, default: false },
    cvUploaded: { type: Boolean, default: false },
    cvFilePath: { type: String }, // Store CV file path for future reference
    
    // Analysis timestamps
    lastSkillsAnalysis: Date,
    lastExperienceValidation: Date,
    lastAchievementAnalysis: Date,
    lastQualityAssessment: Date
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
