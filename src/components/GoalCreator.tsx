import React, { useState, useRef, useEffect } from 'react';
import { Target, ArrowRight, Check, Loader, Download, Copy, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Step = 'dream' | 'specific' | 'measurable' | 'achievable' | 'relevant' | 'timebound' | 'smart-goal-draft' | 'emotional-check' | 'final-result';

interface Answers {
  dream: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
  emotionalCheck: string;
}

interface StepData {
  step: Step;
  question: string;
  answer: string;
}

export default function GoalCreator() {
  const [currentStep, setCurrentStep] = useState<Step>('dream');
  const [completedSteps, setCompletedSteps] = useState<StepData[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Answers>({
    dream: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timebound: '',
    emotionalCheck: ''
  });
  const [smartGoalDraft, setSmartGoalDraft] = useState('');
  const [refinementRequest, setRefinementRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalResult, setFinalResult] = useState('');
  const [showEmotionalWarning, setShowEmotionalWarning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [completedSteps, currentStep, smartGoalDraft, finalResult]);

  const getStepQuestion = (step: Step): string => {
    const questions = {
      'dream': 'Tell me your dream for the next 3–12 months. Don\'t refine it — just express it in one simple sentence.',
      'specific': 'What EXACTLY do you want to achieve?',
      'measurable': 'How will we measure progress?',
      'achievable': 'What strengths/resources do you have and what do you need?',
      'relevant': 'Why does this goal matter to you?',
      'timebound': 'What is your target date?',
      'emotional-check': 'How does this goal make you feel?',
      'smart-goal-draft': '',
      'final-result': ''
    };
    return questions[step];
  };

  const getNextStep = (step: Step): Step | null => {
    const flow: Record<Step, Step | null> = {
      'dream': 'specific',
      'specific': 'measurable',
      'measurable': 'achievable',
      'achievable': 'relevant',
      'relevant': 'timebound',
      'timebound': 'smart-goal-draft',
      'smart-goal-draft': 'emotional-check',
      'emotional-check': 'final-result',
      'final-result': null
    };
    return flow[step];
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() && currentStep !== 'timebound') return;
    if (currentStep === 'timebound' && !currentAnswer) return;

    const question = getStepQuestion(currentStep);

    setCompletedSteps(prev => [...prev, {
      step: currentStep,
      question,
      answer: currentAnswer
    }]);

    const updatedAnswers = { ...answers, [currentStep]: currentAnswer };
    setAnswers(updatedAnswers);

    if (currentStep === 'timebound') {
      await generateSmartGoalDraft(updatedAnswers);
    } else if (currentStep === 'emotional-check') {
      const hasNervousAndExcited = currentAnswer.toLowerCase().includes('nervous') &&
                                   (currentAnswer.toLowerCase().includes('excited') || currentAnswer.toLowerCase().includes('exciting'));

      if (!hasNervousAndExcited) {
        setShowEmotionalWarning(true);
      } else {
        await generateFinalResult(updatedAnswers, smartGoalDraft);
      }
    } else {
      const nextStep = getNextStep(currentStep);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }

    setCurrentAnswer('');
  };

  const generateSmartGoalDraft = async (answersData: Answers) => {
    setIsGenerating(true);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-goal-draft`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dream: answersData.dream,
          specific: answersData.specific,
          measurable: answersData.measurable,
          achievable: answersData.achievable,
          relevant: answersData.relevant,
          timebound: answersData.timebound,
          refinement: ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate SMART goal draft');
      }

      const result = await response.json();
      setSmartGoalDraft(result.smartGoal);
      setCurrentStep('smart-goal-draft');
    } catch (err: any) {
      setError(err.message || 'Failed to generate goal draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineGoal = async () => {
    if (!refinementRequest.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-goal-draft`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dream: answers.dream,
          specific: answers.specific,
          measurable: answers.measurable,
          achievable: answers.achievable,
          relevant: answers.relevant,
          timebound: answers.timebound,
          refinement: refinementRequest,
          currentGoal: smartGoalDraft
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refine goal');
      }

      const result = await response.json();
      setSmartGoalDraft(result.smartGoal);
      setRefinementRequest('');
    } catch (err: any) {
      setError(err.message || 'Failed to refine goal');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLockGoal = () => {
    setCurrentStep('emotional-check');
  };

  const handleAdjustGoal = () => {
    setShowEmotionalWarning(false);
    setCurrentStep('smart-goal-draft');
    setRefinementRequest('');
  };

  const handleProceedWithGoal = async () => {
    setShowEmotionalWarning(false);
    await generateFinalResult(answers, smartGoalDraft);
  };

  const generateFinalResult = async (answersData: Answers, goal: string) => {
    setIsGenerating(true);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-goal-plan`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dream: answersData.dream,
          specific: answersData.specific,
          measurable: answersData.measurable,
          achievable: answersData.achievable,
          relevant: answersData.relevant,
          timebound: answersData.timebound,
          smartGoal: goal,
          emotionalCheck: answersData.emotionalCheck
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate goal plan');
      }

      const result = await response.json();
      setFinalResult(result.content);
      setCurrentStep('final-result');
    } catch (err: any) {
      setError(err.message || 'Failed to generate final plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('dream');
    setCompletedSteps([]);
    setCurrentAnswer('');
    setAnswers({
      dream: '',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timebound: '',
      emotionalCheck: ''
    });
    setSmartGoalDraft('');
    setRefinementRequest('');
    setFinalResult('');
    setShowEmotionalWarning(false);
    setError('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: finalResult,
          title: 'My SMART Goal Plan'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'goal-plan.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  if (currentStep === 'final-result' && finalResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Target className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold">Your SMART Goal Plan</h1>
              </div>
              <p className="text-emerald-100 text-lg">
                Your personalized goal with actionable steps
              </p>
            </div>

            <div className="p-8">
              <div className="flex gap-3 justify-end mb-6">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New
                </button>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-emerald-50 border border-gray-200 rounded-xl p-8">
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {finalResult}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Goal Creator</h1>
            </div>
            <p className="text-emerald-100 text-lg">
              Step-by-step guided process to create your SMART goal
            </p>
          </div>

          <div className="p-8 space-y-8">
            {completedSteps.map((stepData, index) => (
              <div key={index} className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-emerald-100 px-6 py-3 border-b-2 border-emerald-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-bold text-emerald-900 text-lg">
                      {stepData.step === 'dream' && 'Step 1: Your Dream'}
                      {stepData.step === 'specific' && 'Step 2: Specific Goal'}
                      {stepData.step === 'measurable' && 'Step 3: Measurable'}
                      {stepData.step === 'achievable' && 'Step 4: Achievable'}
                      {stepData.step === 'relevant' && 'Step 5: Relevant'}
                      {stepData.step === 'timebound' && 'Step 6: Time-bound'}
                      {stepData.step === 'emotional-check' && 'Step 7: Emotional Check'}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Question:</p>
                    <p className="text-base text-gray-900 font-medium">{stepData.question}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-emerald-200">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Your Answer:</p>
                    <p className="text-base text-gray-900 leading-relaxed">{stepData.answer}</p>
                  </div>
                  {stepData.step === 'dream' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Got it — here's your dream:
                      </p>
                      <p className="text-white text-base mt-1 font-medium">{stepData.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-12 shadow-inner">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 w-16 h-16 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <Loader className="relative w-16 h-16 text-emerald-600 animate-spin" strokeWidth={2.5} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    Building your SMART goal...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'smart-goal-draft' && smartGoalDraft && !isGenerating && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-teal-600" />
                    Your SMART Goal Draft
                  </h3>
                  <div className="bg-white rounded-lg p-6 border-2 border-teal-200">
                    <p className="text-lg text-gray-800 leading-relaxed font-medium">
                      {smartGoalDraft}
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Want to refine this goal?
                      </label>
                      <textarea
                        value={refinementRequest}
                        onChange={(e) => setRefinementRequest(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        placeholder="e.g., Make it more specific about the revenue target, adjust the timeline, focus more on the learning aspect..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleRefineGoal}
                        disabled={!refinementRequest.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Refine Goal
                      </button>
                      <button
                        onClick={handleLockGoal}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
                      >
                        <Lock className="w-5 h-5" />
                        Lock Goal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'emotional-check' && showEmotionalWarning && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      A powerful goal should feel a little nervous and a little excited
                    </h3>
                    <p className="text-gray-700">
                      This combination means you're stretching yourself in a meaningful way. Do you want to adjust your goal?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAdjustGoal}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    Adjust Goal
                  </button>
                  <button
                    onClick={handleProceedWithGoal}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    Proceed Anyway
                  </button>
                </div>
              </div>
            )}

            {currentStep !== 'smart-goal-draft' && currentStep !== 'final-result' && !isGenerating && (
              <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                <div className="bg-blue-100 px-6 py-3 border-b-2 border-blue-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-bold text-blue-900 text-lg">
                      {currentStep === 'dream' && 'Step 1: Your Dream'}
                      {currentStep === 'specific' && 'Step 2: Specific Goal'}
                      {currentStep === 'measurable' && 'Step 3: Measurable'}
                      {currentStep === 'achievable' && 'Step 4: Achievable'}
                      {currentStep === 'relevant' && 'Step 5: Relevant'}
                      {currentStep === 'timebound' && 'Step 6: Time-bound'}
                      {currentStep === 'emotional-check' && 'Step 7: Emotional Check'}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <label className="block text-lg font-bold text-gray-900 mb-5">
                    {getStepQuestion(currentStep)}
                  </label>

                  {currentStep === 'timebound' ? (
                    <input
                      type="date"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg transition-all"
                    />
                  ) : (
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-lg transition-all"
                      placeholder="Type your answer here..."
                      rows={5}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSubmitAnswer();
                        }
                      }}
                    />
                  )}

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim()}
                    className="mt-5 w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
