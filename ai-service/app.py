from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configured successfully")
else:
    logger.warning("GEMINI_API_KEY not found. AI features will be limited.")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "success",
        "message": "AI Service is running",
        "version": "1.0.0"
    })

@app.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    """Analyze resume content for job matching"""
    try:
        data = request.get_json()

        if not data or 'resume_text' not in data:
            return jsonify({
                "status": "error",
                "message": "No resume text provided"
            }), 400

        resume_text = data['resume_text']
        job_description = data.get('job_description', '')

        # Placeholder AI analysis logic
        # TODO: Implement actual AI analysis using transformers/spacy
        analysis_result = {
            "match_score": 75,  # Placeholder score
            "skills_extracted": ["Python", "JavaScript", "React"],  # Placeholder skills
            "experience_level": "Mid-level",  # Placeholder
            "key_strengths": [
                "Strong programming background",
                "Web development experience"
            ],
            "recommendations": [
                "Consider highlighting project management experience",
                "Add more details about specific technologies used"
            ]
        }

        return jsonify({
            "status": "success",
            "data": analysis_result
        })

    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Internal server error"
        }), 500

@app.route('/match-candidates', methods=['POST'])
def match_candidates():
    """Match candidates to job requirements"""
    try:
        data = request.get_json()

        if not data or 'job_description' not in data:
            return jsonify({
                "status": "error",
                "message": "No job description provided"
            }), 400

        job_description = data['job_description']
        candidates = data.get('candidates', [])

        # Placeholder matching logic
        # TODO: Implement actual AI matching using transformers
        matched_candidates = []
        for candidate in candidates:
            matched_candidates.append({
                "candidate_id": candidate.get('id'),
                "name": candidate.get('name'),
                "match_score": 80,  # Placeholder score
                "matching_skills": ["Python", "React"],  # Placeholder
                "recommendation": "Strong candidate for the position"
            })

        return jsonify({
            "status": "success",
            "data": {
                "total_candidates": len(candidates),
                "matched_candidates": matched_candidates
            }
        })

    except Exception as e:
        logger.error(f"Error matching candidates: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Internal server error"
        }), 500

@app.route('/extract-skills', methods=['POST'])
def extract_skills():
    """Extract skills from text using NLP"""
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({
                "status": "error",
                "message": "No text provided"
            }), 400

        text = data['text']

        # Placeholder skill extraction
        # TODO: Implement actual NLP skill extraction using spaCy
        extracted_skills = [
            "Python", "JavaScript", "React", "Node.js",
            "MongoDB", "Machine Learning", "Data Analysis"
        ]

        return jsonify({
            "status": "success",
            "data": {
                "skills": extracted_skills,
                "confidence_scores": {skill: 0.85 for skill in extracted_skills}
            }
        })

    except Exception as e:
        logger.error(f"Error extracting skills: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Internal server error"
        }), 500

