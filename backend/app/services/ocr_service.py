import os
import cv2
import fitz  # PyMuPDF
import numpy as np
from PIL import Image
import pytesseract
import google.generativeai as genai
import requests

def get_gemini_api_key():
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key and key != "your_gemini_api_key_here":
        return key
    return None

def extract_text_with_gemini(image_path):
    """Uses Google Gemini Vision API for high-accuracy OCR (printed & handwriting/signatures)."""
    api_key = get_gemini_api_key()
    if not api_key:
        return None
        
    try:
        genai.configure(api_key=api_key)
        # Try gemini-1.5-flash, fallback to gemini-2.0-flash
        model_name = 'gemini-1.5-flash'
        model = genai.GenerativeModel(model_name)
        img = Image.open(image_path)
        prompt = (
            "Transcribe all text from this image exactly as written. "
            "If the image contains a signature, handwritten name, or cursive notes, "
            "transcribe it accurately. Do not add conversational intro, "
            "simply output the transcription."
        )
        response = model.generate_content([prompt, img])
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"Gemini API Error with gemini-1.5-flash: {e}")
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content([prompt, img])
            if response and response.text:
                return response.text.strip()
        except Exception as e2:
            print(f"Gemini 2.0 Fallback Error: {e2}")
            
    return None

import tempfile

def optimize_for_ocr(img_path, max_dim=1800, quality=88):
    """Ensures image payload is under 700KB for fast, reliable cloud OCR uploads."""
    try:
        size = os.path.getsize(img_path)
        if size < 600 * 1024 and img_path.lower().endswith(('.jpg', '.jpeg')):
            return img_path, False
        img = cv2.imread(img_path)
        if img is None:
            return img_path, False
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        tmp.close()
        cv2.imwrite(tmp.name, img, [cv2.IMWRITE_JPEG_QUALITY, quality])
        return tmp.name, True
    except Exception as e:
        print(f"Optimization error: {e}")
        return img_path, False

def extract_text_with_ocr_space(image_path, engine='2'):
    """Calls OCR.space public cloud API with specified engine (2 = handwriting/signatures, 1 = printed)."""
    opt_path, is_tmp = optimize_for_ocr(image_path)
    try:
        payload = {
            'isOverlayRequired': False,
            'apikey': 'helloworld',
            'language': 'eng',
            'OCREngine': engine,
        }
        with open(opt_path, 'rb') as f:
            r = requests.post(
                'https://api.ocr.space/parse/image',
                files={'file': f},
                data=payload,
                timeout=35
            )
        result = r.json()
        if not result.get('IsErroredOnProcessing'):
            parsed_results = result.get('ParsedResults')
            if parsed_results and len(parsed_results) > 0:
                text = parsed_results[0].get('ParsedText', '')
                if text and text.strip():
                    return text.strip()
    except Exception as e:
        print(f"OCR.space (Engine {engine}) Error: {e}")
    finally:
        if is_tmp and os.path.exists(opt_path):
            try:
                os.remove(opt_path)
            except Exception:
                pass
    return None

def _extract_single(image_path):
    # 1. FIRST PRIORITY: Google Gemini Vision AI (handles both printed text & cursive handwriting/signatures)
    if get_gemini_api_key():
        print("Transcribing with Gemini Multimodal AI Vision...")
        gemini_text = extract_text_with_gemini(image_path)
        if gemini_text:
            return gemini_text

    # 2. SECOND PRIORITY: Public OCR cloud engine (Engine 2 for handwriting/signatures)
    print("Trying OCR.space Engine 2 (Handwriting & signatures)...")
    text_e2 = extract_text_with_ocr_space(image_path, engine='2')
    if text_e2:
        return text_e2

    # 3. THIRD PRIORITY: Public OCR cloud engine (Engine 1 for standard printed text)
    print("Trying OCR.space Engine 1 (Printed text)...")
    text_e1 = extract_text_with_ocr_space(image_path, engine='1')
    if text_e1:
        return text_e1

    # 4. FOURTH PRIORITY: Local Tesseract OCR (if installed on laptop)
    try:
        tess_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tess_path):
            pytesseract.pytesseract.tesseract_cmd = tess_path
            
        img = cv2.imread(image_path)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            temp_path = image_path + "_processed.png"
            cv2.imwrite(temp_path, thresh)
            
            text = pytesseract.image_to_string(temp_path)
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            if text and text.strip():
                return text.strip()
    except Exception as e:
        print(f"Local Tesseract Error: {e}")
        
    return ""

def clean_ocr_text(text):
    if not text:
        return ""
    import re
    cleaned = re.sub(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]', '', text)
    cleaned = re.sub(r'[\u25cf\u2022\u25cb]', '• ', cleaned)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()

def extract_text_from_image(image_path, fallback_path=None):
    text = _extract_single(image_path)
    if text and text.strip():
        return clean_ocr_text(text)
    if fallback_path and os.path.exists(fallback_path) and fallback_path != image_path:
        print(f"Primary OCR returned empty, falling back to original: {fallback_path}")
        fallback_text = _extract_single(fallback_path)
        if fallback_text and fallback_text.strip():
            return clean_ocr_text(fallback_text)
    return ""

def extract_text_from_pdf(pdf_path, max_pages=10):
    text = ""
    try:
        doc = fitz.open(pdf_path)
        page_count = min(len(doc), max_pages)
        for page_num in range(page_count):
            page = doc[page_num]
            page_text = page.get_text()
            
            # If standard digital PDF text is present, use it directly
            if len(page_text.strip()) > 30:
                text += page_text + "\n"
            else:
                # Scanned image PDF page -> render as image and extract
                pix = page.get_pixmap(dpi=150)
                temp_img_path = f"{pdf_path}_page_{page_num}.png"
                pix.save(temp_img_path)
                extracted = extract_text_from_image(temp_img_path)
                if extracted:
                    text += extracted + "\n"
                if os.path.exists(temp_img_path):
                    os.remove(temp_img_path)
    except Exception as e:
        print(f"PDF Processing Error: {e}")
        
    return text.strip()

def process_document(file_path, fallback_path=None):
    ext = file_path.lower().split('.')[-1]
    if ext == 'pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['jpg', 'jpeg', 'png']:
        return extract_text_from_image(file_path, fallback_path=fallback_path)
    else:
        return ""
