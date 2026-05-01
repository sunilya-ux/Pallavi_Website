import { useState, useRef } from 'react';
import { Upload, X, Loader, Sparkles, Copy, Check, RotateCcw, Download, ImagePlus, Target } from 'lucide-react';

interface LifePurposeGeneratorProps {
  clientId: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

interface PurposeVersion {
  label: string;
  statement: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parsePurposeStatements(content: string): PurposeVersion[] {
  const versions: PurposeVersion[] = [];
  const blocks = content.split(/---+/).filter((b) => b.trim());

  for (const block of blocks) {
    const trimmed = block.trim();
    if (/life purpose statements/i.test(trimmed) && trimmed.split('\n').length <= 3) continue;

    const labelMatch = trimmed.match(/Version\s+\d+\s*[—\-]+\s*(.+)/i);
    if (!labelMatch) continue;

    const label = labelMatch[1].trim();
    const quoteMatch = trimmed.match(/"([^"]+)"/);
    if (quoteMatch) {
      versions.push({ label, statement: quoteMatch[1] });
    }
  }

  if (versions.length === 0) {
    const allQuotes = content.match(/"([^"]+)"/g);
    if (allQuotes) {
      const labels = ['Simple & Clear', 'Emotionally Deep', 'Strong & Empowering'];
      allQuotes.forEach((q, i) => {
        if (i < 3) {
          versions.push({ label: labels[i] || `Version ${i + 1}`, statement: q.replace(/"/g, '') });
        }
      });
    }
  }

  return versions;
}

const VERSION_STYLES = [
  { gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-700', iconBg: 'bg-sky-100' },
  { gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-700', iconBg: 'bg-rose-100' },
  { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-700', iconBg: 'bg-amber-100' },
];

export default function LifePurposeGenerator({ clientId }: LifePurposeGeneratorProps) {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, WebP, or GIF).');
      return;
    }

    if (image) URL.revokeObjectURL(image.preview);

    const base64 = await fileToBase64(file);
    setImage({
      file,
      preview: URL.createObjectURL(file),
      base64,
      mimeType: file.type,
    });
    setError('');
  };

  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image.preview);
      setImage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!image) {
      setError('Please upload an image to analyze.');
      return;
    }

    setGenerating(true);
    setAiContent('');

    try {
      abortControllerRef.current = new AbortController();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-life-purpose`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: image.base64,
            mimeType: image.mimeType,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate life purpose');
      }

      const data = await response.json();
      setAiContent(data.content);
      setShowForm(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled.');
      } else {
        setError(err.message || 'Failed to generate. Please try again.');
      }
      setShowForm(true);
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopyOne = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(`"${text}"`);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(aiContent);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleRegenerate = () => {
    setShowForm(false);
    setGenerating(true);
    setAiContent('');
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleGenerateNew = () => {
    setAiContent('');
    setShowForm(true);
    setError('');
    removeImage();
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
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: aiContent, title: 'Life Purpose Statements' }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'life-purpose-statements.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportMessage('PDF downloaded successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportMessage('Failed to generate PDF. Please try again.');
      setTimeout(() => setExportMessage(''), 5000);
    } finally {
      setExportingPDF(false);
    }
  };

  const versions = aiContent ? parsePurposeStatements(aiContent) : [];

  return (
    <div className="space-y-6">
      {/* FORM */}
      {showForm && !generating && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Life Purpose Generator</h2>
          </div>
          <p className="text-slate-600 mb-8 ml-[52px]">
            Upload your life purpose answers to receive 3 polished purpose statements
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-3">
                Upload Your Life Purpose Answers (Image)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Your image should contain answers to: 1) Your strengths/gifts/experiences, 2) Who you want to serve, 3) Why it matters
              </p>

              {!image ? (
                <div
                  onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                    dragActive
                      ? 'border-sky-500 bg-sky-50 scale-[1.01]'
                      : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                      dragActive ? 'bg-sky-100' : 'bg-slate-100'
                    }`}>
                      <ImagePlus className={`w-7 h-7 ${dragActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-base font-medium text-slate-700">
                        {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        JPG, PNG, WebP or GIF -- single image only
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-sm">
                  <img src={image.preview} alt="Uploaded answers" className="w-full h-auto max-h-64 object-contain bg-slate-50" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2.5">
                    <p className="text-xs text-white font-medium truncate">{image.file.name}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!image}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              <Sparkles className="w-5 h-5" />
              Generate Life Purpose
            </button>
          </form>
        </div>
      )}

      {/* GENERATING */}
      {generating && (
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl shadow-sm border border-sky-200 p-12 sm:p-16">
          <div className="max-w-md mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <Target className="w-16 h-16 text-sky-600 animate-pulse" />
                <Loader className="w-16 h-16 text-sky-500 animate-spin absolute inset-0" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Crafting your life purpose...</h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Reading your answers and creating 3 unique purpose statements.
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        <div ref={resultRef} className="max-w-3xl mx-auto space-y-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl p-6 sm:p-8 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Life Purpose Statements</h2>
                <p className="text-sky-100 mt-1">3 versions crafted from your answers</p>
              </div>
            </div>
          </div>

          {/* Purpose Cards */}
          {versions.length > 0 ? (
            versions.map((version, idx) => {
              const style = VERSION_STYLES[idx % VERSION_STYLES.length];
              return (
                <div key={idx} className={`${style.bg} border ${style.border} rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md`}>
                  <div className={`bg-gradient-to-r ${style.gradient} px-5 py-3 flex items-center justify-between`}>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Version {idx + 1} -- {version.label}
                    </h3>
                    <button
                      onClick={() => handleCopyOne(version.statement, idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white text-xs font-medium transition-colors"
                    >
                      {copiedIdx === idx ? (
                        <><Check className="w-3.5 h-3.5" /><span>Copied!</span></>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                  <div className="px-6 py-6 sm:px-8 sm:py-8">
                    <blockquote className={`text-lg sm:text-xl font-medium ${style.accent} leading-relaxed italic`}>
                      &ldquo;{version.statement}&rdquo;
                    </blockquote>
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
              <button onClick={handleCopyAll} className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium">
                {copiedAll ? <><Check className="w-5 h-5" /><span>Copied!</span></> : <><Copy className="w-5 h-5" /><span>Copy All</span></>}
              </button>
              <button onClick={handleDownloadPDF} disabled={exportingPDF} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {exportingPDF ? <><Loader className="w-5 h-5 animate-spin" /><span>Preparing PDF...</span></> : <><Download className="w-5 h-5" /><span>Download PDF</span></>}
              </button>
              <button onClick={handleRegenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <RotateCcw className="w-5 h-5" /><span>Regenerate</span>
              </button>
              <button onClick={handleGenerateNew} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium">
                <Sparkles className="w-5 h-5" /><span>New Image</span>
              </button>
            </div>
            {exportMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${exportMessage.includes('success') ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {exportMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
