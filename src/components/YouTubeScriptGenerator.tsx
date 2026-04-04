import React, { useState, useEffect, useRef } from 'react';
import { Video, Loader, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  topic: string;
  pain: string;
  result: string;
}

export default function YouTubeScriptGenerator() {
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    pain: '',
    result: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
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
        console.log('Auth: Supabase session found', { user: session.user.email });
      } else {
        const clientId = localStorage.getItem('clientId');
        const clientEmail = localStorage.getItem('clientEmail');
        const userType = localStorage.getItem('userType');

        if (clientId && clientEmail && userType === 'client') {
          setIsAuthenticated(true);
          setAuthToken(import.meta.env.VITE_SUPABASE_ANON_KEY);
          console.log('Auth: Client session found', { clientEmail });
        } else {
          setIsAuthenticated(false);
          console.log('Auth: No valid session found');
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topic.trim() || !formData.pain.trim() || !formData.result.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to use this tool');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-youtube-script`;

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
        throw new Error(errorData.error || 'Failed to generate content');
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

  const handleGenerateNew = () => {
    setGeneratedContent('');
    setError('');
    setFormData({ topic: '', pain: '', result: '' });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
            <Video className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-600">You must be logged in to use this tool. Please log in and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={resultRef}>
        {/* Header */}
        <div className="p-6 sm:p-8">
          <h1 className="text-page-title text-slate-900 mb-2">YouTube Video Script Generator</h1>
          <p className="text-sm text-slate-600 font-normal">
            Generate full 5-8 minute YouTube scripts for life coaching content
          </p>
        </div>

          {/* Form */}
          <div className="border-t border-slate-200 p-6 sm:p-8">
            {!generatedContent ? (
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Topic */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Topic
                  </label>
                  <textarea
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                    placeholder="e.g., How to stop people-pleasing and start setting boundaries"
                    required
                  />
                </div>

                {/* Audience Pain */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Audience Pain
                  </label>
                  <textarea
                    value={formData.pain}
                    onChange={(e) => handleInputChange('pain', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                    rows={4}
                    placeholder="e.g., Feeling guilty when saying no, exhausted from always putting others first, resentful but afraid of conflict"
                    required
                  />
                </div>

                {/* Desired Transformation */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Desired Transformation
                  </label>
                  <textarea
                    value={formData.result}
                    onChange={(e) => handleInputChange('result', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                    placeholder="e.g., Confident in setting boundaries without guilt, peaceful relationships, more time and energy for themselves"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Generate Full Script
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Results */
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 font-medium">
                    Your full YouTube script has been generated successfully!
                  </p>
                </div>

                {/* Generated Content */}
                <div className="bg-slate-50 rounded-lg p-6 sm:p-8 border border-slate-200">
                  <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">
                    {generatedContent}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Script
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGenerateNew}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
