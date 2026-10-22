import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Square, Volume2, Download, Loader,
  AlertCircle, CheckCircle, Mic, Settings
} from 'lucide-react';
import { api, BASE_URL } from '../services/api';

const BACKEND_BASE = BASE_URL;

const GTTS_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-CN': 'Chinese (Simplified)',
};

export default function VoiceAssistant({ text, docTitle }) {
  // ───────── Web Speech (Read Aloud) state ─────────
  const utteranceRef = useRef(null);
  const [speechStatus, setSpeechStatus] = useState('idle'); // idle | reading | paused
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // ───────── Shared controls ─────────
  const [speed, setSpeed] = useState(1.0);
  const [lang, setLang] = useState('en');

  // ───────── Audio-file generation state ─────────
  const [genStatus, setGenStatus] = useState('idle'); // idle | generating | ready | error
  const [audioUrl, setAudioUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [audioFilename, setAudioFilename] = useState('');
  const [genError, setGenError] = useState('');
  // Track text at generation time — invalidate if text changes
  const [generatedForText, setGeneratedForText] = useState('');

  const audioRef = useRef(null);

  // ───────── Load browser voices ─────────
  useEffect(() => {
    if (!window.speechSynthesis) {
      setSpeechSupported(false);
      return;
    }
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        setVoices(v);
        setSelectedVoice(v[0]?.name || '');
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Invalidate generated audio when text changes
  useEffect(() => {
    if (generatedForText && text !== generatedForText) {
      setGenStatus('idle');
      setAudioUrl(null);
      setDownloadUrl(null);
      setAudioFilename('');
      setGenError('Text was edited — previous audio invalidated.');
    }
  }, [text, generatedForText]);

  // Stop speech when component unmounts
  useEffect(() => () => stopSpeech(), []);

  // ───────── Web Speech helpers ─────────
  function stopSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeechStatus('idle');
  }

  const handleReadAloud = useCallback(() => {
    if (!speechSupported) return;
    if (!text?.trim()) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = speed;
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utter.voice = voice;

    utter.onstart = () => setSpeechStatus('reading');
    utter.onpause = () => setSpeechStatus('paused');
    utter.onresume = () => setSpeechStatus('reading');
    utter.onend = () => setSpeechStatus('idle');
    utter.onerror = () => setSpeechStatus('idle');

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setSpeechStatus('reading');
  }, [text, speed, selectedVoice, voices, speechSupported]);

  const handlePause = () => {
    window.speechSynthesis.pause();
    setSpeechStatus('paused');
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setSpeechStatus('reading');
  };

  const handleStop = () => stopSpeech();

  // ───────── Backend audio generation ─────────
  const handleGenerateAudio = async () => {
    if (!text?.trim()) return;
    setGenStatus('generating');
    setGenError('');
    setAudioUrl(null);
    setDownloadUrl(null);
    try {
      const res = await api.generateAudio({ text, lang, speed });
      const { audio_url, download_url, filename } = res.data;
      setAudioUrl(`${BACKEND_BASE}${audio_url}`);
      setDownloadUrl(`${BACKEND_BASE}${download_url}&title=${encodeURIComponent(docTitle || 'audio')}`);
      setAudioFilename(filename);
      setGeneratedForText(text);
      setGenStatus('ready');
    } catch (err) {
      const msg = err.response?.data?.error || 'Audio generation failed. Check your internet connection.';
      setGenError(msg);
      setGenStatus('error');
    }
  };

  // ───────── Status label helpers ─────────
  const speechStatusLabel = { idle: 'Ready', reading: 'Reading…', paused: 'Paused' }[speechStatus];
  const speechStatusColor = { idle: 'text-gray-500', reading: 'text-green-600 dark:text-green-400', paused: 'text-yellow-600 dark:text-yellow-400' }[speechStatus];

  const genStatusLabel = {
    idle: 'Ready to generate',
    generating: 'Generating audio…',
    ready: 'Audio ready',
    error: 'Generation failed',
  }[genStatus];

  const empty = !text?.trim();

  // ───────── Render ─────────
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-blue-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">AI Voice Assistant</span>
        </div>
        {empty && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle size={13} /> No text to read
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">

        {/* ── Controls Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Speed */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Speed: {speed.toFixed(1)}×</span>
            <input
              type="range" min="0.5" max="2.0" step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              aria-label="Reading speed"
              className="accent-blue-600 w-full"
            />
          </label>

          {/* Language for generation */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Audio language</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Audio language"
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(GTTS_LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>

          {/* Browser voice */}
          {speechSupported && voices.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Browser voice</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                aria-label="Browser voice"
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* ── Section 1: Read Aloud (Web Speech) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Read Aloud</span>
            <span className={`text-xs font-medium ${speechStatusColor}`}>{speechStatusLabel}</span>
          </div>

          {!speechSupported && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
              <AlertCircle size={13} /> Your browser does not support Web Speech API. Use the audio generator below.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {speechStatus === 'idle' && (
              <button
                onClick={handleReadAloud}
                disabled={empty || !speechSupported}
                aria-label="Read aloud"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Play size={15} /> Read Aloud
              </button>
            )}
            {speechStatus === 'reading' && (
              <button onClick={handlePause} aria-label="Pause" className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <Pause size={15} /> Pause
              </button>
            )}
            {speechStatus === 'paused' && (
              <button onClick={handleResume} aria-label="Resume" className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <Play size={15} /> Resume
              </button>
            )}
            {speechStatus !== 'idle' && (
              <button onClick={handleStop} aria-label="Stop" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <Square size={15} /> Stop
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 dark:border-gray-700" />

        {/* ── Section 2: Generate Audio File ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Download Audio (MP3)</span>
            <span className={`text-xs font-medium ${
              genStatus === 'ready' ? 'text-green-600 dark:text-green-400' :
              genStatus === 'error' ? 'text-red-500' :
              genStatus === 'generating' ? 'text-blue-500' :
              'text-gray-400'
            }`}>{genStatusLabel}</span>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Uses gTTS (Google Text-to-Speech) via the backend. Requires an active internet connection.
          </p>

          <button
            onClick={handleGenerateAudio}
            disabled={empty || genStatus === 'generating'}
            aria-label="Generate audio file"
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors mb-3"
          >
            {genStatus === 'generating'
              ? <><Loader size={15} className="animate-spin" /> Generating…</>
              : <><Mic size={15} /> Generate Audio File</>}
          </button>

          {genError && (
            <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
              <AlertCircle size={13} /> {genError}
            </p>
          )}

          {genStatus === 'ready' && audioUrl && (
            <div className="space-y-2">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full rounded-lg"
                aria-label="Generated audio player"
              />
              <a
                href={downloadUrl}
                download
                aria-label="Download audio file"
                className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={15} /> Download MP3
              </a>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle size={13} /> Audio generated successfully. Edit the text above to regenerate.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
