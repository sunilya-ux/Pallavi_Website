import { Award, Shield, Star, Sparkles } from 'lucide-react';

export default function SocialProof() {
  return (
    <section className="py-16 bg-gradient-to-br from-brand-black via-brand-charcoal to-brand-ink relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(212,175,55,0.1),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-12">
          <p className="text-brand-gold font-semibold text-lg mb-2">Certified & Trusted</p>
          <h3 className="text-3xl font-bold text-white">
            Trusted by Professionals Across India & Globally
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-brand-gold/30 hover:bg-white/20 transition-all duration-300 flex flex-col items-center justify-center h-32">
            <Award className="w-12 h-12 text-brand-gold mb-3" />
            <p className="text-white font-semibold text-center">ICF Certified</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-brand-gold/30 hover:bg-white/20 transition-all duration-300 flex flex-col items-center justify-center h-32">
            <Sparkles className="w-12 h-12 text-brand-gold mb-3" />
            <p className="text-white font-semibold text-center">NLP Practitioner</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-brand-gold/30 hover:bg-white/20 transition-all duration-300 flex flex-col items-center justify-center h-32">
            <Shield className="w-12 h-12 text-brand-gold mb-3" />
            <p className="text-white font-semibold text-center">Business Coach</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-brand-gold/30 hover:bg-white/20 transition-all duration-300 flex flex-col items-center justify-center h-32">
            <Star className="w-12 h-12 text-brand-gold mb-3" />
            <p className="text-white font-semibold text-center">5000+ Clients</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/80 text-lg">
            Former IT professional with experience at leading multinational companies across UK & Europe
          </p>
        </div>
      </div>
    </section>
  );
}
