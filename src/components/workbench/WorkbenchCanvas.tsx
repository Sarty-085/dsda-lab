import React, { useRef, useState } from 'react';
import { IC_CATALOG } from '../../simulator/ics/definitions';
import {
  ArmedTool,
  LEDColor,
  LogicLevel,
  PlacedIC,
  PlacedLED,
  PlacedResistor,
  PlacedWire,
  PracticeHint,
  SelectionTarget,
  SupportedICType,
  WorkbenchSimResult,
  WorkbenchState,
} from '../../workbench/workbenchTypes';
import {
  colX,
  getICPinHole,
  getNodeKey,
  getTerminalPos,
  RAIL_Y,
  ROW_Y,
  TOP_ROWS,
  BOT_ROWS,
  WB_COLS,
  WB_VIEWBOX_H,
  WB_VIEWBOX_W,
} from '../../workbench/workbenchGeometry';

interface WorkbenchCanvasProps {
  state: WorkbenchState;
  sim: WorkbenchSimResult;
  selection: SelectionTarget | null;
  armedTool: ArmedTool;
  pendingWireStart: string | null;
  dragPreview: {
    kind: 'new-ic' | 'move-ic' | 'new-resistor' | 'move-resistor' | 'new-led' | 'move-led';
    icType?: SupportedICType;
    ledColor?: LEDColor;
    id?: number;
  } | null;
  activeHint?: PracticeHint | null;
  onStartWire: (terminalId: string) => void;
  onCompleteWire: (fromId: string, toId: string) => void;
  onCancelPendingWire: () => void;
  onFlexWire: (wireId: number, curveOffset: { dx: number; dy: number }, commitUndo: boolean) => void;
  onProbe: (terminalId: string | null) => void;
  onSelect: (sel: SelectionTarget | null) => void;
  onTogglePSU: () => void;
  onPulserDown: (index: 0 | 1) => void;
  onPulserUp: (index: 0 | 1) => void;
  onStepClock: () => void;
  onDropOnBoard: (holeId: string | null, colGuess: number, svgX: number, svgY: number) => void;
  onBeginDragExisting: (
    item:
      | { kind: 'move-ic'; id: number; icType: SupportedICType }
      | { kind: 'move-resistor'; id: number }
      | { kind: 'move-led'; id: number; ledColor: LEDColor },
    clientX: number,
    clientY: number
  ) => void;
  onUpdateDragCursor: (clientX: number, clientY: number) => void;
  pulserLatchMode: boolean;
  boardDark: boolean;
  zoomWidth: number | null;
}

const LED_FILL_ON: Record<LEDColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  amber: '#f59e0b',
};

const LED_FILL_OFF: Record<LEDColor, string> = {
  red: '#7f1d1d',
  green: '#14532d',
  amber: '#78350f',
};

const LED_GLOW: Record<LEDColor, string> = {
  red: 'rgba(239, 68, 68, 0.55)',
  green: 'rgba(34, 197, 94, 0.55)',
  amber: 'rgba(245, 158, 11, 0.55)',
};

function getWireGeometry(w: PlacedWire) {
  const [ax, ay] = getTerminalPos(w.a);
  const [bx, by] = getTerminalPos(w.b);
  const dist = Math.hypot(ax - bx, ay - by);
  const stagger = ((w.id % 5) - 2) * 7;
  const mostlyVert = Math.abs(ax - bx) < 10;
  const baseCx = (ax + bx) / 2 + (mostlyVert ? stagger : 0);
  const baseCy = Math.min(ay, by) - 14 - dist * 0.06 + (mostlyVert ? 0 : stagger * 0.45);
  const cx = baseCx + (w.curveOffset?.dx ?? 0);
  const cy = baseCy + (w.curveOffset?.dy ?? 0);
  const apexX = 0.25 * ax + 0.5 * cx + 0.25 * bx;
  const apexY = 0.25 * ay + 0.5 * cy + 0.25 * by;
  return { ax, ay, bx, by, cx, cy, apexX, apexY };
}

