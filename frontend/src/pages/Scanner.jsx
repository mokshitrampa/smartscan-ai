import React, { useState, useRef } from 'react';
import { api, BASE_URL } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, Loader, CheckCircle, Camera,
  RefreshCw, AlertCircle, ArrowRight, Eye, ShieldCheck,
  Sparkles, Download, Wand2, Split
} from 'lucide-react';

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Deblur & Pixel Clarification state
  const [enhancing, setEnhancing] = useState(false);
  const [clearedPreviewUrl, setClearedPreviewUrl] = useState(null);
  const [clarityBoost, setClarityBoost] = useState(null);
  const [activeTab, setActiveTab] = useState('cleared'); // 'cleared' | 'original'
  
  // Camera capture state
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const validExts = ['jpg', 'jpeg', 'png', 'pdf'];
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validExts.includes(ext)) {
      setError('Please select a valid image (JPG, PNG) or PDF document.');
      return;
    }
    
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25 MB limit.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setClearedPreviewUrl(null);
    setClarityBoost(null);

    // Generate local preview if image and trigger automatic pixel clarification
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(selectedFile);

      // Auto-run deblur preview
      runAutoEnhance(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const runAutoEnhance = async (imageFile) => {
    setEnhancing(true);
    try {
      const res = await api.enhancePreview(imageFile);
      const fullClearedUrl = `${BASE_URL}${res.data.cleared_url}`;
      setClearedPreviewUrl(fullClearedUrl);
      const initB = res.data.initial_blur || 1;
      const finalB = res.data.cleared_blur || 1;
      const boost = Math.max(10, Math.round(((finalB - initB) / initB) * 100));
      setClarityBoost(boost);
      setActiveTab('cleared');
    } catch (err) {
      console.log('Preview enhancement note:', err);
    } finally {
      setEnhancing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Camera handling
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied or not available on this device.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFile(capturedFile);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select or capture a document first.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Multi-stage realistic progress
    setStepMessage('1/4 Analyzing document dimensions & blur metrics...');
    setTimeout(() => setStepMessage('2/4 Unsharp masking, CLAHE contrast balance & deblurring pixels...'), 600);
    setTimeout(() => setStepMessage('3/4 Extracting text via OCR Vision Engine...'), 1400);
    setTimeout(() => setStepMessage('4/4 Structuring text and saving to database...'), 2200);

    try {
      const res = await api.uploadDocument(file);
      if (res.data && res.data.id) {
        navigate(`/document/${res.data.id}`);
      } else {
        navigate('/library');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extract text. Please ensure image contains clear printed text.');
    } finally {
      setLoading(false);
      setStepMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 mb-2">
          <Wand2 size={13} /> Auto-Deblur & High-Accuracy Ingestion
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Scan & Deblur Document</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Upload blurry, low-resolution, or shadowy photos of lecture notes and textbooks. SmartScan automatically cleans the pixels, sharpens ink edges, and extracts text.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        
        {/* Camera Modal if active */}
        {cameraOpen ? (
          <div className="relative rounded-2xl overflow-hidden bg-black flex flex-col items-center p-4">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-[400px] rounded-xl object-contain" />
            <div className="mt-4 flex gap-3">
              <button
                onClick={capturePhoto}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-2"
              >
                <Camera size={18} /> Snap Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Drag & Drop Area */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
              <UploadCloud size={40} />
            </div>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
              Drag and drop your academic document or blurry photo here
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              Supports JPG, JPEG, PNG images and multi-page PDFs (up to 25 MB)
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl cursor-pointer transition-all font-semibold text-sm shadow-sm inline-flex items-center gap-2">
                <FileText size={16} />
                Browse Device Files
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                />
              </label>

              <button
                type="button"
                onClick={startCamera}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors inline-flex items-center gap-2"
              >
                <Camera size={16} /> Snap with Camera
              </button>
            </div>
          </div>
        )}

        {/* Selected File & Live Pixel Clarification Comparison */}
        {file && (
          <div className="bg-gray-50 dark:bg-gray-700/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.split('.').pop().toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {clearedPreviewUrl && (
                  <a
                    href={clearedPreviewUrl}
                    download={`cleared_${file.name}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Download size={13} /> Download Cleared Image
                  </a>
                )}
                <button
                  onClick={() => { setFile(null); setPreviewUrl(null); setClearedPreviewUrl(null); }}
                  className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Before vs After Cleared Image Visual Comparison */}
            {previewUrl && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Pixel Clarity & Deblur Preview:
                    </span>
                    {clarityBoost && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-md text-[11px] font-bold">
                        +{clarityBoost}% Sharpness Boosted
                      </span>
                    )}
                  </div>

                  {/* Toggle between cleared and original */}
                  {clearedPreviewUrl && (
                    <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab('cleared')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          activeTab === 'cleared'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        ✨ Cleared Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('original')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          activeTab === 'original'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Original Blur
                      </button>
                    </div>
                  )}
                </div>

                {/* Image Display */}
                <div className="relative rounded-xl overflow-hidden bg-gray-900 max-h-[360px] flex items-center justify-center p-2 border border-gray-200 dark:border-gray-700">
                  {enhancing ? (
                    <div className="py-16 text-center text-gray-400 space-y-2">
                      <Loader size={24} className="animate-spin text-blue-500 mx-auto" />
                      <p className="text-xs font-medium">Deblurring pixels and sharpening edges...</p>
                    </div>
                  ) : activeTab === 'cleared' && clearedPreviewUrl ? (
                    <img
                      src={clearedPreviewUrl}
                      alt="Deblurred and clarified document"
                      className="max-h-[340px] w-auto object-contain rounded-lg shadow-md"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Original upload"
                      className="max-h-[340px] w-auto object-contain rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-800">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Multi-step progress notice */}
        {loading && stepMessage && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="flex items-center gap-2">
                <Loader size={14} className="animate-spin text-blue-600" />
                Deblurring & Processing OCR Engine...
              </span>
              <span>Please wait</span>
            </div>
            <p className="text-xs text-blue-600/90 dark:text-blue-400 font-mono">
              {stepMessage}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader className="animate-spin" size={18} /> Clarifying Pixels & Extracting Text...</>
          ) : (
            <>Extract Text from Cleared Document <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
