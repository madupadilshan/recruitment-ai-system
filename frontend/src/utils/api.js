// Axios instance
import axios from "axios";

// Use the API URL from the environment variable or default to localhost for development
const API_URL = process.env.REACT_APP_API_URL || '/api';  // Default to localhost for development

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem("user");
  if (user) {
    const token = JSON.parse(user).token;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Messaging API methods
export const messageAPI = {
  getConversations: () => api.get('/conversations'),
  startConversation: (userId, context = {}) => api.post('/conversations', { userId, context }),
  getMessages: (conversationId, page = 1, limit = 50) => api.get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (conversationId) => api.patch(`/conversations/${conversationId}/read`),
  deleteConversation: (conversationId) => api.delete(`/conversations/${conversationId}`)
};

// Interview API methods
export const interviewAPI = {
  getInterviews: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/interviews?${queryString}`);
  },
  getInterview: (id) => api.get(`/interviews/${id}`),
  scheduleInterview: (interviewData) => api.post('/interviews', interviewData),
  confirmInterview: (id) => api.patch(`/interviews/${id}/confirm`),
  rescheduleInterview: (id, newDate, reason) => api.patch(`/interviews/${id}/reschedule`, { newDate, reason }),
  cancelInterview: (id, reason) => api.patch(`/interviews/${id}/cancel`, { reason }),
  submitFeedback: (id, feedback) => api.post(`/interviews/${id}/feedback`, { feedback }),
  getAvailableSlots: (candidateId, date, duration = 60) => api.get(`/interviews/available-slots?candidateId=${candidateId}&date=${date}&duration=${duration}`),
  getStats: () => api.get('/interviews/stats')
};

export default api;
