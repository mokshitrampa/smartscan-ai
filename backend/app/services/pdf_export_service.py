import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from datetime import datetime

def generate_pdf(text, filename, output_path, title=None):
    """
    Generate a professional academic PDF document using ReportLab.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=14
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=10
    )
    
    story = []
    
    doc_title = title or filename or "SmartScan AI Extracted Document"
    story.append(Paragraph(doc_title, title_style))
    
    now_str = datetime.now().strftime("%B %d, %Y - %I:%M %p")
    words = len(text.split()) if text else 0
    meta_text = f"SmartScan AI Export &nbsp;|&nbsp; Date: {now_str} &nbsp;|&nbsp; Word Count: {words}"
    story.append(Paragraph(meta_text, subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=16))
    
    # Process text into paragraphs safely
    paragraphs = text.split('\n')
    for p in paragraphs:
        clean_p = p.strip()
        if clean_p:
            # Escape HTML special chars for reportlab
            escaped = clean_p.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(escaped, body_style))
        else:
            story.append(Spacer(1, 6))
            
    doc.build(story)
    return output_path
