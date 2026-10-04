import React from 'react';
import { Circuit } from '../../simulator/engine/Circuit';
import { DigitalSignal } from '../../simulator/engine/types';

interface ComponentInspectorProps {
  selectedComponent: {
    type: string;
    id: string;
    label: string;
    details?: any;
  } | null;
  circuit: Circuit;
  onClose: () => void;
  onTraceSignal?: (pinId: string) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  selectedComponent,
  circuit,
  onClose,
  onTraceSignal,
}) => {
  if (!selectedComponent) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-center text-slate-500 text-xs">
        Click any IC chip, jumper wire, switch or LED on the breadboard to inspect live internal pin states.
      </div>
    );
  }

  const { type, id, label, details } = selectedComponent;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <h3 className="text-sm font-bold text-slate-100">{label}</h3>
          <span className="px-2 py-0.5 rounded bg-slate-700/80 text-[10px] font-mono text-cyan-300 uppercase">
            {type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[360px] overflow-y-auto text-xs">
        {/* IC Inspection Mode */}
        {type === 'IC' && details?.def && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Part Number</span>
                <span className="font-mono font-bold text-cyan-300">IC {details.def.partNumber}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Package</span>
                <span className="font-mono font-bold text-slate-200">{details.def.packageType} ({details.def.pinCount} Pins)</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              {details.def.description}
            </p>

            {/* Pin States Table */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Live Pin Voltages & Directions
              </h4>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {Array.from({ length: details.def.pinCount }, (_, i) => i + 1).map(pinNum => {
                  const pinId = `${id}_pin_${pinNum}`;
                  const pinObj = circuit.pins[pinId];
                  const signal = pinObj ? pinObj.signal : DigitalSignal.FLOATING;
                  const dir = details.def.pinDirections[pinNum];
                  const lbl = details.def.pinLabels[pinNum];

                  const isHigh = signal === DigitalSignal.HIGH;
                  const isLow = signal === DigitalSignal.LOW;

                  return (
                    <div
                      key={pinNum}
                      className={`flex items-center justify-between p-1.5 rounded border ${
                        isHigh
                          ? 'bg-red-500/10 border-red-500/30 text-red-200'
                          : isLow
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-slate-400 font-bold">P{pinNum}</span>
                        <span className="text-slate-300">({lbl})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">{dir}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-red-500 text-white'
                              : isLow
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {signal}
                        </span>
                        {dir === 'INPUT' && onTraceSignal && (
                          <button
                            onClick={() => onTraceSignal(pinId)}
                            title="Trace upstream logic"
                            className="text-[9px] px-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded"
                          >
                            Trace
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Wire Inspection Mode */}
        {type === 'Wire' && details?.wire && (
          <div className="space-y-3">
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Wire Identifier</span>
                <span className="font-mono text-cyan-300">{details.wire.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">From Hole</span>
                <span className="font-mono text-slate-200">Row {details.wire.from.row}, Col {details.wire.from.col}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">To Hole</span>
                <span className="font-mono text-slate-200">Row {details.wire.to.row}, Col {details.wire.to.col}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Carrying Signal</span>
                <span
                  className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    details.signal === DigitalSignal.HIGH
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {details.signal} ({details.signal === DigitalSignal.HIGH ? '5V HIGH' : '0V LOW'})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Switch Inspection Mode */}
        {type === 'Switch' && details?.input && (
          <div className="space-y-2">
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Input Switch</span>
                <span className="font-bold text-sky-400">{details.input.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Position</span>
                <span className={`font-mono font-bold ${details.state === 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {details.state === 1 ? 'Logic HIGH (1) [Closed to VCC]' : 'Logic LOW (0) [Closed to GND]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Breadboard Pin</span>
                <span className="font-mono text-slate-300">
                  Row {details.input.boardConnection.row}, Col {details.input.boardConnection.col}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LED Inspection Mode */}
        {type === 'LED' && details?.output && (
          <div className="space-y-2.5">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-medium">Output Indicator</span>
                <span className="font-bold text-emerald-400 text-sm">LED {details.output.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Illumination State</span>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${details.state === 1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {details.state === 1 ? 'ILLUMINATED (Logic 1)' : 'DARK (Logic 0)'}
                </span>
              </div>
              
              {/* Polarized Terminals Breakdown */}
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    <span>Anode (+) [Long Lead]</span>
                  </span>
                  <span className="font-mono text-slate-200">
                    Row {details.output.boardConnection.row}, Col {details.output.boardConnection.col} ({details.state === 1 ? '+5V HIGH' : '0V LOW'})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    <span>Cathode (-) [Flat Edge]</span>
                  </span>
                  <span className="font-mono text-blue-300">
                    Row {details.output.boardConnection.row}, Col R- (0V GND)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-0.5">
                <span className="text-slate-400">Diode Biasing</span>
                <span className={`font-mono font-semibold ${details.state === 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {details.state === 1 ? 'Forward Biased (+5V → GND)' : 'Zero Bias (0V → GND)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
