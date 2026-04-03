import { useState, useEffect } from 'react';
import { LogOut, Menu, X, Users, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClientsManager from './ClientsManager';
import PermissionsManager from './PermissionsManager';
import PassionCoachingForm from './PassionCoachingForm';
import ChannelTrailerScriptGenerator from './ChannelTrailerScriptGenerator';
import YouTubeScriptGenerator from './YouTubeScriptGenerator';
import type { ModuleWithTools } from '../types/permissions';

interface DashboardProps {
  userEmail: string;
}

export default function Dashboard({ userEmail }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'clients'>('overview');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [modules, setModules] = useState<ModuleWithTools[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeToolRoute, setActiveToolRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModulesAndTools();
  }, []);

  const loadModulesAndTools = async () => {
    try {
      setLoading(true);

      const [modulesRes, toolsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('tools').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (toolsRes.error) throw toolsRes.error;

      const modulesWithTools: ModuleWithTools[] = (modulesRes.data || []).map(module => ({
        ...module,
        tools: (toolsRes.data || []).filter(tool => tool.module_id === module.id)
      }));

      setModules(modulesWithTools);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userType');
    window.location.reload();
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleToolClick = (route: string) => {
    setActiveToolRoute(route);
    setActiveSection('overview');
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? IconComponent : Icons.FileQuestion;
  };

  const renderToolContent = () => {
    if (activeSection === 'clients') {
      return <ClientsManager />;
    }

    if (activeToolRoute === '/passion-coaching') {
      return <PassionCoachingForm clientId="admin" />;
    }

    if (activeToolRoute === '/tools/channel-trailer-script') {
      return <ChannelTrailerScriptGenerator />;
    }

    if (activeToolRoute === '/tools/youtube-script-generator') {
      return <YouTubeScriptGenerator />;
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Welcome to Admin Dashboard
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Manage your coaching business, clients, and access all your tools from here.
        </p>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => setActiveSection('clients')}
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Manage Clients</p>
                  <p className="text-sm text-slate-600">Add and manage client accounts</p>
                </div>
              </button>

              <button
                onClick={() => setShowPermissionsModal(true)}
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Access Control</p>
                  <p className="text-sm text-slate-600">Manage tool permissions</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Available Tools</h3>
            <p className="text-slate-600 mb-4">Select a tool from the sidebar to get started.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map(module => (
                <div key={module.id} className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const IconComponent = getIconComponent(module.icon);
                      return <IconComponent className="w-5 h-5 text-slate-600" />;
                    })()}
                    <h4 className="font-semibold text-slate-900">{module.display_name}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{module.tools.length} tool{module.tools.length !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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

          <div className="border-t border-slate-700 my-2 pt-2">
            {loading ? (
              <div className="text-center text-slate-400 py-4">Loading...</div>
            ) : (
              modules.map(module => {
                const isExpanded = expandedModules.has(module.id);
                const IconComponent = getIconComponent(module.icon);

                return (
                  <div key={module.id} className="mb-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-slate-300 hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium">{module.display_name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && module.tools.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {module.tools.map(tool => {
                          const ToolIconComponent = getIconComponent(tool.icon);
                          const isActive = activeToolRoute === tool.route;

                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleToolClick(tool.route)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left text-sm ${
                                isActive
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <ToolIconComponent className="w-4 h-4" />
                              <span>{tool.display_name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
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
            {renderToolContent()}
          </div>
        </main>
      </div>

      {showPermissionsModal && (
        <PermissionsManager onClose={() => setShowPermissionsModal(false)} />
      )}
    </div>
  );
}
