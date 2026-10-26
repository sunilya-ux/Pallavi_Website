import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Copy, Check, CheckCircle2, Sparkles } from 'lucide-react';

interface ProgramStep {
  label: string;
  title: string;
  intro: string;
  imagine: string[];
  dream_outcome: string;
}

interface ProgramInclude {
  title: string;
  description: string;
}

interface ProgramResult {
  program_name: string;
  tagline: string;
  subtitle: string;
  core_promise: string;
  designed_for: string[];
  steps: ProgramStep[];
  includes: ProgramInclude[];
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
  'Creating powerful step names...',
  'Naming your program...',
  'Almost done...',
];

function buildCopyText(program: ProgramResult): string {
  const lines: string[] = [];
  lines.push(program.program_name);
  lines.push('');
  lines.push(program.tagline);
  lines.push('');
  lines.push(program.subtitle);
  lines.push('');
  lines.push(`The Core Promise`);
  lines.push(program.core_promise);
  lines.push('');
  lines.push(`This program is designed for you if you…`);
  program.designed_for.forEach((d) => lines.push(`• ${d}`));
  lines.push('');
  lines.push(`The 4-Step Transformation`);
  program.steps.forEach((step, i) => {
    lines.push('');
    lines.push(`Step ${i + 1} · ${step.label}`);
    lines.push(step.title);
    lines.push(step.intro);
    lines.push('');
    lines.push('Imagine being able to:');
    step.imagine.forEach((im) => lines.push(`• ${im}`));
    lines.push('');
    lines.push('The dream outcome:');
    lines.push(`"${step.dream_outcome}"`);
  });
  lines.push('');
  lines.push(`What's Included`);
  program.includes.forEach((inc) => {
    lines.push(`• ${inc.title}: ${inc.description}`);
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
          We'll turn your niche into a 4-step signature program with a complete, sales-ready offer.
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
          {/* Header card */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-100 mb-2">YOUR SIGNATURE PROGRAM</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{program.program_name}</h2>
              {program.tagline && (
                <p className="text-base sm:text-lg font-semibold text-white/95 mb-2">{program.tagline}</p>
              )}
              {program.subtitle && (
                <p className="text-sm sm:text-base text-white/80">{program.subtitle}</p>
              )}
            </div>
          </div>

          {/* Core promise */}
          {program.core_promise && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 sm:p-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-700 mb-3">The Core Promise</h3>
              <p className="text-lg text-slate-800 leading-relaxed">{program.core_promise}</p>
            </div>
          )}

          {/* Designed for */}
          {program.designed_for.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">This program is designed for you if you…</h3>
              <ul className="space-y-3">
                {program.designed_for.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4-Step Transformation */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">The 4-Step Transformation</h3>
            <div className="space-y-4">
              {program.steps.map((step, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-700 px-3 py-1 rounded-full mb-3">
                    STEP {i + 1} · {step.label}
                  </span>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug">{step.title}</h4>
                  {step.intro && (
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">{step.intro}</p>
                  )}
                  {step.imagine.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-slate-700 mb-3">Imagine being able to:</p>
                      <ul className="space-y-2 mb-4">
                        {step.imagine.map((im, j) => (
                          <li key={j} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 leading-relaxed">{im}</p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {step.dream_outcome && (
                    <div className="bg-amber-50 border-l-4 border-teal-500 rounded-r-lg px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700 mb-1">The dream outcome:</p>
                      <p className="text-sm sm:text-base italic text-slate-800 leading-relaxed">"{step.dream_outcome}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What's included */}
          {program.includes.length > 0 && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">What's Included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {program.includes.map((inc, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <Sparkles className="w-5 h-5 text-teal-600 mb-2" />
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{inc.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{inc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : '📋 Copy my program'}
            </button>
            <button
              onClick={handleBuild}
              disabled={building}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-teal-200 text-teal-700 text-sm font-semibold hover:bg-teal-50 transition-all duration-200 disabled:opacity-70"
            >
              <RefreshCw className="w-4 h-4" />
              Build again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