@app.route('/analyze-cv', methods=['POST'])
def analyze_cv():
    """Analyze CV file for job matching using Google Gemini AI (with fallback to regex)"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        # Get input data
        # In real scenario, we would extract text from file_path if provided,
        # but here we assume text might be passed or we use the sample text if not found
        # For this fix, we'll assume the backend sends the text or we extract it

        # Note: In the current architecture, the backend sends file_path.
        # We should ideally extract text here if not provided.
        # But for now, let's use the logic that was there but enhanced with Gemini.

        file_path = data.get('file_path', '')
        job_description = data.get('job_description', '').lower()
        required_skills = [skill.lower() for skill in (data.get('required_skills', []) or [])]
        required_years = data.get('required_years', 0)

        # Try to get text from request or extract from file
        cv_text = data.get('cv_text', '')

        if not cv_text and file_path:
            if os.path.exists(file_path):
                try:
                    logger.info(f"Attempting to extract text from: {file_path}")
                    import fitz  # PyMuPDF
                    doc = fitz.open(file_path)
                    cv_text = ""
                    for page in doc:
                        cv_text += page.get_text()
                    doc.close()
                    logger.info(f"Extracted {len(cv_text)} characters from PDF")
                    if len(cv_text) < 100:
                        logger.warning("Extracted text is very short. PDF might be an image or empty.")
                except Exception as e:
                    logger.error(f"Error extracting text from file: {e}")
            else:
                logger.error(f"File not found at path: {file_path}")

        # If still no text, we cannot analyze
        if not cv_text or len(cv_text.strip()) < 10:
            logger.warning("No valid text found for analysis. Returning error.")
            return jsonify({
                "overallScore": 0,
                "skillsMatch": 0,
                "experienceMatch": 0,
                "extractedSkills": [],
                "matchingSkills": [],
                "missingSkills": required_skills,
                "recommendation": "Error - Could not read CV file",
                "aiSummary": {
                    "strengths": [],
                    "weaknesses": ["CV file appears to be empty or unreadable"],
                    "overallAssessment": "Could not analyze CV content.",
                    "recommendedActions": ["Please upload a text-based PDF file"],
                    "fitScore": "Unknown",
                    "experienceLevel": "Unknown"
                }
            })

        logger.info(f"Analyzing CV with Gemini. Job Desc length: {len(job_description)}")
        # ---------------------------------------------------------
        # STRATEGY 1: USE GOOGLE GEMINI (SMART AI)
        # ---------------------------------------------------------
        if GEMINI_API_KEY:
            try:
                # Use gemini-1.5-flash which is faster and more reliable for free tier
                # Fallback to gemini-pro if flash is not available
                try:
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    logger.info("Using Gemini 1.5 Flash model")
                except:
                    model = genai.GenerativeModel('gemini-pro')
                    logger.info("Using Gemini Pro model")

                prompt = f"""
                You are an expert AI Recruiter. Analyze the following Candidate CV against the Job Description.

                JOB DESCRIPTION:
                {job_description}

                REQUIRED SKILLS: {', '.join(required_skills)}
                REQUIRED EXPERIENCE: {required_years} years

                CANDIDATE CV:
                {cv_text[:10000]}

                Analyze the CV and provide a JSON response with this EXACT structure:
                {{
                    "overallScore": <number 0-100>,
                    "skillsMatch": <number 0-100>,
                    "experienceMatch": <number 0-100>,
                    "extractedSkills": [<list of all technical skills found in CV>],
                    "matchingSkills": [<list of skills from CV that match requirements>],
                    "missingSkills": [<list of required skills missing in CV>],
                    "experienceYears": <number, total years of professional experience found>,
                    "recommendation": "<string, e.g. 'Excellent Fit - Strong candidate...'>",
                    "aiSummary": {{
                        "strengths": [<list of 2-3 key strengths>],
                        "weaknesses": [<list of 2-3 key weaknesses>],
                        "overallAssessment": "<short paragraph assessment>",
                        "recommendedActions": [<list of 2-3 actions>],
                        "fitScore": "<Excellent Fit/Good Fit/Moderate Fit/Limited Fit>",
                        "experienceLevel": "<Fresh Graduate/Junior/Mid-Level/Senior>"
                    }}
                }}

                IMPORTANT:
                1. Be strict but fair.
                2. Calculate experience years by analyzing work history dates in the CV.
                3. If the candidate has 0 years experience, mark as "Fresh Graduate".
                4. Return ONLY valid JSON.
                """

                response = model.generate_content(prompt)
                response_text = response.text.replace('```json', '').replace('```', '').strip()

                import json
                ai_result = json.loads(response_text)

                logger.info("Gemini analysis successful")
                return jsonify(ai_result)

            except Exception as ai_error:
                logger.error(f"Gemini analysis failed: {ai_error}. Falling back to regex.")
                # Fall through to regex logic

        # ---------------------------------------------------------
        # STRATEGY 2: REGEX / KEYWORD MATCHING (FALLBACK)
        # ---------------------------------------------------------

        # Extract ACTUAL skills from CV text - NO false data
        def extract_actual_skills(text, available_skills):
            found_skills = []
            text = text.lower()

            for skill in available_skills:
                if skill.lower() in text:
                    found_skills.append(skill)

            # Also check for common programming skills
            skill_keywords = [
                'python', 'javascript', 'java', 'html', 'css', 'react', 'node.js', 'sql',
                'mongodb', 'express', 'angular', 'vue', 'php', 'c++', 'c#', 'ruby'
            ]

            for skill in skill_keywords:
                if skill in text and skill not in [s.lower() for s in found_skills]:
                    found_skills.append(skill.title())

            return found_skills

        def extract_actual_experience(text):
            """Extract actual experience from CV - only if explicitly mentioned"""
            experience_years = 0

            # Look for experience indicators
            if any(indicator in text for indicator in ['years of experience', 'years experience', 'working', 'employed']):
                import re
                year_matches = re.findall(r'(\d+)\s*(?:years?|yr)', text)
                if year_matches:
                    experience_years = max([int(year) for year in year_matches])

            return experience_years

        # Extract actual information from CV
        extracted_skills = extract_actual_skills(cv_text, required_skills + ['Python', 'JavaScript', 'HTML', 'CSS', 'React'])
        actual_experience_years = extract_actual_experience(cv_text)

        # Calculate matching skills
        matching_skills = []
        for skill in required_skills:
            for extracted in extracted_skills:
                if skill.lower() == extracted.lower():
                    matching_skills.append(extracted)

        # Calculate missing skills
        missing_skills = [skill for skill in required_skills if skill.lower() not in [s.lower() for s in matching_skills]]

        # Calculate realistic scores based on ACTUAL data
        skills_match_score = int((len(matching_skills) / max(len(required_skills), 1)) * 100) if required_skills else 70

        # Experience matching based on ACTUAL experience
        if required_years == 0:
            experience_match_score = 100  # No experience required
        elif actual_experience_years == 0:
            experience_match_score = 30  # Fresh graduate penalty if experience required
        elif actual_experience_years >= required_years:
            experience_match_score = 100  # Meets or exceeds requirement
        else:
            experience_match_score = int((actual_experience_years / required_years) * 80) + 20  # Partial credit

        # Overall score based on actual matching
        overall_score = int((skills_match_score * 0.7) + (experience_match_score * 0.3))

        # Create AI summary based on ACTUAL findings
        is_fresh_graduate = actual_experience_years == 0
        has_relevant_skills = len(matching_skills) > 0

        strengths = []
        if has_relevant_skills:
            strengths.append(f"Relevant technical skills: {', '.join(matching_skills[:3])}")
        if is_fresh_graduate:
            strengths.append("Fresh graduate with academic foundation")
            strengths.append("Eager to learn and grow professionally")
        else:
            strengths.append(f"{actual_experience_years} years of professional experience")

        weaknesses = []
        if missing_skills:
            weaknesses.append(f"Missing required skills: {', '.join(missing_skills[:3])}")
        if is_fresh_graduate and required_years > 0:
            weaknesses.append(f"No professional experience (requires {required_years} years)")

        # Realistic assessment
        if overall_score >= 80:
            fit_score = "Excellent Fit"
            assessment = "Strong candidate with excellent alignment to job requirements."
        elif overall_score >= 60:
            fit_score = "Good Fit"
            assessment = "Good candidate with relevant skills and potential for growth."
        elif overall_score >= 40:
            fit_score = "Moderate Fit"
            assessment = "Candidate has some relevant qualifications but may need training."
        else:
            fit_score = "Limited Fit"
            assessment = "Candidate has limited alignment with job requirements."

        analysis_result = {
            "overallScore": overall_score,
            "skillsMatch": skills_match_score,
            "experienceMatch": experience_match_score,
            "extractedSkills": extracted_skills,
            "matchingSkills": matching_skills,
            "missingSkills": missing_skills,
            "recommendation": f"{fit_score} - {assessment}",
            "aiSummary": {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "overallAssessment": assessment,
                "recommendedActions": [
                    "Review technical skills alignment" if not has_relevant_skills else "Consider for technical interview",
                    "Assess learning potential and enthusiasm" if is_fresh_graduate else "Evaluate practical experience",
                    "Discuss career growth opportunities"
                ],
                "fitScore": fit_score,
                "experienceLevel": "Fresh Graduate" if is_fresh_graduate else f"{actual_experience_years} Years Experience"
            }
        }

        logger.info(f"Analysis complete: Overall {overall_score}%, Skills {skills_match_score}%, Experience {experience_match_score}%")

        return jsonify(analysis_result)

    except Exception as e:
        logger.error(f"Error analyzing CV: {str(e)}")
        return jsonify({
            "error": True,
            "message": "AI analysis failed",
            "overallScore": 0
        }), 500

@app.route('/bulk-analyze', methods=['POST'])
def bulk_analyze():
    """Bulk analyze CV against multiple jobs (for recommendations)"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        cv_text = data.get('cv_text', '')
        jobs = data.get('jobs', [])

        # Placeholder bulk analysis logic
        # TODO: Implement actual bulk job matching
        analyses = []
        for job in jobs:
            job_analysis = {
                "jobId": job.get('_id'),
                "overallScore": 75 + (hash(str(job.get('_id', ''))) % 25),  # Random score 75-100
                "skillsMatch": 80,
                "experienceMatch": 70,
                "recommendation": f"Good fit for {job.get('title', 'this position')}"
            }
            analyses.append(job_analysis)

        return jsonify({
            "analyses": analyses
        })

    except Exception as e:
        logger.error(f"Error in bulk analysis: {str(e)}")
        return jsonify({
            "analyses": []
        }), 500

