// recruitment-ai-system/backend/controllers/jobController.js

import Job from "../models/Job.js";
import User from "../models/User.js"; // Import User model for matching
import Application from "../models/Application.js"; // ✅ Import Application model

// Helper function to calculate job match score
const calculateJobMatchScore = (candidateProfile, job) => {
  let score = 0;
  let maxScore = 100;

  // Skills matching (60% weight)
  const candidateSkills = candidateProfile.skills || [];
  const requiredSkills = job.requiredSkills || [];
  
  if (requiredSkills.length > 0) {
    const matchingSkills = candidateSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) || 
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
    const skillsScore = (matchingSkills.length / requiredSkills.length) * 60;
    score += skillsScore;
  } else {
    score += 60; // If no required skills specified, give full marks
  }

  // Experience matching (40% weight)
  const candidateYears = candidateProfile.experience?.totalYears || 0;
  const requiredYears = job.requiredYears || 0;
  
  if (requiredYears > 0) {
    if (candidateYears >= requiredYears) {
      score += 40; // Full points if meets or exceeds requirement
    } else if (candidateYears >= requiredYears * 0.7) {
      score += 25; // Partial points if close to requirement
    } else {
      score += 10; // Minimal points if far from requirement
    }
  } else {
    score += 40; // If no experience requirement, give full marks
  }

  return Math.min(Math.round(score), 100);
};

