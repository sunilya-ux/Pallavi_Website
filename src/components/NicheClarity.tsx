import { useState } from 'react';
import { ArrowLeft, Star, Check } from 'lucide-react';
import type { CareerOption } from './BybPassionAnalysis';

interface NicheClarityProps {
  careerOptions: CareerOption[];
  recommendedName: string;
  onBack: () => void;
}

interface CheckboxQuestion {
  options: string[];
  selected: string[];
  otherText: string;
}

interface Answers {
  selectedNiche: string | null;
  customNiche: string;
  transformationStory: string;
  benefitGroup: CheckboxQuestion;
  lifeStage: CheckboxQuestion;
  naturalHelpSeekers: CheckboxQuestion;
  lifeStageDetail: string;
  naturalHelpDetail: string;
  patternAudience: string;
  patternProblem: string;
  patternTransformation: string;
  patternExpertise: string;
  nicheAudience: string;
  nicheProblem: string;
  nicheAchievement: string;
}

const MAX_CHECKBOX = 3;

const SECTION_3_OPTIONS = [
  'Women', 'Men', 'Working Women', 'Working Mothers', 'Homemakers', 'Single Mothers',
  'Women 40+', 'Students & Young Adults', 'Corporate Professionals', 'Managers & Leaders',
  'Career Changers', 'Professionals Returning to Work', 'Entrepreneurs & Freelancers',
  'Women Entrepreneurs', 'Coaches / Consultants / Trainers', 'Parents', 'Couples',
  'People Starting Over', 'Other',
];

const SECTION_4_OPTIONS = [
  'Career confusion or change', 'Career growth & leadership', 'Returning to work',
  'Starting a business or side hustle', 'Growing a business', 'Financial independence',
  'Relationships & marriage', 'Parenting', 'Work-life balance', 'Burnout & overwhelm',
  'Confidence & self-worth', 'Finding purpose', 'Major life transition / starting over',
  'Health & lifestyle change', 'Other',
];

const SECTION_5_OPTIONS = [
  'Women', 'Men', 'Working Women & Mothers', 'Homemakers', 'Students & Young Adults',
  'Corporate Professionals & Managers', 'Entrepreneurs & Business Owners',
  'Coaches / Consultants', 'Parents', 'Couples', 'People facing a career change',
  'People with relationship challenges', 'People struggling with confidence',
  'People seeking purpose', 'People wanting to start something new', 'Other',
];

