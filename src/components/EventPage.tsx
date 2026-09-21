import { ArrowLeft, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { isEventActive, eventName, eventDateLabel, bannerText } from '../config/eventConfig';

export default function EventPage() {
  const active = isEventActive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <button
          onClick={() => { window.location.href = '/'; }}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {active ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-10">
              <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                Upcoming Event
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">{eventName}</h1>
            </div>
            <div className="px-8 py-10 space-y-6">
              <div className="flex items-center gap-3 text-slate-700">
                <CalendarDays className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium">{eventDateLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium">Delhi</span>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                Details coming soon
              </p>
              <p className="text-sm text-slate-400">{bannerText}</p>
            </div>
          </div>
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
