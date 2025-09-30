// recruitment-ai-system/backend/controllers/interviewController.js

import Interview from "../models/Interview.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

// Get user's interviews
export const getInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, upcoming, page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by user role
    if (userRole === 'recruiter') {
      query.recruiter = userId;
    } else {
      query.candidate = userId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter upcoming interviews
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }
    
    const interviews = await Interview.find(query)
      .populate('recruiter', 'name email')
      .populate('candidate', 'name email')
      .populate('job', 'title company location')
      .populate('application', 'status')
      .populate('interviewers.user', 'name email')
      .sort({ scheduledDate: upcoming === 'true' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Interview.countDocuments(query);
    
    res.json({
      interviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total
      }
    });
    
  } catch (err) {
    console.error("Get interviews error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get single interview details
export const getInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const interview = await Interview.findById(id)
      .populate('recruiter', 'name email phone')
      .populate('candidate', 'name email phone')
      .populate('job', 'title company location description requirements')
      .populate('application', 'status appliedAt cvUrl')
      .populate('interviewers.user', 'name email role')
      .populate('rescheduleHistory.requestedBy', 'name')
      .populate('cancellation.cancelledBy', 'name');
    
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    
    // Check if user has access
    const hasAccess = (userRole === 'recruiter' && interview.recruiter._id.toString() === userId) ||
                     (userRole === 'candidate' && interview.candidate._id.toString() === userId) ||
                     interview.interviewers.some(int => int.user._id.toString() === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.json({ interview });
    
  } catch (err) {
    console.error("Get interview error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Schedule new interview
export const scheduleInterview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'recruiter') {
      return res.status(403).json({ error: "Only recruiters can schedule interviews" });
    }
    
    const {
      candidateId,
      jobId,
      applicationId,
      scheduledDate,
      duration = 60,
      timeZone = "UTC",
      format = "video-call",
      interviewType = "screening",
      interviewStage = "initial",
      title,
      description,
      requirements,
      location,
      videoCall,
      interviewers = []
    } = req.body;
    
    // Validate required fields
    if (!candidateId || !jobId || !scheduledDate) {
      return res.status(400).json({ 
        error: "Candidate ID, Job ID, and scheduled date are required" 
      });
    }
    
    // Verify candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'candidate') {
      return res.status(404).json({ error: "Candidate not found" });
    }
    
    // Verify job exists and recruiter owns it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    if (job.recruiter.toString() !== userId) {
      return res.status(403).json({ error: "Access denied: You don't own this job" });
    }
    
    // Check for scheduling conflicts
    const interviewStartTime = new Date(scheduledDate);
    const interviewEndTime = new Date(interviewStartTime.getTime() + (duration * 60 * 1000));
    
    // Check recruiter conflicts
    const recruiterConflicts = await Interview.checkConflicts(
      userId, 'recruiter', interviewStartTime, interviewEndTime
    );
    
    if (recruiterConflicts.length > 0) {
      return res.status(409).json({ 
        error: "Scheduling conflict: You already have an interview at this time",
        conflicts: recruiterConflicts
      });
    }
    
    // Check candidate conflicts
    const candidateConflicts = await Interview.checkConflicts(
      candidateId, 'candidate', interviewStartTime, interviewEndTime
    );
    
    if (candidateConflicts.length > 0) {
      return res.status(409).json({ 
        error: "Scheduling conflict: Candidate is not available at this time",
        conflicts: candidateConflicts
      });
    }
    
    // Create interview
    const interview = new Interview({
      title: title || `${interviewType} Interview - ${job.title}`,
      recruiter: userId,
      candidate: candidateId,
      job: jobId,
      application: applicationId,
      scheduledDate: interviewStartTime,
      duration,
      timeZone,
      format,
      interviewType,
      interviewStage,
      description,
      requirements,
      location: format === 'in-person' ? location : undefined,
      videoCall: format === 'video-call' ? videoCall : undefined,
      interviewers: interviewers.map(int => ({
        user: int.userId,
        role: int.role
      }))
    });
    
    await interview.save();
    
    // Populate the response
    await interview.populate('recruiter', 'name email');
    await interview.populate('candidate', 'name email');
    await interview.populate('job', 'title company');
    await interview.populate('interviewers.user', 'name email');
    
    // Emit real-time notification
    if (global.io && global.connectedUsers) {
      const candidateSocketId = global.connectedUsers.get(candidateId);
      
      if (candidateSocketId) {
        global.io.to(candidateSocketId).emit("interview_scheduled", {
          type: "interview_scheduled",
          interview: interview,
          message: `New interview scheduled: ${interview.title}`,
          timestamp: new Date()
        });
        
        console.log(`📅 Interview notification sent to candidate ${candidateId}`);
      }
    }
    
    res.status(201).json({ interview });
    
  } catch (err) {
    console.error("Schedule interview error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Confirm interview attendance
export const confirmInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    
    // Check if user can confirm
    const canConfirm = (userRole === 'recruiter' && interview.recruiter.toString() === userId) ||
                      (userRole === 'candidate' && interview.candidate.toString() === userId);
    
    if (!canConfirm) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await interview.confirmAttendance(userId, userRole);
    await interview.populate('recruiter', 'name email');
    await interview.populate('candidate', 'name email');
    await interview.populate('job', 'title');
    
    // Notify the other party
    if (global.io && global.connectedUsers) {
      const otherUserId = userRole === 'recruiter' ? 
        interview.candidate._id.toString() : 
        interview.recruiter._id.toString();
        
      const otherUserSocketId = global.connectedUsers.get(otherUserId);
      
      if (otherUserSocketId) {
        global.io.to(otherUserSocketId).emit("interview_confirmed", {
          type: "interview_confirmed",
          interview: interview,
          confirmedBy: userRole,
          timestamp: new Date()
        });
      }
    }
    
    res.json({ interview, message: "Interview confirmed successfully" });
    
  } catch (err) {
    console.error("Confirm interview error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reschedule interview
export const rescheduleInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { newDate, reason } = req.body;
    
    if (!newDate) {
      return res.status(400).json({ error: "New date is required" });
    }
    
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    
    // Check if user can reschedule - Only recruiters can reschedule interviews
    const canReschedule = (userRole === 'recruiter' && interview.recruiter.toString() === userId);
    
    if (!canReschedule) {
      return res.status(403).json({ error: "Access denied. Only recruiters can reschedule interviews." });
    }
    
    // Check for conflicts with new time
    const newStartTime = new Date(newDate);
    const newEndTime = new Date(newStartTime.getTime() + (interview.duration * 60 * 1000));
    
    const conflicts = await Interview.checkConflicts(
      userId, userRole, newStartTime, newEndTime, interview._id
    );
    
    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: "Scheduling conflict at the new time",
        conflicts 
      });
    }
    
    await interview.reschedule(newStartTime, reason, userId);
    await interview.populate('recruiter', 'name email');
    await interview.populate('candidate', 'name email');
    await interview.populate('job', 'title');
    
    // Notify the other party
    if (global.io && global.connectedUsers) {
      const otherUserId = userRole === 'recruiter' ? 
        interview.candidate._id.toString() : 
        interview.recruiter._id.toString();
        
      const otherUserSocketId = global.connectedUsers.get(otherUserId);
      
      if (otherUserSocketId) {
        global.io.to(otherUserSocketId).emit("interview_rescheduled", {
          type: "interview_rescheduled",
          interview: interview,
          rescheduledBy: userRole,
          reason: reason,
          timestamp: new Date()
        });
      }
    }
    
    res.json({ interview, message: "Interview rescheduled successfully" });
    
  } catch (err) {
    console.error("Reschedule interview error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Cancel interview
export const cancelInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;
    
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    
    // Check if user can cancel
    const canCancel = (userRole === 'recruiter' && interview.recruiter.toString() === userId) ||
                     (userRole === 'candidate' && interview.candidate.toString() === userId);
    
    if (!canCancel) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await interview.cancel(reason, userId);
    await interview.populate('recruiter', 'name email');
    await interview.populate('candidate', 'name email');
    await interview.populate('job', 'title');
    
    // Notify the other party
    if (global.io && global.connectedUsers) {
      const otherUserId = userRole === 'recruiter' ? 
        interview.candidate._id.toString() : 
        interview.recruiter._id.toString();
        
      const otherUserSocketId = global.connectedUsers.get(otherUserId);
      
      if (otherUserSocketId) {
        global.io.to(otherUserSocketId).emit("interview_cancelled", {
          type: "interview_cancelled",
          interview: interview,
          cancelledBy: userRole,
          reason: reason,
          timestamp: new Date()
        });
      }
    }
    
    res.json({ interview, message: "Interview cancelled successfully" });
    
  } catch (err) {
    console.error("Cancel interview error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Submit interview feedback
export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { feedback } = req.body;
    
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    
    // Check if user participated in interview
    const canSubmitFeedback = (userRole === 'recruiter' && interview.recruiter.toString() === userId) ||
                             (userRole === 'candidate' && interview.candidate.toString() === userId);
    
    if (!canSubmitFeedback) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Update feedback based on user role
    if (userRole === 'recruiter') {
      interview.feedback.recruiterFeedback = {
        ...feedback,
        submittedAt: new Date(),
        submittedBy: userId
      };
    } else {
      interview.feedback.candidateFeedback = {
        ...feedback,
        submittedAt: new Date()
      };
    }
    
    await interview.save();
    
    res.json({ 
      interview, 
      message: "Feedback submitted successfully" 
    });
    
  } catch (err) {
    console.error("Submit feedback error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get interview availability slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { candidateId, date, duration = 60 } = req.query;
    const recruiterId = req.user.id;
    
    if (!candidateId || !date) {
      return res.status(400).json({ error: "Candidate ID and date are required" });
    }
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(18, 0, 0, 0); // 6 PM
    
    // Get existing interviews for both users
    const [recruiterInterviews, candidateInterviews] = await Promise.all([
      Interview.find({
        recruiter: recruiterId,
        scheduledDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
        isActive: true
      }).select('scheduledDate duration'),
      
      Interview.find({
        candidate: candidateId,
        scheduledDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
        isActive: true
      }).select('scheduledDate duration')
    ]);
    
    // Generate time slots (30-minute intervals)
    const slots = [];
    const slotDuration = 30; // minutes
    const requestedDuration = parseInt(duration);
    
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart.getTime() + (requestedDuration * 60 * 1000));
        
        // Don't suggest slots that go beyond working hours
        if (slotEnd.getHours() > 18) {
          continue;
        }
        
        // Check if slot conflicts with existing interviews
        const hasConflict = [...recruiterInterviews, ...candidateInterviews].some(interview => {
          const interviewStart = new Date(interview.scheduledDate);
          const interviewEnd = new Date(interviewStart.getTime() + (interview.duration * 60 * 1000));
          
          return (slotStart < interviewEnd && slotEnd > interviewStart);
        });
        
        if (!hasConflict) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            duration: requestedDuration,
            available: true
          });
        }
      }
    }
    
    res.json({ 
      date: targetDate,
      availableSlots: slots,
      totalSlots: slots.length
    });
    
  } catch (err) {
    console.error("Get available slots error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get interview statistics
export const getInterviewStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let matchQuery = { isActive: true };
    if (userRole === 'recruiter') {
      matchQuery.recruiter = userId;
    } else {
      matchQuery.candidate = userId;
    }
    
    const stats = await Interview.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get upcoming interviews count
    const upcomingCount = await Interview.countDocuments({
      ...matchQuery,
      scheduledDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    // Get this week's interviews
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const thisWeekCount = await Interview.countDocuments({
      ...matchQuery,
      scheduledDate: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });
    
    res.json({
      statusBreakdown: stats,
      upcomingInterviews: upcomingCount,
      thisWeekInterviews: thisWeekCount,
      totalInterviews: stats.reduce((sum, stat) => sum + stat.count, 0)
    });
    
  } catch (err) {
    console.error("Get interview stats error:", err);
    res.status(500).json({ error: err.message });
  }
};