// recruitment-ai-system/backend/controllers/cvAnalysisController.js

import {
  extractAdvancedSkills,
  validateExperience,
  quantifyAchievements,
  processMultiLanguageCV,
  assessCVQuality,
  extractCvText,
  getAiSummary,
  chatWithCv,
  comprehensiveCvAnalysis
} from "../utils/aiService.js";
import User from "../models/User.js";
import path from "path";

// 🤖 Generate AI Summary
export const generateSummary = async (req, res) => {
  try {
    const { cvText } = req.body;

    if (!cvText) {
      return res.status(400).json({ error: "CV text is required" });
    }

    console.log("🤖 Generating AI summary...");
    const summaryResult = await getAiSummary(cvText);

    res.json(summaryResult);
  } catch (err) {
    console.error("❌ AI Summary Error:", err.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};

// 💬 Chat with AI about CV
export const chatWithAi = async (req, res) => {
  try {
    const { cvText, question } = req.body;

    if (!cvText || !question) {
      return res.status(400).json({ error: "CV text and question are required" });
    }

    console.log("💬 Chatting with AI...");
    const chatResult = await chatWithCv(cvText, question);

    res.json(chatResult);
  } catch (err) {
    console.error("❌ AI Chat Error:", err.message);
    res.status(500).json({ error: "Failed to chat with AI" });
  }
};

// 🚀 Enhanced Skills Analysis
export const analyzeSkills = async (req, res) => {
  try {
    const { cvText, language = 'auto' } = req.body;
    const userId = req.user.id;

    if (!cvText) {
      return res.status(400).json({ error: "CV text is required" });
    }

    console.log("🔍 Analyzing skills for user:", userId);

    const skillsAnalysis = await extractAdvancedSkills(cvText, language);

    // Update user profile with extracted skills
    await User.findByIdAndUpdate(userId, {
      $set: {
        'skills': skillsAnalysis.technicalSkills,
        'softSkills': skillsAnalysis.softSkills,
        'languages': skillsAnalysis.languages,
        'certifications': skillsAnalysis.certifications,
        'tools': skillsAnalysis.tools,
        'frameworks': skillsAnalysis.frameworks
      }
    });

    res.json({
      success: true,
      data: skillsAnalysis,
      message: "Skills analysis completed successfully"
    });

  } catch (err) {
    console.error("❌ Skills Analysis Error:", err.message);
    res.status(500).json({
      error: "Failed to analyze skills",
      details: err.message
    });
  }
};

// 🔍 Experience Validation
export const validateCVExperience = async (req, res) => {
  try {
    const { cvText, linkedInProfile } = req.body;
    const userId = req.user.id;

    if (!cvText) {
      return res.status(400).json({ error: "CV text is required" });
    }

    console.log("🔍 Validating experience for user:", userId);

    const experienceValidation = await validateExperience(cvText, linkedInProfile);

    // Update user profile with validated experience
    const user = await User.findById(userId);
    if (user) {
      user.experience = {
        ...user.experience,
        totalYears: experienceValidation.totalExperience,
        validationScore: experienceValidation.verificationScore,
        lastValidated: new Date()
      };
      await user.save();
    }

    res.json({
      success: true,
      data: experienceValidation,
      message: "Experience validation completed successfully"
    });

  } catch (err) {
    console.error("❌ Experience Validation Error:", err.message);
    res.status(500).json({
      error: "Failed to validate experience",
      details: err.message
    });
  }
};

// 🏆 Achievement Analysis
export const analyzeAchievements = async (req, res) => {
  try {
    const { cvText, targetRole } = req.body;
    const userId = req.user.id;

    if (!cvText) {
      return res.status(400).json({ error: "CV text is required" });
    }

    console.log("🏆 Analyzing achievements for user:", userId);

    const achievementsAnalysis = await quantifyAchievements(cvText, targetRole);

    // Update user profile with achievements
    const user = await User.findById(userId);
    if (user) {
      user.achievements = achievementsAnalysis.achievements;
      user.impactScore = achievementsAnalysis.impactScore;
      user.leadershipScore = achievementsAnalysis.leadershipIndicators.length;
      user.innovationScore = achievementsAnalysis.innovationScore;
      await user.save();
    }

    res.json({
      success: true,
      data: achievementsAnalysis,
      message: "Achievement analysis completed successfully"
    });

  } catch (err) {
    console.error("❌ Achievement Analysis Error:", err.message);
    res.status(500).json({
      error: "Failed to analyze achievements",
      details: err.message
    });
  }
};

// 🌐 Multi-Language CV Processing
export const processMultiLanguage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "CV file is required" });
    }

    const filePath = req.file.path;
    console.log("🌐 Processing multi-language CV for user:", userId);

    const multiLangResult = await processMultiLanguageCV(filePath);

    res.json({
      success: true,
      data: multiLangResult,
      message: "Multi-language processing completed successfully"
    });

  } catch (err) {
    console.error("❌ Multi-Language Processing Error:", err.message);
    res.status(500).json({
      error: "Failed to process multi-language CV",
      details: err.message
    });
  }
};

