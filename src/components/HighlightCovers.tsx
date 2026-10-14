import { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CalendarHeart,
  GraduationCap,
  Handshake,
  Heart,
  HelpCircle,
  Leaf,
  MessageSquareQuote,
  MonitorPlay,
  Phone,
  Plane,
  ShoppingBag,
  Signpost,
  Sparkles,
  Sunrise,
  Trophy,
  TrendingUp,
  UserRound,
  Users,
  Utensils,
} from 'lucide-react';

export interface HighlightPaletteItem {
  role: string;
  name: string;
  hex: string;
}

interface HighlightCoversProps {
  palette: HighlightPaletteItem[];
}

interface HighlightRow {
  id: number;
  name: string;
  iconName: string;
  manuallySelected: boolean;
}

interface IconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

const ICON_OPTIONS: IconOption[] = [
  { name: 'Signpost', label: 'Start here', icon: Signpost },
  { name: 'UserRound', label: 'About me', icon: UserRound },
  { name: 'MessageSquareQuote', label: 'Testimonials', icon: MessageSquareQuote },
  { name: 'Trophy', label: 'Wins', icon: Trophy },
  { name: 'Handshake', label: 'Work with me', icon: Handshake },
  { name: 'GraduationCap', label: 'Learning', icon: GraduationCap },
  { name: 'MonitorPlay', label: 'Video', icon: MonitorPlay },
  { name: 'Sunrise', label: 'Lifestyle', icon: Sunrise },
  { name: 'ShoppingBag', label: 'Products', icon: ShoppingBag },
  { name: 'Phone', label: 'Contact', icon: Phone },
  { name: 'HelpCircle', label: 'FAQ', icon: HelpCircle },
  { name: 'CalendarHeart', label: 'Events', icon: CalendarHeart },
  { name: 'Heart', label: 'Family', icon: Heart },
  { name: 'Leaf', label: 'Wellness', icon: Leaf },
  { name: 'TrendingUp', label: 'Money', icon: TrendingUp },
  { name: 'Users', label: 'Community', icon: Users },
  { name: 'Plane', label: 'Travel', icon: Plane },
  { name: 'Utensils', label: 'Food', icon: Utensils },
  { name: 'BookOpen', label: 'Books', icon: BookOpen },
  { name: 'Sparkles', label: 'Sparkles', icon: Sparkles },
];

const KEYWORD_MATCHES: Array<{ keywords: string[]; iconName: string }> = [
  { keywords: ['start', 'begin', 'welcome'], iconName: 'Signpost' },
  { keywords: ['about', 'me', 'story', 'who'], iconName: 'UserRound' },
  { keywords: ['testimonial', 'review', 'feedback', 'love'], iconName: 'MessageSquareQuote' },
  { keywords: ['win', 'result', 'earning', 'success', 'client'], iconName: 'Trophy' },
  { keywords: ['work', 'service', 'offer', 'program', 'coach'], iconName: 'Handshake' },
  { keywords: ['free', 'training', 'class', 'learn', 'course', 'tips'], iconName: 'GraduationCap' },
  { keywords: ['video', 'live', 'reel'], iconName: 'MonitorPlay' },
  { keywords: ['life', 'day', 'lifestyle', 'journey'], iconName: 'Sunrise' },
  { keywords: ['price', 'shop', 'product', 'buy'], iconName: 'ShoppingBag' },
  { keywords: ['contact', 'call', 'book', 'dm'], iconName: 'Phone' },
  { keywords: ['faq', 'question', 'ask'], iconName: 'HelpCircle' },
  { keywords: ['event', 'workshop', 'seminar'], iconName: 'CalendarHeart' },
  { keywords: ['family', 'kids', 'parent', 'mom'], iconName: 'Heart' },
  { keywords: ['health', 'fitness', 'wellness', 'yoga'], iconName: 'Leaf' },
  { keywords: ['money', 'finance', 'business'], iconName: 'TrendingUp' },
  { keywords: ['community', 'group', 'team'], iconName: 'Users' },
  { keywords: ['travel'], iconName: 'Plane' },
  { keywords: ['food', 'recipe'], iconName: 'Utensils' },
  { keywords: ['book', 'read', 'blog'], iconName: 'BookOpen' },
];

const PLACEHOLDERS = [
  'e.g. Start Here',
  'e.g. About Me',
  'e.g. Testimonials',
  'e.g. Work With Me',
  'e.g. Free Tips',
];

const INITIAL_ROWS: HighlightRow[] = PLACEHOLDERS.map((_, index) => ({
  id: index + 1,
  name: '',
  iconName: 'Sparkles',
  manuallySelected: false,
}));

function getIcon(iconName: string): LucideIcon {
  return ICON_OPTIONS.find((option) => option.name === iconName)?.icon || Sparkles;
}

function getAutoIconName(name: string): string {
  const normalizedName = name.toLowerCase();
  const match = KEYWORD_MATCHES.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword)),
  );
  return match?.iconName || 'Sparkles';
}

