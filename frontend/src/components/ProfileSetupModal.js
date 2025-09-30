// recruitment-ai-system/frontend/src/components/ProfileSetupModal.js

import React, { useState } from "react";
import api from "../utils/api";

const ProfileSetupModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size should be less than 5MB");
        return;
      }
      setCvFile(file);
      setError("");
    }
  };

  const handleUploadCV = async () => {
    if (!cvFile) {
      setError("Please select a CV file first");
      return;
    }

    setLoading(true);
    setError("");
    console.log("🚀 Starting CV upload - File:", cvFile.name, "Size:", cvFile.size);

    try {
      const formData = new FormData();
      formData.append("cvFile", cvFile);

      console.log("📤 Sending CV to backend...");
      const response = await api.post("/users/profile/upload-cv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ CV upload successful:", response.data);
      setAnalysisResult(response.data);
      setStep(2);
    } catch (err) {
      console.error("❌ CV upload failed:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      let errorMessage = "Failed to upload and analyze CV";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (err.response?.status === 413) {
        errorMessage = "File too large. Please select a smaller CV file.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete(analysisResult);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 bg-white border-b rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📄 Upload Your CV</h2>
            <p className="text-gray-500">Upload your CV for automatic profile creation with AI analysis</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="text-center">
                <div className="mx-auto mb-4 w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">📋 Start with Your CV Upload</h3>
                <p className="text-gray-600 mb-4">
                  Upload your CV/Resume and let our AI automatically create your professional profile with accurate information from your document.
                </p>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>✨ Why upload your CV?</strong> Get instant profile completion with skills, experience, and education automatically extracted from your actual CV.
                  </p>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="cv-upload"
                />
                <label 
                  htmlFor="cv-upload" 
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Select CV File (PDF only)
                </label>
                {cvFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-green-800 text-sm">
                      ✅ Selected: {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleUploadCV}
                  disabled={!cvFile || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>{loading ? "Analyzing CV..." : "Upload & Analyze"}</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && analysisResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-800">Profile Analysis Complete! 🎉</h3>
                <p className="text-gray-600">
                  Your profile has been automatically populated with AI-extracted information
                </p>
              </div>

              {/* Analysis Summary */}
              {analysisResult.analysisData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">🤖 AI Analysis Results:</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Skills Extracted:</span>
                      <span className="font-medium">{analysisResult.analysisData.skills?.length || 0} skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience Level:</span>
                      <span className="font-medium">{analysisResult.analysisData.aiInsights?.experienceLevel || 'Analyzed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Work Positions:</span>
                      <span className="font-medium">{analysisResult.analysisData.experience?.positions?.length || 0} positions</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">✨ What happens next:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Your profile is now complete and visible to recruiters</li>
                  <li>• You'll receive AI-powered job recommendations</li>
                  <li>• Your applications will include intelligent matching scores</li>
                  <li>• You can view and edit your profile anytime</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Complete Setup & Continue 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;