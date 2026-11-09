import { useState } from 'react';
import { winCards, type WinCard } from '../config/eventConfig';

interface RealWinsGridProps {
  limit?: number;
}

export default function RealWinsGrid({ limit }: RealWinsGridProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...winCards]
    .map((card, index) => ({ card, index }))
    .sort((a, b) => b.card.sortAmount - a.card.sortAmount || a.index - b.index)
    .map(({ card }) => card);

  const showAll = limit === undefined;
  const visibleCards: WinCard[] = showAll
    ? sorted
    : expanded
      ? sorted
      : sorted.slice(0, limit!);

  const hasMore = !showAll && sorted.length > limit!;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto items-start">
        {visibleCards.map((card) => (
          <div
            key={card.image}
            className="rounded-xl overflow-hidden shadow-sm border border-slate-200"
          >
            <img src={card.image} alt={card.alt} className="w-full h-auto block" />
            {card.caption && (
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                  {card.highlight ? (
                    <>
                      Charging <span className="text-[#9C6B12]">{card.highlight}</span> / client
                    </>
                  ) : (
                    card.caption
                  )}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-block px-8 py-3 rounded-full border border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/10 transition-colors"
          >
            {expanded ? 'Show less' : 'See more wins'}
          </button>
        </div>
      )}
    </>
  );
}
