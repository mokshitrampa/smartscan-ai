import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Home, FileText, Folder, BookOpen, Settings, MessageSquare,
  Moon, Sun, ShieldCheck, Sparkles, Volume2, User, Key, X, Check, ExternalLink
} from 'lucide-react';
import { api } from './services/api';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import DocumentLibrary from './pages/DocumentLibrary';
import Editor from './pages/Editor';
import StudyAssistant from './pages/StudyAssistant';
import Accessibility from './pages/Accessibility';
import Feedback from './pages/Feedback';

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('smartscan_dark_mode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  const location = useLocation();

  const fetchKeyStatus = () => {
    api.getApiKeyStatus()
      .then(res => setApiKeyConfigured(res.data.configured))
      .catch(() => setApiKeyConfigured(false));
  };

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setKeyMessage('');
    try {
      await api.saveApiKey(apiKeyInput.trim());
      setApiKeyConfigured(true);
      setKeyMessage('Gemini Vision Key saved and activated successfully!');
      setApiKeyInput('');
      setTimeout(() => {
        setShowApiKeyModal(false);
        setKeyMessage('');
      }, 1500);
    } catch (err) {
      setKeyMessage('Failed to save API key. Please check connection.');
    } finally {
      setSavingKey(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartscan_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartscan_dark_mode', 'false');
    }
  }, [darkMode]);

  // Load accessibility settings from localStorage on initial render
  useEffect(() => {
    const root = document.documentElement;
    const fontSize = localStorage.getItem('smartscan_font_size');
    if (fontSize) {
      root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xl');
      root.classList.add(`font-size-${fontSize}`);
    }
    if (localStorage.getItem('smartscan_contrast') === 'high') {
      root.classList.add('high-contrast-mode');
    }
    if (localStorage.getItem('smartscan_dyslexic') === 'true') {
      root.classList.add('dyslexic-font-mode');
    }
    if (localStorage.getItem('smartscan_motion') === 'reduced') {
      root.classList.add('reduced-motion-mode');
    }
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/scan', label: 'Scan Document', icon: FileText },
    { to: '/library', label: 'My Documents', icon: Folder },
    { to: '/study', label: 'AI Study Assistant', icon: Sparkles, badge: 'AI' },
    { to: '/accessibility', label: 'Accessibility Settings', icon: ShieldCheck },
    { to: '/feedback', label: 'Usability Feedback', icon: MessageSquare, badge: 'SUS' },
  ];

  // Dynamic Page Header Title
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Academic Dashboard';
    if (pathname.startsWith('/scan')) return 'Scan & Ingest Document';
    if (pathname.startsWith('/library')) return 'Document Repository';
    if (pathname.startsWith('/study')) return 'AI Study Assistant & Summarizer';
    if (pathname.startsWith('/accessibility')) return 'Accessibility Preferences';
    if (pathname.startsWith('/feedback')) return 'System Usability Evaluation';
    if (pathname.startsWith('/document')) return 'Document Editor & Voice Assistant';
    return 'SmartScan AI';
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* ── Left Sidebar Navigation ── */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700/80 flex flex-col transition-colors z-20 shadow-xs">
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-extrabold text-lg">
              S
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                SmartScan AI
              </h1>
              <span className="text-[10px] font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                Academic Edition v2.4
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System Status & Theme Controls */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/80 space-y-3">
          {/* Status Indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 text-xs">
            <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </span>
            <span className="text-[10px] font-mono text-gray-400">REST API</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-blue-500" />}
              <span>{darkMode ? 'Light Interface' : 'Dark Mode'}</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 rounded text-gray-400">Alt+T</kbd>
          </button>
        </div>
      </aside>

      {/* ── Main Application Workspace ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/70 dark:bg-gray-900 transition-colors">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/80 px-8 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {getPageTitle(location.pathname)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Gemini API Key Trigger Button */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                apiKeyConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse'
              }`}
              title="Configure Gemini Vision AI Key for Handwriting & Signatures"
            >
              <Key size={13} />
              <span>{apiKeyConfigured ? 'Gemini AI Vision Active' : 'Setup Gemini Vision Key'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
              <span className="font-semibold">Review 2 Working Prototype</span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <User size={15} />
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/library" element={<DocumentLibrary />} />
            <Route path="/study" element={<StudyAssistant />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/document/:id" element={<Editor />} />
          </Routes>
        </main>
      </div>

      {/* ── Gemini API Key Modal ── */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5">
            <div className="flex items-center justify-between border-b dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Gemini Vision AI Engine</h3>
                  <p className="text-xs text-gray-400">Required for Cursive Handwriting & Signatures</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Standard OCR engines only recognize printed book fonts. Google's Gemini Vision AI enables accurate extraction of <strong>cursive handwriting, student signatures (e.g. your signature image), and complex formulas</strong>.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Enter Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {keyMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <Check size={14} /> {keyMessage}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1 font-medium"
                >
                  Get a free key from Google AI Studio <ExternalLink size={12} />
                </a>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !apiKeyInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {savingKey ? 'Verifying...' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
