import os
import time
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- CONFIGURATION ---
MODEL_NAME = "gemini-2.5-flash"
LIVE_MODEL = "gemini-2.5-flash-preview-native-audio-dialog"  # For Live API

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Use Gemini 2.5 Flash
model = genai.GenerativeModel(MODEL_NAME, generation_config=generation_config)
chat_model = genai.GenerativeModel(MODEL_NAME)

# Global voice chat session
voice_chat_session = None
live_session_context = None  # Store context for Live API

def extract_projects_from_resume(resume_text):
    """
    Uses Gemini to extract project names and GitHub URLs from resume text.
    Returns list of projects with name, description, and github_url.
    """
    json_model = genai.GenerativeModel("gemini-2.5-flash", generation_config={"response_mime_type": "application/json"})

    prompt = f"""
    You are a resume parser. Extract ALL projects mentioned in this resume.

    RESUME TEXT:
    {resume_text}

    For each project, extract:
    1. Project name
    2. Brief description (1 line)
    3. GitHub URL if mentioned (look for github.com links)
    4. Technologies used

    OUTPUT JSON (array of projects):
    {{
        "projects": [
            {{
                "name": "Project Name",
                "description": "Brief 1-line description",
                "github_url": "https://github.com/user/repo or null if not found",
                "technologies": ["Python", "React", "etc"]
            }}
        ]
    }}

    IMPORTANT:
    - Extract ALL projects, even if no GitHub URL
    - Look for patterns like: github.com/username/repo, GitHub: url, etc.
    - If you find a GitHub profile (github.com/username), list it separately
    - Be thorough - check education projects, work projects, personal projects
    """

    try:
        response = json_model.generate_content(prompt)
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


def analyze_resume_vs_code(resume_text, code_context):
    """
    Returns strict JSON analysis + STAR Bullets.
    """
    # We want JSON for the dashboard cards
    json_model = genai.GenerativeModel("gemini-2.5-flash", generation_config={"response_mime_type": "application/json"})
    
    prompt = f"""
    You are 'GitReal', a ruthless Senior Engineer.
    
    TASK: Analyze the Candidate's Resume against their Code.
    RESUME: {resume_text[:2000]}
    CODE: {code_context[:50000]}

    OUTPUT JSON (Strictly these 3 keys):
    {{
        "project_critique": [
            "Criticize the project compared to real-world/FAANG standards.",
            "E.g. 'Code is monolithic, lacks microservices pattern.'",
            "E.g. 'No unit tests found, risky for production.'"
        ],
        "false_claims": [
            "Check Resume vs Repo for lies/exaggerations.",
            "E.g. 'Resume says Expert in AWS, but no AWS config found.'",
            "E.g. 'Claims CI/CD pipeline, but no .github/workflows.'"
        ],
        "resume_suggestions": [
            "What SPECIFIC things should be added to the resume based on this code?",
            "E.g. 'Add 'Multithreading' - found complex threading in main.c'",
            "E.g. 'Highlight 'Optimization' - found custom memory allocator.'"
        ]
    }}
    """
    try:
        response = json_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return json.dumps({
            "project_critique": ["Error analyzing project."],
            "false_claims": ["Could not verify claims."],
            "resume_suggestions": ["System Error."]
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
    Generates a tough technical question based on the code's weak points.
    """
    prompt = f"""
    You are 'GitReal', a skeptcial Technical Interviewer.
    You have analyzed this candidate's code and found some issues.
    
    ANALYSIS SUMMARY:
    {analysis_json}
    
    RAW CODE SEGMENT:
    {code_context[:20000]}

    YOUR TASK:
    Generate ONE hard, specific technical interview question to test if the candidate actually wrote this code or understands it.
    - Pick a specific file or function from the code.
    - Ask why they chose that specific implementation over a better alternative.
    - Be direct and intimidating.
    
    OUTPUT:
    Just the question. No greetings.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except:
        return "Explain the architecture of your main API handler. Why is it structured this way?"

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