import { ArrowLeft, CalendarDays, MapPin, Clock, Users, Sparkles, CheckCircle, UserCircle, ImageIcon, PlayCircle, ExternalLink, MinusCircle, XCircle, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import {
  isEventActive,
  eventDateLabel,
  tagline,
  description,
  timeLabel,
  venueName,
  seatsLabel,
  heroImage,
  aboutHeading,
  aboutPoints,
  schedule,
  hostName,
  hostTitle,
  hostBio,
  hostImage,
  hostStoryHeading,
  hostStory,
  galleryImages,
  videoLinks,
  venueAddress,
  venueDescription,
  venueImages,
  venueMapUrl,
  takeawaysHeading,
  takeaways,
  takeawaysClosingLine,
  beforeAfterHeading,
  beforeItems,
  afterItems,
  faqHeading,
  faqs,
  closingHeading,
  closingSubheading,
  closingTagline,
  closingImage,
  ticketPrice,
  ticketLabel,
  ticketInclusions,
  ticketBookingUrl,
  stats,
} from '../config/eventConfig';

export default function EventPage() {
  const active = isEventActive();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E6] via-[#FAF6EE] to-[#F5F0E6] scroll-smooth">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10 pt-16">
        <button
          onClick={() => { window.location.href = '/'; }}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#C9A052] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {active && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700/50 shadow-lg">
            <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between h-12">
              <a href="/" className="text-white font-semibold text-sm whitespace-nowrap hover:text-[#D4AF37] transition-colors">Pallavi Chatterjee</a>
              <div className="flex items-center gap-5 sm:gap-6">
                <a href="#schedule" className="hidden sm:block text-slate-300 hover:text-white text-sm font-medium transition-colors">Schedule</a>
                <a href="#venue" className="hidden sm:block text-slate-300 hover:text-white text-sm font-medium transition-colors">Venue</a>
                <a href="#faq" className="hidden sm:block text-slate-300 hover:text-white text-sm font-medium transition-colors">FAQ</a>
                <a
                  href={ticketBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C9A052] text-black font-semibold text-base px-5 py-2 rounded-lg hover:scale-105 transition-transform whitespace-nowrap"
                >
                  Reserve Your Seat →
                </a>
              </div>
            </div>
          </div>
        )}

        {active ? (
          <>
            <div className="bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center px-8 py-12 md:py-16">
                <div>
                  <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-sm font-medium px-3 py-1 rounded-full mb-5">
                    <Sparkles className="w-4 h-4" />
                    Live Event · Delhi
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
                    {tagline}
                  </h1>
                  <p className="text-[#F5F0E6] text-base sm:text-lg leading-relaxed mb-8">
                    {description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href={ticketBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#D4AF37] text-black font-semibold text-lg px-6 py-3 rounded-lg hover:bg-[#C9A052] transition-colors"
                    >
                      Book Tickets →
                    </a>
                    <a
                      href="#schedule"
                      className="border border-[#D4AF37]/60 text-[#D4AF37] font-semibold text-lg px-6 py-3 rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      See Schedule
                    </a>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-white/10 border border-white/20 min-h-[420px] flex items-center justify-center">
                  {heroImage ? (
                    <img src={heroImage} alt="Event" className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/80 py-16">
                      <CalendarDays className="w-10 h-10" />
                      <span className="text-sm font-medium">Event photo coming soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#F5F0E6] rounded-2xl shadow-md border border-[#D4AF37]/20 -mt-8 mx-4 sm:mx-8 relative z-10 px-6 py-6 sm:py-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="text-sm font-semibold text-slate-800">{eventDateLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                  <div>
                    <div className="text-xs text-slate-500">Time</div>
                    <div className="text-sm font-semibold text-slate-800">{timeLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                  <div>
                    <div className="text-xs text-slate-500">Venue</div>
                    <div className="text-sm font-semibold text-slate-800">{venueName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                  <div>
                    <div className="text-xs text-slate-500">Seats</div>
                    <div className="text-sm font-semibold text-slate-800">{seatsLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#FAF6EE] rounded-xl px-4 py-6 text-center"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-[#9C6B12] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 leading-snug">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* About section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {aboutHeading}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                  Sound familiar? You are not alone — this day is designed to fix every one of these.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {aboutPoints.map((point, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 flex items-start gap-4"
                  >
                    <CheckCircle className="w-5 h-5 text-[#C9A052] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule section */}
            <div id="schedule" className="mt-16 sm:mt-20 scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  1 Full Day, Fully Planned
                </h2>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                  Every hour is mapped out so you leave with a business, not just notes.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 max-w-3xl mx-auto px-6 sm:px-8 py-6 sm:py-8">
                {schedule.map((item, i) => (
                  <div key={i}>
                    {i > 0 && <div className="border-t border-slate-100 my-4 sm:my-5" />}
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                      <div className="text-sm font-bold text-[#9C6B12] sm:w-32 flex-shrink-0">
                        {item.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-slate-800">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Takeaways section */}
            <div className="mt-16 sm:mt-20">
              <div className="bg-slate-900 rounded-2xl px-6 sm:px-10 py-12 sm:py-16">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {takeawaysHeading}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
                  {takeaways.map((item, i) => (
                    <div
                      key={i}
                      className="bg-slate-800 rounded-xl px-6 py-6 flex flex-col gap-3"
                    >
                      <CheckCircle className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 text-center">
                  <p className="text-sm sm:text-base text-slate-400 mb-3">
                    You don't leave with more information.
                  </p>
                  <p className="text-base sm:text-lg font-bold text-white mb-6">
                    You leave with <span className="text-[#D4AF37]">BUSINESS ASSETS, STRATEGY & ACTION READY TO EXECUTE.</span>
                  </p>
                  <a
                    href={ticketBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A052] text-black font-bold text-lg px-10 py-4 rounded-lg shadow-lg shadow-black/50 hover:scale-105 hover:shadow-xl transition-all duration-200"
                  >
                    Reserve Your Seat →
                  </a>
                </div>
              </div>
            </div>

            {/* Before / After section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {beforeAfterHeading}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* BEFORE card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md px-6 sm:px-8 py-8 flex flex-col">
                  <div className="text-sm font-bold tracking-wide text-slate-400 mb-6">BEFORE</div>
                  <div className="flex flex-col gap-0">
                    {beforeItems.map((item, i) => (
                      <div key={i} className={i > 0 ? 'border-t border-slate-100 py-4' : 'py-4'}>
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* AFTER card */}
                <div className="bg-slate-900 rounded-2xl shadow-md px-6 sm:px-8 py-8 flex flex-col">
                  <div className="text-sm font-bold tracking-wide text-[#D4AF37] mb-6">AFTER A FULL DAY WITH US</div>
                  <div className="flex flex-col gap-0">
                    {afterItems.map((item, i) => (
                      <div key={i} className={i > 0 ? 'border-t border-slate-700/60 py-4' : 'py-4'}>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                          <p className="text-sm sm:text-base text-white leading-relaxed">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 text-center">
                <a
                  href={ticketBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A052] text-black font-bold text-lg px-10 py-4 rounded-lg shadow-lg shadow-[#D4AF37]/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  Reserve Your Seat →
                </a>
              </div>
            </div>

            {/* Host section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Meet Your Host
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5F0E6] to-[#EBE2CC] border border-[#D4AF37]/30 min-h-[280px] flex items-center justify-center">
                  {hostImage ? (
                    <img src={hostImage} alt={hostName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-[#C9A052] py-16">
                      <UserCircle className="w-12 h-12" />
                      <span className="text-sm font-medium">Photo coming soon</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    {hostName}
                  </h3>
                  <p className="text-[#9C6B12] font-semibold text-sm sm:text-base">
                    {hostTitle}
                  </p>
                </div>
              </div>
              <div className="mt-10 max-w-2xl mx-auto">
                <h3 className="text-lg sm:text-xl font-bold text-[#9C6B12] mb-5 text-center">
                  {hostStoryHeading}
                </h3>
                <div className="flex flex-col gap-4">
                  {hostStory.map((para, i) => {
                    const isLast = i === hostStory.length - 1;
                    return isLast ? (
                      <p
                        key={i}
                        className="italic text-slate-700 leading-relaxed border-l-3 border-[#D4AF37] pl-5 text-base sm:text-lg"
                      >
                        {para}
                      </p>
                    ) : (
                      <p key={i} className="text-slate-600 leading-relaxed text-base sm:text-lg">
                        {para}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gallery section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Real Wins From Real Coaches
                </h2>
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {galleryImages.map((item, i) => (
                  <div
                    key={i}
                    className="mb-4 sm:mb-6 break-inside-avoid rounded-xl overflow-hidden shadow-sm border border-slate-200"
                  >
                    <img src={item} alt={`Testimonial ${i + 1}`} className="w-full h-auto block" />
                  </div>
                ))}
              </div>
            </div>

            {/* Video section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Watch & Get Inspired
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                {videoLinks.map((video, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm aspect-video relative">
                      {playingVideo === i ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                          title={`Video ${i + 1}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <button
                          onClick={() => setPlayingVideo(i)}
                          className="w-full h-full relative group cursor-pointer"
                          aria-label={`Play video: ${video.caption}`}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                            alt={`Video ${i + 1} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                            <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 group-hover:bg-black/70 flex items-center justify-center transition-colors">
                              <PlayCircle className="w-8 h-8 sm:w-9 sm:h-9 text-white" fill="white" stroke="#9C6B12" />
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                      <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">{video.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue section */}
            <div id="venue" className="mt-16 sm:mt-20 scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                  Venue of the Event
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center max-w-5xl mx-auto">
                <div className="md:col-span-2 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm aspect-[3/4]">
                  <img
                    src={venueImages[0]}
                    alt={`${venueName} building`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    {venueName}
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-[#9C6B12] mb-4">
                    {venueAddress}
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                    {venueDescription}
                  </p>
                  {venueMapUrl && (
                    <a
                      href={venueMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#9C6B12] hover:text-[#7a520e] hover:underline transition-colors mb-6"
                    >
                      View on Google Maps
                      <ExternalLink className="w-4 h-4" strokeWidth={2.25} />
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                      <div>
                        <div className="text-xs text-slate-500">Date</div>
                        <div className="text-sm font-semibold text-slate-800">{eventDateLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                      <div>
                        <div className="text-xs text-slate-500">Time</div>
                        <div className="text-sm font-semibold text-slate-800">{timeLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                      <div>
                        <div className="text-xs text-slate-500">Venue</div>
                        <div className="text-sm font-semibold text-slate-800">{venueName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#9C6B12] flex-shrink-0" strokeWidth={2.25} />
                      <div>
                        <div className="text-xs text-slate-500">Seats</div>
                        <div className="text-sm font-semibold text-slate-800">{seatsLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets section */}
            <div id="tickets" className="mt-16 sm:mt-20 scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Reserve Your Seat
                </h2>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                  Only 20 seats — book yours before they're gone.
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="bg-[#F5F0E6] rounded-2xl shadow-lg border border-[#D4AF37]/20 px-6 sm:px-10 py-8 sm:py-10">
                  <div className="flex items-center justify-center gap-2 mb-3 bg-[#9C6B12]/8 rounded-full px-4 py-1.5">
                    <Ticket className="w-4 h-4 text-[#9C6B12]" strokeWidth={2.25} />
                    <span className="text-sm font-semibold tracking-wide text-[#9C6B12] uppercase">{ticketLabel}</span>
                  </div>
                  <div className="text-center mb-8">
                    <span className="text-4xl sm:text-5xl font-bold text-[#1a1a1a]">{ticketPrice}</span>
                  </div>
                  <ul className="flex flex-col gap-4 mb-8">
                    {ticketInclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[#C9A052] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center">
                    {ticketBookingUrl ? (
                      <a
                        href={ticketBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A052] text-black font-bold text-lg px-10 py-4 rounded-lg shadow-lg shadow-[#D4AF37]/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
                      >
                        Reserve Your Seat →
                      </a>
                    ) : (
                      <span className="inline-block bg-slate-100 text-slate-400 font-bold px-10 py-4 rounded-lg cursor-not-allowed">
                        Booking Link Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-5">
                    Non-refundable.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ section */}
            <div id="faq" className="mt-16 sm:mt-20 scroll-mt-32">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {faqHeading}
                </h2>
              </div>
              <div className="max-w-3xl mx-auto flex flex-col gap-4">
                {faqs.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                      >
                        <span className="text-sm sm:text-base font-semibold text-slate-800">{faq.question}</span>
                        <Plus
                          className={`w-5 h-5 text-[#9C6B12] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                          strokeWidth={2.25}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-6 pb-5 text-sm sm:text-base text-slate-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Closing section */}
            <div className="mt-16 sm:mt-20">
              <div className="bg-gradient-to-br from-[#F5F0E6] to-[#EBE2CC] rounded-2xl border border-[#D4AF37]/20 shadow-sm px-6 sm:px-10 py-12 sm:py-16 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                  {closingHeading}
                </h2>
                <p className="text-lg sm:text-xl italic text-[#C9A052] mb-8">
                  {closingSubheading}
                </p>
                <div className="max-w-sm mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5F0E6] to-[#EBE2CC] border border-[#D4AF37]/30 aspect-[4/3] flex items-center justify-center mb-8">
                  {closingImage ? (
                    <img src={closingImage} alt={closingHeading} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-[#C9A052] py-16">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-sm font-medium">Photo coming soon</span>
                    </div>
                  )}
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-800 mb-8">
                  {closingTagline}
                </p>
                <a
                  href={ticketBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A052] text-black font-bold text-lg px-10 py-4 rounded-lg shadow-lg shadow-[#D4AF37]/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  Reserve Your Seat →
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-12 text-center">
            <div className="w-16 h-16 bg-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-[#C9A052]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Thank you for attending our event!
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              We loved having you there.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