export default function NicheClarity({ careerOptions, recommendedName, onBack }: NicheClarityProps) {
  const [answers, setAnswers] = useState<Answers>({
    selectedNiche: null,
    customNiche: '',
    transformationStory: '',
    benefitGroup: { options: SECTION_3_OPTIONS, selected: [], otherText: '' },
    lifeStage: { options: SECTION_4_OPTIONS, selected: [], otherText: '' },
    naturalHelpSeekers: { options: SECTION_5_OPTIONS, selected: [], otherText: '' },
    lifeStageDetail: '',
    naturalHelpDetail: '',
    patternAudience: '',
    patternProblem: '',
    patternTransformation: '',
    patternExpertise: '',
    nicheAudience: '',
    nicheProblem: '',
    nicheAchievement: '',
  });

  const sortedOptions = [...careerOptions].sort((a, b) => {
    const aNum = parseInt(a.rating) || 0;
    const bNum = parseInt(b.rating) || 0;
    return bNum - aNum;
  });

  const recommendedMatch = (name: string) =>
    recommendedName.trim().length > 0 &&
    name.trim().toLowerCase() === recommendedName.trim().toLowerCase();

  const handleSelectCard = (name: string) => {
    setAnswers((prev) => ({ ...prev, selectedNiche: name, customNiche: '' }));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers((prev) => ({ ...prev, customNiche: e.target.value, selectedNiche: null }));
  };

  const toggleCheckbox = (key: 'benefitGroup' | 'lifeStage' | 'naturalHelpSeekers', option: string) => {
    setAnswers((prev) => {
      const q = prev[key];
      const isSelected = q.selected.includes(option);

      if (isSelected) {
        const newSelected = q.selected.filter((s) => s !== option);
        const newOtherText = option === 'Other' ? '' : q.otherText;
        return { ...prev, [key]: { ...q, selected: newSelected, otherText: newOtherText } };
      }

      if (q.selected.length >= MAX_CHECKBOX) return prev;

      const newSelected = [...q.selected, option];
      return { ...prev, [key]: { ...q, selected: newSelected } };
    });
  };

  const handleOtherTextChange = (key: 'benefitGroup' | 'lifeStage' | 'naturalHelpSeekers', text: string) => {
    setAnswers((prev) => ({ ...prev, [key]: { ...prev[key], otherText: text } }));
  };

  const renderCheckboxGrid = (
    key: 'benefitGroup' | 'lifeStage' | 'naturalHelpSeekers',
    options: string[]
  ) => {
    const q = answers[key];
    const atMax = q.selected.length >= MAX_CHECKBOX;

    return (
      <>
        {atMax && (
          <p className="text-xs text-amber-600 font-medium mb-3">You can choose up to 3.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option) => {
            const isSelected = q.selected.includes(option);
            const isDisabled = !isSelected && atMax;

            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleCheckbox(key, option)}
                disabled={isDisabled}
                className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 min-h-[56px] ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                    : isDisabled
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-teal-800' : 'text-slate-700'}`}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {q.selected.includes('Other') && (
          <input
            type="text"
            value={q.otherText}
            onChange={(e) => handleOtherTextChange(key, e.target.value)}
            placeholder="Please specify"
            className="mt-3 w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
        )}
      </>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to my report
      </button>

      {/* Header card */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold">Niche Clarity — Find Your People</h2>
        <p className="text-teal-100 mt-1.5">Choose the niche you want to build your business around.</p>
      </div>

      {/* Section 1: Choose your niche */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">1. Choose your niche</h3>

        {careerOptions.length === 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              We couldn't read the niche options from your report. Go back and click Regenerate, or type your own niche below.
            </p>
          </div>
        )}

        {/* Radio cards */}
        {sortedOptions.length > 0 && (
          <div className="space-y-3 mb-5">
            {sortedOptions.map((option, idx) => {
              const isSelected = answers.selectedNiche === option.name;
              const isRecommended = recommendedMatch(option.name);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCard(option.name)}
                  className={`w-full text-left rounded-xl border-2 p-4 sm:p-5 transition-all duration-200 ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                        {option.name}
                      </span>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Recommended
                        </span>
                      )}
                    </div>
                    {option.rating && (
                      <span className="text-sm font-bold text-teal-600 flex-shrink-0">{option.rating}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom niche input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Don't see your niche? Type your own:
          </label>
          <input
            type="text"
            value={answers.customNiche}
            onChange={handleCustomChange}
            placeholder="e.g. Confidence coach for working mothers"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Section 2: Your transformation story */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">2. Your transformation story</h3>
        <p className="text-sm text-slate-600 mb-2">
          What is your life's biggest transformation story in ONE line?
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Think about the biggest change you have personally experienced — something you struggled with, overcame, learned from, or transformed.
        </p>
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm italic text-slate-400">
            "I went from being an unconfident corporate professional to building the courage to start my own business."
          </p>
        </div>
        <textarea
          rows={2}
          value={answers.transformationStory}
          onChange={(e) => setAnswers((prev) => ({ ...prev, transformationStory: e.target.value }))}
          placeholder="My transformation..."
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
        />
      </div>

      {/* Section 3: Who would benefit most */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">3. Who would benefit most from your journey?</h3>
        <p className="text-sm text-slate-600 mb-2">
          If you had to share your own life lessons, which group would benefit MOST from your personal journey?
        </p>
        <p className="text-sm text-slate-500 mb-4">Choose up to 3</p>
        {renderCheckboxGrid('benefitGroup', SECTION_3_OPTIONS)}
      </div>

      {/* Section 4: A life stage you understand deeply */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">4. A life stage you understand deeply</h3>
        <p className="text-sm text-slate-600 mb-2">
          Which life stage or situation do you feel you understand DEEPLY?
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Think about the people whose world you genuinely understand because you've lived it yourself. Choose up to 3
        </p>
        {renderCheckboxGrid('lifeStage', SECTION_4_OPTIONS)}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            The situation I understand most deeply is:
          </label>
          <textarea
            rows={2}
            value={answers.lifeStageDetail}
            onChange={(e) => setAnswers((prev) => ({ ...prev, lifeStageDetail: e.target.value }))}
            placeholder="Describe the situation you understand most deeply..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>

      {/* Section 5: Who naturally comes to you for help */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">5. Who naturally comes to you for help?</h3>
        <p className="text-sm text-slate-600 mb-2">
          Did you notice a PATTERN in the kind of people who naturally approach you for help?
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Think about your real life, not who you think you should coach. Who comes to you repeatedly for advice, guidance, perspective or support? Choose up to 3
        </p>
        {renderCheckboxGrid('naturalHelpSeekers', SECTION_5_OPTIONS)}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What do they usually come to me for?
          </label>
          <textarea
            rows={2}
            value={answers.naturalHelpDetail}
            onChange={(e) => setAnswers((prev) => ({ ...prev, naturalHelpDetail: e.target.value }))}
            placeholder="Describe what people usually come to you for..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>

      {/* Section 6: The Pattern Finder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">6. ⭐ The Pattern Finder</h3>
        <p className="text-sm text-slate-600 mb-5">
          Now look at your answers to all the questions above. Ask yourself: who keeps appearing again and again?
        </p>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">My audience</label>
            <p className="text-xs text-slate-400 mb-2">Who keeps appearing again and again?</p>
            <textarea
              rows={2}
              value={answers.patternAudience}
              onChange={(e) => setAnswers((prev) => ({ ...prev, patternAudience: e.target.value }))}
              placeholder="Describe your audience..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Their problem</label>
            <p className="text-xs text-slate-400 mb-2">What problem or situation keeps appearing?</p>
            <textarea
              rows={2}
              value={answers.patternProblem}
              onChange={(e) => setAnswers((prev) => ({ ...prev, patternProblem: e.target.value }))}
              placeholder="Describe their problem..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">My transformation</label>
            <p className="text-xs text-slate-400 mb-2">What transformation have I personally experienced?</p>
            <textarea
              rows={2}
              value={answers.patternTransformation}
              onChange={(e) => setAnswers((prev) => ({ ...prev, patternTransformation: e.target.value }))}
              placeholder="Describe your transformation..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">My natural expertise</label>
            <p className="text-xs text-slate-400 mb-2">What do people already trust me to help them with?</p>
            <textarea
              rows={2}
              value={answers.patternExpertise}
              onChange={(e) => setAnswers((prev) => ({ ...prev, patternExpertise: e.target.value }))}
              placeholder="Describe your natural expertise..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Section 7: Your First Niche Draft */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">7. 🎯 Your First Niche Draft</h3>
        <p className="text-sm text-slate-600 mb-5">Now complete your niche statement:</p>

        <div className="flex flex-col gap-2 text-sm sm:text-base text-slate-700 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span>I want to help</span>
            <input
              type="text"
              value={answers.nicheAudience}
              onChange={(e) => setAnswers((prev) => ({ ...prev, nicheAudience: e.target.value }))}
              placeholder="e.g. ambitious working women"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span>who are struggling with</span>
            <input
              type="text"
              value={answers.nicheProblem}
              onChange={(e) => setAnswers((prev) => ({ ...prev, nicheProblem: e.target.value }))}
              placeholder="e.g. feeling stuck in their corporate careers"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span>achieve</span>
            <input
              type="text"
              value={answers.nicheAchievement}
              onChange={(e) => setAnswers((prev) => ({ ...prev, nicheAchievement: e.target.value }))}
              placeholder="e.g. a fulfilling second career"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
            I want to help{' '}
            <span className="font-semibold text-teal-700">
              {answers.nicheAudience.trim() || '____'}
            </span>{' '}
            who are struggling with{' '}
            <span className="font-semibold text-teal-700">
              {answers.nicheProblem.trim() || '____'}
            </span>{' '}
            achieve{' '}
            <span className="font-semibold text-teal-700">
              {answers.nicheAchievement.trim() || '____'}
            </span>.
          </p>
        </div>

        {/* Examples */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Examples:</p>
          <ul className="space-y-2">
            <li className="text-sm text-slate-600 leading-relaxed">
              "I want to help ambitious working women who feel stuck in their corporate careers transition into fulfilling second careers."
            </li>
            <li className="text-sm text-slate-600 leading-relaxed">
              "I want to help first-time women managers build confidence and become impactful leaders."
            </li>
            <li className="text-sm text-slate-600 leading-relaxed">
              "I want to help women entrepreneurs who are earning but struggling to scale build a profitable and visible business."
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
