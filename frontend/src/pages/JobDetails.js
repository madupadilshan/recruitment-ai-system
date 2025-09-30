// recruitment-ai-system/frontend/src/pages/JobDetails.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { messageAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast, ToastContainer } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";

function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const navigate = useNavigate();
  
  // Modern toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  
  // Modern confirmation dialog
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch((err) => {
        console.error("Error fetching job:", err);
        navigate("/dashboard");
      });
  }, [id, navigate]);

  // ✅ FIXED: Complete file upload function
  const applyJobWithFile = async () => {
    if (!selectedFile) {
      showWarning("Please select a CV file first.");
      return;
    }

    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append("cvFile", selectedFile);
    formData.append("candidateId", user.userId);
    formData.append("jobId", id);

    try {
      const response = await api.post("/applications/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("✅ Application submitted:", response.data);
      
      setUploadStatus('success');
      showSuccess("Application submitted successfully! Your CV is being analyzed.");
      setShowUploadModal(false);
    } catch (err) {
      setUploadStatus('error');
      console.error("Application upload error:", err);
      showError("Error submitting application. Please try again.");
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Start conversation with recruiter
  const startConversation = async () => {
    try {
      console.log("🔄 Starting conversation with recruiter...");
      console.log("User:", user);
      console.log("Recruiter ID:", job.recruiter._id);
      console.log("Job ID:", job._id);
      console.log("API Base URL:", process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      const response = await messageAPI.startConversation(job.recruiter._id, {
        jobId: job._id
      });
      
      console.log("✅ Conversation started:", response.data);
      
      // Redirect to messages page with conversation
      navigate(`/messages?conversationId=${response.data.conversationId}`);
      
    } catch (error) {
      console.error("❌ Error starting conversation:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error config:", error.config);
      console.error("❌ Network error:", error.code);
      
      let errorMessage = "Failed to start conversation. Please try again.";
      
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      } else if (error.response?.status === 401) {
        errorMessage = "You need to be logged in to start a conversation.";
      } else if (error.response?.status === 404) {
        errorMessage = "Recruiter not found. Please try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showError(errorMessage);
    }
  };

  const handleDeleteJob = async () => {
    showConfirm({
      title: "Delete Job",
      message: "Are you sure you want to delete this job and all its applications? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/jobs/${id}`);
          showSuccess("Job deleted successfully.");
          navigate("/dashboard");
        } catch (err) {
          showError("Error deleting job.");
          console.error(err);
        }
      }
    });
  };

  const handleScheduleInterview = () => {
    try {
      console.log("📅 Navigating to Schedule Interview with job ID:", job._id);
      // Navigate to schedule interview page with job pre-selected
      navigate(`/schedule-interview?jobId=${job._id}`);
    } catch (error) {
      console.error("❌ Error navigating to Schedule Interview:", error);
      showError("Error loading Schedule Interview page. Please try again.");
    }
  };

  if (!job) return <p className="p-6">Loading job details...</p>;
  
  const isOwner = user?.role === 'recruiter' && (
    user?.userId === job.recruiter?._id || 
    user?.id === job.recruiter?._id ||
    user?._id === job.recruiter?._id
  );

  console.log("🔍 JobDetails Debug Info:");
  console.log("User:", user);
  console.log("Job Recruiter:", job.recruiter);
  console.log("Is Owner:", isOwner);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">
        ← Back
      </button>

      <div className="p-6 bg-white shadow rounded-xl">
        <h2 className="mb-2 text-2xl font-bold">{job.title}</h2>
        <p className="mb-4 text-gray-600 whitespace-pre-wrap">{job.description}</p>
        <p className="mb-4 text-sm text-gray-500">Posted by: {job.recruiter?.name} ({job.recruiter?.email})</p>

        <div className="flex items-center gap-4">
          {user?.role === "candidate" && (
            <>
              <button 
                className="px-4 py-2 text-white bg-green-500 rounded-lg shadow hover:bg-green-600"
                onClick={() => setShowUploadModal(true)}
              >
                📤 Apply with CV Upload
              </button>
              
              <button 
                className="px-4 py-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
                onClick={startConversation}
              >
                💬 Contact Recruiter
              </button>
            </>
          )}

          {isOwner && (
            <>
              <button 
                onClick={handleScheduleInterview}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
              >
                📅 Schedule Interview
              </button>
              <Link to={`/edit-job/${job._id}`} className="px-4 py-2 text-white bg-yellow-500 rounded-lg shadow hover:bg-yellow-600">
                Edit Job
              </Link>
              <button onClick={handleDeleteJob} className="px-4 py-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600">
                Delete Job
              </button>
            </>
          )}
        </div>
      </div>

      {/* ✅ FIXED: CV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-xl w-96">
            <h3 className="mb-4 text-xl font-bold">Upload Your CV</h3>
            <p className="mb-4 text-sm text-gray-600">Upload your CV to apply for: {job.title}</p>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Select CV File (PDF/DOCX)</label>
              <input 
                type="file" 
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="w-full p-2 border rounded"
                disabled={uploadStatus === 'uploading'}
              />
            </div>
            
            {selectedFile && (
              <p className="mb-4 text-sm text-green-600">Selected: {selectedFile.name}</p>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={uploadStatus === 'uploading'}
              >
                Cancel
              </button>
              <button 
                onClick={applyJobWithFile}
                disabled={!selectedFile || uploadStatus === 'uploading'}
                className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Submit Application'}
              </button>
            </div>
            
            {uploadStatus === 'error' && (
              <p className="mt-3 text-sm text-red-500">Upload failed. Please try again.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Modern Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Modern Confirmation Dialog */}
      <ConfirmDialogComponent />
    </div>
  );
}

export default JobDetails;