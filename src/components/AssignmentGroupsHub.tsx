import { useState, useEffect } from 'react';
import { ClipboardList, ChevronRight, Loader, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StatusRow {
  group_id: string;
  assignment_id: string;
  status: string | null;
}

interface Group {
  id: string;
  title: string;
  sort_order: number;
}

interface AssignmentGroupsHubProps {
  moduleId: string;
  moduleName: string;
  clientId: string;
  onSelectGroup: (group: { id: string; title: string }) => void;
}

export default function AssignmentGroupsHub({
  moduleId,
  moduleName,
  clientId,
  onSelectGroup,
}: AssignmentGroupsHubProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [moduleId, clientId]);

  const load = async () => {
    setLoading(true);
    try {
      const [groupsRes, statusRes] = await Promise.all([
        supabase
          .from('assignment_groups')
          .select('id, title, sort_order')
          .eq('module_id', moduleId)
          .eq('is_active', true)
          .order('sort_order'),
        supabase.rpc('get_assignment_status_for_client', { user_client_id: clientId }),
      ]);
      setGroups(groupsRes.data || []);
      setStatusRows(Array.isArray(statusRes.data) ? statusRes.data : []);
    } catch (err) {
      console.error('[AssignmentGroupsHub] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (groupId: string): { done: number; total: number } => {
    const rows = statusRows.filter(r => r.group_id === groupId);
    return {
      total: rows.length,
      done: rows.filter(r => r.status !== null).length,
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center gap-3">
        <Loader className="w-5 h-5 animate-spin text-emerald-600" />
        <span className="text-slate-500 text-sm">Loading assignments...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-white/80" />
          <div>
            <p className="text-emerald-100 text-xs font-medium">{moduleName}</p>
            <h2 className="text-xl font-bold text-white">Assignments</h2>
          </div>
        </div>
      </div>

      {/* Group list */}
      {groups.length === 0 ? (
        <div className="p-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No assignments available yet.</p>
          <p className="text-slate-400 text-xs mt-1">Check back soon — your coach is preparing them.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {groups.map(group => {
            const { done, total } = getProgress(group.id);
            const allDone = total > 0 && done === total;

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup({ id: group.id, title: group.title })}
                className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-emerald-50/50 transition-colors group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  allDone ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {allDone ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ClipboardList className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {group.title}
                  </p>
                  <p className={`text-xs mt-0.5 ${allDone ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    {total === 0
                      ? 'No assignments yet'
                      : allDone
                      ? `All ${total} completed`
                      : done === 0
                      ? `${total} assignment${total !== 1 ? 's' : ''} to complete`
                      : `${done} / ${total} completed`}
                  </p>
                </div>

                {/* Progress ring (simple bar) */}
                {total > 0 && (
                  <div className="flex-shrink-0 w-20">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
