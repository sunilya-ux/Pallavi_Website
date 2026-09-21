import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import Hero from './components/Hero';
import VideoSection from './components/VideoSection';
import SocialProof from './components/SocialProof';
import Awards from './components/Awards';
import Benefits from './components/Benefits';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import ModularClientDashboard from './components/ModularClientDashboard';
import EventPage from './components/EventPage';
import { isEventActive, bannerText } from './config/eventConfig';

function App() {
  const [user, setUser] = useState<any>(null);
  const [clientUser, setClientUser] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        const userType = localStorage.getItem('userType');
        const clientEmail = localStorage.getItem('clientEmail');
        const storedClientId = localStorage.getItem('clientId');

        if (userType === 'client' && clientEmail && storedClientId) {
          setClientUser(clientEmail);
          setClientId(storedClientId);
        }
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        const userType = localStorage.getItem('userType');
        const clientEmail = localStorage.getItem('clientEmail');
        const storedClientId = localStorage.getItem('clientId');

        if (userType === 'client' && clientEmail && storedClientId) {
          setClientUser(clientEmail);
          setClientId(storedClientId);
        }
      } else {
        setClientUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard userEmail={user.email || ''} />;
  }

  if (clientUser && clientId) {
    return <ModularClientDashboard email={clientUser} clientId={clientId} />;
  }

  if (window.location.pathname === '/event') {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20">
          <EventPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20">
        {isEventActive() && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <p className="text-sm font-medium text-white">{bannerText}</p>
              <a
                href="/event"
                className="text-sm font-semibold text-white underline underline-offset-2 hover:text-emerald-100 transition-colors whitespace-nowrap"
              >
                Book Tickets →
              </a>
            </div>
          </div>
        )}
        <Hero />
        <VideoSection />
        <SocialProof />
        <Awards />
        <Benefits />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}

export default App;