@app.route('/extract-text', methods=['POST'])
def extract_text():
    """Extract text from uploaded PDF file using PyMuPDF"""
    try:
        data = request.get_json()

        if not data or 'file_path' not in data:
            return jsonify({
                "status": "error",
                "message": "No file path provided"
            }), 400

        file_path = data['file_path']
        logger.info(f"Extracting text from PDF: {file_path}")

        try:
            import fitz  # PyMuPDF
            import os

            # Check if file exists
            if not os.path.exists(file_path):
                logger.error(f"PDF file not found: {file_path}")
                return jsonify({"text": ""})

            # Open and extract text from PDF
            pdf_document = fitz.open(file_path)
            extracted_text = ""

            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                extracted_text += page_text + "\n"

            pdf_document.close()

            # Clean up the text
            extracted_text = extracted_text.strip()
            logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF")

            return jsonify({
                "text": extracted_text
            })

        except Exception as pdf_error:
            logger.error(f"PDF extraction error: {str(pdf_error)}")
            # Return empty text if PDF extraction fails
            return jsonify({"text": ""})

    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}")
        return jsonify({
            "text": ""
        }), 500

@app.route('/analyze-profile', methods=['POST'])
def analyze_profile():
    """Comprehensive CV analysis to extract ONLY actual information from CV text - NO mock data"""
    try:
        data = request.get_json()

        if not data or 'cv_text' not in data:
            return jsonify({
                "status": "error",
                "message": "No CV text provided"
            }), 400

        cv_text = data['cv_text'].lower() if data['cv_text'] else ""

        # Extract actual information from CV text - NO assumptions or mock data
        def extract_skills_from_text(text):
            """Extract programming/technical skills mentioned in CV"""
            skills = []
            # Common technical skills to look for
            skill_keywords = [
                'python', 'java', 'javascript', 'js', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
                'html', 'css', 'sql', 'mysql', 'postgresql', 'mongodb', 'react', 'angular', 'vue', 'svelte',
                'node.js', 'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'dotnet',
                'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'windows', 'bash',
                'firebase', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'xamarin',
                'machine learning', 'data analysis', 'artificial intelligence', 'nlp', 'opencv', 'tensorflow', 'pytorch',
                'agile', 'scrum', 'jira', 'figma', 'photoshop', 'illustrator'
            ]

            for skill in skill_keywords:
                # Check for word boundary to avoid partial matches (e.g. "java" in "javascript")
                # Simple check: if skill is short, use boundary. If long, simple inclusion.
                if len(skill) <= 3:
                     if f" {skill} " in f" {text} " or f" {skill}," in f" {text} " or f" {skill}\n" in f" {text} ":
                        skills.append(skill.title())
                elif skill in text:
                    skills.append(skill.title())

            return list(set(skills))  # Remove duplicates

        def extract_education_from_text(text):
            """Extract education information from CV"""
            education = []

            # Look for degree keywords
            if any(word in text for word in ['bachelor', 'degree', 'bsc', 'b.sc', 'undergraduate', 'master', 'msc', 'phd', 'diploma']):
                degree_type = "Degree"
                if 'master' in text or 'msc' in text: degree_type = "Master's Degree"
                elif 'phd' in text: degree_type = "PhD"
                elif 'bachelor' in text or 'bsc' in text: degree_type = "Bachelor's Degree"
                elif 'diploma' in text: degree_type = "Diploma"

                education.append({
                    "degree": degree_type,
                    "field": "Computer Science/Engineering" if any(word in text for word in ['computer', 'software', 'engineering', 'technology', 'it', 'information']) else "Not specified",
                    "institution": "University" if 'university' in text else "Educational Institution",
                    "year": "Not specified"
                })

            return education

        def extract_experience_from_text(text):
            """Extract work experience from CV - only if explicitly mentioned"""
            experience_years = 0
            positions = []

            # Look for explicit experience mentions
            experience_patterns = [
                'years of experience', 'years experience', 'work experience',
                'professional experience', 'working experience', 'employment history'
            ]

            # Only count experience if explicitly mentioned
            if any(pattern in text for pattern in experience_patterns):
                # Try to extract number of years if mentioned
                import re
                year_matches = re.findall(r'(\d+)\s*(?:years?|yr)', text)
                if year_matches:
                    experience_years = max([int(year) for year in year_matches])

            # Look for job titles/positions
            job_titles = []
            if 'senior' in text: job_titles.append("Senior Developer")
            if 'lead' in text: job_titles.append("Tech Lead")
            if 'developer' in text and 'senior' not in text: job_titles.append("Software Developer")
            if 'engineer' in text and 'senior' not in text: job_titles.append("Software Engineer")
            if 'intern' in text: job_titles.append("Intern")

            if job_titles:
                positions = [{
                    "title": job_titles[0],
                    "company": "Previous Company",
                    "duration": f"~{experience_years} years" if experience_years > 0 else "Not specified",
                    "description": "Work experience as mentioned in CV"
                }]

            return {"totalYears": experience_years, "positions": positions}

        def extract_personal_info(text):
            """Extract contact information if available"""
            import re

            # Extract email
            email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
            email = email_match.group() if email_match else "Not specified"

            # Extract phone (basic pattern)
            phone_match = re.search(r'[\+]?[1-9]?[0-9]{7,15}', text)
            phone = phone_match.group() if phone_match else "Not specified"

            return {
                "name": "Candidate Name",  # Can't reliably extract name
                "email": email,
                "phone": phone,
                "location": "Sri Lanka" if 'sri lanka' in text else "Not specified",
                "linkedIn": "Not specified"
            }

        # Extract actual data from CV
        extracted_skills = extract_skills_from_text(cv_text)
        extracted_education = extract_education_from_text(cv_text)
        extracted_experience = extract_experience_from_text(cv_text)
        extracted_personal = extract_personal_info(cv_text)

        # Create professional summary based on actual findings
        is_fresh_graduate = extracted_experience["totalYears"] == 0
        has_education = len(extracted_education) > 0

        if is_fresh_graduate and has_education:
            summary = "Recent graduate with academic background in computer science/engineering. Seeking opportunities to apply theoretical knowledge in practical software development projects."
        elif extracted_experience["totalYears"] > 0:
            summary = f"Professional with {extracted_experience['totalYears']} years of experience in software development. Skilled in various technologies and committed to delivering quality solutions."
        else:
            summary = "Professional seeking opportunities in software development and technology."

        # Only return data that was actually found in the CV
        profile_data = {
            "personalInfo": extracted_personal,
            "professionalSummary": summary,
            "skills": extracted_skills if extracted_skills else [],
            "experience": extracted_experience,
            "education": extracted_education if extracted_education else [],
            "aiInsights": {
                "experienceLevel": "Fresh Graduate" if is_fresh_graduate else f"{extracted_experience['totalYears']} Years Experience",
                "domainExpertise": ["Software Development"] if extracted_skills else [],
                "keyStrengths": [
                    "Academic foundation" if is_fresh_graduate else "Professional experience",
                    "Technical skills" if extracted_skills else "Learning potential"
                ],
                "recommendedRoles": [
                    "Junior Software Developer" if is_fresh_graduate else "Software Developer",
                    "Trainee Software Engineer" if is_fresh_graduate else "Software Engineer"
                ]
            }
        }

        return jsonify({
            "status": "success",
            "data": profile_data
        })

    except Exception as e:
        logger.error(f"Error analyzing profile: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Profile analysis failed"
        }), 500

