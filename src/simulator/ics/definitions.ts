import { ICDefinition } from '../engine/types';

/**
 * Standard TTL 7400-Series IC Library definitions as specified in the manual.
 */

// IC 7404: Hex Inverter
export const IC_7404: ICDefinition = {
  partNumber: '7404',
  name: 'Hex Inverter',
  description: 'Six independent NOT gates (inverters).',
  packageType: 'DIP14',
  pinCount: 14,
  vccPin: 14,
  gndPin: 7,
  gates: [
    { id: 'gate1', type: 'NOT', inputPinNumbers: [1], outputPinNumbers: [2], label: '1A -> 1Y' },
    { id: 'gate2', type: 'NOT', inputPinNumbers: [3], outputPinNumbers: [4], label: '2A -> 2Y' },
    { id: 'gate3', type: 'NOT', inputPinNumbers: [5], outputPinNumbers: [6], label: '3A -> 3Y' },
    { id: 'gate4', type: 'NOT', inputPinNumbers: [9], outputPinNumbers: [8], label: '4A -> 4Y' },
    { id: 'gate5', type: 'NOT', inputPinNumbers: [11], outputPinNumbers: [10], label: '5A -> 5Y' },
    { id: 'gate6', type: 'NOT', inputPinNumbers: [13], outputPinNumbers: [12], label: '6A -> 6Y' },
  ],
  pinLabels: {
    1: '1A', 2: '1Y', 3: '2A', 4: '2Y', 5: '3A', 6: '3Y', 7: 'GND',
    8: '4Y', 9: '4A', 10: '5Y', 11: '5A', 12: '6Y', 13: '6A', 14: 'VCC',
  },
  pinDirections: {
    1: 'INPUT', 2: 'OUTPUT', 3: 'INPUT', 4: 'OUTPUT', 5: 'INPUT', 6: 'OUTPUT', 7: 'GROUND',
    8: 'OUTPUT', 9: 'INPUT', 10: 'OUTPUT', 11: 'INPUT', 12: 'OUTPUT', 13: 'INPUT', 14: 'POWER',
  },
};

// IC 7408: Quad 2-Input AND Gate
export const IC_7408: ICDefinition = {
  partNumber: '7408',
  name: 'Quad 2-Input AND Gate',
  description: 'Four independent 2-input AND gates.',
  packageType: 'DIP14',
  pinCount: 14,
  vccPin: 14,
  gndPin: 7,
  gates: [
    { id: 'gate1', type: 'AND', inputPinNumbers: [1, 2], outputPinNumbers: [3], label: '(1A, 1B) -> 1Y' },
    { id: 'gate2', type: 'AND', inputPinNumbers: [4, 5], outputPinNumbers: [6], label: '(2A, 2B) -> 2Y' },
    { id: 'gate3', type: 'AND', inputPinNumbers: [9, 10], outputPinNumbers: [8], label: '(3A, 3B) -> 3Y' },
    { id: 'gate4', type: 'AND', inputPinNumbers: [12, 13], outputPinNumbers: [11], label: '(4A, 4B) -> 4Y' },
  ],
  pinLabels: {
    1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND',
    8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC',
  },
  pinDirections: {
    1: 'INPUT', 2: 'INPUT', 3: 'OUTPUT', 4: 'INPUT', 5: 'INPUT', 6: 'OUTPUT', 7: 'GROUND',
    8: 'OUTPUT', 9: 'INPUT', 10: 'INPUT', 11: 'OUTPUT', 12: 'INPUT', 13: 'INPUT', 14: 'POWER',
  },
};