export const WorkbenchCanvas: React.FC<WorkbenchCanvasProps> = ({
  state,
  sim,
  selection,
  armedTool,
  pendingWireStart,
  dragPreview,
  activeHint = null,
  onStartWire,
  onCompleteWire,
  onCancelPendingWire,
  onFlexWire,
  onProbe,
  onSelect,
  onTogglePSU,
  onPulserDown,
  onPulserUp,
  onStepClock,
  onDropOnBoard,
  onBeginDragExisting,
  onUpdateDragCursor,
  pulserLatchMode,
  boardDark,
  zoomWidth,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [mouseSvg, setMouseSvg] = useState<[number, number]>([0, 0]);
  const [isDraggingWire, setIsDraggingWire] = useState(false);
  const [hoveredTerminal, setHoveredTerminal] = useState<string | null>(null);

  const flexDragRef = useRef<{
    wireId: number;
    startSvgX: number;
    startSvgY: number;
    initDx: number;
    initDy: number;
    moved: boolean;
    undoCommitted: boolean;
    pointerId: number;
  } | null>(null);

  const clientToSvg = (clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return [0, 0];
    const res = pt.matrixTransform(ctm.inverse());
    return [res.x, res.y];
  };

  const getSignalColor = (val: LogicLevel, defaultColor: string): string => {
    if (!state.psu || sim.shortCircuit) return defaultColor;
    if (val === 1) return '#ef4444';
    if (val === 0) return '#3b82f6';
    return defaultColor;
  };

  const getPinRoleColor = (dir: string | undefined): string => {
    if (dir === 'POWER') return '#fca5a5';
    if (dir === 'GROUND') return '#93c5fd';
    if (dir === 'OUTPUT') return '#86efac';
    return '#7dd3fc';
  };

  const holeIds: string[] = [];
  for (const r of ['t+', 't-', 'b+', 'b-']) {
    for (let c = 0; c < WB_COLS; c++) holeIds.push(`R${r}:${c}`);
  }
  for (const rw of TOP_ROWS) {
    for (let c = 0; c < WB_COLS; c++) holeIds.push(`T${c}${rw}`);
  }
  for (const rw of BOT_ROWS) {
    for (let c = 0; c < WB_COLS; c++) holeIds.push(`B${c}${rw}`);
  }

  const panelTerminals = ['PSU+', 'PSUG', 'P1', 'P2', 'CLK'];

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const [sx, sy] = clientToSvg(e.clientX, e.clientY);
    setMouseSvg([sx, sy]);

    const target = e.target as HTMLElement | SVGElement;
    const dataset = target.dataset || {};

    // Dragging flex-handle on selected wire (works on both mouse and touch!)
    if (dataset.wireHandle) {
      e.stopPropagation();
      const wireId = Number(dataset.wireHandle);
      const wire = state.wires.find(w => w.id === wireId);
      if (wire) {
        flexDragRef.current = {
          wireId,
          startSvgX: sx,
          startSvgY: sy,
          initDx: wire.curveOffset?.dx ?? 0,
          initDy: wire.curveOffset?.dy ?? 0,
          moved: false,
          undoCommitted: false,
          pointerId: e.pointerId,
        };
        try {
          svgRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // ignore if unsupported in synthetic tests
        }
      }
      return;
    }

    // If an item is armed (click-to-place mobile/desktop flow)
    if (armedTool) {
      const colGuess = Math.round((sx - colX(0)) / 26);
      const holeId = dataset.t || null;
      onDropOnBoard(holeId, colGuess, sx, sy);
      return;
    }

    if (dataset.psu) {
      e.stopPropagation();
      onTogglePSU();
      return;
    }

    if (dataset.pulser !== undefined) {
      e.stopPropagation();
      const idx = Number(dataset.pulser) as 0 | 1;
      onPulserDown(idx);
      return;
    }

    if (dataset.clkstep) {
      e.stopPropagation();
      onStepClock();
      return;
    }

    if (dataset.t) {
      e.stopPropagation();
      const termId = dataset.t;
      onProbe(termId);
      setHoveredTerminal(termId);
      if (pendingWireStart && pendingWireStart !== termId) {
        onCompleteWire(pendingWireStart, termId);
      } else if (pendingWireStart === termId) {
        onCancelPendingWire();
      } else {
        onStartWire(termId);
        setIsDraggingWire(true);
      }
      return;
    }

    if (dataset.ic) {
      e.stopPropagation();
      const icId = Number(dataset.ic);
      const ic = state.ics.find(i => i.id === icId);
      onSelect({ kind: 'ic', id: icId });
      if (ic && e.pointerType === 'mouse') {
        onBeginDragExisting({ kind: 'move-ic', id: icId, icType: ic.type }, e.clientX, e.clientY);
      }
      return;
    }

    if (dataset.res) {
      e.stopPropagation();
      const resId = Number(dataset.res);
      onSelect({ kind: 'resistor', id: resId });
      if (e.pointerType === 'mouse') {
        onBeginDragExisting({ kind: 'move-resistor', id: resId }, e.clientX, e.clientY);
      }
      return;
    }

    if (dataset.led) {
      e.stopPropagation();
      const ledId = Number(dataset.led);
      const led = state.leds.find(l => l.id === ledId);
      onSelect({ kind: 'led', id: ledId });
      if (led && e.pointerType === 'mouse') {
        onBeginDragExisting({ kind: 'move-led', id: ledId, ledColor: led.color }, e.clientX, e.clientY);
      }
      return;
    }

    if (dataset.wire) {
      e.stopPropagation();
      const wireId = Number(dataset.wire);
      const wire = state.wires.find(w => w.id === wireId);
      onSelect({ kind: 'wire', id: wireId });
      if (wire && e.pointerType === 'mouse') {
        flexDragRef.current = {
          wireId,
          startSvgX: sx,
          startSvgY: sy,
          initDx: wire.curveOffset?.dx ?? 0,
          initDy: wire.curveOffset?.dy ?? 0,
          moved: false,
          undoCommitted: false,
          pointerId: e.pointerId,
        };
        try {
          svgRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      return;
    }

    onSelect(null);
    if (pendingWireStart) onCancelPendingWire();
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const [sx, sy] = clientToSvg(e.clientX, e.clientY);
    setMouseSvg([sx, sy]);

    if (flexDragRef.current) {
      const f = flexDragRef.current;
      const dxSvg = sx - f.startSvgX;
      const dySvg = sy - f.startSvgY;
      if (f.moved || Math.hypot(dxSvg, dySvg) > 3) {
        f.moved = true;
        const shouldCommit = !f.undoCommitted;
        f.undoCommitted = true;
        onFlexWire(
          f.wireId,
          {
            dx: Math.round(f.initDx + dxSvg * 2),
            dy: Math.round(f.initDy + dySvg * 2),
          },
          shouldCommit
        );
      }
      return;
    }

    if (dragPreview) {
      onUpdateDragCursor(e.clientX, e.clientY);
    }

    const target = e.target as HTMLElement | SVGElement;
    if (target.dataset?.t) {
      onProbe(target.dataset.t);
      setHoveredTerminal(target.dataset.t);
    } else if (hoveredTerminal !== null && !pendingWireStart) {
      setHoveredTerminal(null);
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (flexDragRef.current) {
      try {
        svgRef.current?.releasePointerCapture(flexDragRef.current.pointerId);
      } catch {
        // ignore
      }
      flexDragRef.current = null;
      return;
    }

    if (!pulserLatchMode && (state.p[0] === 1 || state.p[1] === 1)) {
      if (state.p[0] === 1) onPulserUp(0);
      if (state.p[1] === 1) onPulserUp(1);
    }

    if (isDraggingWire) {
      setIsDraggingWire(false);
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | SVGElement | null;
      const endId = el?.dataset?.t;
      if (endId && pendingWireStart && endId !== pendingWireStart) {
        onCompleteWire(pendingWireStart, endId);
      } else if (endId !== pendingWireStart && e.pointerType === 'mouse') {
        onCancelPendingWire();
      }
    }

    if (dragPreview) {
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const [sx, sy] = clientToSvg(e.clientX, e.clientY);
          const colGuess = Math.round((sx - colX(0)) / 26);
          const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | SVGElement | null;
          const holeId = el?.dataset?.t || null;
          onDropOnBoard(holeId, colGuess, sx, sy);
        }
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as HTMLElement | SVGElement;
    const wireIdStr = target.dataset?.wire || target.dataset?.wireHandle;
    if (wireIdStr) {
      onFlexWire(Number(wireIdStr), { dx: 0, dy: 0 }, true);
    }
  };

  const hoveredStripKey = hoveredTerminal ? getNodeKey(hoveredTerminal) : null;

  const bbFill = boardDark ? '#1e242d' : '#f4eee2';
  const bbStroke = boardDark ? '#334155' : '#cfc5b4';
  const gapFill = boardDark ? '#0f141b' : '#ddd4c4';
  const holeFill = boardDark ? '#070a0f' : '#2f3742';
  const labelText = boardDark ? '#94a3b8' : '#6b6356';
  const pinNumColor = boardDark ? '#e2e8f0' : '#334155';
  const dockFill = boardDark ? '#0f172a' : '#e2e8f0';
  const dockStroke = boardDark ? '#334155' : '#cbd5e1';
  const dockText = boardDark ? '#e2e8f0' : '#1e293b';

  return (
    <div
      className="w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-800 bg-slate-950 p-1.5 sm:p-2 select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WB_VIEWBOX_W} ${WB_VIEWBOX_H}`}
        className="h-auto block touch-pan-x touch-pan-y"
        style={{ width: zoomWidth ? `${zoomWidth}px` : '100%', minWidth: zoomWidth ? undefined : '100%' }}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          <linearGradient id="wb-ic-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#262b33" />
            <stop offset="50%" stopColor="#161a1f" />
            <stop offset="100%" stopColor="#0d1014" />
          </linearGradient>
          <filter id="wb-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.32" />
          </filter>
        </defs>

        {/* 1. LEFT TRAINER DOCK: Power Supply + Pulse Generator */}
        <rect x="12" y="20" width="134" height="220" rx="10" fill={dockFill} stroke={dockStroke} strokeWidth="1.5" />
        <text x="79" y="42" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="0.8" fill="#38bdf8">
          POWER SUPPLY
        </text>
        <line x1="24" y1="50" x2="134" y2="50" stroke={dockStroke} strokeWidth="1" />

        {/* Power Rocker Switch */}
        <g data-psu="1" style={{ cursor: 'pointer' }}>
          {activeHint?.kind === 'toggle-psu' && (
            <rect
              x="34"
              y="60"
              width="90"
              height="46"
              rx="8"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              className="explain-highlight"
            />
          )}
          <rect
            data-psu="1"
            x="40"
            y="66"
            width="78"
            height="34"
            rx="6"
            fill={boardDark ? '#1e293b' : '#cbd5e1'}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <rect
            data-psu="1"
            x={state.psu ? 81 : 43}
            y="69"
            width="34"
            height="28"
            rx="4"
            fill={state.psu ? '#16a34a' : '#64748b'}
          />
          <text data-psu="1" x="79" y="116" textAnchor="middle" fontSize="11" fontWeight="800" fill={state.psu ? '#22c55e' : labelText}>
            {state.psu ? 'POWER ON' : 'POWER OFF'}
          </text>
        </g>

        <circle
          cx="128"
          cy="83"
          r="5"
          fill={state.psu ? (sim.shortCircuit ? '#ef4444' : '#22c55e') : '#475569'}
        />
        <text x="79" y="133" textAnchor="middle" fontSize="9" fill={sim.shortCircuit ? '#ef4444' : labelText}>
          {sim.shortCircuit ? 'SHORT FAULT!' : state.psu ? '+5V DC Regulated' : 'Output Disabled'}
        </text>

        {/* PSU +5V and GND Terminals */}
        <text x="48" y="156" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ef4444">
          +5V
        </text>
        <circle cx="48" cy="174" r="9" fill="#991b1b" stroke="#ef4444" strokeWidth="2.5" />
        <circle cx="48" cy="174" r="3.5" fill="#0f172a" pointerEvents="none" />

        <text x="106" y="156" textAnchor="middle" fontSize="10" fontWeight="700" fill="#60a5fa">
          GND
        </text>
        <circle cx="106" cy="174" r="9" fill="#0f172a" stroke="#3b82f6" strokeWidth="2.5" />
        <circle cx="106" cy="174" r="3.5" fill="#020617" pointerEvents="none" />

        <text x="79" y="210" textAnchor="middle" fontSize="8.5" fill={labelText}>
          Wire +5V &amp; GND
        </text>
        <text x="79" y="222" textAnchor="middle" fontSize="8.5" fill={labelText}>
          to Top/Bottom Rails
        </text>

        {/* Pulse Generator Box */}
        <rect x="12" y="256" width="134" height="274" rx="10" fill={dockFill} stroke={dockStroke} strokeWidth="1.5" />
        <text x="79" y="278" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="0.8" fill="#a78bfa">
          PULSE GENERATOR
        </text>
        <line x1="24" y1="286" x2="134" y2="286" stroke={dockStroke} strokeWidth="1" />

        <text x="48" y="306" textAnchor="middle" fontSize="10" fontWeight="700" fill={dockText}>
          P1 ({state.p[0]})
        </text>
        <circle
          data-pulser="0"
          cx="48"
          cy="332"
          r="16"
          fill={state.p[0] ? '#2563eb' : '#475569'}
          stroke={state.p[0] ? '#93c5fd' : '#64748b'}
          strokeWidth="3"
          style={{ cursor: 'pointer' }}
        />
        <text data-pulser="0" x="48" y="336" textAnchor="middle" fontSize="9" fontWeight="800" fill="#ffffff" pointerEvents="none">
          {pulserLatchMode ? 'TGL' : 'PLS'}
        </text>

        <text x="106" y="306" textAnchor="middle" fontSize="10" fontWeight="700" fill={dockText}>
          P2 ({state.p[1]})
        </text>
        <circle
          data-pulser="1"
          cx="106"
          cy="332"
          r="16"
          fill={state.p[1] ? '#2563eb' : '#475569'}
          stroke={state.p[1] ? '#93c5fd' : '#64748b'}
          strokeWidth="3"
          style={{ cursor: 'pointer' }}
        />
        <text data-pulser="1" x="106" y="336" textAnchor="middle" fontSize="9" fontWeight="800" fill="#ffffff" pointerEvents="none">
          {pulserLatchMode ? 'TGL' : 'PLS'}
        </text>

        <text x="48" y="376" textAnchor="middle" fontSize="9" fontWeight="700" fill="#38bdf8">
          P1 OUT
        </text>
        <circle cx="48" cy="396" r="8" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="48" cy="396" r="3" fill="#0f172a" pointerEvents="none" />

        <text x="106" y="376" textAnchor="middle" fontSize="9" fontWeight="700" fill="#38bdf8">
          P2 OUT
        </text>
        <circle cx="106" cy="396" r="8" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="106" cy="396" r="3" fill="#0f172a" pointerEvents="none" />

        <line x1="24" y1="422" x2="134" y2="422" stroke={dockStroke} strokeWidth="1" />
        <text x="79" y="440" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#c084fc">
          CLOCK GEN (CLK)
        </text>
        <g data-clkstep="1" style={{ cursor: 'pointer' }}>
          <rect data-clkstep="1" x="34" y="448" width="90" height="24" rx="5" fill="#1e293b" stroke="#6366f1" strokeWidth="1.2" />
          <circle
            data-clkstep="1"
            cx="48"
            cy="460"
            r="4.5"
            fill={state.psu && state.clkLevel === 1 ? '#ef4444' : '#475569'}
          />
          <text data-clkstep="1" x="85" y="464" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e2e8f0">
            STEP ({state.clkLevel})
          </text>
        </g>
        <circle cx="77" cy="494" r="8.5" fill="#4c1d95" stroke="#a855f7" strokeWidth="2" />
        <circle cx="77" cy="494" r="3.5" fill="#0f172a" pointerEvents="none" />
        <text x="77" y="517" textAnchor="middle" fontSize="8.5" fill="#c084fc" fontWeight="700">
          CLK OUT ({state.clkActive ? 'AUTO' : 'MANUAL'})
        </text>

        {/* 2. MAIN HORIZONTAL BREADBOARD */}
        <rect x="158" y="20" width="948" height="510" rx="14" fill={bbFill} stroke={bbStroke} strokeWidth="2.5" filter="url(#wb-shadow)" />

        <text x="632" y="40" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="2" fill={labelText}>
          CMP 203 • INTERACTIVE PROTOTYPING BREADBOARD (35 COLS)
        </text>

        <rect x="172" y="266" width="920" height="36" rx="4" fill={gapFill} stroke={bbStroke} strokeWidth="1" />

        {/* Power Rail Stripes & +/- Labels */}
        {(['t+', 't-', 'b+', 'b-'] as const).map(r => {
          const isPlus = r.endsWith('+');
          const y = RAIL_Y[r];
          const isEnergized =
            r === 't+'
              ? sim.railsPowered.topPlus
              : r === 't-'
              ? sim.railsPowered.topMinus
              : r === 'b+'
              ? sim.railsPowered.botPlus
              : sim.railsPowered.botMinus;

          return (
            <g key={r}>
              <line
                x1={colX(0) - 8}
                y1={y + (isPlus ? -12 : 12)}
                x2={colX(WB_COLS - 1) + 8}
                y2={y + (isPlus ? -12 : 12)}
                stroke={isPlus ? '#ef4444' : '#3b82f6'}
                strokeWidth={isEnergized ? 3 : 1.5}
                strokeOpacity={isEnergized ? 0.95 : 0.45}
              />
              <text x="172" y={y + 4} textAnchor="middle" fontSize="12" fontWeight="900" fill={isPlus ? '#ef4444' : '#3b82f6'}>
                {isPlus ? '+' : '−'}
              </text>
              <text x="1095" y={y + 4} textAnchor="middle" fontSize="12" fontWeight="900" fill={isPlus ? '#ef4444' : '#3b82f6'}>
                {isPlus ? '+' : '−'}
              </text>
            </g>
          );
        })}

        {/* Row Labels (a-e, f-j) & Column Numbers (1-35) */}
        {TOP_ROWS.map(rw => (
          <text key={rw} x="174" y={ROW_Y[rw] + 3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={labelText}>
            {rw}
          </text>
        ))}
        {BOT_ROWS.map(rw => (
          <text key={rw} x="174" y={ROW_Y[rw] + 3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={labelText}>
            {rw}
          </text>
        ))}
        {Array.from({ length: WB_COLS }, (_, c) => (
          <g key={`c-${c}`}>
            <text x={colX(c)} y={ROW_Y.a - 16} textAnchor="middle" fontSize="8" fontWeight={c % 5 === 0 ? '800' : '500'} fill={labelText}>
              {c + 1}
            </text>
            <text x={colX(c)} y={ROW_Y.j + 20} textAnchor="middle" fontSize="8" fontWeight={c % 5 === 0 ? '800' : '500'} fill={labelText}>
              {c + 1}
            </text>
          </g>
        ))}

        {/* Highlight hovered breadboard vertical strip */}
        {hoveredStripKey && /^[TB]\d+$/.test(hoveredStripKey) && (() => {
          const isTop = hoveredStripKey.startsWith('T');
          const c = parseInt(hoveredStripKey.slice(1), 10);
          const x = colX(c);
          const yTop = isTop ? ROW_Y.a - 8 : ROW_Y.f - 8;
          const height = (isTop ? ROW_Y.e - ROW_Y.a : ROW_Y.j - ROW_Y.f) + 16;
          return (
            <rect
              x={x - 7.5}
              y={yTop}
              width="15"
              height={height}
              rx="6"
              fill="rgba(56, 189, 248, 0.14)"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="1"
              pointerEvents="none"
            />
          );
        })()}

        {/* Breadboard Holes */}
        {holeIds.map(id => {
          const [x, y] = getTerminalPos(id);
          const val = sim.getTerminalValue(id);
          const isPending = pendingWireStart === id;
          const isHigh = state.psu && !sim.shortCircuit && val === 1;
          const isLow = state.psu && !sim.shortCircuit && val === 0;

          return (
            <circle
              key={id}
              cx={x}
              cy={y}
              r={isPending ? 5.5 : 4}
              fill={holeFill}
              stroke={
                isPending
                  ? '#38bdf8'
                  : isHigh
                  ? 'rgba(239,68,68,0.65)'
                  : isLow
                  ? 'rgba(59,130,246,0.45)'
                  : boardDark
                  ? '#334155'
                  : '#94a3b8'
              }
              strokeWidth={isPending ? 2.5 : isHigh || isLow ? 1.4 : 0.8}
            />
          );
        })}

        {/* GENEROUS HIT TARGETS FOR ALL HOLES & TERMINALS */}
        <g fill="transparent" style={{ cursor: armedTool ? 'copy' : 'crosshair' }}>
          {holeIds.map(id => {
            const [x, y] = getTerminalPos(id);
            return <circle key={`hit-${id}`} data-t={id} cx={x} cy={y} r="9" />;
          })}
          {panelTerminals.map(id => {
            const [x, y] = getTerminalPos(id);
            return <circle key={`hit-${id}`} data-t={id} cx={x} cy={y} r="13" />;
          })}
        </g>

        {/* 3. PLACED ICs (DIP-14 and DIP-16 with Pin Numbers & Color-Coded Functional Names) */}
        {state.ics.map((ic: PlacedIC) => {
          const def = IC_CATALOG[ic.type];
          if (!def) return null;
          const half = ic.pinCount / 2;
          const x0 = colX(ic.col) - 11;
          const x1 = colX(ic.col + half - 1) + 11;
          const isSelected = selection?.kind === 'ic' && selection.id === ic.id;
          const powered = sim.icPowered[ic.id];

          return (
            <g key={`ic-${ic.id}`}>
              {/* Metallic IC Pins + Clear Pin Numbers & Function Labels */}
              {Array.from({ length: ic.pinCount }, (_, idx) => idx + 1).map(pinNum => {
                const hole = getICPinHole(ic, pinNum);
                const [px, py] = getTerminalPos(hole);
                const pVal = sim.getTerminalValue(hole);
                const isBot = pinNum <= half;
                const pinCol = getSignalColor(pVal, '#94a3b8');
                const isPinHovered = hoveredStripKey === getNodeKey(hole);

                return (
                  <g key={`ic-${ic.id}-p-${pinNum}`} pointerEvents="none">
                    <rect
                      x={px - 3.5}
                      y={isBot ? 302 : py - 2}
                      width="7"
                      height={isBot ? py - 300 : 268 - py + 2}
                      fill={isPinHovered ? '#fde68a' : '#cbd5e1'}
                      stroke="#475569"
                      strokeWidth="0.6"
                      rx="1"
                    />
                    <circle cx={px} cy={py} r="2.8" fill={pinCol} />
                    {/* Visible Pin Number on Pin Shoulder */}
                    <text
                      x={px}
                      y={isBot ? 311.5 : 260.5}
                      fontSize="5.8"
                      fontWeight="800"
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                      fill={isPinHovered ? '#f59e0b' : pinNumColor}
                    >
                      {pinNum}
                    </text>
                  </g>
                );
              })}

              {/* IC Epoxy Body */}
              <rect
                data-ic={ic.id}
                x={x0}
                y="263"
                width={x1 - x0}
                height="42"
                rx="4"
                fill="url(#wb-ic-body)"
                stroke={isSelected ? '#38bdf8' : '#475569'}
                strokeWidth={isSelected ? 2.5 : 1.2}
                style={{ cursor: 'grab' }}
                filter="url(#wb-shadow)"
              >
                <title>IC {ic.type} ({def.name}) — Drag to move, click to inspect pinout</title>
              </rect>

              {/* Pin Function Labels Printed Inside Top/Bottom Rims */}
              {Array.from({ length: ic.pinCount }, (_, idx) => idx + 1).map(pinNum => {
                const hole = getICPinHole(ic, pinNum);
                const [px] = getTerminalPos(hole);
                const isBot = pinNum <= half;
                const pinLbl = def.pinLabels[pinNum] ?? '';
                const pinDir = def.pinDirections[pinNum];
                const roleColor = getPinRoleColor(pinDir);
                const isPinHovered = hoveredStripKey === getNodeKey(hole);
                const labelFont = pinLbl.length >= 5 ? '5.2' : pinLbl.length === 4 ? '5.8' : '6.4';

                return (
                  <g key={`ic-${ic.id}-lbl-${pinNum}`} pointerEvents="none">
                    {isPinHovered && (
                      <rect
                        x={px - 11}
                        y={isBot ? 291 : 264.5}
                        width="22"
                        height="11.5"
                        rx="2"
                        fill="rgba(56, 189, 248, 0.25)"
                        stroke="#38bdf8"
                        strokeWidth="0.6"
                      />
                    )}
                    <text
                      x={px}
                      y={isBot ? 300.5 : 273.5}
                      fontSize={labelFont}
                      fontWeight="800"
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                      fill={roleColor}
                    >
                      {pinLbl}
                    </text>
                  </g>
                );
              })}

              {/* Pin 1 Orientation Notch */}
              <path
                d={`M ${x0} 278 A 6 6 0 0 1 ${x0} 290 Z`}
                fill={gapFill}
                pointerEvents="none"
              />
              {/* Pin 1 dot */}
              <circle cx={x0 + 6} cy="296" r="1.8" fill="#e2e8f0" pointerEvents="none" />
              {/* Power LED indicator on IC right edge */}
              <circle cx={x1 - 7} cy="284" r="2.8" fill={powered ? '#22c55e' : '#ef4444'} pointerEvents="none" />

              {/* Center IC Part Number Pill (never overlaps top/bottom pin names) */}
              <rect
                x={(x0 + x1) / 2 - 19}
                y="278.5"
                width="38"
                height="11"
                rx="3"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#334155"
                strokeWidth="0.6"
                pointerEvents="none"
              />
              <text
                x={(x0 + x1) / 2}
                y="286.8"
                textAnchor="middle"
                fontSize="9"
                fontWeight="900"
                letterSpacing="0.8"
                fill="#f8fafc"
                fontFamily="ui-monospace, monospace"
                pointerEvents="none"
              >
                {ic.type}
              </text>
            </g>
          );
        })}

        {/* 4. PLACED 330Ω RESISTORS */}
        {state.resistors.map((res: PlacedResistor) => {
          const [ax, ay] = getTerminalPos(res.a);
          const [bx, by] = getTerminalPos(res.b);
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
          const isSelected = selection?.kind === 'resistor' && selection.id === res.id;

          return (
            <g key={`res-${res.id}`}>
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" pointerEvents="none" />
              <circle cx={ax} cy={ay} r="4" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" pointerEvents="none" />
              <circle cx={bx} cy={by} r="4" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" pointerEvents="none" />

              <g transform={`translate(${mx}, ${my}) rotate(${angle})`}>
                {isSelected && (
                  <rect x="-18" y="-9" width="36" height="18" rx="5" fill="none" stroke="#38bdf8" strokeWidth="2.5" pointerEvents="none" />
                )}
                <rect
                  data-res={res.id}
                  x="-15"
                  y="-6"
                  width="30"
                  height="12"
                  rx="4"
                  fill="#e7c697"
                  stroke="#9a7b4f"
                  strokeWidth="1"
                  style={{ cursor: 'grab' }}
                  filter="url(#wb-shadow)"
                />
                <rect x="-10" y="-6" width="3" height="12" fill="#f97316" pointerEvents="none" />
                <rect x="-4" y="-6" width="3" height="12" fill="#f97316" pointerEvents="none" />
                <rect x="2" y="-6" width="3" height="12" fill="#78350f" pointerEvents="none" />
                <rect x="9" y="-6" width="2.5" height="12" fill="#eab308" pointerEvents="none" />
              </g>
            </g>
          );
        })}

        {/* 5. PLACED LEDs (+ Anode / - Cathode) */}
        {state.leds.map((led: PlacedLED, idx: number) => {
          const [ax, ay] = getTerminalPos(led.anode);
          const [kx, ky] = getTerminalPos(led.cathode);
          const mx = (ax + kx) / 2;
          const my = (ay + ky) / 2;
          const ledSt = sim.ledStates[led.id];
          const lit = Boolean(ledSt?.lit);
          const isSelected = selection?.kind === 'led' && selection.id === led.id;

          return (
            <g key={`led-${led.id}`}>
              <line x1={ax} y1={ay} x2={mx} y2={my} stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" pointerEvents="none" />
              <line x1={kx} y1={ky} x2={mx} y2={my} stroke="#60a5fa" strokeWidth="2.6" strokeLinecap="round" pointerEvents="none" />

              <circle cx={ax} cy={ay} r="4.5" fill={lit ? LED_FILL_ON[led.color] : '#94a3b8'} stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
              <circle cx={kx} cy={ky} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />

              <g pointerEvents="none">
                <rect x={ax - 6} y={ay - 14} width="11" height="10" rx="2" fill="#0f172a" stroke="#ef4444" strokeWidth="0.7" />
                <text x={ax - 0.5} y={ay - 6.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fca5a5">+</text>
                <rect x={kx - 6} y={ky - 14} width="11" height="10" rx="2" fill="#0f172a" stroke="#3b82f6" strokeWidth="0.7" />
                <text x={kx - 0.5} y={ky - 6.5} textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#93c5fd">−</text>
              </g>

              {lit && (
                <circle cx={mx} cy={my} r="22" fill={LED_GLOW[led.color]} pointerEvents="none" />
              )}

              {isSelected && (
                <circle cx={mx} cy={my} r="14" fill="none" stroke="#38bdf8" strokeWidth="2.5" pointerEvents="none" />
              )}

              <circle
                data-led={led.id}
                cx={mx}
                cy={my}
                r="10"
                fill={lit ? LED_FILL_ON[led.color] : LED_FILL_OFF[led.color]}
                stroke={lit ? '#ffffff' : '#475569'}
                strokeWidth="1.5"
                style={{ cursor: 'grab' }}
                filter="url(#wb-shadow)"
              />
              <ellipse cx={mx - 3} cy={my - 3.5} rx="3" ry="1.8" fill="rgba(255,255,255,0.75)" pointerEvents="none" />

              <text x={mx} y={my + 21} textAnchor="middle" fontSize="8.5" fontWeight="800" fill={lit ? '#22c55e' : dockText} pointerEvents="none">
                {led.label || `LED${idx + 1}`} ({lit ? '1' : '0'})
              </text>

              {lit && !ledSt?.hasResistor && (
                <g pointerEvents="none">
                  <circle cx={mx + 10} cy={my - 10} r="6" fill="#f59e0b" />
                  <text x={mx + 10} y={my - 7} textAnchor="middle" fontSize="8" fontWeight="900" fill="#0f172a">!</text>
                </g>
              )}
            </g>
          );
        })}

        {/* 6. FLEXIBLE & MOVABLE JUMPER WIRES */}
        {state.wires.map(w => {
          const { ax, ay, bx, by, cx, cy, apexX, apexY } = getWireGeometry(w);
          const d = `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
          const isSelected = selection?.kind === 'wire' && selection.id === w.id;
          const val = sim.getTerminalValue(w.a);
          const isActiveHigh = state.psu && !sim.shortCircuit && val === 1;

          return (
            <g key={`wire-${w.id}`}>
              {isSelected && (
                <path d={d} fill="none" stroke="#38bdf8" strokeWidth="9" strokeOpacity="0.6" pointerEvents="none" strokeLinecap="round" />
              )}
              {isActiveHigh && !isSelected && (
                <path d={d} fill="none" stroke="#ef4444" strokeWidth="7.5" strokeOpacity="0.3" pointerEvents="none" strokeLinecap="round" />
              )}
              <path d={d} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="5.5" transform="translate(0, 2)" pointerEvents="none" strokeLinecap="round" />
              <path d={d} fill="none" stroke={w.color} strokeWidth="4.2" pointerEvents="none" strokeLinecap="round" />
              {/* Subtle specular highlight */}
              <path d={d} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" pointerEvents="none" strokeLinecap="round" />

              {/* Wide Drag/Click Hit Area along wire body */}
              <path
                data-wire={w.id}
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                style={{ cursor: 'grab' }}
                strokeLinecap="round"
              >
                <title>Drag to bend/stretch wire curve (double-click to reset curve)</title>
              </path>

              <circle cx={ax} cy={ay} r="3.8" fill={w.color} pointerEvents="none" />
              <circle cx={bx} cy={by} r="3.8" fill={w.color} pointerEvents="none" />

              {/* Selected Wire Apex Grip Handle (works smoothly on both Touch & Mouse!) */}
              {isSelected && (
                <g style={{ touchAction: 'none', cursor: 'grab' }}>
                  <circle
                    data-wire-handle={w.id}
                    cx={apexX}
                    cy={apexY}
                    r="15"
                    fill="transparent"
                    style={{ touchAction: 'none' }}
                  />
                  <circle
                    cx={apexX}
                    cy={apexY}
                    r="7"
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth="2"
                    pointerEvents="none"
                    filter="url(#wb-shadow)"
                  />
                  <text
                    x={apexX}
                    y={apexY + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="900"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    ✥
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 7. CONTEXT-AWARE PRACTICE HINT OVERLAY (Ghost Component Slot or Wire Guide Path) */}
        {activeHint && activeHint.kind === 'place-ic' && (() => {
          const half = activeHint.pinCount / 2;
          const x0 = colX(activeHint.suggestedCol) - 12;
          const x1 = colX(activeHint.suggestedCol + half - 1) + 12;
          const cx = (x0 + x1) / 2;
          return (
            <g pointerEvents="none">
              <rect
                x={x0}
                y="260"
                width={x1 - x0}
                height="48"
                rx="6"
                fill="rgba(6, 182, 212, 0.16)"
                stroke="#06b6d4"
                strokeWidth="2.2"
                strokeDasharray="6 3"
                className="explain-highlight"
              />
              <rect x={cx - 48} y="242" width="96" height="16" rx="4" fill="#0891b2" filter="url(#wb-shadow)" />
              <text x={cx} y="253" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#ffffff" fontFamily="ui-monospace, monospace">
                PLACE IC {activeHint.icType}
              </text>
            </g>
          );
        })()}

        {activeHint && activeHint.kind === 'place-resistor' && (() => {
          const [ax, ay] = getTerminalPos(activeHint.a);
          const [bx, by] = getTerminalPos(activeHint.b);
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          return (
            <g pointerEvents="none">
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#f59e0b" strokeWidth="5" strokeDasharray="5 3" strokeOpacity="0.85" />
              <circle cx={ax} cy={ay} r="8" fill="none" stroke="#f59e0b" strokeWidth="2" className="target-hole-glow" />
              <circle cx={bx} cy={by} r="8" fill="none" stroke="#f59e0b" strokeWidth="2" className="target-hole-glow" />
              <rect x={mx - 38} y={my - 23} width="76" height="15" rx="4" fill="#d97706" filter="url(#wb-shadow)" />
              <text x={mx} y={my - 13} textAnchor="middle" fontSize="8" fontWeight="800" fill="#ffffff">
                PLACE 330Ω R
              </text>
            </g>
          );
        })()}

        {activeHint && activeHint.kind === 'place-led' && (() => {
          const [ax, ay] = getTerminalPos(activeHint.anode);
          const [kx, ky] = getTerminalPos(activeHint.cathode);
          const mx = (ax + kx) / 2;
          const my = (ay + ky) / 2;
          return (
            <g pointerEvents="none">
              <line x1={ax} y1={ay} x2={kx} y2={ky} stroke="#10b981" strokeWidth="4" strokeDasharray="5 3" strokeOpacity="0.85" />
              <circle cx={ax} cy={ay} r="8" fill="none" stroke="#ef4444" strokeWidth="2" className="target-hole-glow" />
              <circle cx={kx} cy={ky} r="8" fill="none" stroke="#3b82f6" strokeWidth="2" className="target-hole-glow" />
              <circle cx={mx} cy={my} r="12" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
              <rect x={mx - 40} y={my - 26} width="80" height="15" rx="4" fill="#059669" filter="url(#wb-shadow)" />
              <text x={mx} y={my - 16} textAnchor="middle" fontSize="8" fontWeight="800" fill="#ffffff">
                PLACE {activeHint.label || 'LED'} (+/−)
              </text>
            </g>
          );
        })()}

        {activeHint && activeHint.kind === 'wire' && (() => {
          const [ax, ay] = getTerminalPos(activeHint.fromHole);
          const [bx, by] = getTerminalPos(activeHint.toHole);
          const dist = Math.hypot(ax - bx, ay - by);
          const midX = (ax + bx) / 2;
          const midY = Math.min(ay, by) - 18 - dist * 0.08;
          return (
            <g>
              <path
                d={`M ${ax} ${ay} Q ${midX} ${midY} ${bx} ${by}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeOpacity="0.9"
                pointerEvents="none"
                className="animated-dashed-wire"
              />
              {!pendingWireStart && (
                <g
                  style={{ cursor: 'pointer' }}
                  onPointerDown={e => {
                    e.stopPropagation();
                    onProbe(activeHint.fromHole);
                    onStartWire(activeHint.fromHole);
                  }}
                >
                  <circle cx={ax} cy={ay} r="14" fill="transparent" />
                  <circle cx={ax} cy={ay} r="9.5" fill="none" stroke="#06b6d4" strokeWidth="2.2" className="target-hole-glow" />
                  <rect x={ax - 17} y={ay - 22} width="34" height="13" rx="3" fill="#0891b2" filter="url(#wb-shadow)" />
                  <text x={ax} y={ay - 12.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#ffffff">
                    START
                  </text>
                </g>
              )}
              <g
                style={{ cursor: 'pointer' }}
                onPointerDown={e => {
                  e.stopPropagation();
                  if (pendingWireStart && pendingWireStart !== activeHint.toHole) {
                    onCompleteWire(pendingWireStart, activeHint.toHole);
                  } else if (!pendingWireStart) {
                    onProbe(activeHint.toHole);
                    onStartWire(activeHint.toHole);
                  }
                }}
              >
                <circle cx={bx} cy={by} r="14" fill="transparent" />
                <circle cx={bx} cy={by} r="9.5" fill="none" stroke="#10b981" strokeWidth="2.2" className="target-hole-glow" />
                <rect x={bx - 14} y={by - 22} width="28" height="13" rx="3" fill="#059669" filter="url(#wb-shadow)" />
                <text x={bx} y={by - 12.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#ffffff">
                  END
                </text>
              </g>
            </g>
          );
        })()}

        {/* 8. RUBBER-BAND PENDING WIRE PREVIEW */}
        {pendingWireStart && (() => {
          const [ax, ay] = getTerminalPos(pendingWireStart);
          const hasCursor = mouseSvg[0] > 0 || mouseSvg[1] > 0;
          const [tx, ty] = hasCursor ? mouseSvg : [ax + 40, ay - 20];
          return (
            <g pointerEvents="none">
              <line
                x1={ax}
                y1={ay}
                x2={tx}
                y2={ty}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <circle cx={ax} cy={ay} r="6.5" fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="2" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
};
