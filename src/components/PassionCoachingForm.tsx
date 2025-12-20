import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Loader, Copy, Check, RotateCcw, Sparkles, Download, FileText, X } from 'lucide-react';

interface PassionCoachingFormProps {
  clientId: string;
}

const PROGRESS_MESSAGES = [
  "Understanding your answers…",
  "Thinking through content ideas…",
  "Crafting engaging captions…",
  "Writing hooks and opening lines…",
  "Polishing your content for Instagram…",
  "Almost done…"
];

export default function PassionCoachingForm({ clientId }: PassionCoachingFormProps) {
  const [formData, setFormData] = useState({
    audienceDescription: '',
    idealClient: '',
    mainOffer: '',
    promisedResult: '',
    proofStory: '',
    postsPerWeek: '',
    contentPreference: '',
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [aiContent, setAiContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [progressMessageIndex, setProgressMessageIndex] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingGoogleDocs, setExportingGoogleDocs] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadExistingResponse();
  }, [clientId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      setProgressMessageIndex(0);
      interval = setInterval(() => {
        setProgressMessageIndex((prev) => {
          if (prev < PROGRESS_MESSAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generating]);

  const loadExistingResponse = async () => {
    try {
      const { data, error } = await supabase
        .from('passion_coaching_responses')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingResponse(data);
        setFormData({
          audienceDescription: data.audience_description || '',
          idealClient: data.ideal_client || '',
          mainOffer: data.main_offer || '',
          promisedResult: data.promised_result || '',
          proofStory: data.proof_story || '',
          postsPerWeek: data.posts_per_week || '',
          contentPreference: data.content_preference || '',
        });
      }
    } catch (err) {
      console.error('Error loading existing response:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGenerating(true);
    setError('');
    setSuccess(false);
    setAiContent('');

    try {
      const payload = {
        client_id: clientId,
        audience_description: formData.audienceDescription,
        ideal_client: formData.idealClient,
        main_offer: formData.mainOffer,
        promised_result: formData.promisedResult,
        proof_story: formData.proofStory,
        posts_per_week: formData.postsPerWeek,
        content_preference: formData.contentPreference,
        updated_at: new Date().toISOString(),
      };

      if (existingResponse) {
        const { error } = await supabase
          .from('passion_coaching_responses')
          .update(payload)
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('passion_coaching_responses')
          .insert([payload]);

        if (error) throw error;
      }

      setSuccess(true);
      setLoading(false);

      await generateContent();
    } catch (err: any) {
      setError(err.message || 'Failed to submit form. Please try again.');
      setLoading(false);
      setGenerating(false);
    }
  };

  const generateContent = async () => {
    try {
      abortControllerRef.current = new AbortController();
      setCancelRequested(false);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-passion-coaching-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audienceDescription: formData.audienceDescription,
            idealClientDescription: formData.idealClient,
            mainOffer: formData.mainOffer,
            promisedResult: formData.promisedResult,
            proofOrStory: formData.proofStory,
            postsPerWeek: formData.postsPerWeek,
            preferredContentType: formData.contentPreference,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      setAiContent(data.content);
      setShowForm(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled. You can edit your answers or try again.');
      } else {
        setError(err.message || 'Failed to generate content. Please try again.');
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
    setGenerating(true);
    generateContent();
  };

  const handleGenerateAgain = () => {
    setAiContent('');
    setShowForm(true);
    setError('');
    setSuccess(false);
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setCancelRequested(true);
    }
  };

  const handleDownloadPDF = async () => {
    setExportingPDF(true);
    setExportMessage('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: aiContent,
            title: 'Passion Coaching Instagram Content',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'passion-coaching-content.pdf';
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

  const handleExportToGoogleDocs = async () => {
    setExportingGoogleDocs(true);
    setExportMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Please sign in to export to Google Docs');
      }

      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!CLIENT_ID) {
        setExportMessage('Google Docs export requires configuration. Downloading as text file instead...');
        const element = document.createElement('a');
        const file = new Blob([aiContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'passion-coaching-content.txt';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setTimeout(() => setExportMessage(''), 5000);
        setExportingGoogleDocs(false);
        return;
      }

      const SCOPES = 'https://www.googleapis.com/auth/documents';
      const REDIRECT_URI = window.location.origin;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `response_type=token&` +
        `scope=${SCOPES}&` +
        `state=${encodeURIComponent(JSON.stringify({ action: 'export_google_docs', content: aiContent }))}`;

      const authWindow = window.open(authUrl, 'Google Auth', 'width=500,height=600');

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'google_auth_success') {
          const accessToken = event.data.accessToken;

          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(
              `${supabaseUrl}/functions/v1/export-to-google-docs`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: aiContent,
                  title: 'Passion Coaching Instagram Content – Generated',
                  googleAccessToken: accessToken,
                }),
              }
            );

            if (!response.ok) {
              throw new Error('Failed to export to Google Docs');
            }

            const data = await response.json();
            window.open(data.documentUrl, '_blank');
            setExportMessage('Your content has been exported to Google Docs.');
            setTimeout(() => setExportMessage(''), 5000);
          } catch (error) {
            console.error('Google Docs export error:', error);
            setExportMessage('Failed to export to Google Docs. Please try again.');
            setTimeout(() => setExportMessage(''), 5000);
          } finally {
            setExportingGoogleDocs(false);
          }

          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      const checkWindowClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkWindowClosed);
          window.removeEventListener('message', handleMessage);
          if (exportingGoogleDocs) {
            setExportingGoogleDocs(false);
            setExportMessage('Authentication cancelled.');
            setTimeout(() => setExportMessage(''), 3000);
          }
        }
      }, 500);
    } catch (error) {
      console.error('Google Docs export error:', error);
      setExportMessage(error instanceof Error ? error.message : 'Failed to export to Google Docs');
      setTimeout(() => setExportMessage(''), 5000);
      setExportingGoogleDocs(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showForm && !generating && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Passion Coaching SMM Questionnaire
          </h2>
          <p className="text-slate-600 mb-8">
            Please answer the following questions to help us create your personalized social media strategy.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <AutoGrowTextarea
              label="1. Which best describes your audience?"
              placeholder="For example: Working women, Homemakers, Both"
              value={formData.audienceDescription}
              onChange={(value) => handleChange('audienceDescription', value)}
            />

            <AutoGrowTextarea
              label="2. Tell me about your ideal client."
              placeholder="Short answer – 2 to 3 lines is enough. Example: 'She's in a corporate job, earning well but feels empty, confused, and scared to quit.'"
              value={formData.idealClient}
              onChange={(value) => handleChange('idealClient', value)}
            />

            <AutoGrowTextarea
              label="3. What is your main offer right now?"
              placeholder="For example: 1:1 Passion Discovery Session, 90-min clarity call, 3-hour Zoom workshop, etc."
              value={formData.mainOffer}
              onChange={(value) => handleChange('mainOffer', value)}
            />

            <AutoGrowTextarea
              label="4. What result do you promise from this offer?"
              placeholder="Example: 'Clarity on what I'm meant to do', 'Clear next steps without quitting my job', 'Confidence to start my own thing'"
              value={formData.promisedResult}
              onChange={(value) => handleChange('promisedResult', value)}
            />

            <AutoGrowTextarea
              label="5. Do you have any proof or story you can use right now?"
              placeholder="This can be: your own story OR your mentor's story OR a client story. Just 2–3 lines is enough."
              value={formData.proofStory}
              onChange={(value) => handleChange('proofStory', value)}
            />

            <AutoGrowTextarea
              label="6. How many posts per week do you want to do on Instagram?"
              placeholder="Just pick one number: 3 / 4 / 5 / 7"
              value={formData.postsPerWeek}
              onChange={(value) => handleChange('postsPerWeek', value)}
            />

            <AutoGrowTextarea
              label="7. What type of content do you prefer more right now?"
              placeholder="Example: 2 Reels + 2 Carousels + 1 Static post"
              value={formData.contentPreference}
              onChange={(value) => handleChange('contentPreference', value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      )}

      {generating && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-12 sm:p-16">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-emerald-600 animate-pulse" />
                <Loader className="w-16 h-16 text-emerald-500 animate-spin absolute inset-0" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 min-h-[2.5rem] transition-all duration-500">
                {PROGRESS_MESSAGES[progressMessageIndex]}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {progressMessageIndex < PROGRESS_MESSAGES.length - 1
                  ? "This usually takes about 20–40 seconds."
                  : "Almost there — thank you for waiting."}
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <button
                onClick={handleCancelGeneration}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium"
              >
                <X className="w-4 h-4" />
                <span>Cancel Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {aiContent && !showForm && (
        <div ref={resultRef} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Your Personalized Content Plan is Ready
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Ready to copy and use for your Instagram strategy
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 sm:p-8 mb-6 shadow-sm">
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base">
                {aiContent}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Content</span>
                  </>
                )}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Regenerate</span>
              </button>
              <button
                onClick={handleGenerateAgain}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Again</span>
              </button>
            </div>

            <div className="pt-2 border-t border-emerald-200">
              <p className="text-sm text-slate-600 mb-3">Export your content plan:</p>

              {exportMessage && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${
                  exportMessage.includes('success') || exportMessage.includes('exported')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : exportMessage.includes('Failed') || exportMessage.includes('error')
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {exportMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={exportingPDF}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingPDF ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Preparing PDF…</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download as PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportToGoogleDocs}
                  disabled={exportingGoogleDocs}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingGoogleDocs ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Preparing…</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Export to Google Docs</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AutoGrowTextareaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function AutoGrowTextarea({ label, placeholder, value, onChange }: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-semibold text-slate-900">
        {label}
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none overflow-hidden text-slate-900 placeholder:text-slate-400"
        rows={2}
      />
    </div>
  );
}
