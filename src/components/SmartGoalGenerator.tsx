import React, { useState, useRef } from 'react';
import { Target, Loader, Download, RefreshCw, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  dream: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
}

export default function SmartGoalGenerator() {
  const [formData, setFormData] = useState<FormData>({
    dream: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timebound: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dream.trim() || !formData.specific.trim() || !formData.timebound.trim()) {
      setError('Please fill in at least Dream, Specific goal, and Target date');
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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smart-goal`;

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
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate SMART goal');
      }

      const result = await response.json();
      setGeneratedContent(result.content);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating your SMART goal');
    } finally {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  const handleGenerateNew = () => {
    setGeneratedContent('');
    setError('');
    setElapsedTime(0);
    setProgressStep(0);
    setFormData({
      dream: '',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timebound: ''
    });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const progressMessages = [
    'Analyzing your dream and inputs...',
    'Crafting your SMART goal framework...',
    'Creating actionable micro-steps...',
    'Finalizing your execution plan...'
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
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
          title: 'SMART Goal Plan'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smart-goal-plan.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" ref={resultRef}>
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">SMART Goal Generator</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Turn your dream into a clear, actionable, and trackable SMART goal with step-by-step execution plan
            </p>
          </div>

          <div className="p-8">
            {!generatedContent ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Section 1 — Your Dream</h2>

                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      What is your dream for the next 3–12 months?
                    </label>
                    <textarea
                      value={formData.dream}
                      onChange={(e) => handleInputChange('dream', e.target.value)}
                      disabled={generating}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                      placeholder="e.g., Launch my own online business, become a certified yoga instructor, write and publish my first book..."
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Section 2 — SMART Framework</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Specific: What exactly do you want to achieve?
                      </label>
                      <textarea
                        value={formData.specific}
                        onChange={(e) => handleInputChange('specific', e.target.value)}
                        disabled={generating}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                        placeholder="e.g., Launch an e-commerce store selling handmade jewelry with 50 products listed..."
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Measurable: How will you measure progress?
                      </label>
                      <textarea
                        value={formData.measurable}
                        onChange={(e) => handleInputChange('measurable', e.target.value)}
                        disabled={generating}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                        placeholder="e.g., Track weekly sales, number of products listed, customer reviews, website traffic..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Achievable: What strengths/resources do you already have? What do you need?
                      </label>
                      <textarea
                        value={formData.achievable}
                        onChange={(e) => handleInputChange('achievable', e.target.value)}
                        disabled={generating}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                        placeholder="e.g., I have jewelry-making skills and $500 budget. I need to learn e-commerce platforms and marketing..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Relevant: Why does this goal matter to you?
                      </label>
                      <textarea
                        value={formData.relevant}
                        onChange={(e) => handleInputChange('relevant', e.target.value)}
                        disabled={generating}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                        placeholder="e.g., Financial independence, creative expression, flexibility to work from home, build something of my own..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Time-bound: What is your target date?
                      </label>
                      <input
                        type="date"
                        value={formData.timebound}
                        onChange={(e) => handleInputChange('timebound', e.target.value)}
                        disabled={generating}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {!generating ? (
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <Target className="w-5 h-5" />
                    Generate SMART Goal Plan
                  </button>
                ) : (
                  <div className="w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-300 rounded-2xl p-12 shadow-inner">
                    <div className="flex flex-col items-center justify-center space-y-8">
                      <div className="relative">
                        <div className="absolute inset-0 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <Loader className="relative w-20 h-20 text-blue-600 animate-spin" strokeWidth={2.5} />
                      </div>

                      <div className="text-center space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Designing your SMART goal plan...
                        </h3>
                        <p className="text-blue-700 font-semibold text-xl min-h-[2rem] transition-all duration-500">
                          {progressMessages[progressStep]}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl px-8 py-4 border-2 border-blue-300 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">⏱</div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Generating...
                            </p>
                            <p className="text-blue-600 font-mono font-bold text-2xl">
                              {elapsedTime}s
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-100 border border-blue-300 rounded-lg px-6 py-3">
                        <p className="text-sm text-blue-900 font-medium text-center">
                          Usually takes 15–30 seconds
                        </p>
                      </div>

                      <div className="text-center text-sm text-gray-600 max-w-md bg-white/50 backdrop-blur-sm rounded-lg px-6 py-4 border border-gray-200">
                        <p className="leading-relaxed">
                          Creating your personalized SMART goal with execution plan. Please wait...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleGenerateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </button>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-8">
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {generatedContent}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
