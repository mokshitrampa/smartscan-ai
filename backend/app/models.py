from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    upload_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    page_count = db.Column(db.Integer, default=1)
    original_ocr_text = db.Column(db.Text, nullable=True)
    edited_text = db.Column(db.Text, nullable=True)
    word_count = db.Column(db.Integer, default=0)
    summary = db.Column(db.Text, nullable=True)
    file_reference = db.Column(db.String(255), nullable=True)
    enhanced_file_reference = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_type': self.file_type,
            'upload_timestamp': self.upload_timestamp.isoformat(),
            'page_count': self.page_count,
            'original_ocr_text': self.original_ocr_text,
            'edited_text': self.edited_text,
            'word_count': self.word_count,
            'summary': self.summary,
            'file_reference': self.file_reference,
            'enhanced_file_reference': self.enhanced_file_reference
        }

class UsabilityFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_performed = db.Column(db.String(255), nullable=False)
    task_completion_status = db.Column(db.String(50), nullable=False)
    ease_of_use_rating = db.Column(db.Integer, nullable=False)
    comments = db.Column(db.Text, nullable=True)
    suggestions = db.Column(db.Text, nullable=True)
    sus_score = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'task_performed': self.task_performed,
            'task_completion_status': self.task_completion_status,
            'ease_of_use_rating': self.ease_of_use_rating,
            'comments': self.comments,
            'suggestions': self.suggestions,
            'sus_score': self.sus_score,
            'timestamp': self.timestamp.isoformat()
        }