export const createJob = async (req, res) => {
  try {
    const { title, description, recruiterId, requiredSkills, requiredYears } = req.body;
    const job = new Job({ 
      title, 
      description, 
      recruiter: recruiterId,
      requiredSkills,
      requiredYears
    });
    await job.save();
    
    // ✅ NEW: Emit "new job posted" notification to all candidates
    if (global.io) {
      console.log("🔔 Starting notification process for new job:", title);
      
      // Find all candidates with matching skills
      const candidates = await User.find({ role: "candidate" });
      console.log(`📊 Found ${candidates.length} total candidates`);
      
      const matchingCandidates = [];
      
      for (const candidate of candidates) {
        const matchScore = calculateJobMatchScore(candidate, job);
        console.log(`🎯 Candidate ${candidate.name}: Match score ${matchScore}%`);
        
        if (matchScore >= 60) { // Only notify if good match
          matchingCandidates.push({
            userId: candidate._id,
            matchScore: matchScore
          });
        }
      }
      
      console.log(`✅ Found ${matchingCandidates.length} matching candidates (60%+ match)`);
      
      // Emit to all connected candidates
      const notificationData = {
        type: "new_job",
        title: "New Job Posted! 💼",
        message: `"${title}" - Check if it matches your profile`,
        jobId: job._id,
        jobTitle: title,
        timestamp: new Date(),
        matchingCandidates: matchingCandidates.map(c => c.userId)
      };
      
      global.io.emit("new_job_posted", notificationData);
      console.log(`🚀 Emitted new_job_posted notification:`, notificationData);
      
      console.log(`🔔 Notified ${matchingCandidates.length} matching candidates about new job: ${title}`);
    } else {
      console.error("❌ Socket.io not available!");
    }
    
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("recruiter", "name email");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Advanced Search Jobs
export const searchJobs = async (req, res) => {
  try {
    const {
      // Text search
      keyword,
      skills,
      
      // Location filters
      city,
      remote,
      hybrid,
      
      // Salary filters
      minSalary,
      maxSalary,
      currency = "LKR",
      
      // Company filters
      companySize,
      industry,
      
      // Job details
      jobType,
      urgency,
      experienceLevel,
      
      // Sorting & pagination
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20
    } = req.query;

    // Build search query
    let searchQuery = {};
    let sortQuery = {};

    // Text search - search in title, description, and keywords
    if (keyword) {
      searchQuery.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { searchKeywords: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }

    // Skills search
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      searchQuery.requiredSkills = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    // Location filters
    if (city) {
      searchQuery['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (remote === 'true') {
      searchQuery['location.remote'] = true;
    }
    
    if (hybrid === 'true') {
      searchQuery['location.hybrid'] = true;
    }

    // Salary filters
    if (minSalary || maxSalary) {
      searchQuery['salary.currency'] = currency;
      
      if (minSalary && maxSalary) {
        searchQuery.$and = [
          { 'salary.min': { $gte: parseInt(minSalary) } },
          { 'salary.max': { $lte: parseInt(maxSalary) } }
        ];
      } else if (minSalary) {
        searchQuery['salary.min'] = { $gte: parseInt(minSalary) };
      } else if (maxSalary) {
        searchQuery['salary.max'] = { $lte: parseInt(maxSalary) };
      }
    }

    // Company filters
    if (companySize) {
      searchQuery['company.size'] = companySize;
    }
    
    if (industry) {
      searchQuery['company.industry'] = { $regex: industry, $options: 'i' };
    }

    // Job type filter
    if (jobType) {
      searchQuery.jobType = jobType;
    }

    // Urgency filter
    if (urgency) {
      searchQuery.urgency = urgency;
    }

    // Experience level filter
    if (experienceLevel) {
      const expLevel = parseInt(experienceLevel);
      searchQuery.requiredYears = { $lte: expLevel };
    }

    // Sorting
    sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute search with pagination
    const jobs = await Job.find(searchQuery)
      .populate("recruiter", "name email")
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(searchQuery);

    // Calculate pagination info
    const totalPages = Math.ceil(totalJobs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalJobs,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      searchCriteria: {
        keyword,
        skills,
        city,
        remote: remote === 'true',
        hybrid: hybrid === 'true',
        salary: { min: minSalary, max: maxSalary, currency },
        companySize,
        industry,
        jobType,
        urgency,
        experienceLevel
      }
    });

  } catch (err) {
    console.error("Advanced search error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Update a job
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, requiredSkills, requiredYears } = req.body;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Security: Ensure the person updating the job is the one who created it
        if (job.recruiter.toString() !== req.user.id) {
            return res.status(403).json({ error: "User not authorized to update this job" });
        }

        job.title = title;
        job.description = description;
        job.requiredSkills = requiredSkills;
        job.requiredYears = requiredYears;

        await job.save();
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: "Server error during job update" });
    }
};

// ✅ NEW: Delete a job
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Security: Ensure the person deleting the job is the one who created it
        if (job.recruiter.toString() !== req.user.id) {
            return res.status(403).json({ error: "User not authorized to delete this job" });
        }

        // Also delete all applications associated with this job
        await Application.deleteMany({ job: id });
        
        await Job.findByIdAndDelete(id);

        res.json({ message: "Job and associated applications deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error during job deletion" });
    }
};

// ✅ NEW: Get recommended jobs for candidate based on their profile
export const getRecommendedJobs = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const minMatchScore = 60; // Minimum match score to be considered recommended
        
        // Get candidate profile
        const candidate = await User.findById(candidateId);
        if (!candidate || candidate.role !== 'candidate') {
            return res.status(403).json({ error: "Only candidates can get job recommendations" });
        }

        // If candidate hasn't completed profile, return empty recommendations
        if (!candidate.profileComplete || !candidate.skills || candidate.skills.length === 0) {
            return res.json({
                message: "Complete your profile to get personalized job recommendations",
                recommendedJobs: []
            });
        }

        // Get all available jobs
        const allJobs = await Job.find().populate("recruiter", "name email");
        
        // Calculate match scores for each job
        const jobsWithScores = allJobs.map(job => {
            const matchScore = calculateJobMatchScore(candidate, job);
            return {
                ...job.toObject(),
                matchScore,
                matchingSkills: (candidate.skills || []).filter(skill => 
                    (job.requiredSkills || []).some(required => 
                        skill.toLowerCase().includes(required.toLowerCase()) || 
                        required.toLowerCase().includes(skill.toLowerCase())
                    )
                ),
                experienceMatch: {
                    candidateYears: candidate.experience?.totalYears || 0,
                    requiredYears: job.requiredYears || 0,
                    meets: (candidate.experience?.totalYears || 0) >= (job.requiredYears || 0)
                }
            };
        });

        // Filter jobs with minimum match score and sort by match score
        const recommendedJobs = jobsWithScores
            .filter(job => job.matchScore >= minMatchScore)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10); // Limit to top 10 recommendations

        res.json({
            totalAvailableJobs: allJobs.length,
            recommendedJobsCount: recommendedJobs.length,
            recommendedJobs,
            candidateProfile: {
                skills: candidate.skills,
                experienceYears: candidate.experience?.totalYears || 0,
                profileComplete: candidate.profileComplete
            }
        });

    } catch (err) {
        console.error("❌ Error getting recommended jobs:", err.message);
        res.status(500).json({ error: "Server error getting recommendations" });
    }
};

