import { ArrowRight, Download } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-emerald-50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.05),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
                Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Best Self</span>
              </h1>
              <p className="text-2xl sm:text-3xl font-light text-slate-700 mt-4">
                Achieve Clarity, Confidence & Life Balance
              </p>
            </div>

            <div className="space-y-3 py-6 border-l-4 border-emerald-600 pl-6 bg-white/50 backdrop-blur-sm rounded-r-lg">
              <p className="text-slate-600 font-medium uppercase tracking-wider text-sm">
                Pallavi Chatterjee
              </p>
              <p className="text-lg text-slate-700 leading-relaxed">
                Certified Life Coach | Business Mentor | Transformation Expert
              </p>
            </div>

            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              I help unhappy working women professionals transform their "have to" life into a life of passion, purpose, and financial freedom by starting and growing their own business ventures.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                Book Free Discovery Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="group bg-white text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 transition-all duration-300 flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Free Self-Growth Guide
              </button>
            </div>

            <div className="flex items-center gap-8 pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">5000+</p>
                <p className="text-sm text-slate-600 mt-1">Lives Transformed</p>
              </div>
              <div className="h-12 w-px bg-slate-300"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">15+</p>
                <p className="text-sm text-slate-600 mt-1">Years Experience</p>
              </div>
              <div className="h-12 w-px bg-slate-300"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">100%</p>
                <p className="text-sm text-slate-600 mt-1">Dedicated Support</p>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-12">
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 p-1 rounded-3xl shadow-2xl">
              <img
                src="/IMG_0070-2-1-683x1024.webp"
                alt="Pallavi Chatterjee - Life Coach"
                className="rounded-3xl w-full h-auto object-cover shadow-xl"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">From IT Engineer to</p>
              <p className="text-lg font-bold text-emerald-600">Empowerment Coach</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}
