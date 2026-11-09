import RealWinsGrid from './RealWinsGrid';

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-brand-black via-brand-charcoal to-brand-ink relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.1),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <p className="text-brand-gold font-semibold text-lg uppercase tracking-wider">
            Success Stories
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Real Stories. Real Transformations.
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join thousands of women who have transformed their lives from corporate stress to entrepreneurial success
          </p>
        </div>

        <RealWinsGrid limit={6} />

        <div className="mt-16 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-12 py-8 border border-brand-gold/30">
            <p className="text-3xl font-bold text-white mb-2">5000+ Lives Transformed</p>
            <p className="text-brand-gold text-lg">You Could Be Next</p>
          </div>
        </div>
      </div>
    </section>
  );
}
