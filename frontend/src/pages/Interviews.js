// recruitment-ai-system/frontend/src/pages/Interviews.js

import React, { useState, useEffect } from 'react';
import { interviewAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationSystem';

const Interviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showWarning } = useNotification();
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Form states
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    reason: ''
  });
  
  const [cancelForm, setCancelForm] = useState({
    reason: ''
  });
  
  // Load interviews and stats
  const loadInterviews = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (activeTab === 'upcoming') {
        params.upcoming = 'true';
      } else if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      const response = await interviewAPI.getInterviews(params);
      setInterviews(response.data.interviews);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const response = await interviewAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadInterviews();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);
  
  // Confirm interview
  const handleConfirm = async (interviewId) => {
    try {
      await interviewAPI.confirmInterview(interviewId);
      loadInterviews();
      setShowConfirmModal(false);
      setSelectedInterview(null);
    } catch (error) {
      console.error('Failed to confirm interview:', error);
      showError('Failed to confirm interview. Please try again.');
    }
  };
  
  // Reschedule interview
  const handleReschedule = async () => {
    try {
      if (!rescheduleForm.newDate) {
        showWarning('Please select a new date and time');
        return;
      }
      
      await interviewAPI.rescheduleInterview(
        selectedInterview._id,
        rescheduleForm.newDate,
        rescheduleForm.reason
      );
      
      loadInterviews();
      setShowRescheduleModal(false);
      setSelectedInterview(null);
      setRescheduleForm({ newDate: '', reason: '' });
      
    } catch (error) {
      console.error('Failed to reschedule interview:', error);
      showError('Failed to reschedule interview. Please try again.');
    }
  };
  
  // Cancel interview
  const handleCancel = async () => {
    try {
      await interviewAPI.cancelInterview(selectedInterview._id, cancelForm.reason);
      
      loadInterviews();
      setShowCancelModal(false);
      setSelectedInterview(null);
      setCancelForm({ reason: '' });
      
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      showError('Failed to cancel interview. Please try again.');
    }
  };
  
  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    };
  };
  
  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rescheduled': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // Get format icon
  const getFormatIcon = (format) => {
    const icons = {
      'video-call': '📹',
      'in-person': '🏢',
      'phone': '📞',
      'online-assessment': '💻'
    };
    return icons[format] || '📅';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container px-4 py-8 mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📅 My Interviews</h1>
            <p className="mt-2 text-gray-600">
              Manage your interview schedule and appointments
            </p>
          </div>
          
          {user.role === 'recruiter' && (
            <button
              onClick={() => navigate('/schedule-interview')}
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              📅 Schedule Interview
            </button>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {stats.upcomingInterviews || 0}
            </div>
            <p className="text-gray-600">Upcoming</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {stats.thisWeekInterviews || 0}
            </div>
            <p className="text-gray-600">This Week</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalInterviews || 0}
            </div>
            <p className="text-gray-600">Total</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {stats.statusBreakdown?.find(s => s._id === 'confirmed')?.count || 0}
            </div>
            <p className="text-gray-600">Confirmed</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex px-6 space-x-8">
              {[
                { key: 'all', label: 'All Interviews', count: interviews.length },
                { key: 'upcoming', label: 'Upcoming', count: stats.upcomingInterviews },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'rescheduled', label: 'Rescheduled' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Interviews List */}
          <div className="p-6">
            {interviews.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">📅</div>
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  No interviews found
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'upcoming' 
                    ? "You don't have any upcoming interviews scheduled"
                    : `No ${activeTab === 'all' ? '' : activeTab} interviews to display`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map(interview => {
                  const datetime = formatDateTime(interview.scheduledDate);
                  
                  return (
                    <div
                      key={interview._id}
                      className="p-6 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2 space-x-3">
                            <span className="text-2xl">{getFormatIcon(interview.format)}</span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {interview.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                              {interview.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-sm text-gray-600">📊 Job Position</p>
                              <p className="font-medium">{interview.job.title}</p>
                              <p className="text-sm text-gray-500">
                                {typeof interview.job.company === 'object' && interview.job.company !== null
                                  ? (interview.job.company.name || 'Company')
                                  : (interview.job.company || 'Company')
                                }
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">👤 {user.role === 'recruiter' ? 'Candidate' : 'Recruiter'}</p>
                              <p className="font-medium">
                                {user.role === 'recruiter' ? interview.candidate.name : interview.recruiter.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.role === 'recruiter' ? interview.candidate.email : interview.recruiter.email}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">📅 Date & Time</p>
                              <p className="font-medium">{datetime.date}</p>
                              <p className="text-sm text-gray-500">{datetime.time}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">⏱️ Duration</p>
                              <p className="font-medium">{interview.duration} minutes</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">🎯 Interview Type</p>
                              <p className="font-medium capitalize">{interview.interviewType}</p>
                              <p className="text-sm text-gray-500">({interview.interviewStage})</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">📍 Format</p>
                              <p className="font-medium capitalize">{interview.format.replace('-', ' ')}</p>
                            </div>
                          </div>
                          
                          {interview.description && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-600">📝 Description</p>
                              <p className="mt-1 text-gray-800">{interview.description}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col ml-6 space-y-2">
                          <Link
                            to={`/interviews/${interview._id}`}
                            className="px-4 py-2 text-sm font-medium text-center text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            📄 View Details
                          </Link>
                          
                          {['scheduled', 'rescheduled'].includes(interview.status) && (
                            <button
                              onClick={() => {
                                setSelectedInterview(interview);
                                setShowConfirmModal(true);
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                              ✅ Confirm
                            </button>
                          )}
                          
                          {['scheduled', 'confirmed', 'rescheduled'].includes(interview.status) && (
                            <>
                              {user.role === 'recruiter' && (
                                <button
                                  onClick={() => {
                                    setSelectedInterview(interview);
                                    setShowRescheduleModal(true);
                                  }}
                                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                                >
                                  🔄 Reschedule
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setSelectedInterview(interview);
                                  setShowCancelModal(true);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                              >
                                ❌ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirm Modal */}
      {showConfirmModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Confirm Interview</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to confirm your attendance for this interview?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm(selectedInterview._id)}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reschedule Modal */}
      {showRescheduleModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Reschedule Interview</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={rescheduleForm.newDate}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, newDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Reason (Optional)
                </label>
                <textarea
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why are you rescheduling this interview?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="px-4 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Modal */}
      {showCancelModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Cancel Interview</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ reason: e.target.value })}
                  placeholder="Please provide a reason for cancelling..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Keep Interview
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelForm.reason.trim()}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Interviews;