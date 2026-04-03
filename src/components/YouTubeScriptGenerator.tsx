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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">You must be logged in to use this tool. Please log in and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" ref={resultRef}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Video className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">YouTube Video Script Generator</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Generate full 5-8 minute YouTube scripts for life coaching content
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {!generatedContent ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Topic */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Topic
                  </label>
                  <textarea
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="e.g., How to stop people-pleasing and start setting boundaries"
                    required
                  />
                </div>

                {/* Audience Pain */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Audience Pain
                  </label>
                  <textarea
                    value={formData.pain}
                    onChange={(e) => handleInputChange('pain', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={4}
                    placeholder="e.g., Feeling guilty when saying no, exhausted from always putting others first, resentful but afraid of conflict"
                    required
                  />
                </div>

                {/* Desired Transformation */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Desired Transformation
                  </label>
                  <textarea
                    value={formData.result}
                    onChange={(e) => handleInputChange('result', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="e.g., Confident in setting boundaries without guilt, peaceful relationships, more time and energy for themselves"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {generating ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Video className="w-6 h-6" />
                      Generate Full Script
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Results */
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 font-medium">
                    Your full YouTube script has been generated successfully!
                  </p>
                </div>

                {/* Generated Content */}
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-mono text-sm">
                      {generatedContent}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleCopy}
                    className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Script
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGenerateNew}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate New
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
