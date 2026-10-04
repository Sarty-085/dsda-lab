import React from 'react';
import { TruthTableRow } from '../../experiments/types';
import { DigitalSignal } from '../../simulator/engine/types';

interface TruthTableProps {
  truthTable: TruthTableRow[];
  inputLabels: string[];
  outputLabels: string[];
  currentInputs: Record<string, DigitalSignal>;
  onSelectRowInputs: (inputs: Record<string, DigitalSignal>) => void;
}

export const TruthTable: React.FC<TruthTableProps> = ({
  truthTable,
  inputLabels,
  outputLabels,
  currentInputs,
  onSelectRowInputs,
}) => {
  // Determine if a row matches current simulator input states
  const isRowActive = (row: TruthTableRow) => {
    return Object.entries(row.inputs).every(([key, val]) => {
      // Find matching current input
      const currentVal = currentInputs[key];
      const targetVal = val === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW;
      return currentVal === targetVal;
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Truth Table (Bidirectional)
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-400">Click any row to test circuit with those inputs</p>
        </div>
        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
          {truthTable.length} States
        </span>
      </div>

      <div className="overflow-x-auto max-h-[280px] sm:max-h-[320px] overflow-y-auto">
        <table className="w-full text-[11px] sm:text-xs text-left border-collapse font-mono">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800">
            <tr>
              <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 font-semibold text-slate-400 border-r border-slate-800/80">#</th>
              {/* Inputs Columns */}
              {inputLabels.map(label => (
                <th key={label} className="py-2 sm:py-2.5 px-2.5 sm:px-3 font-bold text-sky-400 text-center">
                  {label}
                </th>
              ))}
              {/* Divider */}
              <th className="w-2 py-2 sm:py-2.5 px-1 border-r border-slate-800 text-slate-600 text-center">│</th>
              {/* Outputs Columns */}
              {outputLabels.map(label => (
                <th key={label} className="py-2 sm:py-2.5 px-2.5 sm:px-3 font-bold text-emerald-400 text-center">
                  {label}
                </th>
              ))}
              <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 font-semibold text-slate-400">Condition / Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {truthTable.map((row, index) => {
              const active = isRowActive(row);

              return (
                <tr
                  key={index}
                  onClick={() => {
                    const newInputs: Record<string, DigitalSignal> = {};
                    for (const [k, v] of Object.entries(row.inputs)) {
                      newInputs[k] = v === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW;
                    }
                    onSelectRowInputs(newInputs);
                  }}
                  className={`cursor-pointer transition-colors ${
                    active
                      ? 'bg-amber-500/20 hover:bg-amber-500/25 border-l-4 border-l-amber-400 font-semibold text-slate-100 shadow-inner'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-3 text-slate-500 border-r border-slate-800/80">
                    {active ? '▶ ' : ''}{index + 1}
                  </td>
                  {inputLabels.map(label => {
                    const val = row.inputs[label];
                    return (
                      <td key={label} className="py-2 px-3 text-center">
                        <span
                          className={`inline-block w-5 h-5 leading-5 rounded text-center font-bold ${
                            val === 1
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {val !== undefined ? val : '-'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2 px-1 border-r border-slate-800 text-slate-700 text-center">│</td>
                  {outputLabels.map(label => {
                    const val = row.outputs[label];
                    return (
                      <td key={label} className="py-2 px-3 text-center">
                        <span
                          className={`inline-block w-5 h-5 leading-5 rounded text-center font-bold ${
                            val === 1
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {val !== undefined ? val : '-'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-slate-400 font-sans text-xs">
                    {row.label ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
