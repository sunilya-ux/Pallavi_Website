import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader, Copy, Check, RotateCcw, Sparkles, Download, X, DollarSign } from 'lucide-react';

interface BigMoneyContentGeneratorProps {
  clientId: string;
}

interface DayEntry {
  day: string;
  theme: string;
  postType: string;
  idea: string;
  caption: string;
  hashtags: string;
  hook: string;
  notes: string;
  time: string;
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
  monday:    { bg: 'bg-rose-50/60',    badge: 'bg-rose-100 text-rose-700' },
  tuesday:   { bg: 'bg-sky-50/60',     badge: 'bg-sky-100 text-sky-700' },
  wednesday: { bg: 'bg-amber-50/60',   badge: 'bg-amber-100 text-amber-700' },
  thursday:  { bg: 'bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-700' },
  friday:    { bg: 'bg-cyan-50/60',    badge: 'bg-cyan-100 text-cyan-700' },
  saturday:  { bg: 'bg-orange-50/60',  badge: 'bg-orange-100 text-orange-700' },
  sunday:    { bg: 'bg-teal-50/60',    badge: 'bg-teal-100 text-teal-700' },
};

const FIELD_KEYS = ['day', 'theme', 'postType', 'idea', 'caption', 'hashtags', 'hook', 'notes', 'time'] as const;

const LABEL_MAP: Record<string, typeof FIELD_KEYS[number]> = {
  'day': 'day',
  'theme': 'theme',
  'post type': 'postType',
  'content idea': 'idea',
  'caption': 'caption',
  'hashtags': 'hashtags',
  'hook': 'hook',
  'growth notes': 'notes',
  'best time': 'time',
};

