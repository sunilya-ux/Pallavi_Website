import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface DipictoItem {
  type: string;
  point: string;
  how_to: string;
}

interface ProgramStep {
  title: string;
  description: string;
  dipicto: DipictoItem[];
  module: {
    how_to: string;
    name: string;
  };
}

interface ProgramResult {
  program_name: string;
  steps: ProgramStep[];
}

interface ProgramBuilderProps {
  niche: string;
  who: string;
  struggle: string;
  result: string;
  onBack: () => void;
}

const SPINNER_MESSAGES = [
  "Mapping the steps to your client's result...",
  'Finding their doubts, pains and obstacles...',
  'Turning them into how-to questions...',
  'Creating powerful module names...',
  'Naming your program...',
  'Almost done...',
];

function buildCopyText(program: ProgramResult): string {
  const lines: string[] = [program.program_name, ''];
  program.steps.forEach((step, i) => {
    lines.push(`Module ${i + 1}: ${step.module.name}`);
    lines.push(`Solves: ${step.module.how_to}`);
    lines.push('');
  });
  return lines.join('\n').trimEnd();
}

export default function ProgramBuilder({ niche, who, struggle, result, onBack }: ProgramBuilderProps) {
  const [whoInput, setWhoInput] = useState(who);
  const [resultInput, setResultInput] = useState(result);
  const [building, setBuilding] = useState(false);
  const [program, setProgram] = useState<ProgramResult | null>(null);
  const [genError, setGenError] = useState<'rate_limited' | 'generic' | null>(null);
  const [validationMsg, setValidationMsg] = useState(false);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const spinnerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (building) {
      spinnerTimerRef.current = setInterval(() => {
        setSpinnerIdx((prev) => (prev + 1) % SPINNER_MESSAGES.length);
      }, 2500);
    } else {
      if (spinnerTimerRef.current) {
        clearInterval(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
      }
      setSpinnerIdx(0);
    }
    return () => {
      if (spinnerTimerRef.current) {
        clearInterval(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
      }
    };
  }, [building]);

  useEffect(() => {
    if (program && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [program]);

  const handleBuild = async () => {
    if (!whoInput.trim() || !resultInput.trim()) {
      setValidationMsg(true);
      return;
    }
    setValidationMsg(false);
    setGenError(null);
    setProgram(null);
    setBuilding(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche,
          who: whoInput.trim(),
          struggle,
          result: resultInput.trim(),
        }),
      });

      if (!response.ok) {
        let reason = '';
        try {
          const errBody = await response.json();
          reason = errBody?.reason || '';
        } catch { /* ignore */ }
        const isRateLimited = response.status === 429 || reason === 'rate_limited';
        console.error('generate-program failed:', response.status, reason);
        setGenError(isRateLimited ? 'rate_limited' : 'generic');
        return;
      }

      const data = await response.json();
      if (!data || !data.program_name || !Array.isArray(data.steps)) {
        console.error('generate-program: invalid response shape');
        setGenError('generic');
        return;
      }
      setProgram(data);
    } catch (err) {
      console.error('generate-program: network error', err);
      setGenError('generic');
    } finally {
      setBuilding(false);
    }
  };

  const handleCopy = async () => {
    if (!program) return;
    try {
      await navigator.clipboard.writeText(buildCopyText(program));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div ref={topRef} className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to my brand kit
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create Your Signature Program</h1>
        <p className="text-sm sm:text-base text-slate-600">
          We'll turn your niche into a 4-module program with powerful names.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Who you help</label>
            <input
              type="text"
              value={whoInput}
              onChange={(e) => setWhoInput(e.target.value)}
              placeholder="e.g. ambitious working women"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">The result they want</label>
            <input
              type="text"
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              placeholder="e.g. a fulfilling second career"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {validationMsg && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">Please fill both boxes to build your program.</p>
          </div>
        )}

        {genError === 'rate_limited' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Lots of people are building their program right now. Please wait a moment and click Build again.
            </p>
          </div>
        )}
        {genError === 'generic' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Something went wrong while building your program. Please click Build again.
            </p>
          </div>
        )}

        <button
          onClick={handleBuild}
          disabled={building}
          className="w-full mt-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {building ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{SPINNER_MESSAGES[spinnerIdx]}</span>
            </>
          ) : (
            <span>✨ Build My Program</span>
          )}
        </button>
      </div>

      {program && (
        <div ref={resultsRef} className="space-y-6 scroll-mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-100 mb-2">Your Program</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{program.program_name}</h2>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your 4 Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {program.steps.map((step, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-2">Module {i + 1}</p>
                    <p className="text-lg font-bold text-slate-900 mb-2 leading-snug">{step.module.name}</p>
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-600">Solves:</span> {step.module.how_to}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : '📋 Copy my program'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-lg font-bold text-slate-900">🔍 See how your program was built</span>
              {showBreakdown ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {showBreakdown && (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-8">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Stage 1 — Your 4 Steps</h4>
                  <ol className="space-y-4">
                    {program.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Stage 2 — What will hold them back (DIPICTO)</h4>
                  <div className="space-y-3">
                    {program.steps.map((step, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setOpenStep(openStep === i ? null : i)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-sm font-semibold text-slate-800">Step {i + 1}: {step.title}</span>
                          {openStep === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {openStep === i && (
                          <div className="px-4 pb-4 space-y-2">
                            {step.dipicto.map((d, j) => (
                              <div key={j} className="text-sm">
                                <span className="font-semibold text-teal-700">{d.type}:</span>{' '}
                                <span className="text-slate-600">{d.point}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Stage 3 — How-to questions</h4>
                  <div className="space-y-4">
                    {program.steps.map((step, i) => (
                      <div key={i}>
                        <p className="text-sm font-semibold text-slate-800 mb-2">Step {i + 1}: {step.title}</p>
                        <ul className="space-y-1.5 pl-4">
                          {step.dipicto.map((d, j) => (
                            <li
                              key={j}
                              className={`text-sm ${d.how_to === step.module.how_to ? 'font-bold text-slate-900' : 'text-slate-500'}`}
                            >
                              {d.how_to === step.module.how_to && <span className="mr-1">⭐</span>}
                              {d.how_to}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleBuild}
            disabled={building}
            className="w-full bg-white border-2 border-teal-200 text-teal-700 py-3.5 rounded-xl font-semibold hover:bg-teal-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <RefreshCw className="w-4 h-4" />
            Build again
          </button>
        </div>
      )}
    </div>
  );
}
