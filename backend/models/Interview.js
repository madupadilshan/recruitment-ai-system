// recruitment-ai-system/backend/models/Interview.js

import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  // Basic interview information
  title: {
    type: String,
    required: true,
    trim: true,
    default: "Job Interview"
  },
  
  // Participants
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  
  // Job context
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  },
  
  // Interview scheduling details
  scheduledDate: {
    type: Date,
    required: true
  },
  
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60,
    min: 15,
    max: 240
  },
  
  timeZone: {
    type: String,
    required: true,
    default: "UTC"
  },
  
  // Interview format
  format: {
    type: String,
    required: true,
    enum: ["in-person", "video-call", "phone", "online-assessment"],
    default: "video-call"
  },
  
  // Meeting details
  location: {
    address: {
      type: String,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    }
  },
  
  videoCall: {
    platform: {
      type: String,
      enum: ["zoom", "google-meet", "microsoft-teams", "skype", "other"],
      default: "zoom"
    },
    meetingUrl: {
      type: String,
      trim: true
    },
    meetingId: {
      type: String,
      trim: true
    },
    passcode: {
      type: String,
      trim: true
    }
  },
  
  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "rescheduled"],
    default: "scheduled"
  },
  
  // Confirmation tracking
  recruiterConfirmed: {
    type: Boolean,
    default: false
  },
  
  candidateConfirmed: {
    type: Boolean,
    default: false
  },
  
  // Interview content
  interviewType: {
    type: String,
    required: true,
    enum: ["technical", "behavioral", "hr", "panel", "screening", "final"],
    default: "screening"
  },
  
  interviewStage: {
    type: String,
    enum: ["initial", "second", "final", "follow-up"],
    default: "initial"
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  requirements: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Interviewers (for panel interviews)
  interviewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: {
      type: String,
      trim: true
    },
    confirmed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Reminders and notifications
  reminders: {
    candidate: [{
      type: {
        type: String,
        enum: ["email", "sms", "in-app"],
        default: "email"
      },
      timing: {
        type: Number, // minutes before interview
        default: 60
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }],
    recruiter: [{
      type: {
        type: String,
        enum: ["email", "sms", "in-app"],
        default: "email"
      },
      timing: {
        type: Number,
        default: 30
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }]
  },
  
  // Interview results and feedback
  feedback: {
    recruiterFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      technicalSkills: {
        type: Number,
        min: 1,
        max: 5
      },
      communication: {
        type: Number,
        min: 1,
        max: 5
      },
      culturalFit: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: {
        type: String,
        maxlength: 2000
      },
      recommendation: {
        type: String,
        enum: ["hire", "no-hire", "maybe", "next-round"],
        default: "maybe"
      },
      submittedAt: Date,
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    
    candidateFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      experience: {
        type: String,
        enum: ["excellent", "good", "average", "poor"],
        default: "good"
      },
      comments: {
        type: String,
        maxlength: 1000
      },
      submittedAt: Date
    }
  },
  
  // Rescheduling history
  rescheduleHistory: [{
    originalDate: {
      type: Date,
      required: true
    },
    newDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      maxlength: 500
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cancellation details
  cancellation: {
    reason: {
      type: String,
      maxlength: 500
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    cancelledAt: Date
  },
  
  // Additional metadata
  notes: {
    type: String,
    maxlength: 2000
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Indexes for performance
interviewSchema.index({ recruiter: 1, scheduledDate: 1 });
interviewSchema.index({ candidate: 1, scheduledDate: 1 });
interviewSchema.index({ job: 1, scheduledDate: 1 });
interviewSchema.index({ status: 1, scheduledDate: 1 });
interviewSchema.index({ scheduledDate: 1 });

// Virtual for interview duration in hours
interviewSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual for interview end time
interviewSchema.virtual('endTime').get(function() {
  if (this.scheduledDate && this.duration) {
    return new Date(this.scheduledDate.getTime() + (this.duration * 60 * 1000));
  }
  return null;
});

// Virtual for confirmation status
interviewSchema.virtual('isConfirmed').get(function() {
  return this.recruiterConfirmed && this.candidateConfirmed;
});

// Method to confirm attendance
interviewSchema.methods.confirmAttendance = function(userId, userRole) {
  if (userRole === 'recruiter' && this.recruiter.toString() === userId) {
    this.recruiterConfirmed = true;
  } else if (userRole === 'candidate' && this.candidate.toString() === userId) {
    this.candidateConfirmed = true;
  }
  
  // Update status if both confirmed
  if (this.recruiterConfirmed && this.candidateConfirmed && this.status === 'scheduled') {
    this.status = 'confirmed';
  }
  
  return this.save();
};

// Method to reschedule interview
interviewSchema.methods.reschedule = function(newDate, reason, requestedBy) {
  // Add to history
  this.rescheduleHistory.push({
    originalDate: this.scheduledDate,
    newDate: newDate,
    reason: reason,
    requestedBy: requestedBy
  });
  
  // Update interview
  this.scheduledDate = newDate;
  this.status = 'rescheduled';
  this.recruiterConfirmed = false;
  this.candidateConfirmed = false;
  
  return this.save();
};

// Method to cancel interview
interviewSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellation = {
    reason: reason,
    cancelledBy: cancelledBy,
    cancelledAt: new Date()
  };
  
  return this.save();
};

// Static method to find upcoming interviews
interviewSchema.statics.findUpcoming = function(userId, userRole, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const query = {
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['scheduled', 'confirmed'] },
    isActive: true
  };
  
  if (userRole === 'recruiter') {
    query.recruiter = userId;
  } else {
    query.candidate = userId;
  }
  
  return this.find(query)
    .populate('recruiter', 'name email')
    .populate('candidate', 'name email')
    .populate('job', 'title company')
    .sort({ scheduledDate: 1 });
};

// Static method to check for scheduling conflicts
interviewSchema.statics.checkConflicts = function(userId, userRole, startTime, endTime, excludeId = null) {
  const query = {
    scheduledDate: {
      $lt: endTime
    },
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    isActive: true
  };
  
  // Check if interview end time conflicts
  query.$expr = {
    $gt: [{
      $add: ["$scheduledDate", { $multiply: ["$duration", 60000] }]
    }, startTime]
  };
  
  if (userRole === 'recruiter') {
    query.recruiter = userId;
  } else {
    query.candidate = userId;
  }
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

export default mongoose.model("Interview", interviewSchema);