import { EXPERIMENTS } from '../experiments/registry';
import { Experiment, SubCircuitConfig } from '../experiments/types';
import { IC_CATALOG } from '../simulator/ics/definitions';
import {
  formatTerminalLabel,
  getICPinHole,
  getNodeKey,
  TOP_ROWS,
  BOT_ROWS,
  WB_COLS,
} from './workbenchGeometry';
import {
  LEDColor,
  PlacedIC,
  PlacedLED,
  PlacedResistor,
  PracticeHint,
  SupportedICType,
  WorkbenchSimResult,
  WorkbenchState,
} from './workbenchTypes';

export interface MilestoneStep {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  hint?: string;
}

export interface PracticeEvaluation {
  experiment: Experiment;
  subCircuit: SubCircuitConfig;
  requiredICCounts: Record<string, number>;
  placedICCounts: Record<string, number>;
  requiredLEDs: number;
  requiredResistors: number;
  milestones: MilestoneStep[];
  allReadyToVerify: boolean;
}

export function evaluatePracticeProgress(
  expId: string,
  subId: string,
  state: WorkbenchState,
  sim: WorkbenchSimResult
): PracticeEvaluation | null {
  const experiment = EXPERIMENTS.find(e => e.id === expId);
  if (!experiment) return null;
  const subCircuit = experiment.subCircuits.find(s => s.id === subId) || experiment.subCircuits[0];

  // Count required ICs by part number
  const requiredICCounts: Record<string, number> = {};
  for (const ic of subCircuit.ics) {
    requiredICCounts[ic.partNumber] = (requiredICCounts[ic.partNumber] || 0) + 1;
  }

  // Count placed ICs on workbench
  const placedICCounts: Record<string, number> = {};
  for (const ic of state.ics) {
    placedICCounts[ic.type] = (placedICCounts[ic.type] || 0) + 1;
  }

  const hasAllRequiredICs = Object.entries(requiredICCounts).every(
    ([part, req]) => (placedICCounts[part] || 0) >= req
  );

  const requiredLEDs = subCircuit.outputs.length;
  const requiredResistors = subCircuit.outputs.length;

  const hasEnoughLEDs = state.leds.length >= requiredLEDs;
  const hasEnoughResistors = state.resistors.length >= requiredResistors;

  // Check Milestone 1: Power Supply & Rails
  const hasAnyPlusRail = sim.railsPowered.topPlus || sim.railsPowered.botPlus;
  const hasAnyMinusRail = sim.railsPowered.topMinus || sim.railsPowered.botMinus;
  const step1Done = state.psu && !sim.shortCircuit && hasAnyPlusRail && hasAnyMinusRail;

  // Check Milestone 2: Components Placed
  const step2Done = hasAllRequiredICs && hasEnoughLEDs && hasEnoughResistors;

  // Check Milestone 3: Required ICs Powered
  const matchedPoweredICs = Object.entries(requiredICCounts).every(([part, req]) => {
    const poweredOfPart = state.ics.filter(
      (ic: PlacedIC) => ic.type === (part as SupportedICType) && sim.icPowered[ic.id]
    ).length;
    return poweredOfPart >= req;
  });
  const step3Done = hasAllRequiredICs && matchedPoweredICs && !sim.shortCircuit;

  // Check Milestone 4: Inputs, Interconnections & LED Outputs Wired
  const noFloatingErrors = !sim.messages.some(m => m.severity === 'error');
  const allLedsConnected =
    hasEnoughLEDs &&
    state.leds.every(led => {
      const st = sim.ledStates[led.id];
      return st && st.anodeVal !== 'X' && st.cathodeVal !== 'X';
    });
  const hasInputsWired = sim.activeInputs.length >= Math.min(1, subCircuit.inputs.length);
  const step4Done = step1Done && step2Done && step3Done && noFloatingErrors && allLedsConnected && hasInputsWired;

  // Generate helpful concise pinout reference hints for each required IC
  const icPinHints = Object.keys(requiredICCounts)
    .map(part => {
      const def = IC_CATALOG[part];
      if (!def) return '';
      return `IC ${part} (${def.name}): VCC = Pin ${def.vccPin}, GND = Pin ${def.gndPin}`;
    })
    .filter(Boolean)
    .join(' · ');

  // Generate logical signal flow hint without spoiling exact breadboard column numbers
  const signalHint = subCircuit.explanationSteps
    .map(s => `${s.step}. ${s.title}: ${s.description}`)
    .join('\n');

  const icListText = Object.entries(requiredICCounts)
    .map(([part, cnt]) => `${cnt}× IC ${part}`)
    .join(', ');

  const milestones: MilestoneStep[] = [
    {
      id: 'power_rails',
      title: '1. Energize Power Rails',
      detail: 'Turn Power Supply ON and connect +5V to a (+) rail & GND to a (−) rail (top or bottom).',
      completed: step1Done,
      hint: 'Run a wire from PSU +5V to Top (+) or Bottom (+) rail, and PSU GND to (−) rail, then switch PSU ON.',
    },
    {
      id: 'place_parts',
      title: '2. Place Required Components',
      detail: `Place ${icListText}, ${requiredLEDs}× LED${requiredLEDs > 1 ? 's' : ''}, and ${requiredResistors}× 330Ω resistor${requiredResistors > 1 ? 's' : ''}.`,
      completed: step2Done,
      hint: 'Drag parts from the left library (or tap to arm, then tap the breadboard). Use ↻ Rotate if needed.',
    },
    {
      id: 'power_ics',
      title: '3. Connect IC Power & Ground',
      detail: 'Wire each IC\'s VCC pin to a (+) rail and GND pin to a (−) rail.',
      completed: step3Done,
      hint: icPinHints,
    },
    {
      id: 'wire_circuit',
      title: '4. Wire Logic Inputs, Gates & LEDs',
      detail: `Wire inputs (${subCircuit.inputs.map(i => i.label).join(', ')}) from + / − rails (or P1/P2/CLK) and route outputs (${subCircuit.outputs.map(o => o.label).join(', ')}) through 330Ω resistors to LEDs.`,
      completed: step4Done,
      hint: signalHint,
    },
  ];

  return {
    experiment,
    subCircuit,
    requiredICCounts,
    placedICCounts,
    requiredLEDs,
    requiredResistors,
    milestones,
    allReadyToVerify: step4Done,
  };
}

