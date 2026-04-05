import React, { useState, useRef } from 'react';
import { Map, Loader, Download, RefreshCw, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PassionRoadmapCreator() {
  const [passion, setPassion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passion.trim()) {
      setError('Please enter your passion');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedContent('');
    setElapsedTime(0);
    setProgressStep(0);

    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    const progressInterval = setInterval(() => {
      setProgressStep(prev => (prev + 1) % 4);
    }, 5000);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-passion-roadmap`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passion: passion.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roadmap');
      }

      const data = await response.json();
      setGeneratedContent(data.roadmap);

      clearInterval(timerInterval);
      clearInterval(progressInterval);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      clearInterval(timerInterval);
      clearInterval(progressInterval);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedContent,
          filename: 'Passion_Roadmap.pdf'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Passion_Roadmap.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  const handleGenerateNew = () => {
    setGeneratedContent('');
    setPassion('');
    setError('');
  };

  const progressMessages = [
    'Analyzing your passion...',
    'Structuring your 12-month roadmap...',
    'Creating actionable milestones...',
    'Finalizing your transformation plan...'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={resultRef}>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Passion Roadmap Creator
          </h2>
          <p className="text-slate-600 mb-8">
            Transform your passion into a structured 1-year action roadmap (Beginner to Transformation)
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!generatedContent ? (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-slate-900">
                  What is your passion? <span className="text-red-600">*</span>
                </label>
                <p className="text-sm text-slate-600">
                  Examples: Bodybuilding, Freelancing, Life Coaching, Content Creation, Software Development, Photography, etc.
                </p>
                <input
                  type="text"
                  value={passion}
                  onChange={(e) => setPassion(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your passion..."
                  disabled={generating}
                />
              </div>

              {generating && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                  <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                  <p className="text-emerald-800 font-medium mb-2">
                    {progressMessages[progressStep]}
                  </p>
                  <p className="text-sm text-emerald-700">
                    Time elapsed: {elapsedTime}s
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating Your Roadmap...
                  </>
                ) : (
                  <>
                    <Map className="w-5 h-5" />
                    Generate 1-Year Roadmap
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleGenerateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {generatedContent}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