// IC 7432: Quad 2-Input OR Gate
export const IC_7432: ICDefinition = {
  partNumber: '7432',
  name: 'Quad 2-Input OR Gate',
  description: 'Four independent 2-input OR gates.',
  packageType: 'DIP14',
  pinCount: 14,
  vccPin: 14,
  gndPin: 7,
  gates: [
    { id: 'gate1', type: 'OR', inputPinNumbers: [1, 2], outputPinNumbers: [3], label: '(1A, 1B) -> 1Y' },
    { id: 'gate2', type: 'OR', inputPinNumbers: [4, 5], outputPinNumbers: [6], label: '(2A, 2B) -> 2Y' },
    { id: 'gate3', type: 'OR', inputPinNumbers: [9, 10], outputPinNumbers: [8], label: '(3A, 3B) -> 3Y' },
    { id: 'gate4', type: 'OR', inputPinNumbers: [12, 13], outputPinNumbers: [11], label: '(4A, 4B) -> 4Y' },
  ],
  pinLabels: {
    1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND',
    8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC',
  },
  pinDirections: {
    1: 'INPUT', 2: 'INPUT', 3: 'OUTPUT', 4: 'INPUT', 5: 'INPUT', 6: 'OUTPUT', 7: 'GROUND',
    8: 'OUTPUT', 9: 'INPUT', 10: 'INPUT', 11: 'OUTPUT', 12: 'INPUT', 13: 'INPUT', 14: 'POWER',
  },
};

// IC 7400: Quad 2-Input NAND Gate
export const IC_7400: ICDefinition = {
  partNumber: '7400',
  name: 'Quad 2-Input NAND Gate',
  description: 'Four independent 2-input NAND gates (Universal gate).',
  packageType: 'DIP14',
  pinCount: 14,
  vccPin: 14,
  gndPin: 7,
  gates: [
    { id: 'gate1', type: 'NAND', inputPinNumbers: [1, 2], outputPinNumbers: [3], label: '(1A, 1B) -> 1Y' },
    { id: 'gate2', type: 'NAND', inputPinNumbers: [4, 5], outputPinNumbers: [6], label: '(2A, 2B) -> 2Y' },
    { id: 'gate3', type: 'NAND', inputPinNumbers: [9, 10], outputPinNumbers: [8], label: '(3A, 3B) -> 3Y' },
    { id: 'gate4', type: 'NAND', inputPinNumbers: [12, 13], outputPinNumbers: [11], label: '(4A, 4B) -> 4Y' },
  ],
  pinLabels: {
    1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND',
    8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC',
  },
  pinDirections: {
    1: 'INPUT', 2: 'INPUT', 3: 'OUTPUT', 4: 'INPUT', 5: 'INPUT', 6: 'OUTPUT', 7: 'GROUND',
    8: 'OUTPUT', 9: 'INPUT', 10: 'INPUT', 11: 'OUTPUT', 12: 'INPUT', 13: 'INPUT', 14: 'POWER',
  },
};

// IC 7402: Quad 2-Input NOR Gate
// NOTE: 7402 has REVERSED PINOUT compared to 7400/7408/7432!
// Gate 1: Out=1, In=(2,3)
// Gate 2: Out=4, In=(5,6)
// Gate 3: Out=10, In=(8,9)
// Gate 4: Out=13, In=(11,12)
export const IC_7402: ICDefinition = {
  partNumber: '7402',
  name: 'Quad 2-Input NOR Gate',
  description: 'Four independent 2-input NOR gates (Universal gate with unique pinout).',
  packageType: 'DIP14',
  pinCount: 14,
  vccPin: 14,
  gndPin: 7,
  gates: [
    { id: 'gate1', type: 'NOR', inputPinNumbers: [2, 3], outputPinNumbers: [1], label: '(1A, 1B) -> 1Y' },
    { id: 'gate2', type: 'NOR', inputPinNumbers: [5, 6], outputPinNumbers: [4], label: '(2A, 2B) -> 2Y' },
    { id: 'gate3', type: 'NOR', inputPinNumbers: [8, 9], outputPinNumbers: [10], label: '(3A, 3B) -> 3Y' },
    { id: 'gate4', type: 'NOR', inputPinNumbers: [11, 12], outputPinNumbers: [13], label: '(4A, 4B) -> 4Y' },
  ],
  pinLabels: {
    1: '1Y', 2: '1A', 3: '1B', 4: '2Y', 5: '2A', 6: '2B', 7: 'GND',
    8: '3A', 9: '3B', 10: '3Y', 11: '4A', 12: '4B', 13: '4Y', 14: 'VCC',
  },
  pinDirections: {
    1: 'OUTPUT', 2: 'INPUT', 3: 'INPUT', 4: 'OUTPUT', 5: 'INPUT', 6: 'INPUT', 7: 'GROUND',
    8: 'INPUT', 9: 'INPUT', 10: 'OUTPUT', 11: 'INPUT', 12: 'INPUT', 13: 'OUTPUT', 14: 'POWER',
  },
};

