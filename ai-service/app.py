import os
import logging
import json
import fitz  # PyMuPDF
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not found in environment variables. AI features will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✅ Gemini API configured successfully.")

def generate_content_safe(prompt):
    """Generates content using Gemini with fallback models."""
    # List of models to try in order of preference
    # Updated model names to match current Gemini API
    models = [
        'gemini-2.0-flash',      # Newest model
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-pro',
    ]

    last_error = None

    for model_name in models:
        try:
            logger.info(f"🤖 Trying AI model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            logger.info(f"✅ Successfully used model: {model_name}")
            return response
        except Exception as e:
            logger.warning(f"⚠️ Model {model_name} failed: {str(e)[:100]}")
            last_error = e
            continue

    # If all models fail, raise the last error
    logger.error(f"❌ All AI models failed. Last error: {last_error}")
    raise last_error

import gc

def extract_text_from_pdf(file_path):
    """Extracts text from a PDF file safely."""
    try:
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            # Debug: List directory contents to help troubleshoot
            dir_path = os.path.dirname(file_path)
            if os.path.exists(dir_path):
                logger.info(f"Contents of {dir_path}: {os.listdir(dir_path)}")
            else:
                logger.error(f"Directory {dir_path} does not exist")
            return None

        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return None

@app.route('/', methods=['GET'])
def health_check():
    # Check if API key is configured
    api_configured = GEMINI_API_KEY is not None and len(GEMINI_API_KEY) > 10
    return jsonify({
        "status": "online",
        "service": "Recruitment AI Service",
        "version": "2.1.0",
        "gemini_configured": api_configured
    })

@app.route('/test-gemini', methods=['GET'])
def test_gemini():
    """Test endpoint to verify Gemini API is working."""
    try:
        if not GEMINI_API_KEY:
            return jsonify({"error": "GEMINI_API_KEY not configured"}), 500
        
        # Try to generate simple content
        response = generate_content_safe("Say 'Hello, Gemini is working!' in exactly 5 words.")
        return jsonify({
            "status": "success",
            "response": response.text[:100]
        })
    except Exception as e:
        logger.error(f"Gemini test failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/extract-text', methods=['POST'])
def extract_text_endpoint():
    """Endpoint to extract text from PDF."""
    try:
        data = request.get_json()
        file_path = data.get('file_path')

        if not file_path:
            return jsonify({"error": "No file path provided"}), 400

        text = extract_text_from_pdf(file_path)
        if text is None:
            return jsonify({"error": "Failed to extract text or file not found"}), 404

        return jsonify({"text": text})
    except Exception as e:
        logger.error(f"Extract text error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-cv', methods=['POST'])
def analyze_cv():
    """
    Analyzes a CV against a Job Description using Gemini.
    Returns structured JSON matching the backend's expectation.
    """
    try:
        data = request.get_json()
        file_path = data.get('file_path')
        job_description = data.get('job_description', '')
        required_skills = data.get('required_skills', [])
        required_years = data.get('required_years', 0)

        logger.info(f"Analyzing CV: {file_path}")

        # 1. Get CV Text
        cv_text = data.get('cv_text')
        if not cv_text and file_path:
            cv_text = extract_text_from_pdf(file_path)

        if not cv_text:
            logger.error("Could not retrieve CV text")
            return jsonify({"error": "Could not retrieve CV text"}), 400

        # 2. Prepare Prompt
        prompt = f"""
        Act as an expert Technical Recruiter. Analyze the following CV against the Job Description.

        JOB DESCRIPTION:
        {job_description}

        REQUIRED SKILLS: {', '.join(required_skills) if required_skills else 'Not specified'}
        REQUIRED EXPERIENCE: {required_years} years

        CV TEXT:
        {cv_text[:15000]}

        Output a JSON object strictly following this schema:
        {{
            "overallScore": <number 0-100>,
            "skillsMatch": <number 0-100>,
            "experienceMatch": <number 0-100>,
            "extractedSkills": ["skill1", "skill2"],
            "matchingSkills": ["skill1", "skill2"],
            "missingSkills": ["skill1", "skill2"],
            "experienceYears": <number>,
            "recommendation": "Short summary recommendation",
            "aiSummary": {{
                "strengths": ["strength1", "strength2"],
                "weaknesses": ["weakness1", "weakness2"],
                "overallAssessment": "Detailed assessment",
                "recommendedActions": ["action1", "action2"],
                "fitScore": "Excellent Fit/Good Fit/Moderate Fit/Limited Fit",
                "experienceLevel": "Junior/Mid/Senior"
            }}
        }}
        """

        # 3. Call AI with Retry Logic
        response = generate_content_safe(prompt)

        # Force garbage collection
        gc.collect()

        # 4. Parse Response
        try:
            cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
            result = json.loads(cleaned_response)
            return jsonify(result)
        except json.JSONDecodeError:
            logger.error("Failed to parse AI response JSON")
            return jsonify({"error": "AI response parsing failed", "raw": response.text}), 500

    except Exception as e:
        logger.error(f"Analyze CV Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-profile', methods=['POST'])
def analyze_profile():
    """Extracts structured profile data from CV text."""
    try:
        data = request.get_json()
        cv_text = data.get('cv_text', '')

        if not cv_text:
            return jsonify({"error": "No CV text provided"}), 400

        prompt = f"""
        Extract structured data from this CV.

        CV TEXT:
        {cv_text[:15000]}

        Return JSON:
        {{
            "personalInfo": {{ "name": "Candidate Name", "email": "", "phone": "", "location": "", "linkedIn": "" }},
            "professionalSummary": "Brief summary",
            "skills": ["skill1", "skill2"],
            "experience": {{
                "totalYears": <number>,
                "positions": [ {{ "title": "", "company": "", "duration": "", "description": "" }} ]
            }},
            "education": [ {{ "degree": "", "field": "", "institution": "", "year": "" }} ],
            "aiInsights": {{
                "experienceLevel": "",
                "domainExpertise": [],
                "keyStrengths": [],
                "recommendedRoles": []
            }}
        }}
        """

        response = generate_content_safe(prompt)
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(cleaned_response)

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        logger.error(f"Profile Analysis Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/ai-summary', methods=['POST'])
def ai_summary():
    """Generates a quick summary."""
    try:
        data = request.get_json()
        cv_text = data.get('cv_text', '')

        prompt = f"""
        Summarize this CV for a recruiter.
        CV TEXT: {cv_text[:10000]}

        Return JSON:
        {{
            "summary": "3-4 sentences",
            "key_skills": [],
            "experience_highlight": "",
            "suggested_roles": [],
            "rating": "8/10"
        }}
        """

        response = generate_content_safe(prompt)
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(cleaned_response)

        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ai-chat', methods=['POST'])
def ai_chat():
    """Chat with the CV."""
    try:
        data = request.get_json()
        cv_text = data.get('cv_text', '')
        question = data.get('question', '')

        prompt = f"""
        Context: CV Content: {cv_text[:15000]}
        Question: {question}
        Answer as a helpful recruiter assistant based ONLY on the CV.
        """

        response = generate_content_safe(prompt)
        return jsonify({"status": "success", "answer": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
