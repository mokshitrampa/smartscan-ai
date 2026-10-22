from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from .models import db
from .routes import api_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Configure SQLite database
    db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'smartscan.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Ensure upload and audio folders exist
    upload_folder = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'uploads')
    audio_folder = os.path.join(upload_folder, 'audio')
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(audio_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder
    app.config['AUDIO_FOLDER'] = audio_folder
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
