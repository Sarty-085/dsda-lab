import React, { useState } from 'react';
import { VivaQuestion } from '../../experiments/types';

interface VivaVoceProps {
  questions: VivaQuestion[];
}

export const VivaVoce: React.FC<VivaVoceProps> = ({ questions }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);

  const categories = ['All', 'Basic', 'Intermediate', 'Advanced'];

  const filtered = selectedCategory === 'All'
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  const toggleRevealAnswer = (id: string) => {
    setRevealedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleRevealHint = (id: string) => {
    setRevealedHints(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Oral Viva-Voce Practice System</h3>
            <p className="text-xs text-slate-400">Master oral examination questions by category</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filtered.map((q, idx) => {
          const isAnswerRevealed = revealedIds.includes(q.id);
          const isHintRevealed = revealedHints.includes(q.id);

          const badgeColor =
            q.category === 'Basic'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : q.category === 'Intermediate'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

          return (
            <div
              key={q.id}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-500 pt-0.5">
                    Q{idx + 1}.
                  </span>
                  <div className="text-xs font-semibold text-slate-200 leading-snug">
                    {q.question}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${badgeColor}`}>
                  {q.category}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {q.hint && (
                  <button
                    onClick={() => toggleRevealHint(q.id)}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {isHintRevealed ? 'Hide Hint' : '💡 Show Hint'}
                  </button>
                )}

                <button
                  onClick={() => toggleRevealAnswer(q.id)}
                  className={`text-[11px] px-3 py-1 rounded font-medium transition-colors ${
                    isAnswerRevealed
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isAnswerRevealed ? 'Hide Verified Answer' : '👁 Reveal Answer'}
                </button>
              </div>

              {/* Hint Box */}
              {isHintRevealed && q.hint && (
                <div className="bg-amber-500/10 border-l-2 border-amber-400 px-3 py-1.5 rounded-r text-[11px] text-amber-200">
                  <strong>Hint:</strong> {q.hint}
                </div>
              )}

              {/* Verified Answer Box */}
              {isAnswerRevealed && (
                <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-2.5 text-xs text-purple-200 leading-relaxed">
                  <strong className="text-purple-400 block mb-1">Standard Lab Answer:</strong>
                  {q.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
