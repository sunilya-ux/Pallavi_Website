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
