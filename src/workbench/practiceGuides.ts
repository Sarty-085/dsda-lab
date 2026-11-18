import { EXPERIMENTS } from '../experiments/registry';
import { Experiment, SubCircuitConfig } from '../experiments/types';
import { IC_CATALOG } from '../simulator/ics/definitions';
import { PlacedIC, SupportedICType, WorkbenchSimResult, WorkbenchState } from './workbenchTypes';

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
