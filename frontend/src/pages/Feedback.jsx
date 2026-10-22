import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Star, MessageSquare, Award, CheckCircle, HelpCircle, BarChart3, TrendingUp, Sparkles } from 'lucide-react';

const SUS_QUESTIONS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system."
];

export default function Feedback() {
  const [taskPerformed, setTaskPerformed] = useState('Document OCR Scan & Correction');
  const [completionStatus, setCompletionStatus] = useState('completed');
  const [easeRating, setEaseRating] = useState(5);
  const [comments, setComments] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [susAnswers, setSusAnswers] = useState(Array(10).fill(4)); // default 4 (Agree)
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);

  const fetchStats = () => {
    api.getFeedbackStats().then(res => setStats(res.data)).catch(console.error);
    api.getFeedback().then(res => setRecentFeedbacks(res.data.slice(-5).reverse())).catch(console.error);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Calculate official SUS score (0 - 100)
  const calculateSusScore = () => {
    let score = 0;
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        // Odd questions (1-indexed: 1, 3, 5, 7, 9) -> score - 1
        score += (susAnswers[i] - 1);
      } else {
        // Even questions (1-indexed: 2, 4, 6, 8, 10) -> 5 - score
        score += (5 - susAnswers[i]);
      }
    }
    return Math.round(score * 2.5);
  };

  const handleSusChange = (index, value) => {
    const updated = [...susAnswers];
    updated[index] = parseInt(value, 10);
    setSusAnswers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const computedSus = calculateSusScore();
    try {
      await api.submitFeedback({
        task_performed: taskPerformed,
        task_completion_status: completionStatus,
        ease_of_use_rating: easeRating,
        comments: comments,
        suggestions: suggestions,
        sus_score: computedSus
      });
      setSubmittedSuccess(true);
      setComments('');
      setSuggestions('');
      fetchStats();
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to record feedback. Please check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentScore = calculateSusScore();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mb-2">
          <Award size={13} /> Empirical Usability Evaluation
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Usability Scale (SUS) & Feedback</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Designed for academic user-testing sessions following John Brooke's standard 10-item System Usability Scale (ISO 9241-11).
        </p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Average SUS Score</span>
            <BarChart3 size={16} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats ? `${stats.average_sus_score} / 100` : '—'}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
            {stats?.grade || 'Industry benchmark: 68.0'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Ease of Use Rating</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats ? `${stats.average_ease_rating} ★` : '—'}
          </div>
          <p className="text-xs text-gray-400 mt-1">Out of 5.0 stars</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Task Success Rate</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats ? `${stats.completion_rate_percent}%` : '—'}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Successful user completions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Evaluations</span>
            <MessageSquare size={16} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats ? stats.total_responses : '0'}
          </div>
          <p className="text-xs text-gray-400 mt-1">Stored in SQLite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          {/* Task Info */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">1. Session & Task Context</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Task Evaluated</label>
                <select
                  value={taskPerformed}
                  onChange={(e) => setTaskPerformed(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Document OCR Scan & Correction">Document OCR Scan & Correction</option>
                  <option value="AI Study Assistant & Summarization">AI Study Assistant & Summarization</option>
                  <option value="Voice Assistant & MP3 Generation">Voice Assistant & MP3 Generation</option>
                  <option value="Full Document Library & PDF Export">Full Document Library & PDF Export</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Task Completion Status</label>
                <select
                  value={completionStatus}
                  onChange={(e) => setCompletionStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="completed">Completed Successfully</option>
                  <option value="partially_completed">Completed with Assistance</option>
                  <option value="failed">Did Not Complete</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Overall Ease of Use (1 = Difficult, 5 = Effortless)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEaseRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={24}
                      className={star <= easeRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                    />
                  </button>
                ))}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
                  {easeRating} / 5 Stars
                </span>
              </div>
            </div>
          </div>

          {/* 10-Question SUS Questionnaire */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
            <div className="flex items-center justify-between border-b dark:border-gray-700 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">2. Standard SUS Scale (10 Questions)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rate from 1 (Strongly Disagree) to 5 (Strongly Agree)</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Live Calculated Score:</span>
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{currentScore} / 100</div>
              </div>
            </div>

            <div className="space-y-4">
              {SUS_QUESTIONS.map((question, qIdx) => (
                <div key={qIdx} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 space-y-2">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">{qIdx + 1}.</span> {question}
                  </div>
                  <div className="flex items-center justify-between gap-2 max-w-sm pt-1">
                    <span className="text-xs text-gray-400">Strongly Disagree</span>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label key={val} className="flex flex-col items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`sus_${qIdx}`}
                            value={val}
                            checked={susAnswers[qIdx] === val}
                            onChange={() => handleSusChange(qIdx, val)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 mt-0.5">{val}</span>
                        </label>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">Strongly Agree</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Comments */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">3. Qualitative Observer Feedback</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Observations / Usability Obstacles</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Describe any friction during file upload, speech controls, or text correction..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Suggested Improvements</label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={2}
                placeholder="Recommendations for Review 2 presentation or future usability enhancement..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {submittedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle size={16} /> Evaluation successfully stored in SQLite database!
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Submitting Evaluation...' : 'Submit Usability Review'}
            </button>
          </div>
        </form>

        {/* Sidebar / Recent Reviews Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> SUS Grade Standards
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold">&gt; 80.3</span>
                <span>Grade A (Best in Class)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                <span className="font-semibold">68.0 – 80.2</span>
                <span>Grade B (Good / Above Average)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                <span className="font-semibold">51.0 – 67.9</span>
                <span>Grade C (Acceptable)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                <span className="font-semibold">&lt; 51.0</span>
                <span>Grade F (Severe Usability Issues)</span>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Recent Test Logs</h3>
            {recentFeedbacks.length === 0 ? (
              <p className="text-xs text-gray-400">No evaluations submitted yet. Complete the form to record test 1.</p>
            ) : (
              recentFeedbacks.map((fb, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl text-xs space-y-1 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between font-medium text-gray-800 dark:text-gray-200">
                    <span className="truncate max-w-[150px]">{fb.task_performed}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{fb.sus_score} SUS</span>
                  </div>
                  {fb.comments && <p className="text-gray-500 italic">"{fb.comments.slice(0, 60)}..."</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
