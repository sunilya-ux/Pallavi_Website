import { useState } from 'react';
import { LogOut, ExternalLink } from 'lucide-react';
import PassionCoachingForm from './PassionCoachingForm';

interface ClientDashboardProps {
  email: string;
}

export default function ClientDashboard({ email }: ClientDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview');

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientId');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Client Portal</h1>
          <p className="text-sm text-slate-600 mt-1">{email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection('passion-coaching')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'passion-coaching'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Passion Coaching SMM</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {activeSection === 'overview' ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Welcome, {email}!
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Select "Passion Coaching SMM" from the sidebar to get started.
              </p>
            </div>
          ) : activeSection === 'passion-coaching' ? (
            <PassionCoachingForm clientId={localStorage.getItem('clientId') || ''} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
