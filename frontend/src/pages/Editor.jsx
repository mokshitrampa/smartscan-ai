import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, ArrowLeft, Download, Copy, RotateCcw, Search,
  FileUp, Split, Maximize2, Undo2, Redo2, Eye, Volume2, CheckCircle
} from 'lucide-react';
import VoiceAssistant from '../components/VoiceAssistant';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // History for Undo / Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Search in text
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // Split View: toggle side-by-side with original document
  const [showOriginal, setShowOriginal] = useState(true);
  const [imageTab, setImageTab] = useState('cleared'); // 'cleared' | 'original'

  // Feedback states
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [copyStatus, setCopyStatus] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getDocument(id)
      .then(res => {
        setDoc(res.data);
        const initialText = res.data.edited_text || res.data.original_ocr_text || '';
        setText(initialText);
        setHistory([initialText]);
        setHistoryIndex(0);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Handle Text Changes with Undo/Redo tracking
  const handleTextChange = (newVal) => {
    setText(newVal);
    // Push to history
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newVal);
    // Limit history stack to 30 states
    if (updatedHistory.length > 30) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setText(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setText(next);
    }
  };

  // Search keyword occurrences
  useEffect(() => {
    if (!searchQuery.trim() || !text) {
      setMatchCount(0);
      return;
    }
    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      setMatchCount(matches ? matches.length : 0);
    } catch {
      setMatchCount(0);
    }
  }, [searchQuery, text]);

  // Load external .txt file directly into editor
  const handleLoadTxtFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        handleTextChange(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await api.updateDocument(id, { edited_text: text });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const handleDownloadTxt = () => {
    const a = window.document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    a.href = URL.createObjectURL(file);
    a.download = `${doc?.filename || 'document'}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  const handleReset = () => {
    if (window.confirm('Revert to original OCR text? Any unsaved edits will be replaced.')) {
      handleTextChange(doc?.original_ocr_text || '');
    }
  };

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = text.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium">Loading document and voice engine...</p>
      </div>
    </div>
  );

  if (!doc) return (
    <div className="p-8 text-center text-red-500">Document record not found!</div>
  );

  const previewFileUrl = doc.file_reference ? api.getFilePreviewUrl(doc.file_reference) : null;
  const clearedFileUrl = doc.enhanced_file_reference ? api.getFilePreviewUrl(doc.enhanced_file_reference) : null;
  const isPdf = doc.filename.toLowerCase().endsWith('.pdf');

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/library')}
            aria-label="Back to library"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-sm sm:max-w-md">
              {doc.filename}
            </h2>
            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
              <span>•</span>
              <span>~{readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Split View */}
          {previewFileUrl && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showOriginal
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Toggle original image/document preview"
            >
              <Split size={14} />
              {showOriginal ? 'Hide Original' : 'Show Original'}
            </button>
          )}

          {/* Load External TXT File */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt"
            onChange={handleLoadTxtFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Load local .txt file into editor"
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
          >
            <FileUp size={14} /> Load .TXT
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 size={15} />
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
          >
            <Copy size={14} /> {copyStatus ? 'Copied!' : 'Copy'}
          </button>

          {/* Download TXT */}
          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
          >
            <Download size={14} /> TXT
          </button>

          {/* Download PDF via ReportLab */}
          <a
            href={api.getDocPdfExportUrl(doc.id)}
            download
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
          >
            <Download size={14} /> Export PDF
          </a>

          {/* Save Changes */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              saveStatus === 'saved' ? 'bg-emerald-600 text-white' :
              saveStatus === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save size={14} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Workspace: Split View + Voice Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Document Preview (Cleared vs Original) */}
        {showOriginal && (previewFileUrl || clearedFileUrl) && (
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[650px]">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
              {clearedFileUrl ? (
                <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImageTab('cleared')}
                    className={`px-2 py-1 rounded-md font-bold text-[11px] transition-all ${
                      imageTab === 'cleared'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    ✨ Cleared Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('original')}
                    className={`px-2 py-1 rounded-md font-bold text-[11px] transition-all ${
                      imageTab === 'original'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Original
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1.5 font-bold">
                  <Eye size={14} /> Document Preview
                </span>
              )}

              {clearedFileUrl && (
                <a
                  href={clearedFileUrl}
                  download={`cleared_${doc.filename}`}
                  title="Download restored high-clarity image"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  <Download size={12} /> Save Cleared
                </a>
              )}
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto p-2 flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={previewFileUrl}
                  title="PDF Preview"
                  className="w-full h-full rounded-lg border-0"
                />
              ) : (
                <img
                  src={imageTab === 'cleared' && clearedFileUrl ? clearedFileUrl : previewFileUrl}
                  alt="Document preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-xs"
                />
              )}
            </div>
          </div>
        )}

        {/* Center / Editor Column */}
        <div className={`${showOriginal && (previewFileUrl || clearedFileUrl) ? 'lg:col-span-5' : 'lg:col-span-7'} bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[650px]`}>
          {/* Editor Header with Search Bar */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Editable OCR Text
            </span>
            
            {/* Keyword Search */}
            <div className="relative w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Find in text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {matchCount} found
                </span>
              )}
            </div>
          </div>

          {/* Textarea Editor */}
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            aria-label="Extracted text editor"
            className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none dark:text-gray-100 leading-relaxed text-sm font-sans"
            placeholder="No text was extracted. Edit or paste your notes here..."
          />

          <div className="p-2.5 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <span>Click any text above to correct OCR spelling or formatting.</span>
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              Reset to original OCR
            </button>
          </div>
        </div>

        {/* Right Column: AI Voice Assistant */}
        <div className={`${showOriginal && previewFileUrl ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
          <VoiceAssistant text={text} docTitle={doc.filename} />
        </div>
      </div>
    </div>
  );
}
