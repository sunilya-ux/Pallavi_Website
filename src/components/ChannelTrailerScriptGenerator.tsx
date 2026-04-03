import React, { useState, useEffect, useRef } from 'react';
import { Video, Loader, Copy, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  topic: string;
  pain: string;
  transformation: string;
}

export default function ChannelTrailerScriptGenerator() {
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    pain: '',
    transformation: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
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

    if (!formData.topic.trim() || !formData.pain.trim() || !formData.transformation.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedScript('');

    try {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to use this tool');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-channel-trailer-script`;

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
        throw new Error(errorData.error || 'Failed to generate script');
      }

      const result = await response.json();
      setGeneratedScript(result.script);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the script');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateNew = () => {
    setGeneratedScript('');
    setError('');
    setFormData({ topic: '', pain: '', transformation: '' });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCopy = async () => {
    if (generatedScript) {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!isAuthenticated) {
        throw new Error('You must be logged in');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedScript,
          title: 'Channel Trailer Script'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'channel-trailer-script.pdf';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" ref={resultRef}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Video className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Channel Trailer Script Generator</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Create a powerful 5–8 minute YouTube script that deeply connects with your audience
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {!generatedScript ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Question 1 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    What is your video topic?
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Example: Why you feel guilty setting boundaries
                  </p>
                  <textarea
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                    placeholder="Enter your video topic..."
                    rows={3}
                  />
                </div>

                {/* Question 2 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    What is the core pain your audience is facing?
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Example: People pleasing, guilt, emotional exhaustion
                  </p>
                  <textarea
                    value={formData.pain}
                    onChange={(e) => handleInputChange('pain', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                    placeholder="Describe the core pain..."
                    rows={3}
                  />
                </div>

                {/* Question 3 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    What transformation do you want to give them?
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Example: Confident boundary setting without guilt
                  </p>
                  <textarea
                    value={formData.transformation}
                    onChange={(e) => handleInputChange('transformation', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                    placeholder="Describe the desired transformation..."
                    rows={3}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating your script...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Generate Script
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleGenerateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </button>
                </div>

                {/* Generated Script */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-8">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
                    {generatedScript}
                  </pre>
                </div>

                {/* Error Message */}
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
