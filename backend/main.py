import os
import shutil
import re
import base64
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# Deepgram for Voice
from deepgram import DeepgramClient

import ingest_github
import ingest_pdf
import brain

load_dotenv()

app = FastAPI()

# Initialize Deepgram
try:
    dg_key = os.getenv("DEEPGRAM_API_KEY")
    if dg_key and dg_key != "YOUR_DEEPGRAM_KEY_HERE":
        deepgram = DeepgramClient(api_key=dg_key)
        print("✅ Deepgram Voice System Online")
    else:
        deepgram = None
        print("⚠️ Deepgram not configured: No API key")
except Exception as e:
    deepgram = None
    print(f"⚠️ Deepgram not configured: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = {}
REPO_CACHE = {}

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

class RepoRequest(BaseModel):
    github_url: str

def extract_github_details(url):
    """
    Extracts owner, repo, AND branch from URL.
    """
    if not url:
        return None, None, None
        
    # Clean up
    clean = url.replace("https://", "").replace("http://", "").replace("github.com/", "")
    parts = clean.split("/")
    
    if len(parts) < 2:
        return None, None, None
        
    owner = parts[0]
    repo = parts[1]
    branch = None
    
    # Check for /tree/BRANCH_NAME
    if "tree" in parts:
        try:
            tree_index = parts.index("tree")
            if len(parts) > tree_index + 1:
                branch = parts[tree_index + 1]
        except:
            pass
            
    return owner, repo, branch

@app.get("/")
def health_check():
    return {"status": "GitReal System Online", "mode": "Matrix", "voice": "Deepgram" if deepgram else "Browser"}

# ============ DEEPGRAM VOICE ENDPOINTS ============

@app.post("/listen")
async def listen_to_audio(file: UploadFile = File(...)):
    """
    Deepgram Speech-to-Text - Transcribes user voice to text
    """
    if not deepgram:
        return {"text": "", "error": "Deepgram not configured"}

    try:
        buffer_data = await file.read()
        # Use httpx to call Deepgram STT API directly (most reliable)
        import httpx
        url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
        headers = {
            "Authorization": f"Token {os.getenv('DEEPGRAM_API_KEY')}",
            "Content-Type": "audio/webm"
        }
        response = httpx.post(url, headers=headers, content=buffer_data, timeout=30.0)

        if response.status_code == 200:
            result = response.json()
            transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]
            print(f"🎤 Transcribed: {transcript[:50] if transcript else 'empty'}...")
            return {"text": transcript}
        else:
            print(f"❌ Deepgram API Error: {response.status_code} - {response.text}")
            return {"text": "", "error": f"Deepgram API error: {response.status_code}"}
    except Exception as e:
        print(f"❌ Deepgram Listen Error: {e}")
        return {"text": "", "error": str(e)}

@app.post("/speak")
async def text_to_speech(text: str = Form(...)):
    """
    Deepgram Text-to-Speech - Converts AI response to audio
    """
    if not deepgram:
        return {"error": "Deepgram not configured"}

    try:
        # Use httpx to call Deepgram TTS API directly (most reliable)
        import httpx
        url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en"
        headers = {
            "Authorization": f"Token {os.getenv('DEEPGRAM_API_KEY')}",
            "Content-Type": "application/json"
        }
        response = httpx.post(url, headers=headers, json={"text": text}, timeout=30.0)

        if response.status_code == 200:
            audio_data = response.content
            print(f"🔊 TTS generated: {len(audio_data)} bytes")
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type="audio/mp3",
                headers={"Content-Disposition": "inline; filename=speech.mp3"}
            )
        else:
            print(f"❌ Deepgram API Error: {response.status_code} - {response.text}")
            return {"error": f"Deepgram API error: {response.status_code}"}
    except Exception as e:
        print(f"❌ Deepgram Speak Error: {e}")
        return {"error": str(e)}

# ============ CORE ENDPOINTS ============

