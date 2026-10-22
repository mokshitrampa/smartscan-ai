import React, { useState, useEffect } from 'react';
import { Eye, Type, Contrast, Volume2, CheckCircle, ShieldCheck, Sparkles, Sliders } from 'lucide-react';

export default function Accessibility() {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('smartscan_font_size') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('smartscan_contrast') === 'high');
  const [dyslexicFont, setDyslexicFont] = useState(() => localStorage.getItem('smartscan_dyslexic') === 'true');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('smartscan_motion') === 'reduced');
  const [ttsSpeed, setTtsSpeed] = useState(() => parseFloat(localStorage.getItem('smartscan_tts_speed') || '1.0'));
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    // Apply font size class to document root
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xl');
    root.classList.add(`font-size-${fontSize}`);
    localStorage.setItem('smartscan_font_size', fontSize);

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
    localStorage.setItem('smartscan_contrast', highContrast ? 'high' : 'normal');

    // Dyslexic font
    if (dyslexicFont) {
      root.classList.add('dyslexic-font-mode');
    } else {
      root.classList.remove('dyslexic-font-mode');
    }
    localStorage.setItem('smartscan_dyslexic', dyslexicFont ? 'true' : 'false');

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion-mode');
    } else {
      root.classList.remove('reduced-motion-mode');
    }
    localStorage.setItem('smartscan_motion', reducedMotion ? 'reduced' : 'normal');

    localStorage.setItem('smartscan_tts_speed', ttsSpeed.toString());
  }, [fontSize, highContrast, dyslexicFont, reducedMotion, ttsSpeed]);

  const handleSave = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleReset = () => {
    setFontSize('normal');
    setHighContrast(false);
    setDyslexicFont(false);
    setReducedMotion(false);
    setTtsSpeed(1.0);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 mb-2">
            <ShieldCheck size={13} /> WCAG 2.2 AA Compliant
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Accessibility & Display Preferences</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Personalize reading comfort, visual contrast, typography, and default voice synthesis rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-1.5"
          >
            {savedFeedback ? <><CheckCircle size={15} /> Saved!</> : 'Apply Preferences'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Font Size Scaling */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Type size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Text Sizing</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scale reading size across documents & menus</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { id: 'normal', label: 'Default', sample: '100%' },
              { id: 'large', label: 'Large', sample: '115%' },
              { id: 'xl', label: 'Extra Large', sample: '130%' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setFontSize(opt.id)}
                className={`py-3 px-3 rounded-xl border text-center transition-all ${
                  fontSize === opt.id
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.sample}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dyslexia-Friendly Typography */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">High-Legibility Font</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Increased letter spacing and distinctive character weight</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Dyslexia Reading Mode</span>
            <button
              onClick={() => setDyslexicFont(!dyslexicFont)}
              role="switch"
              aria-checked={dyslexicFont}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dyslexicFont ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                dyslexicFont ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Contrast size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">High Contrast Ratio</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Increases border definition and text contrast for low vision</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Enhanced Contrast</span>
            <button
              onClick={() => setHighContrast(!highContrast)}
              role="switch"
              aria-checked={highContrast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                highContrast ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                highContrast ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Motion & Animations */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Reduced Motion</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Minimizes smooth page transitions & animated spinners</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Disable Animations</span>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              role="switch"
              aria-checked={reducedMotion}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                reducedMotion ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800/80 p-6 rounded-2xl border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-sm">
          <Eye size={18} /> Live Accessibility Preview
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">SmartScan AI: Academic Notes Preview</h4>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            This preview immediately reflects your chosen font scale, readability typeface, and contrast rules. Try switching options above to see how text will render when studying academic documents.
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
          ⌨️ Quick Navigation & Screen Reader Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span>Toggle Dark/Light Mode</span>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded font-mono shadow-xs">Alt + T</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span>Start / Stop Read Aloud</span>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded font-mono shadow-xs">Spacebar (in player)</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span>Skip to Content</span>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded font-mono shadow-xs">Tab</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