// Seed test jobs for a recruiter (development only)
export const seedTestJobs = async (req, res) => {
    try {
        const { recruiterId } = req.body;
        
        if (!recruiterId) {
            return res.status(400).json({ error: "Recruiter ID is required" });
        }
        
        // Verify recruiter exists
        const recruiter = await User.findById(recruiterId);
        if (!recruiter || recruiter.role !== 'recruiter') {
            return res.status(400).json({ error: "Invalid recruiter ID" });
        }
        
        // Check if test jobs already exist for this recruiter
        const existingJobs = await Job.find({ 
            recruiter: recruiterId,
            title: { $regex: /Test|Sample|Demo/i }
        });
        
        if (existingJobs.length > 0) {
            return res.json({ 
                message: "Test jobs already exist for this recruiter", 
                jobs: existingJobs.map(j => ({ title: j.title, company: j.company, _id: j._id }))
            });
        }
        
        const testJobs = [
            {
                title: "Senior Software Engineer",
                description: "We are looking for a experienced software engineer to join our development team. You will work on building scalable web applications using modern technologies.",
                company: {
                    name: "TechCorp Inc",
                    size: "medium",
                    industry: "Technology"
                },
                location: {
                    city: "Colombo",
                    country: "Sri Lanka",
                    remote: false,
                    hybrid: true
                },
                salary: {
                    min: 150000,
                    max: 200000,
                    currency: "LKR",
                    period: "monthly"
                },
                jobType: "full-time",
                recruiter: recruiterId,
                requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
                requiredYears: 3,
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            {
                title: "Frontend Developer",
                description: "Join our creative team to build beautiful and responsive user interfaces. Experience with React and modern CSS frameworks preferred.",
                company: {
                    name: "Design Studio",
                    size: "small",
                    industry: "Design & Creative"
                },
                location: {
                    city: "Kandy",
                    country: "Sri Lanka",
                    remote: true,
                    hybrid: false
                },
                salary: {
                    min: 80000,
                    max: 120000,
                    currency: "LKR",
                    period: "monthly"
                },
                jobType: "full-time",
                recruiter: recruiterId,
                requiredSkills: ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS"],
                requiredYears: 2,
                applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
            },
            {
                title: "DevOps Engineer",
                description: "Looking for a DevOps engineer to help manage our cloud infrastructure and CI/CD pipelines. AWS experience required.",
                company: {
                    name: "CloudTech Solutions",
                    size: "large",
                    industry: "Cloud Computing"
                },
                location: {
                    city: "Galle",
                    country: "Sri Lanka",
                    remote: false,
                    hybrid: false
                },
                salary: {
                    min: 180000,
                    max: 250000,
                    currency: "LKR",
                    period: "monthly"
                },
                jobType: "full-time",
                recruiter: recruiterId,
                requiredSkills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Linux"],
                requiredYears: 4,
                applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
            }
        ];
        
        const createdJobs = await Job.insertMany(testJobs);
        
        res.json({
            message: "Test jobs created successfully",
            jobs: createdJobs.map(j => ({ title: j.title, company: j.company, _id: j._id }))
        });
        
    } catch (err) {
        console.error("❌ Seed test jobs error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};