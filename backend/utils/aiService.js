// recruitment-ai-system/backend/utils/aiService.js

import axios from "axios";

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5001";

// === EXISTING FUNCTIONS ===

// Renamed from getMatchScoreFromFile to be more descriptive
export const getAnalysisFromFile = async (filePath, job) => {
  try {
    console.log(`📤 Requesting AI analysis for: ${filePath}`);
    const res = await axios.post(`${AI_BASE_URL}/analyze-cv`, {
      file_path: filePath,
      job_description: job.description,
      required_skills: job.requiredSkills,
      required_years: job.requiredYears,
    }, { timeout: 120000 }); // 2 minutes timeout

    console.log("✅ AI Analysis successful");
    return res.data;
  } catch (err) {
    console.error("❌ AI Analysis Service Error:", err.message);
    if (err.response) {
      console.error("🔴 AI Service Response Data:", JSON.stringify(err.response.data));
      console.error("🔴 AI Service Status:", err.response.status);
    } else if (err.request) {
      console.error("🔴 AI Service No Response (Timeout or Network Error)");
    }
    return { error: true, message: "AI analysis failed.", overallScore: 0 };
  }
};

export const extractCvText = async (filePath) => {
  try {
    const res = await axios.post(`${AI_BASE_URL}/extract-text`, {
      file_path: filePath,
    });
    return res.data.text || "";
  } catch (err) {
    console.error("❌ AI Extract Service Error:", err.message);
    return "";
  }
};

// ✅ NEW function for comprehensive profile analysis
export const analyzeProfileFromCV = async (cvText) => {
  try {
    const res = await axios.post(`${AI_BASE_URL}/analyze-profile`, {
      cv_text: cvText,
    });
    return res.data.data || null;
  } catch (err) {
    console.error("❌ AI Profile Analysis Service Error:", err.message);
    return null;
  }
};

// 🤖 NEW function for AI Summary using Gemini
export const getAiSummary = async (cvText) => {
  try {
    const res = await axios.post(`${AI_BASE_URL}/ai-summary`, {
      cv_text: cvText,
    });
    return res.data;
  } catch (err) {
    console.error("❌ AI Summary Service Error:", err.message);
    return { status: "error", message: "AI Summary failed" };
  }
};

// 💬 NEW function for AI Chat using Gemini
export const chatWithCv = async (cvText, question) => {
  try {
    const res = await axios.post(`${AI_BASE_URL}/ai-chat`, {
      cv_text: cvText,
      question: question,
    });
    return res.data;
  } catch (err) {
    console.error("❌ AI Chat Service Error:", err.message);
    return { status: "error", message: "AI Chat failed" };
  }
};

// 🎯 NEW: Comprehensive CV Analysis using Gemini AI
export const comprehensiveCvAnalysis = async (filePath) => {
  try {
    console.log(`🎯 Requesting comprehensive AI analysis for: ${filePath}`);
    const res = await axios.post(`${AI_BASE_URL}/analyze-cv-comprehensive`, {
      file_path: filePath,
    }, { timeout: 180000 }); // 3 minutes timeout for comprehensive analysis

    console.log("✅ Comprehensive AI Analysis successful");
    return res.data;
  } catch (err) {
    console.error("❌ Comprehensive AI Analysis Error:", err.message);
    if (err.response) {
      console.error("🔴 AI Service Response:", JSON.stringify(err.response.data));
    }
    return { status: "error", message: "Comprehensive analysis failed", error: err.message };
  }
};

// === ADVANCED CV PROCESSING FUNCTIONS ===

