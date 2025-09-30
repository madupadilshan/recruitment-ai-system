// recruitment-ai-system/backend/routes/applications.js

import express from "express";
import path from "path";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import { getAnalysisFromFile, extractCvText } from "../utils/aiService.js";
import upload from "../middleware/uploadMiddleware.js";
import { authMiddleware, recruiterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Candidate applies with file upload
router.post("/upload", upload.single("cvFile"), async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const absolutePath = path.resolve(req.file.path);
    const analysisResult = await getAnalysisFromFile(absolutePath, job);
    const cvText = await extractCvText(absolutePath);
    if (cvText) {
      await User.findByIdAndUpdate(candidateId, {
        profileSummary: cvText.slice(0, 1500),
      });
    }
    const application = new Application({
      candidate: candidateId,
      job: jobId,
      cvText: "Uploaded CV",
      analysis: analysisResult,
    });
    await application.save();
    res.json(application);
  } catch (err) {
    console.error("❌ Application upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get total applicant count for the logged-in recruiter
router.get("/count/by-recruiter", authMiddleware, recruiterOnly, async (req, res) => {
    try {
        const jobs = await Job.find({ recruiter: req.user.id }).select('_id');
        const jobIds = jobs.map(job => job._id);
        const count = await Application.countDocuments({ job: { $in: jobIds } });
        res.json({ count });
    } catch (err) {
        console.error("❌ Applicant count fetch error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ NEW: Get applicant count for today for the logged-in recruiter
router.get("/count/matches-today", authMiddleware, recruiterOnly, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of the day

        const jobs = await Job.find({ recruiter: req.user.id }).select('_id');
        const jobIds = jobs.map(job => job._id);

        const count = await Application.countDocuments({ 
            job: { $in: jobIds },
            createdAt: { $gte: today } // Filter applications created today or later
        });
        
        res.json({ count });
    } catch (err) {
        console.error("❌ Today's matches count fetch error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Recruiter view applicants for a specific job
router.get("/:jobId", authMiddleware, recruiterOnly, async (req, res) => {
  try {
    const apps = await Application.find({ job: req.params.jobId })
      .populate("candidate", "name email");
    res.json(apps);
  } catch (err) {
    console.error("❌ Applicants fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Recruiter deletes an application
router.delete("/:id", authMiddleware, recruiterOnly, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }
        const job = await Job.findById(application.job);
        if (job.recruiter.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized: You do not own this job" });
        }
        await Application.findByIdAndDelete(req.params.id);
        res.json({ message: "Application deleted successfully" });
    } catch (err) {
        console.error("❌ Delete application error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;