// =========================================================================
// Context-Aware Smart Practice Hint & Next-Step Engine
// =========================================================================

interface TargetWireEdge {
  fromPinId: string;
  toPinId: string;
  label?: string;
  color?: string;
}

function resolveManualHoleToCanonicalPin(
  config: SubCircuitConfig,
  hole: { row: number; col: string }
): string {
  const colUpper = hole.col.toUpperCase();
  if (colUpper === 'L+' || colUpper === 'R+') return 'pwr_vcc';
  if (colUpper === 'L-' || colUpper === 'R-') return 'pwr_gnd';

  const matchedInput = config.inputs.find(
    inp => inp.boardConnection.row === hole.row && inp.boardConnection.col.toUpperCase() === colUpper
  );
  if (matchedInput) return `sw_out_${matchedInput.id}`;

  const matchedOutput = config.outputs.find(
    out => out.boardConnection.row === hole.row && out.boardConnection.col.toUpperCase() === colUpper
  );
  if (matchedOutput) return `led_in_${matchedOutput.id}`;

  for (const ic of config.ics) {
    const def = IC_CATALOG[ic.partNumber];
    if (!def) continue;
    const rowOffset = hole.row - ic.rowStart;
    const halfPins = def.pinCount / 2;
    if (rowOffset >= 0 && rowOffset < halfPins) {
      if (['A', 'B', 'C', 'D', 'E'].includes(colUpper)) {
        return `${ic.instanceId}_pin_${rowOffset + 1}`;
      }
      if (['F', 'G', 'H', 'I', 'J'].includes(colUpper)) {
        return `${ic.instanceId}_pin_${def.pinCount - rowOffset}`;
      }
    }
  }

  return `tie_${hole.row}_${colUpper}`;
}

function getNormalizedTargetEdges(subCircuit: SubCircuitConfig): TargetWireEdge[] {
  const rawEdges: TargetWireEdge[] = [];
  for (const w of subCircuit.wires) {
    const fromPinId = w.fromPinId ?? resolveManualHoleToCanonicalPin(subCircuit, w.from);
    const toPinId = w.toPinId ?? resolveManualHoleToCanonicalPin(subCircuit, w.to);
    rawEdges.push({ fromPinId, toPinId, label: w.label, color: w.color });
  }
  return rawEdges;
}

function parseICPinRef(pinId: string): { instanceId: string; pinNum: number } | null {
  const m = pinId.match(/^(ic_.+)_pin_(\d+)$/);
  if (!m) return null;
  return { instanceId: m[1], pinNum: parseInt(m[2], 10) };
}

function buildOccupiedHoleSet(state: WorkbenchState): Set<string> {
  const occ = new Set<string>();
  for (const ic of state.ics) {
    for (let p = 1; p <= ic.pinCount; p++) {
      occ.add(getICPinHole(ic, p));
    }
  }
  for (const w of state.wires) {
    occ.add(w.a);
    occ.add(w.b);
  }
  for (const r of state.resistors) {
    occ.add(r.a);
    occ.add(r.b);
  }
  for (const l of state.leds) {
    occ.add(l.anode);
    occ.add(l.cathode);
  }
  return occ;
}

function getUsedNodeKeys(state: WorkbenchState): Set<string> {
  const used = new Set<string>();
  for (const ic of state.ics) {
    const half = ic.pinCount / 2;
    for (let c = ic.col; c < ic.col + half; c++) {
      used.add(`T${c}`);
      used.add(`B${c}`);
    }
  }
  for (const w of state.wires) {
    used.add(getNodeKey(w.a));
    used.add(getNodeKey(w.b));
  }
  for (const r of state.resistors) {
    used.add(getNodeKey(r.a));
    used.add(getNodeKey(r.b));
  }
  for (const l of state.leds) {
    used.add(getNodeKey(l.anode));
    used.add(getNodeKey(l.cathode));
  }
  return used;
}

function pickOpenHoleOnStrip(
  terminalOrStrip: string,
  occ: Set<string>,
  preferOuter = true
): string {
  const railMatch = terminalOrStrip.match(/^R([tb][+-]):(\d+)$/);
  if (railMatch) {
    return pickNearestRailHole(
      railMatch[1] as 't+' | 't-' | 'b+' | 'b-',
      parseInt(railMatch[2], 10),
      occ
    );
  }
  const key = getNodeKey(terminalOrStrip);
  if (key.startsWith('T') || key.startsWith('B')) {
    const isTop = key.startsWith('T');
    const col = key.slice(1);
    const rows = isTop
      ? preferOuter
        ? ['a', 'b', 'c', 'd', 'e']
        : ['d', 'c', 'b', 'a', 'e']
      : preferOuter
      ? ['j', 'i', 'h', 'g', 'f']
      : ['g', 'h', 'i', 'j', 'f'];
    for (const rw of rows) {
      const candidate = `${isTop ? 'T' : 'B'}${col}${rw}`;
      if (!occ.has(candidate)) return candidate;
    }
    return `${isTop ? 'T' : 'B'}${col}${isTop ? 'a' : 'j'}`;
  }
  return terminalOrStrip;
}