@app.post("/extract_projects")
async def extract_projects(file: UploadFile = File(...)):
    """
    Step 1: Upload resume, extract project names and GitHub URLs using Gemini OCR
    Returns list of projects for user to choose from
    """
    print(f"📥 Extracting projects from resume...")
    temp_filename = f"temp_{file.filename}"

    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = ingest_pdf.parse_pdf(temp_filename)

        # Use Gemini to extract projects
        projects = brain.extract_projects_from_resume(resume_text)

        # Store resume for later use
        DB['pending_resume'] = resume_text

        return {
            "status": "success",
            "projects": projects,
            "resume_preview": resume_text[:500] + "..."
        }
    except Exception as e:
        print(f"❌ Error extracting projects: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@app.post("/analyze")
async def analyze_portfolio(
    file: UploadFile = File(...),
    github_url: Optional[str] = Form(None)
):
    print(f"📥 Received Analysis Request.")
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        resume_text = ingest_pdf.parse_pdf(temp_filename)
        
        target_url = github_url
        if not target_url or target_url == "null":
            # Attempt to find in resume
            # Look for github.com/username/repo
            match = re.search(r"github\.com/([a-zA-Z0-9-_]+)/([a-zA-Z0-9-_]+)", resume_text)
            if match:
                target_url = f"https://{match.group(0)}"
                print(f"   🕵️‍♀️ Found GitHub URL in Resume: {target_url}")
            else:
                target_url = None

        code_context = ""
        if target_url:
            owner, repo, branch = extract_github_details(target_url)
            if owner and repo:
                cache_key = f"{owner}/{repo}/{branch}"
                if cache_key in REPO_CACHE:
                    print(f"   ⚡ Cache Hit: {cache_key}")
                    code_context = REPO_CACHE[cache_key]
                else:
                    print(f"   💻 Target: {owner}/{repo} (Branch: {branch or 'Auto'})")
                    code_context = ingest_github.fetch_repo_content(owner, repo, branch)
                    # Cache if valid
                    if code_context and len(code_context) > 100:
                        REPO_CACHE[cache_key] = code_context
            else:
                code_context = "Error: Invalid URL extracted."
        else:
            code_context = "No GitHub URL found in resume or provided."

        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        analysis_json = brain.analyze_resume_vs_code(resume_text, code_context)
        
        # Parse JSON to construct chat message
        import json
        try:
            data = json.loads(analysis_json)
            critique = "\n".join([f"- {x}" for x in data.get("project_critique", [])])
            claims = "\n".join([f"- {x}" for x in data.get("false_claims", [])])
            suggestions = "\n".join([f"- {x}" for x in data.get("resume_suggestions", [])])
            
            chat_msg = f"""**REAL WORLD CRITIQUE:**
{critique}

**FALSE CLAIMS / VERIFICATION:**
{claims}

**RESUME ADDITIONS:**
{suggestions}"""
        except:
            chat_msg = "Analysis Complete. Check Dashboard for details."

        DB['current_user'] = {
            "resume": resume_text,
            "code": code_context[:50000],
            "analysis": analysis_json
        }

        return {
            "status": "success",
            "data": analysis_json,
            "initial_chat": chat_msg
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/add_repo")
async def add_repo_context(request: RepoRequest):
    print(f"📥 Adding Repo: {request.github_url}")
    try:
        owner, repo, branch = extract_github_details(request.github_url)
        
        if not owner or not repo:
             raise HTTPException(status_code=400, detail="Invalid GitHub URL")
        
        cache_key = f"{owner}/{repo}/{branch}"
        if cache_key in REPO_CACHE:
            print(f"   ⚡ Cache Hit: {cache_key}")
            code_context = REPO_CACHE[cache_key]
        else:
            print(f"   💻 Fetching: {owner}/{repo} (Branch: {branch or 'Default'})")
            # Pass the extracted branch to the scraper
            code_context = ingest_github.fetch_repo_content(owner, repo, branch)
            if code_context and len(code_context) >= 100:
                REPO_CACHE[cache_key] = code_context

        if not code_context or len(code_context) < 100:
            return {"status": "error", "bullets": "⚠️ ACCESS DENIED: Repo is empty, Private, or Branch not found."}

        bullets = brain.generate_star_bullets(code_context)

        if 'current_user' in DB:
            DB['current_user']['code'] += f"\n\n--- NEW REPO: {repo} ---\n{code_context[:20000]}"

        return {"status": "success", "bullets": bullets}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/interview_start")
async def start_interview():
    user_data = DB.get('current_user')
    if not user_data:
        return {"status": "error", "message": "No data found."}
    
    # Generate the "Opening Shot"
    question = brain.generate_interview_challenge(user_data['code'], user_data['analysis'])
    
    return {"status": "success", "question": question}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_data = DB.get('current_user')
    if not user_data:
        return {"response": "⚠️ SYSTEM ERROR: No data found."}

    context_summary = f"""
    --- RESUME ---
    {user_data['resume'][:1000]}...
    --- CODE EVIDENCE ---
    {user_data['code']}
    """

    gemini_history = [] 
    for msg in request.history:
        role = "user" if msg['type'] == 'user' else "model"
        gemini_history.append({"role": role, "parts": [msg['text']]})

    response_text = brain.get_chat_response(gemini_history, request.message, context_summary)
    
    return {"response": response_text}

@app.post("/generate_resume")
async def generate_resume_endpoint():
    user_data = DB.get('current_user')
    if not user_data:
        return {"response": "⚠️ ERROR: No data found."}

    # Call the new brain function
    new_resume = brain.generate_ats_resume(user_data['resume'], user_data['code'])

    return {"status": "success", "resume": new_resume}

# ============ VOICE INTERVIEW ENDPOINTS ============

class VoiceInterviewRequest(BaseModel):
    message: str
    history: List[dict] = []

@app.post("/voice_interview")
async def voice_interview_endpoint(request: VoiceInterviewRequest):
    """
    Voice interview endpoint - receives text (from browser STT),
    returns text response + audio (TTS from Gemini)
    """
    user_data = DB.get('current_user')
    if not user_data:
        return {"status": "error", "message": "No data found."}

    context_summary = f"""
    --- RESUME ---
    {user_data['resume'][:1000]}...
    --- CODE EVIDENCE ---
    {user_data['code'][:30000]}
    --- ANALYSIS ---
    {user_data['analysis'][:5000]}
    """

    # Get interview response from Gemini
    response_text = brain.get_interview_response(
        request.history,
        request.message,
        context_summary
    )

    # Generate audio using Gemini TTS
    audio_base64 = None
    try:
        audio_data = brain.generate_speech(response_text)
        if audio_data:
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    except Exception as e:
        print(f"TTS Error: {e}")

    return {
        "status": "success",
        "response": response_text,
        "audio": audio_base64
    }

@app.post("/interview_start_voice")
async def start_voice_interview():
    """Start voice interview - returns opening question with audio"""
    user_data = DB.get('current_user')
    if not user_data:
        return {"status": "error", "message": "No data found."}

    # Initialize voice chat session
    brain.init_voice_chat(user_data['resume'], user_data['code'])

    # Generate the opening question
    question = brain.generate_interview_challenge(user_data['code'], user_data['analysis'])

    # Generate audio for the question
    audio_base64 = None
    try:
        audio_data = brain.generate_speech(question)
        if audio_data:
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    except Exception as e:
        print(f"TTS Error: {e}")

    return {
        "status": "success",
        "question": question,
        "audio": audio_base64
    }


class VoiceTextRequest(BaseModel):
    text: str

@app.post("/voice_chat")
async def voice_chat_endpoint(request: VoiceTextRequest):
    """
    Text-based voice chat - receives transcribed text, returns AI response.
    Frontend handles speech-to-text (browser) and text-to-speech (browser).
    This is the SIMPLE & RELIABLE approach for hackathon demo.
    """
    user_data = DB.get('current_user')
    if not user_data:
        return {"status": "error", "response": "No data found. Upload resume first."}

    try:
        print(f"🎤 Received voice text: {request.text[:50]}...")

        # Get AI response
        response_text = brain.process_voice_text(request.text)
        print(f"🤖 AI Response: {response_text[:50]}...")

        return {
            "status": "success",
            "response": response_text
        }

    except Exception as e:
        print(f"❌ Voice Chat Error: {e}")
        return {"status": "error", "response": f"Error: {str(e)}"}