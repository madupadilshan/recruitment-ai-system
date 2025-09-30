// recruitment-ai-system/backend/routes/interviews.js

import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getInterviews,
  getInterview,
  scheduleInterview,
  confirmInterview,
  rescheduleInterview,
  cancelInterview,
  submitFeedback,
  getAvailableSlots,
  getInterviewStats
} from '../controllers/interviewController.js';

const router = express.Router();

// Get all interviews for user
router.get('/', authMiddleware, getInterviews);

// Get interview statistics
router.get('/stats', authMiddleware, getInterviewStats);

// Get available time slots
router.get('/available-slots', authMiddleware, getAvailableSlots);

// Get single interview
router.get('/:id', authMiddleware, getInterview);

// Schedule new interview (recruiter only)
router.post('/', authMiddleware, scheduleInterview);

// Confirm interview attendance
router.patch('/:id/confirm', authMiddleware, confirmInterview);

// Reschedule interview
router.patch('/:id/reschedule', authMiddleware, rescheduleInterview);

// Cancel interview
router.patch('/:id/cancel', authMiddleware, cancelInterview);

// Submit interview feedback
router.post('/:id/feedback', authMiddleware, submitFeedback);

export default router;