function parseSections(content: string): { entries: DayEntry[]; footer: string } {
  const lines = content.split('\n');
  const entries: DayEntry[] = [];
  let current: Partial<DayEntry> = {};
  let currentKey: typeof FIELD_KEYS[number] | '' = '';
  let buffer: string[] = [];
  let footer = '';

  const flush = () => {
    if (currentKey && buffer.length > 0) {
      const val = buffer.join('\n').trim();
      if (currentKey === 'day' && !current.day) {
        current.day = val;
      } else {
        (current as any)[currentKey] = val;
      }
    }
    buffer = [];
  };

  const pushEntry = () => {
    flush();
    if (current.day) {
      entries.push({
        day: current.day || '',
        theme: current.theme || '',
        postType: current.postType || '',
        idea: current.idea || '',
        caption: current.caption || '',
        hashtags: current.hashtags || '',
        hook: current.hook || '',
        notes: current.notes || '',
        time: current.time || '',
      });
    }
    current = {};
    currentKey = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^-{3,}$/.test(trimmed) || trimmed === '') {
      if (currentKey === 'caption') {
        buffer.push('');
      }
      continue;
    }

    if (/^update strategies quarterly/i.test(trimmed)) {
      flush();
      footer = trimmed;
      continue;
    }

    let matched = false;
    const lower = trimmed.toLowerCase().replace(/^\*+|\*+$/g, '');

    for (const [label, key] of Object.entries(LABEL_MAP)) {
      const regex = new RegExp('^' + label.replace(/\s+/g, '\\s+') + '\\s*:', 'i');
      if (regex.test(lower)) {
        if (key === 'day' && current.day) {
          pushEntry();
        }
        flush();
        currentKey = key;
        const colonIdx = trimmed.indexOf(':');
        const afterColon = colonIdx >= 0 ? trimmed.slice(colonIdx + 1).trim() : '';
        if (afterColon) {
          buffer.push(afterColon);
        }
        matched = true;
        break;
      }
    }

    if (!matched && currentKey) {
      buffer.push(trimmed);
    }
  }

  pushEntry();
  return { entries, footer };
}

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
  const [aiContent, setAiContent] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.niche.trim() || !formData.topic.trim() || !formData.inspirationalStory.trim() || !formData.menteeStory.trim() || !formData.extraInstructions.trim()) {
      setError('Please fill all fields before generating content.');
      return;
    }

    setGenerating(true);
    setAiContent('');
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
    setAiContent('');
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  const handleGenerateNew = () => {
    setAiContent('');
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
        body: JSON.stringify({ content: aiContent, title: 'Big Money Content Plan - 7 Day Instagram Strategy' }),
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

  const { entries, footer } = aiContent ? parseSections(aiContent) : { entries: [], footer: '' };

  return (
    <div className="space-y-6">
      {/* FORM */}
      {showForm && !generating && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Big Money Content Generator</h2>
          </div>
          <p className="text-slate-600 mb-8 ml-[52px]">Generate a high-converting 7-day Instagram content plan</p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <FormField label="1. What's your niche?" placeholder="e.g., Life coaching, Fitness training, Business mentoring" value={formData.niche} onChange={(v) => handleChange('niche', v)} variant="short" />
            <FormField label="2. What topic are you talking about?" placeholder="e.g., Building confidence, Overcoming fear, Starting a side hustle" value={formData.topic} onChange={(v) => handleChange('topic', v)} variant="short" />
            <FormField label="3. Your inspirational story?" placeholder="Share your personal journey or transformation story." value={formData.inspirationalStory} onChange={(v) => handleChange('inspirationalStory', v)} variant="long" />
            <FormField label="4. Your mentee's story?" placeholder="Share a success story from someone you've mentored or coached." value={formData.menteeStory} onChange={(v) => handleChange('menteeStory', v)} variant="long" />
            <FormField label="5. Any extra instructions?" placeholder="Add specific angles, themes, events, offers, or tone preferences." value={formData.extraInstructions} onChange={(v) => handleChange('extraInstructions', v)} variant="long" />

            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Content Plan
            </button>
          </form>
        </div>
      )}

      {/* GENERATING */}
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
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 min-h-[2.5rem] transition-all duration-500">{PROGRESS_MESSAGES[progressMessageIndex]}</h2>
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
                <X className="w-4 h-4" /><span>Cancel Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {aiContent && !showForm && (
        <div ref={resultRef}>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Your 7-Day Content Plan is Ready</h3>
                <p className="text-sm text-slate-600 mt-0.5">Scroll the table horizontally to see all columns</p>
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: 1120 }}>
                    <thead>
                      <tr className="bg-slate-800">
                        {['Day & Theme', 'Post Type', 'Content Idea', 'Caption', 'Hashtags', 'Video Hook', 'Notes', 'Time'].map((h) => (
                          <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-r border-slate-700 last:border-r-0 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, idx) => {
                        const dayKey = entry.day.toLowerCase().trim();
                        const colors = ROW_COLORS[dayKey] || { bg: 'bg-white', badge: 'bg-slate-100 text-slate-700' };
                        const isExpanded = expandedCaptions[idx];
                        const captionClean = entry.caption.replace(/\\n/g, '\n');
                        const showToggle = captionClean.length > 220;
                        const displayCaption = showToggle && !isExpanded ? captionClean.slice(0, 220) + '...' : captionClean;
                        const hashtags = entry.hashtags.split(/\s+/).filter(t => t.startsWith('#'));

                        return (
                          <tr key={idx} className={`${colors.bg} border-b border-slate-100 last:border-b-0 transition-colors`}>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 155, minWidth: 155 }}>
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${colors.badge} mb-1`}>
                                {entry.day}
                              </span>
                              {entry.theme && (
                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{entry.theme}</p>
                              )}
                            </td>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 90, minWidth: 90 }}>
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">
                                {entry.postType}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 175, minWidth: 175 }}>
                              <p className="text-xs text-slate-700 leading-relaxed">{entry.idea}</p>
                            </td>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 330, minWidth: 330 }}>
                              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{displayCaption}</div>
                              {showToggle && (
                                <button onClick={() => toggleCaption(idx)} className="mt-1.5 text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors">
                                  {isExpanded ? 'Show less' : 'Read full caption'}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 150, minWidth: 150 }}>
                              <div className="flex flex-wrap gap-1">
                                {hashtags.length > 0 ? hashtags.map((tag, i) => (
                                  <span key={i} className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${colors.badge} font-medium`}>
                                    {tag}
                                  </span>
                                )) : (
                                  <span className="text-xs text-slate-500">{entry.hashtags}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 140, minWidth: 140 }}>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">{entry.hook}</p>
                            </td>
                            <td className="px-4 py-4 align-top border-r border-slate-100" style={{ width: 155, minWidth: 155 }}>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{entry.notes}</p>
                            </td>
                            <td className="px-4 py-4 align-top" style={{ width: 90, minWidth: 90 }}>
                              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{entry.time}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 mb-5 shadow-sm">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{aiContent}</div>
              </div>
            )}

            {footer && (
              <div className="text-center py-2.5 px-5 bg-slate-100 rounded-lg border border-slate-200 mb-5">
                <p className="text-sm font-medium text-slate-600 italic">{footer}</p>
              </div>
            )}

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
  variant: 'short' | 'long';
}

function FormField({ label, placeholder, value, onChange, variant }: FormFieldProps) {
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
      {variant === 'short' ? (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-400" />
      ) : (
        <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none overflow-hidden text-slate-900 placeholder:text-slate-400" rows={3} />
      )}
    </div>
  );
}
