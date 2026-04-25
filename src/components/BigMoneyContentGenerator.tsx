import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader, Copy, Check, RotateCcw, Sparkles, Download, X, DollarSign } from 'lucide-react';

interface BigMoneyContentGeneratorProps {
  clientId: string;
}

interface DayEntry {
  day: string;
  theme: string;
  post_type: string;
  idea: string;
  caption: string;
  hashtags: string[];
  hook: string;
  notes: string;
  time: string;
}

interface WeekPlan {
  week_plan: DayEntry[];
  final_note: string;
}

const PROGRESS_MESSAGES = [
  "Analyzing your niche and topic...",
  "Crafting Monday's inspirational post...",
  "Building value-driven content for Tuesday...",
  "Designing myth-busting angles for Wednesday...",
  "Writing viral hooks for Thursday...",
  "Creating social proof for Friday...",
  "Polishing weekend content...",
  "Finalizing your 7-day content plan...",
  "Almost done..."
];

const ROW_COLORS: Record<string, { bg: string; badge: string }> = {
  Monday:    { bg: 'bg-rose-50',    badge: 'bg-rose-100 text-rose-700' },
  Tuesday:   { bg: 'bg-sky-50',     badge: 'bg-sky-100 text-sky-700' },
  Wednesday: { bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700' },
  Thursday:  { bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  Friday:    { bg: 'bg-cyan-50',    badge: 'bg-cyan-100 text-cyan-700' },
  Saturday:  { bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700' },
  Sunday:    { bg: 'bg-teal-50',    badge: 'bg-teal-100 text-teal-700' },
};

export default function BigMoneyContentGenerator({ clientId }: BigMoneyContentGeneratorProps) {
  const [formData, setFormData] = useState({
    niche: '',
    topic: '',
    inspirationalStory: '',
    menteeStory: '',
    extraInstructions: '',
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [rawText, setRawText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [progressMessageIndex, setProgressMessageIndex] = useState(0);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [expandedCaptions, setExpandedCaptions] = useState<Record<number, boolean>>({});
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
      }, 4000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [generating]);

  const planToText = (p: WeekPlan): string => {
    const lines = p.week_plan.map((d) =>
      `${d.day} - ${d.theme}\nPost Type: ${d.post_type}\nContent Idea: ${d.idea}\nCaption:\n${d.caption}\nHashtags: ${d.hashtags.join(' ')}\nVideo Hook: ${d.hook}\nNotes: ${d.notes}\nBest Time: ${d.time}`
    );
    return lines.join('\n\n------------------------------------------------\n\n') +
      '\n\n' + (p.final_note || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.niche.trim() || !formData.topic.trim() || !formData.inspirationalStory.trim() || !formData.menteeStory.trim() || !formData.extraInstructions.trim()) {
      setError('Please fill all fields before generating content.');
      return;
    }

    setGenerating(true);
    setPlan(null);
    setRawText('');
    setExpandedCaptions({});

    try {
      abortControllerRef.current = new AbortController();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-big-money-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            niche: formData.niche,
            topic: formData.topic,
            inspirationalStory: formData.inspirationalStory,
            menteeStory: formData.menteeStory,
            extraInstructions: formData.extraInstructions,
            clientId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data: WeekPlan = await response.json();
      setPlan(data);
      setRawText(planToText(data));
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
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = () => {
    setGenerating(true);
    setPlan(null);
    setRawText('');
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  const handleGenerateNew = () => {
    setPlan(null);
    setRawText('');
    setShowForm(true);
    setError('');
    setExpandedCaptions({});
    setFormData({ niche: '', topic: '', inspirationalStory: '', menteeStory: '', extraInstructions: '' });
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
        body: JSON.stringify({ content: rawText, title: 'Big Money Content Plan - 7 Day Instagram Strategy' }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'big-money-content-plan.pdf';
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCaption = (idx: number) => {
    setExpandedCaptions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* ---- FORM ---- */}
      {showForm && !generating && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Big Money Content Generator
            </h2>
          </div>
          <p className="text-slate-600 mb-8 ml-[52px]">
            Generate a high-converting 7-day Instagram content plan
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <FormField label="1. What's your niche?" placeholder="e.g., Life coaching, Fitness training, Business mentoring" value={formData.niche} onChange={(v) => handleChange('niche', v)} type="short" />
            <FormField label="2. What topic are you talking about?" placeholder="e.g., Building confidence, Overcoming fear, Starting a side hustle" value={formData.topic} onChange={(v) => handleChange('topic', v)} type="short" />
            <FormField label="3. Your inspirational story?" placeholder="Share your personal journey or transformation story. This will be used in Monday's inspirational post and Friday's social proof content." value={formData.inspirationalStory} onChange={(v) => handleChange('inspirationalStory', v)} type="long" />
            <FormField label="4. Your mentee's story?" placeholder="Share a success story from someone you've mentored or coached. This will be woven into value posts and social proof content." value={formData.menteeStory} onChange={(v) => handleChange('menteeStory', v)} type="long" />
            <FormField label="5. Any extra instructions?" placeholder="Add any specific angles, themes, upcoming events, offers, or tone preferences you want reflected in this week's content plan." value={formData.extraInstructions} onChange={(v) => handleChange('extraInstructions', v)} type="long" />

            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Content Plan
            </button>
          </form>
        </div>
      )}

      {/* ---- GENERATING ---- */}
      {generating && (
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-12 sm:p-16">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-amber-600 animate-pulse" />
                <Loader className="w-16 h-16 text-amber-500 animate-spin absolute inset-0" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 min-h-[2.5rem] transition-all duration-500">
                {PROGRESS_MESSAGES[progressMessageIndex]}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {progressMessageIndex < PROGRESS_MESSAGES.length - 1 ? "This usually takes about 30-60 seconds." : "Almost there -- thank you for waiting."}
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <button onClick={handleCancelGeneration} className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium">
                <X className="w-4 h-4" />
                <span>Cancel Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- RESULTS TABLE ---- */}
      {plan && !showForm && (
        <div ref={resultRef}>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Your 7-Day Content Plan is Ready</h3>
                <p className="text-sm text-slate-600 mt-0.5">Ready to copy and use for your Instagram strategy</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 1100 }}>
                  <thead>
                    <tr className="bg-slate-800">
                      {['Day & Theme', 'Post Type', 'Content Idea', 'Caption', 'Hashtags', 'Video Hook', 'Notes', 'Time'].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-r border-slate-700 last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.week_plan.map((entry, idx) => {
                      const colors = ROW_COLORS[entry.day] || { bg: 'bg-white', badge: 'bg-slate-100 text-slate-700' };
                      const isExpanded = expandedCaptions[idx];
                      const captionText = (entry.caption || '').replace(/\\n/g, '\n');
                      const showToggle = captionText.length > 200;
                      const displayCaption = showToggle && !isExpanded ? captionText.slice(0, 200) + '...' : captionText;

                      return (
                        <tr key={idx} className={`${colors.bg} border-b border-slate-200 last:border-b-0 hover:brightness-[0.97] transition-all`}>
                          {/* Day & Theme */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[150px] min-w-[150px]">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${colors.badge} mb-1`}>
                              {entry.day}
                            </span>
                            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{entry.theme}</p>
                          </td>
                          {/* Post Type */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[90px] min-w-[90px]">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                              {entry.post_type}
                            </span>
                          </td>
                          {/* Content Idea */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[170px] min-w-[170px]">
                            <p className="text-xs text-slate-700 leading-relaxed">{entry.idea}</p>
                          </td>
                          {/* Caption */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[320px] min-w-[320px]">
                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{displayCaption}</div>
                            {showToggle && (
                              <button onClick={() => toggleCaption(idx)} className="mt-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors">
                                {isExpanded ? 'Show less' : 'Read full caption'}
                              </button>
                            )}
                          </td>
                          {/* Hashtags */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[150px] min-w-[150px]">
                            <div className="flex flex-wrap gap-1">
                              {(entry.hashtags || []).map((tag, i) => (
                                <span key={i} className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${colors.badge} font-medium`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          {/* Video Hook */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[140px] min-w-[140px]">
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">{entry.hook}</p>
                          </td>
                          {/* Notes */}
                          <td className="px-4 py-4 align-top border-r border-slate-100 w-[150px] min-w-[150px]">
                            <p className="text-[11px] text-slate-600 leading-relaxed">{entry.notes}</p>
                          </td>
                          {/* Time */}
                          <td className="px-4 py-4 align-top w-[90px] min-w-[90px]">
                            <span className="text-xs font-semibold text-slate-700">{entry.time}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final note */}
            {plan.final_note && (
              <div className="text-center py-2.5 px-5 bg-slate-100 rounded-lg border border-slate-200 mb-5">
                <p className="text-sm font-medium text-slate-600 italic">{plan.final_note}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium">
                  {copied ? <><Check className="w-5 h-5" /><span>Copied!</span></> : <><Copy className="w-5 h-5" /><span>Copy</span></>}
                </button>
                <button onClick={handleDownloadPDF} disabled={exportingPDF} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {exportingPDF ? <><Loader className="w-5 h-5 animate-spin" /><span>Preparing PDF...</span></> : <><Download className="w-5 h-5" /><span>Download PDF</span></>}
                </button>
                <button onClick={handleRegenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <RotateCcw className="w-5 h-5" /><span>Regenerate</span>
                </button>
                <button onClick={handleGenerateNew} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium">
                  <Sparkles className="w-5 h-5" /><span>Generate New</span>
                </button>
              </div>
              {exportMessage && (
                <div className={`p-3 rounded-lg text-sm ${exportMessage.includes('success') ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {exportMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type: 'short' | 'long';
}

function FormField({ label, placeholder, value, onChange, type }: FormFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-semibold text-slate-900">{label}</label>
      {type === 'short' ? (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-400" />
      ) : (
        <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none overflow-hidden text-slate-900 placeholder:text-slate-400" rows={3} />
      )}
    </div>
  );
}
