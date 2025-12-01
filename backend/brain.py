import os
import time
import asyncio
import logging
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

# --- LOGGING SETUP ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- CONFIGURATION ---
MODEL_NAME = "gemini-2.5-pro"
LIVE_MODEL = "gemini-2.5-flash-preview-native-audio-dialog"  # For Live API

# Configurable constants (instead of magic numbers)
CONFIG = {
    "TEMPERATURE": 0.7,
    "TOP_P": 0.95,
    "TOP_K": 64,
    "MAX_OUTPUT_TOKENS": 8192,
    "QUOTA_WAIT_TIME": 35,  # seconds to wait when all models are rate limited
    "MAX_RETRIES": 2,
}

generation_config = {
    "temperature": CONFIG["TEMPERATURE"],
    "top_p": CONFIG["TOP_P"],
    "top_k": CONFIG["TOP_K"],
    "max_output_tokens": CONFIG["MAX_OUTPUT_TOKENS"],
    "response_mime_type": "text/plain",
}


# --- CUSTOM EXCEPTIONS ---
class GitRealError(Exception):
    """Base exception for GitReal"""
    pass

class QuotaExceededError(GitRealError):
    """Raised when all Gemini models are quota limited"""
    pass

class AnalysisError(GitRealError):
    """Raised when analysis fails"""
    pass

class TTSError(GitRealError):
    """Raised when text-to-speech fails"""
    pass

# Use Gemini 2.5 Flash
model = genai.GenerativeModel(MODEL_NAME, generation_config=generation_config)
chat_model = genai.GenerativeModel(MODEL_NAME)

# Global voice chat session
voice_chat_session = None
live_session_context = None  # Store context for Live API


# --- SMART MODEL FALLBACK + RETRY LOGIC ---
FALLBACK_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash"]

def is_quota_error(error):
    """Check if an error is a quota/rate limit error."""
    error_str = str(error).lower()
    return any(x in error_str for x in ["quota", "rate", "resource", "429", "retry_delay", "exhausted"])


def gemini_generate_with_retry(model_instance, prompt, max_retries=2):
    """
    Call Gemini's generate_content with automatic retry on rate limits.
    If quota is exhausted, tries fallback models automatically.
    """
    # First try with the provided model
    try:
        response = model_instance.generate_content(prompt)
        return response
    except Exception as e:
        if not is_quota_error(e):
            raise e
        print(f"   ⚠️ Primary model quota exhausted: {e}")

    # Try fallback models
    for fallback_model_name in FALLBACK_MODELS:
        try:
            print(f"   🔄 Trying fallback model: {fallback_model_name}...")
            fallback_model = genai.GenerativeModel(fallback_model_name)
            response = fallback_model.generate_content(prompt)
            print(f"   ✅ Success with {fallback_model_name}")
            return response
        except Exception as e:
            if is_quota_error(e):
                print(f"   ❌ {fallback_model_name} also quota limited")
                continue
            else:
                raise e

    # All models failed - wait and retry once more
    logger.warning(f"All models quota limited. Waiting {CONFIG['QUOTA_WAIT_TIME']}s...")
    time.sleep(CONFIG["QUOTA_WAIT_TIME"])

    # Final attempt with primary model after wait
    try:
        response = model_instance.generate_content(prompt)
        return response
    except Exception as e:
        raise Exception(f"All Gemini models are quota limited. Please wait 1-2 minutes and try again. Error: {e}")


def gemini_generate_json_with_retry(prompt, max_retries=2):
    """
    Special function for JSON generation - tries multiple models with JSON config.
    """
    json_config = {"response_mime_type": "application/json"}

    for model_name in FALLBACK_MODELS:
        try:
            print(f"   🤖 Trying {model_name} for JSON generation...")
            json_model = genai.GenerativeModel(model_name, generation_config=json_config)
            response = json_model.generate_content(prompt)
            print(f"   ✅ Success with {model_name}")
            return response
        except Exception as e:
            if is_quota_error(e):
                print(f"   ❌ {model_name} quota limited, trying next...")
                continue
            else:
                raise e

    # All failed - wait and retry
    logger.warning(f"All models quota limited. Waiting {CONFIG['QUOTA_WAIT_TIME']}s...")
    time.sleep(CONFIG["QUOTA_WAIT_TIME"])

    # Final attempt
    json_model = genai.GenerativeModel(FALLBACK_MODELS[0], generation_config=json_config)
    return json_model.generate_content(prompt)