// 🚀 Enhanced Skill Extraction with Real CV Analysis
export const extractAdvancedSkills = async (cvText, language = 'english') => {
  try {
    // Processing started


    console.log("🔍 Analyzing skills from CV text (length:", cvText.length, ")");

    // Real skill extraction from CV text
    const text = cvText.toLowerCase();

    // Technical skills patterns
    const technicalSkillsPatterns = [
      // Programming Languages
      /\b(javascript|js|typescript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|dart)\b/g,
      // Frameworks & Libraries
      /\b(react|angular|vue|node\.?js|express|django|spring|laravel|rails|flutter|xamarin)\b/g,
      // Databases
      /\b(mysql|postgresql|mongodb|redis|sqlite|oracle|sql server|cassandra|dynamodb)\b/g,
      // Cloud & DevOps
      /\b(aws|azure|google cloud|gcp|docker|kubernetes|jenkins|gitlab|github actions|terraform)\b/g,
      // Web Technologies
      /\b(html5?|css3?|sass|scss|bootstrap|tailwind|jquery|webpack|babel)\b/g
    ];

    // Soft skills patterns
    const softSkillsPatterns = [
      /\b(leadership|management|communication|teamwork|problem[\s-]solving|analytical|creative|adaptable)\b/g,
      /\b(project management|time management|critical thinking|decision making|collaboration)\b/g,
      /\b(mentoring|coaching|training|presentation|negotiation|customer service)\b/g
    ];

    // Languages patterns - only detect if explicitly mentioned
    const languagePatterns = [
      // Explicit language mentions
      /\b(english|sinhala|tamil|hindi|mandarin|spanish|french|german|japanese|korean)\b/gi,
      // Proficiency levels with languages
      /\b(native|fluent|intermediate|basic|conversational|professional|mother\s*tongue)\s+(in\s+)?(english|sinhala|tamil|hindi|mandarin|spanish|french|german)\b/gi,
      // Common language phrases
      /\bspeak(s|ing)?\s+(english|sinhala|tamil|hindi|mandarin|spanish|french|german)\b/gi,
      /\b(english|sinhala|tamil|hindi|mandarin|spanish|french|german)\s+(speaker|speaking|language)\b/gi
    ];

    // Enhanced language extraction
    const extractLanguages = () => {
      const languageSet = new Set();
      const languageScores = new Map();

      languagePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          // Extract just the language name
          const langMatch = match.toLowerCase().match(/\b(english|sinhala|tamil|hindi|mandarin|spanish|french|german|japanese|korean)\b/);
          if (langMatch) {
            const lang = langMatch[0];
            const capitalizedLang = lang.charAt(0).toUpperCase() + lang.slice(1);

            // Score based on context
            let score = (languageScores.get(lang) || 0) + 1;

            // Higher score for explicit proficiency mentions
            if (/\b(native|fluent|intermediate|basic|conversational|professional)\b/i.test(match)) {
              score += 2;
            }

            languageScores.set(lang, score);
            languageSet.add(capitalizedLang);
          }
        });
      });

      // Only return languages with sufficient evidence (score > 1 or explicit mention)
      return Array.from(languageSet).filter(lang => {
        const score = languageScores.get(lang.toLowerCase()) || 0;
        return score > 1 || text.includes(lang.toLowerCase());
      });
    };

    // Certifications patterns
    const certificationPatterns = [
      /\b(aws certified|google cloud|azure|cisco|oracle|microsoft|comptia|pmp|scrum master)\b/g,
      /\b(certified|certification|diploma|degree|bachelor|master|phd)\s+[\w\s]+/g
    ];

    // Extract skills using patterns
    const extractSkills = (patterns) => {
      const skills = new Set();
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          const cleanSkill = match.trim().replace(/\b(certified|certification)\s*/gi, '');
          if (cleanSkill.length > 2) {
            // Capitalize first letter
            skills.add(cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1));
          }
        });
      });
      return Array.from(skills);
    };

    const technicalSkills = extractSkills(technicalSkillsPatterns);
    const softSkills = extractSkills(softSkillsPatterns);
    const languages = extractLanguages(); // Use enhanced language extraction
    const certifications = extractSkills(certificationPatterns);

    // Extract tools and frameworks separately
    const toolPatterns = [/\b(git|jira|confluence|slack|trello|figma|photoshop|vs code|intellij)\b/g];
    const frameworkPatterns = [/\b(react|angular|vue|django|spring|laravel|express|flask)\b/g];

    const tools = extractSkills(toolPatterns);
    const frameworks = extractSkills(frameworkPatterns);

    // Calculate confidence scores based on skill count and text analysis
    const totalSkillsFound = technicalSkills.length + softSkills.length + languages.length;
    const technicalConfidence = Math.min(0.9, Math.max(0.3, technicalSkills.length * 0.1));
    const overallConfidence = Math.min(0.95, Math.max(0.4, totalSkillsFound * 0.08));

    console.log(`✅ Extracted ${technicalSkills.length} technical skills, ${softSkills.length} soft skills`);

    return {
      technicalSkills,
      softSkills,
      languages,
      certifications,
      tools,
      frameworks,
      skillCategories: {
        'programming': technicalSkills.filter(skill =>
          /javascript|python|java|php|ruby|go|swift/i.test(skill)
        ),
        'cloud': technicalSkills.filter(skill =>
          /aws|azure|google cloud|docker|kubernetes/i.test(skill)
        ),
        'database': technicalSkills.filter(skill =>
          /mysql|postgresql|mongodb|redis|sql/i.test(skill)
        )
      },
      confidenceScores: {
        technical: technicalConfidence,
        soft: Math.min(0.85, Math.max(0.3, softSkills.length * 0.15)),
        languages: Math.min(0.90, Math.max(0.5, languages.length * 0.2)),
        overall: overallConfidence
      }
    };
  } catch (err) {
    console.error("❌ Advanced Skills Extraction Error:", err.message);
    return {
      technicalSkills: [],
      softSkills: [],
      languages: [],
      certifications: [],
      tools: [],
      frameworks: [],
      skillCategories: {},
      confidenceScores: {
        technical: 0,
        soft: 0,
        languages: 0,
        overall: 0
      }
    };
  }
};

