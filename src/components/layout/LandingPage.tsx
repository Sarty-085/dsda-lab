import React, { useState } from 'react';
import { EXPERIMENTS } from '../../experiments/registry';

interface LandingPageProps {
  onOpenExperiment: (expId?: string) => void;
  onOpenWorkbench: (practiceExpId?: string, practiceSubId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenExperiment,
  onOpenWorkbench,
}) => {
  const [quickPracticeExpId, setQuickPracticeExpId] = useState<string>('exp1');

  const selectedPracticeExp = EXPERIMENTS.find(e => e.id === quickPracticeExpId) || EXPERIMENTS[0];

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
      {/* Minimal Academic Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] font-mono font-bold">
          <span>CMP 203</span>
          <span>•</span>
          <span>Digital System Design &amp; Analysis Lab</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Digital Electronics Interactive Laboratory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Choose your workspace below: explore pre-built interactive circuit guides &amp; theory for Experiments 1–10, or wire and test your own circuits from scratch on the custom breadboard workbench.
        </p>
      </section>

      {/* Two Main Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* SECTION 1: EXPERIMENT GUIDES & SIMULATOR */}
        <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-5 sm:p-7 flex flex-col justify-between gap-6 shadow-2xl transition-all">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                10 Lab Experiments
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                1. Experiment Guides &amp; Simulator
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Study pre-wired circuits directly matching your lab manual. Toggle inputs to trace signals, verify truth tables, record observations, and prepare for Viva-Voce exams.
              </p>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {['Interactive Simulator', 'Theory & Pinouts', 'Bidirectional Truth Tables', 'Observation Logs', 'Viva-Voce & Quiz'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  {tag}
                </span>
              ))}
            </div>

            {/* Quick Jump Grid of All 10 Experiments */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Quick Jump to Experiment
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {EXPERIMENTS.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => onOpenExperiment(exp.id)}
                    className="text-left px-2.5 py-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/70 transition-colors flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono font-bold text-sky-400 shrink-0">
                      #{exp.experimentNumber}
                    </span>
                    <span className="text-slate-300 truncate">{exp.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenExperiment('exp1')}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Experiment Guides</span>
            <span>→</span>
          </button>
        </div>

        {/* SECTION 2: CUSTOM BREADBOARD WORKBENCH */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 sm:p-7 flex flex-col justify-between gap-6 shadow-2xl transition-all">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Hands-On Builder
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                2. Custom Breadboard Workbench
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Build circuits yourself from scratch! Drag &amp; drop TTL ICs, LEDs, and 330Ω resistors onto a realistic breadboard, wire power rails, trigger clock pulses, and debug with a live logic analyser.
              </p>
            </div>

            {/* Capabilities Pills */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                'All 11 Lab ICs (7400–7495)',
                'Placeable LEDs & 330Ω Resistors',
                'Top & Bottom Power Rails',
                'Pulse & Clock Generator',
                'Live Logic Analyser & Truth Log',
              ].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  {tag}
                </span>
              ))}
            </div>

            {/* Direct Practice Launcher inside Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Practice an Experiment Step-by-Step
              </div>
              <p className="text-[11px] text-slate-400">
                Pick any experiment to get non-spoiling milestone checks and optional pin hints while you wire the breadboard yourself:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={quickPracticeExpId}
                  onChange={e => setQuickPracticeExpId(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 outline-none"
                >
                  {EXPERIMENTS.map(exp => (
                    <option key={exp.id} value={exp.id}>
                      Exp {exp.experimentNumber}: {exp.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    onOpenWorkbench(selectedPracticeExp.id, selectedPracticeExp.subCircuits[0].id)
                  }
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-xs border border-amber-500/30 transition-colors shrink-0"
                >
                  Practice Exp {selectedPracticeExp.experimentNumber}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenWorkbench()}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Launch Free-Build Workbench</span>
            <span>→</span>
          </button>
        </div>
      </section>
    </div>
  );
};
