from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from .models import db, Document, UsabilityFeedback
from .services.ocr_service import process_document
from .services.summary_service import generate_extractive_summary, get_key_points
import os
from datetime import datetime

api_bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    docs = Document.query.all()
    total_docs = len(docs)
    total_pages = sum(d.page_count for d in docs)
    total_words = sum(d.word_count for d in docs if d.word_count)
    return jsonify({
        'total_documents': total_docs,
        'total_pages': total_pages,
        'total_words': total_words
    })

@api_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        save_name = f"{timestamp}_{filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], save_name)
        file.save(file_path)
        
        # Deblur & clarify pixels for images before OCR
        file_ext = filename.rsplit('.', 1)[1].lower()
        enhanced_save_name = None
        target_ocr_path = file_path
        
        if file_ext in ['jpg', 'jpeg', 'png']:
            from .services.image_enhancement_service import enhance_and_deblur_image
            enhanced_save_name = f"{save_name}_cleared.jpg"
            enhanced_file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], enhanced_save_name)
            try:
                enhance_and_deblur_image(file_path, enhanced_file_path)
                target_ocr_path = enhanced_file_path
            except Exception as enh_err:
                print(f"Image enhancement error: {enh_err}")
                target_ocr_path = file_path
                enhanced_save_name = None

        # Process OCR using the deblurred, clarified image (with original as fallback)
        extracted_text = process_document(target_ocr_path, fallback_path=file_path)
        word_count = len(extracted_text.split())
        
        # Save to DB
        new_doc = Document(
            filename=filename,
            file_type=file_ext,
            original_ocr_text=extracted_text,
            edited_text=extracted_text,
            word_count=word_count,
            file_reference=save_name,
            enhanced_file_reference=enhanced_save_name
        )
        db.session.add(new_doc)
        db.session.commit()
        
        return jsonify(new_doc.to_dict()), 201
        
    return jsonify({'error': 'Invalid file format'}), 400

@api_bp.route('/documents', methods=['GET'])
def get_documents():
    docs = Document.query.order_by(Document.upload_timestamp.desc()).all()
    return jsonify([d.to_dict() for d in docs])

@api_bp.route('/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    return jsonify(doc.to_dict())

@api_bp.route('/documents/<int:doc_id>', methods=['PUT'])
def update_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    data = request.json
    
    if 'edited_text' in data:
        doc.edited_text = data['edited_text']
        doc.word_count = len(doc.edited_text.split()) if doc.edited_text else 0
    if 'filename' in data:
        doc.filename = data['filename']
        
    db.session.commit()
    return jsonify(doc.to_dict())

@api_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    
    # Remove files
    if doc.file_reference:
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], doc.file_reference)
        if os.path.exists(file_path):
            os.remove(file_path)
    if doc.enhanced_file_reference:
        enh_path = os.path.join(current_app.config['UPLOAD_FOLDER'], doc.enhanced_file_reference)
        if os.path.exists(enh_path):
            os.remove(enh_path)
            
    db.session.delete(doc)
    db.session.commit()
    return jsonify({'message': 'Document deleted'})