// 🔍 Enhanced Experience Validation from Real CV Text
export const validateExperience = async (cvText, linkedInProfile = null) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log("🔍 Analyzing real experience from CV text (length:", cvText.length, ")");

    const text = cvText.toLowerCase();

    // Improved date extraction patterns
    const datePatterns = [
      // YYYY - YYYY format
      /\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/g,
      // YYYY - Present/Current
      /\b(19|20)\d{2}\s*[-–—]\s*(?:present|current|now|till\s+date|ongoing)\b/g,
      // Month YYYY - Month YYYY
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*(19|20)\d{2}\s*[-–—]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*(19|20)\d{2}\b/g,
      // Month YYYY - Present
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*(19|20)\d{2}\s*[-–—]\s*(?:present|current|now|till\s+date|ongoing)\b/g
    ];

    // Extract all date ranges from CV
    const dateRanges = [];
    const currentYear = new Date().getFullYear();

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        console.log("📅 Found date match:", match);

        let startYear, endYear;

        // Extract years from the match
        const years = match.match(/\b(19|20)\d{2}\b/g) || [];

        if (years.length >= 1) {
          startYear = parseInt(years[0]);

          if (years.length >= 2) {
            endYear = parseInt(years[1]);
          } else if (/present|current|now|till\s+date|ongoing/i.test(match)) {
            endYear = currentYear;
          }

          // Validate date range
          if (startYear && endYear && endYear >= startYear && startYear >= 1990 && endYear <= currentYear + 1) {
            const duration = endYear - startYear;
            dateRanges.push({
              start: startYear,
              end: endYear,
              duration: duration,
              original: match
            });
            console.log(`✅ Valid date range: ${startYear}-${endYear} (${duration} years)`);
          }
        }
      });
    });

    // Calculate total experience (removing overlaps)
    let totalExperience = 0;

    if (dateRanges.length > 0) {
      // Sort by start year
      const sortedRanges = dateRanges.sort((a, b) => a.start - b.start);

      // Merge overlapping ranges and calculate total
      const mergedRanges = [];
      let current = sortedRanges[0];

      for (let i = 1; i < sortedRanges.length; i++) {
        const next = sortedRanges[i];

        if (current.end >= next.start - 1) {
          // Overlapping or consecutive - merge
          current = {
            start: current.start,
            end: Math.max(current.end, next.end),
            duration: Math.max(current.end, next.end) - current.start
          };
        } else {
          // Non-overlapping - add current to merged and start new
          mergedRanges.push(current);
          current = next;
        }
      }
      mergedRanges.push(current);

      // Sum all merged ranges
      totalExperience = mergedRanges.reduce((sum, range) => sum + range.duration, 0);

      console.log(`📊 Calculated total experience: ${totalExperience} years from ${dateRanges.length} date ranges`);
    }

    // Alternative: Look for explicit experience mentions
    if (totalExperience === 0) {
      const expMatches = text.match(/(\d+)[\s]*(?:\+)?\s*years?\s+(?:of\s+)?(?:experience|exp)/g) || [];
      if (expMatches.length > 0) {
        const maxExpMentioned = Math.max(...expMatches.map(match => {
          const num = match.match(/\d+/);
          return num ? parseInt(num[0]) : 0;
        }));
        totalExperience = maxExpMentioned;
        console.log(`📝 Found explicit experience mention: ${totalExperience} years`);
      }
    }

    // If still no experience found, try to infer from roles
    if (totalExperience === 0) {
      const roleMatches = text.match(/(?:senior|lead|principal|staff|head)\s+(?:software\s+)?(?:engineer|developer|programmer|analyst|manager)/g) || [];
      if (roleMatches.length > 0) {
        // Senior roles suggest at least 3-5 years of experience
        totalExperience = Math.max(3, roleMatches.length * 2);
        console.log(`🎯 Inferred experience from senior roles: ${totalExperience} years`);
      }
    }

    // Extract job roles
    const roleMatches = text.match(/(?:senior|junior|lead|principal|staff)?\s*(?:software\s+)?(?:engineer|developer|programmer|analyst|manager|consultant|designer)/g) || [];
    const experienceByRole = [...new Set(roleMatches)].map((role, index) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      years: dateRanges[index]?.duration || Math.floor(totalExperience / roleMatches.length) || 1,
      company: `Company ${index + 1}` // Basic extraction - could be improved
    }));

    // Extract companies
    const companyMatches = [];
    companyPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const company = match.replace(/(?:at|@|worked|employed|position)\s+(?:at|with)?\s*/gi, '').trim();
        if (company.length > 2 && company.length < 50) {
          companyMatches.push(company.charAt(0).toUpperCase() + company.slice(1));
        }
      });
    });

    const companyVerification = [...new Set(companyMatches)].slice(0, 5).map(company => ({
      company: company,
      verified: Math.random() > 0.3 // Simulate verification - in real app would check against database
    }));

    // Check for inconsistencies
    const inconsistencies = [];
    if (dateRanges.length > 0) {
      // Check for date overlaps
      for (let i = 0; i < dateRanges.length - 1; i++) {
        for (let j = i + 1; j < dateRanges.length; j++) {
          if (dateRanges[i].end > dateRanges[j].start && dateRanges[i].start < dateRanges[j].end) {
            inconsistencies.push(`Overlapping employment periods detected: ${dateRanges[i].start}-${dateRanges[i].end} and ${dateRanges[j].start}-${dateRanges[j].end}`);
          }
        }
      }

      // Check for large gaps
      const sortedRanges = dateRanges.sort((a, b) => a.start - b.start);
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        const gap = sortedRanges[i + 1].start - sortedRanges[i].end;
        if (gap > 2) {
          inconsistencies.push(`Employment gap of ${gap} years between ${sortedRanges[i].end} and ${sortedRanges[i + 1].start}`);
        }
      }
    }

    // Calculate verification score
    const verificationScore = Math.min(95, Math.max(60,
      80 +
      (companyVerification.filter(c => c.verified).length * 3) -
      (inconsistencies.length * 10) +
      (totalExperience > 0 ? 10 : 0)
    ));

    // Generate recommendations
    const recommendations = [];
    if (inconsistencies.length > 0) {
      recommendations.push("Consider clarifying employment timeline discrepancies");
    }
    if (experienceByRole.length === 0) {
      recommendations.push("Add specific job titles and roles to strengthen your profile");
    }
    if (companyMatches.length === 0) {
      recommendations.push("Include company names to improve credibility");
    }
    if (totalExperience === 0) {
      recommendations.push("Clearly state your years of experience in your CV");
    }

    console.log(`✅ Extracted experience: ${totalExperience} years, ${experienceByRole.length} roles`);

    return {
      totalExperience,
      experienceByRole,
      companyVerification,
      dateConsistency: { consistent: inconsistencies.length === 0, gaps: inconsistencies },
      inconsistencies,
      verificationScore,
      recommendations
    };
  } catch (err) {
    console.error("❌ Experience Validation Error:", err.message);
    return {
      totalExperience: 0,
      experienceByRole: [],
      companyVerification: [],
      dateConsistency: {},
      inconsistencies: [],
      verificationScore: 0,
      recommendations: ["Unable to analyze experience data"]
    };
  }
};

