// Application logic
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { getMatchScore } from "../utils/aiService.js";

export const applyJob = async (req, res) => {
  try {
    const { candidateId, jobId, cvText, jobDescription } = req.body;

    // Call AI microservice
    const score = await getMatchScore(cvText, jobDescription);

    const application = new Application({
      candidate: candidateId,
      job: jobId,
      cvText,
      score
    });

    await application.save();
    
    // ✅ NEW: Emit "new application" notification to recruiter
    if (global.io) {
      const job = await Job.findById(jobId).populate('recruiter', 'name');
      const candidate = await User.findById(candidateId, 'name email');
      
      if (job && candidate) {
        // Find recruiter's socket connection
        const recruiterSocketId = global.connectedUsers.get(job.recruiter._id.toString());
        
        if (recruiterSocketId) {
          global.io.to(recruiterSocketId).emit("new_application", {
            type: "new_application",
            title: "New Job Application! 📄",
            message: `${candidate.name} applied for "${job.title}"`,
            jobId: jobId,
            jobTitle: job.title,
            candidateId: candidateId,
            candidateName: candidate.name,
            matchScore: score?.overallScore || 0,
            timestamp: new Date()
          });
          
          console.log(`🔔 Notified recruiter ${job.recruiter.name} about new application from ${candidate.name}`);
        }
      }
    }
    
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getApplicants = async (req, res) => {
  try {
    const apps = await Application.find({ job: req.params.jobId })
      .populate("candidate", "name email");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