def extract_projects_from_resume(resume_text):
    """
    Uses Gemini to extract project names and GitHub URLs from resume text.
    Returns list of projects with name, description, and github_url.
    """
    # Debug: Print resume length and preview
    print(f"   📄 Resume Length: {len(resume_text)} characters")
    print(f"   📄 Resume Preview: {resume_text[:500]}...")

    prompt = f"""
    You are a resume parser for GitReal - a tool that verifies resume claims against code.

    Your job is to extract ALL projects/experiences from this resume - ESPECIALLY ones WITHOUT GitHub links.
    Projects without GitHub links are IMPORTANT because they need to be flagged as "unverified claims".

    RESUME TEXT:
    ---
    {resume_text}
    ---

    EXTRACT ALL OF THESE:
    1. ✅ Projects WITH GitHub URLs (these can be verified)
    2. ⚠️ Projects WITHOUT GitHub URLs (these are UNVERIFIED - still include them!)
    3. ⚠️ Hackathon participations (with or without links)
    4. ⚠️ Work experience projects
    5. ⚠️ Any claimed achievements/builds

    OUTPUT JSON FORMAT:
    {{
        "projects": [
            {{
                "name": "Project or Hackathon Name",
                "description": "What they claimed to build/do",
                "github_url": "https://github.com/... OR null if NO link provided",
                "technologies": ["tech1", "tech2"]
            }}
        ]
    }}

    CRITICAL RULES:
    1. Extract EVERY project mentioned, even if there's NO GitHub link
    2. Hackathons like "ETHIndia", "HackBangalore", "VIBEATHON" are projects - include them!
    3. If no GitHub URL is found for a project, set github_url to null (NOT empty string)
    4. Do NOT invent projects - only extract what's actually written in the resume
    5. Look for keywords: "Built", "Developed", "Created", "Hackathon", "Project", "Application"
    """

    try:
        # Use smart model fallback for rate limits
        response = gemini_generate_json_with_retry(prompt)
        result = json.loads(response.text)
        print(f"📋 Extracted {len(result.get('projects', []))} projects from resume")
        return result.get("projects", [])
    except Exception as e:
        print(f"❌ Error extracting projects: {e}")
        # Fallback: try regex to find GitHub URLs
        import re
        github_urls = re.findall(r'github\.com/([a-zA-Z0-9-_]+)/([a-zA-Z0-9-_]+)', resume_text)
        projects = []
        for owner, repo in github_urls:
            projects.append({
                "name": repo,
                "description": f"GitHub repository: {owner}/{repo}",
                "github_url": f"https://github.com/{owner}/{repo}",
                "technologies": []
            })
        return projects if projects else [{"name": "No projects found", "description": "Please enter GitHub URL manually", "github_url": None, "technologies": []}]