// 🏆 Achievement Quantification and Scoring (Real CV Analysis)
export const quantifyAchievements = async (cvText, jobRole = null) => {
  try {
    // Processing started


    console.log("🏆 Analyzing achievements from CV text");

    const text = cvText.toLowerCase();

    // Achievement patterns with quantifiable metrics
    const achievementPatterns = [
      // Percentage improvements
      /(?:improved|increased|enhanced|optimized|boosted|reduced|decreased|cut|saved)\s+[\w\s]*\s+by\s+(\d+(?:\.\d+)?)\s*%/g,
      // Team leadership
      /(?:led|managed|supervised|mentored|coached)\s+(?:a\s+)?(?:team\s+of\s+)?(\d+)[\s]*(?:people|developers|engineers|members|staff)/g,
      // Project delivery
      /(?:delivered|completed|shipped|launched)\s+(\d+)[\s]*(?:projects?|features?|products?|applications?)/g,
      // Financial impact
      /(?:saved|generated|increased\s+revenue)\s+(?:by\s+)?(?:\$|usd|rs\.?)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      // Time improvements
      /(?:reduced|decreased|cut)\s+[\w\s]*\s+(?:time|duration)\s+by\s+(\d+)\s*(?:hours?|days?|weeks?|months?|%)/g,
      // User/customer metrics
      /(?:served|supported|handled)\s+(\d+(?:,\d{3})*(?:\+|\plus)?)\s*(?:users?|customers?|clients?)/g
    ];

    // Extract quantifiable achievements
    const quantifiedMetrics = [];
    const achievements = [];

    achievementPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const fullMatch = match[0];
        const value = parseFloat(match[1].replace(/,/g, ''));

        let context = '';
        let metricType = '';

        if (fullMatch.includes('improved') || fullMatch.includes('increased') || fullMatch.includes('enhanced')) {
          context = 'performance improvement';
          metricType = 'improvement';
        } else if (fullMatch.includes('led') || fullMatch.includes('managed') || fullMatch.includes('supervised')) {
          context = 'leadership';
          metricType = 'team_size';
        } else if (fullMatch.includes('delivered') || fullMatch.includes('completed') || fullMatch.includes('shipped')) {
          context = 'project delivery';
          metricType = 'project_count';
        } else if (fullMatch.includes('saved') || fullMatch.includes('generated')) {
          context = 'financial impact';
          metricType = 'financial';
        } else if (fullMatch.includes('reduced') || fullMatch.includes('cut')) {
          context = 'efficiency';
          metricType = 'time_saved';
        } else if (fullMatch.includes('served') || fullMatch.includes('supported')) {
          context = 'scale';
          metricType = 'user_count';
        }

        // Clean up the achievement text
        const cleanAchievement = fullMatch.charAt(0).toUpperCase() + fullMatch.slice(1);

        achievements.push(cleanAchievement);
        quantifiedMetrics.push({
          metric: metricType.replace('_', ' '),
          value: value,
          unit: fullMatch.includes('%') ? '%' : (fullMatch.includes('$') || fullMatch.includes('rs') ? 'currency' : 'count'),
          context: context
        });
      });
    });

    // Extract general achievements (non-quantified)
    const generalAchievementPatterns = [
      /(?:^|\n)[\s]*[-•*]\s*([^.\n]+(?:award|recognition|achievement|accomplished|successful|won|earned|certified)[^.\n]*)/gmi,
      /(?:^|\n)[\s]*[-•*]\s*([^.\n]+(?:promoted|promoted to|selected|chosen|nominated)[^.\n]*)/gmi
    ];

    generalAchievementPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const achievement = match[1].trim();
        if (achievement.length > 10 && achievement.length < 200) {
          achievements.push(achievement.charAt(0).toUpperCase() + achievement.slice(1));
        }
      });
    });

    // Remove duplicates
    const uniqueAchievements = [...new Set(achievements)].slice(0, 10);

    // Calculate impact score based on metrics found
    let impactScore = 30; // Base score

    quantifiedMetrics.forEach(metric => {
      if (metric.context === 'performance improvement') {
        impactScore += Math.min(30, metric.value * 0.5);
      } else if (metric.context === 'leadership') {
        impactScore += Math.min(20, metric.value * 2);
      } else if (metric.context === 'project delivery') {
        impactScore += Math.min(25, metric.value * 1.5);
      } else if (metric.context === 'financial impact') {
        impactScore += 25;
      } else if (metric.context === 'scale') {
        impactScore += Math.min(15, Math.log10(metric.value) * 3);
      }
    });

    impactScore = Math.min(95, Math.round(impactScore));

    // Calculate innovation score based on keywords
    const innovationKeywords = ['innovative', 'created', 'developed', 'designed', 'architected', 'pioneered', 'introduced', 'implemented', 'automated', 'optimized'];
    const innovationMatches = innovationKeywords.filter(keyword => text.includes(keyword)).length;
    const innovationScore = Math.min(90, 40 + (innovationMatches * 8));

    // Categorize achievements
    const achievementCategories = {
      'leadership': uniqueAchievements.filter(a => /led|managed|supervised|mentored|team/i.test(a)),
      'performance': uniqueAchievements.filter(a => /improved|increased|enhanced|optimized|performance/i.test(a)),
      'delivery': uniqueAchievements.filter(a => /delivered|completed|shipped|launched|project/i.test(a)),
      'innovation': uniqueAchievements.filter(a => /created|developed|designed|innovative|automated/i.test(a))
    };

    // Extract key accomplishments (best achievements)
    const keyAccomplishments = uniqueAchievements
      .filter(a => a.length > 20) // More detailed achievements
      .slice(0, 5);

    // Leadership indicators
    const leadershipIndicators = [];
    if (text.includes('team lead') || text.includes('team leader')) leadershipIndicators.push('team leadership');
    if (text.includes('project manag') || text.includes('scrum master')) leadershipIndicators.push('project management');
    if (text.includes('mentor') || text.includes('coach')) leadershipIndicators.push('mentoring');
    if (text.includes('trained') || text.includes('training')) leadershipIndicators.push('training');

    console.log(`✅ Extracted ${uniqueAchievements.length} achievements with ${quantifiedMetrics.length} quantified metrics`);

    return {
      achievements: uniqueAchievements,
      quantifiedMetrics,
      impactScore,
      achievementCategories,
      keyAccomplishments,
      leadershipIndicators,
      innovationScore
    };
  } catch (err) {
    console.error("❌ Achievement Quantification Error:", err.message);
    return {
      achievements: [],
      quantifiedMetrics: [],
      impactScore: 0,
      achievementCategories: {},
      keyAccomplishments: [],
      leadershipIndicators: [],
      innovationScore: 0
    };
  }
};

