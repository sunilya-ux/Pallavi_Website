import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Client Success',
      role: 'Business Transformation',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      text: 'It was such a blessing to have connected to you this day, your vibe is so beautiful, i felt like I\'m talking to my mom itself. I would never forget you in my life. Lots of love and respect to you ❤️',
      rating: 5,
    },
    {
      name: 'Program Participant',
      role: 'Life Coaching Client',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      text: 'I discussed whole program with my friend. He is on board with program. From Thursday we have to start. Thank u so much. Without your support this wouldn\'t have been possible. I got 45k and he agreed he is really looking for transformation.',
      rating: 5,
    },
    {
      name: 'Grateful Client',
      role: 'Personal Development',
      image: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=400',
      text: 'Thank you Pallavi for the huge support... It\'s so long I have got like this support and encouragement from anyone. Thank you from bottom of my heart ❤️',
      rating: 5,
    },
    {
      name: 'Business Success',
      role: 'Client Acquisition',
      image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
      text: 'Hey Pallavi got my second client 💜💜🥳 love u. Wow congratulations 🎉🎊 This is superb. Rs.40000 credited through NEFT.',
      rating: 5,
    },
    {
      name: 'Mentorship Client',
      role: 'Business Growth',
      image: 'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=400',
      text: 'With the blessings of God and under the amazing mentorship and guidance of Pallavi - I have been able to convert my first two clients. We start Nov 18. Thank you for your guidance, help and mentorship. I owe it to you... 99k earned 😍',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <p className="text-emerald-400 font-semibold text-lg uppercase tracking-wider">
            Success Stories
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Real Stories. Real Transformations.
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join thousands of women who have transformed their lives from corporate stress to entrepreneurial success
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-emerald-100" />

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-emerald-100"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-emerald-600 font-medium">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-slate-600 leading-relaxed italic">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.slice(3).map((testimonial, index) => (
            <div
              key={index + 3}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-emerald-100" />

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-emerald-100"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-emerald-600 font-medium">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-slate-600 leading-relaxed italic">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-12 py-8 border border-white/20">
            <p className="text-3xl font-bold text-white mb-2">5000+ Lives Transformed</p>
            <p className="text-emerald-400 text-lg">You Could Be Next</p>
          </div>
        </div>
      </div>
    </section>
  );
}