function pickNearestRailHole(
  railKey: 't+' | 't-' | 'b+' | 'b-',
  targetCol: number,
  occ: Set<string>
): string {
  const clamped = Math.max(0, Math.min(WB_COLS - 1, targetCol));
  for (let delta = 0; delta < WB_COLS; delta++) {
    const candidates = delta === 0 ? [clamped] : [clamped + delta, clamped - delta];
    for (const c of candidates) {
      if (c >= 0 && c < WB_COLS) {
        const hole = `R${railKey}:${c}`;
        if (!occ.has(hole)) return hole;
      }
    }
  }
  return `R${railKey}:${clamped}`;
}

function getColumnFromTerminal(terminalId: string): number {
  const mR = terminalId.match(/^R[tb][+-]:(\d+)$/);
  if (mR) return parseInt(mR[1], 10);
  const mG = terminalId.match(/^[TB](\d+)[a-j]$/);
  if (mG) return parseInt(mG[1], 10);
  return 0;
}

function pickPreferredRailKey(
  polarity: '+' | '-',
  nearTerminal: string,
  sim: WorkbenchSimResult
): 't+' | 't-' | 'b+' | 'b-' {
  const isTopSide = nearTerminal.startsWith('T') || nearTerminal === 'PSU+';
  if (polarity === '+') {
    if (isTopSide && sim.railsPowered.topPlus) return 't+';
    if (!isTopSide && sim.railsPowered.botPlus) return 'b+';
    return sim.railsPowered.topPlus ? 't+' : sim.railsPowered.botPlus ? 'b+' : 't+';
  }
  if (isTopSide && sim.railsPowered.topMinus) return 't-';
  if (!isTopSide && sim.railsPowered.botMinus) return 'b-';
  return sim.railsPowered.topMinus ? 't-' : sim.railsPowered.botMinus ? 'b-' : 't-';
}

function findFreeICCol(pinCount: 14 | 16, state: WorkbenchState): number {
  const half = pinCount / 2;
  const occ = buildOccupiedHoleSet(state);

  const isValidCol = (c: number, margin: number): boolean => {
    if (c < 0 || c + half > WB_COLS) return false;
    const overlap = state.ics.some(other => {
      const otherHalf = other.pinCount / 2;
      return !(c + half + margin <= other.col || c >= other.col + otherHalf + margin);
    });
    if (overlap) return false;
    for (let p = 1; p <= pinCount; p++) {
      if (occ.has(getICPinHole({ col: c, pinCount }, p))) return false;
    }
    return true;
  };

  for (const margin of [2, 1, 0]) {
    for (let c = 1; c <= WB_COLS - half; c++) {
      if (isValidCol(c, margin)) return c;
    }
    if (isValidCol(0, margin)) return 0;
  }
  return 0;
}

/**
 * Matches required ICs from SubCircuitConfig against currently placed user ICs.
 * When multiple instances of the same part number exist, picks the assignment
 * that best agrees with wires already connected on the board.
 */
function matchUserICsToRequired(
  subCircuit: SubCircuitConfig,
  state: WorkbenchState,
  sim: WorkbenchSimResult,
  edges: TargetWireEdge[]
): {
  icMap: Record<string, PlacedIC>;
  missingIC: SubCircuitConfig['ics'][number] | null;
} {
  const icMap: Record<string, PlacedIC> = {};
  const availableByType: Record<string, PlacedIC[]> = {};
  for (const ic of state.ics) {
    if (!availableByType[ic.type]) availableByType[ic.type] = [];
    availableByType[ic.type].push(ic);
  }
  for (const part in availableByType) {
    availableByType[part].sort((a, b) => a.col - b.col);
  }

  // Group required ICs by partNumber
  const reqByType: Record<string, SubCircuitConfig['ics']> = {};
  for (const req of subCircuit.ics) {
    if (!reqByType[req.partNumber]) reqByType[req.partNumber] = [];
    reqByType[req.partNumber].push(req);
  }

  let firstMissing: SubCircuitConfig['ics'][number] | null = null;

  for (const part of Object.keys(reqByType)) {
    const reqList = reqByType[part];
    const availList = availableByType[part] || [];

    if (availList.length < reqList.length && !firstMissing) {
      firstMissing = reqList[availList.length];
    }

    if (reqList.length === 1 || availList.length <= 1) {
      for (let i = 0; i < Math.min(reqList.length, availList.length); i++) {
        icMap[reqList[i].instanceId] = availList[i];
      }
      continue;
    }

    // Multiple instances of same part (usually 2): test permutations cleanly
    const count = Math.min(reqList.length, availList.length);
    let bestScore = -1;
    let bestPerm: PlacedIC[] = availList.slice(0, count);

    const permute = (curr: PlacedIC[], remaining: PlacedIC[]) => {
      if (curr.length === count) {
        // Score this candidate mapping
        let score = 0;
        const candidateMap: Record<string, PlacedIC> = {};
        for (let i = 0; i < count; i++) candidateMap[reqList[i].instanceId] = curr[i];

        for (const e of edges) {
          const rA = parseICPinRef(e.fromPinId);
          const rB = parseICPinRef(e.toPinId);
          const icA = rA ? candidateMap[rA.instanceId] : undefined;
          const icB = rB ? candidateMap[rB.instanceId] : undefined;
          if (icA && icB && rA && rB) {
            if (sim.getNode(getICPinHole(icA, rA.pinNum)) === sim.getNode(getICPinHole(icB, rB.pinNum))) {
              score += 5;
            }
          }
          if (icA && rA && (e.toPinId === 'pwr_vcc' || e.toPinId === 'pwr_gnd')) {
            const pwrRoot = e.toPinId === 'pwr_vcc' ? sim.getNode('PSU+') : sim.getNode('PSUG');
            if (sim.getNode(getICPinHole(icA, rA.pinNum)) === pwrRoot) score += 2;
          }
          if (icB && rB && (e.fromPinId === 'pwr_vcc' || e.fromPinId === 'pwr_gnd')) {
            const pwrRoot = e.fromPinId === 'pwr_vcc' ? sim.getNode('PSU+') : sim.getNode('PSUG');
            if (sim.getNode(getICPinHole(icB, rB.pinNum)) === pwrRoot) score += 2;
          }
        }
        // Small tie-breaker preferring ascending column order
        let ordered = true;
        for (let i = 1; i < curr.length; i++) {
          if (curr[i].col < curr[i - 1].col) ordered = false;
        }
        const total = score * 2 + (ordered ? 1 : 0);
        if (total > bestScore) {
          bestScore = total;
          bestPerm = [...curr];
        }
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        permute([...curr, remaining[i]], [...remaining.slice(0, i), ...remaining.slice(i + 1)]);
      }
    };

    permute([], availList.slice(0, 4));
    for (let i = 0; i < count; i++) {
      icMap[reqList[i].instanceId] = bestPerm[i];
    }
  }

  return { icMap, missingIC: firstMissing };
}

