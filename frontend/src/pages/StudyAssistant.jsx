import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Sparkles, FileText, CheckCircle, Copy, Download, Volume2, HelpCircle, Loader2 } from 'lucide-react';

export default function StudyAssistant() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [summaryType, setSummaryType] = useState('short'); // 'short' | 'detailed' | 'points' | 'quiz'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDocuments().then(res => {
      setDocuments(res.data);
      if (res.data.length > 0) {
        setSelectedDocId(res.data[0].id.toString());
      }
    }).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      if (useCustom) {
        if (!customText.trim()) {
          setError('Please provide text to analyze.');
          setLoading(false);
          return;
        }
        // If custom text, we can use a temporary document or direct summary endpoint
        // Let's create an extractive/AI summary by calling the summary service via doc or direct
        // If there's an existing document selected or we can use the summary route
        if (selectedDocId) {
          const res = await api.generateSummary(selectedDocId, summaryType);
          setResult(res.data.summary);
        } else {
          // If no doc exists, create temporary doc
          setError('Please select or upload a document first to attach study summaries.');
        }
      } else {
        if (!selectedDocId) {
          setError('Please select a document from your library.');
          setLoading(false);
          return;
        }
        const res = await api.generateSummary(selectedDocId, summaryType);
        setResult(res.data.summary);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate study summary. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    if (!window.speechSynthesis) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!result) return;
    
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(result);
    utter.rate = 1.0;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Study_Guide_${summaryType}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.exportCustomPdf({
        text: result,
        title: `SmartScan AI Study Guide (${summaryType.toUpperCase()})`
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartScan_Study_Guide_${summaryType}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 mb-2">
          <Sparkles size={13} /> Gemini & Extractive NLP Intelligence
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Study Assistant & Knowledge Extractor</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Transform extracted textbook chapters and academic slides into concise summaries, key concept breakdowns, and self-test quiz questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> 1. Select Document Source
            </h3>

            {documents.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl text-xs text-gray-500 text-center">
                No documents found in library. Please scan a document first.
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  Available Extracted Documents
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.filename} ({d.word_count || 0} words)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" /> 2. Choose Output Format
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'short', title: 'Executive Summary', desc: '1-paragraph concise takeaway' },
                { id: 'detailed', title: 'Comprehensive Notes', desc: 'Multi-section detailed study guide' },
                { id: 'points', title: 'Key Points', desc: 'High-yield bulleted takeaways' },
                { id: 'quiz', title: 'Study Quiz / Q&A', desc: 'Self-test questions with answers' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSummaryType(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    summaryType === opt.id
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading || documents.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing Document...</>
              ) : (
                <><Sparkles size={16} /> Generate Study Material</>
              )}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Action Bar */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-b dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Generated Study Guide
              </span>
              {result && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleReadAloud}
                    className="p-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 shadow-2xs"
                  >
                    <Volume2 size={14} className={speaking ? "text-green-500 animate-pulse" : "text-blue-500"} />
                    {speaking ? 'Stop' : 'Listen'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 shadow-2xs"
                  >
                    <Copy size={14} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="p-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 shadow-2xs"
                  >
                    <Download size={14} /> TXT
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="p-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-2xs"
                  >
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                  <p className="text-sm">Synthesizing document insights & extracting key concepts...</p>
                </div>
              ) : result ? (
                <div className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {result}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-center space-y-2">
                  <BookOpen size={40} className="stroke-1 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium">Select a document and click "Generate Study Material"</p>
                  <p className="text-xs max-w-sm">
                    SmartScan AI will analyze the extracted text using Gemini AI or the high-fidelity extractive fallback engine.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
