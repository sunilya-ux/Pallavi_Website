import { Award, Users, TrendingUp, Star } from 'lucide-react';

export default function Awards() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <p className="text-emerald-600 font-semibold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
            <Award className="w-6 h-6" />
            Recognition & Achievement
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Award-Winning Coach
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Recognized for transforming lives and helping thousands transition to successful coaching careers
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-emerald-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-400/30">
              <img
                src="/Award Image.png"
                alt="Awarded Life Coaching Coach - Pallavi Chatterjee"
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Awarded Life Coaching Coach</h3>
                  <p className="text-amber-50 text-lg leading-relaxed">
                    More than 5000+ lives touched and helped them switch career from Job to Coaching / Business from comfort of their homes.
                  </p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-amber-200 text-amber-200" />
                    ))}
                    <Star className="w-6 h-6 text-amber-200" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="text-3xl font-bold text-slate-900 mb-1">5000+</h4>
                <p className="text-slate-600 font-medium">Lives Transformed</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                <div className="bg-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-teal-600" />
                </div>
                <h4 className="text-3xl font-bold text-slate-900 mb-1">100%</h4>
                <p className="text-slate-600 font-medium">Career Success Rate</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <p className="text-slate-700 leading-relaxed text-lg">
                <span className="font-bold text-emerald-700">Mentor Pallavi Chatterjee</span> has been
                recognized for her exceptional dedication to helping professionals transition into
                successful coaching and business careers, enabling them to achieve financial freedom
                and work-life balance from the comfort of their homes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
