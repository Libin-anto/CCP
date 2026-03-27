import easyocr
import io
from pypdf import PdfReader
from PIL import Image
import numpy as np

class ContentExtractor:
    def __init__(self):
        # Initialize EasyOCR reader (loads model into memory)
        # Using CPU for compatibility
        self.reader = easyocr.Reader(['en'], gpu=False)

    def extract_text(self, file_path: str, mime_type: str) -> str:
        extracted_text = ""
        
        try:
            if "pdf" in mime_type:
                # 1. Try native PDF text extraction first (faster)
                reader = PdfReader(file_path)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"
                
                # 2. If text is empty (scanned PDF), use OCR (simplified check)
                if len(extracted_text.strip()) < 50: 
                    # TODO: Convert PDF pages to images for OCR (Requires pdf2image/poppler)
                    # For prototype: Just return placeholder or warning
                    extracted_text = "[SCANNED PDF - OCR PENDING INTEGRATION] " 
            
            elif "image" in mime_type:
                # OCR for images
                result = self.reader.readtext(file_path, detail=0)
                extracted_text = " ".join(result)
                
            elif "text" in mime_type:
                with open(file_path, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
                    
            return extracted_text
        except Exception as e:
            print(f"Error extracting content: {e}")
            return ""

content_extractor = ContentExtractor()
