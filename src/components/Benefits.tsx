import { Heart, TrendingUp, Users, Sparkles } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: Heart,
      title: 'Reduce Stress & Mental Overwhelm',
      description: 'Break free from the daily grind of juggling office and home responsibilities. Learn tools to manage stress and reclaim your peace of mind.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'Build Confidence & Self-Worth',
      description: 'Discover your unique strengths and value. Transform self-doubt into unshakeable confidence as you step into entrepreneurship.',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Users,
      title: 'Improve Relationships & Emotional Balance',
      description: 'Create harmony between your personal and professional life. Strengthen relationships while pursuing your dreams.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: TrendingUp,
      title: 'Achieve Clarity in Career & Life Decisions',
      description: 'Find your passion and purpose. Make the bold transition from employee to entrepreneur with a clear, actionable roadmap.',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            What You Gain From Coaching
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transform your life from drowning in tasks to thriving in abundance, financial freedom, and joy every single day
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-transparent hover:-translate-y-1"
              >
                <div className="flex items-start gap-6">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl">
          <p className="text-2xl md:text-3xl font-bold mb-4">
            Work Less. Earn More. Live Joyfully.
          </p>
          <p className="text-lg md:text-xl text-emerald-50 max-w-3xl mx-auto">
            This is the exact same transformation I experienced, and now I help other women professionals achieve the same freedom and fulfillment.
          </p>
        </div>
      </div>
    </section>
  );
}
