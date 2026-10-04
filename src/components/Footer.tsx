import { Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-black text-slate-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Pallavi Chatterjee</h3>
              <p className="text-brand-gold font-semibold">Life & Business Coach</p>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Empowering unhappy working women professionals to find their passion and start thriving businesses.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">About Me</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  My Story
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Coaching Approach
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Certifications
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  One-on-One Coaching
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Group Programs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Business Consulting
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Workshops & Events
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-gold transition-colors">
                  Free Resources
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-gold flex-shrink-0 mt-1" />
                <a href="mailto:info@lifecoachpallavichatterjee.com" className="hover:text-brand-gold transition-colors">
                  info@lifecoachpallavichatterjee.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-gold/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} Pallavi Chatterjee. All rights reserved.
            </p>

            <div className="flex items-center gap-1 text-sm text-slate-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for Transformation</span>
            </div>

            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-brand-gold transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-brand-gold transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-brand-gold transition-colors">
                Refund Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