@api_bp.route('/enhance-preview', methods=['POST'])
def enhance_preview():
    """Immediately deblur & clarify pixels of an uploaded image for live preview comparison."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file format'}), 400
    
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    temp_name = f"preview_{timestamp}_{filename}"
    temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_name)
    file.save(temp_path)
    
    from .services.image_enhancement_service import enhance_and_deblur_image
    cleared_name = f"cleared_{timestamp}_{filename}.jpg"
    cleared_path = os.path.join(current_app.config['UPLOAD_FOLDER'], cleared_name)
    
    _, init_blur, final_blur = enhance_and_deblur_image(temp_path, cleared_path)
    
    return jsonify({
        'original_filename': temp_name,
        'cleared_filename': cleared_name,
        'original_url': f"/api/files/{temp_name}",
        'cleared_url': f"/api/files/{cleared_name}",
        'initial_blur': init_blur,
        'cleared_blur': final_blur
    })

@api_bp.route('/documents/<int:doc_id>/summary', methods=['POST'])
def generate_summary(doc_id):
    doc = Document.query.get_or_404(doc_id)
    data = request.json
    summary_type = data.get('type', 'short') # short, detailed, points
    
    text_to_summarize = doc.edited_text or doc.original_ocr_text
    
    # Use the unified get_summary method from summary_service
    from .services.summary_service import get_summary
    result = get_summary(text_to_summarize, summary_type)
        
    doc.summary = result
    db.session.commit()
    
    return jsonify({'summary': result})

@api_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    feedback = UsabilityFeedback(
        task_performed=data.get('task_performed'),
        task_completion_status=data.get('task_completion_status'),
        ease_of_use_rating=data.get('ease_of_use_rating'),
        comments=data.get('comments'),
        suggestions=data.get('suggestions'),
        sus_score=data.get('sus_score')
    )
    db.session.add(feedback)
    db.session.commit()
    return jsonify(feedback.to_dict()), 201

@api_bp.route('/feedback', methods=['GET'])
def get_feedback():
    feedbacks = UsabilityFeedback.query.all()
    return jsonify([f.to_dict() for f in feedbacks])

@api_bp.route('/tts/languages', methods=['GET'])
def get_tts_languages():
    from .services.tts_service import SUPPORTED_LANGUAGES
    return jsonify(SUPPORTED_LANGUAGES)

@api_bp.route('/generate-audio', methods=['POST'])
def generate_audio():
    data = request.json or {}
    text = data.get('text', '').strip()
    lang = data.get('lang', 'en')
    speed = float(data.get('speed', 1.0))
    slow = speed < 0.85
    
    if not text:
        return jsonify({'error': 'No text provided for audio generation.'}), 400

    from .services.tts_service import generate_mp3_audio
    try:
        audio_folder = current_app.config['AUDIO_FOLDER']
        filename, filepath = generate_mp3_audio(text, audio_folder, lang=lang, slow=slow)
        
        # Build clean URLs
        audio_url = f"/api/audio/{filename}"
        download_url = f"/api/audio/{filename}?download=true"
        
        return jsonify({
            'status': 'success',
            'filename': filename,
            'audio_url': audio_url,
            'download_url': download_url,
            'size_bytes': os.path.getsize(filepath)
        }), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': f"Failed to generate audio: {str(e)}"}), 500

@api_bp.route('/audio/<filename>', methods=['GET'])
def get_audio_file(filename):
    safe_name = secure_filename(filename)
    audio_folder = current_app.config['AUDIO_FOLDER']
    file_path = os.path.join(audio_folder, safe_name)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'Audio file not found or expired.'}), 404
        
    as_download = request.args.get('download', 'false').lower() == 'true'
    custom_title = request.args.get('title', 'smartscan_audio')
    safe_download_name = f"{secure_filename(custom_title) or 'smartscan_audio'}.mp3"
    
    return send_from_directory(
        audio_folder,
        safe_name,
        as_attachment=as_download,
        download_name=safe_download_name if as_download else None,
        mimetype='audio/mpeg'
    )

@api_bp.route('/files/<filename>', methods=['GET'])
def get_uploaded_file(filename):
    """Serve uploaded documents (images, PDFs) for preview."""
    safe_name = secure_filename(filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, safe_name)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    return send_from_directory(upload_folder, safe_name)

@api_bp.route('/documents/<int:doc_id>/export/pdf', methods=['GET'])
def export_doc_pdf(doc_id):
    """Export a saved document as a styled PDF using ReportLab."""
    doc = Document.query.get_or_404(doc_id)
    text = doc.edited_text or doc.original_ocr_text or "No text available."
    from .services.pdf_export_service import generate_pdf
    
    upload_folder = current_app.config['UPLOAD_FOLDER']
    pdf_filename = f"export_{doc.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf_path = os.path.join(upload_folder, pdf_filename)
    
    clean_title = doc.filename.rsplit('.', 1)[0] if '.' in doc.filename else doc.filename
    generate_pdf(text, doc.filename, pdf_path, title=clean_title)
    
    return send_from_directory(
        upload_folder,
        pdf_filename,
        as_attachment=True,
        download_name=f"{secure_filename(clean_title)}.pdf",
        mimetype='application/pdf'
    )

@api_bp.route('/export/pdf', methods=['POST'])
def export_custom_pdf():
    """Export custom text as PDF directly."""
    data = request.json or {}
    text = data.get('text', '').strip()
    title = data.get('title', 'SmartScan AI Document')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
        
    from .services.pdf_export_service import generate_pdf
    upload_folder = current_app.config['UPLOAD_FOLDER']
    pdf_filename = f"custom_export_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf_path = os.path.join(upload_folder, pdf_filename)
    
    generate_pdf(text, title, pdf_path, title=title)
    
    return send_from_directory(
        upload_folder,
        pdf_filename,
        as_attachment=True,
        download_name=f"{secure_filename(title)}.pdf",
        mimetype='application/pdf'
    )

@api_bp.route('/feedback/stats', methods=['GET'])
def get_feedback_stats():
    """Calculate aggregated SUS score and usability stats from actual feedback submissions."""
    feedbacks = UsabilityFeedback.query.all()
    total = len(feedbacks)
    if total == 0:
        return jsonify({
            'total_responses': 0,
            'average_sus_score': 0,
            'average_ease_rating': 0,
            'completion_rate_percent': 0,
            'grade': 'N/A'
        })
        
    valid_sus = [f.sus_score for f in feedbacks if f.sus_score is not None]
    avg_sus = round(sum(valid_sus) / len(valid_sus), 1) if valid_sus else 0
    
    valid_ease = [f.ease_of_use_rating for f in feedbacks if f.ease_of_use_rating is not None]
    avg_ease = round(sum(valid_ease) / len(valid_ease), 1) if valid_ease else 0
    
    completed_count = sum(1 for f in feedbacks if f.task_completion_status == 'completed' or f.task_completion_status is True)
    completion_rate = round((completed_count / total) * 100, 1)
    
    # Standard SUS Grade scale
    if avg_sus >= 80.3:
        grade = "A (Excellent)"
    elif avg_sus >= 68:
        grade = "B (Good / Above Average)"
    elif avg_sus >= 51:
        grade = "C (OK / Acceptable)"
    else:
        grade = "D/F (Poor)"
        
    return jsonify({
        'total_responses': total,
        'average_sus_score': avg_sus,
        'average_ease_rating': avg_ease,
        'completion_rate_percent': completion_rate,
        'grade': grade
    })

@api_bp.route('/settings/api-key', methods=['GET'])
def get_api_key_status():
    key = os.getenv("GEMINI_API_KEY", "")
    is_configured = bool(key and key != "your_gemini_api_key_here")
    masked = f"{key[:6]}...{key[-4:]}" if is_configured and len(key) > 10 else ""
    return jsonify({
        'configured': is_configured,
        'masked_key': masked
    })

@api_bp.route('/settings/api-key', methods=['POST'])
def update_api_key():
    data = request.json or {}
    new_key = data.get('api_key', '').strip()
    
    if not new_key:
        return jsonify({'error': 'API key cannot be empty'}), 400
        
    # Update current runtime environment
    os.environ["GEMINI_API_KEY"] = new_key
    
    # Configure genai in runtime
    try:
        import google.generativeai as genai
        genai.configure(api_key=new_key)
    except Exception as e:
        print(f"GenAI configure warning: {e}")
        
    # Persist to backend/.env
    env_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', '.env')
    try:
        with open(env_path, 'w') as f:
            f.write(f"GEMINI_API_KEY={new_key}\n")
    except Exception as e:
        print(f"Error saving to .env: {e}")
        
    return jsonify({
        'status': 'success',
        'message': 'Gemini Vision API key activated successfully!',
        'configured': True
    })



