// recruitment-ai-system/frontend/src/pages/Profile.js

import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Link } from "react-router-dom";
import { useNotification } from "../components/NotificationSystem";

function Profile() {
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [cvUploadResult, setCvUploadResult] = useState(null);
  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    api.get("/users/me")
      .then((res) => {
        setUserProfile(res.data);
        setSummary(res.data.profileSummary || "");
        setSkills(res.data.skills?.join(", ") || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.put("/users/profile/candidate", {
        profileSummary: summary,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      showSuccess("Professional profile updated successfully!");
    } catch (err) {
      console.error(err);
      showError("Error updating profile");
    }
  };

  const handleCvFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        showWarning("Please upload a PDF file only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showWarning("File size should be less than 5MB");
        return;
      }
      setCvFile(file);
    }
  };

  const handleCvUpload = async () => {
    if (!cvFile) {
      showWarning("Please select a CV file first");
      return;
    }

    setCvUploading(true);
    setCvUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("cvFile", cvFile);

      const response = await api.put("/users/profile/replace-cv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("CV replacement successful:", response.data);
      setCvUploadResult(response.data);
      
      // Update local state with new profile data
      setUserProfile(response.data.user);
      setSummary(response.data.user.profileSummary || "");
      setSkills(response.data.user.skills?.join(", ") || "");
      
      showSuccess("CV updated successfully! Your profile has been refreshed with new information.");
      setShowCvUpload(false);
      setCvFile(null);
      
    } catch (err) {
      console.error("CV upload error:", err);
      showError(err.response?.data?.error || "Failed to update CV");
    } finally {
      setCvUploading(false);
    }
  };

  if (loading) return <p className="p-6">Loading profile...</p>;

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      {/* CV Management Section */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">CV Management</h2>
            <p className="text-gray-600">Update your CV to refresh your profile automatically</p>
          </div>
          <Link to="/account" className="text-sm text-blue-600 hover:underline">
            Manage Account Settings
          </Link>
        </div>

        {/* Current CV Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Current CV Status</h3>
              <p className="text-sm text-gray-600">
                {userProfile?.cvUploaded ? (
                  <>
                    ✅ CV uploaded and analyzed
                    {userProfile?.aiProfileInsights?.lastAnalyzed && (
                      <span className="text-gray-500">
                        {' • Last analyzed: '}
                        {new Date(userProfile.aiProfileInsights.lastAnalyzed).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  "❌ No CV uploaded"
                )}
              </p>
            </div>
            <button
              onClick={() => setShowCvUpload(!showCvUpload)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showCvUpload ? 'Cancel' : 'Update CV'}
            </button>
          </div>
        </div>

        {/* CV Upload Section */}
        {showCvUpload && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">📄 Upload New CV</h3>
            <p className="text-sm text-blue-700 mb-4">
              Upload a new CV to automatically update your profile with the latest information.
              Your previous CV will be replaced.
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleCvFileSelect}
                  className="hidden"
                  id="cv-file-upload"
                />
                <label 
                  htmlFor="cv-file-upload" 
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                >
                  Select PDF File
                </label>
                {cvFile && (
                  <div className="mt-2 text-sm text-green-700">
                    ✅ Selected: {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCvUpload}
                  disabled={!cvFile || cvUploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {cvUploading && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>{cvUploading ? "Analyzing CV..." : "Upload & Analyze"}</span>
                </button>
                <button
                  onClick={() => {setShowCvUpload(false); setCvFile(null);}}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Result Summary */}
        {cvUploadResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🎉 CV Update Successful!</h3>
            <div className="text-sm text-green-700 space-y-1">
              {cvUploadResult.changes?.skillsAdded?.length > 0 && (
                <p>✅ Skills added: {cvUploadResult.changes.skillsAdded.join(', ')}</p>
              )}
              {cvUploadResult.changes?.skillsRemoved?.length > 0 && (
                <p>❌ Skills removed: {cvUploadResult.changes.skillsRemoved.join(', ')}</p>
              )}
              {cvUploadResult.changes?.experienceChanged && (
                <p>🔄 Experience level updated</p>
              )}
              <p className="text-green-600 font-medium">Your profile has been automatically refreshed!</p>
            </div>
          </div>
        )}
      </div>

      {/* Professional Profile Section */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Professional Profile</h2>
          <p className="text-gray-600">You can manually edit your profile details below</p>
        </div>

        <label className="block mb-2 font-medium">Profile Summary</label>
        <textarea
          className="w-full p-3 mb-4 border rounded-lg"
          rows="5"
          placeholder="Write a short professional summary..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <label className="block mb-2 font-medium">Skills</label>
        <input
          className="w-full p-3 mb-4 border rounded-lg"
          placeholder="e.g. React, Node.js, MongoDB"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />

        <button
          className="px-5 py-2 text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600"
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>

      {/* Profile Insights Section */}
      {userProfile?.aiProfileInsights && (
        <div className="p-6 bg-white shadow-md rounded-xl">
          <h2 className="text-2xl font-bold mb-4">🤖 AI Profile Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Experience Level</h3>
              <p className="text-gray-600">{userProfile.aiProfileInsights.experienceLevel}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Domain Expertise</h3>
              <div className="flex flex-wrap gap-1">
                {userProfile.aiProfileInsights.domainExpertise?.map((domain, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Key Strengths</h3>
              <ul className="text-gray-600 list-disc list-inside">
                {userProfile.aiProfileInsights.keyStrengths?.map((strength, index) => (
                  <li key={index} className="text-xs">{strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Recommended Roles</h3>
              <div className="flex flex-wrap gap-1">
                {userProfile.aiProfileInsights.recommendedRoles?.map((role, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;