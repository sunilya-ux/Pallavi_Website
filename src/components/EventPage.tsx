import { ArrowLeft, CalendarDays, MapPin, Clock, Users, Sparkles, CheckCircle, UserCircle, ImageIcon, PlayCircle, ExternalLink } from 'lucide-react';
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
  galleryImages,
  videoLinks,
  venueAddress,
  venueDescription,
  venueImages,
  venueMapUrl,
} from '../config/eventConfig';

export default function EventPage() {
  const active = isEventActive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <button
          onClick={() => { window.location.href = '/'; }}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {active ? (
          <>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center px-8 py-12 md:py-16">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full mb-5">
                    <Sparkles className="w-4 h-4" />
                    Live Event · Delhi
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
                    {tagline}
                  </h1>
                  <p className="text-emerald-50 text-base sm:text-lg leading-relaxed mb-8">
                    {description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="#tickets"
                      className="bg-white text-emerald-700 font-semibold px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Book Tickets →
                    </a>
                    <a
                      href="#schedule"
                      className="border border-white/60 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      See Schedule
                    </a>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-white/10 border border-white/20 min-h-[240px] flex items-center justify-center">
                  {heroImage ? (
                    <img src={heroImage} alt="Event" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/80 py-16">
                      <CalendarDays className="w-10 h-10" />
                      <span className="text-sm font-medium">Event photo coming soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-200 -mt-8 mx-4 sm:mx-8 relative z-10 px-6 py-6 sm:py-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="text-sm font-semibold text-slate-800">{eventDateLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500">Time</div>
                    <div className="text-sm font-semibold text-slate-800">{timeLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500">Venue</div>
                    <div className="text-sm font-semibold text-slate-800">{venueName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500">Seats</div>
                    <div className="text-sm font-semibold text-slate-800">{seatsLabel}</div>
                  </div>
                </div>
              </div>
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
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
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
                      <div className="text-sm font-bold text-emerald-600 sm:w-32 flex-shrink-0">
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

            {/* Host section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Meet Your Host
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 min-h-[280px] flex items-center justify-center">
                  {hostImage ? (
                    <img src={hostImage} alt={hostName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-emerald-600 py-16">
                      <UserCircle className="w-12 h-12" />
                      <span className="text-sm font-medium">Photo coming soon</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    {hostName}
                  </h3>
                  <p className="text-emerald-600 font-medium text-sm sm:text-base mb-4">
                    {hostTitle}
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {hostBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery section */}
            <div className="mt-16 sm:mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Moments From Our Events
                </h2>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                  More photos coming soon
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {(galleryImages.length > 0 ? galleryImages : Array.from({ length: 6 })).map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 aspect-[4/3] flex items-center justify-center"
                  >
                    {typeof item === 'string' ? (
                      <img src={item} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-emerald-400" />
                    )}
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
              {videoLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {videoLinks.map((url, i) => {
                    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/)?.[1] || '';
                    return (
                      <div key={i} className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm aspect-video">
                        {videoId && (
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={`Video ${i + 1}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 min-h-[200px] flex flex-col items-center justify-center gap-3 text-emerald-600 py-12">
                    <PlayCircle className="w-12 h-12" />
                    <span className="text-sm font-medium">Videos coming soon</span>
                  </div>
                </div>
              )}
            </div>

            {/* Venue section */}
            <div id="venue" className="mt-16 sm:mt-20 scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                  Venue of the Event
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
                <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm aspect-[4/3]">
                  <img
                    src={venueImages[0]}
                    alt={`${venueName} building`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    {venueName}
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-emerald-700 mb-4">
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
                      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors mb-6"
                    >
                      View on Google Maps
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">Date</div>
                        <div className="text-sm font-semibold text-slate-800">{eventDateLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">Time</div>
                        <div className="text-sm font-semibold text-slate-800">{timeLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">Venue</div>
                        <div className="text-sm font-semibold text-slate-800">{venueName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">Seats</div>
                        <div className="text-sm font-semibold text-slate-800">{seatsLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mt-8">
                {venueImages.slice(1).map((image, index) => (
                  <div key={image} className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm aspect-[4/3]">
                    <img
                      src={image}
                      alt={`${venueName} view ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA block */}
            <div className="mt-16 sm:mt-20 mb-8 text-center">
              <a
                href="#tickets"
                className="inline-block bg-white text-emerald-700 font-semibold px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors border border-emerald-200"
              >
                Reserve Your Seat →
              </a>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-emerald-600" />
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