function findFreeResistorSpot(state: WorkbenchState, startHintCol: number): { a: string; b: string } {
  const usedKeys = getUsedNodeKeys(state);

  // Build set of IC occupied columns so we never accidentally short IC pins across rows
  const icCols = new Set<number>();
  for (const ic of state.ics) {
    const half = ic.pinCount / 2;
    for (let c = ic.col; c < ic.col + half; c++) icCols.add(c);
  }

  const colCandidates: number[] = [];
  for (let c = Math.max(0, startHintCol); c < WB_COLS; c++) colCandidates.push(c);
  for (let c = Math.max(0, startHintCol) - 1; c >= 0; c--) colCandidates.push(c);

  // Pass 1: Look for clean horizontal resistor span (span 2 or 3 cols) on non-IC columns
  for (const span of [2, 3, 1]) {
    for (const side of ['B', 'T'] as const) {
      const row = side === 'B' ? 'h' : 'c';
      for (const c of colCandidates) {
        const c2 = c + span;
        if (c2 >= WB_COLS) continue;
        if (icCols.has(c) || icCols.has(c2)) continue;
        const kA = `${side}${c}`;
        const kB = `${side}${c2}`;
        if (!usedKeys.has(kA) && !usedKeys.has(kB)) {
          return { a: `${side}${c}${row}`, b: `${side}${c2}${row}` };
        }
      }
    }
  }

  // Pass 2: Bridge vertically across center gap on a completely non-IC single column (great for packed 4-IC boards like Exp 6!)
  for (const c of colCandidates) {
    if (icCols.has(c)) continue;
    if (!usedKeys.has(`T${c}`) && !usedKeys.has(`B${c}`)) {
      return { a: `T${c}d`, b: `B${c}g` };
    }
  }

  // Pass 3: Fall back to any completely unused column pair ignoring visual start preference
  for (let c = 0; c < WB_COLS - 1; c++) {
    if (icCols.has(c) || icCols.has(c + 1)) continue;
    const occ = buildOccupiedHoleSet(state);
    for (const rw of BOT_ROWS.slice(1)) {
      const ha = `B${c}${rw}`;
      const hb = `B${c + 1}${rw}`;
      if (!occ.has(ha) && !occ.has(hb)) return { a: ha, b: hb };
    }
    for (const rw of TOP_ROWS.slice(0, 4)) {
      const ha = `T${c}${rw}`;
      const hb = `T${c + 1}${rw}`;
      if (!occ.has(ha) && !occ.has(hb)) return { a: ha, b: hb };
    }
  }

  return { a: 'B30h', b: 'B32h' };
}

function findFreeLEDSpot(
  state: WorkbenchState,
  sim: WorkbenchSimResult,
  pairedResistor: PlacedResistor | undefined,
  occ: Set<string>
): { anode: string; cathode: string } {
  const usedKeys = getUsedNodeKeys(state);

  // Best case: pair directly onto side B of an unused 330Ω resistor!
  if (pairedResistor) {
    const resBKey = getNodeKey(pairedResistor.b);
    const colB = getColumnFromTerminal(pairedResistor.b);
    const isBot = resBKey.startsWith('B');
    const isTop = resBKey.startsWith('T');
    if (isBot || isTop) {
      const anodeHole = pickOpenHoleOnStrip(pairedResistor.b, occ, false);
      // If matching side minus rail is energized (or we can plug directly into minus rail column), put cathode on minus rail!
      const minusKey = isBot ? 'b-' : 't-';
      const minusHole = pickNearestRailHole(minusKey, colB, occ);
      if (isBot && (sim.railsPowered.botMinus || !sim.railsPowered.topMinus)) {
        return { anode: anodeHole, cathode: `Rb-:${colB}` };
      }
      if (isTop && (sim.railsPowered.topMinus || !sim.railsPowered.botMinus)) {
        return { anode: anodeHole, cathode: `Rt-:${colB}` };
      }
      return { anode: anodeHole, cathode: minusHole };
    }
  }

  // Fallback standalone LED placement on an unused strip
  const icCols = new Set<number>();
  for (const ic of state.ics) {
    const half = ic.pinCount / 2;
    for (let c = ic.col; c < ic.col + half; c++) icCols.add(c);
  }
  for (let c = WB_COLS - 2; c >= 0; c--) {
    if (icCols.has(c)) continue;
    if (!usedKeys.has(`B${c}`)) {
      return { anode: `B${c}i`, cathode: `Rb-:${c}` };
    }
  }
  return { anode: 'B28i', cathode: 'Rb-:28' };
}