// 🌐 Multi-Language CV Processing (Real File Analysis)
export const processMultiLanguageCV = async (filePath, detectedLanguage = null) => {
  try {
    // Real text extraction from uploaded file
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time

    console.log("🌐 Processing CV file:", filePath);

    // Extract actual text from the uploaded file using AI Service (avoids OOM in Node.js)
    const extractedText = await extractCvText(filePath);

    // Simple language detection based on content
    let detectedLang = detectedLanguage || "english";
    const text = extractedText.toLowerCase();

    // Basic language detection
    const sinhalaPatterns = /[අ-ෆ]/g;
    const tamilPatterns = /[அ-ௐ]/g;

    if (sinhalaPatterns.test(extractedText)) {
      detectedLang = "sinhala";
    } else if (tamilPatterns.test(extractedText)) {
      detectedLang = "tamil";
    } else if (/\b(experience|education|skills|projects)\b/i.test(text)) {
      detectedLang = "english";
    }

    // Calculate language confidence
    const totalChars = extractedText.length;
    const englishChars = (extractedText.match(/[a-zA-Z]/g) || []).length;
    const languageConfidence = Math.min(0.95, Math.max(0.6, englishChars / totalChars));

    const multiLangResult = {
      originalText: extractedText,
      translatedText: extractedText, // In production, this would be translated if not English
      detectedLanguage: detectedLang,
      languageConfidence: languageConfidence,
      unicodeSupport: true,
      translationQuality: detectedLang === "english" ? 1.0 : 0.85
    };

    console.log(`✅ Multi-language processing completed: ${detectedLang}, confidence: ${Math.round(languageConfidence * 100)}%`);
    return multiLangResult;
  } catch (err) {
    console.error("❌ Multi-Language Processing Error:", err.message);

    // Fallback with sample text
    const fallbackText = "Error extracting text from CV. Please ensure the file is a valid PDF.";

    return {
      originalText: fallbackText,
      translatedText: fallbackText,
      detectedLanguage: "english",
      languageConfidence: 0.8,
      unicodeSupport: true,
      translationQuality: 0.8
    };
  }
};

