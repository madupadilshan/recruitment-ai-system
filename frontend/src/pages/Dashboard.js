// recruitment-ai-system/frontend/src/pages/Dashboard.js

import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ProfileSetupModal from "../components/ProfileSetupModal";
import AdvancedSearch from "../components/AdvancedSearch";
import { useNotification } from "../components/NotificationSystem";

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRecommended, setShowRecommended] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [aiMatches, setAiMatches] = useState(0);

  // ✅ NEW: Advanced Search State
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPagination, setSearchPagination] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    setLoading(true);
    api.get("/users/me")
      .then((res) => {
        setProfile(res.data);
        // Show CV upload modal for new candidates without complete profiles
        if (res.data.role === "candidate" && !res.data.profileComplete && !res.data.cvUploaded) {
          setShowProfileSetup(true);
        }
        // Removed fallback manual profile completion modal - CV upload is preferred
      })
      .catch((err) => console.error("Error fetching profile:", err));

    api.get("/jobs")
      .then((res) => {
        if (user?.role === "recruiter") {
          const myJobs = res.data.filter((job) => job.recruiter?._id === user.userId);
          setJobs(myJobs);
        } else {
          setJobs(res.data);
        }
      })
      .catch((err) => console.error("Error fetching jobs:", err))
      .finally(() => setLoading(false));

    if (user?.role === "candidate") {
      api.get("/jobs/recommended")
        .then((res) => {
          console.log("📊 Recommended jobs response:", res.data);
          // Handle new API response format
          const recommendedJobsData = res.data.recommendedJobs || res.data;
          setRecommended(recommendedJobsData);
          setRecommendedJobs(recommendedJobsData.length);
          
          if (recommendedJobsData.length === 0 && res.data.message) {
            console.log("ℹ️  Recommendation message:", res.data.message);
          }
        })
        .catch((err) => {
          console.error("❌ Error fetching recommended jobs:", err);
          setRecommended([]);
          setRecommendedJobs(0);
        });
    }

    if (user?.role === "recruiter") {
      api.get("/applications/count/by-recruiter").then((res) => {
          setTotalApplicants(res.data.count);
      }).catch(() => setTotalApplicants(0));
      
      api.get("/applications/count/matches-today").then((res) => {
          setAiMatches(res.data.count);
      }).catch(() => setAiMatches(0));
    }
  }, [user]);

  const handleProfileSetupComplete = (analysisResult) => {
    console.log("Profile setup completed:", analysisResult);
    setShowProfileSetup(false);
    // Refresh profile data
    api.get("/users/me").then(res => setProfile(res.data));
    showSuccess("Your profile has been successfully set up with AI analysis!");
  };

  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation(); // Stop navigation when clicking delete
    if (window.confirm("Are you sure you want to delete this job and all its applications?")) {
      try {
        await api.delete(`/jobs/${jobId}`);
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
        showSuccess("Job deleted successfully.");
      } catch (err) {
        showError("Error deleting job.");
        console.error(err);
      }
    }
  };

  // ✅ NEW: Advanced Search Handler
  const handleAdvancedSearch = async (filters) => {
    setSearchLoading(true);
    setIsSearchActive(true);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      console.log("🔍 Advanced search with filters:", filters);
      const response = await api.get(`/jobs/search?${queryParams.toString()}`);
      
      setSearchResults(response.data.jobs);
      setSearchPagination(response.data.pagination);
      
      console.log("✅ Search results:", response.data);
      
    } catch (err) {
      console.error("❌ Search error:", err);
      setSearchResults([]);
      setSearchPagination(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // ✅ NEW: Reset Search Handler
  const handleResetSearch = () => {
    setIsSearchActive(false);
    setSearchResults([]);
    setSearchPagination(null);
  };

  // Determine which jobs to show
  const jobsToShow = isSearchActive 
    ? searchResults 
    : (user?.role === "candidate" && showRecommended ? recommended : jobs);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* CV Upload Modal for new candidates */}
      <ProfileSetupModal 
        isOpen={showProfileSetup} 
        onClose={() => setShowProfileSetup(false)}
        onComplete={handleProfileSetupComplete}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {profile ? profile.name : '...'}!</h1>
        {profile && (<p className="mt-1 text-gray-500 capitalize text-md">Role: {profile.role}</p>)}
        
        {/* CV Upload Reminder for candidates without complete profiles */}
        {profile && profile.role === "candidate" && !profile.cvUploaded && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">📄 Upload Your CV to Get Started</h3>
                  <p className="text-sm text-blue-600">Get personalized job recommendations and automatic profile completion</p>
                </div>
              </div>
              <Link 
                to="/profile" 
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-md hover:bg-blue-50"
              >
                Upload CV
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ✅ NEW: Advanced Search Component */}
      <AdvancedSearch 
        onSearch={handleAdvancedSearch}
        onReset={handleResetSearch}
      />

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
        <div className="p-4 text-center bg-white shadow rounded-xl">
          <p className="text-lg font-semibold text-gray-700">{jobs.length}</p>
          <p className="text-sm text-gray-500">{user?.role === "recruiter" ? "Jobs Posted" : "Total Jobs"}</p>
        </div>
        <div 
          className="p-4 text-center bg-white shadow cursor-pointer rounded-xl hover:bg-gray-100"
          onClick={() => {
            if (user?.role === "candidate") {
              setShowRecommended(true);
            }
          }}
        >
          <p className="text-lg font-semibold text-gray-700">{user?.role === "recruiter" ? totalApplicants : recommendedJobs}</p>
          <p className="text-sm text-gray-500">{user?.role === "recruiter" ? "Total Applicants" : "Recommended Jobs"}</p>
        </div>
        <div className="p-4 text-center bg-white shadow rounded-xl">
          <p className="text-lg font-semibold text-gray-700">{user?.role === 'recruiter' ? aiMatches : 'N/A'}</p>
          <p className="text-sm text-gray-500">AI Matches Today</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {isSearchActive 
            ? `🔍 Search Results (${searchResults.length} jobs)` 
            : showRecommended 
              ? "🌟 Recommended For You" 
              : (user?.role === 'recruiter' ? "📂 My Posted Jobs" : "📂 All Available Jobs")
          }
        </h2>
        
        {/* Search Results Info */}
        {isSearchActive && searchPagination && (
          <div className="text-sm text-gray-600">
            Page {searchPagination.currentPage} of {searchPagination.totalPages}
            {searchPagination.totalJobs > 0 && ` (${searchPagination.totalJobs} total)`}
          </div>
        )}
      </div>
      
      {user?.role === "candidate" && showRecommended && !isSearchActive && (
        <div className="mb-4">
          <button 
            className="text-sm font-medium text-blue-600 hover:text-blue-800" 
            onClick={() => setShowRecommended(false)}
          >
            ← Back to All Jobs
          </button>
        </div>
      )}

      {/* Back to normal jobs from search */}
      {isSearchActive && (
        <div className="mb-4">
          <button 
            className="text-sm font-medium text-blue-600 hover:text-blue-800" 
            onClick={handleResetSearch}
          >
            ← Back to All Jobs
          </button>
        </div>
      )}

      {(loading || searchLoading) ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {searchLoading ? "Searching jobs..." : "Loading jobs..."}
          </p>
        </div>
      ) : 
      jobsToShow.length === 0 ? (
        <div className="mt-8 text-center">
          {isSearchActive ? (
            <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">No Jobs Found</h3>
              <p className="text-orange-700 mb-4">
                No jobs match your search criteria. Try:
              </p>
              <ul className="text-sm text-orange-600 list-disc list-inside space-y-1 mb-4">
                <li>Using different keywords or skills</li>
                <li>Expanding your location or salary range</li>
                <li>Removing some filters to broaden your search</li>
              </ul>
              <button 
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                onClick={handleResetSearch}
              >
                Clear Search & View All Jobs
              </button>
            </div>
          ) : showRecommended ? (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">No Personalized Recommendations Found</h3>
              <p className="text-blue-700 mb-4">
                We couldn't find jobs that match your profile. This might be because:
              </p>
              <ul className="text-sm text-blue-600 list-disc list-inside space-y-1 mb-4">
                <li>Your profile needs more details (skills, experience)</li>
                <li>No current job openings match your skillset</li>
                <li>Try updating your skills or experience</li>
              </ul>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => setShowRecommended(false)}
              >
                View All Available Jobs
              </button>
            </div>
          ) : (
            <p className="text-gray-500">
              {user?.role === 'recruiter' ? "You haven't posted any jobs yet." : "No jobs available at the moment."}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobsToShow.map((job) => (
            <div 
              key={job._id} 
              className="flex flex-col h-full p-5 transition bg-white border shadow-lg hover:shadow-xl rounded-2xl relative"
            >
              {/* Match Score Badge for Recommended Jobs */}
              {showRecommended && job.matchScore && (
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    job.matchScore >= 80 ? 'bg-green-500 text-white' :
                    job.matchScore >= 60 ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {job.matchScore}% Match
                  </span>
                </div>
              )}

              <div className="flex-grow cursor-pointer" onClick={() => navigate(`/jobs/${job._id}`)}>
                <h3 className="text-xl font-bold text-gray-800 pr-16">{job.title}</h3>
                <p className="flex-grow mt-1 text-gray-600 line-clamp-3">{job.description}</p>
                <p className="mt-2 text-sm text-gray-400">Posted by: {job.recruiter?.name}</p>
                
                {/* Show matching skills for recommended jobs */}
                {showRecommended && job.matchingSkills && job.matchingSkills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-700 mb-1">✅ Your Matching Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.matchingSkills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {job.matchingSkills.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{job.matchingSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience match indicator */}
                {showRecommended && job.experienceMatch && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      job.experienceMatch.meets ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      Experience: {job.experienceMatch.candidateYears}y / {job.experienceMatch.requiredYears}y required
                    </span>
                  </div>
                )}
              </div>
              
              {user?.role === "recruiter" && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <button type="button" className="font-medium text-blue-600" onClick={(e) => { e.stopPropagation(); navigate(`/applicants/${job._id}`); }}>
                    👥 View Applicants
                  </button>
                  <div className="flex items-center gap-2">
                    <Link to={`/edit-job/${job._id}`} onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-green-600" title="Edit Job">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </Link>
                    <button onClick={(e) => handleDeleteJob(job._id, e)} className="text-gray-500 hover:text-red-600" title="Delete Job">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;