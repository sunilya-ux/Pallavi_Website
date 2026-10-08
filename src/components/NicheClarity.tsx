import { useState } from 'react';
import { ArrowLeft, Star, Check } from 'lucide-react';
import type { CareerOption } from './BybPassionAnalysis';

interface NicheClarityProps {
  careerOptions: CareerOption[];
  recommendedName: string;
  onBack: () => void;
}

export default function NicheClarity({ careerOptions, recommendedName, onBack }: NicheClarityProps) {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [customNiche, setCustomNiche] = useState('');

  const sortedOptions = [...careerOptions].sort((a, b) => {
    const aNum = parseInt(a.rating) || 0;
    const bNum = parseInt(b.rating) || 0;
    return bNum - aNum;
  });

  const recommendedMatch = (name: string) =>
    recommendedName.trim().length > 0 &&
    name.trim().toLowerCase() === recommendedName.trim().toLowerCase();

  const handleSelectCard = (name: string) => {
    setSelectedNiche(name);
    setCustomNiche('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomNiche(e.target.value);
    setSelectedNiche(null);
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
              const isSelected = selectedNiche === option.name;
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
            value={customNiche}
            onChange={handleCustomChange}
            placeholder="e.g. Confidence coach for working mothers"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
