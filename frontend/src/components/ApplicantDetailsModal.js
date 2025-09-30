// recruitment-ai-system/frontend/src/components/ApplicantDetailsModal.js

import React from "react";

// Helper component for progress circle
const ProgressCircle = ({ score = 0 }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="transform -rotate-90" width="120" height="120">
        <circle cx="60" cy="60" r={radius} strokeWidth="10" stroke="currentColor" className="text-gray-200" fill="transparent" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-500 ease-in-out ${color}`}
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${color}`}>{score}%</span>
    </div>
  );
};

const ApplicantDetailsModal = ({ app, onClose }) => {
  if (!app) return null;

  const { analysis, candidate } = app;
  
  // Safely access nested properties with enhanced AI summary support
  const overallScore = analysis?.overallScore ?? 0;
  const aiSummary = analysis?.aiSummary;
  const extractedSkills = analysis?.extractedSkills ?? [];
  const matchingSkills = analysis?.matchingSkills ?? [];
  const missingSkills = analysis?.missingSkills ?? [];
  
  // Determine if the analysis object is valid and not an error object from the backend
  const hasValidAnalysis = analysis && !analysis.error && analysis.overallScore > 0;
  const hasAiSummary = aiSummary && !analysis.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-6 bg-white border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{candidate?.name}</h2>
            <p className="text-gray-500">{candidate?.email}</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        {/* Conditionally render content based on whether analysis data exists */}
        {hasValidAnalysis ? (
          <>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
              {/* Overall Score */}
              <div className="flex flex-col items-center justify-center p-4 text-center rounded-lg md:col-span-1 bg-gray-50">
                <h3 className="mb-2 text-lg font-semibold">Overall Match</h3>
                <ProgressCircle score={overallScore} />
              </div>

              {/* AI Summary */}
              <div className="p-4 border border-blue-200 rounded-lg md:col-span-2 bg-blue-50">
                <h3 className="mb-3 text-lg font-semibold text-blue-800">🤖 AI Analysis Summary</h3>
                {hasAiSummary ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Overall Assessment:</p>
                      <p className="text-gray-700">{aiSummary.overallAssessment}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span><strong>Fit Score:</strong> {aiSummary.fitScore}</span>
                      <span><strong>Level:</strong> {aiSummary.experienceLevel}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700">AI analysis completed with {overallScore}% overall match score.</p>
                )}
              </div>
            </div>
            
            {/* Enhanced AI Summary Details */}
            {hasAiSummary && (
              <div className="px-6 pb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Strengths */}
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h4 className="mb-2 font-semibold text-green-800">✅ Strengths</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {aiSummary.strengths?.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Weaknesses */}
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <h4 className="mb-2 font-semibold text-orange-800">⚠️ Areas for Improvement</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {aiSummary.weaknesses?.map((weakness, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Recommended Actions */}
                {aiSummary.recommendedActions && (
                  <div className="p-4 mt-4 border border-purple-200 rounded-lg bg-purple-50">
                    <h4 className="mb-2 font-semibold text-purple-800">🎯 Recommended Actions</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {aiSummary.recommendedActions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="px-6 pb-6">
              {/* Skills Comparison */}
              <div>
                <h3 className="pb-2 mb-3 text-lg font-semibold border-b">Skills Analysis</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <h4 className="mb-2 font-medium text-green-700">✅ Matching Skills ({matchingSkills.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchingSkills.map(skill => (
                        <span key={skill} className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 font-medium text-blue-700">🔍 All Extracted Skills ({extractedSkills.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedSkills.map(skill => (
                        <span key={skill} className={`px-3 py-1 text-sm rounded-full ${
                          matchingSkills.includes(skill) 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 font-medium text-red-700">❌ Missing Skills ({missingSkills.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map(skill => (
                        <span key={skill} className="px-3 py-1 text-sm text-red-800 bg-red-100 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience Comparison */}
              <div className="mt-6">
                 <h3 className="pb-2 mb-3 text-lg font-semibold border-b">Experience & Scores</h3>
                 <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold text-blue-600">{analysis.skillsMatch || 0}%</p>
                      <p className="text-sm text-gray-500">Skills Match</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold text-green-600">{analysis.experienceMatch || 0}%</p>
                      <p className="text-sm text-gray-500">Experience Match</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold text-purple-600">{extractedSkills.length}</p>
                      <p className="text-sm text-gray-500">Total Skills</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold text-indigo-600">{matchingSkills.length}</p>
                      <p className="text-sm text-gray-500">Matching Skills</p>
                    </div>
                 </div>
              </div>
            </div>
          </>
        ) : (
          // Fallback UI for applications without analysis
          <div className="p-6 text-center text-gray-600">
            <h3 className="text-lg font-semibold">Detailed AI Analysis Not Available</h3>
            <p className="mt-2">This application might have been submitted before the detailed analysis feature was enabled.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantDetailsModal;