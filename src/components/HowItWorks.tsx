import { Phone, FileText, Calendar, MessageCircle } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Phone,
      title: 'Discovery Call',
      description: 'Understand your goals, challenges, and aspirations. We explore where you are now and where you want to be.',
    },
    {
      number: '02',
      icon: FileText,
      title: 'Personalized Plan',
      description: 'Receive a customized roadmap designed specifically for your journey from employee to entrepreneur.',
    },
    {
      number: '03',
      icon: Calendar,
      title: 'Weekly Sessions',
      description: 'Guided exercises, deep reflection, and clarity work to help you build your business with confidence.',
    },
    {
      number: '04',
      icon: MessageCircle,
      title: 'Continuous Support',
      description: 'WhatsApp check-ins, progress tracking, and ongoing guidance to ensure your success every step of the way.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            My Coaching Method
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Simple, Effective & Results-Driven
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative group"
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-emerald-200 to-transparent -z-10"></div>
                )}

                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-emerald-200 h-full">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900">
                      {step.title}
                    </h3>

                    <p className="text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-slate-50 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Why My Approach Works
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              As an engineer who successfully transitioned from the corporate world to building a thriving coaching business, I understand exactly what you're going through. I've lived in UK and Europe, worked with major companies, and found my true calling.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              I bring together skills, compassion, proven strategies, and guaranteed results to help you make the same transformative journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
