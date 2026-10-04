import React from 'react';
import { Experiment } from '../../experiments/types';

interface TheoryPanelProps {
  experiment: Experiment;
}

export const TheoryPanel: React.FC<TheoryPanelProps> = ({ experiment }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5 space-y-5 text-slate-300">
      {/* Aim & Objective */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
          Experiment Aim
        </span>
        <h3 className="text-sm font-semibold text-slate-100">
          {experiment.aim}
        </h3>
      </div>

      {/* Summary Theory */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          Theory Overview
        </h4>
        <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          {experiment.theory.detailed || experiment.theory.summary}
        </p>
      </div>

      {/* Key Conceptual Points */}
      {experiment.theory.keyPoints && experiment.theory.keyPoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Key Examination & Learning Points
          </h4>
          <ul className="space-y-1.5">
            {experiment.theory.keyPoints.map((pt, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-800/30 p-2 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Apparatus & Components List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Required Laboratory Components (Apparatus)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {experiment.components.map((comp, i) => (
            <div key={i} className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200 block">{comp.name}</span>
                {comp.spec && <span className="text-[10px] text-slate-400">{comp.spec}</span>}
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-amber-300 shrink-0">
                Qty: {comp.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Procedure Steps */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Step-by-Step Laboratory Procedure
        </h4>
        <div className="space-y-2">
          {experiment.procedure.map(step => (
            <div key={step.stepNumber} className="flex items-start gap-3 bg-slate-950/40 border border-slate-800 p-2.5 rounded-lg text-xs">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono font-bold flex items-center justify-center shrink-0">
                {step.stepNumber}
              </span>
              <span className="text-slate-300 pt-0.5 leading-relaxed">{step.instruction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion */}
      {experiment.conclusion && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Official Conclusion
          </span>
          <p className="text-xs text-emerald-200 leading-relaxed">
            {experiment.conclusion}
          </p>
        </div>
      )}
    </div>
  );
};
