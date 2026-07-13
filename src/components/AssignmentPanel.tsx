import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ClipboardList, UploadCloud, X, CheckCircle,
  Loader, AlertCircle, Download, FileText, MessageSquare,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssignmentPanelProps {
  assignment: { id: string; title: string; instructions: string | null };
  groupTitle: string;
  clientId: string;
  onBack: () => void;
}

interface RefFile {
  id: string;
  file_name: string;
  file_path: string;
  signedUrl?: string;
}

interface Submission {
  id: string;
  status: 'completed' | 'reviewed';
  feedback: string | null;
}

interface SubmissionFile {
  id: string;
  file_name: string;
  file_path: string;
  signedUrl?: string;
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

async function makeSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('assignments').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default function AssignmentPanel({
  assignment,
  groupTitle,
  clientId,
  onBack,
}: AssignmentPanelProps) {
  const [loading, setLoading] = useState(true);
  const [refFiles, setRefFiles] = useState<RefFile[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<SubmissionFile[]>([]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [assignment.id, clientId]);

  const loadData = async () => {
    setLoading(true);
    setPendingFiles([]);
    setSubmitError('');
    try {
      const [refRes, subRes] = await Promise.all([
        supabase
          .from('assignment_reference_files')
          .select('id, file_name, file_path')
          .eq('assignment_id', assignment.id)
          .order('uploaded_at'),
        supabase
          .from('assignment_submissions')
          .select('id, status, feedback')
          .eq('assignment_id', assignment.id)
          .eq('client_id', clientId)
          .maybeSingle(),
      ]);

      // Signed URLs for reference files
      const refWithUrls: RefFile[] = await Promise.all(
        (refRes.data || []).map(async f => ({
          ...f,
          signedUrl: (await makeSignedUrl(f.file_path)) ?? undefined,
        }))
      );
      setRefFiles(refWithUrls);

      const sub = subRes.data as Submission | null;
      setSubmission(sub);

      if (sub) {
        const { data: subFiles } = await supabase
          .from('assignment_submission_files')
          .select('id, file_name, file_path')
          .eq('submission_id', sub.id)
          .order('uploaded_at');
        const subWithUrls: SubmissionFile[] = await Promise.all(
          (subFiles || []).map(async f => ({
            ...f,
            signedUrl: (await makeSignedUrl(f.file_path)) ?? undefined,
          }))
        );
        setSubmissionFiles(subWithUrls);
      } else {
        setSubmissionFiles([]);
      }
    } catch (err) {
      console.error('[AssignmentPanel] load error:', err);
    } finally {
      setLoading(false);
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

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data: sub, error: subErr } = await supabase
        .from('assignment_submissions')
        .insert({ assignment_id: assignment.id, client_id: clientId, status: 'completed' })
        .select('id')
        .single();
      if (subErr) throw subErr;

      for (const file of pendingFiles) {
        const path = `submissions/${sub.id}/${sanitize(file.name)}`;
        const { error: uploadErr } = await supabase.storage
          .from('assignments')
          .upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { error: fileRowErr } = await supabase
          .from('assignment_submission_files')
          .insert({ submission_id: sub.id, file_path: path, file_name: file.name });
        if (fileRowErr) throw fileRowErr;
      }

      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-emerald-200 hover:text-white text-xs font-medium mb-3 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to {groupTitle}
        </button>
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-white/80" />
          <div>
            <p className="text-emerald-100 text-xs font-medium">{groupTitle}</p>
            <h2 className="text-xl font-bold text-white">{assignment.title}</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-slate-500 text-sm">Loading...</span>
        </div>
      ) : (
        <div className="p-6 space-y-6">

          {/* ── REVIEWED ── */}
          {submission?.status === 'reviewed' && (
            <>
              <StatusBanner type="reviewed" />
              {submissionFiles.length > 0 && (
                <FileList label="Your submitted files" files={submissionFiles} />
              )}
              {submission.feedback ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">Feedback from your coach</p>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                </div>
              ) : null}
            </>
          )}

          {/* ── COMPLETED (waiting for review) ── */}
          {submission?.status === 'completed' && (
            <>
              {assignment.instructions && (
                <Instructions text={assignment.instructions} />
              )}
              {submissionFiles.length > 0 && (
                <FileList label="Your submitted files" files={submissionFiles} />
              )}
              <StatusBanner type="completed" />
            </>
          )}

          {/* ── NOT STARTED ── */}
          {!submission && (
            <>
              {assignment.instructions && (
                <Instructions text={assignment.instructions} />
              )}

              {refFiles.length > 0 && (
                <FileList label="Files from your coach" files={refFiles} />
              )}

              {/* Upload zone */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Upload your work
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
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
                  <UploadCloud className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Drop your files here or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">.doc, .docx, .jpg, .jpeg, .png only</p>
                </div>

                {rejectedNames.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">File type not allowed:</p>
                      {rejectedNames.map(n => (
                        <p key={n} className="text-xs text-red-700 mt-0.5">{n}</p>
                      ))}
                      <p className="text-xs text-red-600 mt-1">
                        Only .doc, .docx, .jpg, .jpeg, .png are accepted.
                      </p>
                    </div>
                  </div>
                )}

                {pendingFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {pendingFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-slate-800 truncate flex-1">{file.name}</span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || pendingFiles.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Submitting your work... please wait
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Assignment
                  </>
                )}
              </button>
              {pendingFiles.length === 0 && !submitting && (
                <p className="text-xs text-slate-400 text-center -mt-2">
                  Upload at least one file to submit.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Instructions({ text }: { text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        What to do
      </p>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function FileList({
  label,
  files,
}: {
  label: string;
  files: Array<{ id: string; file_name: string; file_path: string; signedUrl?: string }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="space-y-2">
        {files.map(f => (
          <FileRow key={f.id} name={f.file_name} signedUrl={f.signedUrl} filePath={f.file_path} />
        ))}
      </div>
    </div>
  );
}

function StatusBanner({ type }: { type: 'completed' | 'reviewed' }) {
  if (type === 'completed') {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-800 font-medium">
          Submitted — your coach will review it and leave feedback here.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
      <p className="text-sm text-blue-800 font-medium">Reviewed by your coach</p>
    </div>
  );
}

function FileRow({
  name,
  signedUrl,
  filePath,
}: {
  name: string;
  signedUrl?: string;
  filePath: string;
}) {
  const [loadingUrl, setLoadingUrl] = useState(false);

  const handleDownload = async () => {
    let url = signedUrl;
    if (!url) {
      setLoadingUrl(true);
      const { data } = await supabase.storage.from('assignments').createSignedUrl(filePath, 3600);
      url = data?.signedUrl;
      setLoadingUrl(false);
    }
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span className="text-sm text-slate-700 truncate flex-1">{name}</span>
      <button
        onClick={handleDownload}
        disabled={loadingUrl}
        className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50 flex-shrink-0 transition-colors"
      >
        {loadingUrl ? (
          <Loader className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Download
      </button>
    </div>
  );
}
