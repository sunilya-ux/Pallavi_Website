import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
import { Target, Loader, Copy, CheckCircle, RefreshCw, Upload, FileText, AlignLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

type InputMode = 'upload' | 'paste';

interface NicheOption {
  number: number;
  name: string;
  whyItFits: string;
}

interface ParsedResult {
  niches: NicheOption[];
  bio: string;
}

function parseResult(content: string): ParsedResult | null {
  try {
    const nicheSection = content.split('---')[0] || '';
    const bioSection = content.split('INSTAGRAM BIO (ready to paste)')[1]?.trim() || '';

    const niches: NicheOption[] = [];
    const nicheRegex = /(\d+)\.\s+(.+?)\n\s*Why it fits:\s*(.+?)(?=\n\s*\d+\.|\n\s*---|$)/gs;
    let match;
    while ((match = nicheRegex.exec(nicheSection)) !== null) {
      niches.push({
        number: parseInt(match[1]),
        name: match[2].trim(),
        whyItFits: match[3].trim(),
      });
    }

    if (niches.length === 0) return null;

    return { niches, bio: bioSection.trim() };
  } catch {
    return null;
  }
}

export default function NicheFinder() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [extractedText, setExtractedText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileName, setFileName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const activeText = inputMode === 'upload' ? extractedText : pastedText;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setExtractedText('');
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setExtractedText((ev.target?.result as string) || '');
      };
      reader.onerror = () => {
        setFileError('Failed to read the file. Try Paste Text mode instead.');
      };
      reader.readAsText(file);
    } else if (ext === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) {
          setFileError('Could not extract text from this file. Try Paste Text mode instead.');
        } else {
          setExtractedText(result.value);
        }
      } catch {
        setFileError('Failed to read the .docx file. Try Paste Text mode instead.');
      }
    } else {
      setFileError('Unsupported file type. Please upload a .docx or .txt file.');
      setFileName('');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!activeText.trim()) return;

    setGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in as admin to use this tool');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-niche-finder`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answersText: activeText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate niche options');
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

  const handleStartOver = () => {
    setGeneratedContent('');
    setError('');
    setExtractedText('');
    setPastedText('');
    setFileName('');
    setFileError('');
  };

  const handleCopyBio = async (bio: string) => {
    await navigator.clipboard.writeText(bio);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const parsed = generatedContent ? parseResult(generatedContent) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Niche Finder</h2>
          </div>
          <p className="text-slate-600 mb-8">
            Upload or paste a mentee's questionnaire answers to generate premium niche options and an Instagram bio.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!generatedContent ? (
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'paste'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <AlignLeft className="w-4 h-4" />
                  Paste Text
                </button>
              </div>

              {/* Upload Mode */}
              {inputMode === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                      <FileText className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-slate-700 font-medium mb-1">
                      {fileName ? fileName : 'Click to upload questionnaire file'}
                    </p>
                    <p className="text-sm text-slate-500">Accepts .docx and .txt files</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {fileError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{fileError}</p>
                    </div>
                  )}

                  {extractedText && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Extracted text preview — confirm it looks correct before generating
                      </label>
                      <textarea
                        value={extractedText}
                        readOnly
                        rows={10}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm resize-y font-mono leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Paste Mode */}
              {inputMode === 'paste' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Paste the mentee's questionnaire answers
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={12}
                    placeholder="Paste the full text of the mentee's answers here..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 text-sm resize-y leading-relaxed"
                  />
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !activeText.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating niche options...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Generate Niche &amp; Bio
                  </>
                )}
              </button>
            </div>
          ) : (
            <div ref={resultRef} className="space-y-6">
              {/* Success Banner */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">Niche options and bio generated!</p>
              </div>

              {parsed ? (
                <>
                  {/* Niche Cards */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Premium Niche Options</h3>
                    <div className="space-y-3">
                      {parsed.niches.map((niche) => (
                        <div
                          key={niche.number}
                          className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {niche.number}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-base">{niche.name}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                <span className="font-medium text-emerald-700">Why it fits: </span>
                                {niche.whyItFits}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bio Section */}
                  {parsed.bio && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-slate-900">Instagram Bio</h3>
                        <button
                          onClick={() => handleCopyBio(parsed.bio)}
                          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          {copiedBio ? (
                            <><CheckCircle className="w-4 h-4" />Copied!</>
                          ) : (
                            <><Copy className="w-4 h-4" />Copy Bio</>
                          )}
                        </button>
                      </div>
                      <div className="bg-slate-900 text-slate-100 rounded-xl p-5">
                        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{parsed.bio}</pre>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Fallback: raw formatted output */
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <pre className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed font-mono">
                    {generatedContent}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCopyAll}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {copiedAll ? (
                    <><CheckCircle className="w-4 h-4 text-green-600" />Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" />Copy All</>
                  )}
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