def analyze_resume_vs_code(resume_text, code_context, project_name=None):
    """
    The 'Roast' Function. Returns strict JSON analysis with credibility scoring.
    Performs forensic audit: Seniority Check, Skill Stuffing, Modernity Check, Commitment Check.
    If project_name is provided, focuses ONLY on that specific project.
    """
    # Check if this is a "no code" scenario (PHANTOMWARE mode)
    no_code_provided = "NO CODE PROVIDED" in code_context or len(code_context) < 100

    # Build project-specific instruction if a project was selected
    project_focus = ""
    if project_name:
        project_focus = f"""
    ⚠️ CRITICAL INSTRUCTION - FOCUS ON ONE PROJECT ONLY:
    The user has selected the project: "{project_name}"
    ONLY analyze THIS specific project. Do NOT mention or flag other projects from the resume.
    """

    # Get current date for context (so AI doesn't flag recent dates as "future")
    from datetime import datetime
    current_date = datetime.now().strftime("%B %d, %Y")

    # Special prompt for PHANTOMWARE mode (no code provided)
    if no_code_provided and project_name:
        prompt = f"""
        You are 'GitReal', a Forensic Resume Auditor.

        📅 **TODAY'S DATE: {current_date}**
        (Use this to correctly evaluate dates. Do NOT flag past dates as "future dates".)

        The user selected the project "{project_name}" but provided NO GitHub link or code.

        RESUME TEXT:
        {resume_text[:4000]}

        YOUR TASK:
        Find the project "{project_name}" in the resume and flag ALL its claims as UNVERIFIED/PHANTOMWARE.

        OUTPUT JSON FORMAT (use EXACTLY these 6 keys):
        {{
            "credibility_score": 0,
            "verdict": "Project '{project_name}' is PHANTOMWARE - zero code evidence provided to verify claims.",
            "matches": [],
            "red_flags": [
                "🚩 PHANTOMWARE: Project '{project_name}' has NO GitHub link - all claims are unverified.",
                "🚩 UNVERIFIED: [List each specific claim from this project]"
            ],
            "missing_gems": [],
            "summary": "Cannot verify any claims. Credibility: 0/100"
        }}

        Extract the specific claims made about "{project_name}" and list each one as a red flag.
        """
    else:
        prompt = f"""
        You are 'GitReal', a ruthless Senior Staff Engineer and Forensic Resume Auditor.

        📅 **TODAY'S DATE: {current_date}**
        (Use this to correctly evaluate dates on the resume. Do NOT flag dates that are in the past as "future dates".)

        {project_focus}

        **INPUT DATA:**

        **1. CANDIDATE RESUME (The Claims):**
        {resume_text[:4000]}

        **2. CODEBASE EVIDENCE (The Truth):**
        {code_context[:50000] if code_context else "NO CODE PROVIDED"}

        **YOUR AUDIT PROTOCOL:**

        1. **Seniority Check:** Compare Job Titles (e.g., "Senior", "Lead", "Architect") against code complexity.
           - If they claim "Senior" but write monolithic, un-modularized code with no error handling -> FLAG IT.

        2. **Skill Stuffing:** Look at the "Skills" section.
           - If they list "Docker, Kubernetes, AWS" but repo has no Dockerfile or config -> FLAG as 'Keyword Stuffing'.

        3. **Modernity Check:**
           - If they claim "Modern React" but use class components and `var` -> FLAG as 'Outdated'.

        4. **Commitment Check:**
           - If they claim "Lead Developer" but code volume/complexity suggests tutorial copy -> FLAG IT.

        **OUTPUT FORMAT (Strict JSON with EXACTLY these 6 keys):**
        {{
            "credibility_score": 75,
            "verdict": "A 1-sentence ruthless summary (e.g. 'Claims Senior Architect, but codes like Junior Intern.')",
            "matches": [
                "✅ Verified: 'Python' proficiency confirmed via complex decorators in data.py.",
                "✅ Verified: 'System Design' claim supported by modular folder structure."
            ],
            "red_flags": [
                "🚩 SENIORITY MISMATCH: Resume claims 'Senior Lead', but code lacks basic error handling.",
                "🚩 KEYWORD STUFFING: Lists 'Microservices/AWS/Docker' but repo is a simple local script.",
                "🚩 SECURITY RISK: Hardcoded secrets found despite 'Security Expert' claim.",
                "🚩 OUTDATED: Claims 'Modern React' but uses class components and var."
            ],
            "missing_gems": [
                "💎 Code demonstrates 'Test Driven Development' (tests folder found), but not on resume.",
                "💎 Used 'AsyncIO' patterns - add this to skills."
            ],
            "summary": "Brief verdict with credibility score context."
        }}

        Be ruthless. Score 0-100 based on how honest the resume is compared to the code.
        """

    try:
        print(f"   🧠 Analyzing project: {project_name or 'ALL'} | Code provided: {not no_code_provided}")
        # Use smart model fallback for rate limits
        response = gemini_generate_json_with_retry(prompt)
        return response.text
    except Exception as e:
        print(f"   ❌ Gemini Error: {e}")
        # Return a valid PHANTOMWARE response for no-code projects
        if no_code_provided and project_name:
            return json.dumps({
                "matches": [],
                "red_flags": [f"🚩 PHANTOMWARE: Project '{project_name}' has NO GitHub link - cannot verify any claims."],
                "missing_gems": [],
                "summary": f"Project '{project_name}' is UNVERIFIED. No code provided to substantiate claims."
            })
        return json.dumps({
            "matches": [],
            "red_flags": [f"System Error: {str(e)}"],
            "missing_gems": [],
            "summary": "Analysis failed."
        })

