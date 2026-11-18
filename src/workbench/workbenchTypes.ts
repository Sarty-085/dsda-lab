export type LogicLevel = 0 | 1 | 'X' | 'C';

export type SupportedICType =
  | '7400'
  | '7402'
  | '7404'
  | '7408'
  | '7410'
  | '7411'
  | '7432'
  | '7474'
  | '7483'
  | '7486'
  | '7495';

export type LEDColor = 'red' | 'green' | 'amber';

export interface PlacedIC {
  id: number;
  type: SupportedICType;
  col: number; // Leftmost column index (0-based)
  pinCount: 14 | 16;
}

export interface PlacedResistor {
  id: number;
  a: string; // Terminal ID
  b: string; // Terminal ID
  ohms: number; // 330
}

export interface PlacedLED {
  id: number;
  anode: string;   // (+) terminal ID
  cathode: string; // (-) terminal ID
  color: LEDColor;
  label?: string;
}

export interface PlacedWire {
  id: number;
  a: string; // Terminal ID
  b: string; // Terminal ID
  color: string;
  curveOffset?: { dx: number; dy: number };
}

export type SelectionTarget =
  | { kind: 'ic'; id: number }
  | { kind: 'resistor'; id: number }
  | { kind: 'led'; id: number }
  | { kind: 'wire'; id: number };

export type ArmedTool =
  | { kind: 'ic'; type: SupportedICType }
  | { kind: 'resistor' }
  | { kind: 'led'; color: LEDColor }
  | null;

export interface WorkbenchState {
  psu: boolean;
  p: [0 | 1, 0 | 1]; // Pulser switches P1, P2
  clkActive: boolean;
  clkLevel: 0 | 1; // Continuous / Step Pulse Generator output
  ics: PlacedIC[];
  resistors: PlacedResistor[];
  leds: PlacedLED[];
  wires: PlacedWire[];
  nid: number;
}

export interface StatusMessage {
  severity: 'error' | 'warning' | 'info' | 'ok';
  text: string;
}

export interface ActiveChannel {
  id: string;
  label: string;
  role: 'input' | 'output';
  value: LogicLevel;
}

export interface WorkbenchSimResult {
  vals: Record<string, LogicLevel>;
  getNode: (terminalId: string) => string;
  getTerminalValue: (terminalId: string) => LogicLevel;
  icPowered: Record<number, boolean>;
  ledStates: Record<number, {
    lit: boolean;
    anodeVal: LogicLevel;
    cathodeVal: LogicLevel;
    hasResistor: boolean;
    reverseBiased: boolean;
  }>;
  shortCircuit: boolean;
  railsPowered: {
    topPlus: boolean;
    topMinus: boolean;
    botPlus: boolean;
    botMinus: boolean;
  };
  messages: StatusMessage[];
  activeInputs: ActiveChannel[];
  activeOutputs: ActiveChannel[];
}

export interface LogicSample {
  timestamp: number;
  channels: Record<string, LogicLevel>;
}

export interface LoggedTruthRow {
  id: number;
  inputs: { label: string; value: LogicLevel }[];
  outputs: { label: string; value: LogicLevel }[];
}

export interface SequentialMemory {
  dff: Record<string, { q: 0 | 1; prevClk: 0 | 1 }>;
  sr7495: Record<string, {
    qa: 0 | 1;
    qb: 0 | 1;
    qc: 0 | 1;
    qd: 0 | 1;
    prevCk1: 0 | 1;
    prevCk2: 0 | 1;
  }>;
  latchVals: Record<string, LogicLevel>;
}

export type PracticeHint =
  | {
      kind: 'toggle-psu';
      title: string;
      detail: string;
    }
  | {
      kind: 'place-ic';
      title: string;
      detail: string;
      icType: SupportedICType;
      pinCount: 14 | 16;
      suggestedCol: number;
    }
  | {
      kind: 'place-resistor';
      title: string;
      detail: string;
      a: string;
      b: string;
    }
  | {
      kind: 'place-led';
      title: string;
      detail: string;
      anode: string;
      cathode: string;
      color: LEDColor;
      label?: string;
    }
  | {
      kind: 'wire';
      title: string;
      detail: string;
      fromHole: string;
      toHole: string;
      color?: string;
    }
  | {
      kind: 'complete';
      title: string;
      detail: string;
    };

export interface WorkbenchSessionData {
  state: WorkbenchState;
  undoStack: string[];
  redoStack: string[];
  loggedRows: LoggedTruthRow[];
  samples: LogicSample[];
  practiceExpId: string;
  practiceSubId: string;
}
