import { useState, useEffect } from 'react';
import { LogOut, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import AssignmentPanel from './AssignmentPanel';
import PassionCoachingForm from './PassionCoachingForm';
import ChannelTrailerScriptGenerator from './ChannelTrailerScriptGenerator';
import YouTubeScriptGenerator from './YouTubeScriptGenerator';
import YouTubeChannelDescriptionGenerator from './YouTubeChannelDescriptionGenerator';
import VisionBoardGenerator from './VisionBoardGenerator';
import SmartGoalGenerator from './SmartGoalGenerator';
import GoalCreator from './GoalCreator';
import PassionRoadmapCreator from './PassionRoadmapCreator';
import RoadmapCreator from './RoadmapCreator';
import BigMoneyContentGenerator from './BigMoneyContentGenerator';
import WebinarBuilder from './WebinarBuilder';
import HookBuilder from './HookBuilder';
import MonetizablePassionAnalysis from './MonetizablePassionAnalysis';
import LifePurposeGenerator from './LifePurposeGenerator';
import { supabase } from '../lib/supabase';
import type { ModuleWithTools } from '../types/permissions';

interface ModularClientDashboardProps {
  email: string;
  clientId: string;
}

const COURSE_NAME = '7 Figure Ensuring Morning Rituals';

export default function ModularClientDashboard({ email, clientId }: ModularClientDashboardProps) {
  const [modulesWithTools, setModulesWithTools] = useState<ModuleWithTools[]>([]);
  const [activeToolRoute, setActiveToolRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [restrictedMessage, setRestrictedMessage] = useState<string | null>(null);
  // Map of tool_id -> { assignment_id, status }
  const [assignmentStatuses, setAssignmentStatuses] = useState<Map<string, { assignment_id: string; status: string | null }>>(new Map());

  const isAdmin = localStorage.getItem('userType') === 'admin';

  useEffect(() => {
    loadPermissions();
  }, [clientId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);

      console.log('[ClientDashboard] Loading permissions for clientId:', clientId);
      console.log('[ClientDashboard] isAdmin:', isAdmin);

      const { data: permissionsData, error } = await supabase.rpc('get_user_permissions', {
        user_client_id: clientId,
      });

      if (error) {
        console.error('[ClientDashboard] RPC error:', error);
        throw error;
      }

      console.log('[ClientDashboard] Raw RPC response:', permissionsData);

      const modules = permissionsData?.modules || [];
      const tools = permissionsData?.tools || [];

      console.log('[ClientDashboard] Modules from RPC:', modules.map((m: any) => ({ name: m.name, has_access: m.has_access })));
      console.log('[ClientDashboard] Tools from RPC (courses):', tools.filter((t: any) => t.route?.startsWith('courses/')).map((t: any) => ({ name: t.name, has_access: t.has_access })));

      const visibleModules = isAdmin
        ? modules
        : modules.filter((m: any) => m.has_access);

      const modulesWithToolsData: ModuleWithTools[] = visibleModules.map((module: any) => ({
        ...module,
        has_access: isAdmin ? true : module.has_access,
        tools: tools
          .filter((t: any) => t.module_id === module.id)
          .map((t: any) => ({
            ...t,
            has_access: isAdmin ? true : t.has_access,
          })),
      }));

      console.log('[ClientDashboard] Final modulesWithTools (courses):', modulesWithToolsData.find(m => m.name === 'courses')?.tools.map(t => ({ name: t.name, has_access: t.has_access })));

      setModulesWithTools(modulesWithToolsData);

      if (modulesWithToolsData.length > 0) {
        setExpandedModules(new Set([modulesWithToolsData[0].id]));
      }

      // Load assignment statuses for sidebar badges (single RPC call)
      try {
        const { data: statusData } = await supabase.rpc('get_assignment_status_for_client', {
          user_client_id: clientId,
        });
        if (Array.isArray(statusData)) {
          const map = new Map<string, { assignment_id: string; status: string | null }>();
          for (const row of statusData) {
            map.set(row.tool_id, { assignment_id: row.assignment_id, status: row.status ?? null });
          }
          setAssignmentStatuses(map);
        }
      } catch {
        // Non-fatal — badges just won't show if this fails
      }
    } catch (error) {
      console.error('[ClientDashboard] Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientId');
    window.location.reload();
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const handleToolClick = (tool: any) => {
    if (isAdmin || tool.has_access) {
      setActiveToolRoute(tool.route);
      setRestrictedMessage(null);
    } else {
      setRestrictedMessage(`You don't have access to ${tool.display_name}. Please contact your admin.`);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const isCoursesModule = (module: ModuleWithTools) => module.name === 'courses';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Derive active tool for AssignmentPanel (excludes courses)
  const activeTool = activeToolRoute
    ? modulesWithTools.flatMap(m => m.tools).find(t => t.route === activeToolRoute)
    : null;
  const showAssignmentPanel =
    !!activeToolRoute &&
    !activeToolRoute.startsWith('courses/') &&
    !!activeTool?.id;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Client Portal
          </h1>
          <p className="text-sm text-slate-600 mt-1 truncate">{email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {modulesWithTools.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <Lock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">No modules available</p>
              <p className="text-xs mt-1">Contact your admin for access</p>
            </div>
          ) : (
            modulesWithTools.map((module) => (
              <div key={module.id} className="space-y-1">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-emerald-600">
                      {getIcon(module.icon)}
                    </div>
                    <span className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                      {module.display_name}
                    </span>
                  </div>
                  {expandedModules.has(module.id) ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {expandedModules.has(module.id) && module.tools.length > 0 && (
                  <div className="ml-7 space-y-1 mt-1">
                    {isCoursesModule(module) ? (
                      <CoursesFolderNav
                        tools={module.tools}
                        expandedCourses={expandedCourses}
                        toggleCourse={toggleCourse}
                        handleToolClick={handleToolClick}
                        activeToolRoute={activeToolRoute}
                        isAdmin={isAdmin}
                        getIcon={getIcon}
                      />
                    ) : (
                      module.tools.map((tool) => {
                        const isLocked = !isAdmin && !tool.has_access;
                        const isActive = activeToolRoute === tool.route;
                        const assignmentInfo = assignmentStatuses.get(tool.id);

                        return (
                          <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left relative group ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                : isLocked
                                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-600'
                            }`}
                            title={isLocked ? "Access restricted" : tool.description || ''}
                          >
                            <div className={isLocked ? 'text-slate-400' : ''}>
                              {getIcon(tool.icon)}
                            </div>
                            <span className="font-medium text-sm flex-1">
                              {tool.display_name}
                            </span>
                            {assignmentInfo && assignmentInfo.status === 'reviewed' && (
                              <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 flex-shrink-0">
                                Reviewed
                              </span>
                            )}
                            {assignmentInfo && assignmentInfo.status === 'completed' && (
                              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 flex-shrink-0">
                                Submitted
                              </span>
                            )}
                            {isLocked && (
                              <Lock className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))
          )}
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

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {restrictedMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Access Restricted</h3>
                <p className="text-sm text-red-700">{restrictedMessage}</p>
              </div>
            </div>
          )}

          {!activeToolRoute ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome, {email}!
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Select a tool from the sidebar to get started.
              </p>

              <div className="grid gap-4 mt-8">
                {modulesWithTools.map((module) => (
                  <div key={module.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        {getIcon(module.icon)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{module.display_name}</h3>
                        <p className="text-sm text-slate-600">{module.description}</p>
                      </div>
                    </div>
                    <div className="ml-13 mt-3 space-y-2">
                      {module.tools.map((tool) => (
                        <div
                          key={tool.id}
                          className={`flex items-center gap-2 text-sm ${
                            (isAdmin || tool.has_access) ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            (isAdmin || tool.has_access) ? 'bg-emerald-500' : 'bg-slate-300'
                          }`} />
                          <span>{tool.display_name}</span>
                          {!isAdmin && !tool.has_access && <Lock className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeToolRoute === '/passion-coaching' ? (
            <PassionCoachingForm clientId={clientId} />
          ) : activeToolRoute === '/tools/channel-trailer-script' ? (
            <ChannelTrailerScriptGenerator />
          ) : activeToolRoute === '/tools/youtube-script-generator' ? (
            <YouTubeScriptGenerator />
          ) : activeToolRoute === '/tools/youtube-channel-description' ? (
            <YouTubeChannelDescriptionGenerator />
          ) : activeToolRoute === '/tools/vision-board-generator' ? (
            <VisionBoardGenerator />
          ) : activeToolRoute === 'smart-goal-generator' ? (
            <SmartGoalGenerator />
          ) : activeToolRoute === 'goal-creator' ? (
            <GoalCreator />
          ) : activeToolRoute === 'passion-roadmap-creator' ? (
            <PassionRoadmapCreator clientId={clientId} />
          ) : activeToolRoute === 'roadmap-creator' ? (
            <RoadmapCreator clientId={clientId} />
          ) : activeToolRoute === 'big-money-content-generator' ? (
            <BigMoneyContentGenerator clientId={clientId} />
          ) : activeToolRoute === '/tools/webinar-builder' ? (
            <WebinarBuilder />
          ) : activeToolRoute === '/tools/hook-builder' ? (
            <HookBuilder />
          ) : activeToolRoute === 'monetizable-passion-analysis' ? (
            <MonetizablePassionAnalysis clientId={clientId} />
          ) : activeToolRoute === 'life-purpose-generator' ? (
            <LifePurposeGenerator clientId={clientId} />
          ) : activeToolRoute?.startsWith('courses/') ? (
            <CourseLessonPlaceholder route={activeToolRoute} tools={modulesWithTools.find(m => m.name === 'courses')?.tools || []} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Tool Coming Soon</h2>
              <p className="text-slate-600">This tool is being developed and will be available soon.</p>
            </div>
          )}

          {showAssignmentPanel && activeTool && (
            <AssignmentPanel toolId={activeTool.id} clientId={clientId} />
          )}
        </div>
      </main>
    </div>
  );
}

function CoursesFolderNav({
  tools,
  expandedCourses,
  toggleCourse,
  handleToolClick,
  activeToolRoute,
  isAdmin,
  getIcon,
}: {
  tools: any[];
  expandedCourses: Set<string>;
  toggleCourse: (id: string) => void;
  handleToolClick: (tool: any) => void;
  activeToolRoute: string | null;
  isAdmin: boolean;
  getIcon: (name: string | null) => React.ReactNode;
}) {
  const courseId = 'morning-rituals';
  const FolderIcon = expandedCourses.has(courseId)
    ? (Icons as any).FolderOpen
    : (Icons as any).Folder;

  return (
    <div className="space-y-1">
      <button
        onClick={() => toggleCourse(courseId)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
      >
        <div className="flex items-center gap-2">
          <div className="text-emerald-600">
            {FolderIcon && <FolderIcon className="w-5 h-5" />}
          </div>
          <span className="font-medium text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
            {COURSE_NAME}
          </span>
        </div>
        {expandedCourses.has(courseId) ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expandedCourses.has(courseId) && (
        <div className="ml-6 space-y-1 mt-1">
          {tools.map((tool) => {
            const isLocked = !isAdmin && !tool.has_access;
            const isActive = activeToolRoute === tool.route;

            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                disabled={isLocked}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left relative group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : isLocked
                    ? 'text-slate-400 opacity-50 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-600'
                }`}
                title={isLocked ? "Access restricted" : tool.description || ''}
              >
                <div className={isLocked ? 'text-slate-400' : ''}>
                  {getIcon(tool.icon)}
                </div>
                <span className="font-medium text-sm flex-1">
                  {tool.display_name}
                </span>
                {isLocked && (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const LESSON_VIDEOS: Record<string, string> = {
  'courses/morning-rituals/intention-setting': 'vPdPk6Qeuts',
  'courses/morning-rituals/box-breathing': 'gg5Isdp8Aic',
  'courses/morning-rituals/affirmations': 'PJT82unfDHs',
  'courses/morning-rituals/version-2': 'vvW7qa3aW0g',
  'courses/morning-rituals/review-journal': 'mJMU2XjHSO4',
  'courses/morning-rituals/goal-of-the-week': 'o7Db3zif6Eo',
};

function CourseLessonPlaceholder({ route, tools }: { route: string; tools: any[] }) {
  const GraduationCap = (Icons as any).GraduationCap;
  const PlayCircle = (Icons as any).PlayCircle;

  const tool = tools.find((t) => t.route === route);
  const lessonName = tool?.display_name || '';
  const videoId = LESSON_VIDEOS[route];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
        <div className="flex items-center gap-3">
          {GraduationCap && <GraduationCap className="w-6 h-6 text-white/80" />}
          <div>
            <p className="text-emerald-100 text-xs font-medium">{COURSE_NAME}</p>
            <h2 className="text-xl font-bold text-white">{lessonName}</h2>
          </div>
        </div>
      </div>
      {videoId ? (
        <div
          className="p-6"
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: 'none' }}
        >
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full rounded-lg"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&iv_load_policy=3&disablekb=0`}
              width="100%"
              height="100%"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'transparent',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
            <div
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '120px',
                height: '60px',
                background: 'transparent',
                zIndex: 10,
                cursor: 'default',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            {PlayCircle && <PlayCircle className="w-10 h-10 text-slate-400" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Video will be displayed here</h3>
          <p className="text-slate-500 text-center max-w-md">
            Course content for this lesson is being prepared. Check back soon for the video and materials.
          </p>
        </div>
      )}
    </div>
  );
}
