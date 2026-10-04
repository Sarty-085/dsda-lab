import React, { useState, useRef, useCallback } from 'react';
import { BB_CONFIG, getHoleCoords } from './breadboardLayout';
import { SubCircuitConfig, ExplanationStep } from '../../experiments/types';
import { Circuit } from '../../simulator/engine/Circuit';
import { DigitalSignal } from '../../simulator/engine/types';
import { IC_CATALOG } from '../../simulator/ics/definitions';

interface BreadboardSVGProps {
  config: SubCircuitConfig;
  circuit: Circuit;
  highlightComponentId?: string;
  activeStep?: ExplanationStep;
  onToggleSwitch?: (switchId: string) => void;
  onSelectComponent?: (comp: { type: string; id: string; label: string; details?: any }) => void;
  // Build Mode props
  isBuildMode?: boolean;
  userPlacedWireIds?: string[];
  pendingWireStart?: { row: number; col: string; pinId?: string } | null;
  onHoleClick?: (hole: { row: number; col: string; pinId?: string }) => void;
  targetWire?: {
    id: string;
    from: { row: number; col: string };
    to: { row: number; col: string };
    label?: string;
    color?: string;
  } | null;
  buildStatusMessage?: string | null;
}

export const BreadboardSVG: React.FC<BreadboardSVGProps> = ({
  config,
  circuit,
  highlightComponentId,
  activeStep,
  onToggleSwitch,
  onSelectComponent,
  isBuildMode = false,
  userPlacedWireIds = [],
  pendingWireStart = null,
  onHoleClick,
  targetWire = null,
  buildStatusMessage = null,
}) => {
  const rows = Array.from({ length: BB_CONFIG.rowsCount }, (_, i) => i + 1);
  const leftCols = ['A', 'B', 'C', 'D', 'E'];
  const rightCols = ['F', 'G', 'H', 'I', 'J'];

  // User draggable wire curvature offsets: wireId -> { dx: number, dy: number }
  const [wireDragOffsets, setWireDragOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const [draggingWireId, setDraggingWireId] = useState<string | null>(null);
  const [hoveredHole, setHoveredHole] = useState<{ row: number; col: string } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const initialOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Get SVG coordinate from mouse/touch event
  const getSVGPoint = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    if ('touches' in e && e.touches.length > 0) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else if ('clientX' in e) {
      pt.x = (e as MouseEvent).clientX;
      pt.y = (e as MouseEvent).clientY;
    }
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  }, []);

  const handleWireMouseDown = (wireId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const svgPt = getSVGPoint(e);
    dragStartPos.current = svgPt;
    initialOffset.current = wireDragOffsets[wireId] || { dx: 0, dy: 0 };
    setDraggingWireId(wireId);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const svgPt = getSVGPoint(e);
    if (isBuildMode && pendingWireStart) {
      setCursorPos(svgPt);
    }
    if (!draggingWireId || !dragStartPos.current) return;
    const deltaX = svgPt.x - dragStartPos.current.x;
    const deltaY = svgPt.y - dragStartPos.current.y;
    setWireDragOffsets(prev => ({
      ...prev,
      [draggingWireId]: {
        dx: initialOffset.current.dx + deltaX,
        dy: initialOffset.current.dy + deltaY,
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggingWireId(null);
    dragStartPos.current = null;
  };

  // Wires to display: in Build Mode, only user placed wires (or all if completed)
  const visibleWires = isBuildMode
    ? config.wires.filter(w => userPlacedWireIds.includes(w.id))
    : config.wires;

  // Zoom / Pan state for mobile comfort
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Mobile Breadboard Control Bar: Zoom & Reset */}
      <div className="flex items-center justify-between px-1 py-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span className="hidden sm:inline">Canvas:</span>
          <span className="font-mono text-sky-400">{Math.round(zoomLevel * 100)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel(z => Math.max(0.75, Math.round((z - 0.15) * 100) / 100))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold active:scale-95 transition-transform"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-2 h-7 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[11px] font-medium active:scale-95 transition-transform"
            title="Reset Zoom"
          >
            100%
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.min(1.75, Math.round((z + 0.15) * 100) / 100))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold active:scale-95 transition-transform"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div
        className="relative w-full flex justify-center bg-slate-950 p-1 sm:p-4 rounded-xl border border-slate-800 shadow-2xl overflow-x-auto overflow-y-hidden select-none touch-pan-x"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      >
        <div
          className="transition-transform duration-150 origin-top flex justify-center w-full min-w-[320px]"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${BB_CONFIG.viewBoxWidth} ${BB_CONFIG.viewBoxHeight}`}
            className="w-full max-w-[620px] h-auto drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.6))' }}
          >
        <defs>
          {/* Subtle breadboard background gradients and filters */}
          <linearGradient id="bb-surface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdfbf7" />
            <stop offset="100%" stopColor="#f4ede2" />
          </linearGradient>

          <linearGradient id="ic-chip-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22252a" />
            <stop offset="50%" stopColor="#14171a" />
            <stop offset="100%" stopColor="#0a0c0e" />
          </linearGradient>

          <radialGradient id="hole-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#111827" />
            <stop offset="100%" stopColor="#374151" />
          </radialGradient>

          <radialGradient id="led-glow-red" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="40%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>

          <radialGradient id="led-glow-green" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>

          <filter id="shadow-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. Main Breadboard Body */}
        <rect
          x={BB_CONFIG.boardX}
          y={BB_CONFIG.boardY}
          width={BB_CONFIG.boardWidth}
          height={BB_CONFIG.boardHeight}
          rx={18}
          fill="url(#bb-surface)"
          stroke="#d6cbbe"
          strokeWidth={3}
          filter="url(#shadow-soft)"
        />

        {/* Outer border bevel lines */}
        <rect
          x={BB_CONFIG.boardX + 6}
          y={BB_CONFIG.boardY + 6}
          width={BB_CONFIG.boardWidth - 12}
          height={BB_CONFIG.boardHeight - 12}
          rx={14}
          fill="none"
          stroke="#ece4d9"
          strokeWidth={1.5}
        />

        {/* Board Brand & Header Label */}
        <text
          x={BB_CONFIG.viewBoxWidth / 2}
          y={BB_CONFIG.boardY + 28}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          letterSpacing="2"
          fill="#8c7e6c"
          fontFamily="system-ui, sans-serif"
        >
          CMP 203 • DIGITAL BREADBOARD TRAINER
        </text>

        {/* 2. Power Rails Markings */}
        {/* Left Rails (+ Red line & - Blue line) */}
        <line
          x1={BB_CONFIG.railLeftPlusX}
          y1={BB_CONFIG.startY - 16}
          x2={BB_CONFIG.railLeftPlusX}
          y2={BB_CONFIG.startY + (BB_CONFIG.rowsCount - 1) * BB_CONFIG.rowPitch + 16}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
        <text x={BB_CONFIG.railLeftPlusX} y={BB_CONFIG.startY - 22} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444">+</text>
        <text x={BB_CONFIG.railLeftPlusX} y={BB_CONFIG.startY + BB_CONFIG.rowsCount * BB_CONFIG.rowPitch + 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444">+</text>

        <line
          x1={BB_CONFIG.railLeftMinusX}
          y1={BB_CONFIG.startY - 16}
          x2={BB_CONFIG.railLeftMinusX}
          y2={BB_CONFIG.startY + (BB_CONFIG.rowsCount - 1) * BB_CONFIG.rowPitch + 16}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
        <text x={BB_CONFIG.railLeftMinusX} y={BB_CONFIG.startY - 22} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">-</text>
        <text x={BB_CONFIG.railLeftMinusX} y={BB_CONFIG.startY + BB_CONFIG.rowsCount * BB_CONFIG.rowPitch + 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">-</text>

        {/* Right Rails (- Blue line & + Red line) */}
        <line
          x1={BB_CONFIG.railRightMinusX}
          y1={BB_CONFIG.startY - 16}
          x2={BB_CONFIG.railRightMinusX}
          y2={BB_CONFIG.startY + (BB_CONFIG.rowsCount - 1) * BB_CONFIG.rowPitch + 16}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
        <text x={BB_CONFIG.railRightMinusX} y={BB_CONFIG.startY - 22} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">-</text>
        <text x={BB_CONFIG.railRightMinusX} y={BB_CONFIG.startY + BB_CONFIG.rowsCount * BB_CONFIG.rowPitch + 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3b82f6">-</text>

        <line
          x1={BB_CONFIG.railRightPlusX}
          y1={BB_CONFIG.startY - 16}
          x2={BB_CONFIG.railRightPlusX}
          y2={BB_CONFIG.startY + (BB_CONFIG.rowsCount - 1) * BB_CONFIG.rowPitch + 16}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
        <text x={BB_CONFIG.railRightPlusX} y={BB_CONFIG.startY - 22} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444">+</text>
        <text x={BB_CONFIG.railRightPlusX} y={BB_CONFIG.startY + BB_CONFIG.rowsCount * BB_CONFIG.rowPitch + 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444">+</text>

        {/* 3. Center DIP Trough Channel */}
        <rect
          x={BB_CONFIG.troughCenterX - BB_CONFIG.troughWidth / 2}
          y={BB_CONFIG.startY - 16}
          width={BB_CONFIG.troughWidth}
          height={BB_CONFIG.rowsCount * BB_CONFIG.rowPitch + 12}
          fill="#e2d6c6"
          stroke="#c9b8a3"
          strokeWidth={1}
          rx={3}
        />

        {/* Column Labels (A-E and F-J) Top & Bottom */}
        {['top', 'bottom'].map(pos => {
          const y = pos === 'top' ? BB_CONFIG.startY - 24 : BB_CONFIG.startY + BB_CONFIG.rowsCount * BB_CONFIG.rowPitch + 8;
          return (
            <g key={pos} fontSize="10" fontWeight="bold" fill="#8c7e6c" textAnchor="middle">
              {leftCols.map(c => {
                const pt = getHoleCoords(1, c);
                return <text key={c} x={pt.x} y={y}>{c}</text>;
              })}
              {rightCols.map(c => {
                const pt = getHoleCoords(1, c);
                return <text key={c} x={pt.x} y={y}>{c}</text>;
              })}
            </g>
          );
        })}

        {/* 4. Breadboard Holes & Row Numbers */}
        {rows.map(row => {
          const y = BB_CONFIG.startY + (row - 1) * BB_CONFIG.rowPitch;
          return (
            <g key={`row-${row}`}>
              {/* Row number left and right */}
              {row % 5 === 0 && (
                <>
                  <text
                    x={BB_CONFIG.railLeftMinusX + 18}
                    y={y + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#9c8e7e"
                  >
                    {row}
                  </text>
                  <text
                    x={BB_CONFIG.railRightMinusX - 18}
                    y={y + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#9c8e7e"
                  >
                    {row}
                  </text>
                </>
              )}

              {/* Rails Holes */}
              {['L+', 'L-', 'R-', 'R+'].map(rail => {
                const pt = getHoleCoords(row, rail);
                const isPending = pendingWireStart?.row === row && pendingWireStart?.col === rail;
                const isTargetFrom = isBuildMode && targetWire && !pendingWireStart &&
                  targetWire.from.row === row && targetWire.from.col.toUpperCase() === rail;
                const isTargetTo = isBuildMode && targetWire &&
                  (pendingWireStart ? targetWire.to.row === row && targetWire.to.col.toUpperCase() === rail : false);
                const isHovered = hoveredHole?.row === row && hoveredHole?.col === rail;

                return (
                  <g
                    key={`${rail}-${row}`}
                    className={isBuildMode ? 'cursor-pointer' : ''}
                    onClick={() => onHoleClick?.({ row, col: rail })}
                    onMouseEnter={() => setHoveredHole({ row, col: rail })}
                    onMouseLeave={() => setHoveredHole(null)}
                  >
                    {/* Generous invisible click area for easy clicking */}
                    {isBuildMode && (
                      <circle cx={pt.x} cy={pt.y} r={9} fill="transparent" />
                    )}

                    {/* Target Guidance Halo */}
                    {(isTargetFrom || isTargetTo) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={7.5}
                        fill="none"
                        stroke={isTargetFrom ? '#06b6d4' : '#10b981'}
                        strokeWidth={2.2}
                        className="target-hole-glow"
                      />
                    )}

                    {/* Base Hole */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={BB_CONFIG.holeRadius}
                      fill="url(#hole-shadow)"
                      stroke={
                        isPending
                          ? '#eab308'
                          : isTargetFrom
                          ? '#06b6d4'
                          : isTargetTo
                          ? '#10b981'
                          : isHovered && isBuildMode
                          ? '#f59e0b'
                          : '#cbd5e1'
                      }
                      strokeWidth={isPending || isTargetFrom || isTargetTo ? 2 : 0.6}
                    />
                  </g>
                );
              })}

              {/* Terminal Strip Internal Conductive Spring Clips (A-E and F-J) */}
              <line
                x1={BB_CONFIG.colAX - 2}
                y1={y}
                x2={BB_CONFIG.colEX + 2}
                y2={y}
                stroke="#d1c7b7"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.45}
              />
              <line
                x1={BB_CONFIG.colFX - 2}
                y1={y}
                x2={BB_CONFIG.colJX + 2}
                y2={y}
                stroke="#d1c7b7"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.45}
              />

              {/* Terminal Strip Holes (A-E and F-J) */}
              {[...leftCols, ...rightCols].map(col => {
                const pt = getHoleCoords(row, col);
                const isPending = pendingWireStart?.row === row && pendingWireStart?.col === col;
                const isTargetFrom = isBuildMode && targetWire && !pendingWireStart &&
                  targetWire.from.row === row && targetWire.from.col.toUpperCase() === col;
                const isTargetTo = isBuildMode && targetWire &&
                  (pendingWireStart ? targetWire.to.row === row && targetWire.to.col.toUpperCase() === col : false);
                const isHovered = hoveredHole?.row === row && hoveredHole?.col === col;

                return (
                  <g
                    key={`${col}-${row}`}
                    className={isBuildMode ? 'cursor-pointer' : ''}
                    onClick={() => onHoleClick?.({ row, col })}
                    onMouseEnter={() => setHoveredHole({ row, col })}
                    onMouseLeave={() => setHoveredHole(null)}
                  >
                    {/* Generous invisible hit target so holes are effortlessly clickable */}
                    {isBuildMode && (
                      <circle cx={pt.x} cy={pt.y} r={9} fill="transparent" />
                    )}

                    {/* Target Guidance Halo */}
                    {(isTargetFrom || isTargetTo) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={7.5}
                        fill="none"
                        stroke={isTargetFrom ? '#06b6d4' : '#10b981'}
                        strokeWidth={2.2}
                        className="target-hole-glow"
                      />
                    )}

                    {/* Base Hole */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={BB_CONFIG.holeRadius}
                      fill="url(#hole-shadow)"
                      stroke={
                        isPending
                          ? '#eab308'
                          : isTargetFrom
                          ? '#06b6d4'
                          : isTargetTo
                          ? '#10b981'
                          : isHovered && isBuildMode
                          ? '#f59e0b'
                          : '#d1d5db'
                      }
                      strokeWidth={isPending || isTargetFrom || isTargetTo ? 2 : 0.6}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* 5. DIP IC Chips Mounted across center trough */}
        {config.ics.map(icConfig => {
          const def = IC_CATALOG[icConfig.partNumber];
          if (!def) return null;

          const numPins = def.pinCount;
          const halfPins = numPins / 2;
          const topY = BB_CONFIG.startY + (icConfig.rowStart - 1) * BB_CONFIG.rowPitch - 6;
          const chipHeight = (halfPins - 1) * BB_CONFIG.rowPitch + 22;
          // Standard DIP package body fits neatly within the trough, leaving columns E and F holes completely exposed
          const chipWidth = 44;
          const chipX = BB_CONFIG.troughCenterX - chipWidth / 2;

          const isHighlighted = highlightComponentId === icConfig.instanceId;

          return (
            <g key={icConfig.instanceId}>
              {/* Highlight Aura */}
              {isHighlighted && (
                <rect
                  x={chipX - 6}
                  y={topY - 6}
                  width={chipWidth + 12}
                  height={chipHeight + 12}
                  rx={8}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  className="explain-highlight"
                />
              )}

              {/* IC Metallic Pins (Silver contacts connecting to breadboard columns E and F) */}
              {Array.from({ length: halfPins }, (_, idx) => {
                const pinLeftNum = idx + 1;
                const pinRightNum = numPins - idx;
                const pinRow = icConfig.rowStart + idx;
                const y = BB_CONFIG.startY + (pinRow - 1) * BB_CONFIG.rowPitch;

                // Check signal for left and right pin
                const leftPinId = `${icConfig.instanceId}_pin_${pinLeftNum}`;
                const rightPinId = `${icConfig.instanceId}_pin_${pinRightNum}`;
                const leftSignal = circuit.pins[leftPinId]?.signal ?? DigitalSignal.FLOATING;
                const rightSignal = circuit.pins[rightPinId]?.signal ?? DigitalSignal.FLOATING;

                return (
                  <g key={`pins-${idx}`}>
                    {/* Left Pin Contact (Col E) - Clickable in Build Mode to connect */}
                    <rect
                      x={BB_CONFIG.colEX - 2}
                      y={y - 3}
                      width={chipX - BB_CONFIG.colEX + 4}
                      height={6}
                      fill="#94a3b8"
                      stroke="#475569"
                      strokeWidth={0.5}
                      rx={1}
                      className={isBuildMode ? 'cursor-pointer' : ''}
                      onClick={(e) => {
                        if (isBuildMode) {
                          e.stopPropagation();
                          onHoleClick?.({ row: pinRow, col: 'E' });
                        }
                      }}
                    />
                    <circle
                      cx={BB_CONFIG.colEX}
                      cy={y}
                      r={2.5}
                      fill={leftSignal === DigitalSignal.HIGH ? '#ef4444' : leftSignal === DigitalSignal.LOW ? '#3b82f6' : '#94a3b8'}
                      className={isBuildMode ? 'cursor-pointer' : ''}
                      onClick={(e) => {
                        if (isBuildMode) {
                          e.stopPropagation();
                          onHoleClick?.({ row: pinRow, col: 'E' });
                        }
                      }}
                    />
                    {activeStep?.highlightPins?.includes(pinLeftNum) && (
                      <circle
                        cx={BB_CONFIG.colEX}
                        cy={y}
                        r={6}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        className="pin-highlight-ring"
                      />
                    )}

                    {/* Right Pin Contact (Col F) - Clickable in Build Mode to connect */}
                    <rect
                      x={chipX + chipWidth - 2}
                      y={y - 3}
                      width={BB_CONFIG.colFX - (chipX + chipWidth) + 4}
                      height={6}
                      fill="#94a3b8"
                      stroke="#475569"
                      strokeWidth={0.5}
                      rx={1}
                      className={isBuildMode ? 'cursor-pointer' : ''}
                      onClick={(e) => {
                        if (isBuildMode) {
                          e.stopPropagation();
                          onHoleClick?.({ row: pinRow, col: 'F' });
                        }
                      }}
                    />
                    <circle
                      cx={BB_CONFIG.colFX}
                      cy={y}
                      r={2.5}
                      fill={rightSignal === DigitalSignal.HIGH ? '#ef4444' : rightSignal === DigitalSignal.LOW ? '#3b82f6' : '#94a3b8'}
                      className={isBuildMode ? 'cursor-pointer' : ''}
                      onClick={(e) => {
                        if (isBuildMode) {
                          e.stopPropagation();
                          onHoleClick?.({ row: pinRow, col: 'F' });
                        }
                      }}
                    />
                    {activeStep?.highlightPins?.includes(pinRightNum) && (
                      <circle
                        cx={BB_CONFIG.colFX}
                        cy={y}
                        r={6}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        className="pin-highlight-ring"
                      />
                    )}
                  </g>
                );
              })}

              {/* IC Ceramic/Epoxy Body */}
              <rect
                x={chipX}
                y={topY}
                width={chipWidth}
                height={chipHeight}
                rx={4}
                fill="url(#ic-chip-grad)"
                stroke="#334155"
                strokeWidth={1}
                filter="url(#shadow-soft)"
                className="cursor-pointer"
                onClick={() => onSelectComponent?.({
                  type: 'IC',
                  id: icConfig.instanceId,
                  label: icConfig.label,
                  details: { def, config: icConfig }
                })}
              />

              {/* Pin 1 Orientation Notch at Top */}
              <path
                d={`M ${BB_CONFIG.troughCenterX - 7} ${topY} A 7 7 0 0 0 ${BB_CONFIG.troughCenterX + 7} ${topY}`}
                fill="#0f172a"
                stroke="#334155"
                strokeWidth={0.8}
                pointerEvents="none"
              />
              {/* Dot for Pin 1 */}
              <circle
                cx={chipX + 6}
                cy={topY + 10}
                r={2}
                fill="#64748b"
                pointerEvents="none"
              />

              {/* IC Label / Part Number printed on top */}
              <text
                x={BB_CONFIG.troughCenterX}
                y={topY + chipHeight / 2 - 2}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                letterSpacing="1"
                fill="#f1f5f9"
                fontFamily="ui-monospace, monospace"
                pointerEvents="none"
              >
                {icConfig.partNumber}
              </text>
              <text
                x={BB_CONFIG.troughCenterX}
                y={topY + chipHeight / 2 + 11}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#94a3b8"
              >
                {icConfig.label.split('(')[0].trim()}
              </text>
            </g>
          );
        })}

        {/* 6. Realistic 2D Curved Jumper Wires */}
        {visibleWires.map((wire, wireIdx) => {
          const fromPt = getHoleCoords(wire.from.row, wire.from.col);
          const toPt = getHoleCoords(wire.to.row, wire.to.col);

          // Get simulated signal
          const simWire = circuit.wires.find(w => w.id === wire.id);
          const signal = simWire ? simWire.signal : DigitalSignal.FLOATING;
          const isHigh = signal === DigitalSignal.HIGH;

          // Compute smooth curve with natural jumper arc
          const dx = toPt.x - fromPt.x;
          const dy = toPt.y - fromPt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Smart bend direction:
          // Alternate arc bulge slightly per wire index to prevent coincident wires from overlapping
          const stagger = ((wireIdx % 3) - 1) * 6;
          // Base natural arc offset depending on wire length
          let baseOffset = Math.min(38, Math.max(14, dist * 0.16)) + stagger;

          // If wire is mostly vertical or horizontal, calculate smooth perpendicular control point
          let perpX = -dy / (dist || 1);
          let perpY = dx / (dist || 1);

          // Ensure arcs bulge naturally outwards away from dense center if close to edges
          const midHoleX = (fromPt.x + toPt.x) / 2;
          if (midHoleX < BB_CONFIG.troughCenterX && perpX > 0) {
            perpX = -perpX;
            perpY = -perpY;
          } else if (midHoleX > BB_CONFIG.troughCenterX && perpX < 0) {
            perpX = -perpX;
            perpY = -perpY;
          }

          // Apply user interactive drag offset if dragged
          const userOffset = wireDragOffsets[wire.id] || { dx: 0, dy: 0 };
          const midX = (fromPt.x + toPt.x) / 2 + perpX * baseOffset + userOffset.dx;
          const midY = (fromPt.y + toPt.y) / 2 + perpY * baseOffset + userOffset.dy;

          const wireStrokeColor = isHigh ? '#ef4444' : wire.color ?? '#3b82f6';
          const isWireHighlighted = highlightComponentId === wire.id || activeStep?.highlightWires?.includes(wire.id);

          return (
            <g
              key={wire.id}
              className="cursor-pointer"
              onClick={() => onSelectComponent?.({
                type: 'Wire',
                id: wire.id,
                label: wire.label ?? 'Jumper Wire',
                details: { wire, signal }
              })}
            >
              {/* Outer Glow when carrying HIGH or highlighted */}
              {isHigh && (
                <path
                  d={`M ${fromPt.x} ${fromPt.y} Q ${midX} ${midY} ${toPt.x} ${toPt.y}`}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth={8}
                  strokeOpacity={0.45}
                  strokeLinecap="round"
                />
              )}

              {isWireHighlighted && (
                <path
                  d={`M ${fromPt.x} ${fromPt.y} Q ${midX} ${midY} ${toPt.x} ${toPt.y}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={9}
                  strokeOpacity={0.7}
                  strokeLinecap="round"
                  className="explain-highlight"
                />
              )}

              {/* Wire Shadow */}
              <path
                d={`M ${fromPt.x} ${fromPt.y + 3} Q ${midX} ${midY + 4} ${toPt.x} ${toPt.y + 3}`}
                fill="none"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={4.5}
                strokeLinecap="round"
              />

              {/* Main Insulated Jumper Body */}
              <path
                d={`M ${fromPt.x} ${fromPt.y} Q ${midX} ${midY} ${toPt.x} ${toPt.y}`}
                fill="none"
                stroke={wireStrokeColor}
                strokeWidth={3.8}
                strokeLinecap="round"
                className="cursor-move"
                onMouseDown={(e) => handleWireMouseDown(wire.id, e)}
                onTouchStart={(e) => handleWireMouseDown(wire.id, e)}
              />

              {/* Highlighting sheen on top of wire */}
              <path
                d={`M ${fromPt.x} ${fromPt.y} Q ${midX} ${midY} ${toPt.x} ${toPt.y}`}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                strokeLinecap="round"
                pointerEvents="none"
              />

              {/* Wire Pin Termination Rings */}
              <circle cx={fromPt.x} cy={fromPt.y} r={3.2} fill="#334155" stroke="#94a3b8" strokeWidth={1} />
              <circle cx={toPt.x} cy={toPt.y} r={3.2} fill="#334155" stroke="#94a3b8" strokeWidth={1} />
            </g>
          );
        })}

        {/* 6.5. In Build Mode: Live Rubber-Band Connecting Wire & Target Ghost Guides */}
        {isBuildMode && targetWire && (() => {
          const fromPt = getHoleCoords(targetWire.from.row, targetWire.from.col);
          const toPt = getHoleCoords(targetWire.to.row, targetWire.to.col);
          return (
            <g>
              {/* Ghost Guide for Recommended Wire (shown before starting) */}
              {!pendingWireStart && (
                <line
                  x1={fromPt.x}
                  y1={fromPt.y}
                  x2={toPt.x}
                  y2={toPt.y}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  pointerEvents="none"
                />
              )}

              {/* From Marker Badge (Clickable START) - shown when wire is not yet started */}
              {!pendingWireStart && (
                <g
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHoleClick?.({ row: targetWire.from.row, col: targetWire.from.col.toUpperCase() });
                  }}
                >
                  <circle cx={fromPt.x} cy={fromPt.y} r={16} fill="transparent" />
                  <circle cx={fromPt.x} cy={fromPt.y} r={11} fill="none" stroke="#06b6d4" strokeWidth={2} className="target-hole-glow" />
                  <rect x={fromPt.x - 16} y={fromPt.y - 22} width={32} height={14} rx={3} fill="#0891b2" filter="url(#shadow-soft)" />
                  <text x={fromPt.x} y={fromPt.y - 12} fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">START</text>
                </g>
              )}

              {/* To Marker Badge (Clickable END) - always visible while targetWire is active */}
              <g
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onHoleClick?.({ row: targetWire.to.row, col: targetWire.to.col.toUpperCase() });
                }}
              >
                <circle cx={toPt.x} cy={toPt.y} r={16} fill="transparent" />
                <circle cx={toPt.x} cy={toPt.y} r={11} fill="none" stroke="#10b981" strokeWidth={2} className="target-hole-glow" />
                <rect x={toPt.x - 14} y={toPt.y - 22} width={28} height={14} rx={3} fill="#059669" filter="url(#shadow-soft)" />
                <text x={toPt.x} y={toPt.y - 12} fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">END</text>
              </g>
            </g>
          );
        })()}

        {isBuildMode && pendingWireStart && (() => {
          const startPt = getHoleCoords(pendingWireStart.row, pendingWireStart.col);
          const destPt = hoveredHole
            ? getHoleCoords(hoveredHole.row, hoveredHole.col)
            : cursorPos ?? { x: startPt.x + 40, y: startPt.y + 40 };

          return (
            <g pointerEvents="none">
              {/* Animated Rubber-Band Connecting Wire */}
              <line
                x1={startPt.x}
                y1={startPt.y}
                x2={destPt.x}
                y2={destPt.y}
                stroke="#f59e0b"
                strokeWidth={3.5}
                strokeLinecap="round"
                className="animated-dashed-wire"
              />
              {/* Pulsing Start Ring */}
              <circle cx={startPt.x} cy={startPt.y} r={6} fill="#f59e0b" />
              <circle cx={startPt.x} cy={startPt.y} r={12} fill="none" stroke="#f59e0b" strokeWidth={2} className="target-hole-glow" />
              {/* Floating Lead Cursor Indicator */}
              <circle cx={destPt.x} cy={destPt.y} r={5} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} />
            </g>
          );
        })()}

        {/* Build Mode Status Badge Banner on SVG top */}
        {isBuildMode && (
          <g pointerEvents="none">
            <rect
              x={BB_CONFIG.boardX + 16}
              y={BB_CONFIG.boardY + 36}
              width={BB_CONFIG.boardWidth - 32}
              height={22}
              rx={5}
              fill={pendingWireStart ? 'rgba(245, 158, 11, 0.9)' : targetWire ? 'rgba(8, 145, 178, 0.85)' : 'rgba(16, 185, 129, 0.85)'}
            />
            <text
              x={BB_CONFIG.viewBoxWidth / 2}
              y={BB_CONFIG.boardY + 51}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#ffffff"
              fontFamily="system-ui, sans-serif"
            >
              {buildStatusMessage
                ? buildStatusMessage
                : pendingWireStart
                ? `⚡ Anchor set at Row ${pendingWireStart.row}, Col ${pendingWireStart.col} — Now click destination hole!`
                : targetWire
                ? `👉 Next Connection: Click START (${targetWire.from.col}${targetWire.from.row}) then END (${targetWire.to.col}${targetWire.to.row})`
                : '🎉 All wires connected! Test your circuit with the input switches.'}
            </text>
          </g>
        )}

        {/* 7. Input Switch Modules (Mounted on Left Margin, outside columns A & B) */}
        {config.inputs.map(input => {
          const pt = getHoleCoords(input.boardConnection.row, input.boardConnection.col);
          const swState = circuit.switches[input.id]?.state ?? input.defaultState ?? DigitalSignal.LOW;
          const isHigh = swState === DigitalSignal.HIGH;
          const isHighlighted = highlightComponentId === input.id || (activeStep?.activeInputs && activeStep.activeInputs[input.label] !== undefined);

          // Position switch body cleanly between Left Rails (72) and Column A (122)
          const swWidth = 32;
          const swHeight = 18;
          const swX = 78; // [78, 110], strictly outside Col A (122) and Col B (140)
          const swY = pt.y - swHeight / 2;

          return (
            <g key={input.id}>
              {/* Highlight Aura */}
              {isHighlighted && (
                <rect
                  x={swX - 4}
                  y={swY - 4}
                  width={swWidth + 8}
                  height={swHeight + 8}
                  rx={6}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  className="explain-highlight"
                />
              )}

              {/* Switch Label (A, B, Cin, etc.) displayed clearly above switch body */}
              <text
                x={swX + swWidth / 2}
                y={swY - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                fill="#38bdf8"
                fontFamily="system-ui, sans-serif"
              >
                {input.label}
              </text>

              {/* Clickable Switch Body + Rocker Group (strictly confined to [swX, swX + swWidth]) */}
              <g
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSwitch) onToggleSwitch(input.id);
                  onSelectComponent?.({
                    type: 'Switch',
                    id: input.id,
                    label: `Switch ${input.label}`,
                    details: { state: isHigh ? 1 : 0, input }
                  });
                }}
              >
                {/* Switch Body Housing */}
                <rect
                  x={swX}
                  y={swY}
                  width={swWidth}
                  height={swHeight}
                  rx={4}
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth={1.2}
                  filter="url(#shadow-soft)"
                />

                {/* Rocker Toggle Button */}
                <rect
                  x={isHigh ? swX + swWidth - 15 : swX + 2}
                  y={swY + 2}
                  width={13}
                  height={swHeight - 4}
                  rx={2.5}
                  fill={isHigh ? '#22c55e' : '#64748b'}
                  stroke={isHigh ? '#16a34a' : '#475569'}
                  strokeWidth={1}
                />

                {/* State text on toggle (1 or 0) */}
                <text
                  x={isHigh ? swX + swWidth - 8.5 : swX + 8.5}
                  y={pt.y + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill="#ffffff"
                >
                  {isHigh ? '1' : '0'}
                </text>
              </g>

              {/* Lead connecting switch terminal to breadboard hole */}
              <line
                x1={swX + swWidth}
                y1={pt.y}
                x2={pt.x}
                y2={pt.y}
                stroke={isHigh ? '#ef4444' : '#3b82f6'}
                strokeWidth={2.5}
                pointerEvents="none"
              />
              {/* Terminal pin pad over breadboard hole (Clickable in Build Mode to connect) */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={isHigh ? '#ef4444' : '#3b82f6'}
                stroke="#ffffff"
                strokeWidth={1.5}
                className={isBuildMode ? 'cursor-pointer' : ''}
                onClick={(e) => {
                  if (isBuildMode) {
                    e.stopPropagation();
                    onHoleClick?.({ row: input.boardConnection.row, col: input.boardConnection.col });
                  }
                }}
              />
            </g>
          );
        })}

        {/* 8. Output LED Modules (With Both Positive Anode and Negative Cathode Terminals) */}
        {config.outputs.map(output => {
          const pt = getHoleCoords(output.boardConnection.row, output.boardConnection.col);
          const ledState = circuit.leds[output.id]?.state ?? DigitalSignal.LOW;
          const isLit = ledState === DigitalSignal.HIGH;
          const isHighlighted = highlightComponentId === output.id || activeStep?.title?.toLowerCase().includes('output');
          const ledColor = output.color ?? 'red';

          // Anode (+) terminal at signal breadboard hole (Col I)
          const anodeX = pt.x;
          const anodeY = pt.y;

          // Cathode (-) terminal at Right Negative Ground Rail (R-)
          const cathodeX = BB_CONFIG.railRightMinusX;
          const cathodeY = pt.y;

          // LED 5mm dome centered halfway between Anode pin and Cathode Ground rail
          const ledX = (anodeX + cathodeX) / 2; // 350
          const ledY = pt.y;

          return (
            <g key={output.id}>
              {/* Highlight Aura */}
              {isHighlighted && (
                <circle
                  cx={ledX}
                  cy={ledY}
                  r={18}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  className="explain-highlight"
                />
              )}

              {/* 1. Anode (+) Lead from Signal Hole to LED Dome */}
              <line
                x1={anodeX}
                y1={anodeY}
                x2={ledX - 9}
                y2={ledY}
                stroke={isLit ? (ledColor === 'green' ? '#22c55e' : '#ef4444') : '#94a3b8'}
                strokeWidth={2.5}
                strokeLinecap="round"
                pointerEvents="none"
              />

              {/* Anode (+) Terminal Contact Pad over Breadboard Hole (Clickable in Build Mode) */}
              <circle
                cx={anodeX}
                cy={anodeY}
                r={4.5}
                fill={isLit ? (ledColor === 'green' ? '#22c55e' : '#ef4444') : '#64748b'}
                stroke="#ffffff"
                strokeWidth={1.5}
                className={isBuildMode ? 'cursor-pointer' : ''}
                onClick={(e) => {
                  if (isBuildMode) {
                    e.stopPropagation();
                    onHoleClick?.({ row: output.boardConnection.row, col: output.boardConnection.col });
                  }
                }}
              />
              {/* Anode (+) Polarity Marker Tag */}
              <g pointerEvents="none">
                <rect x={anodeX - 6} y={anodeY - 14} width={12} height={10} rx={2} fill="#0f172a" stroke="#0284c7" strokeWidth={0.8} />
                <text x={anodeX} y={anodeY - 6.5} fontSize="8" fontWeight="bold" fill="#38bdf8" textAnchor="middle">+</text>
              </g>

              {/* 2. Cathode (-) Lead from LED Dome to Ground Rail (R-) */}
              <line
                x1={ledX + 7.5}
                y1={ledY}
                x2={cathodeX}
                y2={cathodeY}
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeLinecap="round"
                pointerEvents="none"
              />

              {/* Cathode (-) Terminal Contact Pad on Ground Rail */}
              <circle
                cx={cathodeX}
                cy={cathodeY}
                r={4.5}
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth={1.5}
                pointerEvents="none"
              />
              {/* Cathode (-) Polarity Marker Tag */}
              <g pointerEvents="none">
                <rect x={cathodeX - 6} y={cathodeY - 14} width={12} height={10} rx={2} fill="#0f172a" stroke="#2563eb" strokeWidth={0.8} />
                <text x={cathodeX} y={cathodeY - 6.5} fontSize="9" fontWeight="bold" fill="#60a5fa" textAnchor="middle">-</text>
              </g>

              {/* Clickable 5mm LED Bulb Assembly */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectComponent?.({
                  type: 'LED',
                  id: output.id,
                  label: `LED ${output.label}`,
                  details: { state: isLit ? 1 : 0, color: ledColor, output }
                })}
              >
                {/* Diffused Outer Glow when Lit */}
                {isLit && (
                  <circle
                    cx={ledX}
                    cy={ledY}
                    r={19}
                    fill={ledColor === 'green' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)'}
                    className={ledColor === 'green' ? 'led-glow-green-on' : 'led-glow-on'}
                  />
                )}

                {/* 5mm LED Plastic Dome with physical flat edge on Cathode (-) side */}
                <path
                  d={`M ${ledX} ${ledY - 9} A 9 9 0 0 0 ${ledX} ${ledY + 9} L ${ledX + 7.5} ${ledY + 8} L ${ledX + 7.5} ${ledY - 8} Z`}
                  fill={
                    isLit
                      ? (ledColor === 'green' ? 'url(#led-glow-green)' : 'url(#led-glow-red)')
                      : (ledColor === 'green' ? '#14532d' : '#7f1d1d')
                  }
                  stroke={isLit ? '#ffffff' : '#334155'}
                  strokeWidth={1.2}
                  filter="url(#shadow-soft)"
                />

                {/* Internal Leadframe Structure: Anode post & Cathode anvil */}
                <line x1={ledX - 7} y1={ledY} x2={ledX - 2} y2={ledY} stroke={isLit ? '#fef08a' : '#94a3b8'} strokeWidth={1} pointerEvents="none" />
                <path d={`M ${ledX + 1} ${ledY - 3} L ${ledX + 5} ${ledY - 2} L ${ledX + 5} ${ledY + 2} L ${ledX + 1} ${ledY + 3} Z`} fill={isLit ? '#fef08a' : '#64748b'} pointerEvents="none" />
                <circle cx={ledX + 1.5} cy={ledY} r={1} fill={isLit ? '#ffffff' : '#475569'} pointerEvents="none" />

                {/* Specular Reflection shine inside dome */}
                <ellipse
                  cx={ledX - 2.5}
                  cy={ledY - 3.5}
                  rx={3}
                  ry={1.8}
                  fill="rgba(255,255,255,0.75)"
                  pointerEvents="none"
                />

                {/* Output Label & Live State Badges in Right Margin */}
                <text
                  x={BB_CONFIG.railRightPlusX + 16}
                  y={ledY - 2}
                  fontSize="11"
                  fontWeight="bold"
                  fill="#f8fafc"
                  fontFamily="system-ui, sans-serif"
                >
                  {output.label}
                </text>
                <text
                  x={BB_CONFIG.railRightPlusX + 16}
                  y={ledY + 10}
                  fontSize="9"
                  fontWeight="900"
                  fill={isLit ? '#22c55e' : '#94a3b8'}
                >
                  {isLit ? 'HIGH (1)' : 'LOW (0)'}
                </text>
                <text
                  x={BB_CONFIG.railRightPlusX + 16}
                  y={ledY + 20}
                  fontSize="7.5"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  +A | -K(GND)
                </text>
              </g>
            </g>
          );
        })}
      </svg>
        </div>
      </div>
    </div>
  );
};
