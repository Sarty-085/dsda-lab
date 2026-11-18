import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP8_MUX_DEMUX: Experiment = {
  id: 'exp8',
  experimentNumber: 8,
  title: 'Multiplexer and Demultiplexer',
  aim: 'To design and implement Multiplexer and Demultiplexer using logic gates.',
  theory: {
    summary:
      'A Multiplexer (MUX) selects one of several binary input lines and routes it to a single common output line based on select bits. A Demultiplexer (DEMUX) performs the reverse operation, distributing a single input line to one of 2^n output lines.',
    detailed: `MULTIPLEXER (4:1 MUX):
Multiplexer means transmitting a large number of information units over a smaller number of channels or lines. A digital multiplexer is a combinational circuit that selects binary information from one of many input lines and directs it to a single output line. The selection of a particular input line is controlled by a set of selection lines. Normally there are 2^n input lines and n selection lines whose bit combination determines which input is selected.

For a 4:1 Multiplexer:
- Data Inputs: D0, D1, D2, D3
- Select Inputs: S1, S0
- Boolean Expression (Manual Page 22):
  Z = D0·S1'·S0' + D1·S1'·S0 + D2·S1·S0' + D3·S1·S0

DEMULTIPLEXER (1:4 DEMUX):
The function of a Demultiplexer is in contrast to multiplexer function. It takes information from one line and distributes it to a given number of output lines. For this reason, the demultiplexer is also known as a data distributor. Decoder can also be used as demultiplexer. In the 1:4 demultiplexer circuit, the data input line goes to all of the AND gates. The data select lines enable only one gate at a time and the data on the data input line will pass through the selected gate to the associated data output line.

For a 1:4 Demultiplexer:
- Data Input: D
- Select Inputs: S1, S0
- Outputs (Manual Page 23):
  O0 = D·S1'·S0'
  O1 = D·S1'·S0
  O2 = D·S1·S0'
  O3 = D·S1·S0`,
    keyPoints: [
      'A 4:1 MUX has 2^2 = 4 data inputs (D0–D3), 2 select lines (S1, S0), and 1 output (Z).',
      'A 1:4 DEMUX acts as a data distributor with 1 input (D), 2 select lines (S1, S0), and 4 outputs (O0–O3).',
      'Both circuits are constructed from basic gates: 2x NOT (7404), 4x 3-input AND (7411), plus 3x 2-input OR (7432) for the MUX.',
      'Only one 3-input AND gate is enabled for any select combination (S1, S0), blocking all other channels.',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Connecting Wires', quantity: 26, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 4, category: 'PASSIVE' },
    { name: 'Output LEDs', quantity: 4, spec: 'Red / Green 5mm LEDs', category: 'OUTPUT' },
    { name: 'IC 7404', quantity: 1, spec: 'Hex Inverter (NOT) DIP-14', category: 'IC' },
    { name: 'IC 7411', quantity: 2, spec: 'Triple 3-Input AND Gate DIP-14', category: 'IC' },
    { name: 'IC 7432', quantity: 1, spec: 'Quad 2-Input OR Gate DIP-14 (for 4:1 MUX)', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'mux_4to1',
      name: '4:1 Multiplexer using Logic Gates',
      subtitle: 'IC 7404 (NOT) + 2× IC 7411 (3-In AND) + IC 7432 (OR)',
      description: 'Routes one of four inputs (D0, D1, D2, D3) to output Z based on select lines (S1, S0).',
      ics: [
        { instanceId: 'ic_7404', partNumber: '7404', label: 'IC 7404 (NOT)', rowStart: 3 },
        { instanceId: 'ic_7411_1', partNumber: '7411', label: 'IC 7411 #1 (AND)', rowStart: 13 },
        { instanceId: 'ic_7411_2', partNumber: '7411', label: 'IC 7411 #2 (AND)', rowStart: 23 },
        { instanceId: 'ic_7432', partNumber: '7432', label: 'IC 7432 (OR)', rowStart: 33 },
      ],
      inputs: [
        { id: 'in_s1', label: 'S1', defaultState: DigitalSignal.LOW, boardConnection: { row: 1, col: 'B' } },
        { id: 'in_s0', label: 'S0', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } },
        { id: 'in_d0', label: 'D0', defaultState: DigitalSignal.LOW, boardConnection: { row: 12, col: 'B' } },
        { id: 'in_d1', label: 'D1', defaultState: DigitalSignal.LOW, boardConnection: { row: 20, col: 'B' } },
        { id: 'in_d2', label: 'D2', defaultState: DigitalSignal.LOW, boardConnection: { row: 22, col: 'B' } },
        { id: 'in_d3', label: 'D3', defaultState: DigitalSignal.LOW, boardConnection: { row: 31, col: 'B' } },
      ],
      outputs: [
        { id: 'out_z', label: 'Z', color: 'green', boardConnection: { row: 40, col: 'I' } },
      ],
      wires: [
        // Power & GND
        { id: 'w_vcc_not', from: { row: 3, col: 'L+' }, to: { row: 3, col: 'J' }, color: '#ef4444', label: '7404 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7404_pin_14' },
        { id: 'w_gnd_not', from: { row: 9, col: 'L-' }, to: { row: 9, col: 'A' }, color: '#1e293b', label: '7404 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7404_pin_7' },
        { id: 'w_vcc_and1', from: { row: 13, col: 'L+' }, to: { row: 13, col: 'J' }, color: '#ef4444', label: '7411 #1 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7411_1_pin_14' },
        { id: 'w_gnd_and1', from: { row: 19, col: 'L-' }, to: { row: 19, col: 'A' }, color: '#1e293b', label: '7411 #1 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7411_1_pin_7' },
        { id: 'w_vcc_and2', from: { row: 23, col: 'L+' }, to: { row: 23, col: 'J' }, color: '#ef4444', label: '7411 #2 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7411_2_pin_14' },
        { id: 'w_gnd_and2', from: { row: 29, col: 'L-' }, to: { row: 29, col: 'A' }, color: '#1e293b', label: '7411 #2 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7411_2_pin_7' },
        { id: 'w_vcc_or', from: { row: 33, col: 'L+' }, to: { row: 33, col: 'J' }, color: '#ef4444', label: '7432 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7432_pin_14' },
        { id: 'w_gnd_or', from: { row: 39, col: 'L-' }, to: { row: 39, col: 'A' }, color: '#1e293b', label: '7432 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7432_pin_7' },

        // Select inverters: S1 -> NOT1 (P1->P2), S0 -> NOT2 (P3->P4)
        { id: 'w_s1_not', from: { row: 1, col: 'B' }, to: { row: 3, col: 'E' }, color: '#3b82f6', label: 'S1 -> NOT1 Pin 1', fromPinId: 'sw_out_in_s1', toPinId: 'ic_7404_pin_1' },
        { id: 'w_s0_not', from: { row: 10, col: 'B' }, to: { row: 5, col: 'E' }, color: '#06b6d4', label: 'S0 -> NOT2 Pin 3', fromPinId: 'sw_out_in_s0', toPinId: 'ic_7404_pin_3' },

        // AND1 (D0 * S1' * S0') on 7411_1 Gate 1 (pins 1, 2, 13 -> 12)
        { id: 'w_d0_and1', from: { row: 12, col: 'B' }, to: { row: 13, col: 'E' }, color: '#22c55e', label: 'D0 -> AND1 Pin 1', fromPinId: 'sw_out_in_d0', toPinId: 'ic_7411_1_pin_1' },
        { id: 'w_s1bar_and1', from: { row: 4, col: 'E' }, to: { row: 14, col: 'E' }, color: '#6366f1', label: "S1' -> AND1 Pin 2", fromPinId: 'ic_7404_pin_2', toPinId: 'ic_7411_1_pin_2' },
        { id: 'w_s0bar_and1', from: { row: 6, col: 'E' }, to: { row: 14, col: 'F' }, color: '#a855f7', label: "S0' -> AND1 Pin 13", fromPinId: 'ic_7404_pin_4', toPinId: 'ic_7411_1_pin_13' },

        // AND2 (D1 * S1' * S0) on 7411_1 Gate 2 (pins 3, 4, 5 -> 6)
        { id: 'w_d1_and2', from: { row: 20, col: 'B' }, to: { row: 15, col: 'E' }, color: '#22c55e', label: 'D1 -> AND2 Pin 3', fromPinId: 'sw_out_in_d1', toPinId: 'ic_7411_1_pin_3' },
        { id: 'w_s1bar_and2', from: { row: 4, col: 'D' }, to: { row: 16, col: 'E' }, color: '#6366f1', label: "S1' -> AND2 Pin 4", fromPinId: 'ic_7404_pin_2', toPinId: 'ic_7411_1_pin_4' },
        { id: 'w_s0_and2', from: { row: 10, col: 'C' }, to: { row: 17, col: 'E' }, color: '#06b6d4', label: 'S0 -> AND2 Pin 5', fromPinId: 'sw_out_in_s0', toPinId: 'ic_7411_1_pin_5' },

        // AND3 (D2 * S1 * S0') on 7411_1 Gate 3 (pins 9, 10, 11 -> 8)
        { id: 'w_d2_and3', from: { row: 22, col: 'B' }, to: { row: 18, col: 'F' }, color: '#22c55e', label: 'D2 -> AND3 Pin 9', fromPinId: 'sw_out_in_d2', toPinId: 'ic_7411_1_pin_9' },
        { id: 'w_s1_and3', from: { row: 1, col: 'C' }, to: { row: 17, col: 'F' }, color: '#3b82f6', label: 'S1 -> AND3 Pin 10', fromPinId: 'sw_out_in_s1', toPinId: 'ic_7411_1_pin_10' },
        { id: 'w_s0bar_and3', from: { row: 6, col: 'D' }, to: { row: 16, col: 'F' }, color: '#a855f7', label: "S0' -> AND3 Pin 11", fromPinId: 'ic_7404_pin_4', toPinId: 'ic_7411_1_pin_11' },

        // AND4 (D3 * S1 * S0) on 7411_2 Gate 1 (pins 1, 2, 13 -> 12)
        { id: 'w_d3_and4', from: { row: 31, col: 'B' }, to: { row: 23, col: 'E' }, color: '#22c55e', label: 'D3 -> AND4 Pin 1', fromPinId: 'sw_out_in_d3', toPinId: 'ic_7411_2_pin_1' },
        { id: 'w_s1_and4', from: { row: 1, col: 'D' }, to: { row: 24, col: 'E' }, color: '#3b82f6', label: 'S1 -> AND4 Pin 2', fromPinId: 'sw_out_in_s1', toPinId: 'ic_7411_2_pin_2' },
        { id: 'w_s0_and4', from: { row: 10, col: 'D' }, to: { row: 24, col: 'F' }, color: '#06b6d4', label: 'S0 -> AND4 Pin 13', fromPinId: 'sw_out_in_s0', toPinId: 'ic_7411_2_pin_13' },

        // OR Tree on 7432
        { id: 'w_and1_or1', from: { row: 15, col: 'F' }, to: { row: 33, col: 'E' }, color: '#f59e0b', label: 'AND1 -> OR1 Pin 1', fromPinId: 'ic_7411_1_pin_12', toPinId: 'ic_7432_pin_1' },
        { id: 'w_and2_or1', from: { row: 18, col: 'E' }, to: { row: 34, col: 'E' }, color: '#f59e0b', label: 'AND2 -> OR1 Pin 2', fromPinId: 'ic_7411_1_pin_6', toPinId: 'ic_7432_pin_2' },
        { id: 'w_and3_or2', from: { row: 19, col: 'F' }, to: { row: 36, col: 'E' }, color: '#ec4899', label: 'AND3 -> OR2 Pin 4', fromPinId: 'ic_7411_1_pin_8', toPinId: 'ic_7432_pin_4' },
        { id: 'w_and4_or2', from: { row: 25, col: 'F' }, to: { row: 37, col: 'E' }, color: '#ec4899', label: 'AND4 -> OR2 Pin 5', fromPinId: 'ic_7411_2_pin_12', toPinId: 'ic_7432_pin_5' },
        { id: 'w_or1_or3', from: { row: 35, col: 'E' }, to: { row: 38, col: 'F' }, color: '#10b981', label: 'OR1 -> OR3 Pin 9', fromPinId: 'ic_7432_pin_3', toPinId: 'ic_7432_pin_9' },
        { id: 'w_or2_or3', from: { row: 38, col: 'E' }, to: { row: 37, col: 'F' }, color: '#10b981', label: 'OR2 -> OR3 Pin 10', fromPinId: 'ic_7432_pin_6', toPinId: 'ic_7432_pin_10' },
        { id: 'w_out_z', from: { row: 39, col: 'F' }, to: { row: 40, col: 'I' }, color: '#22c55e', label: 'OR3 Pin 8 -> Output Z LED', fromPinId: 'ic_7432_pin_8', toPinId: 'led_in_out_z' },
      ],
      truthTable: [
        { inputs: { S1: 0, S0: 0, D0: 0, D1: 1, D2: 1, D3: 1 }, outputs: { Z: 0 }, label: 'Select D0 (0 -> Z)' },
        { inputs: { S1: 0, S0: 0, D0: 1, D1: 0, D2: 0, D3: 0 }, outputs: { Z: 1 }, label: 'Select D0 (1 -> Z)' },
        { inputs: { S1: 0, S0: 1, D0: 1, D1: 0, D2: 1, D3: 1 }, outputs: { Z: 0 }, label: 'Select D1 (0 -> Z)' },
        { inputs: { S1: 0, S0: 1, D0: 0, D1: 1, D2: 0, D3: 0 }, outputs: { Z: 1 }, label: 'Select D1 (1 -> Z)' },
        { inputs: { S1: 1, S0: 0, D0: 1, D1: 1, D2: 0, D3: 1 }, outputs: { Z: 0 }, label: 'Select D2 (0 -> Z)' },
        { inputs: { S1: 1, S0: 0, D0: 0, D1: 0, D2: 1, D3: 0 }, outputs: { Z: 1 }, label: 'Select D2 (1 -> Z)' },
        { inputs: { S1: 1, S0: 1, D0: 1, D1: 1, D2: 1, D3: 0 }, outputs: { Z: 0 }, label: 'Select D3 (0 -> Z)' },
        { inputs: { S1: 1, S0: 1, D0: 0, D1: 0, D2: 0, D3: 1 }, outputs: { Z: 1 }, label: 'Select D3 (1 -> Z)' },
      ],
      booleanExpression: {
        primary: "Z = D_0 \\overline{S_1}\\,\\overline{S_0} + D_1 \\overline{S_1} S_0 + D_2 S_1 \\overline{S_0} + D_3 S_1 S_0",
        intermediate: [
          "\\text{Inverters}: \\overline{S_1},\\; \\overline{S_0}\\; (\\text{IC 7404})",
          "\\text{Minterms}: M_0 = D_0\\overline{S_1}\\,\\overline{S_0},\\; M_1 = D_1\\overline{S_1}S_0,\\; M_2 = D_2S_1\\overline{S_0},\\; M_3 = D_3S_1S_0",
          "\\text{OR Combine}: Z = (M_0 + M_1) + (M_2 + M_3)",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Invert Select Inputs',
          description: 'IC 7404 generates the complemented select lines S1\' (Pin 2) and S0\' (Pin 4).',
          formulaSnippet: "\\overline{S_1},\\; \\overline{S_0}",
          highlightComponentId: 'ic_7404',
          highlightPins: [1, 2, 3, 4],
        },
        {
          step: 2,
          title: 'Decode Channel Enable on 3-Input AND Gates',
          description: 'IC 7411 #1 & #2 form four 3-input AND gates. For any (S1, S0), exactly one AND gate is enabled to pass its D input.',
          formulaSnippet: "M_i = D_i \\cdot m_i(S_1, S_0)",
          highlightComponentId: 'ic_7411_1',
        },
        {
          step: 3,
          title: 'Combine Active Channel via OR Tree',
          description: 'Three 2-input OR gates inside IC 7432 combine the four AND outputs onto the single output LED Z.',
          formulaSnippet: "Z = M_0 + M_1 + M_2 + M_3",
          highlightComponentId: 'ic_7432',
          highlightPins: [1, 2, 3, 4, 5, 6, 8, 9, 10],
        },
      ],
    },
    {
      id: 'demux_1to4',
      name: '1:4 Demultiplexer using Logic Gates',
      subtitle: 'IC 7404 (NOT) + 2× IC 7411 (3-Input AND)',
      description: 'Distributes a single data input D onto one of four outputs (O0, O1, O2, O3) selected by (S1, S0).',
      ics: [
        { instanceId: 'ic_7404', partNumber: '7404', label: 'IC 7404 (NOT)', rowStart: 4 },
        { instanceId: 'ic_7411_1', partNumber: '7411', label: 'IC 7411 #1 (O0–O2)', rowStart: 15 },
        { instanceId: 'ic_7411_2', partNumber: '7411', label: 'IC 7411 #2 (O3)', rowStart: 26 },
      ],
      inputs: [
        { id: 'in_d', label: 'D', defaultState: DigitalSignal.LOW, boardConnection: { row: 1, col: 'B' } },
        { id: 'in_s1', label: 'S1', defaultState: DigitalSignal.LOW, boardConnection: { row: 12, col: 'B' } },
        { id: 'in_s0', label: 'S0', defaultState: DigitalSignal.LOW, boardConnection: { row: 24, col: 'B' } },
      ],
      outputs: [
        { id: 'out_o3', label: 'O3', color: 'green', boardConnection: { row: 34, col: 'I' } },
        { id: 'out_o2', label: 'O2', color: 'green', boardConnection: { row: 23, col: 'I' } },
        { id: 'out_o1', label: 'O1', color: 'green', boardConnection: { row: 13, col: 'I' } },
        { id: 'out_o0', label: 'O0', color: 'green', boardConnection: { row: 11, col: 'I' } },
      ],
      wires: [
        // Power & GND
        { id: 'w_vcc_not', from: { row: 4, col: 'L+' }, to: { row: 4, col: 'J' }, color: '#ef4444', label: '7404 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7404_pin_14' },
        { id: 'w_gnd_not', from: { row: 10, col: 'L-' }, to: { row: 10, col: 'A' }, color: '#1e293b', label: '7404 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7404_pin_7' },
        { id: 'w_vcc_and1', from: { row: 15, col: 'L+' }, to: { row: 15, col: 'J' }, color: '#ef4444', label: '7411 #1 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7411_1_pin_14' },
        { id: 'w_gnd_and1', from: { row: 21, col: 'L-' }, to: { row: 21, col: 'A' }, color: '#1e293b', label: '7411 #1 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7411_1_pin_7' },
        { id: 'w_vcc_and2', from: { row: 26, col: 'L+' }, to: { row: 26, col: 'J' }, color: '#ef4444', label: '7411 #2 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7411_2_pin_14' },
        { id: 'w_gnd_and2', from: { row: 32, col: 'L-' }, to: { row: 32, col: 'A' }, color: '#1e293b', label: '7411 #2 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7411_2_pin_7' },

        // Select inverters: S1 -> NOT1, S0 -> NOT2
        { id: 'w_s1_not', from: { row: 12, col: 'B' }, to: { row: 4, col: 'E' }, color: '#3b82f6', label: 'S1 -> NOT1 Pin 1', fromPinId: 'sw_out_in_s1', toPinId: 'ic_7404_pin_1' },
        { id: 'w_s0_not', from: { row: 24, col: 'B' }, to: { row: 6, col: 'E' }, color: '#06b6d4', label: 'S0 -> NOT2 Pin 3', fromPinId: 'sw_out_in_s0', toPinId: 'ic_7404_pin_3' },

        // O0 = D * S1' * S0' (7411_1 Gate 1: 1, 2, 13 -> 12)
        { id: 'w_d_o0', from: { row: 1, col: 'B' }, to: { row: 15, col: 'E' }, color: '#22c55e', label: 'D -> AND1 Pin 1', fromPinId: 'sw_out_in_d', toPinId: 'ic_7411_1_pin_1' },
        { id: 'w_s1bar_o0', from: { row: 5, col: 'E' }, to: { row: 16, col: 'E' }, color: '#6366f1', label: "S1' -> AND1 Pin 2", fromPinId: 'ic_7404_pin_2', toPinId: 'ic_7411_1_pin_2' },
        { id: 'w_s0bar_o0', from: { row: 7, col: 'E' }, to: { row: 16, col: 'F' }, color: '#a855f7', label: "S0' -> AND1 Pin 13", fromPinId: 'ic_7404_pin_4', toPinId: 'ic_7411_1_pin_13' },
        { id: 'w_out_o0', from: { row: 17, col: 'F' }, to: { row: 11, col: 'I' }, color: '#22c55e', label: 'AND1 Pin 12 -> O0 LED', fromPinId: 'ic_7411_1_pin_12', toPinId: 'led_in_out_o0' },

        // O1 = D * S1' * S0 (7411_1 Gate 2: 3, 4, 5 -> 6)
        { id: 'w_d_o1', from: { row: 1, col: 'C' }, to: { row: 17, col: 'E' }, color: '#22c55e', label: 'D -> AND2 Pin 3', fromPinId: 'sw_out_in_d', toPinId: 'ic_7411_1_pin_3' },
        { id: 'w_s1bar_o1', from: { row: 5, col: 'D' }, to: { row: 18, col: 'E' }, color: '#6366f1', label: "S1' -> AND2 Pin 4", fromPinId: 'ic_7404_pin_2', toPinId: 'ic_7411_1_pin_4' },
        { id: 'w_s0_o1', from: { row: 24, col: 'C' }, to: { row: 19, col: 'E' }, color: '#06b6d4', label: 'S0 -> AND2 Pin 5', fromPinId: 'sw_out_in_s0', toPinId: 'ic_7411_1_pin_5' },
        { id: 'w_out_o1', from: { row: 20, col: 'E' }, to: { row: 13, col: 'I' }, color: '#22c55e', label: 'AND2 Pin 6 -> O1 LED', fromPinId: 'ic_7411_1_pin_6', toPinId: 'led_in_out_o1' },

        // O2 = D * S1 * S0' (7411_1 Gate 3: 9, 10, 11 -> 8)
        { id: 'w_d_o2', from: { row: 1, col: 'D' }, to: { row: 20, col: 'F' }, color: '#22c55e', label: 'D -> AND3 Pin 9', fromPinId: 'sw_out_in_d', toPinId: 'ic_7411_1_pin_9' },
        { id: 'w_s1_o2', from: { row: 12, col: 'C' }, to: { row: 19, col: 'F' }, color: '#3b82f6', label: 'S1 -> AND3 Pin 10', fromPinId: 'sw_out_in_s1', toPinId: 'ic_7411_1_pin_10' },
        { id: 'w_s0bar_o2', from: { row: 7, col: 'D' }, to: { row: 18, col: 'F' }, color: '#a855f7', label: "S0' -> AND3 Pin 11", fromPinId: 'ic_7404_pin_4', toPinId: 'ic_7411_1_pin_11' },
        { id: 'w_out_o2', from: { row: 21, col: 'F' }, to: { row: 23, col: 'I' }, color: '#22c55e', label: 'AND3 Pin 8 -> O2 LED', fromPinId: 'ic_7411_1_pin_8', toPinId: 'led_in_out_o2' },

        // O3 = D * S1 * S0 (7411_2 Gate 1: 1, 2, 13 -> 12)
        { id: 'w_d_o3', from: { row: 1, col: 'A' }, to: { row: 26, col: 'E' }, color: '#22c55e', label: 'D -> AND4 Pin 1', fromPinId: 'sw_out_in_d', toPinId: 'ic_7411_2_pin_1' },
        { id: 'w_s1_o3', from: { row: 12, col: 'D' }, to: { row: 27, col: 'E' }, color: '#3b82f6', label: 'S1 -> AND4 Pin 2', fromPinId: 'sw_out_in_s1', toPinId: 'ic_7411_2_pin_2' },
        { id: 'w_s0_o3', from: { row: 24, col: 'D' }, to: { row: 27, col: 'F' }, color: '#06b6d4', label: 'S0 -> AND4 Pin 13', fromPinId: 'sw_out_in_s0', toPinId: 'ic_7411_2_pin_13' },
        { id: 'w_out_o3', from: { row: 28, col: 'F' }, to: { row: 34, col: 'I' }, color: '#22c55e', label: 'AND4 Pin 12 -> O3 LED', fromPinId: 'ic_7411_2_pin_12', toPinId: 'led_in_out_o3' },
      ],
      truthTable: [
        { inputs: { S1: 0, S0: 0, D: 0 }, outputs: { O3: 0, O2: 0, O1: 0, O0: 0 }, label: 'Route D=0 to O0' },
        { inputs: { S1: 0, S0: 0, D: 1 }, outputs: { O3: 0, O2: 0, O1: 0, O0: 1 }, label: 'Route D=1 to O0' },
        { inputs: { S1: 0, S0: 1, D: 0 }, outputs: { O3: 0, O2: 0, O1: 0, O0: 0 }, label: 'Route D=0 to O1' },
        { inputs: { S1: 0, S0: 1, D: 1 }, outputs: { O3: 0, O2: 0, O1: 1, O0: 0 }, label: 'Route D=1 to O1' },
        { inputs: { S1: 1, S0: 0, D: 0 }, outputs: { O3: 0, O2: 0, O1: 0, O0: 0 }, label: 'Route D=0 to O2' },
        { inputs: { S1: 1, S0: 0, D: 1 }, outputs: { O3: 0, O2: 1, O1: 0, O0: 0 }, label: 'Route D=1 to O2' },
        { inputs: { S1: 1, S0: 1, D: 0 }, outputs: { O3: 0, O2: 0, O1: 0, O0: 0 }, label: 'Route D=0 to O3' },
        { inputs: { S1: 1, S0: 1, D: 1 }, outputs: { O3: 1, O2: 0, O1: 0, O0: 0 }, label: 'Route D=1 to O3' },
      ],
      booleanExpression: {
        primary: "O_0 = D\\overline{S_1}\\,\\overline{S_0},\\; O_1 = D\\overline{S_1}S_0,\\; O_2 = DS_1\\overline{S_0},\\; O_3 = DS_1S_0",
        intermediate: [
          "\\text{Inverters}: \\overline{S_1},\\; \\overline{S_0}\\; (\\text{IC 7404})",
          "\\text{Four 3-Input AND Gates distribute D to the selected } O_i",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Generate Complemented Select Lines',
          description: 'IC 7404 produces S1\' and S0\' so each 3-input AND gate recognizes one unique binary address.',
          formulaSnippet: "\\overline{S_1},\\; \\overline{S_0}",
          highlightComponentId: 'ic_7404',
          highlightPins: [1, 2, 3, 4],
        },
        {
          step: 2,
          title: 'Gate Data Input D to Selected Channel',
          description: 'Data bit D is wired in parallel to all four 3-input AND gates (IC 7411 #1 & #2). Only the gate matching (S1, S0) passes D to its LED.',
          formulaSnippet: "O_i = D \\cdot m_i(S_1, S_0)",
          highlightComponentId: 'ic_7411_1',
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount IC 7404 (NOT), two IC 7411 (3-input AND), and IC 7432 (OR) across the center trough of the breadboard.' },
    { stepNumber: 2, instruction: 'Connect Pin 14 of every IC to +5V (VCC) and Pin 7 to GND.' },
    { stepNumber: 3, instruction: 'For 4:1 MUX: wire S1, S0 and their complements from 7404 into the four 3-input AND gates along with D0–D3, and sum their outputs using 3 OR gates.' },
    { stepNumber: 4, instruction: 'For 1:4 DEMUX: connect data input D to all four 3-input AND gates enabled by S1, S0 combinations and connect outputs O0–O3 to LEDs.' },
    { stepNumber: 5, instruction: 'Verify the truth tables for all select states (00, 01, 10, 11).' },
  ],
  conclusion: 'The Multiplexer and Demultiplexer are constructed and their working is verified.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'Why is a Multiplexer called a "data selector" and a Demultiplexer a "data distributor"?',
      answer: 'A MUX selects one of 2^n input lines and forwards it to a single output line; a DEMUX takes one input line and distributes it onto one of 2^n output lines.',
      hint: 'Compare many-to-one vs. one-to-many signal routing.',
    },
    {
      id: 'v2',
      category: 'Basic',
      question: 'How many select lines are needed for a 16:1 Multiplexer?',
      answer: '4 select lines, because 2^4 = 16.',
      hint: 'Use 2^n = number of data inputs.',
    },
    {
      id: 'v3',
      category: 'Intermediate',
      question: 'What IC provides the 3-input AND gates used in this 4:1 MUX and 1:4 DEMUX experiment?',
      answer: 'IC 7411 (Triple 3-Input AND Gate DIP-14), where Pins 1, 2, 13 -> 12, Pins 3, 4, 5 -> 6, and Pins 9, 10, 11 -> 8.',
      hint: 'Four 3-input AND gates require two IC 7411 packages.',
    },
    {
      id: 'v4',
      category: 'Intermediate',
      question: 'How is a 1:4 Demultiplexer related to a 2-to-4 Decoder?',
      answer: 'A 2-to-4 decoder with an active Enable pin functions directly as a 1:4 Demultiplexer by applying the data input D to the decoder Enable line.',
      hint: 'Read the DEMUX theory paragraph on page 23.',
    },
    {
      id: 'v5',
      category: 'Advanced',
      question: 'How can any 3-variable Boolean function F(A, B, C) be implemented using a 4:1 Multiplexer?',
      answer: 'Connect A and B to select lines S1 and S0, then connect the four data inputs D0–D3 to 0, 1, C, or C\' according to the minterms in the truth table.',
      hint: 'Each (S1, S0) state maps to a 1-variable residue of C.',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'In a 4:1 MUX with S1=1, S0=0, which data input appears at output Z?',
      options: ['D2', 'D1', 'D0', 'D3'],
      correctIndex: 0,
      explanation: 'Binary select (S1 S0) = 10 corresponds to decimal index 2, so Z = D2.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'For a 1:4 Demultiplexer with D=1, S1=1, S0=1, which output goes HIGH?',
      options: ['O3', 'O0', 'O1', 'O2'],
      correctIndex: 0,
      explanation: 'S1=1, S0=1 selects O3 = D·S1·S0 = 1.',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'How many 2-input OR gates are needed to combine the 4 AND outputs of a 4:1 MUX?',
      options: ['3', '2', '4', '1'],
      correctIndex: 0,
      explanation: 'Three 2-input OR gates form a tree combining 4 AND terms: (M0 + M1) + (M2 + M3).',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'Which pin on IC 7411 is the output of Gate 1 (with inputs on Pins 1, 2, 13)?',
      options: ['Pin 12', 'Pin 3', 'Pin 6', 'Pin 8'],
      correctIndex: 0,
      explanation: 'In triple 3-input IC 7411, Gate 1 inputs are 1, 2, 13 and its output is Pin 12.',
    },
  ],
  commonMistakes: [
    {
      title: 'Confusing IC 7411 Pinout with IC 7408',
      mistake: 'Treating Pin 3 as Gate 1 output on IC 7411.',
      remedy: 'On 3-input IC 7411, Gate 1 uses Pins 1, 2, 13 -> Pin 12; Gate 2 uses Pins 3, 4, 5 -> Pin 6.',
      impact: 'Shorting an output pin or reading floating/wrong channel signals.',
    },
    {
      title: 'Swapping S1 (MSB) and S0 (LSB) Select Lines',
      mistake: 'Reversing S1 and S0 when wiring the AND gates.',
      remedy: 'Ensure S1 corresponds to weight 2 (D2, D3) and S0 corresponds to weight 1 (D1, D3).',
      impact: 'Channels D1 and D2 appear swapped.',
    },
  ],
};
