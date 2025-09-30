// recruitment-ai-system/frontend/src/pages/ScheduleInterview.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { interviewAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import api from '../utils/api';

const ScheduleInterview = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Utility function to safely extract string from object
  const safeStringify = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      // Handle specific object types safely
      if (value.name && typeof value.name === 'string') return value.name;
      if (value.title && typeof value.title === 'string') return value.title;
      if (value.city && typeof value.city === 'string') return value.city;
      // Never render objects directly - return fallback instead
      console.warn('Attempted to render object directly:', value);
      return fallback;
    }
    return String(value);
  };
  
  // Get pre-filled data from URL params
  const candidateId = searchParams.get('candidateId');
  const jobId = searchParams.get('jobId');
  const applicationId = searchParams.get('applicationId');
  
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState({
    candidateId: candidateId || '',
    jobId: jobId || '',
    applicationId: applicationId || '',
    scheduledDate: '',
    duration: 60,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    format: 'video-call',
    interviewType: 'screening',
    interviewStage: 'initial',
    title: '',
    description: '',
    requirements: '',
    location: {
      address: '',
      instructions: ''
    },
    videoCall: {
      platform: 'zoom',
      meetingUrl: '',
      meetingId: '',
      passcode: ''
    }
  });
  
  const loadCandidates = async () => {
    try {
      console.log('🔄 Loading candidates...');
      const response = await api.get('/users?role=candidate');
      console.log('✅ Candidates response:', response.data);
      
      // Ensure we have valid candidates array
      const candidatesArray = Array.isArray(response.data.users) ? response.data.users : [];
      setCandidates(candidatesArray);
      console.log('📝 Candidates set:', candidatesArray.length);
    } catch (error) {
      console.error('❌ Failed to load candidates:', error);
      console.error('❌ Error response:', error.response?.data);
      setCandidates([]); // Set empty array on error
    }
  };
  
  const loadJobs = async () => {
    try {
      console.log('🔄 Loading jobs...');
      console.log('🔍 Current user:', user);
      const response = await api.get('/jobs');
      console.log('✅ Jobs response:', response.data?.length ? 'Got jobs' : 'No jobs');
      console.log('✅ Jobs count:', response.data?.length || 0);
      
      // Ensure we have valid jobs array
      if (!Array.isArray(response.data)) {
        console.error('❌ Jobs response is not an array:', typeof response.data);
        setJobs([]);
        return;
      }
      
      // Debug first job structure
      if (response.data.length > 0) {
        console.log('📊 First job structure - title:', response.data[0].title);
        console.log('📊 First job recruiter ID:', response.data[0].recruiter?._id || response.data[0].recruiter);
      }
      
      // Filter jobs belonging to current recruiter
      const recruiterJobs = response.data.filter(job => {
        const jobRecruiterId = job.recruiter?._id || job.recruiter;
        const currentUserId = user?.id || user?.userId || user?._id;
        
        console.log(`🔍 Comparing job recruiter ${jobRecruiterId} with current user ${currentUserId}`);
        
        return jobRecruiterId === currentUserId;
      });
      
      console.log('📝 Recruiter jobs count:', recruiterJobs.length);
      
      // If no recruiter jobs found, show all jobs for debugging (in development)
      if (recruiterJobs.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('⚠️ No recruiter jobs found, showing all jobs for debugging');
        setJobs(response.data);
      } else {
        setJobs(recruiterJobs);
      }
    } catch (error) {
      console.error('❌ Failed to load jobs:', error);
      console.error('❌ Error response:', error.response?.data);
      setJobs([]); // Set empty array on error
    }
  };

  // Load candidates and jobs on mount
  useEffect(() => {
    if (user && user.role === 'recruiter') {
      loadCandidates();
      loadJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const loadAvailableSlots = async (candidateId, date, duration) => {
    try {
      setLoadingSlots(true);
      const response = await interviewAPI.getAvailableSlots(candidateId, date, duration);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Load available slots when candidate and date selected
  useEffect(() => {
    if (formData.candidateId && formData.scheduledDate) {
      const dateOnly = formData.scheduledDate.split('T')[0];
      loadAvailableSlots(formData.candidateId, dateOnly, formData.duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.candidateId, formData.scheduledDate, formData.duration]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSlotSelect = (slot) => {
    setFormData(prev => ({
      ...prev,
      scheduledDate: new Date(slot.startTime).toISOString().slice(0, 16)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.candidateId || !formData.jobId || !formData.scheduledDate) {
      showWarning('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Safely get the selected job for title construction
      const selectedJobForTitle = jobs.find(j => j._id === formData.jobId);
      const jobTitle = selectedJobForTitle?.title || 'Job Interview';
      
      const interviewData = {
        ...formData,
        title: formData.title || `${formData.interviewType} Interview - ${jobTitle}`
      };
      
      await interviewAPI.scheduleInterview(interviewData);
      
      showSuccess('Interview scheduled successfully!');
      navigate('/interviews');
      
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      
      if (error.response?.status === 409) {
        showError('Scheduling conflict: There is already an interview scheduled at this time.');
      } else {
        showError('Failed to schedule interview. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const selectedCandidate = candidates.find(c => c._id === formData.candidateId);
  const selectedJob = jobs.find(j => j && j._id === formData.jobId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">📅 Schedule Interview</h1>
            <p className="text-gray-600 mt-2">
              Set up a new interview with a candidate
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">📋 Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate *
                  </label>
                  <select
                    name="candidateId"
                    value={formData.candidateId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a candidate</option>
                    {Array.isArray(candidates) && candidates.map(candidate => (
                      <option key={candidate._id} value={candidate._id}>
                        {safeStringify(candidate.name, 'Unknown')} ({safeStringify(candidate.email, 'No email')})
                      </option>
                    ))}
                  </select>
                  
                  {selectedCandidate && (
                    <p className="text-sm text-gray-600 mt-1">
                      📧 {safeStringify(selectedCandidate.email, 'No email')}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Position *
                  </label>
                  <select
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a job</option>
                    {Array.isArray(jobs) && jobs.map((job, index) => {
                      // Safe handling of job data
                      if (!job || typeof job !== 'object') return null;
                      
                      const jobTitle = safeStringify(job.title, 'Untitled');
                      const companyName = safeStringify(job.company, 'Company');
                      
                      return (
                        <option key={job._id || index} value={job._id}>
                          {jobTitle} - {companyName}
                        </option>
                      );
                    })}
                  </select>
                  
                  {selectedJob && (
                    <p className="text-sm text-gray-600 mt-1">
                      🏢 {safeStringify(selectedJob.company, 'Company')} • 📍 {safeStringify(selectedJob.location, 'Location')}
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Technical Interview - Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Interview Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🎯 Interview Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type
                  </label>
                  <select
                    name="interviewType"
                    value={formData.interviewType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="screening">Screening</option>
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="hr">HR Interview</option>
                    <option value="panel">Panel Interview</option>
                    <option value="final">Final Interview</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Stage
                  </label>
                  <select
                    name="interviewStage"
                    value={formData.interviewStage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="initial">Initial</option>
                    <option value="second">Second Round</option>
                    <option value="final">Final Round</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the interview..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements/Preparation
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    placeholder="What should the candidate prepare or bring?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                  />
                </div>
              </div>
            </div>
            
            {/* Scheduling */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">📅 Scheduling</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    name="timeZone"
                    value={formData.timeZone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
              </div>
              
              {/* Available Slots */}
              {formData.candidateId && formData.scheduledDate && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    🕐 Available Time Slots
                  </h3>
                  
                  {loadingSlots ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading available slots...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-3 border rounded-lg text-sm transition-colors ${
                            formData.scheduledDate === new Date(slot.startTime).toISOString().slice(0, 16)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white hover:bg-blue-50 border-gray-300'
                          }`}
                        >
                          {new Date(slot.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        ⚠️ No available slots found for this date. Please try a different date.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Format */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">📍 Interview Format</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="video-call">📹 Video Call</option>
                  <option value="in-person">🏢 In-Person</option>
                  <option value="phone">📞 Phone Call</option>
                  <option value="online-assessment">💻 Online Assessment</option>
                </select>
              </div>
              
              {formData.format === 'video-call' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select
                      name="videoCall.platform"
                      value={formData.videoCall.platform}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="zoom">Zoom</option>
                      <option value="google-meet">Google Meet</option>
                      <option value="microsoft-teams">Microsoft Teams</option>
                      <option value="skype">Skype</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting URL
                    </label>
                    <input
                      type="url"
                      name="videoCall.meetingUrl"
                      value={formData.videoCall.meetingUrl}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/j/123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      name="videoCall.meetingId"
                      value={formData.videoCall.meetingId}
                      onChange={handleInputChange}
                      placeholder="123-456-789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passcode
                    </label>
                    <input
                      type="text"
                      name="videoCall.passcode"
                      value={formData.videoCall.passcode}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {formData.format === 'in-person' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St, City, State 12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      name="location.instructions"
                      value={formData.location.instructions}
                      onChange={handleInputChange}
                      placeholder="Parking information, building entrance, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/interviews')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scheduling...
                  </span>
                ) : (
                  '📅 Schedule Interview'
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterview;