import { useState, useEffect } from 'react';
import { ChevronLeft, ClipboardList, Loader, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StatusRow {
  assignment_id: string;
  status: string | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  instructions: string | null;
  sort_order: number;
}

interface AssignmentSubListProps {
  group: { id: string; title: string };
  moduleName: string;
  clientId: string;
  onSelectAssignment: (assignment: { id: string; title: string; instructions: string | null }) => void;
  onBack: () => void;
}

export default function AssignmentSubList({
  group,
  moduleName,
  clientId,
  onSelectAssignment,
  onBack,
}: AssignmentSubListProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [group.id, clientId]);

  const load = async () => {
    setLoading(true);
    try {
      const [asgRes, statusRes] = await Promise.all([
        supabase
          .from('assignments')
          .select('id, title, instructions, sort_order')
          .eq('group_id', group.id)
          .eq('is_active', true)
          .order('sort_order'),
        supabase.rpc('get_assignment_status_for_client', { user_client_id: clientId }),
      ]);
      setAssignments(asgRes.data || []);
      setStatusRows(Array.isArray(statusRes.data) ? statusRes.data : []);
    } catch (err) {
      console.error('[AssignmentSubList] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (assignmentId: string): string | null => {
    return statusRows.find(r => r.assignment_id === assignmentId)?.status ?? null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center gap-3">
        <Loader className="w-5 h-5 animate-spin text-emerald-600" />
        <span className="text-slate-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-emerald-200 hover:text-white text-xs font-medium mb-3 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Assignments
        </button>
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-white/80" />
          <div>
            <p className="text-emerald-100 text-xs font-medium">{moduleName}</p>
            <h2 className="text-xl font-bold text-white">{group.title}</h2>
          </div>
        </div>
      </div>

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div className="p-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No assignments in this group yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {assignments.map(a => {
            const status = getStatus(a.id);
            return (
              <button
                key={a.id}
                onClick={() => onSelectAssignment({ id: a.id, title: a.title, instructions: a.instructions })}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-emerald-50/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {a.title}
                  </p>
                  {a.instructions && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                      {a.instructions}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {status === 'reviewed' && (
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2.5 py-1">
                      Reviewed
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1">
                      Submitted
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
