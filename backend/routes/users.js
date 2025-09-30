// recruitment-ai-system/backend/routes/users.js

import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { 
  getMyProfile, 
  updateAccountDetails, 
  changePassword,
  updateCandidateProfile,
  uploadAndAnalyzeCV,
  replaceCV,
  getUsersByRole,
  seedTestUsers
} from "../controllers/userController.js";

const router = express.Router();

// Get users by role (for interview scheduling)
router.get("/", authMiddleware, getUsersByRole);

// Get logged-in user profile
router.get("/me", authMiddleware, getMyProfile);

// Update account details (name, email) for any user
router.put("/account/details", authMiddleware, updateAccountDetails);

// Change password for any user
router.post("/account/password", authMiddleware, changePassword);

// Update candidate-specific profile (summary, skills)
router.put("/profile/candidate", authMiddleware, updateCandidateProfile);

// ✅ Upload and analyze CV for profile setup (first time)
router.post("/profile/upload-cv", authMiddleware, upload.single("cvFile"), uploadAndAnalyzeCV);

// ✅ NEW: Replace existing CV and update profile
router.put("/profile/replace-cv", authMiddleware, upload.single("cvFile"), replaceCV);

// Seed test candidates (development only)
router.post("/seed-test-users", seedTestUsers);

export default router;