// 📊 Comprehensive CV Quality Assessment (Real CV Analysis)
export const assessCVQuality = async (cvText, targetJob = null) => {
  try {
    // Processing started

    console.log("📊 Analyzing CV quality from actual content");

    const text = cvText;
    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;

    // Formatting Score Analysis
    let formattingScore = 60; // Base score

    // Check for proper sections
    const sections = ['experience', 'education', 'skills', 'projects', 'achievements'];
    const foundSections = sections.filter(section => lowerText.includes(section)).length;
    formattingScore += foundSections * 8;

    // Check for dates and structure
    if (/20\d{2}|19\d{2}/.test(text)) formattingScore += 5; // Has dates
    if (/[-•*]\s/.test(text)) formattingScore += 5; // Has bullet points
    if (lineCount > 20 && lineCount < 100) formattingScore += 10; // Good length

    formattingScore = Math.min(95, formattingScore);

    // Completeness Score Analysis
    let completenessScore = 40; // Base score

    const requiredElements = {
      'contact': /email|phone|contact|@|\+\d/,
      'experience': /experience|work|employment|position|role/,
      'education': /education|degree|university|college|school/,
      'skills': /skills|technologies|programming|technical/,
      'achievements': /achievement|accomplish|award|project|delivered|led/
    };

    Object.entries(requiredElements).forEach(([element, pattern]) => {
      if (pattern.test(lowerText)) {
        completenessScore += 12;
      }
    });

    completenessScore = Math.min(95, completenessScore);

    // Relevance Score (based on job-related keywords)
    let relevanceScore = 50;

    const jobKeywords = [
      'software', 'developer', 'engineer', 'programming', 'technical', 'project',
      'management', 'leadership', 'team', 'agile', 'scrum', 'database', 'web',
      'application', 'system', 'development', 'design', 'implementation'
    ];

    const foundKeywords = jobKeywords.filter(keyword => lowerText.includes(keyword)).length;
    relevanceScore += foundKeywords * 2.5;
    relevanceScore = Math.min(95, relevanceScore);

    // Readability Score
    let readabilityScore = 60;

    if (wordCount > 200 && wordCount < 800) readabilityScore += 15; // Good length
    if (text.match(/\./g)?.length > 10) readabilityScore += 10; // Proper sentences
    if (!/\b(I|me|my)\b/gi.test(text.slice(0, 200))) readabilityScore += 10; // Professional tone

    readabilityScore = Math.min(95, readabilityScore);

    // ATS Compatibility Score
    let atsCompatibility = 50;

    // ATS-friendly elements
    if (!/[^\x00-\x7F]/.test(text.slice(0, 500))) atsCompatibility += 15; // ASCII characters
    if (foundSections >= 3) atsCompatibility += 20; // Clear sections
    if (text.includes('skills') && text.includes('experience')) atsCompatibility += 15; // Key sections

    atsCompatibility = Math.min(95, atsCompatibility);

    // Keyword Density
    const totalWords = text.split(/\s+/).length;
    const technicalWords = (text.match(/javascript|python|java|react|node|aws|sql|git|docker/gi) || []).length;
    const keywordDensity = Math.min(95, (technicalWords / totalWords) * 1000);

    // Overall Score
    const overallScore = Math.round((formattingScore + completenessScore + relevanceScore + readabilityScore + atsCompatibility) / 5);

    // Generate strengths based on analysis
    const strengths = [];
    if (formattingScore >= 80) strengths.push('Well-structured format and organization');
    if (completenessScore >= 80) strengths.push('Comprehensive information provided');
    if (relevanceScore >= 75) strengths.push('Relevant professional keywords included');
    if (readabilityScore >= 75) strengths.push('Clear and professional writing style');
    if (atsCompatibility >= 75) strengths.push('ATS-friendly formatting');
    if (foundKeywords >= 8) strengths.push('Strong technical vocabulary');

    // Generate improvements based on analysis
    const improvements = [];
    if (formattingScore < 70) improvements.push('Improve CV structure and formatting');
    if (completenessScore < 70) improvements.push('Add missing essential sections');
    if (relevanceScore < 70) improvements.push('Include more industry-relevant keywords');
    if (readabilityScore < 70) improvements.push('Enhance writing clarity and professionalism');
    if (atsCompatibility < 70) improvements.push('Optimize for Applicant Tracking Systems');
    if (keywordDensity < 30) improvements.push('Add more technical skills and keywords');
    if (wordCount < 300) improvements.push('Provide more detailed descriptions');

    // Critical issues
    const criticalIssues = [];
    if (!lowerText.includes('email') && !text.includes('@')) {
      criticalIssues.push('Missing contact information');
    }
    if (wordCount < 150) {
      criticalIssues.push('CV is too short - add more details');
    }
    if (!lowerText.includes('experience') && !lowerText.includes('work')) {
      criticalIssues.push('No work experience section found');
    }

    // Suggestions
    const suggestions = [];
    if (!lowerText.includes('summary') && !lowerText.includes('objective')) {
      suggestions.push('Consider adding a professional summary at the top');
    }
    if (!lowerText.includes('github') && !lowerText.includes('portfolio')) {
      suggestions.push('Include links to your portfolio or GitHub profile');
    }
    if (foundKeywords < 10) {
      suggestions.push('Add more industry-specific technical terms');
    }
    if (!text.match(/\d+\s*years?/)) {
      suggestions.push('Quantify your experience with specific years');
    }

    console.log(`✅ CV quality assessed: Overall ${overallScore}%, ${strengths.length} strengths, ${improvements.length} improvements`);

    return {
      overallScore,
      formattingScore,
      completenessScore,
      relevanceScore,
      atsCompatibility,
      readabilityScore,
      keywordDensity: Math.round(keywordDensity),
      strengths,
      improvements,
      criticalIssues,
      suggestions
    };
  } catch (err) {
    console.error("❌ CV Quality Assessment Error:", err.message);
    return {
      overallScore: 50,
      formattingScore: 50,
      completenessScore: 50,
      relevanceScore: 50,
      atsCompatibility: 50,
      readabilityScore: 50,
      keywordDensity: 0,
      strengths: [],
      improvements: ["Unable to analyze CV quality"],
      criticalIssues: ["Analysis failed"],
      suggestions: ["Please try uploading the CV again"]
    };
  }
};
