import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EXPERIMENTS } from '../../experiments/registry';
import { IC_CATALOG } from '../../simulator/ics/definitions';
import {
  ArmedTool,
  LEDColor,
  LoggedTruthRow,
  LogicLevel,
  LogicSample,
  SelectionTarget,
  SupportedICType,
  WorkbenchState,
} from '../../workbench/workbenchTypes';
import { createEmptySeqMemory, simulateWorkbench } from '../../workbench/workbenchEngine';
import {
  computeTwoPinSpan,
  cycleTwoPinOrientation,
  formatTerminalLabel,
  getICPinHole,
  getNodeKey,
  WB_COLS,
} from '../../workbench/workbenchGeometry';
import { evaluatePracticeProgress } from '../../workbench/practiceGuides';
import { WorkbenchCanvas } from './WorkbenchCanvas';

interface CustomWorkbenchProps {
  initialPracticeExpId?: string | null;
  initialPracticeSubId?: string | null;
}

const LIBRARY_ICS: { type: SupportedICType; category: 'gate' | 'seq' }[] = [
  { type: '7408', category: 'gate' },
  { type: '7432', category: 'gate' },
  { type: '7404', category: 'gate' },
  { type: '7400', category: 'gate' },
  { type: '7402', category: 'gate' },
  { type: '7486', category: 'gate' },
  { type: '7410', category: 'gate' },
  { type: '7411', category: 'gate' },
  { type: '7483', category: 'seq' },
  { type: '7474', category: 'seq' },
  { type: '7495', category: 'seq' },
];

const WIRE_PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777', '#eab308'];

function pickWireColor(a: string, b: string, nid: number): string {
  const pair = [a, b];
  if (pair.some(x => x === 'PSU+' || /^R[tb]\+/.test(x))) return '#ef4444';
  if (pair.some(x => x === 'PSUG' || /^R[tb]-/.test(x))) return '#334155';
  if (pair.some(x => x === 'CLK' || x === 'P1' || x === 'P2')) return '#a855f7';
  return WIRE_PALETTE[nid % WIRE_PALETTE.length];
}

function defaultState(): WorkbenchState {
  return {
    psu: true,
    p: [0, 0],
    clkActive: false,
    clkLevel: 0,
    ics: [],
    resistors: [],
    leds: [],
    wires: [],
    nid: 1,
  };
}

