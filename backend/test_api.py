import requests

# URL of your local server
URL = "http://127.0.0.1:8000/analyze"

# Config - Use the Google repo as a test
GITHUB_LINK = "https://github.com/google/generative-ai-python"
PDF_PATH = "test.pdf"

def run_simulation():
    print(f"🚀 Starting Simulation on D: Drive...")
    
    try:
        # Open PDF
        with open(PDF_PATH, "rb") as f:
            files = {"file": f}
            data = {"github_url": GITHUB_LINK}
            
            print("⏳ Sending request...")
            response = requests.post(URL, files=files, data=data)

        # Print Result
        if response.status_code == 200:
            print("\n✅ SUCCESS! JSON Received:")
            print(response.json())
        else:
            print(f"\n❌ FAILED. Status: {response.status_code}")
            print(response.text)

    except FileNotFoundError:
        print(f"❌ Error: 'test.pdf' is missing. Copy a PDF into D:\\GitReal\\backend")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_simulation()
    