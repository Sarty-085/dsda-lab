import React, { useState, useEffect } from 'react';
import { ExplanationStep } from '../../experiments/types';

interface CircuitExplainerProps {
  steps: ExplanationStep[];
  primaryFormula?: string;
  intermediateFormulas?: string[];
  activeStepIndex: number;
  onStepChange: (index: number) => void;
}

export const CircuitExplainer: React.FC<CircuitExplainerProps> = ({
  steps,
  primaryFormula,
  intermediateFormulas,
  activeStepIndex,
  onStepChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2000); // 2 seconds per step

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        onStepChange((activeStepIndex + 1) % steps.length);
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeStepIndex, steps.length, playbackSpeed, onStepChange]);

  const currentStep = steps[activeStepIndex] || steps[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-4 flex flex-col gap-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-slate-100">Step-by-Step Circuit Walkthrough</h3>
        </div>

        {/* Playback & Step Controls */}
        <div className="flex items-center gap-2">
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 outline-none"
          >
            <option value={3000}>0.5x Speed (3s)</option>
            <option value={2000}>1.0x Speed (2s)</option>
            <option value={1000}>2.0x Speed (1s)</option>
          </select>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {isPlaying ? (
              <>
                <span className="w-2 h-2 bg-slate-950 rounded-sm"></span> Pause
              </>
            ) : (
              <>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Auto-Play
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {steps.map((step, idx) => (
          <button
            key={step.step}
            onClick={() => {
              setIsPlaying(false);
              onStepChange(idx);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              idx === activeStepIndex
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                idx === activeStepIndex ? 'bg-sky-400 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {idx + 1}
            </span>
            <span>{step.title}</span>
          </button>
        ))}
      </div>

      {/* Active Step Content */}
      {currentStep && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-sky-300 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400 font-mono">
                Step {currentStep.step} of {steps.length}
              </span>
              {currentStep.title}
            </h4>
            {currentStep.formulaSnippet && (
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-amber-300">
                {currentStep.formulaSnippet}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>
      )}

      {/* Boolean Equation Card */}
      {primaryFormula && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Boolean Derivation / Logic Expressions
          </div>
          <div className="font-mono text-xs text-emerald-300 bg-slate-950/80 px-3 py-2 rounded border border-slate-800 overflow-x-auto">
            {primaryFormula}
          </div>
          {intermediateFormulas && intermediateFormulas.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-2">
              {intermediateFormulas.map((f, i) => (
                <div key={i} className="text-[11px] font-mono text-slate-300 bg-slate-800/90 px-2 py-1 rounded border border-slate-700">
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prev / Next manual stepper */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-xs">
        <button
          disabled={activeStepIndex === 0}
          onClick={() => {
            setIsPlaying(false);
            onStepChange(Math.max(0, activeStepIndex - 1));
          }}
          className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          ← Previous Stage
        </button>
        <span className="text-slate-500 font-mono text-xs">
          Component Highlight: {currentStep?.highlightComponentId ?? 'Full Circuit'}
        </span>
        <button
          disabled={activeStepIndex === steps.length - 1}
          onClick={() => {
            setIsPlaying(false);
            onStepChange(Math.min(steps.length - 1, activeStepIndex + 1));
          }}
          className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next Stage →
        </button>
      </div>
    </div>
  );
};
