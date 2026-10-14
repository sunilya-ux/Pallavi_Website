import { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  BookOpen,
  Brain,
  Briefcase,
  CalendarHeart,
  Dumbbell,
  Flower2,
  Gem,
  GraduationCap,
  Handshake,
  Heart,
  HelpCircle,
  Home,
  Leaf,
  MessageSquareQuote,
  MonitorPlay,
  Phone,
  Plane,
  ShoppingBag,
  Signpost,
  Smile,
  Sparkles,
  Star,
  Sunrise,
  Target,
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

export interface HighlightItem {
  use_for: string;
  icon: string;
}

interface HighlightCoversProps {
  palette: HighlightPaletteItem[];
  highlights: HighlightItem[];
}

const ICONS: Record<string, LucideIcon> = {
  Signpost,
  UserRound,
  MessageSquareQuote,
  Trophy,
  Handshake,
  GraduationCap,
  MonitorPlay,
  Sunrise,
  ShoppingBag,
  Phone,
  HelpCircle,
  CalendarHeart,
  Heart,
  Leaf,
  TrendingUp,
  Users,
  Plane,
  Utensils,
  BookOpen,
  Briefcase,
  Dumbbell,
  Brain,
  Flower2,
  Sparkles,
  Star,
  Gem,
  Home,
  Baby,
  Smile,
  Target,
};

const FALLBACK_ICON = 'Sparkles';

interface CoverColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

function validHex(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function paletteColor(
  palette: HighlightPaletteItem[],
  role: string,
  position: number,
  fallback: string,
): string {
  const roleMatch = palette.find((item) => item.role.trim().toLowerCase() === role.toLowerCase());
  return validHex(roleMatch?.hex || palette[position]?.hex, fallback);
}

function mixColor(hex: string, target: string, amount: number): string {
  const value = hex.slice(1);
  const targetValue = target.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const targetRed = Number.parseInt(targetValue.slice(0, 2), 16);
  const targetGreen = Number.parseInt(targetValue.slice(2, 4), 16);
  const targetBlue = Number.parseInt(targetValue.slice(4, 6), 16);
  const mix = (channel: number, targetChannel: number) => Math.round(channel + (targetChannel - channel) * amount);
  return `#${[mix(red, targetRed), mix(green, targetGreen), mix(blue, targetBlue)].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function getIcon(iconName: string): LucideIcon {
  return ICONS[iconName] || ICONS[FALLBACK_ICON];
}

function CoverSvg({
  item,
  index,
  colors,
}: {
  item: HighlightItem;
  index: number;
  colors: CoverColors;
}) {
  const Icon = getIcon(item.icon);
  const isDark = index % 2 === 0;
  const accentLight = mixColor(colors.accent, '#ffffff', 0.4);
  const accentDark = mixColor(colors.accent, '#000000', 0.3);
  const primaryLight = mixColor(colors.primary, '#ffffff', 0.12);
  const primaryDark = mixColor(colors.primary, '#000000', 0.18);
  const secondaryLight = mixColor(colors.background, colors.secondary, 0.12);
  const waveColor = isDark ? mixColor(colors.primary, '#ffffff', 0.12) : mixColor(colors.background, colors.secondary, 0.25);
  const gradientId = `highlight-inner-${index}`;
  const ringGradientId = `highlight-ring-${index}`;
  const clipId = `highlight-clip-${index}`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentLight} />
          <stop offset="38%" stopColor={colors.accent} />
          <stop offset="70%" stopColor={accentDark} />
          <stop offset="100%" stopColor={accentLight} />
        </linearGradient>
        <radialGradient id={gradientId} cx="50%" cy="38%" r="72%">
          {isDark ? (
            <>
              <stop offset="0%" stopColor={primaryLight} />
              <stop offset="100%" stopColor={primaryDark} />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor={colors.background} />
              <stop offset="100%" stopColor={secondaryLight} />
            </>
          )}
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="540" cy="540" r="454" />
        </clipPath>
      </defs>
      <circle cx="540" cy="540" r="500" fill={`url(#${gradientId})`} stroke={`url(#${ringGradientId})`} strokeWidth="34" />
      <circle cx="540" cy="540" r="468" fill="none" stroke={accentLight} strokeWidth="2" opacity="0.85" />
      <g clipPath={`url(#${clipId})`} opacity="0.2" fill={waveColor}>
        <path d="M40 820C220 720 350 790 540 830c190 40 320 110 500-10v310H40z" />
      </g>
      <g fill={colors.accent} opacity="0.9">
        <path d="M790 230l8 25 25 8-25 8-8 25-8-25-25-8 25-8z" />
        <path d="M875 285l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" />
        <path d="M735 255l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" />
      </g>
      <g stroke={accentLight} strokeWidth="9" strokeLinecap="round" opacity="0.75">
        <path d="M515 250v-34" />
        <path d="M580 250l10-32" />
        <path d="M450 270l-17-28" />
      </g>
      <Icon
        x="315"
        y="285"
        width="450"
        height="450"
        color={isDark ? colors.background : colors.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function createColors(palette: HighlightPaletteItem[]): CoverColors {
  return {
    primary: paletteColor(palette, 'Primary', 0, '#0f766e'),
    secondary: paletteColor(palette, 'Secondary', 1, '#14b8a6'),
    accent: paletteColor(palette, 'Accent', 2, '#f59e0b'),
    background: paletteColor(palette, 'Background', 3, '#f8fafc'),
    text: paletteColor(palette, 'Text', 4, '#0f172a'),
  };
}

export default function HighlightCovers({ palette, highlights }: HighlightCoversProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = createColors(palette);
  const covers = highlights.slice(0, 7);

  useEffect(() => () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  const showStatus = (status: 'success' | 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setDownloadStatus(status);
    statusTimerRef.current = setTimeout(() => setDownloadStatus('idle'), 2200);
  };

  const downloadCover = async (item: HighlightItem, index: number) => {
    try {
      const svgMarkup = renderToStaticMarkup(<CoverSvg item={item} index={index} colors={colors} />);
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
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
      context.fillRect(0, 0, 1080, 1920);
      context.drawImage(image, 0, 420, 1080, 1080);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `highlight-${index + 1}.png`;
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
    for (let index = 0; index < covers.length; index += 1) {
      await downloadCover(covers[index], index);
      if (index < covers.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">📸 Your Instagram Highlight Covers</h3>
      <p className="text-sm text-slate-600 mb-6">
        Made in your brand colours for your niche. Tap a cover to download it, then add your own highlight name in Instagram.
      </p>

      <div className="flex items-center justify-between gap-3 mb-5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Preview</h4>
        <button
          type="button"
          onClick={downloadAll}
          disabled={covers.length === 0}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs sm:text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true">⬇</span>
          Download all covers
        </button>
      </div>

      {downloadStatus === 'success' && <p className="text-sm text-teal-700 font-medium mb-3">Downloaded!</p>}
      {downloadStatus === 'error' && <p className="text-sm text-red-600 font-medium mb-3">Couldn&apos;t download. Please try again.</p>}

      {covers.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Your covers will appear here.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 items-start">
          {covers.map((item, index) => (
            <button
              key={`${item.use_for}-${index}`}
              type="button"
              onClick={() => downloadCover(item, index)}
              className="group flex min-w-0 flex-col items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50 transition-colors"
              aria-label={`Download highlight ${index + 1}`}
            >
              <span className="block w-[90px] h-[90px] lg:w-[120px] lg:h-[120px] rounded-full overflow-hidden shadow-[0_8px_18px_rgba(15,23,42,0.16)] group-hover:shadow-[0_10px_22px_rgba(15,23,42,0.24)] transition-shadow">
                <CoverSvg item={item} index={index} colors={colors} />
              </span>
              <span className="text-[10px] sm:text-[11px] leading-snug text-center break-words max-w-full" style={{ color: colors.text }}>
                Use for: {item.use_for}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
