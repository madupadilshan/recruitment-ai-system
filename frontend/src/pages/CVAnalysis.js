// recruitment-ai-system/frontend/src/pages/CVAnalysis.js

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNotification } from '../components/NotificationSystem';

const CVAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState(null);
  const { showSuccess, showError, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      console.log('📈 Loading analysis history...');
      const response = await api.get('/cv/history');
      console.log('✅ History loaded:', response.data);
      setAnalysisHistory(response.data.data);
    } catch (error) {
      console.error('❌ Failed to load analysis history:', error);
      if (error.response) {
        console.error('History error details:', error.response.data);
      }
      // Don't show alert for history loading failure - it's not critical
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleComprehensiveAnalysis = async () => {
    if (!selectedFile) {
      showWarning('Please select a CV file first');
      return;
    }

    setLoading(true);
    console.log('🤖 Starting CV analysis with file:', selectedFile.name);
    
    try {
      const formData = new FormData();
      formData.append('cvFile', selectedFile);
      formData.append('language', 'auto');
      
      console.log('📤 Sending analysis request to /cv/comprehensive');
      
      const response = await api.post('/cv/comprehensive', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Analysis response received:', response.data);
      setAnalysisData(response.data.data);
      setActiveTab('results');
      loadAnalysisHistory(); // Refresh history
      
    } catch (error) {
      console.error('❌ CV Analysis failed:', error);
      
      let errorMessage = 'CV Analysis failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error details:', error.response.data);
        errorMessage = `Server Error: ${error.response.data.error || error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error - no response received');
        errorMessage = 'Network Error: Unable to connect to server. Please check if the backend is running.';
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
        errorMessage = `Request Error: ${error.message}`;
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const SkillsSection = ({ skills, softSkills, languages, certifications }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Skills Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Technical Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills?.technicalSkills?.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Soft Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills?.softSkills?.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Languages</h4>
          <div className="flex flex-wrap gap-2">
            {skills?.languages?.map((lang, index) => (
              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {lang}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Certifications</h4>
          <div className="flex flex-wrap gap-2">
            {skills?.certifications?.map((cert, index) => (
              <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ExperienceSection = ({ experience }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Experience Validation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{experience?.totalExperience || 0}</div>
          <div className="text-gray-600">Years Experience</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{experience?.verificationScore || 0}%</div>
          <div className="text-gray-600">Verification Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{experience?.experienceByRole?.length || 0}</div>
          <div className="text-gray-600">Roles Verified</div>
        </div>
      </div>
      
      {experience?.inconsistencies?.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-red-600 mb-2">⚠️ Inconsistencies Found:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {experience.inconsistencies.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {experience?.recommendations?.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-blue-600 mb-2">💡 Recommendations:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {experience.recommendations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const AchievementsSection = ({ achievements }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Achievement Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">{achievements?.impactScore || 0}</div>
          <div className="text-gray-600">Impact Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{achievements?.innovationScore || 0}</div>
          <div className="text-gray-600">Innovation Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-indigo-600">{achievements?.achievements?.length || 0}</div>
          <div className="text-gray-600">Key Achievements</div>
        </div>
      </div>
      
      {achievements?.keyAccomplishments?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">🌟 Key Accomplishments:</h4>
          <ul className="space-y-2">
            {achievements.keyAccomplishments.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const QualitySection = ({ quality }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📊 CV Quality Assessment</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{quality?.overallScore || 0}%</div>
          <div className="text-sm text-gray-600">Overall Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{quality?.formattingScore || 0}%</div>
          <div className="text-sm text-gray-600">Formatting</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{quality?.completenessScore || 0}%</div>
          <div className="text-sm text-gray-600">Completeness</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{quality?.atsCompatibility || 0}%</div>
          <div className="text-sm text-gray-600">ATS Compatible</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quality?.strengths?.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-600 mb-2">✅ Strengths:</h4>
            <ul className="space-y-1">
              {quality.strengths.map((item, index) => (
                <li key={index} className="text-sm text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {quality?.improvements?.length > 0 && (
          <div>
            <h4 className="font-semibold text-orange-600 mb-2">💡 Improvements:</h4>
            <ul className="space-y-1">
              {quality.improvements.map((item, index) => (
                <li key={index} className="text-sm text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🤖 AI-Powered CV Analysis</h1>
            <p className="text-gray-600 mt-2">
              Get comprehensive insights about your CV with advanced AI analysis
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📤 Upload & Analyze
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'results'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!analysisData}
            >
              📊 Analysis Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 History
            </button>
          </div>

          {/* Content */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Your CV</h2>
              <p className="text-gray-600 mb-6">
                Upload your CV for comprehensive AI analysis including skills extraction, 
                experience validation, achievement quantification, and quality assessment.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CV File (PDF, DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Analysis Features:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-2">🚀</span>
                    <span className="text-sm">Enhanced Skills Extraction</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">🔍</span>
                    <span className="text-sm">Experience Validation</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-orange-500 mr-2">🏆</span>
                    <span className="text-sm">Achievement Quantification</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-2">🌐</span>
                    <span className="text-sm">Multi-Language Support</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">📊</span>
                    <span className="text-sm">Quality Assessment</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-2">🤖</span>
                    <span className="text-sm">ATS Compatibility Check</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleComprehensiveAnalysis}
                  disabled={!selectedFile || loading}
                  className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? '🔄 Analyzing CV...' : '🤖 Start Comprehensive Analysis'}
                </button>
                
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      console.log('🧪 Testing simple analysis endpoint...');
                      const response = await api.post('/cv/comprehensive-test', {});
                      console.log('✅ Test response:', response.data);
                      setAnalysisData(response.data.data);
                      setActiveTab('results');
                      showSuccess('Test analysis completed successfully!');
                    } catch (error) {
                      console.error('❌ Test failed:', error);
                      showError('Test failed: ' + (error.response?.data?.error || error.message));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-2 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? '🔄 Testing...' : '🧪 Test Analysis (No File)'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'results' && analysisData && (
            <div>
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">📊 Analysis Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{Math.round(analysisData.summary?.overallScore || 0)}%</div>
                    <div className="text-blue-100">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{analysisData.summary?.skillsCount || 0}</div>
                    <div className="text-blue-100">Skills Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{analysisData.summary?.experienceYears || 0}</div>
                    <div className="text-blue-100">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{analysisData.summary?.achievementsCount || 0}</div>
                    <div className="text-blue-100">Achievements</div>
                  </div>
                </div>
              </div>

              {/* Multi-Language Info */}
              {analysisData.multiLanguage && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">🌐 Language Processing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-semibold">Detected Language:</span>
                      <span className="ml-2 capitalize">{analysisData.multiLanguage.detectedLanguage}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Confidence:</span>
                      <span className="ml-2">{Math.round(analysisData.multiLanguage.languageConfidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="font-semibold">Unicode Support:</span>
                      <span className="ml-2">{analysisData.multiLanguage.unicodeSupport ? '✅ Yes' : '❌ No'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Sections */}
              <SkillsSection skills={analysisData.skills} />
              <ExperienceSection experience={analysisData.experience} />
              <AchievementsSection achievements={analysisData.achievements} />
              <QualitySection quality={analysisData.quality} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Analysis History</h2>
              
              {analysisHistory ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysisHistory.summary?.skillsCount || 0}</div>
                      <div className="text-blue-600">Total Skills</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{analysisHistory.summary?.experienceYears || 0}</div>
                      <div className="text-green-600">Years Experience</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{Math.round(analysisHistory.summary?.overallScore || 0)}%</div>
                      <div className="text-orange-600">CV Quality</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{Math.round(analysisHistory.summary?.atsCompatibility || 0)}%</div>
                      <div className="text-purple-600">ATS Compatible</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Last analyzed: {analysisHistory.lastAnalyzed ? new Date(analysisHistory.lastAnalyzed).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No analysis history found. Upload and analyze your CV to get started!</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CVAnalysis;