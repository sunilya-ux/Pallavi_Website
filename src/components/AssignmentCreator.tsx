import { useState, useEffect, useRef } from 'react';
import { ClipboardList, UploadCloud, X, CheckCircle, Loader, AlertCircle, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Tool {
  id: string;
  module_id: string;
  display_name: string;
  icon: string;
}

interface ModuleGroup {
  id: string;
  display_name: string;
  tools: Tool[];
}

interface ExistingAssignment {
  id: string;
  instructions: string;
  is_active: boolean;
}

interface ExistingRefFile {
  id: string;
  file_name: string;
  file_path: string;
}

interface PendingFile {
  file: File;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.jpg', '.jpeg', '.png'];

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function isFileAllowed(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const ext = getFileExtension(file.name);
  return ALLOWED_EXTENSIONS.includes(ext);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default function AssignmentCreator() {
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [existingAssignment, setExistingAssignment] = useState<ExistingAssignment | null>(null);
  const [existingRefFiles, setExistingRefFiles] = useState<ExistingRefFile[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const [instructions, setInstructions] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [rejectedFileNames, setRejectedFileNames] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadModulesAndTools();
  }, []);

  useEffect(() => {
    if (selectedToolId) {
      loadExistingAssignment(selectedToolId);
    } else {
      setExistingAssignment(null);
      setExistingRefFiles([]);
      setInstructions('');
      setPendingFiles([]);
    }
  }, [selectedToolId]);

  const loadModulesAndTools = async () => {
    try {
      setLoadingTools(true);
      const [modulesRes, toolsRes] = await Promise.all([
        supabase.from('modules').select('id, display_name, name').eq('is_active', true).order('sort_order'),
        supabase.from('tools').select('id, module_id, display_name, icon').eq('is_active', true).order('sort_order'),
      ]);
      if (modulesRes.error) throw modulesRes.error;
      if (toolsRes.error) throw toolsRes.error;

      const eligibleModules = (modulesRes.data || []).filter(m => m.name !== 'courses');

      const groups: ModuleGroup[] = eligibleModules
        .map(m => ({
          id: m.id,
          display_name: m.display_name,
          tools: (toolsRes.data || []).filter(t => t.module_id === m.id),
        }))
        .filter(g => g.tools.length > 0);

      setModuleGroups(groups);
    } catch (err) {
      console.error('Error loading tools:', err);
    } finally {
      setLoadingTools(false);
    }
  };

  const loadExistingAssignment = async (toolId: string) => {
    setLoadingAssignment(true);
    setExistingAssignment(null);
    setExistingRefFiles([]);
    setInstructions('');
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('id, instructions, is_active')
        .eq('tool_id', toolId)
        .eq('is_active', true)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (assignmentData) {
        setExistingAssignment(assignmentData);
        setInstructions(assignmentData.instructions || '');

        const { data: filesData, error: filesError } = await supabase
          .from('assignment_reference_files')
          .select('id, file_name, file_path')
          .eq('assignment_id', assignmentData.id)
          .order('uploaded_at');
        if (filesError) throw filesError;
        setExistingRefFiles(filesData || []);
      }
    } catch (err) {
      console.error('Error loading assignment:', err);
    } finally {
      setLoadingAssignment(false);
    }
  };

  const processFiles = (files: File[]) => {
    const rejected: string[] = [];
    const accepted: PendingFile[] = [];

    for (const file of files) {
      if (!isFileAllowed(file)) {
        rejected.push(file.name);
      } else {
        const alreadyPending = pendingFiles.some(p => p.file.name === file.name && p.file.size === file.size);
        if (!alreadyPending) {
          accepted.push({ file });
        }
      }
    }

    if (rejected.length > 0) {
      setRejectedFileNames(rejected);
      setTimeout(() => setRejectedFileNames([]), 5000);
    }
    if (accepted.length > 0) {
      setPendingFiles(prev => [...prev, ...accepted]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedToolId) return;
    if (!instructions.trim()) {
      setErrorMessage('Please write some instructions for the mentee before saving.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated. Please refresh and log in again.');

      let assignmentId: string;

      if (existingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update({ instructions: instructions.trim(), is_active: true })
          .eq('id', existingAssignment.id);
        if (error) throw error;
        assignmentId = existingAssignment.id;
      } else {
        const { data, error } = await supabase
          .from('assignments')
          .insert({
            tool_id: selectedToolId,
            instructions: instructions.trim(),
            is_active: true,
            created_by: session.user.id,
          })
          .select('id')
          .single();
        if (error) throw error;
        assignmentId = data.id;
      }

      for (const { file } of pendingFiles) {
        const safeName = sanitizeFileName(file.name);
        const path = `reference/${assignmentId}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('assignment_reference_files')
          .insert({ assignment_id: assignmentId, file_path: path, file_name: file.name });
        if (dbError) throw dbError;
      }

      setPendingFiles([]);
      setSuccessMessage(existingAssignment ? 'Assignment updated successfully.' : 'Assignment created successfully.');
      await loadExistingAssignment(selectedToolId);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!existingAssignment) return;
    setDeactivating(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_active: false })
        .eq('id', existingAssignment.id);
      if (error) throw error;

      setExistingAssignment(null);
      setExistingRefFiles([]);
      setInstructions('');
      setPendingFiles([]);
      setSuccessMessage('Assignment removed. Mentees will no longer see this assignment.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not remove the assignment. Please try again.');
    } finally {
      setDeactivating(false);
    }
  };

  const selectedToolName = (() => {
    for (const group of moduleGroups) {
      const tool = group.tools.find(t => t.id === selectedToolId);
      if (tool) return tool.display_name;
    }
    return '';
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
            <p className="text-sm text-slate-500">Create or edit homework assignments for your tools</p>
          </div>
        </div>
      </div>

      {/* Toast messages */}
      {successMessage && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Tool picker */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Which tool is this assignment for?
        </label>

        {loadingTools ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
            <Loader className="w-4 h-4 animate-spin" />
            Loading tools...
          </div>
        ) : (
          <select
            value={selectedToolId}
            onChange={e => setSelectedToolId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none cursor-pointer"
          >
            <option value="">-- Select a tool --</option>
            {moduleGroups.map(group => (
              <optgroup key={group.id} label={group.display_name}>
                {group.tools.map(tool => (
                  <option key={tool.id} value={tool.id}>
                    {tool.display_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {selectedToolId && loadingAssignment && (
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
            <Loader className="w-4 h-4 animate-spin" />
            Checking for existing assignment...
          </div>
        )}

        {selectedToolId && !loadingAssignment && existingAssignment && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{selectedToolName}</span> already has an active assignment — you can edit it below.
            </p>
          </div>
        )}
      </div>

      {/* Assignment form — shown once a tool is selected and not loading */}
      {selectedToolId && !loadingAssignment && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              What should the mentee do?
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Write clear, simple instructions. Your mentee will read this when they open the tool.
            </p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Watch the tool video, then fill in the worksheet using your own niche ideas. Upload your completed worksheet here when you're done."
              rows={7}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-900 resize-vertical leading-relaxed"
            />
          </div>

          {/* Existing reference files */}
          {existingRefFiles.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Already attached files</p>
              <div className="space-y-2">
                {existingRefFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{f.file_name}</span>
                    <span className="ml-auto text-xs text-slate-400">saved</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Attach reference files <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload templates, worksheets, or example images for your mentee to download.
              Accepted: .doc, .docx, .jpg, .jpeg, .png
            </p>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
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
              <UploadCloud className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">.doc, .docx, .jpg, .jpeg, .png only</p>
            </div>

            {/* Rejected files warning */}
            {rejectedFileNames.length > 0 && (
              <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {rejectedFileNames.length === 1 ? 'This file type is not allowed:' : 'These file types are not allowed:'}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {rejectedFileNames.map(name => (
                      <li key={name} className="text-xs text-red-700">{name}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 mt-1">Only .doc, .docx, .jpg, .jpeg, and .png files are accepted.</p>
                </div>
              </div>
            )}

            {/* Pending file list */}
            {pendingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-600">
                  {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to upload
                </p>
                {pendingFiles.map(({ file }, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-slate-800 truncate flex-1">{file.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => removePendingFile(idx)}
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !instructions.trim()}
              className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : existingAssignment ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Update Assignment
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Assignment
                </>
              )}
            </button>

            {existingAssignment && (
              <button
                onClick={handleDeactivate}
                disabled={deactivating || saving}
                className="flex-1 sm:flex-none px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {deactivating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove This Assignment
                  </>
                )}
              </button>
            )}
          </div>

          {existingAssignment && (
            <p className="text-xs text-slate-400">
              "Remove" hides the assignment from mentees without deleting any submissions already made.
            </p>
          )}
        </div>
      )}

      {/* Empty state when no tool selected */}
      {!selectedToolId && !loadingTools && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">Select a tool above to create or edit its assignment.</p>
        </div>
      )}
    </div>
  );
}
