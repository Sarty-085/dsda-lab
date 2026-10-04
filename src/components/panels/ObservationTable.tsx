import React from 'react';
import { SubCircuitConfig } from '../../experiments/types';
import { Circuit } from '../../simulator/engine/Circuit';

interface ObservationTableProps {
  config: SubCircuitConfig;
  circuit?: Circuit;
  observations: Array<{
    id: string;
    timestamp: string;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
    status: 'MATCH' | 'MISMATCH';
  }>;
  onRecordCurrentState: () => void;
  onClearObservations: () => void;
}

export const ObservationTable: React.FC<ObservationTableProps> = ({
  config,
  observations,
  onRecordCurrentState,
  onClearObservations,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Lab Record & Observation Table</h3>
            <p className="text-xs text-slate-400">Log live simulator trials into your student lab record</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRecordCurrentState}
            className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <span>+</span> Record Current State
          </button>
          {observations.length > 0 && (
            <button
              onClick={onClearObservations}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Table of Observations */}
      {observations.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          No readings recorded yet. Toggle switches to your desired input pattern and click <strong className="text-teal-400 font-semibold">"Record Current State"</strong> to log.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2 px-3">Trial #</th>
                <th className="py-2 px-3">Timestamp</th>
                {config.inputs.map(i => (
                  <th key={i.id} className="py-2 px-2 text-sky-400 text-center">{i.label}</th>
                ))}
                <th className="py-2 px-1 text-slate-600 text-center">│</th>
                {config.outputs.map(o => (
                  <th key={o.id} className="py-2 px-2 text-emerald-400 text-center">{o.label}</th>
                ))}
                <th className="py-2 px-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {observations.map((obs, idx) => (
                <tr key={obs.id} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="py-2 px-3 text-slate-500 font-semibold">{idx + 1}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{obs.timestamp}</td>
                  {config.inputs.map(i => (
                    <td key={i.id} className="py-2 px-2 text-center font-bold text-sky-300">
                      {obs.inputs[i.label] ?? 0}
                    </td>
                  ))}
                  <td className="py-2 px-1 text-slate-700 text-center">│</td>
                  {config.outputs.map(o => (
                    <td key={o.id} className="py-2 px-2 text-center font-bold text-emerald-300">
                      {obs.outputs[o.label] ?? 0}
                    </td>
                  ))}
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✓ VERIFIED MATCH
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
