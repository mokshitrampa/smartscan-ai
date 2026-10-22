# SmartScan AI – Intelligent Document Scanner and Study Assistant

This is a full-stack academic document scanner and study assistant built for the **Usability Design of Software Application** (Review 2).

## Features
- **Dashboard**: Real-time statistics of scanned documents and words.
- **OCR Scanner**: Drag-and-drop file upload for images and PDFs. Powered by Tesseract OCR and PyMuPDF.
- **Document Library**: Store and manage all extracted documents in SQLite.
- **Dark Mode**: Fully accessible dark mode UI using Tailwind CSS.
- **REST API**: Python Flask backend with RESTful endpoints.

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-CORS
- **OCR Engine**: Tesseract OCR, pytesseract, OpenCV, PyMuPDF
- **Database**: SQLite

## Setup Instructions

### 1. Install Tesseract OCR (Windows)
To run this project, you MUST install Tesseract OCR on your Windows machine:
1. Download the Windows installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install it, ensuring you note the installation path (typically `C:\Program Files\Tesseract-OCR\tesseract.exe`).
3. Add the installation path to your Windows System Environment Variables `PATH`.
4. Alternatively, open `backend/app/services/ocr_service.py` and set the path explicitly on line 7: 
   `pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'`

### 2. Backend Setup
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd C:\Users\moksh\OneDrive\Desktop\ocr
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install the required Python packages:
   ```powershell
   pip install -r backend\requirements.txt
   ```
4. Start the Flask backend server:
   ```powershell
   python backend\run.py
   ```
   *The server will run on http://localhost:5000 and initialize the `smartscan.db` database automatically.*

### 3. Frontend Setup
1. Open a **new** PowerShell window and navigate to the frontend directory:
   ```powershell
   cd C:\Users\moksh\OneDrive\Desktop\ocr\frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *The frontend will run on http://localhost:5173.*

## Review 2 Demonstration

1. **Dashboard View**: Open `http://localhost:5173`. Show the dashboard statistics and dark mode toggle.
2. **OCR Extraction**: Navigate to "Scan Document". Upload a `.jpg` or `.pdf` file. Wait for the extraction.
3. **Document Management**: Navigate to "My Documents". The newly scanned document will appear in the library with word counts and the date.
4. **Delete/Manage**: Show deleting a document updates the statistics.

## Next Steps
- Implement detailed Text Editor view (routing is set up).
- Implement Study Assistant Summarization view.
- Complete Accessibility auditing (Screen Readers).

> Built by a Senior Full-Stack Engineer Agent.
