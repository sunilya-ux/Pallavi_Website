import { Play, ExternalLink } from 'lucide-react';

export default function VideoSection() {
  const videoUrl = 'https://www.youtube.com/watch?v=h8pkCcx4EQs';
  const videoId = 'h8pkCcx4EQs';
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            How My Coaching Works
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A quick 2-minute explanation of my approach and process to help you transform from corporate employee to successful entrepreneur
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity"></div>

          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl aspect-video cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 z-10"></div>

            <img
              src={thumbnailUrl}
              alt="Watch coaching video"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/95 backdrop-blur-sm rounded-full p-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Play className="w-16 h-16 text-emerald-600 fill-current" />
              </div>
            </div>

            <div className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 z-20">
              <ExternalLink className="w-4 h-4" />
              Watch on YouTube
            </div>

            <div className="absolute bottom-8 left-8 right-8 z-20">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl">
                <p className="text-slate-900 font-semibold text-lg">
                  From "Have To" Life to Life of Happy Choices
                </p>
                <p className="text-slate-600 text-sm mt-2">
                  Discover how I help working women professionals break free and build thriving businesses
                </p>
              </div>
            </div>
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-emerald-600 mb-2">Less Work</p>
            <p className="text-slate-600">Freedom from 9-to-5 grind</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-emerald-600 mb-2">More Income</p>
            <p className="text-slate-600">Financial independence & growth</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-emerald-600 mb-2">True Joy</p>
            <p className="text-slate-600">Living with passion & purpose</p>
          </div>
        </div>
      </div>
    </section>
  );
}
