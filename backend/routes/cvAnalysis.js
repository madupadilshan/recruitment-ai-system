// recruitment-ai-system/backend/routes/cvAnalysis.js

import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  analyzeSkills,
  validateCVExperience,
  analyzeAchievements,
  processMultiLanguage,
  assessQuality,
  comprehensiveAnalysis,
  getAnalysisHistory,
  generateSummary,
  chatWithAi
} from '../controllers/cvAnalysisController.js';

const router = express.Router();

// 🤖 AI Summary
router.post('/summary', authMiddleware, generateSummary);

// 💬 AI Chat
router.post('/chat', authMiddleware, chatWithAi);

// 🧪 Test endpoint for debugging
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'CV Analysis routes are working!',
    timestamp: new Date().toISOString()
  });
});

// 🧪 Test authenticated endpoint
router.get('/test-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'CV Analysis authentication is working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// 🚀 Enhanced Skills Analysis
router.post('/skills/analyze', authMiddleware, analyzeSkills);

// 🔍 Experience Validation
router.post('/experience/validate', authMiddleware, validateCVExperience);

// 🏆 Achievement Analysis
router.post('/achievements/analyze', authMiddleware, analyzeAchievements);

// 🌐 Multi-Language Processing
router.post('/multilang/process', authMiddleware, upload.single("cvFile"), processMultiLanguage);

// 📊 CV Quality Assessment
router.post('/quality/assess', authMiddleware, assessQuality);

// 🎯 Comprehensive Analysis (file upload)
router.post('/comprehensive', authMiddleware, upload.single("cvFile"), comprehensiveAnalysis);

// 🧪 Test comprehensive analysis without file upload
router.post('/comprehensive-test', authMiddleware, (req, res) => {
  console.log('🧪 Test comprehensive analysis called');

  const mockAnalysisResult = {
    success: true,
    data: {
      summary: {
        overallScore: 85,
        skillsCount: 12,
        experienceYears: 5,
        achievementsCount: 6
      },
      skills: {
        technicalSkills: ['JavaScript', 'React', 'Node.js', 'Python'],
        softSkills: ['Leadership', 'Communication', 'Problem Solving'],
        languages: ['English', 'Sinhala'],
        certifications: ['AWS Certified', 'Google Cloud']
      },
      experience: {
        totalExperience: 5,
        verificationScore: 90,
        inconsistencies: [],
        recommendations: ['Great experience profile!']
      },
      achievements: {
        impactScore: 80,
        innovationScore: 75,
        achievements: ['Led team of 5', 'Improved performance by 40%'],
        keyAccomplishments: ['Successful project delivery', 'Team leadership']
      },
      quality: {
        overallScore: 85,
        formattingScore: 88,
        completenessScore: 82,
        atsCompatibility: 90,
        strengths: ['Clear formatting', 'Relevant skills'],
        improvements: ['Add more metrics', 'Include certifications']
      },
      multiLanguage: {
        detectedLanguage: 'english',
        languageConfidence: 0.95,
        unicodeSupport: true
      }
    },
    message: "Test comprehensive CV analysis completed successfully"
  };

  res.json(mockAnalysisResult);
});

// 📈 Get Analysis History
router.get('/history', authMiddleware, getAnalysisHistory);

export default router;