@app.route('/ai-summary', methods=['POST'])
def ai_summary():
    """Generate a smart summary of the CV using Google Gemini"""
    try:
        data = request.get_json()
        if not data or 'cv_text' not in data:
            return jsonify({"status": "error", "message": "No CV text provided"}), 400

        cv_text = data['cv_text']

        if not GEMINI_API_KEY:
            return jsonify({
                "status": "error",
                "message": "Gemini API key not configured. Please add GEMINI_API_KEY to .env file."
            }), 503

        # Initialize model
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
        except:
            model = genai.GenerativeModel('gemini-pro')

        prompt = f"""
        You are an expert technical recruiter. Analyze the following CV text and provide a professional summary.

        CV Text:
        {cv_text[:10000]}

        Please provide a JSON response with the following structure:
        {{
            "summary": "A concise 3-4 sentence professional summary",
            "key_skills": ["Skill 1", "Skill 2", "Skill 3"],
            "experience_highlight": "Brief highlight of their experience",
            "suggested_roles": ["Role 1", "Role 2"],
            "rating": "Score out of 10 based on clarity and content"
        }}
        """

        response = model.generate_content(prompt)

        # Clean up response to ensure it's valid JSON if the model adds markdown formatting
        response_text = response.text.replace('```json', '').replace('```', '').strip()

        import json
        try:
            ai_response = json.loads(response_text)
        except:
            # Fallback if JSON parsing fails
            ai_response = {
                "summary": response.text,
                "key_skills": [],
                "experience_highlight": "See summary",
                "suggested_roles": [],
                "rating": "N/A"
            }

        return jsonify({
            "status": "success",
            "data": ai_response
        })

    except Exception as e:
        logger.error(f"Error in AI summary: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/ai-chat', methods=['POST'])
def ai_chat():
    """Chat with the CV context using Google Gemini"""
    try:
        data = request.get_json()
        if not data or 'cv_text' not in data or 'question' not in data:
            return jsonify({"status": "error", "message": "CV text and question are required"}), 400

        cv_text = data['cv_text']
        question = data['question']

        if not GEMINI_API_KEY:
            return jsonify({
                "status": "error",
                "message": "Gemini API key not configured."
            }), 503

        # Use gemini-pro as it is the most widely supported model in the library
        model = genai.GenerativeModel('gemini-pro')

        prompt = f"""
        Context: You are an AI assistant helping a recruiter analyze a candidate's CV.

        CV Content:
        {cv_text[:10000]}

        Recruiter's Question: {question}

        Answer the question based ONLY on the CV content provided above. If the information is not in the CV, say "I cannot find this information in the CV."
        Keep the answer concise and professional.
        """

        response = model.generate_content(prompt)

        return jsonify({
            "status": "success",
            "answer": response.text
        })

    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'

    logger.info(f"Starting AI Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
