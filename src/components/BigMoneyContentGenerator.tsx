import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Loader, Copy, Check, RotateCcw, Sparkles, Download, X, DollarSign, Calendar, Type, Lightbulb, FileText, Hash, Zap, TrendingUp, Clock } from 'lucide-react';

interface BigMoneyContentGeneratorProps {
  clientId: string;
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
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      setProgressMessageIndex(0);
      interval = setInterval(() => {
        setProgressMessageIndex((prev) => {
          if (prev < PROGRESS_MESSAGES.length - 1) return prev + 1;
          return prev;
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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
    setFormData({
      niche: '',
      topic: '',
      inspirationalStory: '',
      menteeStory: '',
      extraInstructions: '',
    });
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
            title: 'Big Money Content Plan - 7 Day Instagram Strategy',
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showForm && !generating && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
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
            <FormField
              label="1. What's your niche?"
              placeholder="e.g., Life coaching, Fitness training, Business mentoring"
              value={formData.niche}
              onChange={(value) => handleChange('niche', value)}
              type="short"
            />

            <FormField
              label="2. What topic are you talking about?"
              placeholder="e.g., Building confidence, Overcoming fear, Starting a side hustle"
              value={formData.topic}
              onChange={(value) => handleChange('topic', value)}
              type="short"
            />

            <FormField
              label="3. Your inspirational story?"
              placeholder="Share your personal journey or transformation story. This will be used in Monday's inspirational post and Friday's social proof content."
              value={formData.inspirationalStory}
              onChange={(value) => handleChange('inspirationalStory', value)}
              type="long"
            />

            <FormField
              label="4. Your mentee's story?"
              placeholder="Share a success story from someone you've mentored or coached. This will be woven into value posts and social proof content."
              value={formData.menteeStory}
              onChange={(value) => handleChange('menteeStory', value)}
              type="long"
            />

            <FormField
              label="5. Any more instructions, ideas, or suggestions for this week's content?"
              placeholder="Add any specific angles, themes, upcoming events, offers, or tone preferences you want reflected in this week's content plan."
              value={formData.extraInstructions}
              onChange={(value) => handleChange('extraInstructions', value)}
              type="long"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Content Plan
            </button>
          </form>
        </div>
      )}

      {generating && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-12 sm:p-16">
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
                {progressMessageIndex < PROGRESS_MESSAGES.length - 1
                  ? "This usually takes about 30-60 seconds."
                  : "Almost there -- thank you for waiting."}
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
        <div ref={resultRef} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Your 7-Day Content Plan is Ready
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Ready to copy and use for your Instagram strategy
              </p>
            </div>
          </div>

          <ContentTable content={aiContent} />

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
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
                onClick={handleGenerateNew}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate New</span>
              </button>
            </div>

            <div className="pt-2 border-t border-amber-200">
              <p className="text-sm text-slate-600 mb-3">Export your content plan:</p>

              {exportMessage && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${
                  exportMessage.includes('success') || exportMessage.includes('exported')
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
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
                      <span>Preparing PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download as PDF</span>
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

const DAY_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  monday: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', text: 'text-rose-700' },
  tuesday: { bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', text: 'text-sky-700' },
  wednesday: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  thursday: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  friday: { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', text: 'text-cyan-700' },
  saturday: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  sunday: { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', text: 'text-teal-700' },
};

const FIELD_META = [
  { key: 'postType', label: 'Post Type', icon: Type },
  { key: 'contentIdea', label: 'Content Idea', icon: Lightbulb },
  { key: 'caption', label: 'Caption', icon: FileText },
  { key: 'hashtags', label: 'Hashtags', icon: Hash },
  { key: 'videoHook', label: 'Video Text Hook', icon: Zap },
  { key: 'growthNotes', label: 'Growth Stage Notes', icon: TrendingUp },
  { key: 'bestTime', label: 'Best Posting Time', icon: Clock },
];

interface DayRow {
  dayTheme: string;
  postType: string;
  contentIdea: string;
  caption: string;
  hashtags: string;
  videoHook: string;
  growthNotes: string;
  bestTime: string;
}

function parseDayRows(content: string): { rows: DayRow[]; footer: string } {
  const dayPatterns = [
    /monday/i, /tuesday/i, /wednesday/i, /thursday/i,
    /friday/i, /saturday/i, /sunday/i,
  ];

  const lines = content.split('\n');
  const dayStartIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('---')) continue;
    for (const pattern of dayPatterns) {
      if (pattern.test(trimmed) && trimmed.includes('—')) {
        dayStartIndices.push(i);
        break;
      }
    }
  }

  if (dayStartIndices.length === 0) {
    return { rows: [], footer: '' };
  }

  const rows: DayRow[] = [];
  let footer = '';

  for (let d = 0; d < dayStartIndices.length; d++) {
    const startIdx = dayStartIndices[d];
    const endIdx = d + 1 < dayStartIndices.length
      ? dayStartIndices[d + 1]
      : lines.length;

    const dayLines = lines.slice(startIdx, endIdx)
      .filter(l => !l.trim().startsWith('---'))
      .filter(l => l.trim() !== '');

    if (dayLines.length === 0) continue;

    const dayTheme = dayLines[0].trim();
    const remaining = dayLines.slice(1);

    const fieldLabels = [
      { keys: ['post type'], field: 'postType' },
      { keys: ['content idea'], field: 'contentIdea' },
      { keys: ['caption'], field: 'caption' },
      { keys: ['hashtag'], field: 'hashtags' },
      { keys: ['video text hook', 'hook'], field: 'videoHook' },
      { keys: ['growth stage', 'growth notes'], field: 'growthNotes' },
      { keys: ['best posting time', 'posting time'], field: 'bestTime' },
    ];

    const sections: Record<string, string[]> = {};
    let currentField = '';

    for (const line of remaining) {
      const lower = line.trim().toLowerCase();
      let matched = false;

      for (const fl of fieldLabels) {
        for (const key of fl.keys) {
          if (lower.startsWith(key) || lower.includes(key + ':')) {
            currentField = fl.field;
            const colonIdx = line.indexOf(':');
            const afterColon = colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : '';
            if (afterColon) {
              sections[currentField] = [afterColon];
            } else {
              sections[currentField] = [];
            }
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      if (!matched && currentField) {
        if (!sections[currentField]) sections[currentField] = [];
        sections[currentField].push(line.trim());
      }
    }

    const getField = (field: string) => (sections[field] || []).join('\n').trim();

    let postType = getField('postType');
    if (!postType && remaining.length > 0) {
      const first = remaining[0].trim().toLowerCase();
      if (['reel', 'carousel', 'static', 'live', 'story'].some(t => first.includes(t))) {
        postType = remaining[0].trim();
      }
    }

    rows.push({
      dayTheme,
      postType: postType || '',
      contentIdea: getField('contentIdea'),
      caption: getField('caption'),
      hashtags: getField('hashtags'),
      videoHook: getField('videoHook'),
      growthNotes: getField('growthNotes'),
      bestTime: getField('bestTime'),
    });
  }

  const lastDayEnd = dayStartIndices.length > 0
    ? dayStartIndices[dayStartIndices.length - 1]
    : lines.length;
  const afterLastDay = lines.slice(lastDayEnd).join('\n');
  const updateMatch = afterLastDay.match(/update strategies quarterly[^\n]*/i);
  if (updateMatch) {
    footer = updateMatch[0].trim();
  }

  return { rows, footer };
}

function ContentTable({ content }: { content: string }) {
  const { rows, footer } = useMemo(() => parseDayRows(content), [content]);

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 sm:p-8 mb-6 shadow-sm">
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base">
          {content}
        </div>
      </div>
    );
  }

  const getDayKey = (dayTheme: string) => {
    const lower = dayTheme.toLowerCase();
    for (const day of Object.keys(DAY_COLORS)) {
      if (lower.startsWith(day)) return day;
    }
    return 'monday';
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="hidden sm:grid grid-cols-8 gap-2 px-4 py-3 bg-slate-800 rounded-lg text-xs font-semibold text-slate-200 uppercase tracking-wider">
        <div className="col-span-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Day</div>
        <div className="col-span-1 flex items-center gap-1"><Type className="w-3 h-3" /> Type</div>
        <div className="col-span-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Idea</div>
        <div className="col-span-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Caption</div>
        <div className="col-span-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Tags</div>
        <div className="col-span-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Hook</div>
        <div className="col-span-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</div>
      </div>

      {rows.map((row, idx) => {
        const dayKey = getDayKey(row.dayTheme);
        const colors = DAY_COLORS[dayKey] || DAY_COLORS.monday;

        return (
          <div
            key={idx}
            className={`${colors.bg} ${colors.border} border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className={`px-4 py-3 ${colors.border} border-b flex items-center gap-3`}>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                <Calendar className="w-3.5 h-3.5" />
                {row.dayTheme.split('—')[0].trim()}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {row.dayTheme.includes('—') ? row.dayTheme.split('—').slice(1).join('—').trim() : ''}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {FIELD_META.map(({ key, label, icon: Icon }) => {
                const value = row[key as keyof DayRow];
                if (!value || key === 'dayTheme') return null;

                return (
                  <div key={key} className="flex gap-3">
                    <div className="flex-shrink-0 w-32 sm:w-36">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {key === 'caption' ? (
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {value}
                        </div>
                      ) : key === 'hashtags' ? (
                        <div className="flex flex-wrap gap-1.5">
                          {value.split(/\s+/).filter(t => t.startsWith('#')).map((tag, i) => (
                            <span key={i} className={`inline-block text-xs px-2 py-0.5 rounded-full ${colors.badge} font-medium`}>
                              {tag}
                            </span>
                          ))}
                          {!value.includes('#') && <span className="text-sm text-slate-700">{value}</span>}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-700">{value}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {footer && (
        <div className="text-center py-4 px-6 bg-slate-100 rounded-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-600 italic">{footer}</p>
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
      <label className="block text-sm sm:text-base font-semibold text-slate-900">
        {label}
      </label>
      {type === 'short' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none overflow-hidden text-slate-900 placeholder:text-slate-400"
          rows={3}
        />
      )}
    </div>
  );
}
