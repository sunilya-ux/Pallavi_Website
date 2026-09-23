export const eventName = 'Event';
export const eventDate = '2026-10-31';
export const eventDateLabel = '31 Oct 2026';
export const bannerText = 'Live Event · 31 Oct 2026 · Delhi · Only 20 seats';
export const tagline = 'Build Your Passion Coaching Business in Just 1 Day';
export const description = 'A full day with Pallavi Chatterjee, an award-winning Life & Business Coach with 18 years of experience. Leave with clarity on your niche, a signature offer, and your launch plan.';
export const timeLabel = '9:00 AM – 6:00 PM';
export const venueName = 'Park Inn by Radisson, New Delhi IP Extension';
export const seatsLabel = 'Only 20 seats';
export const heroImage = '/images/host/host-pallavi.jpg';

export type Stat = { value: string; label: string };
export const stats: Stat[] = [
  { value: '18+', label: 'Exp. in Coaching & Spirituality' },
  { value: '1.5 Cr', label: 'Revenue without Ads' },
  { value: '6000+', label: 'Women Served as a Life Coach' },
  { value: '100+', label: 'Coaches Trained Worldwide' },
];

export const aboutHeading = 'You Are Just One Event Away From Being A Successful Life Coach';
export const aboutPoints = [
  "You have decided to become a life coach, but you keep enrolling in masterclasses, courses and certifications—yet you still haven't actually started your coaching business.",
  "You are already certified, but you're struggling to get consistent paying clients and keep wondering, \"If I'm certified, why am I still not earning?\"",
  "You're earning around ₹50,000–₹1 lakh, but the income isn't translating into real profits—and the constant content, calls, follow-ups and marketing are exhausting you.",
  "You're posting content, networking or even running ads, but you don't have one predictable client-acquisition system that consistently brings you qualified coaching clients.",
  "You find yourself copying what other successful coaches are doing or your mentor's strategy or course because you haven't yet figured out your unique niche, positioning and personal brand that makes your audience choose YOU.",
  "You know you're capable of building a much bigger coaching business, but you don't yet have the strategy, systems and AI-powered execution to move from inconsistent income to ₹5–10 lakh+ months and eventually scale towards ₹1 Crore.",
];

export type ScheduleItem = { time: string; title: string; description: string };
export const schedule: ScheduleItem[] = [
  { time: '9:00 – 9:30 AM', title: 'Welcome + Coach Brand Experience', description: 'Registration, networking, event kit and your professional HD brand photoshoot as you step into your coach identity.' },
  { time: '9:30 – 10:30 AM', title: 'Life Coaching Foundations', description: 'Understand what Life Coaching really is, its scope, how it differs from therapy/counselling, and whether coaching is the right career path for you.' },
  { time: '10:30 – 11:15 AM', title: 'LIVE Coaching Experience', description: 'Watch and experience real coaching through live demonstrations — see how powerful coaching conversations create clarity, shifts and action.' },
  { time: '11:15 AM – 12:00 PM', title: 'Break Your Stagnation / Fear to Start Your Business', description: 'Work through the mindset, identity, money and visibility blocks that keep aspiring and existing coaches from moving forward.' },
  { time: '12:00 – 1:00 PM', title: 'Vision → 10X Growth → Activation', description: 'Build your AI-powered Life & Business Vision; existing coaches also identify their biggest growth gaps and next 10X opportunities.' },
  { time: '1:00 – 2:00 PM', title: 'Premium Lunch + Networking', description: 'Enjoy an elaborate lunch in a premium hotel setting while connecting, exchanging ideas and building your coach circle.' },
  { time: '2:00 – 3:00 PM', title: 'AI Life Coach Business Upgrade', description: 'Use AI to work through your niche, positioning, coaching strategy, marketing and business direction — turning expertise into a clear business foundation.' },
  { time: '3:00 – 3:45 PM', title: 'AI Branding + Visibility Experience', description: 'Create your personal brand assets with AI and learn how to show up professionally and confidently as a Life Coach.' },
  { time: '3:45 – 4:45 PM', title: 'Content Creation Challenge', description: 'Create your own content LIVE at the venue, use our viral hooks and ideas, and start building your 30-day content bank — with content posted from the event itself.' },
  { time: '4:45 – 5:30 PM', title: 'The Coach Success Room', description: 'Hear directly from our successful coach mentees as they share their real journeys, monetisation strategies and what helped them create significant coaching income.' },
  { time: '5:30 – 6:00 PM', title: 'Celebrate • Connect • Next Level', description: 'Celebrations, Q&A, networking and your Coach Accelerator Goodie Bag — packed with resources to help you show up and grow like a businesswoman.' },
];