export const CustomWorkbench: React.FC<CustomWorkbenchProps> = ({
  initialPracticeExpId = null,
  initialPracticeSubId = null,
}) => {
  const [state, setState] = useState<WorkbenchState>(defaultState);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const seqMemRef = useRef(createEmptySeqMemory());

  const [selection, setSelection] = useState<SelectionTarget | null>(null);
  const [armedTool, setArmedTool] = useState<ArmedTool>(null);
  const [pendingWireStart, setPendingWireStart] = useState<string | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [probeId, setProbeId] = useState<string | null>(null);

  const [pulserLatchMode, setPulserLatchMode] = useState<boolean>(true);
  const [clockHz, setClockHz] = useState<number>(1);
  const [boardDark, setBoardDark] = useState<boolean>(false);
  const [zoomWidth, setZoomWidth] = useState<number | null>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 900 : null
  );

  // Filters & Mobile Tab Organization
  const [libFilter, setLibFilter] = useState<'all' | 'parts' | 'gate' | 'seq'>('all');
  const [sideTab, setSideTab] = useState<'practice' | 'inspector'>('practice');
  const [bottomMobileTab, setBottomMobileTab] = useState<'tt' | 'analyser' | 'status'>('tt');

  // Practice Experiment Selector
  const [practiceExpId, setPracticeExpId] = useState<string>(initialPracticeExpId || 'sandbox');
  const [practiceSubId, setPracticeSubId] = useState<string>(initialPracticeSubId || '');
  const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
  const [showTargetTable, setShowTargetTable] = useState<boolean>(false);

  // Drag ghost state
  const [dragItem, setDragItem] = useState<{
    kind: 'new-ic' | 'move-ic' | 'new-resistor' | 'move-resistor' | 'new-led' | 'move-led';
    icType?: SupportedICType;
    ledColor?: LEDColor;
    id?: number;
  } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  // Logs & Logic Analyser Samples
  const [loggedRows, setLoggedRows] = useState<LoggedTruthRow[]>([]);
  const [samples, setSamples] = useState<LogicSample[]>([]);
  const lastSampleSigRef = useRef<string>('');

  // Sync incoming initial practice props when jumping from Experiments section
  useEffect(() => {
    if (initialPracticeExpId) {
      setPracticeExpId(initialPracticeExpId);
      const exp = EXPERIMENTS.find(e => e.id === initialPracticeExpId);
      if (exp) {
        const sub = exp.subCircuits.find(s => s.id === initialPracticeSubId) || exp.subCircuits[0];
        setPracticeSubId(sub.id);
      }
      setSideTab('practice');
    }
  }, [initialPracticeExpId, initialPracticeSubId]);

  const showFlash = (msg: string) => {
    setFlashMsg(msg);
  };

  useEffect(() => {
    if (!flashMsg) return;
    const t = setTimeout(() => setFlashMsg(null), 4000);
    return () => clearTimeout(t);
  }, [flashMsg]);

  // Helper to push snapshot to undo history
  const pushUndo = (curr: WorkbenchState) => {
    const snap = JSON.stringify({
      ics: curr.ics,
      resistors: curr.resistors,
      leds: curr.leds,
      wires: curr.wires,
      nid: curr.nid,
    });
    setUndoStack(prev => [...prev.slice(-80), snap]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevSnap = undoStack[undoStack.length - 1];
    const currSnap = JSON.stringify({
      ics: state.ics,
      resistors: state.resistors,
      leds: state.leds,
      wires: state.wires,
      nid: state.nid,
    });
    setRedoStack(r => [...r, currSnap]);
    setUndoStack(u => u.slice(0, -1));
    setState(s => ({ ...s, ...JSON.parse(prevSnap) }));
    setSelection(null);
    setPendingWireStart(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnap = redoStack[redoStack.length - 1];
    const currSnap = JSON.stringify({
      ics: state.ics,
      resistors: state.resistors,
      leds: state.leds,
      wires: state.wires,
      nid: state.nid,
    });
    setUndoStack(u => [...u, currSnap]);
    setRedoStack(r => r.slice(0, -1));
    setState(s => ({ ...s, ...JSON.parse(nextSnap) }));
    setSelection(null);
    setPendingWireStart(null);
  };

  // Continuous Square-Wave Pulse Generator Timer
  useEffect(() => {
    if (!state.clkActive || !state.psu) return;
    const intervalMs = Math.round(500 / clockHz); // half-period
    const timer = setInterval(() => {
      setState(s => ({ ...s, clkLevel: s.clkLevel === 1 ? 0 : 1 }));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [state.clkActive, state.psu, clockHz]);

  // Keep drag ghost tracking globally and clean up if dropped outside SVG
  useEffect(() => {
    if (!dragItem) return;
    const onMove = (e: PointerEvent) => setGhostPos({ x: e.clientX, y: e.clientY });
    const onUp = () => {
      setDragItem(null);
      setGhostPos(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragItem]);

  // Run simulation synchronously when state updates
  const sim = useMemo(() => {
    return simulateWorkbench(state, seqMemRef.current);
  }, [state]);

  // Record waveform samples whenever active channel levels change
  useEffect(() => {
    const allChannels = [...sim.activeInputs, ...sim.activeOutputs];
    if (allChannels.length === 0) return;
    const sig = allChannels.map(ch => `${ch.id}:${ch.value}`).join('|') + `|${state.psu}`;
    if (sig !== lastSampleSigRef.current) {
      lastSampleSigRef.current = sig;
      const map: Record<string, LogicLevel> = {};
      for (const ch of allChannels) map[ch.id] = ch.value;
      setSamples(prev => [...prev.slice(-39), { timestamp: Date.now(), channels: map }]);
    }
  }, [sim, state.psu]);

  // Occupied IC holes set (row e & f holes under IC pins)
  const getOccupiedICHoles = (excludeIcId?: number) => {
    const occ = new Set<string>();
    for (const ic of state.ics) {
      if (ic.id === excludeIcId) continue;
      for (let p = 1; p <= ic.pinCount; p++) {
        occ.add(getICPinHole(ic, p));
      }
    }
    return occ;
  };

  const canPlaceIC = (col: number, pinCount: 14 | 16, excludeId?: number): boolean => {
    const half = pinCount / 2;
    if (col < 0 || col + half > WB_COLS) {
      showFlash(`IC must fit cleanly within columns 1–${WB_COLS}.`);
      return false;
    }
    const overlap = state.ics.some(other => {
      if (other.id === excludeId) return false;
      const otherHalf = other.pinCount / 2;
      return !(col + half <= other.col || col >= other.col + otherHalf);
    });
    if (overlap) {
      showFlash('IC overlaps another IC on the center trough.');
      return false;
    }
    const targetHoles = new Set<string>();
    for (let p = 1; p <= pinCount; p++) {
      targetHoles.add(getICPinHole({ col, pinCount }, p));
    }
    if (state.wires.some(w => targetHoles.has(w.a) || targetHoles.has(w.b))) {
      showFlash('Move or remove wires plugged into those e/f holes before placing an IC there.');
      return false;
    }
    return true;
  };

  // Wire placement
  const handleCompleteWire = (a: string, b: string) => {
    setPendingWireStart(null);
    if (a === b) return;
    if (state.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) {
      showFlash('A jumper wire already connects those exact two holes.');
      return;
    }
    const occ = getOccupiedICHoles();
    if (occ.has(a) || occ.has(b)) {
      showFlash('That hole is under an IC pin; connect to open holes (a–d or g–j) in that column strip.');
      return;
    }

    pushUndo(state);
    const id = state.nid;
    const color = pickWireColor(a, b, id);
    setState(s => ({
      ...s,
      nid: s.nid + 1,
      wires: [...s.wires, { id, a, b, color }],
    }));
    setSelection({ kind: 'wire', id });
  };

  // Drop or tap placement on breadboard
  const handleDropOnBoard = (holeId: string | null, colGuess: number, _svgX: number, svgY: number) => {
    const tool = dragItem
      ? dragItem.kind === 'new-ic'
        ? ({ kind: 'ic', type: dragItem.icType! } as ArmedTool)
        : dragItem.kind === 'new-resistor'
        ? ({ kind: 'resistor' } as ArmedTool)
        : dragItem.kind === 'new-led'
        ? ({ kind: 'led', color: dragItem.ledColor! } as ArmedTool)
        : null
      : armedTool;

    // Moving an existing placed IC
    if (dragItem?.kind === 'move-ic' && dragItem.id !== undefined) {
      const existing = state.ics.find(i => i.id === dragItem.id);
      if (existing) {
        const half = existing.pinCount / 2;
        const targetCol = Math.max(0, Math.min(WB_COLS - half, colGuess - Math.floor(half / 2)));
        if (targetCol !== existing.col && canPlaceIC(targetCol, existing.pinCount, existing.id)) {
          pushUndo(state);
          setState(s => ({
            ...s,
            ics: s.ics.map(i => (i.id === existing.id ? { ...i, col: targetCol } : i)),
          }));
        }
      }
      setDragItem(null);
      setGhostPos(null);
      return;
    }

    // Moving an existing Resistor
    if (dragItem?.kind === 'move-resistor' && dragItem.id !== undefined && holeId && !holeId.startsWith('P')) {
      const existing = state.resistors.find(r => r.id === dragItem.id);
      if (existing) {
        const span = computeTwoPinSpan(holeId, 3);
        const occ = getOccupiedICHoles();
        if (!occ.has(span.a) && !occ.has(span.b)) {
          pushUndo(state);
          setState(s => ({
            ...s,
            resistors: s.resistors.map(r => (r.id === existing.id ? { ...r, a: span.a, b: span.b } : r)),
          }));
        }
      }
      setDragItem(null);
      setGhostPos(null);
      return;
    }

    // Moving an existing LED
    if (dragItem?.kind === 'move-led' && dragItem.id !== undefined && holeId && !holeId.startsWith('P')) {
      const existing = state.leds.find(l => l.id === dragItem.id);
      if (existing) {
        const span = computeTwoPinSpan(holeId, 2);
        const occ = getOccupiedICHoles();
        if (!occ.has(span.a) && !occ.has(span.b)) {
          pushUndo(state);
          setState(s => ({
            ...s,
            leds: s.leds.map(l =>
              l.id === existing.id ? { ...l, anode: span.a, cathode: span.b } : l
            ),
          }));
        }
      }
      setDragItem(null);
      setGhostPos(null);
      return;
    }

    setDragItem(null);
    setGhostPos(null);

    if (!tool) return;

    if (tool.kind === 'ic') {
      const def = IC_CATALOG[tool.type];
      const pinCount = (def?.pinCount === 16 ? 16 : 14) as 14 | 16;
      const half = pinCount / 2;
      const col = Math.max(0, Math.min(WB_COLS - half, colGuess - Math.floor(half / 2)));
      if (canPlaceIC(col, pinCount)) {
        pushUndo(state);
        const id = state.nid;
        setState(s => ({
          ...s,
          nid: s.nid + 1,
          ics: [...s.ics, { id, type: tool.type, col, pinCount }],
        }));
        setSelection({ kind: 'ic', id });
        setSideTab('inspector');
      }
      setArmedTool(null);
      return;
    }

    if (tool.kind === 'resistor') {
      const anchor = holeId && !holeId.startsWith('P') && holeId !== 'CLK'
        ? holeId
        : `B${Math.max(0, Math.min(WB_COLS - 4, colGuess))}${svgY < 280 ? 'c' : 'h'}`.replace(/^B(\d+c)/, 'T$1');
      const span = computeTwoPinSpan(anchor, 3);
      const occ = getOccupiedICHoles();
      if (occ.has(span.a) || occ.has(span.b)) {
        showFlash('Cannot place resistor directly into an IC pin e/f hole; choose open rows.');
        return;
      }
      pushUndo(state);
      const id = state.nid;
      setState(s => ({
        ...s,
        nid: s.nid + 1,
        resistors: [...s.resistors, { id, a: span.a, b: span.b, ohms: 330 }],
      }));
      setSelection({ kind: 'resistor', id });
      setArmedTool(null);
      return;
    }

    if (tool.kind === 'led') {
      const anchor = holeId && !holeId.startsWith('P') && holeId !== 'CLK'
        ? holeId
        : `B${Math.max(0, Math.min(WB_COLS - 3, colGuess))}${svgY < 280 ? 'c' : 'i'}`.replace(/^B(\d+c)/, 'T$1');
      const span = computeTwoPinSpan(anchor, 2);
      const occ = getOccupiedICHoles();
      if (occ.has(span.a) || occ.has(span.b)) {
        showFlash('Cannot place LED legs directly into occupied IC holes; choose rows a–d or g–j.');
        return;
      }
      pushUndo(state);
      const id = state.nid;
      setState(s => ({
        ...s,
        nid: s.nid + 1,
        leds: [
          ...s.leds,
          { id, anode: span.a, cathode: span.b, color: tool.color, label: `LED${s.leds.length + 1}` },
        ],
      }));
      setSelection({ kind: 'led', id });
      setArmedTool(null);
      return;
    }
  };

  // Delete currently selected component
  const handleDeleteSelected = () => {
    if (!selection) return;
    pushUndo(state);
    setState(s => ({
      ...s,
      ics: selection.kind === 'ic' ? s.ics.filter(i => i.id !== selection.id) : s.ics,
      resistors: selection.kind === 'resistor' ? s.resistors.filter(r => r.id !== selection.id) : s.resistors,
      leds: selection.kind === 'led' ? s.leds.filter(l => l.id !== selection.id) : s.leds,
      wires: selection.kind === 'wire' ? s.wires.filter(w => w.id !== selection.id) : s.wires,
    }));
    setSelection(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setPendingWireStart(null);
        setArmedTool(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Nudge selected IC horizontally
  const handleNudge = (delta: -1 | 1) => {
    if (!selection) {
      showFlash('Select an IC, LED, or Resistor first to nudge left/right.');
      return;
    }
    if (selection.kind === 'ic') {
      const ic = state.ics.find(i => i.id === selection.id);
      if (!ic) return;
      if (canPlaceIC(ic.col + delta, ic.pinCount, ic.id)) {
        pushUndo(state);
        setState(s => ({
          ...s,
          ics: s.ics.map(i => (i.id === ic.id ? { ...i, col: i.col + delta } : i)),
        }));
      }
    }
  };

  // Rotate selected LED or Resistor
  const handleRotateSelected = () => {
    if (!selection) return;
    if (selection.kind === 'resistor') {
      const res = state.resistors.find(r => r.id === selection.id);
      if (!res) return;
      const next = cycleTwoPinOrientation(res.a, res.b, 3);
      pushUndo(state);
      setState(s => ({
        ...s,
        resistors: s.resistors.map(r => (r.id === res.id ? { ...r, a: next.a, b: next.b } : r)),
      }));
    } else if (selection.kind === 'led') {
      const led = state.leds.find(l => l.id === selection.id);
      if (!led) return;
      const next = cycleTwoPinOrientation(led.anode, led.cathode, 2);
      pushUndo(state);
      setState(s => ({
        ...s,
        leds: s.leds.map(l => (l.id === led.id ? { ...l, anode: next.a, cathode: next.b } : l)),
      }));
    }
  };

  // Quick-flip selected rail wire between + rail and - rail!
  const selectedWire = selection?.kind === 'wire' ? state.wires.find(w => w.id === selection.id) : null;
  const isSelectedRailWire = Boolean(
    selectedWire && (/^R[tb][+-]:/.test(selectedWire.a) || /^R[tb][+-]:/.test(selectedWire.b))
  );

  const handleFlipRailWire = () => {
    if (!selectedWire) return;
    const flipTerminal = (t: string) => {
      const m = t.match(/^R([tb])([+-]):(\d+)$/);
      if (!m) return t;
      return `R${m[1]}${m[2] === '+' ? '-' : '+'}:${m[3]}`;
    };
    const nextA = flipTerminal(selectedWire.a);
    const nextB = flipTerminal(selectedWire.b);
    if (nextA === selectedWire.a && nextB === selectedWire.b) return;
    pushUndo(state);
    const nextColor = pickWireColor(nextA, nextB, selectedWire.id);
    setState(s => ({
      ...s,
      wires: s.wires.map(w => (w.id === selectedWire.id ? { ...w, a: nextA, b: nextB, color: nextColor } : w)),
    }));
  };

  // Practice Guide calculation
  const selectedExpObj = useMemo(
    () => (practiceExpId !== 'sandbox' ? EXPERIMENTS.find(e => e.id === practiceExpId) || null : null),
    [practiceExpId]
  );

  const practiceEval = useMemo(() => {
    if (practiceExpId === 'sandbox') return null;
    return evaluatePracticeProgress(practiceExpId, practiceSubId, state, sim);
  }, [practiceExpId, practiceSubId, state, sim]);

  // Format terminal probe readout
  const probeReadout = useMemo(() => {
    if (!probeId) return 'Hover or tap any hole / terminal to probe signal';
    const val = sim.getTerminalValue(probeId);
    const nodeKey = getNodeKey(probeId);
    let icPinNote = '';
    for (let i = 0; i < state.ics.length; i++) {
      const ic = state.ics[i];
      const def = IC_CATALOG[ic.type];
      if (!def) continue;
      for (let p = 1; p <= ic.pinCount; p++) {
        if (getNodeKey(getICPinHole(ic, p)) === nodeKey) {
          icPinNote = ` · IC${i + 1} (${ic.type}) Pin ${p} [${def.pinLabels[p]}]`;
        }
      }
    }
    const levelLabel =
      val === 1 ? 'HIGH (1)' : val === 0 ? 'LOW (0)' : val === 'C' ? 'CONTENTION' : 'Floating (X)';
    return `${formatTerminalLabel(probeId)}${icPinNote} → ${levelLabel}`;
  }, [probeId, sim, state.ics]);

  // Selected items for Inspector
  const selectedIC = selection?.kind === 'ic' ? state.ics.find(i => i.id === selection.id) || null : null;
  const selectedLED = selection?.kind === 'led' ? state.leds.find(l => l.id === selection.id) || null : null;
  const selectedRes = selection?.kind === 'resistor' ? state.resistors.find(r => r.id === selection.id) || null : null;

  // Filtered ICs
  const filteredICs = LIBRARY_ICS.filter(item => {
    if (libFilter === 'parts') return false;
    if (libFilter === 'all') return true;
    return item.category === libFilter;
  });

  // Log Truth Table row
  const handleLogTruthRow = () => {
    if (sim.activeInputs.length === 0 && sim.activeOutputs.length === 0) {
      showFlash('Wire power/inputs and place at least one LED before logging a truth table row.');
      return;
    }
    setLoggedRows(prev => [
      ...prev,
      {
        id: Date.now(),
        inputs: sim.activeInputs.map(i => ({ label: i.label, value: i.value })),
        outputs: sim.activeOutputs.map(o => ({ label: o.label, value: o.value })),
      },
    ]);
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-2.5 sm:px-5 py-3 sm:py-4 flex flex-col gap-3">
      {/* 1. COMPACT WORKBENCH TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:px-3.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500/50 disabled:opacity-40 text-xs font-medium text-slate-200"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500/50 disabled:opacity-40 text-xs font-medium text-slate-200"
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={!selection}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:text-red-300 disabled:opacity-40 text-xs font-medium text-slate-200"
            title="Delete selected item (Del)"
          >
            🗑 Delete
          </button>

          {selectedIC && (
            <>
              <button
                onClick={() => handleNudge(-1)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                title="Move IC Left"
              >
                ◀
              </button>
              <button
                onClick={() => handleNudge(1)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                title="Move IC Right"
              >
                ▶
              </button>
            </>
          )}

          {(selectedLED || selectedRes) && (
            <button
              onClick={handleRotateSelected}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-semibold text-amber-300"
              title="Rotate / Change Span Orientation"
            >
              ↻ Rotate
            </button>
          )}

          {isSelectedRailWire && (
            <button
              onClick={handleFlipRailWire}
              className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/50 hover:bg-sky-500/30 text-xs font-bold text-sky-300 animate-pulse"
              title="Swap wire end between + rail (1) and − rail (0)"
            >
              ⚡ Flip +/− Rail
            </button>
          )}
        </div>

        {/* Clock Generator, Pulser Mode & Board Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setPulserLatchMode(m => !m)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-[11px] sm:text-xs font-medium text-violet-300"
            title="Toggle P1/P2 behavior between Latching Toggle and Momentary Pulse"
          >
            P1/P2: <strong>{pulserLatchMode ? 'Toggle' : 'Pulse'}</strong>
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 gap-1">
            <button
              onClick={() => setState(s => ({ ...s, clkActive: !s.clkActive }))}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                state.clkActive
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {state.clkActive ? '⏸ CLK Run' : '▶ Auto CLK'}
            </button>
            <select
              value={clockHz}
              onChange={e => setClockHz(Number(e.target.value))}
              className="bg-transparent text-[11px] text-slate-300 font-mono px-1 outline-none cursor-pointer"
            >
              <option value={0.5} className="bg-slate-900">0.5 Hz</option>
              <option value={1} className="bg-slate-900">1 Hz</option>
              <option value={2} className="bg-slate-900">2 Hz</option>
            </select>
          </div>

          <button
            onClick={() => setBoardDark(d => !d)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs text-slate-300"
          >
            {boardDark ? '☀ Light Board' : '🌙 Dark Board'}
          </button>

          <button
            onClick={() => {
              pushUndo(state);
              seqMemRef.current = createEmptySeqMemory();
              setState(s => ({ ...defaultState(), psu: s.psu }));
              setSelection(null);
              setPendingWireStart(null);
              setLoggedRows([]);
              setSamples([]);
              lastSampleSigRef.current = '';
              showFlash('Breadboard cleared.');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/40 text-xs text-slate-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Feedback Banner (Armed Tool / Pending Wire / Validation) */}
      {(armedTool || pendingWireStart || flashMsg) && (
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-sky-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
            <span>
              {armedTool
                ? armedTool.kind === 'ic'
                  ? `Tap anywhere on the breadboard center trench to place IC ${armedTool.type}.`
                  : armedTool.kind === 'resistor'
                  ? 'Tap any breadboard hole to place a 330Ω Resistor.'
                  : `Tap any breadboard hole to place a ${armedTool.color.toUpperCase()} LED.`
                : pendingWireStart
                ? `Wire anchor at ${formatTerminalLabel(pendingWireStart)}. Now tap destination hole.`
                : flashMsg}
            </span>
          </div>
          {(armedTool || pendingWireStart) && (
            <button
              onClick={() => {
                setArmedTool(null);
                setPendingWireStart(null);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* 2. MAIN WORKSPACE GRID: Palette | Breadboard | Practice & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT: COMPONENT LIBRARY PALETTE */}
        <aside className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Component Library
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1 text-[10px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'parts', label: 'LED / R' },
              { id: 'gate', label: 'Gates' },
              { id: 'seq', label: 'FF / MSI' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setLibFilter(f.id as any)}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  libFilter === f.id
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 hidden lg:block">
            Drag onto breadboard (or click to arm &amp; tap board).
          </p>

          {/* Horizontal Strip on Mobile, Vertical Scroll List on Desktop */}
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[480px] pb-1 lg:pb-0 no-scrollbar">
            {/* Passive & Output Parts */}
            {(libFilter === 'all' || libFilter === 'parts') && (
              <>
                <button
                  onPointerDown={e => {
                    if (e.pointerType === 'mouse') {
                      e.preventDefault();
                      setDragItem({ kind: 'new-resistor' });
                      setGhostPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onClick={() =>
                    setArmedTool(prev => (prev?.kind === 'resistor' ? null : { kind: 'resistor' }))
                  }
                  className={`shrink-0 lg:w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    armedTool?.kind === 'resistor'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-mono text-amber-300">330Ω Resistor</div>
                    <div className="text-[10px] text-slate-400">Current limiter</div>
                  </div>
                  <span className="w-5 h-2 rounded-sm bg-[#e7c697] border border-amber-800 shrink-0" />
                </button>

                {(['red', 'green', 'amber'] as LEDColor[]).map(color => {
                  const isArmed = armedTool?.kind === 'led' && armedTool.color === color;
                  const dotCol =
                    color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-emerald-500' : 'bg-amber-500';
                  return (
                    <button
                      key={`led-lib-${color}`}
                      onPointerDown={e => {
                        if (e.pointerType === 'mouse') {
                          e.preventDefault();
                          setDragItem({ kind: 'new-led', ledColor: color });
                          setGhostPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onClick={() =>
                        setArmedTool(prev =>
                          prev?.kind === 'led' && prev.color === color ? null : { kind: 'led', color }
                        )
                      }
                      className={`shrink-0 lg:w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                        isArmed
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold capitalize">{color} LED</div>
                        <div className="text-[10px] text-slate-400">Anode(+) / Cathode(−)</div>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full ${dotCol} shadow-sm shrink-0`} />
                    </button>
                  );
                })}
              </>
            )}

            {/* All 11 Lab ICs */}
            {filteredICs.map(({ type }) => {
              const def = IC_CATALOG[type];
              if (!def) return null;
              const isArmed = armedTool?.kind === 'ic' && armedTool.type === type;
              return (
                <button
                  key={type}
                  onPointerDown={e => {
                    if (e.pointerType === 'mouse') {
                      e.preventDefault();
                      setDragItem({ kind: 'new-ic', icType: type });
                      setGhostPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onClick={() =>
                    setArmedTool(prev => (prev?.kind === 'ic' && prev.type === type ? null : { kind: 'ic', type }))
                  }
                  className={`shrink-0 lg:w-full text-left p-2 rounded-lg border transition-all ${
                    isArmed
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold font-mono text-sky-300">IC {def.partNumber}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {def.packageType}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px] lg:max-w-none">
                    {def.name}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER: HORIZONTAL BREADBOARD WORKBENCH CANVAS */}
        <section className="lg:col-span-7 flex flex-col gap-2 min-w-0">
          {/* Canvas Top Bar: Zoom + Probe Readout */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomWidth(w => Math.max(580, Math.round((w || 900) / 1.2)))}
                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 font-bold text-slate-200"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => setZoomWidth(null)}
                className="px-2.5 h-7 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[11px] font-medium text-slate-300"
                title="Fit Width"
              >
                Fit
              </button>
              <button
                onClick={() => setZoomWidth(w => Math.min(2200, Math.round((w || 900) * 1.25)))}
                className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 font-bold text-slate-200"
                title="Zoom In"
              >
                +
              </button>
            </div>

            <div className="font-mono text-[11px] text-sky-300 truncate max-w-full">
              {probeReadout}
            </div>
          </div>

          <WorkbenchCanvas
            state={state}
            sim={sim}
            selection={selection}
            armedTool={armedTool}
            pendingWireStart={pendingWireStart}
            dragPreview={dragItem}
            onStartWire={id => setPendingWireStart(id)}
            onCompleteWire={handleCompleteWire}
            onCancelPendingWire={() => setPendingWireStart(null)}
            onProbe={id => setProbeId(id)}
            onSelect={sel => {
              setSelection(sel);
              if (sel) setSideTab('inspector');
            }}
            onTogglePSU={() => setState(s => ({ ...s, psu: !s.psu }))}
            onPulserDown={idx => {
              setState(s => {
                const nextP: [0 | 1, 0 | 1] = [...s.p] as [0 | 1, 0 | 1];
                nextP[idx] = pulserLatchMode ? (nextP[idx] === 1 ? 0 : 1) : 1;
                return { ...s, p: nextP };
              });
            }}
            onPulserUp={idx => {
              if (!pulserLatchMode) {
                setState(s => {
                  const nextP: [0 | 1, 0 | 1] = [...s.p] as [0 | 1, 0 | 1];
                  nextP[idx] = 0;
                  return { ...s, p: nextP };
                });
              }
            }}
            onStepClock={() => {
              setState(s => ({ ...s, clkActive: false, clkLevel: s.clkLevel === 1 ? 0 : 1 }));
            }}
            onDropOnBoard={handleDropOnBoard}
            onBeginDragExisting={(item, cx, cy) => {
              setDragItem(item);
              setGhostPos({ x: cx, y: cy });
            }}
            onUpdateDragCursor={(cx, cy) => setGhostPos({ x: cx, y: cy })}
            pulserLatchMode={pulserLatchMode}
            boardDark={boardDark}
            zoomWidth={zoomWidth}
          />

          <p className="text-[11px] text-slate-400 px-1">
            Tip: Wire <strong>+5V &amp; GND</strong> to the Top/Bottom power rails. Take HIGH (1) / LOW (0) inputs directly from those <strong>+ / −</strong> rails (or <strong>P1 / P2 / CLK</strong>) and view outputs on placed <strong>LEDs</strong> with <strong>330Ω resistors</strong>.
          </p>
        </section>

        {/* RIGHT: PRACTICE GUIDE & COMPONENT INSPECTOR SIDEBAR */}
        <aside className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
          {/* Sidebar Mode Switch */}
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
            <button
              onClick={() => setSideTab('practice')}
              className={`py-2.5 px-3 transition-colors border-b-2 ${
                sideTab === 'practice'
                  ? 'border-sky-400 text-sky-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🎯 Experiment Practice
            </button>
            <button
              onClick={() => setSideTab('inspector')}
              className={`py-2.5 px-3 transition-colors border-b-2 ${
                sideTab === 'inspector'
                  ? 'border-amber-400 text-amber-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🔍 Pinout &amp; Inspector
            </button>
          </div>

          <div className="p-3.5 space-y-3 max-h-[540px] overflow-y-auto text-xs">
            {/* TAB A: PRACTICE EXPERIMENT GUIDE */}
            {sideTab === 'practice' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Select Experiment to Practice
                  </label>
                  <select
                    value={practiceExpId}
                    onChange={e => {
                      const id = e.target.value;
                      setPracticeExpId(id);
                      setExpandedHintId(null);
                      const exp = EXPERIMENTS.find(ex => ex.id === id);
                      if (exp) setPracticeSubId(exp.subCircuits[0].id);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-200 outline-none"
                  >
                    <option value="sandbox">Free Build (Open Sandbox)</option>
                    {EXPERIMENTS.map(exp => (
                      <option key={exp.id} value={exp.id}>
                        Exp {exp.experimentNumber}: {exp.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedExpObj && selectedExpObj.subCircuits.length > 1 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Circuit Variant
                    </label>
                    <select
                      value={practiceSubId}
                      onChange={e => {
                        setPracticeSubId(e.target.value);
                        setExpandedHintId(null);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-300 outline-none"
                    >
                      {selectedExpObj.subCircuits.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!practiceEval ? (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2 text-slate-300 leading-relaxed">
                    <div className="font-bold text-sky-300">Open Breadboard Sandbox</div>
                    <p className="text-[11px] text-slate-400">
                      Build any digital circuit freely! Pick an Experiment above anytime if you want milestone verification and optional hints while wiring it yourself.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="font-bold text-slate-100">{practiceEval.subCircuit.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{practiceEval.subCircuit.description}</div>
                    </div>

                    {/* Step-by-Step Build Milestones (User builds it!) */}
                    <div className="space-y-2">
                      {practiceEval.milestones.map(m => {
                        const isHintOpen = expandedHintId === m.id;
                        return (
                          <div
                            key={m.id}
                            className={`rounded-lg border p-2.5 transition-colors ${
                              m.completed
                                ? 'bg-emerald-950/30 border-emerald-500/40'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span
                                  className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    m.completed
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {m.completed ? '✓' : '•'}
                                </span>
                                <div>
                                  <div className={`font-semibold ${m.completed ? 'text-emerald-300' : 'text-slate-200'}`}>
                                    {m.title}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{m.detail}</p>
                                </div>
                              </div>
                            </div>

                            {m.hint && (
                              <div className="mt-1.5 pl-6">
                                <button
                                  onClick={() => setExpandedHintId(isHintOpen ? null : m.id)}
                                  className="text-[10px] font-semibold text-sky-400 hover:text-sky-300"
                                >
                                  {isHintOpen ? 'Hide Hint ▲' : 'Need a Hint? ▼'}
                                </button>
                                {isHintOpen && (
                                  <div className="mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-[10.5px] text-slate-300 whitespace-pre-line leading-relaxed">
                                    {m.hint}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {practiceEval.allReadyToVerify && (
                      <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-lg p-2.5 text-[11px] text-emerald-200">
                        ✅ Circuit powered &amp; connected! Toggle your rail inputs / pulsers and use <strong>Log Row</strong> below to verify all truth table states.
                      </div>
                    )}

                    {/* Optional Reference Target Truth Table */}
                    <div className="border-t border-slate-800 pt-2">
                      <button
                        onClick={() => setShowTargetTable(v => !v)}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center justify-between"
                      >
                        <span>Reference Target Truth Table</span>
                        <span>{showTargetTable ? '▲' : '▼'}</span>
                      </button>

                      {showTargetTable && (
                        <div className="mt-2 overflow-x-auto max-h-48 rounded-lg border border-slate-800">
                          <table className="w-full text-[10px] font-mono text-center border-collapse">
                            <thead className="bg-slate-950 text-sky-400">
                              <tr>
                                {practiceEval.subCircuit.inputs.map(i => (
                                  <th key={i.id} className="p-1 border-b border-slate-800">{i.label}</th>
                                ))}
                                {practiceEval.subCircuit.outputs.map(o => (
                                  <th key={o.id} className="p-1 border-b border-slate-800 text-emerald-400">{o.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {practiceEval.subCircuit.truthTable.map((row, idx) => (
                                <tr key={idx} className="bg-slate-950/40">
                                  {practiceEval.subCircuit.inputs.map(i => (
                                    <td key={i.id} className="p-1 text-slate-300">
                                      {row.inputs[i.label] ?? '-'}
                                    </td>
                                  ))}
                                  {practiceEval.subCircuit.outputs.map(o => (
                                    <td key={o.id} className="p-1 text-emerald-300 font-bold">
                                      {row.outputs[o.label] ?? '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB B: COMPONENT PINOUT & LIVE INSPECTOR */}
            {sideTab === 'inspector' && (
              <div className="space-y-3">
                {selectedIC ? (() => {
                  const def = IC_CATALOG[selectedIC.type];
                  const powered = sim.icPowered[selectedIC.id];
                  const half = selectedIC.pinCount / 2;
                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold font-mono text-sky-300">IC {def.partNumber}</div>
                          <div className="text-[11px] text-slate-400">{def.name}</div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            powered
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {powered ? 'Powered ✓' : 'Unpowered'}
                        </span>
                      </div>

                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                        Pinout (Notch Left · Top View)
                      </div>
                      <table className="w-full text-[10.5px] font-mono border-collapse border border-slate-800 rounded">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400">
                            <th className="p-1 border border-slate-800">Top Pin</th>
                            <th className="p-1 border border-slate-800">Lvl</th>
                            <th className="p-1 border border-slate-800">Lvl</th>
                            <th className="p-1 border border-slate-800">Bot Pin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: half }, (_, idx) => {
                            const botPin = idx + 1;
                            const topPin = selectedIC.pinCount - idx;
                            const botVal = sim.getTerminalValue(getICPinHole(selectedIC, botPin));
                            const topVal = sim.getTerminalValue(getICPinHole(selectedIC, topPin));
                            return (
                              <tr key={idx} className="bg-slate-950/40">
                                <td className="p-1 border border-slate-800 text-slate-300">
                                  P{topPin} {def.pinLabels[topPin]}
                                </td>
                                <td className={`p-1 border border-slate-800 text-center font-bold ${topVal === 1 ? 'text-red-400' : topVal === 0 ? 'text-sky-400' : 'text-slate-500'}`}>
                                  {topVal}
                                </td>
                                <td className={`p-1 border border-slate-800 text-center font-bold ${botVal === 1 ? 'text-red-400' : botVal === 0 ? 'text-sky-400' : 'text-slate-500'}`}>
                                  {botVal}
                                </td>
                                <td className="p-1 border border-slate-800 text-slate-300">
                                  P{botPin} {def.pinLabels[botPin]}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })() : selectedLED ? (() => {
                  const st = sim.ledStates[selectedLED.id];
                  return (
                    <div className="space-y-3">
                      <div className="font-bold text-sm text-slate-100">LED Inspector</div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Custom Output Label</label>
                        <input
                          type="text"
                          value={selectedLED.label || ''}
                          placeholder="e.g. Sum, Carry, Y"
                          onChange={e => {
                            const val = e.target.value;
                            setState(s => ({
                              ...s,
                              leds: s.leds.map(l => (l.id === selectedLED.id ? { ...l, label: val } : l)),
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 outline-none"
                        />
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                        <div>Anode (+): {formatTerminalLabel(selectedLED.anode)} = <strong className="text-red-300">{String(st?.anodeVal)}</strong></div>
                        <div>Cathode (−): {formatTerminalLabel(selectedLED.cathode)} = <strong className="text-sky-300">{String(st?.cathodeVal)}</strong></div>
                        <div>State: <strong className={st?.lit ? 'text-emerald-400' : 'text-slate-400'}>{st?.lit ? 'LIT (1)' : 'OFF (0)'}</strong></div>
                      </div>
                      <button
                        onClick={handleRotateSelected}
                        className="w-full py-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold"
                      >
                        ↻ Rotate / Flip LED Orientation
                      </button>
                    </div>
                  );
                })() : selectedRes ? (
                  <div className="space-y-2.5">
                    <div className="font-bold text-sm text-amber-300">330Ω Carbon Film Resistor</div>
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                      <div>Terminal A: {formatTerminalLabel(selectedRes.a)} ({String(sim.getTerminalValue(selectedRes.a))})</div>
                      <div>Terminal B: {formatTerminalLabel(selectedRes.b)} ({String(sim.getTerminalValue(selectedRes.b))})</div>
                    </div>
                    <button
                      onClick={handleRotateSelected}
                      className="w-full py-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold"
                    >
                      ↻ Rotate Resistor Span
                    </button>
                  </div>
                ) : selectedWire ? (
                  <div className="space-y-2.5">
                    <div className="font-bold text-sm text-sky-300">Jumper Wire #{selectedWire.id}</div>
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                      <div>From: {formatTerminalLabel(selectedWire.a)}</div>
                      <div>To: {formatTerminalLabel(selectedWire.b)}</div>
                      <div>Signal: <strong>{String(sim.getTerminalValue(selectedWire.a))}</strong></div>
                    </div>
                    {isSelectedRailWire && (
                      <button
                        onClick={handleFlipRailWire}
                        className="w-full py-1.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold"
                      >
                        ⚡ Swap + Rail (1) ↔ − Rail (0)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 space-y-2">
                    <p>Click any IC, LED, 330Ω Resistor, or Wire on the breadboard to inspect its pins and controls.</p>
                    <p className="text-[11px] text-slate-500">
                      Supply: <strong>{state.psu ? 'ON (+5V)' : 'OFF'}</strong> · ICs: {state.ics.length} · LEDs: {state.leds.length} · Resistors: {state.resistors.length} · Wires: {state.wires.length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM ANALYTICS PANELS: Truth Table Log | Logic Analyser | Errors & Status */}
      {/* Mobile Bottom Section Tabs */}
      <div className="grid grid-cols-3 lg:hidden bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
        <button
          onClick={() => setBottomMobileTab('tt')}
          className={`py-2 rounded-lg ${bottomMobileTab === 'tt' ? 'bg-slate-800 text-sky-300' : 'text-slate-400'}`}
        >
          📋 Truth Log ({loggedRows.length})
        </button>
        <button
          onClick={() => setBottomMobileTab('analyser')}
          className={`py-2 rounded-lg ${bottomMobileTab === 'analyser' ? 'bg-slate-800 text-emerald-300' : 'text-slate-400'}`}
        >
          📈 Analyser
        </button>
        <button
          onClick={() => setBottomMobileTab('status')}
          className={`py-2 rounded-lg ${bottomMobileTab === 'status' ? 'bg-slate-800 text-amber-300' : 'text-slate-400'}`}
        >
          ⚠ Status ({sim.messages.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Panel 1: Truth Table Log */}
        <div
          className={`bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5 ${
            bottomMobileTab === 'tt' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Truth Table Log
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleLogTruthRow}
                className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold"
              >
                + Log Row
              </button>
              {loggedRows.length > 0 && (
                <button
                  onClick={() => setLoggedRows([])}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loggedRows.length === 0 ? (
            <div className="text-[11px] text-slate-400 bg-slate-950/50 rounded-lg p-3 border border-slate-800/80">
              {sim.activeInputs.length + sim.activeOutputs.length > 0 ? (
                <span>
                  Detected {sim.activeInputs.length} input(s) and {sim.activeOutputs.length} LED output(s). Press <strong>+ Log Row</strong> to capture each tested input state!
                </span>
              ) : (
                <span>Wire IC inputs from the power rails (or P1/P2/CLK) and place output LEDs to log truth table states.</span>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-44 rounded-lg border border-slate-800">
              <table className="w-full text-[11px] font-mono text-center border-collapse">
                <thead className="bg-slate-950 sticky top-0">
                  <tr>
                    {loggedRows[loggedRows.length - 1].inputs.map((inp, i) => (
                      <th key={`th-in-${i}`} className="p-1.5 border border-slate-800 text-sky-400">
                        {inp.label}
                      </th>
                    ))}
                    {loggedRows[loggedRows.length - 1].outputs.map((out, i) => (
                      <th key={`th-out-${i}`} className="p-1.5 border border-slate-800 text-emerald-400">
                        {out.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loggedRows.map(row => (
                    <tr key={row.id} className="bg-slate-950/30">
                      {row.inputs.map((inp, i) => (
                        <td key={`td-in-${i}`} className="p-1 border border-slate-800 text-slate-200">
                          {inp.value}
                        </td>
                      ))}
                      {row.outputs.map((out, i) => (
                        <td key={`td-out-${i}`} className="p-1 border border-slate-800 text-emerald-300 font-bold">
                          {out.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel 2: Live Logic Analyser */}
        <div
          className={`bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5 ${
            bottomMobileTab === 'analyser' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Logic Analyser
            </h3>
            {samples.length > 0 && (
              <button
                onClick={() => {
                  setSamples([]);
                  lastSampleSigRef.current = '';
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                Clear Waveforms
              </button>
            )}
          </div>

          {sim.activeInputs.length + sim.activeOutputs.length === 0 ? (
            <div className="text-[11px] text-slate-400 bg-slate-950/50 rounded-lg p-3 border border-slate-800/80">
              No active channels yet. Connect inputs/clock and place LEDs to observe live waveforms.
            </div>
          ) : (() => {
            const channels = [...sim.activeInputs, ...sim.activeOutputs];
            const svgH = Math.max(90, channels.length * 22 + 12);
            const n = samples.length;
            const dx = n > 1 ? 390 / (n - 1) : 0;

            return (
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-2 overflow-x-auto">
                <svg viewBox={`0 0 480 ${svgH}`} className="w-full h-auto min-w-[340px]">
                  {channels.map((ch, idx) => {
                    const yBase = idx * 22 + 18;
                    const strokeColor = ch.role === 'output' ? '#22c55e' : '#38bdf8';
                    const pts = samples
                      .map((sm, sIdx) => {
                        const val = sm.channels[ch.id] ?? 'X';
                        const y = val === 1 ? yBase - 11 : val === 0 ? yBase : yBase - 5.5;
                        const x = 68 + sIdx * dx;
                        if (sIdx === 0) return `${x},${y}`;
                        const prevVal = samples[sIdx - 1].channels[ch.id] ?? 'X';
                        const prevY = prevVal === 1 ? yBase - 11 : prevVal === 0 ? yBase : yBase - 5.5;
                        return `${x},${prevY} ${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <g key={ch.id}>
                        <line x1="66" y1={yBase} x2="462" y2={yBase} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.7" />
                        <text x="4" y={yBase - 2} fontSize="8.5" fontWeight="700" fill={ch.role === 'output' ? '#4ade80' : '#7dd3fc'} fontFamily="monospace">
                          {ch.label.slice(0, 9)}
                        </text>
                        {n >= 1 && (
                          <polyline
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="1.8"
                            points={pts}
                          />
                        )}
                        <text x="466" y={yBase - 2} fontSize="8.5" fontWeight="900" fill={strokeColor} fontFamily="monospace">
                          {ch.value}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>

        {/* Panel 3: Errors & Electrical Status */}
        <div
          className={`bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5 ${
            bottomMobileTab === 'status' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Errors &amp; Electrical Status
            </h3>
          </div>
          <ul className="space-y-1.5 max-h-44 overflow-y-auto text-[11px]">
            {sim.messages.map((m, idx) => (
              <li
                key={idx}
                className={`p-2 rounded-lg border flex items-start gap-2 ${
                  m.severity === 'error'
                    ? 'bg-red-950/40 border-red-500/40 text-red-200'
                    : m.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : m.severity === 'ok'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <span className="shrink-0 font-bold">
                  {m.severity === 'error' ? '✖' : m.severity === 'warning' ? '⚠' : m.severity === 'ok' ? '✓' : 'ℹ'}
                </span>
                <span>{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Drag Floating Ghost Badge */}
      {dragItem && ghostPos && (
        <div
          className="fixed pointer-events-none z-50 px-2.5 py-1 rounded bg-slate-900 border border-sky-400 text-sky-300 text-xs font-mono font-bold shadow-2xl"
          style={{ left: ghostPos.x + 12, top: ghostPos.y + 12 }}
        >
          {dragItem.kind.includes('ic')
            ? `IC ${dragItem.icType}`
            : dragItem.kind.includes('resistor')
            ? '330Ω Resistor'
            : `${dragItem.ledColor?.toUpperCase()} LED`}
        </div>
      )}
    </div>
  );
};
