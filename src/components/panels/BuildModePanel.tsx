import React, { useState } from 'react';
import { SubCircuitConfig } from '../../experiments/types';

interface BuildModePanelProps {
  config: SubCircuitConfig;
  userPlacedWireIds: string[];
  pendingWireStart: { row: number; col: string } | null;
  onClearWires: () => void;
  onCancelPendingWire: () => void;
  onAutoSolve: () => void;
  onPlaceWire?: (wireId: string) => void;
  selectedTargetWireId?: string | null;
  onSelectTargetWireId?: (wireId: string) => void;
}

export const BuildModePanel: React.FC<BuildModePanelProps> = ({
  config,
  userPlacedWireIds,
  pendingWireStart,
  onClearWires,
  onCancelPendingWire,
  onAutoSolve,
  onPlaceWire,
  selectedTargetWireId = null,
  onSelectTargetWireId,
}) => {
  const [showFullStepList, setShowFullStepList] = useState<boolean>(true);

  const totalRequiredWires = config.wires.length;
  const placedCount = userPlacedWireIds.length;
  const isComplete = placedCount === totalRequiredWires;

  // Unplaced wires
  const unplacedWires = config.wires.filter(w => !userPlacedWireIds.includes(w.id));
  const nextTargetWire = unplacedWires.find(w => w.id === selectedTargetWireId) || unplacedWires[0];

  // Helper to categorize wire into logical lab sequence
  const getWireCategory = (wire: any) => {
    const lbl = (wire.label ?? wire.id).toLowerCase();
    if (lbl.includes('vcc') || lbl.includes('gnd') || lbl.includes('power')) return '1. Power & Ground Rails';
    if (lbl.includes('led') || lbl.includes('output') || lbl.includes('diff') || lbl.includes('sum') || lbl.includes('borrow') || lbl.includes('carry')) return '4. Output LED Indicators';
    if (lbl.includes('tie') || lbl.includes('inter') || lbl.includes('cascade') || lbl.includes('gate 2') || lbl.includes('gate 3')) return '3. Inter-Gate Connections';
    return '2. Input Switch Lines';
  };

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl p-3 sm:p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-amber-300">Guided Breadboard Assembly Tutor</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Step-by-step physical breadboard connection trainer</p>
          </div>
        </div>

        {/* Progress badge */}
        <div className="text-right">
          <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
            isComplete ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {placedCount} / {totalRequiredWires} Wires
          </span>
        </div>
      </div>

      {/* Connection in Progress Banner */}
      {pendingWireStart && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-lg p-3 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2 text-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Anchor set at <strong className="font-mono text-amber-300">Row {pendingWireStart.row}, Col {pendingWireStart.col}</strong>. Now click the destination hole.</span>
          </div>
          <button
            onClick={onCancelPendingWire}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] ml-2 shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Completion Status */}
      {isComplete ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center space-y-2">
          <div className="text-emerald-400 font-bold text-base flex items-center justify-center gap-2">
            <span>🎉</span>
            <span>Circuit Fully Built & Verified!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All IC pins, power rails, switches, and LEDs are correctly routed. You can now toggle the switches on the left to verify the truth table and signal propagation live.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Current Step Recommendation Card */}
          {nextTargetWire && (
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  Current Target Wire
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {getWireCategory(nextTargetWire)}
                </span>
              </div>

              <div className="text-xs text-slate-200 font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>Wire:</span>
                  <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {nextTargetWire.label ?? nextTargetWire.id}
                  </span>
                </div>
                {onPlaceWire && (
                  <button
                    onClick={() => onPlaceWire(nextTargetWire.id)}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow transition-all hover:scale-105"
                  >
                    <span>⚡ 1-Click Connect</span>
                  </button>
                )}
              </div>

              {/* Exact Step Directions */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-slate-950/80 p-2 rounded border border-cyan-500/30">
                  <div className="text-cyan-400 text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> 1. START Hole
                  </div>
                  <div className="text-cyan-200 font-bold mt-1 text-xs">
                    Row {nextTargetWire.from.row}, Col {nextTargetWire.from.col}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/30">
                  <div className="text-emerald-400 text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 2. END Hole
                  </div>
                  <div className="text-emerald-200 font-bold mt-1 text-xs">
                    Row {nextTargetWire.to.row}, Col {nextTargetWire.to.col}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold">💡 How to wire:</span>
                <span>Click the pulsing <strong className="text-cyan-300">START hole</strong> on the breadboard, then click the <strong className="text-emerald-300">END hole</strong> (or click the yellow "1-Click Connect" button above).</span>
              </p>
            </div>
          )}

          {/* Sequential Wiring Checklist */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">
                Assembly Roadmap ({placedCount}/{totalRequiredWires})
              </span>
              <button
                onClick={() => setShowFullStepList(!showFullStepList)}
                className="text-[10px] text-sky-400 hover:text-sky-300"
              >
                {showFullStepList ? 'Collapse List' : 'Expand All'}
              </button>
            </div>

            {showFullStepList && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {config.wires.map((wire, idx) => {
                  const isPlaced = userPlacedWireIds.includes(wire.id);
                  const isCurrent = !isPlaced && nextTargetWire?.id === wire.id;
                  return (
                    <div
                      key={wire.id}
                      onClick={() => {
                        if (!isPlaced && onSelectTargetWireId) {
                          onSelectTargetWireId(wire.id);
                        }
                      }}
                      className={`text-[11px] p-2 rounded flex items-center justify-between border transition-all ${
                        isPlaced
                          ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300/80 cursor-default'
                          : isCurrent
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30 cursor-pointer'
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                          isPlaced
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-slate-950 animate-bounce'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isPlaced ? '✓' : idx + 1}
                        </span>
                        <span className="truncate">{wire.label ?? wire.id}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          {wire.from.col}{wire.from.row} → {wire.to.col}{wire.to.row}
                        </span>
                        {!isPlaced && onPlaceWire && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlaceWire(wire.id);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-semibold border border-slate-700 transition-colors"
                            title="Connect this wire directly"
                          >
                            + Wire
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build Mode Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <button
          onClick={onClearWires}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          Reset Connections
        </button>

        <button
          onClick={onAutoSolve}
          className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-md shadow-indigo-600/20"
        >
          Auto-Complete Wiring
        </button>
      </div>
    </div>
  );
};

