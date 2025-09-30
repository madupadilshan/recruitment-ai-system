// recruitment-ai-system/frontend/src/pages/Applicants.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import ApplicantDetailsModal from "../components/ApplicantDetailsModal";
import { XCircle } from "lucide-react"; // ✅ Import the delete icon
import { useNotification } from "../components/NotificationSystem";

function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (!jobId) {
      setError("⚠️ Invalid Job ID");
      setLoading(false);
      return;
    }

    api
      .get(`/applications/${jobId}`)
      .then((res) => {
        const sorted = res.data.sort((a, b) => (b.analysis?.overallScore || 0) - (a.analysis?.overallScore || 0));
        setApps(sorted);
      })
      .catch(() => {
        setError("Failed to fetch applicants.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jobId]);

  // ✅ NEW: Function to handle application deletion
  const handleDelete = async (appId, e) => {
    e.stopPropagation(); // Prevent the modal from opening when clicking the delete button
    
    if (window.confirm("Are you sure you want to delete this applicant?")) {
      try {
        await api.delete(`/applications/${appId}`);
        // Remove the deleted application from the state to update the UI
        setApps(prevApps => prevApps.filter(app => app._id !== appId));
        showSuccess("Application deleted successfully!");
      } catch (err) {
        showError("Failed to delete application.");
        console.error("Delete error:", err);
      }
    }
  };

  if (loading) return <p className="p-6">Loading applicants...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to Dashboard
      </button>

      <h2 className="mb-6 text-2xl font-bold text-gray-800">👥 Applicants</h2>
      
      {apps.length === 0 ? (
        <div className="mt-10 text-center">
           <img src="https://illustrations.popsy.co/gray/team.svg" alt="No applicants" className="mx-auto mb-4 w-60" />
          <p className="text-gray-500">No applicants yet for this job.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <div
              key={app._id}
              className="relative p-5 transition bg-white shadow cursor-pointer rounded-xl hover:shadow-lg" // ✅ Added 'relative' for positioning the delete icon
              onClick={() => setSelectedApp(app)}
            >
              {/* ✅ NEW: Delete Button */}
              <button
                onClick={(e) => handleDelete(app._id, e)}
                className="absolute text-gray-400 transition-colors top-2 right-2 hover:text-red-500"
                title="Delete Applicant"
              >
                <XCircle size={20} />
              </button>

              <h3 className="pr-6 text-lg font-semibold text-gray-800"> {/* Added padding to prevent text overlap */}
                {app.candidate?.name}
              </h3>
              <p className="mb-2 text-sm text-gray-500">
                {app.candidate?.email}
              </p>
              <p className="text-sm font-medium text-gray-700">
                Overall Match:{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs text-white font-bold ${
                    app.analysis?.overallScore >= 75
                      ? "bg-green-500"
                      : app.analysis?.overallScore >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                >
                  {app.analysis && typeof app.analysis.overallScore === 'number' 
                    ? `${app.analysis.overallScore}%` 
                    : "N/A"}
                </span>
              </p>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/schedule-interview?candidateId=${app.candidate._id}&jobId=${jobId}&applicationId=${app._id}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium"
                >
                  📅 Schedule Interview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <ApplicantDetailsModal 
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}

export default Applicants;