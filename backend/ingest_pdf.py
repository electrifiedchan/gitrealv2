from pypdf import PdfReader

def parse_pdf(file_path):
    """
    Reads a PDF file and returns the raw text.
    """
    try:
        reader = PdfReader(file_path)
        text = ""
        
        # Loop through every page and grab the text
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

# --- TEST IT ---
if __name__ == "__main__":
    # To test this, you need a PDF file in the same folder named 'test.pdf'
    # You can skip running this if you don't have a PDF handy right now.
    print("PDF Parser Function Ready.")