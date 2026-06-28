import React, { useState, useEffect, useRef } from 'react';
import { Zap, Loader, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  topic: string;
  audience: string;
  goal: string;
}

interface Section {
  title: string;
  emoji: string;
  hooks: string[];
  borderColor: string;
  bgColor: string;
  textColor: string;
}

const SECTION_STYLES: Record<string, { emoji: string; borderColor: string; bgColor: string; textColor: string }> = {
  'Viral Hooks':       { emoji: '🔥', borderColor: 'border-orange-400', bgColor: 'bg-orange-50',  textColor: 'text-orange-700' },
  'Authority Hooks':   { emoji: '👑', borderColor: 'border-purple-400', bgColor: 'bg-purple-50',  textColor: 'text-purple-700' },
  'Contrarian Hooks':  { emoji: '⚡', borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50',  textColor: 'text-yellow-700' },
  'Emotional Hooks':   { emoji: '❤️', borderColor: 'border-pink-400',   bgColor: 'bg-pink-50',    textColor: 'text-pink-700'   },
  'Reel Opening Lines':{ emoji: '🎬', borderColor: 'border-blue-400',   bgColor: 'bg-blue-50',    textColor: 'text-blue-700'   },
};

function parseSections(content: string): Section[] {
  const sections: Section[] = [];

  const headingPattern = /^(\d+)\s+(Viral Hooks|Authority Hooks|Contrarian Hooks|Emotional Hooks|Reel Opening Lines)\s*$/m;
  const parts = content.split(/^(?=\d+\s+(?:Viral Hooks|Authority Hooks|Contrarian Hooks|Emotional Hooks|Reel Opening Lines)\s*$)/m);

  for (const part of parts) {
    const match = part.match(headingPattern);
    if (!match) continue;

    const key = match[2] as keyof typeof SECTION_STYLES;
    const style = SECTION_STYLES[key];
    if (!style) continue;

    const hooks: string[] = [];
    const lines = part.split('\n').slice(1);
    for (const line of lines) {
      const hookMatch = line.match(/^\s*\d+\.\s+(.+)/);
      if (hookMatch) hooks.push(hookMatch[1].trim());
    }

    if (hooks.length > 0) {
      sections.push({
        title: `${match[1]} ${key}`,
        emoji: style.emoji,
        hooks,
        borderColor: style.borderColor,
        bgColor: style.bgColor,
        textColor: style.textColor,
      });
    }
  }

  return sections;
}

export default function HookBuilder() {
  const [formData, setFormData] = useState<FormData>({ topic: '', audience: '', goal: '' });
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topic.trim() || !formData.audience.trim() || !formData.goal.trim()) {
      setError('Please fill in all three fields to generate your hooks');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      if (!isAuthenticated) throw new Error('You must be logged in to use this tool');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hooks`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate hooks');
      }

      const result = await response.json();
      setGeneratedContent(result.content);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating hooks');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleCopyHook = async (hook: string) => {
    await navigator.clipboard.writeText(hook);
    setCopiedHook(hook);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const handleGenerateNew = () => {
    setGeneratedContent('');
    setError('');
    setFormData({ topic: '', audience: '', goal: '' });
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
            <Zap className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-600">You must be logged in to use this tool. Please log in and try again.</p>
        </div>
      </div>
    );
  }

  const sections = generatedContent ? parseSections(generatedContent) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6" ref={resultRef}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Hook Builder</h2>
          </div>
          <p className="text-slate-600 mb-8">
            Generate scroll-stopping hooks for your content in seconds
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
                  What is your topic?
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., AI automation, fitness, investing, personal branding"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-slate-900">
                  Who is your audience?
                </label>
                <input
                  type="text"
                  value={formData.audience}
                  onChange={(e) => handleInputChange('audience', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., founders, freelancers, students, marketers"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-slate-900">
                  What is your goal?
                </label>
                <input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => handleInputChange('goal', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., get views, generate leads, sell a service"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating your hooks...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Hooks →
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">
                  Your hooks are ready!
                </p>
              </div>

              {/* Sections */}
              {sections.length > 0 ? (
                <div className="space-y-6">
                  {sections.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className={`rounded-xl border-l-4 ${section.borderColor} ${section.bgColor} p-5`}
                    >
                      <h3 className={`font-bold text-base mb-4 ${section.textColor}`}>
                        {section.emoji} {section.title}
                      </h3>
                      <div className="space-y-2">
                        {section.hooks.map((hook, hIdx) => (
                          <div
                            key={hIdx}
                            className="group flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
                          >
                            <p className="text-slate-800 text-sm leading-snug flex-1">{hook}</p>
                            <button
                              onClick={() => handleCopyHook(hook)}
                              className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy hook"
                            >
                              {copiedHook === hook ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">
                    {generatedContent}
                  </div>
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
                    <><Copy className="w-4 h-4" />Copy All Hooks</>
                  )}
                </button>
                <button
                  onClick={handleGenerateNew}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
