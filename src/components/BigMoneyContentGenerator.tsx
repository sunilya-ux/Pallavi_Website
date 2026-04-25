import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Loader, Copy, Check, RotateCcw, Sparkles, Download, X, DollarSign } from 'lucide-react';

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
    <div className="space-y-6">
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

const DAY_STRIPE_COLORS: Record<string, string> = {
  monday: 'bg-rose-50',
  tuesday: 'bg-sky-50',
  wednesday: 'bg-amber-50',
  thursday: 'bg-emerald-50',
  friday: 'bg-cyan-50',
  saturday: 'bg-orange-50',
  sunday: 'bg-teal-50',
};

const DAY_BADGE_COLORS: Record<string, string> = {
  monday: 'bg-rose-100 text-rose-700',
  tuesday: 'bg-sky-100 text-sky-700',
  wednesday: 'bg-amber-100 text-amber-700',
  thursday: 'bg-emerald-100 text-emerald-700',
  friday: 'bg-cyan-100 text-cyan-700',
  saturday: 'bg-orange-100 text-orange-700',
  sunday: 'bg-teal-100 text-teal-700',
};

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
    if (trimmed.startsWith('---') || trimmed.startsWith('**Day') || trimmed === '') continue;
    for (const pattern of dayPatterns) {
      if (pattern.test(trimmed) && (trimmed.includes('—') || trimmed.includes('-'))) {
        const lowerTrimmed = trimmed.toLowerCase();
        if (dayPatterns.some(p => lowerTrimmed.match(new RegExp('^\\**\\s*' + p.source)))) {
          dayStartIndices.push(i);
          break;
        }
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

    const dayTheme = dayLines[0].trim().replace(/^\*+|\*+$/g, '');
    const remaining = dayLines.slice(1);

    const fieldLabels = [
      { keys: ['post type'], field: 'postType' },
      { keys: ['content idea'], field: 'contentIdea' },
      { keys: ['caption'], field: 'caption' },
      { keys: ['hashtag'], field: 'hashtags' },
      { keys: ['video text hook', 'video hook', 'hook'], field: 'videoHook' },
      { keys: ['growth stage', 'growth notes'], field: 'growthNotes' },
      { keys: ['best posting time', 'posting time'], field: 'bestTime' },
    ];

    const sections: Record<string, string[]> = {};
    let currentField = '';

    for (const line of remaining) {
      const lower = line.trim().toLowerCase().replace(/^\*+|\*+$/g, '');
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

  const afterLastDay = lines.slice(dayStartIndices[dayStartIndices.length - 1]).join('\n');
  const updateMatch = afterLastDay.match(/update strategies quarterly[^\n]*/i);
  if (updateMatch) {
    footer = updateMatch[0].trim();
  }

  return { rows, footer };
}

function getDayKey(dayTheme: string): string {
  const lower = dayTheme.toLowerCase();
  for (const day of Object.keys(DAY_STRIPE_COLORS)) {
    if (lower.startsWith(day)) return day;
  }
  return 'monday';
}

const COLUMNS = [
  { label: 'Day & Theme', width: 'w-[160px] min-w-[160px]' },
  { label: 'Post Type', width: 'w-[90px] min-w-[90px]' },
  { label: 'Content Idea', width: 'w-[180px] min-w-[180px]' },
  { label: 'Caption', width: 'w-[340px] min-w-[340px]' },
  { label: 'Hashtags', width: 'w-[160px] min-w-[160px]' },
  { label: 'Video Hook', width: 'w-[140px] min-w-[140px]' },
  { label: 'Notes', width: 'w-[160px] min-w-[160px]' },
  { label: 'Time', width: 'w-[100px] min-w-[100px]' },
];

function ContentTable({ content }: { content: string }) {
  const { rows, footer } = useMemo(() => parseDayRows(content), [content]);
  const [expandedCaptions, setExpandedCaptions] = useState<Record<number, boolean>>({});

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 sm:p-8 mb-6 shadow-sm">
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base">
          {content}
        </div>
      </div>
    );
  }

  const toggleCaption = (idx: number) => {
    setExpandedCaptions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-800">
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className={`${col.width} px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider border-r border-slate-700 last:border-r-0`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const dayKey = getDayKey(row.dayTheme);
                const stripe = DAY_STRIPE_COLORS[dayKey] || 'bg-white';
                const badge = DAY_BADGE_COLORS[dayKey] || 'bg-slate-100 text-slate-700';
                const isExpanded = expandedCaptions[idx];
                const captionPreview = row.caption.length > 180 && !isExpanded
                  ? row.caption.slice(0, 180) + '...'
                  : row.caption;

                const dayName = row.dayTheme.split(/[—\-]/)[0].trim();
                const theme = row.dayTheme.includes('—')
                  ? row.dayTheme.split('—').slice(1).join('—').trim()
                  : row.dayTheme.includes(' - ')
                    ? row.dayTheme.split(' - ').slice(1).join(' - ').trim()
                    : '';

                return (
                  <tr
                    key={idx}
                    className={`${stripe} border-b border-slate-200 last:border-b-0 hover:brightness-[0.97] transition-all`}
                  >
                    <td className={`${COLUMNS[0].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${badge} mb-1.5`}>
                        {dayName}
                      </span>
                      {theme && (
                        <p className="text-xs text-slate-500 leading-snug">{theme}</p>
                      )}
                    </td>
                    <td className={`${COLUMNS[1].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                        {row.postType}
                      </span>
                    </td>
                    <td className={`${COLUMNS[2].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <p className="text-sm text-slate-700 leading-relaxed">{row.contentIdea}</p>
                    </td>
                    <td className={`${COLUMNS[3].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {captionPreview}
                      </div>
                      {row.caption.length > 180 && (
                        <button
                          onClick={() => toggleCaption(idx)}
                          className="mt-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          {isExpanded ? 'Show less' : 'Read full caption'}
                        </button>
                      )}
                    </td>
                    <td className={`${COLUMNS[4].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <div className="flex flex-wrap gap-1">
                        {row.hashtags.split(/\s+/).filter(t => t.startsWith('#')).map((tag, i) => (
                          <span key={i} className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${badge} font-medium`}>
                            {tag}
                          </span>
                        ))}
                        {!row.hashtags.includes('#') && (
                          <span className="text-xs text-slate-600">{row.hashtags}</span>
                        )}
                      </div>
                    </td>
                    <td className={`${COLUMNS[5].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{row.videoHook}</p>
                    </td>
                    <td className={`${COLUMNS[6].width} px-4 py-4 align-top border-r border-slate-200`}>
                      <p className="text-xs text-slate-600 leading-relaxed">{row.growthNotes}</p>
                    </td>
                    <td className={`${COLUMNS[7].width} px-4 py-4 align-top`}>
                      <span className="text-xs font-semibold text-slate-700">{row.bestTime}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {footer && (
        <div className="text-center py-3 px-6 bg-slate-100 rounded-lg border border-slate-200">
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
