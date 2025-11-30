# GitReal - AI-Powered Resume Verification System

<div align="center">

**"Welcome to the Real World"**

A Matrix-themed application that analyzes your resume against your actual GitHub code to expose false claims and provide brutal honesty.

</div>

---

## 🎯 Overview

GitReal is an AI-powered resume verification tool that cross-references your resume claims with your actual GitHub repositories. It provides:

- **Brutal Resume Analysis** - AI-powered critique of your resume vs. actual code
- **Defense Mode** - Technical interview questions based on your code weaknesses
- **ATS Resume Compiler** - Generate ATS-optimized resumes with code evidence

## ✨ Features

### 🔴 Red Pill - "Roast Me" Mode
- Upload your resume (PDF)
- Automatic GitHub repository detection
- AI analysis comparing resume claims vs. actual code
- Three-part verdict:
  - **Real World Critique** - Architectural and code quality issues
  - **False Claims** - Discrepancies between resume and code
  - **Resume Additions** - Skills and achievements you should add

### 🔵 Blue Pill - "Defense Mode"
- Technical interview simulation
- Questions generated from your code weaknesses
- Interactive chat-based interrogation
- Tests your actual understanding of your own code

### 📄 ATS Resume Compiler
- Generates ATS-optimized resume
- Injects code evidence into bullet points
- Adds relevant technical keywords
- Professional, action-oriented tone

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python web framework
- **Google Gemini 2.0 Flash** - AI model
- **PyPDF** - PDF parsing
- **GitHub API** - Repository analysis
- **Python 3.11+**

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Google Gemini API key
- GitHub Personal Access Token (optional, for private repos)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GITHUB_TOKEN=your_github_token_here  # Optional
   ```

5. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```
   Server runs on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:3000`

## 🎮 Usage

### Step 1: Upload Resume
- Upload your resume (PDF format)
- System automatically extracts GitHub URL from resume
- If not found, you can manually add repositories

### Step 2: Choose Your Reality

**🔴 Red Pill - "Roast Me"**
- Get brutal honest feedback
- See verdict with code evidence
- Chat with AI about improvements
- Compile ATS-optimized resume

**🔵 Blue Pill - "Defense Mode"**
- Face technical interview questions
- Questions based on your code weaknesses
- Prove you actually wrote the code
- Interactive interrogation

### Step 3: Take Action
- Review the analysis
- Add missing skills to resume
- Fix false claims
- Generate new ATS resume
- Prepare for real interviews

## 🏗️ Project Structure

```
gitreal/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── brain.py             # AI logic (Gemini)
│   ├── ingest_github.py     # GitHub scraper
│   ├── ingest_pdf.py        # PDF parser
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
│
└── frontend/
    ├── app/
    │   ├── page.tsx         # Main application
    │   ├── layout.tsx       # Root layout
    │   └── globals.css      # Global styles
    ├── public/
    │   └── morpheus.png     # Matrix theme assets
    ├── package.json         # Node dependencies
    └── next.config.js       # Next.js config
```

## 🔌 API Endpoints

### `POST /analyze`
Analyzes resume against GitHub code
- **Input:** Resume PDF, GitHub URL (optional)
- **Output:** Analysis JSON with critique, false claims, suggestions

### `POST /chat`
Interactive chat with AI
- **Input:** Message, conversation history
- **Output:** AI response

### `POST /interview_start`
Generates interview question
- **Input:** None (uses cached analysis)
- **Output:** Technical interview question

### `POST /generate_resume`
Compiles ATS-optimized resume
- **Input:** None (uses cached data)
- **Output:** Markdown-formatted resume

### `POST /add_repo`
Adds additional repository to analysis
- **Input:** GitHub URL
- **Output:** STAR method bullet points

## 🎨 Design Features

- **Matrix Theme** - Green terminal aesthetic
- **CRT Effects** - Scanlines and flicker
- **Glitch Animations** - Text effects on Morpheus screen
- **Loading Animations** - Matrix rain during processing
- **Responsive Design** - Works on desktop and mobile

## 🔐 Security Notes

- Never commit `.env` files
- Keep API keys secure
- GitHub tokens should have minimal permissions
- Resume data is not persisted (in-memory only)

## 🐛 Troubleshooting

**Backend won't start:**
- Check Python version (3.11+)
- Verify virtual environment is activated
- Ensure all dependencies are installed
- Check `.env` file exists with valid API key

**Frontend won't start:**
- Check Node.js version (18+)
- Run `npm install` again
- Clear `.next` folder and rebuild
- Check port 3000 is not in use

**Analysis fails:**
- Verify GitHub URL is public or token is valid
- Check resume PDF is not corrupted
- Ensure Gemini API key is valid and has quota

## 📝 Environment Variables

### Backend `.env`
```env
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token  # Optional
```

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - Feel free to use and modify

## 🙏 Acknowledgments

- Inspired by The Matrix
- Powered by Google Gemini AI
- Built with Next.js and FastAPI

---

<div align="center">

**"Remember, all I'm offering is the truth. Nothing more."**

Made with 💚 and brutal honesty

</div>
