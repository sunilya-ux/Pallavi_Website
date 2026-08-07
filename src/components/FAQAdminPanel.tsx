import { useState, useEffect } from 'react';
import { MessageCircleQuestion, Download, CheckCircle, Circle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface UnansweredQuestion {
  id: string;
  question_text: string;
  client_email: string | null;
  created_at: string;
  resolved: boolean;
}

export default function FAQAdminPanel() {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('faq_unanswered_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setQuestions(data || []);
    } catch (err) {
      console.error('[FAQAdminPanel] Failed to fetch questions:', err);
      setError('Failed to load questions. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (id: string, current: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, resolved: !current } : q))
    );

    const { error: updateError } = await supabase
      .from('faq_unanswered_questions')
      .update({ resolved: !current })
      .eq('id', id);

    if (updateError) {
      console.error('[FAQAdminPanel] Failed to update question:', updateError);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, resolved: current } : q))
      );
    }
  };

  const handleExport = () => {
    const rows = filteredQuestions.map((q) => ({
      Question: q.question_text,
      'Asked By': q.client_email || 'Unknown',
      Date: new Date(q.created_at).toLocaleString(),
      Status: q.resolved ? 'Resolved' : 'Open',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 50 }, { wch: 28 }, { wch: 20 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FAQ Questions');
    XLSX.writeFile(workbook, `faq-unanswered-questions-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'open') return !q.resolved;
    if (filter === 'resolved') return q.resolved;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <MessageCircleQuestion className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Unanswered Questions</h2>
        </div>
        <p className="text-slate-600 mb-6 ml-[52px]">
          Questions mentees typed into the chat widget that didn't match anything in the FAQ list.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
            {(['open', 'resolved', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={filteredQuestions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader className="w-5 h-5 animate-spin mr-2" />
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No {filter !== 'all' ? filter : ''} questions found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <button
                  onClick={() => toggleResolved(q.id, q.resolved)}
                  className="mt-0.5 flex-shrink-0"
                  aria-label={q.resolved ? 'Mark as open' : 'Mark as resolved'}
                >
                  {q.resolved ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${q.resolved ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {q.question_text}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {q.client_email || 'Unknown client'} &middot; {new Date(q.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