// IC 7486: Quad 2-Input XOR Gate
export const IC_7486: ICDefinition = {
  partNumber: '7486',
  name: 'Quad 2-Input Exclusive-OR Gate',
  description: 'Four independent 2-input XOR gates.',
  packageType: 'DIP14',
  pinCount: 14,
  vccPin: 14,
  gndPin: 7,
  gates: [
    { id: 'gate1', type: 'XOR', inputPinNumbers: [1, 2], outputPinNumbers: [3], label: '(1A, 1B) -> 1Y' },
    { id: 'gate2', type: 'XOR', inputPinNumbers: [4, 5], outputPinNumbers: [6], label: '(2A, 2B) -> 2Y' },
    { id: 'gate3', type: 'XOR', inputPinNumbers: [9, 10], outputPinNumbers: [8], label: '(3A, 3B) -> 3Y' },
    { id: 'gate4', type: 'XOR', inputPinNumbers: [12, 13], outputPinNumbers: [11], label: '(4A, 4B) -> 4Y' },
  ],
  pinLabels: {
    1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND',
    8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC',
  },
  pinDirections: {
    1: 'INPUT', 2: 'INPUT', 3: 'OUTPUT', 4: 'INPUT', 5: 'INPUT', 6: 'OUTPUT', 7: 'GROUND',
    8: 'OUTPUT', 9: 'INPUT', 10: 'INPUT', 11: 'OUTPUT', 12: 'INPUT', 13: 'INPUT', 14: 'POWER',
  },
};

// IC 7483: 4-Bit Binary Full Adder with Fast Carry (16-Pin DIP)
// As specified on page 17 of laboratory manual:
// Pin 1: A3, Pin 2: S2, Pin 3: A2, Pin 4: B2, Pin 5: VCC, Pin 6: S1, Pin 7: B1, Pin 8: A1
// Pin 9: S0, Pin 10: A0, Pin 11: B0, Pin 12: GND, Pin 13: C0 (Cin), Pin 14: C4 (Cout), Pin 15: S3, Pin 16: B3
export const IC_7483: ICDefinition = {
  partNumber: '7483',
  name: '4-Bit Binary Full Adder',
  description: '4-bit parallel adder with carry lookahead generation.',
  packageType: 'DIP16',
  pinCount: 16,
  vccPin: 5,
  gndPin: 12,
  gates: [
    {
      id: 'adder1',
      type: 'ADDER_4BIT',
      // Inputs in order: [A3, A2, A1, A0, B3, B2, B1, B0, Cin] -> pin numbers: [1, 3, 8, 10, 16, 4, 7, 11, 13]
      inputPinNumbers: [1, 3, 8, 10, 16, 4, 7, 11, 13],
      // Outputs in order: [S3, S2, S1, S0, Cout] -> pin numbers: [15, 2, 6, 9, 14]
      outputPinNumbers: [15, 2, 6, 9, 14],
      label: '4-Bit Full Adder',
    }
  ],
  pinLabels: {
    1: 'A3', 2: 'S2', 3: 'A2', 4: 'B2', 5: 'VCC', 6: 'S1', 7: 'B1', 8: 'A1',
    9: 'S0', 10: 'A0', 11: 'B0', 12: 'GND', 13: 'C0', 14: 'C4', 15: 'S3', 16: 'B3',
  },
  pinDirections: {
    1: 'INPUT', 2: 'OUTPUT', 3: 'INPUT', 4: 'INPUT', 5: 'POWER', 6: 'OUTPUT', 7: 'INPUT', 8: 'INPUT',
    9: 'OUTPUT', 10: 'INPUT', 11: 'INPUT', 12: 'GROUND', 13: 'INPUT', 14: 'OUTPUT', 15: 'OUTPUT', 16: 'INPUT',
  }
};

export const IC_CATALOG: Record<string, ICDefinition> = {
  '7404': IC_7404,
  '7408': IC_7408,
  '7432': IC_7432,
  '7400': IC_7400,
  '7402': IC_7402,
  '7486': IC_7486,
  '7483': IC_7483,
};
