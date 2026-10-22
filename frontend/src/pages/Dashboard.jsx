import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  FileText, BookOpen, Layers, Sparkles, ArrowRight, UploadCloud,
  CheckCircle, Clock, Volume2, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ total_documents: 0, total_pages: 0, total_words: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats().catch(() => ({ data: { total_documents: 0, total_pages: 0, total_words: 0 } })),
      api.getDocuments().catch(() => ({ data: [] }))
    ]).then(([statsRes, docsRes]) => {
      setStats(statsRes.data);
      setRecentDocs(docsRes.data.slice(0, 5));
      setLoading(false);
    });
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-8 md:p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-blue-100 border border-white/20">
            <Sparkles size={13} className="text-blue-300" /> Academic OCR & AI Assistant • Review 2
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome to SmartScan AI
          </h2>
          <p className="text-blue-100/90 text-sm md:text-base leading-relaxed">
            Convert lecture handouts, textbook pages, and academic PDFs into editable digital text. Generate study guides, listen aloud with the AI voice assistant, and export structured PDFs.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 bg-white text-blue-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-50 transition-all hover:scale-[1.02]"
            >
              <UploadCloud size={18} /> Quick Scan Document
            </Link>
            <Link
              to="/study"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              <BookOpen size={18} /> Open AI Study Assistant
            </Link>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -bottom-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-64 h-64 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Documents</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {stats.total_documents}
          </div>
          <p className="text-xs text-gray-400 mt-1">Processed in SQLite</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Pages Processed</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {stats.total_pages || stats.total_documents}
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Multi-page PDF supported</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Extracted Words</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {stats.total_words?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Total words digitized</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Voice & Audio</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Volume2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            Active
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Speech & MP3 generator</p>
        </div>
      </div>

      {/* Main Sections: Recent Documents + Quick Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Documents Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Recently Scanned Documents</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Access and edit your most recent lecture notes</p>
            </div>
            <Link
              to="/library"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View Library <ChevronRight size={14} />
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
              <FileText className="mx-auto text-gray-300 dark:text-gray-600" size={40} />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No scanned documents yet.</p>
              <Link
                to="/scan"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3.5 py-2 rounded-lg"
              >
                Scan your first document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <Link
                        to={`/document/${doc.id}`}
                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {doc.filename}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{new Date(doc.upload_timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{doc.word_count || 0} words</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/document/${doc.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Open & Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Academic Study Features (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Study Tools</h3>
            
            <div className="space-y-3">
              <Link
                to="/study"
                className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-900/20 dark:to-purple-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI Summaries & Quizzes</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generate notes & flashcards from scanned text</p>
                </div>
              </Link>

              <Link
                to="/accessibility"
                className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/60 to-cyan-50/40 dark:from-blue-900/20 dark:to-cyan-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Accessibility Suite</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Font scaling, Dyslexia mode & High Contrast</p>
                </div>
              </Link>

              <Link
                to="/feedback"
                className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/20 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">SUS Usability Review</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Empirical user evaluation & SUS survey</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick OCR Best Practices Widget */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 p-5 space-y-2">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              💡 OCR Best Practices
            </h4>
            <ul className="text-xs text-amber-900/80 dark:text-amber-200/80 space-y-1.5 list-disc list-inside">
              <li>Use flat, high-resolution document scans for best accuracy.</li>
              <li>Avoid shadows and blur across academic formulas.</li>
              <li>PDF documents extract clean digital text automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
