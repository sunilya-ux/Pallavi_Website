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
import { isEventActive, getDaysUntilEvent, seatsLabel } from './config/eventConfig';

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
        {isEventActive() && <EventBanner />}
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

function EventBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const d = getDaysUntilEvent();
      setDaysLeft(d);
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  const countdownLabel = daysLeft === null
    ? ''
    : daysLeft <= 0
      ? 'Today!'
      : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

  return (
    <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
          </span>
          <span>
            Live Event · Delhi · {countdownLabel} · {seatsLabel}
          </span>
        </div>
        <a
          href="/event"
          className="inline-flex items-center gap-1 bg-white text-amber-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors whitespace-nowrap shadow-sm"
        >
          Book Tickets →
        </a>
      </div>
    </div>
  );
}

export default App;
