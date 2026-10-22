import os
import re
from collections import defaultdict
import google.generativeai as genai

API_KEY = os.getenv("GEMINI_API_KEY")

def generate_ai_summary(text, summary_type="short"):
    if not API_KEY or API_KEY == "your_gemini_api_key_here":
        return None
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        if summary_type == "points":
            prompt = f"Extract the 5 most important high-yield key points from the following academic text. Format as clean bullet points with bold keywords:\n\n{text}"
        elif summary_type == "detailed":
            prompt = f"Provide a detailed, well-structured academic study summary of the following text with sections for Overview, Key Concepts, and Practical Takeaways:\n\n{text}"
        elif summary_type == "quiz":
            prompt = f"Generate 3-4 study questions with clear answers and explanations based on the following text to help a student study. Format each as:\nQ: [Question]\nA: [Answer]\n\n{text}"
        else:
            prompt = f"Provide a concise, high-impact one-paragraph executive summary of the following text:\n\n{text}"
            
        response = model.generate_content(prompt)
        return f"[AI Generated]\n\n{response.text.strip()}"
    except Exception as e:
        print(f"Gemini API Summary Error: {e}")
        return None

def generate_extractive_summary(text, sentence_count=3):
    if not text or len(text.strip()) == 0:
        return ""
        
    sentences = re.split(r'(?<=[.!?]) +', text)
    if len(sentences) <= sentence_count:
        return text
        
    words = re.findall(r'\w+', text.lower())
    word_freq = defaultdict(int)
    for word in words:
        if len(word) > 3:
            word_freq[word] += 1
            
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        score = 0
        sentence_words = re.findall(r'\w+', sentence.lower())
        for word in sentence_words:
            if word in word_freq:
                score += word_freq[word]
        if len(sentence_words) > 0:
            sentence_scores[i] = score / len(sentence_words)
            
    top_indices = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:sentence_count]
    top_indices.sort()
    
    summary = " ".join([sentences[i] for i in top_indices])
    return f"[Extractive Summary Fallback]\n\n{summary}"

def get_key_points(text, points_count=5):
    sentences = re.split(r'(?<=[.!?]) +', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    selected = sentences[:points_count]
    points = "\n".join([f"• {s}" for s in selected])
    return f"[Extracted Key Points Fallback]\n\n{points}"

def get_quiz_fallback(text):
    sentences = re.split(r'(?<=[.!?]) +', text)
    valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    if not valid_sentences:
        return "[Study Questions]\n\nQ: What is the main subject discussed in this document?\nA: Review the key concepts identified in the extracted text."
    
    items = []
    for i, s in enumerate(valid_sentences[:3], 1):
        items.append(f"Q{i}: What important fact is stated regarding the following statement?\n\"{s[:90]}...\"\nA{i}: {s}")
    return "[Extractive Study Questions Fallback]\n\n" + "\n\n".join(items)

def get_summary(text, summary_type="short"):
    # Try AI generation first
    ai_summary = generate_ai_summary(text, summary_type)
    if ai_summary:
        return ai_summary
        
    # Fallback to local algorithms
    if summary_type == 'points':
        return get_key_points(text)
    elif summary_type == 'detailed':
        return generate_extractive_summary(text, sentence_count=7)
    elif summary_type == 'quiz':
        return get_quiz_fallback(text)
    else:
        return generate_extractive_summary(text, sentence_count=3)
