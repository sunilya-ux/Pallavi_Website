export const eventName = 'Event';
export const eventDate = '2026-10-31';
export const eventDateLabel = '31 Oct 2026';
export const bannerText = 'Live Event · 31 Oct 2026 · Delhi · Only 20 seats';

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
