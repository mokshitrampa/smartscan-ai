import os
import uuid
import time
from gtts import gTTS
from werkzeug.utils import secure_filename

# Supported TTS languages for gTTS
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'hi': 'Hindi',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh-CN': 'Chinese (Simplified)'
}

def clean_old_audio_files(audio_folder, max_age_seconds=3600):
    """Clean up audio files older than max_age_seconds to prevent disk bloat."""
    try:
        now = time.time()
        for filename in os.listdir(audio_folder):
            if filename.endswith('.mp3'):
                filepath = os.path.join(audio_folder, filename)
                if os.path.isfile(filepath):
                    if now - os.path.getmtime(filepath) > max_age_seconds:
                        try:
                            os.remove(filepath)
                        except Exception:
                            pass
    except Exception as e:
        print(f"Audio cleanup error: {e}")

def generate_mp3_audio(text, audio_folder, lang='en', slow=False):
    """
    Generate a valid MP3 file from text using gTTS.
    Handles long text automatically through gTTS internal chunking.
    Returns (filename, filepath).
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty for audio generation.")

    clean_text = text.strip()
    
    # Sanitize language; default to 'en' if unsupported
    if lang not in SUPPORTED_LANGUAGES:
        lang = 'en'

    # Ensure output folder exists
    os.makedirs(audio_folder, exist_ok=True)
    
    # Run periodic cleanup
    clean_old_audio_files(audio_folder)

    # Generate unique isolated filename
    unique_id = uuid.uuid4().hex[:12]
    timestamp = int(time.time())
    filename = f"tts_{timestamp}_{unique_id}.mp3"
    filepath = os.path.join(audio_folder, filename)

    try:
        # gTTS splits on punctuation/spaces to stream chunks safely
        tts = gTTS(text=clean_text, lang=lang, slow=slow)
        tts.save(filepath)
        return filename, filepath
    except Exception as e:
        print(f"gTTS Generation Error: {e}")
        # Clean up partially written file if present
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass
        raise RuntimeError(f"Text-to-speech generation failed: {str(e)}")
