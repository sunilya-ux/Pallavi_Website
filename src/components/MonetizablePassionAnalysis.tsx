import { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader, Sparkles, Copy, Check, RotateCcw, Download, ImagePlus, FileText, Trash2 } from 'lucide-react';

interface MonetizablePassionAnalysisProps {
  clientId: string;
}

interface ImageFile {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

const PROGRESS_MESSAGES = [
  "Reading your uploaded images...",
  "Extracting handwritten notes and patterns...",
  "Identifying personality traits...",
  "Discovering your true passion...",
  "Evaluating monetizable career paths...",
  "Building your monetization roadmap...",
  "Crafting your premium coaching report...",
  "Almost done..."
];

const SECTION_STYLES: Record<string, { icon: string; gradient: string; border: string; bg: string; titleColor: string }> = {
  'CORE PERSONALITY TRAITS IDENTIFIED': {
    icon: 'search',
    gradient: 'from-sky-500 to-blue-600',
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    titleColor: 'text-sky-800',
  },
  'YOUR TRUE PASSION': {
    icon: 'star',
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    titleColor: 'text-amber-800',
  },
  'CAREER OPTIONS WITH RATINGS': {
    icon: 'briefcase',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    titleColor: 'text-emerald-800',
  },
  'BEST CAREER PATH (RECOMMENDED)': {
    icon: 'trophy',
    gradient: 'from-amber-500 to-yellow-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    titleColor: 'text-amber-800',
  },
  'SIMPLE MONETIZATION ROADMAP': {
    icon: 'dollar',
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
    titleColor: 'text-green-800',
  },
  'YOUR UNIQUE ADVANTAGE': {
    icon: 'lightbulb',
    gradient: 'from-cyan-500 to-blue-500',
    border: 'border-cyan-200',
    bg: 'bg-cyan-50',
    titleColor: 'text-cyan-800',
  },
  'REALITY CHECK': {
    icon: 'alert',
    gradient: 'from-orange-500 to-red-500',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    titleColor: 'text-orange-800',
  },
  'FINAL INSIGHT': {
    icon: 'pin',
    gradient: 'from-rose-500 to-pink-600',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    titleColor: 'text-rose-800',
  },
  'DISCLAIMER': {
    icon: 'scale',
    gradient: 'from-slate-500 to-gray-600',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    titleColor: 'text-slate-700',
  },
};

interface ReportSection {
  title: string;
  content: string;
}

function parseReport(content: string): ReportSection[] {
  const sections: ReportSection[] = [];
  const lines = content.split('\n');
  let currentTitle = '';
  let currentLines: string[] = [];

  const sectionHeaders = Object.keys(SECTION_STYLES);

  const isHeader = (line: string): string | null => {
    const cleaned = line.replace(/^[#*\-=\s]+/, '').replace(/[#*\-=\s]+$/, '').trim();
    const upper = cleaned.toUpperCase();
    for (const header of sectionHeaders) {
      if (upper.includes(header)) return header;
    }
    if (upper.includes('PASSION ANALYSIS REPORT')) return 'REPORT_TITLE';
    return null;
  };

  const flush = () => {
    if (currentTitle && currentTitle !== 'REPORT_TITLE') {
      const text = currentLines.join('\n').trim();
      if (text) {
        sections.push({ title: currentTitle, content: text });
      }
    }
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^-{3,}$/.test(trimmed) || /^={3,}$/.test(trimmed)) continue;

    const header = isHeader(trimmed);
    if (header) {
      flush();
      currentTitle = header;
    } else if (currentTitle) {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MonetizablePassionAnalysis({ clientId }: MonetizablePassionAnalysisProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [progressMessageIndex, setProgressMessageIndex] = useState(0);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      setProgressMessageIndex(0);
      interval = setInterval(() => {
        setProgressMessageIndex((prev) =>
          prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [generating]);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const newFiles: ImageFile[] = [];

    for (const file of Array.from(files)) {
      if (!validTypes.includes(file.type)) continue;
      if (images.length + newFiles.length >= 10) break;

      const base64 = await fileToBase64(file);
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        base64,
        mimeType: file.type,
      });
    }

    setImages((prev) => [...prev, ...newFiles]);
    setError('');
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (images.length === 0) {
      setError('Please upload at least one image to analyze.');
      return;
    }

    setGenerating(true);
    setAiContent('');

    try {
      abortControllerRef.current = new AbortController();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-passion-images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: images.map((img) => ({
              base64: img.base64,
              mimeType: img.mimeType,
            })),
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze images');
      }

      const data = await response.json();
      setAiContent(data.content);
      setShowForm(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Analysis cancelled.');
      } else {
        setError(err.message || 'Failed to analyze images. Please try again.');
      }
      setShowForm(true);
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aiContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = () => {
    setShowForm(false);
    setGenerating(true);
    setAiContent('');
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  const handleGenerateNew = () => {
    setAiContent('');
    setShowForm(true);
    setError('');
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handleDownloadPDF = async () => {
    setExportingPDF(true);
    setExportMessage('');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: aiContent, title: 'Monetizable Passion Analysis Report' }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'passion-analysis-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportMessage('PDF downloaded successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportMessage('Failed to generate PDF. Please try again.');
      setTimeout(() => setExportMessage(''), 5000);
    } finally {
      setExportingPDF(false);
    }
  };

  const sections = aiContent ? parseReport(aiContent) : [];

  return (
    <div className="space-y-6">
      {/* FORM */}
      {showForm && !generating && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Monetizable Passion Analysis</h2>
          </div>
          <p className="text-slate-600 mb-8 ml-[52px]">
            Upload handwritten notes or screenshots to discover your true passion and monetizable career paths
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">
                Upload Client Answer Images (Handwritten Notes / Screenshots)
              </label>

              {/* Drop zone */}
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    dragActive ? 'bg-teal-100' : 'bg-slate-100'
                  }`}>
                    <ImagePlus className={`w-7 h-7 ${dragActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-700">
                      {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      JPG, PNG, WebP or GIF -- up to 10 images
                    </p>
                  </div>
                </div>
              </div>

              {/* Image previews */}
              {images.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-700">
                      {images.length} image{images.length !== 1 ? 's' : ''} selected
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        images.forEach((img) => URL.revokeObjectURL(img.preview));
                        setImages([]);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={img.preview} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                          <p className="text-[10px] text-white font-medium truncate">{img.file.name}</p>
                        </div>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-teal-400 flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-medium">Add more</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={images.length === 0}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              <Sparkles className="w-5 h-5" />
              Generate Passion Analysis
            </button>
          </form>
        </div>
      )}

      {/* GENERATING */}
      {generating && (
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl shadow-sm border border-teal-200 p-12 sm:p-16">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-teal-600 animate-pulse" />
                <Loader className="w-16 h-16 text-teal-500 animate-spin absolute inset-0" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 min-h-[2.5rem] transition-all duration-500">{PROGRESS_MESSAGES[progressMessageIndex]}</h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {progressMessageIndex < PROGRESS_MESSAGES.length - 1 ? "Analyzing images takes about 30-90 seconds." : "Almost there -- thank you for waiting."}
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <button onClick={handleCancelGeneration} className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium">
                <X className="w-4 h-4" /><span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {aiContent && !showForm && (
        <div ref={resultRef} className="max-w-4xl mx-auto space-y-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Passion Analysis Report</h2>
                <p className="text-teal-100 mt-1">Your personalized passion discovery and monetization blueprint</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {sections.length > 0 ? (
            sections.map((section, idx) => {
              const style = SECTION_STYLES[section.title] || SECTION_STYLES['DISCLAIMER'];
              return (
                <div key={idx} className={`${style.bg} border ${style.border} rounded-xl overflow-hidden shadow-sm`}>
                  <div className={`bg-gradient-to-r ${style.gradient} px-5 py-3`}>
                    <h3 className="text-base sm:text-lg font-bold text-white">{section.title}</h3>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{section.content}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{aiContent}</div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium">
                {copied ? <><Check className="w-5 h-5" /><span>Copied!</span></> : <><Copy className="w-5 h-5" /><span>Copy</span></>}
              </button>
              <button onClick={handleDownloadPDF} disabled={exportingPDF} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {exportingPDF ? <><Loader className="w-5 h-5 animate-spin" /><span>Preparing PDF...</span></> : <><Download className="w-5 h-5" /><span>Download PDF</span></>}
              </button>
              <button onClick={handleRegenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <RotateCcw className="w-5 h-5" /><span>Regenerate</span>
              </button>
              <button onClick={handleGenerateNew} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium">
                <Sparkles className="w-5 h-5" /><span>New Analysis</span>
              </button>
            </div>
            {exportMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${exportMessage.includes('success') ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {exportMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