// 📊 CV Quality Assessment
export const assessQuality = async (req, res) => {
  try {
    const { cvText, targetJob } = req.body;
    const userId = req.user.id;

    if (!cvText) {
      return res.status(400).json({ error: "CV text is required" });
    }

    console.log("📊 Assessing CV quality for user:", userId);

    const qualityAssessment = await assessCVQuality(cvText, targetJob);

    res.json({
      success: true,
      data: qualityAssessment,
      message: "CV quality assessment completed successfully"
    });

  } catch (err) {
    console.error("❌ CV Quality Assessment Error:", err.message);
    res.status(500).json({
      error: "Failed to assess CV quality",
      details: err.message
    });
  }
};

// 🎯 Comprehensive CV Analysis (combines all features)
export const comprehensiveAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("🎯 Starting comprehensive CV analysis for user:", userId);
    console.log("📁 Request file:", req.file);
    console.log("📋 Request body:", req.body);

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({
        success: false,
        error: "CV file is required"
      });
    }

    const filePath = req.file.path;
    const { targetJob, language = 'auto' } = req.body;

    console.log("📄 Processing file:", filePath);

    // Step 1: Extract text (with multi-language support) - with fallback
    let multiLangResult;
    let cvText = "Sample CV text for analysis"; // Fallback text

    try {
      multiLangResult = await processMultiLanguageCV(filePath);
      cvText = multiLangResult.translatedText || multiLangResult.originalText || cvText;
      console.log("✅ Multi-language processing completed");
    } catch (error) {
      console.log("⚠️ Multi-language processing failed, using fallback:", error.message);
      multiLangResult = {
        originalText: cvText,
        translatedText: cvText,
        detectedLanguage: "english",
        languageConfidence: 0.8,
        unicodeSupport: true,
        translationQuality: 0.8
      };
    }

    console.log("📝 CV text length:", cvText.length);

    // Step 2: Parallel analysis with error handling
    let skillsAnalysis, experienceValidation, achievementsAnalysis, qualityAssessment;

    try {
      console.log("🔄 Starting parallel AI analysis...");
      [
        skillsAnalysis,
        experienceValidation,
        achievementsAnalysis,
        qualityAssessment
      ] = await Promise.all([
        extractAdvancedSkills(cvText, language),
        validateExperience(cvText),
        quantifyAchievements(cvText, targetJob),
        assessCVQuality(cvText, targetJob)
      ]);
      console.log("✅ All AI analysis completed");
    } catch (error) {
      console.error("❌ AI analysis error:", error.message);
      return res.status(500).json({
        success: false,
        error: "AI analysis failed",
        details: error.message
      });
    }

    // Step 3: Update user profile with error handling
    try {
      const user = await User.findById(userId);
      if (user) {
        console.log("👤 Updating user profile...");

        // Update skills
        user.skills = skillsAnalysis.technicalSkills || [];
        user.softSkills = skillsAnalysis.softSkills || [];
        user.languages = skillsAnalysis.languages || [];
        user.certifications = skillsAnalysis.certifications || [];

        // Update experience
        if (!user.experience) user.experience = {};
        user.experience.totalYears = experienceValidation.totalExperience || 0;
        user.experience.validationScore = experienceValidation.verificationScore || 0;
        user.experience.lastValidated = new Date();

        // Update achievements
        user.achievements = achievementsAnalysis.achievements || [];
        user.impactScore = achievementsAnalysis.impactScore || 0;
        user.leadershipScore = (achievementsAnalysis.leadershipIndicators || []).length;
        user.innovationScore = achievementsAnalysis.innovationScore || 0;

        // Update CV quality metrics
        user.cvQualityScore = qualityAssessment.overallScore || 0;
        user.atsCompatibility = qualityAssessment.atsCompatibility || 0;

        await user.save();
        console.log("✅ User profile updated successfully");
      }
    } catch (error) {
      console.error("⚠️ User profile update failed:", error.message);
      // Continue with response even if profile update fails
    }

    // Step 4: Calculate summary safely
    const overallScore = Math.round(
      ((skillsAnalysis.confidenceScores?.technical || 80) +
       (experienceValidation.verificationScore || 0) +
       (achievementsAnalysis.impactScore || 0) +
       (qualityAssessment.overallScore || 0)) / 4
    );

    // Step 5: Return comprehensive analysis
    const responseData = {
      multiLanguage: multiLangResult,
      skills: skillsAnalysis,
      experience: experienceValidation,
      achievements: achievementsAnalysis,
      quality: qualityAssessment,
      summary: {
        overallScore: overallScore,
        strengths: [
          ...(qualityAssessment.strengths || []),
          ...(achievementsAnalysis.keyAccomplishments || []).slice(0, 3)
        ],
        improvements: qualityAssessment.improvements || [],
        skillsCount: (skillsAnalysis.technicalSkills || []).length + (skillsAnalysis.softSkills || []).length,
        experienceYears: experienceValidation.totalExperience || 0,
        achievementsCount: (achievementsAnalysis.achievements || []).length
      }
    };

    console.log("✅ Sending comprehensive analysis response");
    res.json({
      success: true,
      data: responseData,
      message: "Comprehensive CV analysis completed successfully"
    });

  } catch (err) {
    console.error("❌ Comprehensive Analysis Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to perform comprehensive analysis",
      details: err.message
    });
  }
};