function isNodeDrivenByInputSource(
  node: string,
  state: WorkbenchState,
  sim: WorkbenchSimResult
): boolean {
  const railAndPulserRoots = new Set<string>([
    sim.getNode('PSU+'),
    sim.getNode('PSUG'),
    sim.getNode('P1'),
    sim.getNode('P2'),
    sim.getNode('CLK'),
  ]);
  for (const r of ['t+', 't-', 'b+', 'b-']) {
    for (let c = 0; c < WB_COLS; c++) {
      // Only consider a rail terminal a deliberate driver if at least one wire/part touches that rail
      const term = `R${r}:${c}`;
      if (state.wires.some(w => w.a === term || w.b === term)) {
        railAndPulserRoots.add(sim.getNode(term));
      }
    }
  }
  return railAndPulserRoots.has(node);
}

/**
 * Inspects what the user has ALREADY placed and connected on the workbench
 * for the selected experiment, and returns the exact next component footprint
 * or jumper wire path on their current breadboard layout.
 */
export function computePracticeNextHint(
  expId: string,
  subId: string,
  state: WorkbenchState,
  sim: WorkbenchSimResult
): PracticeHint | null {
  if (!expId || expId === 'sandbox') return null;
  const experiment = EXPERIMENTS.find(e => e.id === expId);
  if (!experiment) return null;
  const subCircuit = experiment.subCircuits.find(s => s.id === subId) || experiment.subCircuits[0];

  const occ = buildOccupiedHoleSet(state);

  // Step 0: Power Supply & Rails
  if (!state.psu) {
    return {
      kind: 'toggle-psu',
      title: 'Turn Power Supply ON',
      detail: 'Click the POWER rocker switch on the left trainer dock to supply +5V DC.',
    };
  }

  if (!sim.railsPowered.topPlus && !sim.railsPowered.botPlus) {
    const targetRail = pickNearestRailHole('t+', 0, occ);
    return {
      kind: 'wire',
      title: 'Energize +5V Power Rail',
      detail: `Connect a red jumper wire from Power Supply +5V to ${formatTerminalLabel(targetRail)}.`,
      fromHole: 'PSU+',
      toHole: targetRail,
      color: '#ef4444',
    };
  }

  if (!sim.railsPowered.topMinus && !sim.railsPowered.botMinus) {
    const targetRail = pickNearestRailHole('t-', 1, occ);
    return {
      kind: 'wire',
      title: 'Connect Ground (0V) Rail',
      detail: `Connect Power Supply GND to ${formatTerminalLabel(targetRail)} so components and ICs have a 0V reference.`,
      fromHole: 'PSUG',
      toHole: targetRail,
      color: '#334155',
    };
  }

  const edges = getNormalizedTargetEdges(subCircuit);
  const { icMap, missingIC } = matchUserICsToRequired(subCircuit, state, sim, edges);

  // Step 1: Place missing ICs on free center-trough slots
  if (missingIC) {
    const def = IC_CATALOG[missingIC.partNumber];
    const pinCount = (def?.pinCount === 16 ? 16 : 14) as 14 | 16;
    const half = pinCount / 2;
    const suggestedCol = findFreeICCol(pinCount, state);
    return {
      kind: 'place-ic',
      title: `Place IC ${missingIC.partNumber}`,
      detail: `Place ${missingIC.label} straddling the center trough at columns ${suggestedCol + 1}–${suggestedCol + half}.`,
      icType: missingIC.partNumber as SupportedICType,
      pinCount,
      suggestedCol,
    };
  }

  // Step 2: Power (VCC & GND) every matched IC
  for (const reqIC of subCircuit.ics) {
    const userIC = icMap[reqIC.instanceId];
    if (!userIC) continue;
    const def = IC_CATALOG[userIC.type];
    if (!def) continue;

    const vccHole = getICPinHole(userIC, def.vccPin);
    if (sim.getNode(vccHole) !== sim.getNode('PSU+')) {
      const pinStripHole = pickOpenHoleOnStrip(vccHole, occ, true);
      const col = getColumnFromTerminal(vccHole);
      const railKey = pickPreferredRailKey('+', vccHole, sim);
      const railHole = pickNearestRailHole(railKey, col, occ);
      return {
        kind: 'wire',
        title: `Connect ${reqIC.label} VCC (+5V)`,
        detail: `Wire Pin ${def.vccPin} (VCC) of IC ${userIC.type} (Col ${col + 1}) to the energized (+) power rail.`,
        fromHole: pinStripHole,
        toHole: railHole,
        color: '#ef4444',
      };
    }

    const gndHole = getICPinHole(userIC, def.gndPin);
    if (sim.getNode(gndHole) !== sim.getNode('PSUG')) {
      const pinStripHole = pickOpenHoleOnStrip(gndHole, occ, true);
      const col = getColumnFromTerminal(gndHole);
      const railKey = pickPreferredRailKey('-', gndHole, sim);
      const railHole = pickNearestRailHole(railKey, col, occ);
      return {
        kind: 'wire',
        title: `Connect ${reqIC.label} GND (0V)`,
        detail: `Wire Pin ${def.gndPin} (GND) of IC ${userIC.type} (Col ${col + 1}) to the (−) ground rail.`,
        fromHole: pinStripHole,
        toHole: railHole,
        color: '#334155',
      };
    }
  }

  // Step 3: Place 330Ω Resistors & LEDs for outputs
  const rightmostICCol = state.ics.reduce((mx, ic) => Math.max(mx, ic.col + ic.pinCount / 2), 2);
  if (state.resistors.length < subCircuit.outputs.length) {
    const idx = state.resistors.length;
    const outDef = subCircuit.outputs[idx] || subCircuit.outputs[0];
    const spot = findFreeResistorSpot(state, Math.min(WB_COLS - 4, rightmostICCol + 1 + idx * 3));
    return {
      kind: 'place-resistor',
      title: `Place 330Ω Resistor #${idx + 1} (for ${outDef.label})`,
      detail: `Place a 330Ω current-limiting resistor on open strips to protect LED "${outDef.label}".`,
      a: spot.a,
      b: spot.b,
    };
  }

  if (state.leds.length < subCircuit.outputs.length) {
    const idx = state.leds.length;
    const outDef = subCircuit.outputs[idx] || subCircuit.outputs[0];
    // Find an unassigned resistor to pair cleanly next to it
    const usedResNodes = new Set<string>();
    for (const l of state.leds) usedResNodes.add(getNodeKey(l.anode));
    const pairRes =
      state.resistors.find(r => !usedResNodes.has(getNodeKey(r.b)) && !usedResNodes.has(getNodeKey(r.a))) ||
      state.resistors[idx];
    const ledColor: LEDColor =
      outDef.color === 'green' || outDef.color === 'amber' ? outDef.color : 'red';
    const spot = findFreeLEDSpot(state, sim, pairRes, occ);
    return {
      kind: 'place-led',
      title: `Place LED "${outDef.label}"`,
      detail: `Place the ${ledColor.toUpperCase()} LED with Anode (+) toward the resistor and Cathode (−) toward ground.`,
      anode: spot.anode,
      cathode: spot.cathode,
      color: ledColor,
      label: outDef.label,
    };
  }

  // Helper to resolve any subCircuit pinId to user's IC physical hole
  const resolveReqICPinHole = (pinId: string): { hole: string; desc: string } | null => {
    const ref = parseICPinRef(pinId);
    if (!ref) return null;
    const userIC = icMap[ref.instanceId];
    if (!userIC) return null;
    const def = IC_CATALOG[userIC.type];
    const pinLbl = def?.pinLabels[ref.pinNum] ?? `Pin ${ref.pinNum}`;
    return {
      hole: getICPinHole(userIC, ref.pinNum),
      desc: `IC ${userIC.type} P${ref.pinNum} (${pinLbl})`,
    };
  };

  // Step 4a: Fixed Power / Ground Tie-Offs (e.g. PR' -> +5V, C0 -> GND, unused inputs -> GND)
  for (const e of edges) {
    const isFromPwr = e.fromPinId === 'pwr_vcc' || e.fromPinId === 'pwr_gnd';
    const isToPwr = e.toPinId === 'pwr_vcc' || e.toPinId === 'pwr_gnd';
    if (!isFromPwr && !isToPwr) continue;

    const pwrId = isFromPwr ? e.fromPinId : e.toPinId;
    const targetPinId = isFromPwr ? e.toPinId : e.fromPinId;
    const resolved = resolveReqICPinHole(targetPinId);
    if (!resolved) continue;

    const targetRoot = pwrId === 'pwr_vcc' ? sim.getNode('PSU+') : sim.getNode('PSUG');
    if (sim.getNode(resolved.hole) !== targetRoot) {
      const stripHole = pickOpenHoleOnStrip(resolved.hole, occ, true);
      const railKey = pickPreferredRailKey(pwrId === 'pwr_vcc' ? '+' : '-', resolved.hole, sim);
      const railHole = pickNearestRailHole(railKey, getColumnFromTerminal(resolved.hole), occ);
      return {
        kind: 'wire',
        title: e.label || `${resolved.desc} → ${pwrId === 'pwr_vcc' ? '+5V' : 'GND'}`,
        detail: `Connect ${resolved.desc} to the ${pwrId === 'pwr_vcc' ? '(+) +5V' : '(−) GND'} rail.`,
        fromHole: stripHole,
        toHole: railHole,
        color: pwrId === 'pwr_vcc' ? '#ef4444' : '#334155',
      };
    }
  }

  // Step 4b: Inter-IC / Internal Feedback Jumper Wires
  for (const e of edges) {
    const rA = parseICPinRef(e.fromPinId);
    const rB = parseICPinRef(e.toPinId);
    if (!rA || !rB) continue;
    const pA = resolveReqICPinHole(e.fromPinId);
    const pB = resolveReqICPinHole(e.toPinId);
    if (!pA || !pB) continue;

    if (sim.getNode(pA.hole) !== sim.getNode(pB.hole)) {
      return {
        kind: 'wire',
        title: e.label || `Connect ${pA.desc} → ${pB.desc}`,
        detail: `Run a jumper wire from ${pA.desc} to ${pB.desc}.`,
        fromHole: pickOpenHoleOnStrip(pA.hole, occ, false),
        toHole: pickOpenHoleOnStrip(pB.hole, occ, false),
        color: e.color || '#8b5cf6',
      };
    }
  }

  // Step 4c: Logical Input Switch Connections (including shared/fanout IC pins!)
  for (const inp of subCircuit.inputs) {
    const swPin = `sw_out_${inp.id}`;
    const targetPinIds: string[] = [];
    for (const e of edges) {
      if (e.fromPinId === swPin && parseICPinRef(e.toPinId)) targetPinIds.push(e.toPinId);
      if (e.toPinId === swPin && parseICPinRef(e.fromPinId)) targetPinIds.push(e.fromPinId);
    }

    // BFS transitive IC pin ties connected to input pin (covers Exp 2 NAND/NOR tied inputs!)
    const seenPins = new Set<string>(targetPinIds);
    const queue = [...targetPinIds];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const e of edges) {
        if (e.fromPinId === curr && parseICPinRef(e.toPinId) && !seenPins.has(e.toPinId)) {
          seenPins.add(e.toPinId);
          targetPinIds.push(e.toPinId);
          queue.push(e.toPinId);
        }
        if (e.toPinId === curr && parseICPinRef(e.fromPinId) && !seenPins.has(e.fromPinId)) {
          seenPins.add(e.fromPinId);
          targetPinIds.push(e.fromPinId);
          queue.push(e.fromPinId);
        }
      }
    }

    const resolvedTargets = targetPinIds
      .map(id => resolveReqICPinHole(id))
      .filter((x): x is { hole: string; desc: string } => x !== null);
    if (resolvedTargets.length === 0) continue;

    // Check if any pin in this logical input group is already connected to a rail/pulser/clock
    const drivenItem = resolvedTargets.find(t =>
      isNodeDrivenByInputSource(sim.getNode(t.hole), state, sim)
    );

    if (!drivenItem) {
      const first = resolvedTargets[0];
      const lblLower = inp.label.toLowerCase();
      let sourceHole: string;
      let sourceText: string;
      if (lblLower.includes('clk') || lblLower === 'ck') {
        sourceHole = 'CLK';
        sourceText = 'Pulse Generator CLK OUT';
      } else {
        const railKey = pickPreferredRailKey('-', first.hole, sim);
        sourceHole = pickNearestRailHole(railKey, getColumnFromTerminal(first.hole), occ);
        sourceText = `${railKey.startsWith('t') ? 'Top' : 'Bottom'} (−) Rail (select & Flip +/− Rail to test 1/0)`;
      }
      return {
        kind: 'wire',
        title: `Connect Input "${inp.label}" → ${first.desc}`,
        detail: `Wire ${first.desc} to ${sourceText}.`,
        fromHole: pickOpenHoleOnStrip(first.hole, occ, false),
        toHole: sourceHole,
        color: '#2563eb',
      };
    }

    // Fanout: if other pins share the same input but aren't in drivenItem's node yet
    const anchorNode = sim.getNode(drivenItem.hole);
    const missingFanout = resolvedTargets.find(
      t =>
        sim.getNode(t.hole) !== anchorNode &&
        !isNodeDrivenByInputSource(sim.getNode(t.hole), state, sim)
    );
    if (missingFanout) {
      return {
        kind: 'wire',
        title: `Share Input "${inp.label}" → ${missingFanout.desc}`,
        detail: `Jumper ${drivenItem.desc} strip to ${missingFanout.desc} so both receive Input ${inp.label}.`,
        fromHole: pickOpenHoleOnStrip(drivenItem.hole, occ, false),
        toHole: pickOpenHoleOnStrip(missingFanout.hole, occ, false),
        color: '#3b82f6',
      };
    }
  }

  // Step 4d: Output LEDs + 330Ω Resistors + Cathode GND
  // Pair each subCircuit output -> source pin hole + LED + Resistor
  const availLEDs = [...state.leds];
  const availRes = [...state.resistors];

  const matchLEDForOut = (out: SubCircuitConfig['outputs'][number], idx: number): PlacedLED | undefined => {
    const byLabel = availLEDs.find(l => l.label?.toLowerCase() === out.label.toLowerCase());
    return byLabel || availLEDs[idx];
  };

  for (let idx = 0; idx < subCircuit.outputs.length; idx++) {
    const out = subCircuit.outputs[idx];
    const ledPin = `led_in_${out.id}`;
    const led = matchLEDForOut(out, idx);
    if (!led) continue;

    // 1. Check LED Cathode -> GND
    if (sim.getNode(led.cathode) !== sim.getNode('PSUG')) {
      const stripHole = pickOpenHoleOnStrip(led.cathode, occ, true);
      const railKey = pickPreferredRailKey('-', led.cathode, sim);
      const railHole = pickNearestRailHole(railKey, getColumnFromTerminal(led.cathode), occ);
      return {
        kind: 'wire',
        title: `Ground LED "${out.label}" Cathode (−)`,
        detail: `Connect the Cathode (−) terminal of LED "${out.label}" to the (−) GND rail.`,
        fromHole: stripHole,
        toHole: railHole,
        color: '#334155',
      };
    }

    // Find what drives this output in the schematic (either an IC pin OR directly an input like MSB in Code Converter!)
    const driverEdge = edges.find(e => e.toPinId === ledPin || e.fromPinId === ledPin);
    if (!driverEdge) continue;
    const driverPinId = driverEdge.toPinId === ledPin ? driverEdge.fromPinId : driverEdge.toPinId;

    let sourcePinHole: string | null = null;
    let sourceLabel = '';
    const resolvedICDriver = resolveReqICPinHole(driverPinId);
    if (resolvedICDriver) {
      sourcePinHole = resolvedICDriver.hole;
      sourceLabel = resolvedICDriver.desc;
    } else if (driverPinId.startsWith('sw_out_')) {
      // Direct input passthrough (e.g. Exp 5 B3 -> G3 LED)
      const inpRef = subCircuit.inputs.find(i => `sw_out_${i.id}` === driverPinId);
      const linkedICEdge = edges.find(
        e =>
          (e.fromPinId === driverPinId && parseICPinRef(e.toPinId)) ||
          (e.toPinId === driverPinId && parseICPinRef(e.fromPinId))
      );
      if (linkedICEdge) {
        const icPin = parseICPinRef(linkedICEdge.fromPinId) ? linkedICEdge.fromPinId : linkedICEdge.toPinId;
        const r = resolveReqICPinHole(icPin);
        if (r) {
          sourcePinHole = r.hole;
          sourceLabel = `${inpRef?.label ?? 'Input'} (${r.desc})`;
        }
      }
    }

    if (!sourcePinHole) continue;
    const sourceNode = sim.getNode(sourcePinHole);
    const anodeNode = sim.getNode(led.anode);

    // Pick resistor for this LED: prefer one already touching anodeNode or sourceNode, otherwise idx-th resistor
    const pairedRes =
      availRes.find(
        r =>
          (sim.getNode(r.a) === anodeNode && sim.getNode(r.b) === sourceNode) ||
          (sim.getNode(r.b) === anodeNode && sim.getNode(r.a) === sourceNode)
      ) ||
      availRes.find(
        r =>
          sim.getNode(r.a) === anodeNode ||
          sim.getNode(r.b) === anodeNode ||
          sim.getNode(r.a) === sourceNode ||
          sim.getNode(r.b) === sourceNode
      ) ||
      availRes[idx];

    if (!pairedRes) continue;
    const rA = sim.getNode(pairedRes.a);
    const rB = sim.getNode(pairedRes.b);

    const alreadySeries =
      (rA === sourceNode && rB === anodeNode) || (rB === sourceNode && rA === anodeNode);
    if (alreadySeries) continue;

    // Determine which side still needs wiring
    if (rB === anodeNode && rA !== sourceNode) {
      return {
        kind: 'wire',
        title: `Connect ${sourceLabel} → Resistor`,
        detail: `Wire ${sourceLabel} to the open terminal of the 330Ω resistor leading to LED "${out.label}".`,
        fromHole: pickOpenHoleOnStrip(sourcePinHole, occ, false),
        toHole: pickOpenHoleOnStrip(pairedRes.a, occ, false),
        color: '#22c55e',
      };
    }
    if (rA === anodeNode && rB !== sourceNode) {
      return {
        kind: 'wire',
        title: `Connect ${sourceLabel} → Resistor`,
        detail: `Wire ${sourceLabel} to the open terminal of the 330Ω resistor leading to LED "${out.label}".`,
        fromHole: pickOpenHoleOnStrip(sourcePinHole, occ, false),
        toHole: pickOpenHoleOnStrip(pairedRes.b, occ, false),
        color: '#22c55e',
      };
    }
    if (rA === sourceNode && rB !== anodeNode) {
      return {
        kind: 'wire',
        title: `Connect Resistor → LED "${out.label}" (+)`,
        detail: `Wire the other leg of the 330Ω resistor to LED "${out.label}" Anode (+).`,
        fromHole: pickOpenHoleOnStrip(pairedRes.b, occ, false),
        toHole: pickOpenHoleOnStrip(led.anode, occ, false),
        color: '#22c55e',
      };
    }
    if (rB === sourceNode && rA !== anodeNode) {
      return {
        kind: 'wire',
        title: `Connect Resistor → LED "${out.label}" (+)`,
        detail: `Wire the other leg of the 330Ω resistor to LED "${out.label}" Anode (+).`,
        fromHole: pickOpenHoleOnStrip(pairedRes.a, occ, false),
        toHole: pickOpenHoleOnStrip(led.anode, occ, false),
        color: '#22c55e',
      };
    }

    // Neither side of resistor is wired yet -> wire sourcePin -> resistor.a first
    return {
      kind: 'wire',
      title: `Route ${sourceLabel} to 330Ω Resistor`,
      detail: `Connect ${sourceLabel} to one side of your 330Ω resistor (before connecting to LED "${out.label}" Anode +).`,
      fromHole: pickOpenHoleOnStrip(sourcePinHole, occ, false),
      toHole: pickOpenHoleOnStrip(pairedRes.a, occ, false),
      color: '#f59e0b',
    };
  }

  return {
    kind: 'complete',
    title: 'All Connections Verified!',
    detail: 'Every power rail, IC pin, input, and resistor-protected LED is wired. Toggle inputs (+/− rails, P1/P2, CLK) and log rows in the Truth Table!',
  };
}

