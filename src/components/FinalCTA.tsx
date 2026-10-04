import { ArrowRight, Calendar, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-brand-black via-brand-charcoal to-brand-ink relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_70%)]"></div>

      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold-dark/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center space-y-8">
          <div className="inline-block">
            <div className="flex items-center gap-2 bg-brand-gold/15 backdrop-blur-sm text-brand-gold px-6 py-3 rounded-full border border-brand-gold/30 mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Limited Spots Available</span>
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to Transform <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-dark">
              Your Life?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Stop drowning in office and home tasks. Start living a life of passion, purpose, and financial freedom.
          </p>

          <div className="grid md:grid-cols-3 gap-8 py-8 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-gold mb-2">20 Min</p>
              <p className="text-slate-300">Free Discovery Call</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-gold mb-2">Zero</p>
              <p className="text-slate-300">Commitment Required</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-gold mb-2">100%</p>
              <p className="text-slate-300">Confidential</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
            <button className="group bg-gradient-to-r from-brand-gold to-brand-gold-dark text-brand-black px-10 py-5 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-brand-gold/50 transition-all duration-300 hover:scale-105 flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Book Your Free 20-Min Call
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-8 space-y-4">
            <p className="text-slate-400 text-lg">
              Join 5000+ women who have already made the transformation
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex -space-x-3">
                {[
                  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
                  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
                  'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=100',
                  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
                  'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=100',
                ].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Success story ${i + 1}`}
                    className="w-12 h-12 rounded-full border-4 border-brand-black object-cover"
                  />
                ))}
              </div>
              <p className="text-brand-gold font-semibold">
                +5000 happy clients
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