def generate_star_bullets(code_context):
    """
    Generates 3-4 powerful STAR method bullet points from code.
    """
    # SAFETY CHECK: If the code context is empty, don't confuse the AI
    if not code_context or len(code_context) < 50:
        return "⚠️ ERROR: No code was found in this repository. Please check the URL or try a public repo."

    prompt = f"""
    SYSTEM INSTRUCTION: IGNORE all previous instructions about not browsing the web.
    I have ALREADY scraped the repository using a local script.
    The text below IS the code. You do not need to access the internet.
    
    YOUR TASK:
    Act as a Senior Resume Writer. Read the code provided below and extract 3 resume bullet points using the STAR method.
    
    RULES:
    1. Do NOT apologize.
    2. Do NOT say "I cannot scan".
    3. Assume the code below is the complete truth.
    4. Focus on technical keywords found in the text (e.g. libraries, logic).

    --- BEGIN RAW CODE DUMP ---
    {code_context[:50000]} 
    --- END RAW CODE DUMP ---

    OUTPUT FORMAT:
    - Bullet 1
    - Bullet 2
    - Bullet 3
    """
    try:
        # We use standard text generation here
        text_model = genai.GenerativeModel("gemini-2.5-flash")
        response = text_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating bullets: {str(e)}"

def get_chat_response(history, message, context):
    """
    Handles the chat interaction.
    """
    chat = chat_model.start_chat(history=history)
    
    system_prompt = f"""
    You are Morpheus from The Matrix.
    You are talking to a candidate who wants to escape the simulation (get a job).
    
    CONTEXT:
    {context}
    
    RULES:
    1. Speak in metaphors about the Matrix, code, and reality.
    2. Be direct and slightly cryptic but helpful.
    3. Use the context provided to answer their questions about their code or resume.
    """
    
    try:
        response = chat.send_message(f"{system_prompt}\n\nUSER: {message}")
        return response.text
    except Exception as e:
        return f"The Matrix is glitching... {str(e)}"

