// recruitment-ai-system/frontend/src/pages/PostJob.js

import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../components/NotificationSystem";

function PostJob() {
  // Basic job fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [requiredYears, setRequiredYears] = useState("");
  
  // ✅ NEW: Advanced fields
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState(false);
  const [hybrid, setHybrid] = useState(false);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [currency, setCurrency] = useState("LKR");
  const [salaryPeriod, setSalaryPeriod] = useState("monthly");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("startup");
  const [industry, setIndustry] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [urgency, setUrgency] = useState("normal");
  const [benefits, setBenefits] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      api.get(`/jobs/${id}`)
        .then(res => {
          const job = res.data;
          setTitle(job.title);
          setDescription(job.description);
          setRequiredSkills(job.requiredSkills.join(', '));
          setRequiredYears(job.requiredYears);
        })
        .catch(err => {
          console.error("Failed to fetch job data", err);
          showError("Could not load job data for editing.");
          navigate("/dashboard");
        });
    }
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jobData = {
      // Basic fields
      title,
      description,
      recruiterId: user.userId,
      requiredSkills: requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
      requiredYears: Number(requiredYears) || 0,
      
      // ✅ NEW: Advanced fields
      location: {
        city: city.trim(),
        country: "Sri Lanka",
        remote: remote,
        hybrid: hybrid
      },
      
      salary: {
        min: Number(minSalary) || 0,
        max: Number(maxSalary) || 0,
        currency: currency,
        period: salaryPeriod
      },
      
      company: {
        name: companyName.trim(),
        size: companySize,
        industry: industry.trim()
      },
      
      jobType: jobType,
      urgency: urgency,
      benefits: benefits ? benefits.split(",").map(b => b.trim()).filter(Boolean) : []
    };

    try {
      if (isEditMode) {
        await api.put(`/jobs/${id}`, jobData);
        showSuccess("Job updated successfully!");
      } else {
        await api.post("/jobs", jobData);
        showSuccess("Job posted successfully!");
      }
      navigate('/dashboard');
    } catch (err) {
      showError(err.response?.data?.error || "Failed to submit job");
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6">
      <div className="w-full max-w-lg mx-auto">
        {/* ✅ Back to Dashboard Button Added */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <form onSubmit={handleSubmit} className="p-8 bg-white shadow-lg rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            {isEditMode ? "📝 Edit Job" : "📝 Post a New Job"}
          </h2>
          
          <label className="block mb-2 font-medium text-gray-700">Job Title</label>
          <input type="text" placeholder="e.g., Senior Frontend Developer" className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-green-400" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label className="block mb-2 font-medium text-gray-700">Job Description</label>
          <textarea placeholder="Describe the role and responsibilities..." className="w-full h-32 p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-green-400" value={description} onChange={(e) => setDescription(e.target.value)} />

          <label className="block mb-2 font-medium text-gray-700">Required Skills (Comma separated)</label>
          <input type="text" placeholder="e.g., React, Node.js, AWS" className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-green-400" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} />
          
          <label className="block mb-2 font-medium text-gray-700">Required Years of Experience</label>
          <input type="number" placeholder="e.g., 5" className="w-full p-3 mb-6 border rounded-lg focus:ring-2 focus:ring-green-400" value={requiredYears} onChange={(e) => setRequiredYears(e.target.value)} />

          {/* ✅ NEW: Advanced Fields Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📍 Job Details & Location</h3>
            
            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">City/Location</label>
                <input 
                  type="text" 
                  placeholder="e.g., Colombo, Kandy" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                />
              </div>
              
              <div className="flex items-center space-x-6 pt-8">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={remote} 
                    onChange={(e) => setRemote(e.target.checked)} 
                    className="mr-2"
                  />
                  Remote Work
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={hybrid} 
                    onChange={(e) => setHybrid(e.target.checked)} 
                    className="mr-2"
                  />
                  Hybrid
                </label>
              </div>
            </div>

            {/* Salary Range */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">💰 Salary Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input 
                  type="number" 
                  placeholder="Min Salary" 
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-green-400" 
                  value={minSalary} 
                  onChange={(e) => setMinSalary(e.target.value)} 
                />
                <input 
                  type="number" 
                  placeholder="Max Salary" 
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-green-400" 
                  value={maxSalary} 
                  onChange={(e) => setMaxSalary(e.target.value)} 
                />
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)} 
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <select 
                  value={salaryPeriod} 
                  onChange={(e) => setSalaryPeriod(e.target.value)} 
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                >
                  <option value="hourly">Per Hour</option>
                  <option value="daily">Per Day</option>
                  <option value="monthly">Per Month</option>
                  <option value="annually">Per Year</option>
                </select>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">🏢 Company Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Company Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., TechCorp Inc." 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Company Size</label>
                  <select 
                    value={companySize} 
                    onChange={(e) => setCompanySize(e.target.value)} 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                  >
                    <option value="startup">Startup (1-10)</option>
                    <option value="small">Small (11-50)</option>
                    <option value="medium">Medium (51-200)</option>
                    <option value="large">Large (201-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                  </select>
                </div>
              </div>
              
              <label className="block mb-2 font-medium text-gray-700">Industry</label>
              <input 
                type="text" 
                placeholder="e.g., Technology, Finance, Healthcare" 
                className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-green-400" 
                value={industry} 
                onChange={(e) => setIndustry(e.target.value)} 
              />
            </div>

            {/* Job Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Job Type</label>
                <select 
                  value={jobType} 
                  onChange={(e) => setJobType(e.target.value)} 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Priority Level</label>
                <select 
                  value={urgency} 
                  onChange={(e) => setUrgency(e.target.value)} 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700">Benefits & Perks (Comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g., Health Insurance, Flexible Hours, Remote Work" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400" 
                value={benefits} 
                onChange={(e) => setBenefits(e.target.value)} 
              />
            </div>
          </div>

          <button className="w-full py-3 text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600">
            {isEditMode ? "🚀 Update Job" : "🚀 Post Job"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostJob;