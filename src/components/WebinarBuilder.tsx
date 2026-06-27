import React, { useState, useEffect, useRef } from 'react';
import { Presentation, UploadCloud, Loader, Copy, Download, CheckCircle, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UploadedImage {
  file: File;
  base64: string;
  previewUrl: string;
}

const PART_LABELS: Record<string, string> = {
  'Part A': 'PART A — SLIDE OUTLINE',
  'Part B': 'PART B — SPEAKER SCRIPT',
  'Part C': 'PART C — CTA SLIDE COPY',
  'Part D': 'PART D — OFFER / BONUS STACK',
  'Part E': 'PART E — Q&A AMMO',
};

function renderContent(content: string) {
  const parts = content.split(/(Part [A-E][:\s—–-])/g);
  if (parts.length <= 1) {
    return (
      <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">
        {content}
      </div>
    );
  }

  const sections: { label: string; body: string }[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const rawLabel = parts[i].trim().replace(/[:\s—–-]+$/, '');
    const label = PART_LABELS[rawLabel] ?? rawLabel.toUpperCase();
    const body = parts[i + 1] ?? '';
    sections.push({ label, body });
  }

  return (
    <div className="space-y-8">
      {parts[0].trim() && (
        <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">{parts[0]}</div>
      )}
      {sections.map(({ label, body }, idx) => (
        <div key={idx}>
          {idx > 0 && <div className="border-t border-slate-200 mb-6" />}
          <div className="inline-block bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1 mb-4">
            <span className="text-emerald-700 font-bold text-xs tracking-widest">{label}</span>
          </div>
          <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">{body.trim()}</div>
        </div>
      ))}
    </div>
  );
}

export default function WebinarBuilder() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setAuthToken(session.access_token);
      } else {
        const clientId = localStorage.getItem('clientId');
        const clientEmail = localStorage.getItem('clientEmail');
        const userType = localStorage.getItem('userType');
        if (clientId && clientEmail && userType === 'client') {
          setIsAuthenticated(true);
          setAuthToken(import.meta.env.VITE_SUPABASE_ANON_KEY);
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFiles = async (files: File[]) => {
    setError('');
    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 5MB. Please use a smaller file.`);
        return;
      }
      validFiles.push(file);
    }

    const combined = [...images, ...validFiles].slice(0, 20);
    const newEntries: UploadedImage[] = await Promise.all(
      combined.map(async (file) => {
        const existing = images.find(i => i.file === file);
        if (existing) return existing;
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        return { file, base64, previewUrl };
      })
    );
    setImages(newEntries);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleGenerate = async () => {
    if (images.length === 0) {
      setError('Please upload at least one screenshot to continue.');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      if (!isAuthenticated) throw new Error('You must be logged in to use this tool');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-webinar`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: images.map(i => i.base64) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate webinar package');
      }

      const result = await response.json();
      setGeneratedContent(result.content);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating content');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    images.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setGeneratedContent('');
    setError('');
  };

  const handleDownloadPDF = async () => {
    try {
      if (!isAuthenticated) throw new Error('You must be logged in');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: generatedContent, title: 'Webinar Package' }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webinar-package.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Presentation className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-600">You must be logged in to use this tool. Please log in and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" ref={resultRef}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Presentation className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Webinar Builder</h2>
          </div>
          <p className="text-slate-600 mb-8">
            Upload your data screenshots and we'll build your complete webinar package
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!generatedContent ? (
            <div className="space-y-6">
              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-700 font-medium">Drop your screenshots here or click to browse</p>
                <p className="text-sm text-slate-500 mt-1">Upload your screenshots &bull; JPG, PNG accepted &bull; Max 20 files</p>
              </div>

              {/* Thumbnails */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                      {images.length} screenshot{images.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.previewUrl}
                          alt={img.file.name}
                          className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-slate-500 mt-1 truncate w-20" title={img.file.name}>
                          {img.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating || images.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Building your webinar... this may take 60–90 seconds
                    </>
                  ) : (
                    <>
                      <Presentation className="w-5 h-5" />
                      Build My Webinar →
                    </>
                  )}
                </button>
                {generating && (
                  <p className="text-xs text-slate-500 text-center">
                    Our AI is reading your screenshots and crafting your complete webinar script, slide outline, CTA copy and Q&A ammo.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">
                  Your Webinar Package is ready!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                >
                  {copied ? (
                    <><CheckCircle className="w-4 h-4 text-green-600" />Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" />Copy All</>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Build New Webinar
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

              {/* Generated Content */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
                {renderContent(generatedContent)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}