/**
 * Executes one suggested PracticeHint directly onto WorkbenchState (optional 1-step assist).
 */
export function applyPracticeHintStep(hint: PracticeHint, state: WorkbenchState): WorkbenchState {
  switch (hint.kind) {
    case 'toggle-psu':
      return { ...state, psu: true };
    case 'place-ic':
      return {
        ...state,
        nid: state.nid + 1,
        ics: [
          ...state.ics,
          { id: state.nid, type: hint.icType, col: hint.suggestedCol, pinCount: hint.pinCount },
        ],
      };
    case 'place-resistor':
      return {
        ...state,
        nid: state.nid + 1,
        resistors: [...state.resistors, { id: state.nid, a: hint.a, b: hint.b, ohms: 330 }],
      };
    case 'place-led':
      return {
        ...state,
        nid: state.nid + 1,
        leds: [
          ...state.leds,
          {
            id: state.nid,
            anode: hint.anode,
            cathode: hint.cathode,
            color: hint.color,
            label: hint.label || `LED${state.leds.length + 1}`,
          },
        ],
      };
    case 'wire':
      if (hint.fromHole === hint.toHole) return state;
      if (
        state.wires.some(
          w =>
            (w.a === hint.fromHole && w.b === hint.toHole) ||
            (w.a === hint.toHole && w.b === hint.fromHole)
        )
      ) {
        return state;
      }
      return {
        ...state,
        nid: state.nid + 1,
        wires: [
          ...state.wires,
          {
            id: state.nid,
            a: hint.fromHole,
            b: hint.toHole,
            color: hint.color || '#2563eb',
          },
        ],
      };
    default:
      return state;
  }
}
