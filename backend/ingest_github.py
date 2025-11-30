import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

LOGIC_EXTENSIONS = {
    '.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', 
    '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.sql', '.ipynb',
    '.json', '.md' # Added JSON/MD for context
}

IGNORED_DIRS = {
    'node_modules', 'venv', 'env', 'dist', 'build', 'target', 
    '__pycache__', '.git', '.idea', '.vscode', 'bin', 'obj', 
    'public', 'assets', 'images', 'test', 'tests'
}

def fetch_repo_content(owner: str, repo: str, branch: str = None):
    """
    Connects to GitHub. If branch is None, it finds the default branch automatically.
    """
    if not GITHUB_TOKEN:
        return "❌ Error: GITHUB_TOKEN is missing in .env"

    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }

    # 1. If no branch provided, find the default branch (usually main or master)
    if not branch:
        print(f"   🕵️‍♀️ Detecting default branch for {owner}/{repo}...")
        repo_info_url = f"https://api.github.com/repos/{owner}/{repo}"
        resp = requests.get(repo_info_url, headers=headers)
        if resp.status_code == 200:
            branch = resp.json().get("default_branch", "main")
            print(f"   ✅ Default branch is: {branch}")
        else:
            branch = "main" # Fallback

    print(f"   🔍 Scanning Branch: {branch}...")
    
    # 2. Get the File Tree (Recursive)
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return f"❌ Error: Could not access repo/branch (Status: {response.status_code}). Check if private or wrong branch."

    tree_data = response.json().get('tree', [])
    collected_code = []
    file_count = 0
    
    # 3. Filter and Download
    for file in tree_data:
        path = file['path']
        
        if any(ignored in path.split('/') for ignored in IGNORED_DIRS):
            continue
            
        if not any(path.endswith(ext) for ext in LOGIC_EXTENSIONS):
            continue

        if file.get('size', 0) > 150000: # Skip massive files
            continue

        # Fetch content
        blob_url = file['url']
        blob_resp = requests.get(blob_url, headers=headers)
        
        if blob_resp.status_code == 200:
            content_data = blob_resp.json()
            encoded_content = content_data.get('content', '')
            
            if encoded_content:
                try:
                    decoded_content = base64.b64decode(encoded_content).decode('utf-8')
                    collected_code.append(f"\n\n--- FILE: {path} ---\n{decoded_content}")
                    file_count += 1
                except:
                    pass

    result = "\n".join(collected_code)
    
    if len(result) == 0:
        return "⚠️ Warning: Repo accessed, but no logic files found (check file extensions)."
        
    print(f"   ✅ Extracted {file_count} files from {branch}.")
    return result