import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP6_BCD_ADDER: Experiment = {
  id: 'exp6',
  experimentNumber: 6,
  title: 'Realization of BCD Adder',
  aim: 'To study the design and working of a Binary Coded Decimal (BCD) adder.',
  theory: {
    summary: 'A BCD adder adds two decimal digits encoded in 4-bit binary (0000-1001) and generates a valid BCD sum. When the sum exceeds 9 or produces a binary carry, an automatic correction factor of +6 (0110 in binary) is added.',
    detailed: `A Binary Coded Decimal (BCD) adder is a combinational circuit that adds two decimal digits in BCD form and produces the sum in BCD form. In BCD, each decimal digit (0-9) is represented by a 4-bit binary number (0000 to 1001).

When two BCD digits are added using binary addition, the result may be:
1. Less than or equal to 9 (0000-1001): The sum is already a valid BCD digit and no correction is needed.
2. Greater than 9 (1010-1111) or if there is a carry from the 4-bit adder: The sum is invalid in BCD and requires correction by adding 0110 (decimal 6).

Method for BCD Addition:
1. Add two BCD numbers using ordinary 4-bit binary addition (IC 7483 Adder 1).
2. If the 4-bit sum <= 9 and there is no carry (C4=0), the sum is valid BCD.
3. If the 4-bit sum > 9 or C4=1, the sum is invalid BCD.
4. To correct the invalid sum:
   - Add 0110 (decimal 6) to the 4-bit sum using a second binary adder (IC 7483 Adder 2).
   - If this correction produces a carry, it indicates the carry to the next higher-order BCD decade (C').

Logic for Detecting Sum > 9:
From K-map on page 17 of the manual:
F = S3·S2 + S3·S1 = S3(S2 + S1)
Net Correction Carry: C' = C4 + S3(S2 + S1)

Implementation:
- Adder 1 (IC 7483): Computes raw binary sum S3 S2 S1 S0 and carry C4.
- Logic gates (7408 AND, 7432 OR): Compute correction signal C'.
- Adder 2 (IC 7483): Adds original sum to 0 C' C' 0. When C'=1, this injects 0110 (+6).`,
    keyPoints: [
      'Valid BCD digits range only from 0 (0000) to 9 (1001). States 1010 to 1111 are illegal in BCD.',
      'Sum > 9 condition is detected by logic equation: F = S3(S2 + S1).',
      'Net BCD carry condition: C\' = C4 + S3(S2 + S1).',
      'Correction value added is +6 (0110_2) to skip over the 6 unused states.',
      'Built using two 7483 4-bit binary adders plus 7408 AND and 7432 OR gates.',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Connecting Wires', quantity: 30, category: 'PASSIVE' },
    { name: '5V Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Crocodile Clips', quantity: 2, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 5, category: 'PASSIVE' },
    { name: 'Output LEDs (BCD Sum & Carry)', quantity: 5, spec: 'Green & Red Diffused', category: 'OUTPUT' },
    { name: 'IC 7483 (Adder 1)', quantity: 1, spec: '4-Bit Binary Full Adder DIP-16', category: 'IC' },
    { name: 'IC 7483 (Adder 2)', quantity: 1, spec: '4-Bit Binary Full Adder DIP-16', category: 'IC' },
    { name: 'IC 7408', quantity: 1, spec: 'Quad 2-Input AND Gate DIP-14', category: 'IC' },
    { name: 'IC 7432', quantity: 1, spec: 'Quad 2-Input OR Gate DIP-14', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'bcd_adder',
      name: '4-Bit BCD Adder with Correction',
      subtitle: '2x IC 7483 + 7408 AND + 7432 OR',
      description: 'Adds two 4-bit BCD digits (A3..A0 + B3..B0), automatically detects sum > 9 or C4=1, and adds +6 (0110) correction.',
      ics: [
        { instanceId: 'ic_7483_1', partNumber: '7483', label: 'IC 7483 (Adder 1)', rowStart: 4 },
        { instanceId: 'ic_7408', partNumber: '7408', label: 'IC 7408 (AND)', rowStart: 14 },
        { instanceId: 'ic_7432', partNumber: '7432', label: 'IC 7432 (OR)', rowStart: 23 },
        { instanceId: 'ic_7483_2', partNumber: '7483', label: 'IC 7483 (Adder 2)', rowStart: 33 },
      ],
      inputs: [
        { id: 'in_a3', label: 'A3', defaultState: DigitalSignal.LOW, boardConnection: { row: 4, col: 'B' } },
        { id: 'in_a2', label: 'A2', defaultState: DigitalSignal.LOW, boardConnection: { row: 5, col: 'B' } },
        { id: 'in_a1', label: 'A1', defaultState: DigitalSignal.LOW, boardConnection: { row: 6, col: 'B' } },
        { id: 'in_a0', label: 'A0', defaultState: DigitalSignal.LOW, boardConnection: { row: 7, col: 'B' } },
        { id: 'in_b3', label: 'B3', defaultState: DigitalSignal.LOW, boardConnection: { row: 8, col: 'B' } },
        { id: 'in_b2', label: 'B2', defaultState: DigitalSignal.LOW, boardConnection: { row: 9, col: 'B' } },
        { id: 'in_b1', label: 'B1', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } },
        { id: 'in_b0', label: 'B0', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
      ],
      outputs: [
        { id: 'out_cout', label: 'BCD Carry (C\')', color: 'red', boardConnection: { row: 24, col: 'I' } },
        { id: 'out_s3', label: 'S\'3', color: 'green', boardConnection: { row: 33, col: 'I' } },
        { id: 'out_s2', label: 'S\'2', color: 'green', boardConnection: { row: 34, col: 'I' } },
        { id: 'out_s1', label: 'S\'1', color: 'green', boardConnection: { row: 35, col: 'I' } },
        { id: 'out_s0', label: 'S\'0', color: 'green', boardConnection: { row: 36, col: 'I' } },
      ],
      wires: [
        // Power & GND for ICs
        // Adder 1 (rowStart 4, DIP-16): Pin 5 is VCC (row 8), Pin 12 is GND (row 8, col F), Pin 13 is C0 (row 7, col F)
        { id: 'w_vcc_add1', from: { row: 8, col: 'L+' }, to: { row: 8, col: 'E' }, color: '#ef4444', label: 'Adder 1 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7483_1_pin_5' },
        { id: 'w_gnd_add1', from: { row: 8, col: 'L-' }, to: { row: 8, col: 'F' }, color: '#1e293b', label: 'Adder 1 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7483_1_pin_12' },
        { id: 'w_cin_add1', from: { row: 7, col: 'L-' }, to: { row: 7, col: 'F' }, color: '#1e293b', label: 'Adder 1 C0=0', fromPinId: 'pwr_gnd', toPinId: 'ic_7483_1_pin_13' },

        // 7408 AND (rowStart 14, DIP-14): Pin 14 is VCC (row 14, col F), Pin 7 is GND (row 20, col E)
        { id: 'w_vcc_and', from: { row: 14, col: 'L+' }, to: { row: 14, col: 'F' }, color: '#ef4444', label: '7408 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7408_pin_14' },
        { id: 'w_gnd_and', from: { row: 20, col: 'L-' }, to: { row: 20, col: 'E' }, color: '#1e293b', label: '7408 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7408_pin_7' },

        // 7432 OR (rowStart 23, DIP-14): Pin 14 is VCC (row 23, col F), Pin 7 is GND (row 29, col E)
        { id: 'w_vcc_or', from: { row: 23, col: 'L+' }, to: { row: 23, col: 'F' }, color: '#ef4444', label: '7432 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7432_pin_14' },
        { id: 'w_gnd_or', from: { row: 29, col: 'L-' }, to: { row: 29, col: 'E' }, color: '#1e293b', label: '7432 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7432_pin_7' },

        // Adder 2 (rowStart 33, DIP-16): Pin 5 is VCC (row 37, col E), Pin 12 is GND (row 37, col F), Pin 13 is C0 (row 36, col F)
        { id: 'w_vcc_add2', from: { row: 37, col: 'L+' }, to: { row: 37, col: 'E' }, color: '#ef4444', label: 'Adder 2 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7483_2_pin_5' },
        { id: 'w_gnd_add2', from: { row: 37, col: 'L-' }, to: { row: 37, col: 'F' }, color: '#1e293b', label: 'Adder 2 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7483_2_pin_12' },
        { id: 'w_cin_add2', from: { row: 36, col: 'L-' }, to: { row: 36, col: 'F' }, color: '#1e293b', label: 'Adder 2 C0=0', fromPinId: 'pwr_gnd', toPinId: 'ic_7483_2_pin_13' },

        // Inputs A3..A0 to Adder 1: pin 1 (A3: row 4, col E), pin 3 (A2: row 6, col E), pin 8 (A1: row 11, col E), pin 10 (A0: row 10, col F)
        { id: 'w_a3', from: { row: 4, col: 'B' }, to: { row: 4, col: 'E' }, color: '#3b82f6', label: 'A3 -> Pin 1', fromPinId: 'sw_out_in_a3', toPinId: 'ic_7483_1_pin_1' },
        { id: 'w_a2', from: { row: 5, col: 'B' }, to: { row: 6, col: 'E' }, color: '#3b82f6', label: 'A2 -> Pin 3', fromPinId: 'sw_out_in_a2', toPinId: 'ic_7483_1_pin_3' },
        { id: 'w_a1', from: { row: 6, col: 'B' }, to: { row: 11, col: 'E' }, color: '#3b82f6', label: 'A1 -> Pin 8', fromPinId: 'sw_out_in_a1', toPinId: 'ic_7483_1_pin_8' },
        { id: 'w_a0', from: { row: 7, col: 'B' }, to: { row: 10, col: 'F' }, color: '#3b82f6', label: 'A0 -> Pin 10', fromPinId: 'sw_out_in_a0', toPinId: 'ic_7483_1_pin_10' },

        // Inputs B3..B0 to Adder 1: pin 16 (B3: row 4, col F), pin 4 (B2: row 7, col E), pin 7 (B1: row 10, col E), pin 11 (B0: row 9, col F)
        { id: 'w_b3', from: { row: 8, col: 'B' }, to: { row: 4, col: 'F' }, color: '#10b981', label: 'B3 -> Pin 16', fromPinId: 'sw_out_in_b3', toPinId: 'ic_7483_1_pin_16' },
        { id: 'w_b2', from: { row: 9, col: 'B' }, to: { row: 7, col: 'E' }, color: '#10b981', label: 'B2 -> Pin 4', fromPinId: 'sw_out_in_b2', toPinId: 'ic_7483_1_pin_4' },
        { id: 'w_b1', from: { row: 10, col: 'B' }, to: { row: 10, col: 'E' }, color: '#10b981', label: 'B1 -> Pin 7', fromPinId: 'sw_out_in_b1', toPinId: 'ic_7483_1_pin_7' },
        { id: 'w_b0', from: { row: 11, col: 'B' }, to: { row: 9, col: 'F' }, color: '#10b981', label: 'B0 -> Pin 11', fromPinId: 'sw_out_in_b0', toPinId: 'ic_7483_1_pin_11' },

        // Adder 1 Sums to Adder 2 Primary Inputs:
        // S3 (Adder 1 pin 15: row 5, col F) -> Adder 2 pin 1 (A3: row 33, col E)
        // S2 (Adder 1 pin 2: row 5, col E)  -> Adder 2 pin 3 (A2: row 35, col E)
        // S1 (Adder 1 pin 6: row 9, col E)  -> Adder 2 pin 8 (A1: row 40, col E)
        // S0 (Adder 1 pin 9: row 11, col F) -> Adder 2 pin 10 (A0: row 39, col F)
        { id: 'w_add1_s3_to_add2', from: { row: 5, col: 'F' }, to: { row: 33, col: 'E' }, color: '#8b5cf6', label: 'S3 -> Add2 A3', fromPinId: 'ic_7483_1_pin_15', toPinId: 'ic_7483_2_pin_1' },
        { id: 'w_add1_s2_to_add2', from: { row: 5, col: 'E' }, to: { row: 35, col: 'E' }, color: '#8b5cf6', label: 'S2 -> Add2 A2', fromPinId: 'ic_7483_1_pin_2', toPinId: 'ic_7483_2_pin_3' },
        { id: 'w_add1_s1_to_add2', from: { row: 9, col: 'E' }, to: { row: 40, col: 'E' }, color: '#8b5cf6', label: 'S1 -> Add2 A1', fromPinId: 'ic_7483_1_pin_6', toPinId: 'ic_7483_2_pin_8' },
        { id: 'w_add1_s0_to_add2', from: { row: 11, col: 'F' }, to: { row: 39, col: 'F' }, color: '#8b5cf6', label: 'S0 -> Add2 A0', fromPinId: 'ic_7483_1_pin_9', toPinId: 'ic_7483_2_pin_10' },

        // Detection Logic: F = S3 * (S2 + S1)
        // 1. (S2 + S1) into 7432 Gate 1 (pins 1, 2 -> 3: rows 23, 24 -> 25, col E)
        { id: 'w_s2_to_or', from: { row: 5, col: 'D' }, to: { row: 23, col: 'E' }, color: '#f59e0b', label: 'S2 -> OR pin 1', fromPinId: 'ic_7483_1_pin_2', toPinId: 'ic_7432_pin_1' },
        { id: 'w_s1_to_or', from: { row: 9, col: 'D' }, to: { row: 24, col: 'E' }, color: '#f59e0b', label: 'S1 -> OR pin 2', fromPinId: 'ic_7483_1_pin_6', toPinId: 'ic_7432_pin_2' },

        // 2. S3 * (S2+S1) into 7408 Gate 1 (pins 1, 2 -> 3: rows 14, 15 -> 16, col E)
        { id: 'w_s3_to_and', from: { row: 5, col: 'G' }, to: { row: 14, col: 'E' }, color: '#ec4899', label: 'S3 -> AND pin 1', fromPinId: 'ic_7483_1_pin_15', toPinId: 'ic_7408_pin_1' },
        { id: 'w_or_out_to_and', from: { row: 25, col: 'E' }, to: { row: 15, col: 'E' }, color: '#f59e0b', label: '(S2+S1) -> AND pin 2', fromPinId: 'ic_7432_pin_3', toPinId: 'ic_7408_pin_2' },

        // 3. C' = C4 + F into 7432 Gate 2 (pins 4, 5 -> 6: rows 26, 27 -> 28, col E)
        // C4 is Adder 1 Pin 14 (row 6, col F). F is 7408 Pin 3 (row 16, col E).
        { id: 'w_c4_to_or2', from: { row: 6, col: 'F' }, to: { row: 26, col: 'E' }, color: '#ef4444', label: 'C4 -> OR pin 4', fromPinId: 'ic_7483_1_pin_14', toPinId: 'ic_7432_pin_4' },
        { id: 'w_f_to_or2', from: { row: 16, col: 'E' }, to: { row: 27, col: 'E' }, color: '#ec4899', label: 'F -> OR pin 5', fromPinId: 'ic_7408_pin_3', toPinId: 'ic_7432_pin_5' },

        // 4. C' output (7432 pin 6: row 28, col E) feeds:
        // - Carry LED (out_cout: row 24, col I)
        // - Adder 2 pin 4 (B2: row 36, col E)
        // - Adder 2 pin 7 (B1: row 39, col E)
        { id: 'w_cout_led', from: { row: 28, col: 'E' }, to: { row: 24, col: 'I' }, color: '#ef4444', label: 'C\' -> Carry LED', fromPinId: 'ic_7432_pin_6', toPinId: 'led_in_out_cout' },
        { id: 'w_cp_to_add2_b2', from: { row: 28, col: 'D' }, to: { row: 36, col: 'E' }, color: '#ef4444', label: 'C\' -> Add2 B2', fromPinId: 'ic_7432_pin_6', toPinId: 'ic_7483_2_pin_4' },
        { id: 'w_cp_to_add2_b1', from: { row: 28, col: 'C' }, to: { row: 39, col: 'E' }, color: '#ef4444', label: 'C\' -> Add2 B1', fromPinId: 'ic_7432_pin_6', toPinId: 'ic_7483_2_pin_7' },

        // Adder 2 B3 and B0 must be tied to GND (0):
        // B3 is pin 16 (row 33, col F), B0 is pin 11 (row 38, col F)
        { id: 'w_add2_b3_gnd', from: { row: 33, col: 'R-' }, to: { row: 33, col: 'J' }, color: '#1e293b', label: 'Add2 B3=0', fromPinId: 'pwr_gnd', toPinId: 'ic_7483_2_pin_16' },
        { id: 'w_add2_b0_gnd', from: { row: 38, col: 'R-' }, to: { row: 38, col: 'J' }, color: '#1e293b', label: 'Add2 B0=0', fromPinId: 'pwr_gnd', toPinId: 'ic_7483_2_pin_11' },

        // Final Outputs from Adder 2 to LEDs:
        // S'3 (Adder 2 pin 15: row 34, col F) -> out_s3 (row 33, col I)
        // S'2 (Adder 2 pin 2: row 34, col E)  -> out_s2 (row 34, col I)
        // S'1 (Adder 2 pin 6: row 38, col E)  -> out_s1 (row 35, col I)
        // S'0 (Adder 2 pin 9: row 40, col F)  -> out_s0 (row 36, col I)
        { id: 'w_s3_led', from: { row: 34, col: 'F' }, to: { row: 33, col: 'I' }, color: '#22c55e', label: 'S\'3 -> LED', fromPinId: 'ic_7483_2_pin_15', toPinId: 'led_in_out_s3' },
        { id: 'w_s2_led', from: { row: 34, col: 'E' }, to: { row: 34, col: 'I' }, color: '#22c55e', label: 'S\'2 -> LED', fromPinId: 'ic_7483_2_pin_2', toPinId: 'led_in_out_s2' },
        { id: 'w_s1_led', from: { row: 38, col: 'E' }, to: { row: 35, col: 'I' }, color: '#22c55e', label: 'S\'1 -> LED', fromPinId: 'ic_7483_2_pin_6', toPinId: 'led_in_out_s1' },
        { id: 'w_s0_led', from: { row: 40, col: 'F' }, to: { row: 36, col: 'I' }, color: '#22c55e', label: 'S\'0 -> LED', fromPinId: 'ic_7483_2_pin_9', toPinId: 'led_in_out_s0' },
      ],
      truthTable: [
        { inputs: { A3: 0, A2: 0, A1: 1, A0: 0, B3: 0, B2: 0, B1: 1, B0: 1 }, outputs: { "C'": 0, "S'3": 0, "S'2": 1, "S'1": 0, "S'0": 1 }, label: '2 + 3 = 5 (Valid BCD, No correction)' },
        { inputs: { A3: 0, A2: 1, A1: 0, A0: 0, B3: 0, B2: 0, B1: 1, B0: 1 }, outputs: { "C'": 0, "S'3": 0, "S'2": 1, "S'1": 1, "S'0": 1 }, label: '4 + 3 = 7 (Valid BCD, No correction)' },
        { inputs: { A3: 0, A2: 1, A1: 0, A0: 1, B3: 0, B2: 1, B1: 0, B0: 0 }, outputs: { "C'": 0, "S'3": 1, "S'2": 0, "S'1": 0, "S'0": 1 }, label: '5 + 4 = 9 (Valid BCD, Boundary max)' },
        { inputs: { A3: 0, A2: 1, A1: 1, A0: 0, B3: 0, B2: 1, B1: 0, B0: 1 }, outputs: { "C'": 1, "S'3": 0, "S'2": 0, "S'1": 0, "S'0": 1 }, label: '6 + 5 = 11 (Sum > 9! Add 6 -> 17_10 = BCD 1 0001)' },
        { inputs: { A3: 0, A2: 1, A1: 1, A0: 1, B3: 0, B2: 1, B1: 1, B0: 0 }, outputs: { "C'": 1, "S'3": 0, "S'2": 0, "S'1": 1, "S'0": 1 }, label: '7 + 6 = 13 (Sum > 9! Add 6 -> 19_10 = BCD 1 0011)' },
        { inputs: { A3: 1, A2: 0, A1: 0, A0: 0, B3: 1, B2: 0, B1: 0, B0: 0 }, outputs: { "C'": 1, "S'3": 0, "S'2": 1, "S'1": 1, "S'0": 0 }, label: '8 + 8 = 16 (C4=1! Add 6 -> BCD 1 0110)' },
        { inputs: { A3: 1, A2: 0, A1: 0, A0: 1, B3: 1, B2: 0, B1: 0, B0: 1 }, outputs: { "C'": 1, "S'3": 1, "S'2": 0, "S'1": 0, "S'0": 0 }, label: '9 + 9 = 18 (C4=1! Add 6 -> BCD 1 1000)' },
      ],
      booleanExpression: {
        primary: 'C\' = C_4 + S_3(S_2 + S_1),\\quad \\text{Correction} = (0, C\', C\', 0)_2',
        intermediate: [
          '\\text{Adder 1 Sum}: S_3 S_2 S_1 S_0,\\; C_4',
          '\\text{Invalid Sum Detect}: F = S_3 S_2 + S_3 S_1 = S_3(S_2 + S_1)',
          '\\text{Net BCD Carry}: C\' = C_4 + F = C_4 + S_3(S_2 + S_1)',
          '\\text{Adder 2 Adds}: S_3 S_2 S_1 S_0 + 0 C\' C\' 0_2',
          '\\text{Final BCD Result}: C\'\\; [S\'_3 S\'_2 S\'_1 S\'_0]',
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Initial 4-Bit Binary Addition',
          description: 'Adder 1 (IC 7483) adds the 4 bits of digit A and 4 bits of digit B, producing initial binary sum S3..S0 and carry C4.',
          formulaSnippet: 'S = A + B,\\quad C_4',
          highlightComponentId: 'ic_7483_1',
        },
        {
          step: 2,
          title: 'Invalid BCD Detection (Sum > 9)',
          description: 'An OR gate checks (S2 + S1). An AND gate checks S3·(S2 + S1). This evaluates to 1 whenever the sum is 10, 11, 12, 13, 14, or 15.',
          formulaSnippet: 'F = S_3(S_2 + S_1)',
          highlightComponentId: 'ic_7408',
        },
        {
          step: 3,
          title: 'Correction Trigger (C\')',
          description: 'A second OR gate checks C4 + F. If C4=1 (sum ≥ 16) or F=1 (sum > 9), C\' goes HIGH, indicating BCD overflow.',
          formulaSnippet: 'C\' = C_4 + S_3(S_2 + S_1)',
          highlightComponentId: 'ic_7432',
        },
        {
          step: 4,
          title: 'BCD Correction (+6 Addition)',
          description: 'C\' is fed into bit 1 and bit 2 of Adder 2, adding 0110 (+6) when C\'=1 and 0000 (+0) when C\'=0.',
          formulaSnippet: '\\text{Corrected Sum} = S + 0 C\' C\' 0_2',
          highlightComponentId: 'ic_7483_2',
        },
        {
          step: 5,
          title: 'Final BCD Output',
          description: 'The output carry LED indicates the tens digit (0 or 1), and LEDs S\'3..S\'0 display the units BCD digit (0-9).',
          formulaSnippet: 'C\'\\; [S\'_3 S\'_2 S\'_1 S\'_0]',
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount two IC 7483 4-bit binary adders, one IC 7408 (AND), and one IC 7432 (OR) on the breadboard.' },
    { stepNumber: 2, instruction: 'Connect VCC (+5V) to Pin 5 and GND to Pin 12 of both 7483 ICs.' },
    { stepNumber: 3, instruction: 'Connect VCC to Pin 14 and GND to Pin 7 of the 7408 and 7432 ICs.' },
    { stepNumber: 4, instruction: 'Wire inputs A3..A0 and B3..B0 from switch modules to Adder 1.' },
    { stepNumber: 5, instruction: 'Connect S1, S2 to the OR gate, then AND with S3 to detect sum > 9.' },
    { stepNumber: 6, instruction: 'OR the detection output with C4 to generate the net carry C\'.' },
    { stepNumber: 7, instruction: 'Feed S3..S0 into the primary inputs of Adder 2, and connect 0 C\' C\' 0 to the secondary inputs.' },
    { stepNumber: 8, instruction: 'Verify both non-correction cases (e.g. 4+3=7) and correction cases (e.g. 7+6=13, 9+9=18).' },
  ],
  conclusion: 'The BCD adder was successfully constructed using 4-bit parallel adders and correction logic gates, and its arithmetic operation was verified across valid and invalid sum states.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'What is BCD code and how many bits represent each decimal digit?',
      answer: 'BCD (Binary Coded Decimal) represents each decimal digit from 0 to 9 using a 4-bit binary code (0000 to 1001).',
      hint: 'Decimal digits are 0 through 9.',
    },
    {
      id: 'v2',
      category: 'Intermediate',
      question: 'Why is it necessary to add 6 (0110 in binary) when the binary sum exceeds 9?',
      answer: 'Because a 4-bit binary adder has 16 possible states (0 to 15), but decimal arithmetic has only 10 states (0 to 9). Adding 6 skips over the 6 invalid binary states (1010 to 1111) to advance to the correct next-decade count.',
      hint: 'Consider the difference between radix 16 and radix 10.',
    },
    {
      id: 'v3',
      category: 'Advanced',
      question: 'Derive the Boolean equation for detecting when a 4-bit sum exceeds 9.',
      answer: 'For numbers 10 to 15, S3 is always 1. Numbers 10 and 11 have S1=1 (S3·S1). Numbers 12 to 15 have S2=1 (S3·S2). Factoring gives F = S3·S2 + S3·S1 = S3(S2 + S1).',
      hint: 'Look at the K-map on page 17 of the manual.',
    },
    {
      id: 'v4',
      category: 'Intermediate',
      question: 'Why must the carry output C4 of Adder 1 also trigger the +6 correction?',
      answer: 'Because when adding large valid BCD digits (such as 8 + 8 = 16 or 9 + 9 = 18), the binary sum produces a carry out C4=1 while S3..S0 is 0000 or 0010 (≤ 9). Without C4, the circuit would fail to add 6.',
      hint: 'What happens when 8 + 9 = 17 (binary 1 0001)?',
    },
    {
      id: 'v5',
      category: 'Basic',
      question: 'What are the power and ground pins of IC 7483 (4-bit binary adder)?',
      answer: 'Pin 5 is VCC (+5V) and Pin 12 is GND (Ground), which differs from standard DIP-16 chips where Pin 16 is VCC and Pin 8 is GND.',
      hint: 'Check page 17 of the laboratory manual.',
    },
    {
      id: 'v6',
      category: 'Advanced',
      question: 'What is the maximum possible sum generated when adding two single-digit BCD numbers with an input carry?',
      answer: '9 (A) + 9 (B) + 1 (Cin) = 19 (in binary 10011_2). Adding 6 (00110_2) yields binary 11001_2, representing BCD 1 (carry) and 9 (sum bits), correctly representing decimal 19.',
      hint: '9 + 9 + 1 = 19.',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'When adding BCD digits 7 (0111) and 6 (0110), what is the initial 4-bit sum from Adder 1 before correction?',
      options: ['1101 (13)', '0110 (6)', '0011 (3)', '1111 (15)'],
      correctIndex: 0,
      explanation: '7 + 6 = 13, which is 1101 in binary.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'What correction value is added to an invalid BCD sum?',
      options: ['0110 (+6)', '0100 (+4)', '1000 (+8)', '0011 (+3)'],
      correctIndex: 0,
      explanation: 'Adding 0110 (decimal 6) corrects for the 6 unused states in 4-bit binary representation.',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'For BCD addition of 8 (1000) and 9 (1001), what is the final BCD output (Carry, S\'3..S\'0)?',
      options: ['Carry = 1, Sum = 0111 (Decimal 17)', 'Carry = 0, Sum = 1111', 'Carry = 1, Sum = 0001', 'Carry = 0, Sum = 0111'],
      correctIndex: 0,
      explanation: '8 + 9 = 17 (binary 10001). Adding 6 gives 10111 -> Carry = 1, units digit = 0111 (7).',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'Which logic expression correctly detects if a 4-bit binary sum S3 S2 S1 S0 is greater than 9?',
      options: ['S3(S2 + S1)', 'S3 + S2 + S1', 'S3 S2 S1', 'S3 + S2 S1'],
      correctIndex: 0,
      explanation: 'Numbers 10-15 have S3=1 and either S2=1 (12-15) or S1=1 (10-11), yielding S3(S2 + S1).',
    },
    {
      id: 'q5',
      type: 'MCQ',
      question: 'In IC 7483, which pin is used for the carry input (C0)?',
      options: ['Pin 13', 'Pin 14', 'Pin 5', 'Pin 12'],
      correctIndex: 0,
      explanation: 'Pin 13 is C0 (carry input) and Pin 14 is C4 (carry output) on IC 7483.',
    },
  ],
  commonMistakes: [
    {
      title: 'Forgetting C4 in the Correction Logic',
      mistake: 'Detecting sum > 9 using only S3(S2+S1) without including carry C4 from Adder 1.',
      remedy: 'Always OR the detection term with C4: C\' = C4 + S3(S2+S1). For sums like 8+8=16 or 9+9=18, S3=0 and C4=1.',
      impact: 'Sums >= 16 will fail to correct, leading to incorrect BCD outputs.',
    },
    {
      title: 'Connecting Wrong Pins on IC 7483',
      mistake: 'Misidentifying the non-standard pin order of IC 7483.',
      remedy: 'Consult the manual pinout on page 17: Pin 5 is VCC, Pin 12 is GND, Pin 13 is C0, Pin 14 is C4.',
      impact: 'Short circuit or incorrect addition bits.',
    },
  ],
};
