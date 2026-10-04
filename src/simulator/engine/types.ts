/**
 * Core Digital Logic Simulation Types
 */

export enum DigitalSignal {
  LOW = 0,
  HIGH = 1,
  FLOATING = 2,
}

export type PinDirection = 'INPUT' | 'OUTPUT' | 'POWER' | 'GROUND' | 'PASSIVE';

export interface Pin {
  id: string;
  label: string;
  direction: PinDirection;
  signal: DigitalSignal;
  componentId: string;
  pinNumber?: number; // Physical IC pin number (1-14 or 1-16)
  description?: string;
  holePosition?: { row: number; col: string }; // e.g. row 10, col 'E'
}

export interface Wire {
  id: string;
  fromPinId: string;
  toPinId: string;
  color?: string;
  signal: DigitalSignal;
  label?: string;
  pathType?: 'orthogonal' | 'bezier' | 'direct';
}

export type GateType = 
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'
  | 'ADDER_4BIT';

export interface InternalGate {
  id: string;
  type: GateType;
  inputPinNumbers: number[];
  outputPinNumbers: number[];
  label?: string;
}

export type ICPackage = 'DIP14' | 'DIP16';

export interface ICDefinition {
  partNumber: string;
  name: string;
  description: string;
  packageType: ICPackage;
  pinCount: number;
  vccPin: number;
  gndPin: number;
  gates: InternalGate[];
  pinLabels: Record<number, string>;
  pinDirections: Record<number, PinDirection>;
}

export interface ICInstance {
  instanceId: string;
  partNumber: string;
  label: string;
  definition: ICDefinition;
  position: { rowStart: number; centerTrough: boolean };
  pinIds: Record<number, string>; // Maps physical pin number (1..14/16) to global Pin.id
}

export interface SwitchComponent {
  id: string;
  label: string;
  state: DigitalSignal; // LOW or HIGH
  outputPinId: string;
  description?: string;
}

export interface LEDComponent {
  id: string;
  label: string;
  inputPinId: string; // Anode (+) positive terminal
  cathodePinId?: string; // Cathode (-) negative/ground terminal
  color: 'red' | 'green' | 'amber' | 'blue';
  state: DigitalSignal;
  description?: string;
}

export interface ResistorComponent {
  id: string;
  resistanceOhms: number; // typically 330
  pin1Id: string;
  pin2Id: string;
}

export interface TraceNode {
  type: 'INPUT' | 'GATE' | 'IC_PIN' | 'WIRE' | 'LED';
  id: string;
  label: string;
  value: DigitalSignal;
  equation?: string;
  upstream: TraceNode[];
}
