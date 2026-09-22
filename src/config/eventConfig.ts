export const eventName = 'Event';
export const eventDate = '2026-10-31';
export const eventDateLabel = '31 Oct 2026';
export const bannerText = 'Live Event · 31 Oct 2026 · Delhi · Only 20 seats';
export const tagline = 'Build Your Passion Coaching Business Ready in Just 1 Day';
export const description = 'A full day with Pallavi Chatterjee, an award-winning Life & Business Coach with 18 years of experience. Leave with clarity on your niche, a signature offer, and a 90-day launch plan.';
export const timeLabel = '9:00 AM – 6:00 PM';
export const venueName = 'Park Inn by Radisson, New Delhi IP Extension';
export const seatsLabel = 'Only 20 seats';
export const heroImage = '';

export const aboutHeading = 'Your Coaching Business Needs This Whole Day';
export const aboutPoints = [
  'You know you want to coach but cannot name your niche',
  'You copy what other coaches do and blend in with everyone',
  'Your offers feel vague and people do not buy them',
  'You have no consistent way to attract and enrol new clients',
];

export type ScheduleItem = { time: string; title: string; description: string };
export const schedule: ScheduleItem[] = [
  { time: '9:00 AM', title: 'Registration & Welcome', description: 'Get settled and meet the room' },
  { time: '9:30 AM', title: 'From Passion to Profession', description: 'Find your why and your niche' },
  { time: '10:15 AM', title: 'Know Your Ideal Client', description: 'Identify exactly who you serve' },
  { time: '11:00 AM', title: 'Tea Break & Networking', description: '' },
  { time: '11:15 AM', title: 'Shape Your Signature Offer', description: 'Build a coaching package people want' },
  { time: '12:15 PM', title: 'Price With Confidence', description: 'Set prices without hesitation' },
  { time: '1:00 PM', title: 'Lunch', description: '' },
  { time: '2:00 PM', title: 'Attract Clients', description: 'Content & visibility basics' },
  { time: '3:00 PM', title: 'Discovery Calls', description: 'How to enrol clients' },
  { time: '3:45 PM', title: 'Tea Break', description: '' },
  { time: '4:00 PM', title: 'Set Up Your Systems', description: 'Booking, payments, follow-up' },
  { time: '4:45 PM', title: 'Your 90-Day Launch Plan', description: 'Work session' },
  { time: '5:30 PM', title: 'Q&A & Closing', description: '' },
];

function getIndiaToday(): string {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get('previewDate');
  if (preview) return preview;

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isEventActive(): boolean {
  return getIndiaToday() <= eventDate;
}

export function getDaysUntilEvent(): number {
  const today = getIndiaToday();
  const target = eventDate;
  const diffMs = new Date(target).getTime() - new Date(today).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