function getPaletteColor(palette: HighlightPaletteItem[], role: string, fallbackIndex: number, fallback: string): string {
  const matchingColor = palette.find((item) => item.role.trim().toLowerCase() === role.toLowerCase());
  const fallbackColor = palette[fallbackIndex];
  const value = matchingColor?.hex || fallbackColor?.hex || fallback;
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function CoverSvg({
  iconName,
  rowIndex,
  colors,
}: {
  iconName: string;
  rowIndex: number;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
}) {
  const Icon = getIcon(iconName);
  const isDark = rowIndex % 2 === 0;
  const gradientId = `highlight-gradient-${rowIndex}`;
  const edgeColor = isDark ? colors.primary : colors.secondary;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" role="img" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor={isDark ? colors.primary : colors.background} />
          <stop offset="100%" stopColor={edgeColor} />
        </radialGradient>
      </defs>
      <circle cx="540" cy="540" r="500" fill={`url(#${gradientId})`} stroke={colors.accent} strokeWidth="28" />
      <g fill={colors.accent} opacity="0.9">
        <path d="M820 180l8 24 24 8-24 8-8 24-8-24-24-8 24-8z" />
        <path d="M890 250l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" />
        <path d="M770 245l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" />
      </g>
      <Icon
        x="302"
        y="302"
        width="476"
        height="476"
        color={isDark ? colors.background : colors.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cover';
}

export default function HighlightCovers({ palette }: HighlightCoversProps) {
  const [rows, setRows] = useState<HighlightRow[]>(INITIAL_ROWS);
  const [openPickerId, setOpenPickerId] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = {
    primary: getPaletteColor(palette, 'Primary', 0, '#0f766e'),
    secondary: getPaletteColor(palette, 'Secondary', 1, '#14b8a6'),
    accent: getPaletteColor(palette, 'Accent', 2, '#f59e0b'),
    background: getPaletteColor(palette, 'Background', 3, '#f8fafc'),
    text: getPaletteColor(palette, 'Text', 4, '#0f172a'),
  };

  const namedRows = rows.filter((row) => row.name.trim());

  useEffect(() => () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  const showStatus = (status: 'success' | 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setDownloadStatus(status);
    statusTimerRef.current = setTimeout(() => setDownloadStatus('idle'), 2200);
  };

  const updateName = (id: number, name: string) => {
    setRows((currentRows) => currentRows.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        name,
        iconName: row.manuallySelected ? row.iconName : getAutoIconName(name),
      };
    }));
  };

  const chooseIcon = (id: number, iconName: string) => {
    setRows((currentRows) => currentRows.map((row) =>
      row.id === id ? { ...row, iconName, manuallySelected: true } : row,
    ));
    setOpenPickerId(null);
  };

  const removeRow = (id: number) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
    setOpenPickerId(null);
  };

  const addRow = () => {
    setRows((currentRows) => currentRows.length >= 10
      ? currentRows
      : [...currentRows, { id: Date.now(), name: '', iconName: 'Sparkles', manuallySelected: false }]);
  };

  const downloadCover = async (row: HighlightRow, rowIndex: number) => {
    try {
      const svgMarkup = renderToStaticMarkup(
        <CoverSvg iconName={row.iconName} rowIndex={rowIndex} colors={colors} />,
      );
      const image = new Image();
      const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
      image.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('image'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.fillStyle = colors.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, (canvas.height - 1080) / 2, 1080, 1080);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `highlight-${slugify(row.name)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showStatus('success');
    } catch {
      showStatus('error');
    }
  };

  const downloadAll = async () => {
    for (let index = 0; index < namedRows.length; index += 1) {
      await downloadCover(namedRows[index], rows.indexOf(namedRows[index]));
      if (index < namedRows.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">📸 Your Instagram Highlight Covers</h3>
      <p className="text-sm text-slate-600 mb-5">
        Type the names of your Instagram highlights. We&apos;ll create matching covers in your brand colours.
      </p>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-start gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={20}
                value={row.name}
                onChange={(event) => updateName(row.id, event.target.value)}
                placeholder={PLACEHOLDERS[index] || 'e.g. My Highlights'}
                className="w-full min-h-11 px-4 py-2.5 pr-12 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setOpenPickerId(openPickerId === row.id ? null : row.id)}
                aria-label={`Choose icon for ${row.name || `highlight ${index + 1}`}`}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100 transition-colors"
              >
                {(() => {
                  const Icon = getIcon(row.iconName);
                  return <Icon className="w-4 h-4" />;
                })()}
              </button>
              {openPickerId === row.id && (
                <div className="absolute z-20 left-0 right-0 top-full mt-2 p-3 rounded-xl bg-white border border-slate-200 shadow-xl">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {ICON_OPTIONS.map(({ name, label, icon: Icon }) => (
                      <button
                        key={name}
                        type="button"
                        title={label}
                        aria-label={label}
                        onClick={() => chooseIcon(row.id, name)}
                        className={`min-h-11 min-w-11 rounded-lg flex items-center justify-center transition-colors ${row.iconName === name ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-400' : 'bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700'}`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label={`Remove ${row.name || `highlight ${index + 1}`}`}
              className="min-h-11 min-w-11 rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        ))}
      </div>

      {rows.length < 10 && (
        <button
          type="button"
          onClick={addRow}
          className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          + Add another highlight
        </button>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Preview</h4>
          <button
            type="button"
            onClick={downloadAll}
            disabled={namedRows.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs sm:text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">⬇</span>
            Download all covers
          </button>
        </div>

        {downloadStatus === 'success' && <p className="text-sm text-teal-700 font-medium mb-3">Downloaded!</p>}
        {downloadStatus === 'error' && <p className="text-sm text-red-600 font-medium mb-3">Couldn&apos;t download. Please try again.</p>}

        {namedRows.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Your covers will appear here as you type.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
            {namedRows.map((row) => {
              const rowIndex = rows.indexOf(row);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => downloadCover(row, rowIndex)}
                  className="group flex flex-col items-center gap-2 rounded-xl p-2 hover:bg-slate-50 transition-colors"
                  aria-label={`Download ${row.name} highlight cover`}
                >
                  <span className="block w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                    <CoverSvg iconName={row.iconName} rowIndex={rowIndex} colors={colors} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700 text-center break-words max-w-full">
                    {row.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
