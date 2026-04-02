import { useState } from 'react';
import { LogOut, Menu, X, ExternalLink, Users, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClientsManager from './ClientsManager';
import PermissionsManager from './PermissionsManager';

interface DashboardProps {
  userEmail: string;
}

export default function Dashboard({ userEmail }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'clients' | 'permissions'>('overview');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userType');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400">Admin Panel</h2>
          <p className="text-sm text-slate-400 mt-1 truncate">{userEmail}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
              activeSection === 'overview'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Passion Coaching SMM</span>
          </button>

          <button
            onClick={() => setActiveSection('clients')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
              activeSection === 'clients'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Clients</span>
          </button>

          <button
            onClick={() => setShowPermissionsModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-slate-300 hover:bg-slate-700"
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Access Control</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors w-full text-left text-red-400 hover:text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Welcome</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                {userEmail[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'overview' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  Welcome to Your Dashboard
                </h1>
                <p className="text-slate-600 text-lg mb-8">
                  Manage your coaching business and access all your tools from here.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Passion Coaching SMM
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Access your social media marketing tools and resources.
                    </p>
                    <button className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                      Open Tool
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
                    <div className="w-12 h-12 bg-slate-400 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics</h3>
                    <p className="text-slate-600 mb-4">
                      View your coaching program performance and metrics.
                    </p>
                    <button className="text-slate-500 font-medium">Coming Soon</button>
                  </div>

                  <button
                    onClick={() => setActiveSection('clients')}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 text-left hover:shadow-lg transition-shadow"
                  >
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Clients</h3>
                    <p className="text-slate-600 mb-4">
                      Manage your client accounts and access.
                    </p>
                    <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                      Manage Clients
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <ClientsManager />
            )}
          </div>
        </main>
      </div>

      {showPermissionsModal && (
        <PermissionsManager onClose={() => setShowPermissionsModal(false)} />
      )}
    </div>
  );
}
