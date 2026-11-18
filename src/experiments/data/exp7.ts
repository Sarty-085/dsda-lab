import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP7_PARITY: Experiment = {
  id: 'exp7',
  experimentNumber: 7,
  title: 'Construction and Implementation of Parity Bit Generator/Checker',
  aim: 'To design and implement even and odd parity generators and checkers for error detection.',
  theory: {
    summary:
      'Parity checking is an error-detection technique used in digital communication systems. An extra parity bit is appended to data bits so the total count of 1s is always even (even parity) or odd (odd parity), enabling single-bit error detection at the receiver.',
    detailed: `Parity checking is a crucial error-detection technique used in digital communication systems. It involves adding an extra bit (parity bit) to the data being transmitted to ensure the integrity of the data.

Parity Generator:
A parity generator adds a parity bit to the data in such a way that the total number of '1's in the data, including the parity bit, becomes either even (even parity) or odd (odd parity). This allows the receiver to detect single-bit errors.

Parity Checker:
A parity checker checks the received data and its associated parity bit to detect errors. If the number of '1's, including the parity bit, does not match the expected parity (even or odd), an error is detected.

Even Parity and Odd Parity:
The sum of the data bits and parity bits can be even or odd. In even parity, the added parity bit will make the total number of 1s an even number, whereas in odd parity, the added parity bit will make the total number of 1s an odd number.

Boolean Expressions (from K-maps on Pages 2–3):
1. Even Parity Bit Generator (4-bit data A, B, C, D):
   f = A ⊕ B ⊕ C ⊕ D
2. Even Parity Bit Checker (data A, B, C, D + parity bit P):
   f = A ⊕ B ⊕ C ⊕ D ⊕ P   (0 = No Error, 1 = Error)
3. Odd Parity Bit Generator (4-bit data A, B, C, D):
   f = ¬(A ⊕ B ⊕ C ⊕ D) = (A ⊕ B) ⊙ (C ⊕ D)
4. Odd Parity Bit Checker (data A, B, C, D + parity bit P):
   f = A ⊕ B ⊕ C ⊕ D ⊕ P   (1 = No Error, 0 = Error)`,
    keyPoints: [
      'Even parity generator outputs f = 1 when the 4-bit input word contains an odd number of 1s.',
      'Odd parity generator outputs f = 1 when the 4-bit input word contains an even number of 1s (invert of even parity).',
      'Even parity checker outputs f = 0 for no error (even total 1s across A, B, C, D, P) and f = 1 when an error occurs.',
      'Odd parity checker uses the same 4-XOR cascade on A, B, C, D, P where f = 1 means no error and f = 0 means an error.',
      'All 4 circuits are implemented using IC 7486 (Quad 2-Input XOR Gate), with IC 7404 (Hex Inverter) added for the odd parity generator.',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Connecting Wires', quantity: 18, category: 'PASSIVE' },
    { name: 'Crocodile Clips', quantity: 2, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 1, category: 'PASSIVE' },
    { name: 'Output LED', quantity: 1, spec: '5mm Diffused LED', category: 'OUTPUT' },
    { name: 'IC 7486', quantity: 1, spec: 'Quad 2-Input XOR Gate DIP-14', category: 'IC' },
    { name: 'IC 7404', quantity: 1, spec: 'Hex Inverter DIP-14 (for Odd Parity Generator)', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'even_parity_gen',
      name: 'Even Parity Bit Generator',
      subtitle: 'f = A ⊕ B ⊕ C ⊕ D (IC 7486)',
      description: 'Generates even parity bit f for 4-bit data (A, B, C, D) using three cascaded XOR gates of IC 7486.',
      ics: [
        { instanceId: 'ic_7486', partNumber: '7486', label: 'IC 7486 (Quad XOR)', rowStart: 13 },
      ],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 5, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 7, col: 'B' } },
        { id: 'in_c', label: 'C', defaultState: DigitalSignal.LOW, boardConnection: { row: 9, col: 'B' } },
        { id: 'in_d', label: 'D', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
      ],
      outputs: [
        { id: 'out_f', label: 'f', color: 'green', boardConnection: { row: 21, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc', from: { row: 13, col: 'L+' }, to: { row: 13, col: 'J' }, color: '#ef4444', label: 'IC 7486 VCC (+5V)', fromPinId: 'pwr_vcc', toPinId: 'ic_7486_pin_14' },
        { id: 'w_gnd', from: { row: 19, col: 'L-' }, to: { row: 19, col: 'A' }, color: '#1e293b', label: 'IC 7486 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7486_pin_7' },
        { id: 'w_a', from: { row: 5, col: 'B' }, to: { row: 13, col: 'E' }, color: '#3b82f6', label: 'A -> XOR1 Pin 1', fromPinId: 'sw_out_in_a', toPinId: 'ic_7486_pin_1' },
        { id: 'w_b', from: { row: 7, col: 'B' }, to: { row: 14, col: 'E' }, color: '#10b981', label: 'B -> XOR1 Pin 2', fromPinId: 'sw_out_in_b', toPinId: 'ic_7486_pin_2' },
        { id: 'w_xor1_xor2', from: { row: 15, col: 'E' }, to: { row: 16, col: 'E' }, color: '#f59e0b', label: '(A⊕B) Pin 3 -> XOR2 Pin 4', fromPinId: 'ic_7486_pin_3', toPinId: 'ic_7486_pin_4' },
        { id: 'w_c', from: { row: 9, col: 'B' }, to: { row: 17, col: 'E' }, color: '#ec4899', label: 'C -> XOR2 Pin 5', fromPinId: 'sw_out_in_c', toPinId: 'ic_7486_pin_5' },
        { id: 'w_xor2_xor3', from: { row: 18, col: 'D' }, to: { row: 18, col: 'F' }, color: '#8b5cf6', label: '(A⊕B⊕C) Pin 6 -> XOR3 Pin 9', fromPinId: 'ic_7486_pin_6', toPinId: 'ic_7486_pin_9' },
        { id: 'w_d', from: { row: 11, col: 'B' }, to: { row: 17, col: 'F' }, color: '#06b6d4', label: 'D -> XOR3 Pin 10', fromPinId: 'sw_out_in_d', toPinId: 'ic_7486_pin_10' },
        { id: 'w_out_f', from: { row: 19, col: 'F' }, to: { row: 21, col: 'I' }, color: '#22c55e', label: 'XOR3 Pin 8 -> Output f LED', fromPinId: 'ic_7486_pin_8', toPinId: 'led_in_out_f' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0, C: 0, D: 0 }, outputs: { f: 0 }, label: '0 ones (Even)' },
        { inputs: { A: 0, B: 0, C: 0, D: 1 }, outputs: { f: 1 }, label: '1 one (Add P=1)' },
        { inputs: { A: 0, B: 0, C: 1, D: 0 }, outputs: { f: 1 }, label: '1 one (Add P=1)' },
        { inputs: { A: 0, B: 0, C: 1, D: 1 }, outputs: { f: 0 }, label: '2 ones (Even)' },
        { inputs: { A: 0, B: 1, C: 0, D: 0 }, outputs: { f: 1 }, label: '1 one (Add P=1)' },
        { inputs: { A: 0, B: 1, C: 0, D: 1 }, outputs: { f: 0 }, label: '2 ones (Even)' },
        { inputs: { A: 0, B: 1, C: 1, D: 0 }, outputs: { f: 0 }, label: '2 ones (Even)' },
        { inputs: { A: 0, B: 1, C: 1, D: 1 }, outputs: { f: 1 }, label: '3 ones (Add P=1)' },
        { inputs: { A: 1, B: 0, C: 0, D: 0 }, outputs: { f: 1 }, label: '1 one (Add P=1)' },
        { inputs: { A: 1, B: 0, C: 0, D: 1 }, outputs: { f: 0 }, label: '2 ones (Even)' },
        { inputs: { A: 1, B: 0, C: 1, D: 0 }, outputs: { f: 0 }, label: '2 ones (Even)' },
        { inputs: { A: 1, B: 0, C: 1, D: 1 }, outputs: { f: 1 }, label: '3 ones (Add P=1)' },
        { inputs: { A: 1, B: 1, C: 0, D: 0 }, outputs: { f: 0 }, label: '2 ones (Even)' },
        { inputs: { A: 1, B: 1, C: 0, D: 1 }, outputs: { f: 1 }, label: '3 ones (Add P=1)' },
        { inputs: { A: 1, B: 1, C: 1, D: 0 }, outputs: { f: 1 }, label: '3 ones (Add P=1)' },
        { inputs: { A: 1, B: 1, C: 1, D: 1 }, outputs: { f: 0 }, label: '4 ones (Even)' },
      ],
      booleanExpression: {
        primary: 'f = A \\oplus B \\oplus C \\oplus D',
        intermediate: [
          '\\text{Gate 1}: X_1 = A \\oplus B',
          '\\text{Gate 2}: X_2 = (A \\oplus B) \\oplus C',
          '\\text{Gate 3}: f = X_2 \\oplus D = A \\oplus B \\oplus C \\oplus D',
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'First Pair XOR (A ⊕ B)',
          description: 'Gate 1 of IC 7486 (Pins 1, 2 -> 3) computes A ⊕ B, indicating whether bits A and B differ.',
          formulaSnippet: 'X_1 = A \\oplus B',
          highlightComponentId: 'ic_7486',
          highlightPins: [1, 2, 3],
        },
        {
          step: 2,
          title: 'Cascade with C',
          description: 'Pin 3 feeds Pin 4 of Gate 2 alongside input C on Pin 5 to produce A ⊕ B ⊕ C at Pin 6.',
          formulaSnippet: 'X_2 = (A \\oplus B) \\oplus C',
          highlightComponentId: 'ic_7486',
          highlightPins: [4, 5, 6],
        },
        {
          step: 3,
          title: 'Final XOR with D',
          description: 'Pin 6 crosses to Pin 9 of Gate 3 and XORs with D on Pin 10. Pin 8 drives the even parity LED f.',
          formulaSnippet: 'f = A \\oplus B \\oplus C \\oplus D',
          highlightComponentId: 'ic_7486',
          highlightPins: [8, 9, 10],
        },
      ],
    },
    {
      id: 'even_parity_check',
      name: 'Even Parity Bit Checker',
      subtitle: 'f = A ⊕ B ⊕ C ⊕ D ⊕ P (0=No Error, 1=Error)',
      description: 'Checks received 4-bit data (A, B, C, D) plus parity bit (P). Output f = 0 indicates valid even parity; f = 1 indicates an error.',
      ics: [
        { instanceId: 'ic_7486', partNumber: '7486', label: 'IC 7486 (Quad XOR)', rowStart: 14 },
      ],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 3, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 5, col: 'B' } },
        { id: 'in_c', label: 'C', defaultState: DigitalSignal.LOW, boardConnection: { row: 7, col: 'B' } },
        { id: 'in_d', label: 'D', defaultState: DigitalSignal.LOW, boardConnection: { row: 9, col: 'B' } },
        { id: 'in_p', label: 'P', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
      ],
      outputs: [
        { id: 'out_f', label: 'f (Error)', color: 'red', boardConnection: { row: 22, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc', from: { row: 14, col: 'L+' }, to: { row: 14, col: 'J' }, color: '#ef4444', label: 'IC 7486 VCC (+5V)', fromPinId: 'pwr_vcc', toPinId: 'ic_7486_pin_14' },
        { id: 'w_gnd', from: { row: 20, col: 'L-' }, to: { row: 20, col: 'A' }, color: '#1e293b', label: 'IC 7486 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7486_pin_7' },
        { id: 'w_a', from: { row: 3, col: 'B' }, to: { row: 14, col: 'E' }, color: '#3b82f6', label: 'A -> XOR1 Pin 1', fromPinId: 'sw_out_in_a', toPinId: 'ic_7486_pin_1' },
        { id: 'w_b', from: { row: 5, col: 'B' }, to: { row: 15, col: 'E' }, color: '#10b981', label: 'B -> XOR1 Pin 2', fromPinId: 'sw_out_in_b', toPinId: 'ic_7486_pin_2' },
        { id: 'w_xor1_xor2', from: { row: 16, col: 'E' }, to: { row: 17, col: 'E' }, color: '#f59e0b', label: 'Pin 3 -> XOR2 Pin 4', fromPinId: 'ic_7486_pin_3', toPinId: 'ic_7486_pin_4' },
        { id: 'w_c', from: { row: 7, col: 'B' }, to: { row: 18, col: 'E' }, color: '#ec4899', label: 'C -> XOR2 Pin 5', fromPinId: 'sw_out_in_c', toPinId: 'ic_7486_pin_5' },
        { id: 'w_xor2_xor3', from: { row: 19, col: 'D' }, to: { row: 19, col: 'F' }, color: '#8b5cf6', label: 'Pin 6 -> XOR3 Pin 9', fromPinId: 'ic_7486_pin_6', toPinId: 'ic_7486_pin_9' },
        { id: 'w_d', from: { row: 9, col: 'B' }, to: { row: 18, col: 'F' }, color: '#06b6d4', label: 'D -> XOR3 Pin 10', fromPinId: 'sw_out_in_d', toPinId: 'ic_7486_pin_10' },
        { id: 'w_xor3_xor4', from: { row: 20, col: 'F' }, to: { row: 16, col: 'F' }, color: '#a855f7', label: 'Pin 8 -> XOR4 Pin 12', fromPinId: 'ic_7486_pin_8', toPinId: 'ic_7486_pin_12' },
        { id: 'w_p', from: { row: 11, col: 'B' }, to: { row: 15, col: 'F' }, color: '#eab308', label: 'P -> XOR4 Pin 13', fromPinId: 'sw_out_in_p', toPinId: 'ic_7486_pin_13' },
        { id: 'w_out_f', from: { row: 17, col: 'F' }, to: { row: 22, col: 'I' }, color: '#ef4444', label: 'XOR4 Pin 11 -> Error LED', fromPinId: 'ic_7486_pin_11', toPinId: 'led_in_out_f' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0, C: 0, D: 0, P: 0 }, outputs: { 'f (Error)': 0 }, label: '0 ones -> No Error' },
        { inputs: { A: 0, B: 0, C: 0, D: 0, P: 1 }, outputs: { 'f (Error)': 1 }, label: '1 one -> Error Detected!' },
        { inputs: { A: 0, B: 0, C: 0, D: 1, P: 1 }, outputs: { 'f (Error)': 0 }, label: '2 ones -> No Error' },
        { inputs: { A: 0, B: 0, C: 1, D: 1, P: 0 }, outputs: { 'f (Error)': 0 }, label: '2 ones -> No Error' },
        { inputs: { A: 0, B: 1, C: 0, D: 1, P: 1 }, outputs: { 'f (Error)': 1 }, label: '3 ones -> Error Detected!' },
        { inputs: { A: 0, B: 1, C: 1, D: 1, P: 1 }, outputs: { 'f (Error)': 0 }, label: '4 ones -> No Error' },
        { inputs: { A: 1, B: 0, C: 0, D: 0, P: 0 }, outputs: { 'f (Error)': 1 }, label: '1 one -> Error Detected!' },
        { inputs: { A: 1, B: 0, C: 0, D: 1, P: 0 }, outputs: { 'f (Error)': 0 }, label: '2 ones -> No Error' },
        { inputs: { A: 1, B: 1, C: 1, D: 0, P: 1 }, outputs: { 'f (Error)': 0 }, label: '4 ones -> No Error' },
        { inputs: { A: 1, B: 1, C: 1, D: 1, P: 1 }, outputs: { 'f (Error)': 1 }, label: '5 ones -> Error Detected!' },
      ],
      booleanExpression: {
        primary: 'f = A \\oplus B \\oplus C \\oplus D \\oplus P\\quad (0 = \\text{No Error},\\; 1 = \\text{Error})',
        intermediate: [
          '\\text{Gate 1–3}: X = A \\oplus B \\oplus C \\oplus D',
          '\\text{Gate 4}: f = X \\oplus P',
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Compute Received Data Parity',
          description: 'Gates 1, 2, and 3 of IC 7486 XOR the four received data bits A, B, C, and D to produce Pin 8.',
          formulaSnippet: 'X = A \\oplus B \\oplus C \\oplus D',
          highlightComponentId: 'ic_7486',
          highlightPins: [1, 2, 3, 4, 5, 6, 8, 9, 10],
        },
        {
          step: 2,
          title: 'Compare with Received Parity Bit P',
          description: 'Gate 4 (Pins 12, 13 -> 11) XORs X with received parity bit P. If total 1s is even, f = 0 (No Error); if odd, f = 1 (Error).',
          formulaSnippet: 'f = X \\oplus P',
          highlightComponentId: 'ic_7486',
          highlightPins: [11, 12, 13],
        },
      ],
    },
    {
      id: 'odd_parity_gen',
      name: 'Odd Parity Bit Generator',
      subtitle: 'f = ¬(A ⊕ B ⊕ C ⊕ D) (IC 7486 + 7404)',
      description: 'Generates odd parity bit f for 4-bit data (A, B, C, D) using three cascaded XOR gates of IC 7486 followed by a NOT gate of IC 7404.',
      ics: [
        { instanceId: 'ic_7486', partNumber: '7486', label: 'IC 7486 (Quad XOR)', rowStart: 12 },
        { instanceId: 'ic_7404', partNumber: '7404', label: 'IC 7404 (Hex NOT)', rowStart: 22 },
      ],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 3, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 5, col: 'B' } },
        { id: 'in_c', label: 'C', defaultState: DigitalSignal.LOW, boardConnection: { row: 7, col: 'B' } },
        { id: 'in_d', label: 'D', defaultState: DigitalSignal.LOW, boardConnection: { row: 9, col: 'B' } },
      ],
      outputs: [
        { id: 'out_f', label: 'f', color: 'green', boardConnection: { row: 30, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc_xor', from: { row: 12, col: 'L+' }, to: { row: 12, col: 'J' }, color: '#ef4444', label: 'IC 7486 VCC (+5V)', fromPinId: 'pwr_vcc', toPinId: 'ic_7486_pin_14' },
        { id: 'w_gnd_xor', from: { row: 18, col: 'L-' }, to: { row: 18, col: 'A' }, color: '#1e293b', label: 'IC 7486 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7486_pin_7' },
        { id: 'w_vcc_not', from: { row: 22, col: 'L+' }, to: { row: 22, col: 'J' }, color: '#ef4444', label: 'IC 7404 VCC (+5V)', fromPinId: 'pwr_vcc', toPinId: 'ic_7404_pin_14' },
        { id: 'w_gnd_not', from: { row: 28, col: 'L-' }, to: { row: 28, col: 'A' }, color: '#1e293b', label: 'IC 7404 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7404_pin_7' },
        { id: 'w_a', from: { row: 3, col: 'B' }, to: { row: 12, col: 'E' }, color: '#3b82f6', label: 'A -> XOR1 Pin 1', fromPinId: 'sw_out_in_a', toPinId: 'ic_7486_pin_1' },
        { id: 'w_b', from: { row: 5, col: 'B' }, to: { row: 13, col: 'E' }, color: '#10b981', label: 'B -> XOR1 Pin 2', fromPinId: 'sw_out_in_b', toPinId: 'ic_7486_pin_2' },
        { id: 'w_xor1_xor2', from: { row: 14, col: 'E' }, to: { row: 15, col: 'E' }, color: '#f59e0b', label: 'Pin 3 -> XOR2 Pin 4', fromPinId: 'ic_7486_pin_3', toPinId: 'ic_7486_pin_4' },
        { id: 'w_c', from: { row: 7, col: 'B' }, to: { row: 16, col: 'E' }, color: '#ec4899', label: 'C -> XOR2 Pin 5', fromPinId: 'sw_out_in_c', toPinId: 'ic_7486_pin_5' },
        { id: 'w_xor2_xor3', from: { row: 17, col: 'D' }, to: { row: 17, col: 'F' }, color: '#8b5cf6', label: 'Pin 6 -> XOR3 Pin 9', fromPinId: 'ic_7486_pin_6', toPinId: 'ic_7486_pin_9' },
        { id: 'w_d', from: { row: 9, col: 'B' }, to: { row: 16, col: 'F' }, color: '#06b6d4', label: 'D -> XOR3 Pin 10', fromPinId: 'sw_out_in_d', toPinId: 'ic_7486_pin_10' },
        { id: 'w_xor3_not', from: { row: 18, col: 'F' }, to: { row: 22, col: 'E' }, color: '#f97316', label: 'XOR3 Pin 8 -> NOT Pin 1', fromPinId: 'ic_7486_pin_8', toPinId: 'ic_7404_pin_1' },
        { id: 'w_out_f', from: { row: 23, col: 'E' }, to: { row: 30, col: 'I' }, color: '#22c55e', label: 'NOT Pin 2 -> Output f LED', fromPinId: 'ic_7404_pin_2', toPinId: 'led_in_out_f' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0, C: 0, D: 0 }, outputs: { f: 1 }, label: '0 ones (Add P=1 -> Odd)' },
        { inputs: { A: 0, B: 0, C: 0, D: 1 }, outputs: { f: 0 }, label: '1 one (Already Odd)' },
        { inputs: { A: 0, B: 0, C: 1, D: 0 }, outputs: { f: 0 }, label: '1 one (Already Odd)' },
        { inputs: { A: 0, B: 0, C: 1, D: 1 }, outputs: { f: 1 }, label: '2 ones (Add P=1 -> Odd)' },
        { inputs: { A: 0, B: 1, C: 0, D: 0 }, outputs: { f: 0 }, label: '1 one (Already Odd)' },
        { inputs: { A: 0, B: 1, C: 0, D: 1 }, outputs: { f: 1 }, label: '2 ones (Add P=1 -> Odd)' },
        { inputs: { A: 0, B: 1, C: 1, D: 0 }, outputs: { f: 1 }, label: '2 ones (Add P=1 -> Odd)' },
        { inputs: { A: 0, B: 1, C: 1, D: 1 }, outputs: { f: 0 }, label: '3 ones (Already Odd)' },
        { inputs: { A: 1, B: 0, C: 0, D: 0 }, outputs: { f: 0 }, label: '1 one (Already Odd)' },
        { inputs: { A: 1, B: 0, C: 0, D: 1 }, outputs: { f: 1 }, label: '2 ones (Add P=1 -> Odd)' },
        { inputs: { A: 1, B: 0, C: 1, D: 0 }, outputs: { f: 1 }, label: '2 ones (Add P=1 -> Odd)' },
        { inputs: { A: 1, B: 0, C: 1, D: 1 }, outputs: { f: 0 }, label: '3 ones (Already Odd)' },
        { inputs: { A: 1, B: 1, C: 0, D: 0 }, outputs: { f: 1 }, label: '2 ones (Add P=1 -> Odd)' },
        { inputs: { A: 1, B: 1, C: 0, D: 1 }, outputs: { f: 0 }, label: '3 ones (Already Odd)' },
        { inputs: { A: 1, B: 1, C: 1, D: 0 }, outputs: { f: 0 }, label: '3 ones (Already Odd)' },
        { inputs: { A: 1, B: 1, C: 1, D: 1 }, outputs: { f: 1 }, label: '4 ones (Add P=1 -> Odd)' },
      ],
      booleanExpression: {
        primary: 'f = \\overline{A \\oplus B \\oplus C \\oplus D} = \\overline{(A \\oplus B) \\oplus (C \\oplus D)}',
        intermediate: [
          '\\text{Even Parity Core}: E = A \\oplus B \\oplus C \\oplus D',
          '\\text{Odd Parity Output}: f = \\overline{E}',
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Cascade 3 XOR Gates',
          description: 'IC 7486 XOR gates compute A ⊕ B ⊕ C ⊕ D at Pin 8, just like the even parity generator.',
          formulaSnippet: 'E = A \\oplus B \\oplus C \\oplus D',
          highlightComponentId: 'ic_7486',
          highlightPins: [1, 2, 3, 4, 5, 6, 8, 9, 10],
        },
        {
          step: 2,
          title: 'Invert for Odd Parity',
          description: 'Pin 8 feeds IC 7404 NOT gate Pin 1. Output Pin 2 produces f = ¬(A ⊕ B ⊕ C ⊕ D) so total 1s becomes odd.',
          formulaSnippet: 'f = \\overline{E}',
          highlightComponentId: 'ic_7404',
          highlightPins: [1, 2],
        },
      ],
    },
    {
      id: 'odd_parity_check',
      name: 'Odd Parity Bit Checker',
      subtitle: 'f = A ⊕ B ⊕ C ⊕ D ⊕ P (1=No Error, 0=Error)',
      description: 'Checks 4-bit data (A, B, C, D) plus odd parity bit (P). Output f = 1 means total 1s is odd (No Error); f = 0 means an error occurred.',
      ics: [
        { instanceId: 'ic_7486', partNumber: '7486', label: 'IC 7486 (Quad XOR)', rowStart: 14 },
      ],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 3, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 5, col: 'B' } },
        { id: 'in_c', label: 'C', defaultState: DigitalSignal.LOW, boardConnection: { row: 7, col: 'B' } },
        { id: 'in_d', label: 'D', defaultState: DigitalSignal.LOW, boardConnection: { row: 9, col: 'B' } },
        { id: 'in_p', label: 'P', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
      ],
      outputs: [
        { id: 'out_f', label: 'f (No Err)', color: 'green', boardConnection: { row: 22, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc', from: { row: 14, col: 'L+' }, to: { row: 14, col: 'J' }, color: '#ef4444', label: 'IC 7486 VCC (+5V)', fromPinId: 'pwr_vcc', toPinId: 'ic_7486_pin_14' },
        { id: 'w_gnd', from: { row: 20, col: 'L-' }, to: { row: 20, col: 'A' }, color: '#1e293b', label: 'IC 7486 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7486_pin_7' },
        { id: 'w_a', from: { row: 3, col: 'B' }, to: { row: 14, col: 'E' }, color: '#3b82f6', label: 'A -> XOR1 Pin 1', fromPinId: 'sw_out_in_a', toPinId: 'ic_7486_pin_1' },
        { id: 'w_b', from: { row: 5, col: 'B' }, to: { row: 15, col: 'E' }, color: '#10b981', label: 'B -> XOR1 Pin 2', fromPinId: 'sw_out_in_b', toPinId: 'ic_7486_pin_2' },
        { id: 'w_xor1_xor2', from: { row: 16, col: 'E' }, to: { row: 17, col: 'E' }, color: '#f59e0b', label: 'Pin 3 -> XOR2 Pin 4', fromPinId: 'ic_7486_pin_3', toPinId: 'ic_7486_pin_4' },
        { id: 'w_c', from: { row: 7, col: 'B' }, to: { row: 18, col: 'E' }, color: '#ec4899', label: 'C -> XOR2 Pin 5', fromPinId: 'sw_out_in_c', toPinId: 'ic_7486_pin_5' },
        { id: 'w_xor2_xor3', from: { row: 19, col: 'D' }, to: { row: 19, col: 'F' }, color: '#8b5cf6', label: 'Pin 6 -> XOR3 Pin 9', fromPinId: 'ic_7486_pin_6', toPinId: 'ic_7486_pin_9' },
        { id: 'w_d', from: { row: 9, col: 'B' }, to: { row: 18, col: 'F' }, color: '#06b6d4', label: 'D -> XOR3 Pin 10', fromPinId: 'sw_out_in_d', toPinId: 'ic_7486_pin_10' },
        { id: 'w_xor3_xor4', from: { row: 20, col: 'F' }, to: { row: 16, col: 'F' }, color: '#a855f7', label: 'Pin 8 -> XOR4 Pin 12', fromPinId: 'ic_7486_pin_8', toPinId: 'ic_7486_pin_12' },
        { id: 'w_p', from: { row: 11, col: 'B' }, to: { row: 15, col: 'F' }, color: '#eab308', label: 'P -> XOR4 Pin 13', fromPinId: 'sw_out_in_p', toPinId: 'ic_7486_pin_13' },
        { id: 'w_out_f', from: { row: 17, col: 'F' }, to: { row: 22, col: 'I' }, color: '#22c55e', label: 'XOR4 Pin 11 -> Status LED', fromPinId: 'ic_7486_pin_11', toPinId: 'led_in_out_f' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0, C: 0, D: 0, P: 0 }, outputs: { 'f (No Err)': 0 }, label: '0 ones -> Error!' },
        { inputs: { A: 0, B: 0, C: 0, D: 0, P: 1 }, outputs: { 'f (No Err)': 1 }, label: '1 one -> No Error' },
        { inputs: { A: 0, B: 0, C: 0, D: 1, P: 0 }, outputs: { 'f (No Err)': 1 }, label: '1 one -> No Error' },
        { inputs: { A: 0, B: 0, C: 1, D: 1, P: 0 }, outputs: { 'f (No Err)': 0 }, label: '2 ones -> Error!' },
        { inputs: { A: 0, B: 0, C: 1, D: 1, P: 1 }, outputs: { 'f (No Err)': 1 }, label: '3 ones -> No Error' },
        { inputs: { A: 0, B: 1, C: 1, D: 1, P: 0 }, outputs: { 'f (No Err)': 1 }, label: '3 ones -> No Error' },
        { inputs: { A: 0, B: 1, C: 1, D: 1, P: 1 }, outputs: { 'f (No Err)': 0 }, label: '4 ones -> Error!' },
        { inputs: { A: 1, B: 0, C: 0, D: 1, P: 1 }, outputs: { 'f (No Err)': 1 }, label: '3 ones -> No Error' },
        { inputs: { A: 1, B: 1, C: 1, D: 1, P: 0 }, outputs: { 'f (No Err)': 0 }, label: '4 ones -> Error!' },
        { inputs: { A: 1, B: 1, C: 1, D: 1, P: 1 }, outputs: { 'f (No Err)': 1 }, label: '5 ones -> No Error' },
      ],
      booleanExpression: {
        primary: 'f = A \\oplus B \\oplus C \\oplus D \\oplus P\\quad (0 = \\text{Error},\\; 1 = \\text{No Error})',
        intermediate: [
          '\\text{Total 1s Odd} \\implies f = 1\\; (\\text{Valid Odd Parity / No Error})',
          '\\text{Total 1s Even} \\implies f = 0\\; (\\text{Error Detected})',
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Four-Stage XOR Cascade',
          description: 'All 4 XOR gates on IC 7486 combine bits A, B, C, D, and odd parity bit P.',
          formulaSnippet: 'f = A \\oplus B \\oplus C \\oplus D \\oplus P',
          highlightComponentId: 'ic_7486',
          highlightPins: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13],
        },
        {
          step: 2,
          title: 'Interpret Odd Parity Checker Output',
          description: 'Per manual page 3, when the received 5-bit frame has an odd number of 1s, f = 1 (No Error). An even count gives f = 0 (Error).',
          formulaSnippet: 'f = 1\\;(\\text{OK}),\\quad f = 0\\;(\\text{Error})',
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount IC 7486 (and IC 7404 for the odd parity generator) across the center channel of the breadboard.' },
    { stepNumber: 2, instruction: 'Connect Pin 14 to +5V (VCC) and Pin 7 to GND for each IC.' },
    { stepNumber: 3, instruction: 'For Even Parity Generator: cascade 3 XOR gates of IC 7486 with inputs A, B, C, D.' },
    { stepNumber: 4, instruction: 'For Odd Parity Generator: pass the 3-XOR cascade output through a NOT gate (IC 7404).' },
    { stepNumber: 5, instruction: 'For Parity Checkers: cascade all 4 XOR gates of IC 7486 with data bits A, B, C, D and parity bit P.' },
    { stepNumber: 6, instruction: 'Connect outputs through 330Ω current-limiting resistors to the LEDs and verify all truth tables.' },
  ],
  conclusion: 'The Parity generator and checker is constructed, implemented and verified successfully.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'What is a parity bit and why is it added to transmitted data?',
      answer: 'A parity bit is an extra check bit appended to a binary message so that the total count of 1s is either even or odd, allowing the receiver to detect single-bit transmission errors.',
      hint: 'Think about simple error detection in serial communication.',
    },
    {
      id: 'v2',
      category: 'Basic',
      question: 'Which basic logic gate naturally implements an even parity generator?',
      answer: 'The Exclusive-OR (XOR) gate (IC 7486), because the XOR of n bits is 1 if and only if an odd number of input bits are 1.',
      hint: 'Check what f = A ⊕ B ⊕ C ⊕ D evaluates to.',
    },
    {
      id: 'v3',
      category: 'Intermediate',
      question: 'What is the limitation of a single parity bit checker?',
      answer: 'A single parity checker can detect any odd number of bit errors (such as 1-bit or 3-bit errors), but cannot detect an even number of bit flips (2-bit errors cancel out) and cannot locate which bit erred for correction.',
      hint: 'What happens if two bits flip simultaneously?',
    },
    {
      id: 'v4',
      category: 'Intermediate',
      question: 'Why does the Odd Parity Checker output 1 for "No Error" and 0 for "Error" in the lab manual?',
      answer: 'Because the checker uses the pure XOR cascade f = A ⊕ B ⊕ C ⊕ D ⊕ P without a final inverter. A valid odd-parity frame has an odd number of 1s, whose XOR is 1.',
      hint: 'Count the total 1s in a valid odd-parity 5-bit frame.',
    },
    {
      id: 'v5',
      category: 'Advanced',
      question: 'Why is odd parity often preferred over even parity in synchronous communication systems?',
      answer: 'Odd parity guarantees that at least one bit in every transmitted word is a 1 (avoiding all-zero words 0000...0), which helps clock recovery circuits and distinguishes idle line low from valid data.',
      hint: 'Look at row A=B=C=D=0 in both truth tables.',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'For 4-bit data A=1, B=0, C=1, D=1, what is the Even Parity bit f?',
      options: ['1', '0', 'X', 'High-Z'],
      correctIndex: 0,
      explanation: '1011 has three 1s (odd). To make the total count of 1s even (four), f = 1.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'For 4-bit data A=0, B=1, C=1, D=0, what is the Odd Parity bit f?',
      options: ['1', '0', 'Z', '2'],
      correctIndex: 0,
      explanation: '0110 has two 1s (even). Adding odd parity bit f = 1 gives three 1s (odd).',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'In an Even Parity Checker (f = A ⊕ B ⊕ C ⊕ D ⊕ P), what does f = 1 signify?',
      options: ['An error was detected in the received bits', 'No error occurred', 'All bits are 0', 'Parity bit P is 1'],
      correctIndex: 0,
      explanation: 'Even parity requires an even number of 1s across all 5 bits, which XORs to 0. Getting f = 1 means an odd number of errors occurred.',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'How many 2-input XOR gates are required inside a 5-bit parity checker?',
      options: ['4', '3', '2', '5'],
      correctIndex: 0,
      explanation: 'Four 2-input XOR gates (one full IC 7486) are needed to XOR 5 inputs A, B, C, D, and P.',
    },
  ],
  commonMistakes: [
    {
      title: 'Confusing Even vs. Odd Checker Output Polarity',
      mistake: 'Expecting f = 0 for "No Error" on both Even and Odd parity checkers.',
      remedy: 'Using a pure XOR cascade without a trailing inverter gives 0 = No Error for Even Parity, and 1 = No Error for Odd Parity.',
      impact: 'Misinterpreting valid transmissions as errors.',
    },
    {
      title: 'Leaving Gate Inputs Floating on IC 7486',
      mistake: 'Connecting only A, B, C, D while leaving unused XOR gate inputs unconnected.',
      remedy: 'Verify Pin 9, 10, 12, 13 connections carefully so each cascaded stage receives the output of the prior XOR gate.',
      impact: 'Incorrect or unstable parity output.',
    },
  ],
};