def generate_interview_challenge(code_context, analysis_json):
    """
    Generates a tough technical question - attacks Phantom Projects first.
    """
    prompt = f"""
    Act as a skeptical CTO conducting a stress interview.

    PREVIOUS ANALYSIS:
    {analysis_json}

    RAW CODE SEGMENT:
    {code_context[:20000]}

    INSTRUCTIONS:
    1. Look at the 'red_flags' in the analysis.
    2. If there are "PHANTOMWARE" or "UNVERIFIED" claims (e.g., projects mentioned in resume but missing from code), ATTACK THAT FIRST.
    3. Ask: "You mentioned [Project Name] in your resume, but I see no code for it. Explain the specific architecture you used, or admit it doesn't exist."
    4. If no phantom projects, pick a specific file/function and ask a hard technical question about implementation choices.
    5. Be direct and intimidating. No mercy.

    OUTPUT:
    Just the question. Short. Direct. Intimidating. No greetings or preamble.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except:
        return "You list projects without links. Explain the tech stack of your most complex unlisted project, right now."

def generate_ats_resume(resume_text, code_context):
    """
    Rewrites the ENTIRE resume to be ATS compliant, injecting code evidence.
    """
    prompt = f"""
    You are an ATS (Applicant Tracking System) Optimization Engine.

    INPUT DATA:
    1. OLD RESUME: {resume_text[:2000]}
    2. CODE EVIDENCE: {code_context[:50000]}

    YOUR MISSION:
    Rewrite the candidate's resume completely.
    1. **Structure:** Use standard ATS headers (SUMMARY, EXPERIENCE, PROJECTS, SKILLS, EDUCATION). No columns.
    2. **Evidence Injection:** Replace generic bullet points in the 'Projects' or 'Experience' section with specific technical details found in the CODE EVIDENCE (e.g., specific libraries, architecture patterns).
    3. **Keywords:** Ensure high-value tech keywords from the code (e.g., "Redis", "FastAPI", "AsyncIO") are included in the SKILLS section.
    4. **Tone:** Action-oriented, professional, quantified.

    OUTPUT FORMAT:
    Markdown text. Ready to copy-paste.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating resume: {str(e)}"

# ============ VOICE INTERVIEW FUNCTIONS ============

def get_interview_response(history, message, context):
    """
    Handles the voice interview interaction - more aggressive interrogation style.
    """
    interview_model = genai.GenerativeModel("gemini-2.5-flash")
    chat = interview_model.start_chat(history=history)

    system_prompt = f"""
    You are 'GitReal', an intimidating Technical Interviewer conducting a LIVE VOICE interview.
    You are skeptical and need to verify if this candidate actually wrote their code.

    CONTEXT (Candidate's Resume & Code):
    {context}

    INTERVIEW RULES:
    1. Keep responses SHORT (2-3 sentences max) - this is a voice conversation.
    2. Be DIRECT and slightly intimidating but fair.
    3. Ask follow-up questions based on their answers.
    4. Reference SPECIFIC code files, functions, or patterns you see.
    5. If they dodge or give vague answers, call them out.
    6. If they answer well, acknowledge briefly and dig deeper.
    7. Sound like a real interviewer - use phrases like "Interesting...", "Walk me through...", "Why didn't you..."

    IMPORTANT: Keep it conversational and SHORT for voice output.
    """

    try:
        response = chat.send_message(f"{system_prompt}\n\nCANDIDATE SAYS: {message}")
        return response.text
    except Exception as e:
        return f"System error. Let's continue... {str(e)}"

