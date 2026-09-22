import { ArrowLeft, CalendarDays, MapPin, Clock, Users, Sparkles } from 'lucide-react';
import {
  isEventActive,
  eventDateLabel,
  tagline,
  description,
  timeLabel,
  venueName,
  seatsLabel,
  heroImage,
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
