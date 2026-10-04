import React, { useState } from 'react';
import { QuizQuestion } from '../../experiments/types';

interface PracticeQuizProps {
  questions: QuizQuestion[];
}

export const PracticeQuiz: React.FC<PracticeQuizProps> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    for (const q of questions) {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    }
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Lab Exam & Self-Evaluation Quiz</h3>
            <p className="text-xs text-slate-400">Test your theoretical and practical comprehension</p>
          </div>
        </div>

        {isSubmitted && (
          <div className="text-right">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Score: {calculateScore()} / {questions.length} ({Math.round((calculateScore() / questions.length) * 100)}%)
            </span>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {questions.map((q, qIndex) => {
          const userChoice = selectedAnswers[q.id];
          const isCorrect = userChoice === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isSubmitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="text-xs font-semibold text-slate-200 mb-3 flex items-start gap-2">
                <span className="font-mono text-slate-500">Q{qIndex + 1}.</span>
                <span>{q.question}</span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, optIndex) => {
                  const isOptionSelected = userChoice === optIndex;
                  const isThisCorrect = q.correctIndex === optIndex;

                  let optClass = 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800';

                  if (isOptionSelected) {
                    optClass = 'bg-sky-600/30 border-sky-400 text-sky-200 font-semibold';
                  }

                  if (isSubmitted) {
                    if (isThisCorrect) {
                      optClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                    } else if (isOptionSelected && !isThisCorrect) {
                      optClass = 'bg-rose-500/30 border-rose-400 text-rose-200';
                    } else {
                      optClass = 'bg-slate-800/30 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={optIndex}
                      disabled={isSubmitted}
                      onClick={() => handleSelect(q.id, optIndex)}
                      className={`text-left p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-colors ${optClass}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center font-mono text-[10px] shrink-0">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submit */}
              {isSubmitted && q.explanation && (
                <div className="mt-3 p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-sky-400 block mb-0.5">Explanation:</strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <span className="text-slate-400">
          {Object.keys(selectedAnswers).length} of {questions.length} answered
        </span>

        <div className="flex items-center gap-2">
          {isSubmitted ? (
            <button
              onClick={handleReset}
              className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              Retake Quiz
            </button>
          ) : (
            <button
              disabled={Object.keys(selectedAnswers).length === 0}
              onClick={() => setIsSubmitted(true)}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Submit & Check Answers
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