export type Takeaway = { title: string; description: string };
export const takeawaysHeading = "Everything You'll Walk Away With";
export const takeawaysSubheading = "Here's what you'll actually have by the end of the day";
export const takeaways: Takeaway[] = [
  { title: 'Clarity On Your Niche', description: "Know exactly who you serve and why they'll choose you" },
  { title: 'A Signature Offer', description: 'A coaching package people are excited to say yes to' },
  { title: 'Confidence To Price Right', description: 'Set your rates without hesitation or discounting' },
  { title: 'A Content & Visibility Plan', description: 'Know exactly what to post and where to show up' },
  { title: 'A Client Enrolment System', description: 'A repeatable way to turn conversations into clients' },
  { title: 'Your 90-Day Launch Plan', description: 'A clear roadmap for the three months right after this day' },
];

export const beforeAfterHeading = "Here's What Changes After This One Day";
export const beforeItems = [
  "Stuck thinking ₹5-10L/month is your ceiling",
  "Copying other coaches because your brand doesn't stand out",
  "Your offer isn't strong enough to stop people negotiating",
  "Burned out chasing every new marketing hack",
  "Your content or ads bring in low-quality leads",
  "No single system connecting your marketing to sales",
];
export const afterItems = [
  "A clear mindset to build far beyond your current ceiling",
  "A positioning strategy that makes you memorable in your niche",
  "An offer people are ready to pay for without hesitation",
  "One proven growth system instead of scattered tactics",
  "A strategy that attracts higher-quality, ready-to-buy leads",
  "A complete system connecting content, ads, and sales",
];

export type FAQ = { question: string; answer: string };
export const faqHeading = 'Frequently Asked Questions';
export const faqs: FAQ[] = [
  { question: 'Do I need to bring anything?', answer: "Just your laptop and a notebook if you'd like to take notes. Everything else is provided." },
  { question: "What's the difference between General and VIP?", answer: 'VIP includes front-row seating, a personal business audit, additional WhatsApp support, complete event recordings, and lifetime access to a bonus course. General gives you full access to the entire day.' },
  { question: 'Is the ticket refundable?', answer: 'Tickets are non-refundable due to limited seating. You may transfer your seat to someone else up to 48 hours before the event by contacting us on WhatsApp.' },
  { question: 'Is the event online or in-person?', answer: 'This is a full-day, in-person event at Park Inn by Radisson, New Delhi IP Extension.' },
  { question: 'Can I bring a team member?', answer: "Each ticket covers one seat. If you'd like to bring a colleague, please book a separate ticket for them." },
  { question: 'If I have questions, how can I contact you?', answer: 'WhatsApp us at 6386355905 or email info@lifecoachpallavichatterjee.com and we\'ll get back to you.' },
];

export const closingHeading = "It's Not Your Skills Holding You Back";
export const closingSubheading = "It's The System You're Missing";
export const closingTagline = "Learn It. Install It. Scale With It.";
export const closingImage = '';

export const hostName = 'Pallavi Chatterjee';
export const hostTitle = 'Award-Winning Life & Business Coach';
export const hostBio = 'With 18 years of experience, Pallavi has helped hundreds of professionals turn their passion into a thriving coaching business.';
export const hostImage = '/images/host/host-pallavi-award.jpg';
export const galleryImages: string[] = [];
export const videoLinks: string[] = [];

export const venueAddress = 'Park Inn by Radisson, New Delhi IP Extension';
export const venueDescription = "Experience the event at one of Delhi's premium business hotels, offering a comfortable, professional environment with modern conference facilities and warm hospitality.";
export const venueImages = [
  '/images/venue/venue-1-building.jpg',
  '/images/venue/venue-2-banquet.jpg',
  '/images/venue/venue-3-lobby.jpg',
  '/images/venue/venue-4-pool.jpg',
  '/images/venue/venue-5-restaurant.jpg',
  '/images/venue/venue-6-lounge.jpg',
];
export const venueMapUrl = 'https://maps.app.goo.gl/L5xn57qg6oxbDLVAA';

export const ticketPrice = '₹5,500';
export const ticketLabel = 'Full Day Access';
export const ticketInclusions: string[] = [
  'Full access to the entire day, live in the room',
  'The complete system to build your coaching business, step by step',
  'Live implementation — build your offer and plan with guidance, not just theory',
  'Lunch, tea, and coffee included',
  'Network with a room full of ambitious coaches',
  'Only 20 seats available',
];
export const ticketBookingUrl = '';

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
