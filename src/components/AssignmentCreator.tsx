import { useState, useEffect, useRef } from 'react';
import { ClipboardList, ChevronLeft, Plus, CreditCard as Edit2, FileText, CheckCircle, Loader, AlertCircle, UploadCloud, X, Trash2, FolderOpen, EyeOff, Inbox, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

type View = 'groups' | 'assignments' | 'form' | 'submissions' | 'review';

interface Module {
  id: string;
  name: string;
  display_name: string;
}

interface AssignmentGroup {
  id: string;
  module_id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
  assignment_count: number;
}

interface Assignment {
  id: string;
  group_id: string;
  title: string;
  instructions: string | null;
  sort_order: number;
  is_active: boolean;
  ref_file_count: number;
}

interface RefFile {
  id: string;
  file_name: string;
  file_path: string;
}

interface SubmissionRow {
  id: string;
  assignment_id: string;
  client_id: string;
  client_email: string;
  status: string;
  submitted_at: string;
  feedback: string | null;
  reviewed_at: string | null;
}

interface SubFile {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);
const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.jpg', '.jpeg', '.png'];

function isFileAllowed(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const idx = file.name.lastIndexOf('.');
  const ext = idx >= 0 ? file.name.slice(idx).toLowerCase() : '';
  return ALLOWED_EXTENSIONS.includes(ext);
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function toast(set: (msg: string) => void, msg: string) {
  set(msg);
  setTimeout(() => set(''), 4000);
}

function AssignmentCreator() {
  const [view, setView] = useState<View>('groups');

  // modules
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [loadingModules, setLoadingModules] = useState(true);

  // groups view
  const [groups, setGroups] = useState<AssignmentGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [togglingGroupId, setTogglingGroupId] = useState<string | null>(null);

  // assignments view
  const [activeGroup, setActiveGroup] = useState<AssignmentGroup | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // assignment form
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [existingRefFiles, setExistingRefFiles] = useState<RefFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // submissions view
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [ungradedCounts, setUngradedCounts] = useState<Record<string, number>>({});

  // review view
  const [activeSubmission, setActiveSubmission] = useState<SubmissionRow | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<SubFile[]>([]);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModuleId) loadGroups(selectedModuleId);
  }, [selectedModuleId]);

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, display_name')
        .eq('is_active', true)
        .neq('name', 'courses')
        .order('sort_order');
      if (error) throw error;
      const mods = data || [];
      setModules(mods);
      if (mods.length > 0) setSelectedModuleId(mods[0].id);
    } catch (err) {
      console.error('Error loading modules:', err);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadGroups = async (moduleId: string) => {
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('assignment_groups')
        .select('*, assignments(count)')
        .eq('module_id', moduleId)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      const mapped: AssignmentGroup[] = (data || []).map((g: any) => ({
        id: g.id,
        module_id: g.module_id,
        title: g.title,
        sort_order: g.sort_order,
        is_active: g.is_active,
        assignment_count: (g.assignments as any)?.[0]?.count ?? 0,
      }));
      setGroups(mapped);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadAssignments = async (groupId: string) => {
    setLoadingAssignments(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, assignment_reference_files(count)')
        .eq('group_id', groupId)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      const mapped: Assignment[] = (data || []).map((a: any) => ({
        id: a.id,
        group_id: a.group_id,
        title: a.title,
        instructions: a.instructions ?? null,
        sort_order: a.sort_order,
        is_active: a.is_active,
        ref_file_count: (a.assignment_reference_files as any)?.[0]?.count ?? 0,
      }));
      setAssignments(mapped);

      // Fetch ungraded submission counts for badge display
      const assignmentIds = mapped.map(a => a.id);
      if (assignmentIds.length > 0) {
        const { data: subData } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .in('assignment_id', assignmentIds)
          .eq('status', 'completed');
        const counts: Record<string, number> = {};
        (subData || []).forEach((s: any) => {
          counts[s.assignment_id] = (counts[s.assignment_id] || 0) + 1;
        });
        setUngradedCounts(counts);
      } else {
        setUngradedCounts({});
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const openGroup = async (group: AssignmentGroup) => {
    setActiveGroup(group);
    setView('assignments');
    await loadAssignments(group.id);
  };

  const openNewAssignmentForm = () => {
    setEditingAssignment(null);
    setFormTitle('');
    setFormInstructions('');
    setExistingRefFiles([]);
    setPendingFiles([]);
    setErrorMsg('');
    setView('form');
  };

  const openEditAssignmentForm = async (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormTitle(assignment.title);
    setFormInstructions(assignment.instructions ?? '');
    setPendingFiles([]);
    setErrorMsg('');
    // Load existing ref files
    const { data } = await supabase
      .from('assignment_reference_files')
      .select('id, file_name, file_path')
      .eq('assignment_id', assignment.id)
      .order('uploaded_at');
    setExistingRefFiles(data || []);
    setView('form');
  };

  const handleSaveGroup = async () => {
    if (!newGroupTitle.trim()) return;
    setSavingGroup(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('assignment_groups').insert({
        module_id: selectedModuleId,
        title: newGroupTitle.trim(),
        sort_order: groups.length,
        is_active: true,
        created_by: session?.user.id ?? null,
      });
      if (error) throw error;
      setNewGroupTitle('');
      setShowNewGroupForm(false);
      toast(setSuccessMsg, 'Group created.');
      await loadGroups(selectedModuleId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not create group.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleToggleGroup = async (group: AssignmentGroup) => {
    setTogglingGroupId(group.id);
    try {
      const { error } = await supabase
        .from('assignment_groups')
        .update({ is_active: !group.is_active })
        .eq('id', group.id);
      if (error) throw error;
      toast(setSuccessMsg, group.is_active ? 'Group deactivated.' : 'Group reactivated.');
      await loadGroups(selectedModuleId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update group.');
    } finally {
      setTogglingGroupId(null);
    }
  };

  const handleSaveAssignment = async () => {
    if (!formTitle.trim()) {
      setErrorMsg('Please enter a title for this assignment.');
      return;
    }
    if (!activeGroup) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let assignmentId: string;

      if (editingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update({ title: formTitle.trim(), instructions: formInstructions.trim() || null })
          .eq('id', editingAssignment.id);
        if (error) throw error;
        assignmentId = editingAssignment.id;
      } else {
        const { data, error } = await supabase
          .from('assignments')
          .insert({
            group_id: activeGroup.id,
            title: formTitle.trim(),
            instructions: formInstructions.trim() || null,
            sort_order: assignments.length,
            is_active: true,
            created_by: session?.user.id ?? null,
          })
          .select('id')
          .single();
        if (error) throw error;
        assignmentId = data.id;
      }

      for (const file of pendingFiles) {
        const safeName = sanitize(file.name);
        const path = `reference/${assignmentId}/${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from('assignments')
          .upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { error: dbErr } = await supabase
          .from('assignment_reference_files')
          .insert({ assignment_id: assignmentId, file_path: path, file_name: file.name });
        if (dbErr) throw dbErr;
      }

      toast(setSuccessMsg, editingAssignment ? 'Assignment updated.' : 'Assignment created.');
      await loadAssignments(activeGroup.id);
      setView('assignments');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAssignment = async () => {
    if (!editingAssignment || !activeGroup) return;
    setDeactivating(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_active: false })
        .eq('id', editingAssignment.id);
      if (error) throw error;
      toast(setSuccessMsg, 'Assignment deactivated. Existing submissions are preserved.');
      await loadAssignments(activeGroup.id);
      setView('assignments');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not deactivate assignment.');
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateAssignment = async (assignment: Assignment) => {
    if (!activeGroup) return;
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_active: true })
        .eq('id', assignment.id);
      if (error) throw error;
      toast(setSuccessMsg, 'Assignment reactivated.');
      await loadAssignments(activeGroup.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not reactivate assignment.');
    }
  };

  const processFiles = (files: File[]) => {
    const rejected: string[] = [];
    const accepted: File[] = [];
    for (const f of files) {
      if (!isFileAllowed(f)) {
        rejected.push(f.name);
      } else if (!pendingFiles.some(p => p.name === f.name && p.size === f.size)) {
        accepted.push(f);
      }
    }
    if (rejected.length > 0) {
      setRejectedNames(rejected);
      setTimeout(() => setRejectedNames([]), 5000);
    }
    if (accepted.length > 0) setPendingFiles(prev => [...prev, ...accepted]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const openSubmissions = async (assignment: Assignment) => {
    setActiveAssignment(assignment);
    setView('submissions');
    setLoadingSubmissions(true);
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('id, assignment_id, client_id, status, submitted_at, feedback, reviewed_at, clients(email)')
        .eq('assignment_id', assignment.id)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      const mapped: SubmissionRow[] = (data || []).map((s: any) => ({
        id: s.id,
        assignment_id: s.assignment_id,
        client_id: s.client_id,
        client_email: s.clients?.email ?? 'Unknown',
        status: s.status,
        submitted_at: s.submitted_at,
        feedback: s.feedback,
        reviewed_at: s.reviewed_at,
      }));
      setSubmissions(mapped);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const openReview = async (submission: SubmissionRow) => {
    setActiveSubmission(submission);
    setReviewFeedback(submission.feedback ?? '');
    setView('review');
    setLoadingReview(true);
    try {
      const { data, error } = await supabase
        .from('assignment_submission_files')
        .select('id, file_name, file_path, uploaded_at')
        .eq('submission_id', submission.id)
        .order('uploaded_at');
      if (error) throw error;
      setSubmissionFiles(data || []);
    } catch (err) {
      console.error('Error loading submission files:', err);
    } finally {
      setLoadingReview(false);
    }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignments')
        .createSignedUrl(filePath, 60);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast(setErrorMsg, 'Could not download file.');
    }
  };

  const handleMarkReviewed = async () => {
    if (!activeSubmission || !activeAssignment) return;
    setSavingReview(true);
    setErrorMsg('');
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          status: 'reviewed',
          reviewed_at: nowIso,
          feedback: reviewFeedback.trim() || null,
        })
        .eq('id', activeSubmission.id);
      if (error) throw error;
      toast(setSuccessMsg, 'Marked as reviewed.');
      const updated: SubmissionRow = {
        ...activeSubmission,
        status: 'reviewed',
        reviewed_at: nowIso,
        feedback: reviewFeedback.trim() || null,
      };
      setActiveSubmission(updated);
      setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
      setUngradedCounts(prev => ({
        ...prev,
        [activeAssignment.id]: Math.max(0, (prev[activeAssignment.id] ?? 0) - 1),
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update submission.');
    } finally {
      setSavingReview(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!activeSubmission) return;
    setSavingReview(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({ feedback: reviewFeedback.trim() || null })
        .eq('id', activeSubmission.id);
      if (error) throw error;
      toast(setSuccessMsg, 'Feedback saved.');
      const updated: SubmissionRow = { ...activeSubmission, feedback: reviewFeedback.trim() || null };
      setActiveSubmission(updated);
      setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save feedback.');
    } finally {
      setSavingReview(false);
    }
  };

  // ── GROUPS VIEW ──────────────────────────────────────────────
  if (view === 'groups') {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
              <p className="text-sm text-slate-500">Organise assignments by module and group</p>
            </div>
          </div>
        </div>

        {/* Toasts */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
          </div>
        )}

        {/* Module tabs */}
        {loadingModules ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm px-1">
            <Loader className="w-4 h-4 animate-spin" /> Loading modules...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {modules.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModuleId(m.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedModuleId === m.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
                }`}
              >
                {m.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Groups panel */}
        {selectedModuleId && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">
                {modules.find(m => m.id === selectedModuleId)?.display_name} — Groups
              </h3>
              <button
                onClick={() => { setShowNewGroupForm(v => !v); setNewGroupTitle(''); setErrorMsg(''); }}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Group
              </button>
            </div>

            {/* Inline new-group form */}
            {showNewGroupForm && (
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                <p className="text-xs font-semibold text-emerald-700 mb-2 uppercase tracking-wide">Create a new group</p>
                <div className="flex gap-3">
                  <input
                    autoFocus
                    type="text"
                    value={newGroupTitle}
                    onChange={e => setNewGroupTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveGroup(); if (e.key === 'Escape') setShowNewGroupForm(false); }}
                    placeholder="Group title, e.g. Scientific Manifestation"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleSaveGroup}
                    disabled={savingGroup || !newGroupTitle.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {savingGroup ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => setShowNewGroupForm(false)}
                    className="px-3 py-2.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Group list */}
            {loadingGroups ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm p-6">
                <Loader className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : groups.length === 0 ? (
              <div className="p-10 text-center">
                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No groups yet for this module.</p>
                <p className="text-slate-400 text-xs mt-1">Click "New Group" above to create one.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                      group.is_active ? 'hover:bg-slate-50' : 'opacity-60 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${group.is_active ? 'text-slate-900' : 'text-slate-500'}`}>
                        {group.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.assignment_count === 0
                          ? 'No assignments yet'
                          : `${group.assignment_count} assignment${group.assignment_count !== 1 ? 's' : ''}`}
                        {!group.is_active && (
                          <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                            <EyeOff className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {group.is_active && (
                        <button
                          onClick={() => openGroup(group)}
                          className="px-4 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Open →
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleGroup(group)}
                        disabled={togglingGroupId === group.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          group.is_active
                            ? 'text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingGroupId === group.id
                          ? <Loader className="w-3 h-3 animate-spin" />
                          : group.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── ASSIGNMENTS VIEW ──────────────────────────────────────────
  if (view === 'assignments' && activeGroup) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Breadcrumb + header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          <button
            onClick={() => { setView('groups'); setActiveGroup(null); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to groups
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{activeGroup.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {modules.find(m => m.id === activeGroup.module_id)?.display_name}
              </p>
            </div>
            <button
              onClick={openNewAssignmentForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </button>
          </div>
        </div>

        {/* Toasts */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
          </div>
        )}

        {/* Assignment list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingAssignments ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm p-6">
              <Loader className="w-4 h-4 animate-spin" /> Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No assignments in this group yet.</p>
              <p className="text-slate-400 text-xs mt-1">Click "New Assignment" to add the first one.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map(a => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${!a.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${a.is_active ? 'text-slate-900' : 'text-slate-500'}`}>
                        {a.title}
                      </p>
                      {!a.is_active && (
                        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    {a.instructions && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                        {a.instructions}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {a.ref_file_count === 0
                        ? 'No reference files'
                        : `${a.ref_file_count} reference file${a.ref_file_count !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!a.is_active && (
                      <button
                        onClick={() => handleReactivateAssignment(a)}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => openSubmissions(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      View Submissions
                      {(ungradedCounts[a.id] ?? 0) > 0 && (
                        <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {ungradedCounts[a.id]}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => openEditAssignmentForm(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ASSIGNMENT FORM VIEW ──────────────────────────────────────
  if (view === 'form' && activeGroup) {
    const isEditing = editingAssignment !== null;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          <button
            onClick={() => { setView('assignments'); setErrorMsg(''); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to {activeGroup.title}
          </button>
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeGroup.title} — {modules.find(m => m.id === activeGroup.module_id)?.display_name}
          </p>
        </div>

        {/* Toasts */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-7">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Assignment title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g. Day 1: Gratitude Journal"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Instructions <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Tell your mentee what to do. Keep it clear and simple.
            </p>
            <textarea
              value={formInstructions}
              onChange={e => setFormInstructions(e.target.value)}
              placeholder="e.g. Watch the video above, then write down 3 things you are grateful for today and upload your notes below."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-vertical leading-relaxed"
            />
          </div>

          {/* Existing reference files (edit mode only) */}
          {isEditing && existingRefFiles.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Already attached files
              </p>
              <div className="space-y-2">
                {existingRefFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{f.file_name}</span>
                    <span className="ml-auto text-xs text-slate-400">saved</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference file upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Attach reference files <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Templates, worksheets, or images for your mentee. Accepted: .doc, .docx, .jpg, .jpeg, .png
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".doc,.docx,.jpg,.jpeg,.png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
            </div>

            {rejectedNames.length > 0 && (
              <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">File type not allowed:</p>
                  {rejectedNames.map(n => <p key={n} className="text-xs text-red-700 mt-0.5">{n}</p>)}
                  <p className="text-xs text-red-600 mt-1">Only .doc, .docx, .jpg, .jpeg, .png accepted.</p>
                </div>
              </div>
            )}

            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500 font-medium">{pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to upload</p>
                {pendingFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-slate-800 truncate flex-1">{file.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleSaveAssignment}
              disabled={saving || !formTitle.trim()}
              className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4" />{isEditing ? 'Update Assignment' : 'Save Assignment'}</>
              )}
            </button>

            <button
              onClick={() => { setView('assignments'); setErrorMsg(''); }}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Deactivate option (edit mode, active assignment only) */}
          {isEditing && editingAssignment.is_active && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleDeactivateAssignment}
                disabled={deactivating || saving}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {deactivating
                  ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Deactivating...</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Deactivate this assignment</>}
              </button>
              <p className="text-xs text-slate-400 mt-1">
                Mentees won't see this assignment. Existing submissions are not affected.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SUBMISSIONS VIEW ──────────────────────────────────────────
  if (view === 'submissions' && activeAssignment && activeGroup) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          <button
            onClick={() => { setView('assignments'); setActiveAssignment(null); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to {activeGroup.title}
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Inbox className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Submissions</h2>
              <p className="text-sm text-slate-500 mt-0.5">{activeAssignment.title}</p>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingSubmissions ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm p-6">
              <Loader className="w-4 h-4 animate-spin" /> Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-10 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No submissions yet for this assignment.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{s.client_email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted {new Date(s.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {s.status === 'completed' && (
                      <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1">
                        Completed
                      </span>
                    )}
                    {s.status === 'reviewed' && (
                      <span className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2.5 py-1">
                        Reviewed
                      </span>
                    )}
                    <button
                      onClick={() => openReview(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── REVIEW VIEW ───────────────────────────────────────────────
  if (view === 'review' && activeSubmission && activeAssignment) {
    const isReviewed = activeSubmission.status === 'reviewed';
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          <button
            onClick={() => { setView('submissions'); setActiveSubmission(null); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to submissions
          </button>
          <h2 className="text-xl font-bold text-slate-900">Review Submission</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeSubmission.client_email} — {activeAssignment.title}
          </p>
          {isReviewed && activeSubmission.reviewed_at && (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" />
              Reviewed on {new Date(activeSubmission.reviewed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
          </div>
        )}

        {activeAssignment.instructions && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Assignment Instructions</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{activeAssignment.instructions}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Submitted Files</h3>
          {loadingReview ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader className="w-4 h-4 animate-spin" /> Loading files...
            </div>
          ) : submissionFiles.length === 0 ? (
            <p className="text-sm text-slate-500">No files uploaded with this submission.</p>
          ) : (
            <div className="space-y-2">
              {submissionFiles.map(f => (
                <button
                  key={f.id}
                  onClick={() => downloadFile(f.file_path)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate flex-1">{f.file_name}</span>
                  <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Feedback <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              value={reviewFeedback}
              onChange={e => setReviewFeedback(e.target.value)}
              placeholder="Write feedback for your mentee..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-vertical leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isReviewed ? (
              <button
                onClick={handleMarkReviewed}
                disabled={savingReview}
                className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {savingReview ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Mark as Reviewed</>
                )}
              </button>
            ) : (
              <button
                onClick={handleSaveFeedback}
                disabled={savingReview}
                className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {savingReview ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Save Feedback</>
                )}
              </button>
            )}
            <button
              onClick={() => { setView('submissions'); setActiveSubmission(null); }}
              disabled={savingReview}
              className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't happen)
  return null;
}

export default AssignmentCreator;
