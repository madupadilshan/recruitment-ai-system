import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Link } from "react-router-dom";

function Jobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    api
      .get("/jobs")
      .then((res) => setJobs(res.data))
      .catch((err) => console.error("Error fetching jobs:", err));
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Available Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link
              to={`/jobs/${job._id}`} // 👈 navigate to JobDetails
              key={job._id}
              className="border p-5 rounded-2xl bg-white shadow-lg hover:shadow-xl transition transform hover:scale-[1.01] cursor-pointer block"
            >
              <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
              <p className="text-gray-600 mt-1 line-clamp-2">
                {job.description}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Posted by: {job.recruiter?.name} ({job.recruiter?.email})
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Jobs;
