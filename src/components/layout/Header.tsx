import React, { useState } from 'react';
import { EXPERIMENTS } from '../../experiments/registry';
import { Experiment, SubCircuitConfig } from '../../experiments/types';

interface HeaderProps {
  selectedExp: Experiment;
  selectedSub: SubCircuitConfig;
  onSelectExp: (expId: string) => void;
  onSelectSub: (subId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedExp,
  selectedSub,
  onSelectExp,
  onSelectSub,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search filter across experiments and subcircuits
  const searchResults = searchQuery.trim()
    ? EXPERIMENTS.flatMap(exp => [
        {
          expId: exp.id,
          subId: exp.subCircuits[0].id,
          title: `Exp ${exp.experimentNumber}: ${exp.title}`,
          type: 'Experiment',
        },
        ...exp.subCircuits.map(sub => ({
          expId: exp.id,
          subId: sub.id,
          title: `Exp ${exp.experimentNumber} › ${sub.name}`,
          type: 'Subcircuit / Variant',
        })),
      ]).filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Logo and Titles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Digital Electronics Lab
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  CMP 203
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                Interactive Digital System Design & Analysis Laboratory • PCCE
              </p>
            </div>
          </div>
        </div>

        {/* Experiment Selector & Search */}
        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full md:w-auto">
          {/* Quick Search */}
          <div className="relative w-full sm:w-auto">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs w-full">
              <svg className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search experiments, gates..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-xs w-full sm:w-44"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-slate-300 text-xs shrink-0 pl-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown search results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div
                className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-full sm:w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto"
                onMouseLeave={() => setIsSearchOpen(false)}
              >
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectExp(res.expId);
                      onSelectSub(res.subId);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-sky-400">{res.title}</span>
                    <span className="text-[10px] text-slate-500">{res.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selectors Group (Experiment & Subcircuit) */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {/* Experiment Select dropdown */}
            <select
              value={selectedExp.id}
              onChange={(e) => onSelectExp(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none hover:border-slate-700 cursor-pointer shadow-sm flex-1 sm:flex-none sm:max-w-xs truncate"
            >
              {EXPERIMENTS.map(exp => (
                <option key={exp.id} value={exp.id}>
                  Exp {exp.experimentNumber}: {exp.title}
                </option>
              ))}
            </select>

            {/* Subcircuit Variant Select */}
            {selectedExp.subCircuits.length > 1 && (
              <select
                value={selectedSub.id}
                onChange={(e) => onSelectSub(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-sky-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none hover:border-slate-600 cursor-pointer flex-1 sm:flex-none sm:max-w-xs truncate"
              >
                {selectedExp.subCircuits.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