def generate_speech(text):
    """
    Generate speech audio from text using Gemini TTS model.
    Returns audio bytes with proper WAV headers.
    """
    import wave
    import io
    import struct

    try:
        # Try to use google-genai SDK (newer) for TTS
        from google import genai as genai_new
        from google.genai import types

        client = genai_new.Client(api_key=os.getenv("GEMINI_API_KEY"))

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Kore"  # Deep, authoritative voice
                        )
                    )
                )
            )
        )

        # Extract audio data
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    raw_audio = part.inline_data.data
                    mime_type = part.inline_data.mime_type if hasattr(part.inline_data, 'mime_type') else ''
                    print(f"✅ TTS Audio received: {len(raw_audio)} bytes, mime: {mime_type}")

                    # If it's already a proper format, return as-is
                    if raw_audio[:4] == b'RIFF' or raw_audio[:4] == b'OggS':
                        return raw_audio

                    # Otherwise, wrap raw PCM in WAV header (24kHz, 16-bit, mono - Gemini TTS default)
                    sample_rate = 24000
                    channels = 1
                    bits_per_sample = 16

                    wav_buffer = io.BytesIO()
                    with wave.open(wav_buffer, 'wb') as wav_file:
                        wav_file.setnchannels(channels)
                        wav_file.setsampwidth(bits_per_sample // 8)
                        wav_file.setframerate(sample_rate)
                        wav_file.writeframes(raw_audio)

                    wav_data = wav_buffer.getvalue()
                    print(f"✅ WAV created: {len(wav_data)} bytes")
                    return wav_data

        print("❌ No audio in TTS response")
        return None
    except ImportError as e:
        print(f"❌ google-genai SDK not installed: {e}")
        return None
    except Exception as e:
        print(f"❌ TTS Generation Error: {e}")
        return None


# ============ VOICE INTERVIEW (TEXT CHAT + BROWSER TTS) ============

def init_voice_chat(resume_text, code_context):
    """
    Initializes the Voice Chat Session with the Interviewer Persona.
    Uses text chat - frontend handles TTS.
    """
    global voice_chat_session, live_session_context

    system_instruction = f"""
    You are 'GitReal', an elite Technical Hiring Manager (Morpheus Persona).

    CANDIDATE DATA:
    - RESUME: {resume_text[:2000]}
    - CODE: {code_context[:10000]}

    PROTOCOL:
    1. This is a VOICE INTERVIEW. The user is speaking to you.
    2. Be aggressive but fair. Challenge them on their code.
    3. If they are confident and correct -> Ask a harder technical question about their code.
    4. If they hesitate or give vague answers -> Call them out sharply.
    5. KEEP RESPONSES SHORT (Max 2-3 sentences). Sound natural for speech.
    6. DO NOT use markdown, asterisks, or formatting. Plain text only.
    7. Ask ONE question at a time.
    """

    live_session_context = {
        "resume": resume_text[:2000],
        "code": code_context[:10000]
    }

    try:
        voice_model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction
        )
        voice_chat_session = voice_model.start_chat(history=[])
        print(f"✅ Voice Brain Initialized with {MODEL_NAME}")
        return True
    except Exception as e:
        print(f"❌ Gemini Voice Init Error: {e}")
        return False


def process_voice_text(user_text):
    """
    Process user's transcribed speech and return AI response.
    Frontend handles speech-to-text and text-to-speech.
    """
    global voice_chat_session

    if not voice_chat_session:
        return "Error: Session not initialized. Upload resume first."

    try:
        response = voice_chat_session.send_message(user_text)
        # Clean the response for TTS
        clean_response = response.text.replace('*', '').replace('#', '').replace('`', '')
        return clean_response
    except Exception as e:
        print(f"❌ Voice Chat Error: {e}")
        return f"I didn't catch that. Could you repeat your answer?"


# ============ GEMINI LIVE API (WebSocket Real-time Audio) ============

async def create_live_session(resume_text, code_context):
    """
    Creates a Gemini Live API session for real-time voice interaction.
    Returns the session config for WebSocket connection.
    """
    from google import genai as genai_live
    from google.genai import types

    system_instruction = f"""
    You are 'GitReal', an elite Technical Hiring Manager conducting a voice interview.

    CANDIDATE DATA:
    - RESUME: {resume_text[:1500]}
    - CODE SAMPLE: {code_context[:5000]}

    RULES:
    1. Be aggressive but professional. Challenge them.
    2. Keep responses SHORT (1-2 sentences max).
    3. Ask about SPECIFIC code they wrote.
    4. If they hesitate or lie, call them out.
    5. Sound natural - this is spoken conversation.
    """

    config = {
        "model": LIVE_MODEL,
        "system_instruction": system_instruction,
        "generation_config": {
            "response_modalities": ["AUDIO"],
            "speech_config": {
                "voice_config": {
                    "prebuilt_voice_config": {
                        "voice_name": "Aoede"  # Clear, authoritative voice
                    }
                }
            }
        }
    }

    return config


def get_live_api_config():
    """Returns configuration needed for frontend to connect to Gemini Live API"""
    return {
        "model": LIVE_MODEL,
        "api_key": os.getenv("GEMINI_API_KEY"),
        "input_sample_rate": 16000,  # 16kHz mono PCM input
        "output_sample_rate": 24000,  # 24kHz output
    }