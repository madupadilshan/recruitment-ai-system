// recruitment-ai-system/backend/routes/jobs.js

import express from "express";
import { createJob, getJobs, updateJob, deleteJob, getRecommendedJobs, searchJobs, seedTestJobs } from "../controllers/jobController.js"; // ✅ Import search
import { authMiddleware, recruiterOnly } from "../middleware/authMiddleware.js";
import Job from "../models/Job.js";

const router = express.Router();

router.post("/", authMiddleware, recruiterOnly, createJob);
router.get("/", getJobs);

// ✅ NEW: Advanced Search Route (must be before /:id route)
router.get("/search", searchJobs);

// ✅ NEW: Update and Delete routes
router.put("/:id", authMiddleware, recruiterOnly, updateJob);
router.delete("/:id", authMiddleware, recruiterOnly, deleteJob);

// ✅ UPDATED: Use new recommendation system
router.get("/recommended", authMiddleware, getRecommendedJobs);

// Seed test jobs (development only)
router.post("/seed-test-jobs", authMiddleware, seedTestJobs);

router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("recruiter", "name email");
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    console.error("❌ Single Job Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;