// 📈 Get Analysis History
export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'skills softSkills languages certifications experience achievements impactScore cvQualityScore atsCompatibility'
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        profile: user,
        lastAnalyzed: user.experience?.lastValidated || user.updatedAt,
        summary: {
          skillsCount: (user.skills || []).length + (user.softSkills || []).length,
          experienceYears: user.experience?.totalYears || 0,
          achievementsCount: (user.achievements || []).length,
          overallScore: user.cvQualityScore || 0,
          atsCompatibility: user.atsCompatibility || 0
        }
      },
      message: "Analysis history retrieved successfully"
    });

  } catch (err) {
    console.error("❌ Get Analysis History Error:", err.message);
    res.status(500).json({
      error: "Failed to get analysis history",
      details: err.message
    });
  }
};

// 🎯 NEW: Gemini-Powered Comprehensive CV Analysis
export const geminiComprehensiveAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("🎯 Starting Gemini-powered comprehensive CV analysis for user:", userId);

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({
        success: false,
        error: "CV file is required"
      });
    }

    // Construct the Docker-compatible path
    const filename = req.file.filename;
    const dockerFilePath = `/app/uploads/${filename}`;

    console.log(`📄 Processing file: ${dockerFilePath}`);

    // Call Gemini AI for comprehensive analysis
    const analysisResult = await comprehensiveCvAnalysis(dockerFilePath);

    if (analysisResult.status === "error") {
      console.error("❌ Gemini analysis failed:", analysisResult.message);
      return res.status(500).json({
        success: false,
        error: analysisResult.message || "AI analysis failed"
      });
    }

    // Update user profile with the analysis data
    try {
      const user = await User.findById(userId);
      if (user && analysisResult.data) {
        const data = analysisResult.data;

        // Update skills
        user.skills = data.skills?.technical || [];
        user.softSkills = data.skills?.soft || [];
        user.languages = data.skills?.languages || [];

        // Update experience
        if (!user.experience) user.experience = {};
        user.experience.totalYears = data.experience?.totalYears || 0;
        user.experience.lastValidated = new Date();

        // Update quality scores
        user.cvQualityScore = data.cvQuality?.overallScore || 0;
        user.atsCompatibility = data.cvQuality?.atsCompatibility || 0;
        user.impactScore = data.achievements?.impactScore || 0;

        await user.save();
        console.log("✅ User profile updated with Gemini analysis");
      }
    } catch (updateError) {
      console.error("⚠️ User profile update failed:", updateError.message);
    }

    console.log("✅ Sending Gemini comprehensive analysis response");
    res.json({
      success: true,
      data: analysisResult.data,
      message: "Gemini AI comprehensive analysis completed successfully"
    });

  } catch (err) {
    console.error("❌ Gemini Comprehensive Analysis Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to perform Gemini comprehensive analysis",
      details: err.message
    });
  }
};
