import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP10_SHIFT_REGISTERS: Experiment = {
  id: 'exp10',
  experimentNumber: 10,
  title: 'Design SISO, SIPO Shift Register',
  aim: 'To study the SISO, SIPO Shift register.',
  theory: {
    summary:
      'Shift registers are sequential circuits built from cascaded D flip-flops sharing a common clock to store and shift binary words. In SISO mode data enters and exits serially; in SIPO mode serial input bits become available simultaneously across all parallel outputs.',
    detailed: `Serial-In Serial-Out Shift Register (SISO):
A Serial-In Serial-Out (SISO) shift register accepts data one bit at a time through a single input line and outputs data serially, using a series of flip-flops all triggered by the same clock. The main use of a SISO is to act as a delay element.
- Data enters and leaves one bit at a time in a serial sequence.
- Typically made of multiple D flip-flops (2× IC 7474 Dual D Flip-Flop with Preset and Clear) connected in series and synchronized by a common clock.

Serial-In Parallel-Out Shift Register (SIPO):
A Serial-In Parallel-Out (SIPO) shift register accepts data serially through a single input line and produces all bits simultaneously as a parallel output, using multiple synchronized flip-flops. The main use of the SIPO register is to convert serial data into parallel data.
- Data is input one bit at a time and outputs all stored bits in parallel (QA, QB, QC, QD).
- Implemented both using 2× IC 7474 D flip-flops (with common CLK and CLR') and using dedicated 4-bit shift register IC 7495 (Mode M=0 for serial right shift via CK1, M=1 for parallel load via CK2).`,
    keyPoints: [
      'A 4-bit shift register requires 4 D flip-flops (2 packages of IC 7474) or 1 dedicated IC 7495.',
      'In IC 7474, Preset (PR\') and Clear (CLR\') are active-LOW; keep PR\' connected to +5V during normal shifting.',
      'Each positive clock transition shifts Q1 -> Q2 -> Q3 -> Q4 simultaneously without race conditions.',
      'IC 7495 Pin 6 (Mode M) switches between Serial Right Shift (M=0, CK1) and Parallel Load (M=1, CK2).',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Function Generator / Clock', quantity: 1, spec: 'Square Pulse / Clock Switch', category: 'INPUT' },
    { name: 'Connecting Wires & BNC Cable', quantity: 26, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 4, category: 'PASSIVE' },
    { name: 'Output LEDs (Q1–Q4 / QA–QD)', quantity: 4, spec: 'Green Diffused LEDs', category: 'OUTPUT' },
    { name: 'IC 7474', quantity: 2, spec: 'Dual Positive-Edge D Flip-Flop DIP-14', category: 'IC' },
    { name: 'IC 7495', quantity: 1, spec: '4-Bit Parallel-Access Shift Register DIP-14', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'siso_7474',
      name: '4-Bit SISO Shift Register (2× IC 7474)',
      subtitle: 'Serial Input Din -> FF1 -> FF2 -> FF3 -> FF4 (Sout)',
      description: '4-bit Serial-In Serial-Out shift register built from two IC 7474 chips showing serial bit delay toward Q4 (Sout).',
      ics: [
        { instanceId: 'ic_7474_1', partNumber: '7474', label: 'IC 7474 #1 (FF1, FF2)', rowStart: 8 },
        { instanceId: 'ic_7474_2', partNumber: '7474', label: 'IC 7474 #2 (FF3, FF4)', rowStart: 20 },
      ],
      inputs: [
        { id: 'in_clr', label: "CLR'", defaultState: DigitalSignal.HIGH, boardConnection: { row: 2, col: 'B' } },
        { id: 'in_clk', label: 'CLK', defaultState: DigitalSignal.LOW, boardConnection: { row: 4, col: 'B' } },
        { id: 'in_din', label: 'Din', defaultState: DigitalSignal.LOW, boardConnection: { row: 6, col: 'B' } },
      ],
      outputs: [
        { id: 'out_q1', label: 'Q1', color: 'amber', boardConnection: { row: 28, col: 'I' } },
        { id: 'out_q2', label: 'Q2', color: 'amber', boardConnection: { row: 30, col: 'I' } },
        { id: 'out_q3', label: 'Q3', color: 'amber', boardConnection: { row: 32, col: 'I' } },
        { id: 'out_q4', label: 'Q4 (Sout)', color: 'green', boardConnection: { row: 34, col: 'I' } },
      ],
      wires: [
        // Power & GND
        { id: 'w_vcc_1', from: { row: 8, col: 'L+' }, to: { row: 8, col: 'J' }, color: '#ef4444', label: '7474 #1 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7474_1_pin_14' },
        { id: 'w_gnd_1', from: { row: 14, col: 'L-' }, to: { row: 14, col: 'A' }, color: '#1e293b', label: '7474 #1 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7474_1_pin_7' },
        { id: 'w_vcc_2', from: { row: 20, col: 'L+' }, to: { row: 20, col: 'J' }, color: '#ef4444', label: '7474 #2 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7474_2_pin_14' },
        { id: 'w_gnd_2', from: { row: 26, col: 'L-' }, to: { row: 26, col: 'A' }, color: '#1e293b', label: '7474 #2 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7474_2_pin_7' },

        // Tie active-low Preset (PR') pins to +5V
        { id: 'w_pr1', from: { row: 11, col: 'L+' }, to: { row: 11, col: 'D' }, color: '#ef4444', label: "FF1 1PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_1_pin_4' },
        { id: 'w_pr2', from: { row: 12, col: 'R+' }, to: { row: 12, col: 'J' }, color: '#ef4444', label: "FF2 2PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_1_pin_10' },
        { id: 'w_pr3', from: { row: 23, col: 'L+' }, to: { row: 23, col: 'D' }, color: '#ef4444', label: "FF3 1PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_2_pin_4' },
        { id: 'w_pr4', from: { row: 24, col: 'R+' }, to: { row: 24, col: 'J' }, color: '#ef4444', label: "FF4 2PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_2_pin_10' },

        // Common CLR' bus
        { id: 'w_clr1', from: { row: 2, col: 'B' }, to: { row: 8, col: 'E' }, color: '#ec4899', label: "CLR' -> FF1", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_1_pin_1' },
        { id: 'w_clr2', from: { row: 2, col: 'C' }, to: { row: 9, col: 'F' }, color: '#ec4899', label: "CLR' -> FF2", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_1_pin_13' },
        { id: 'w_clr3', from: { row: 2, col: 'D' }, to: { row: 20, col: 'E' }, color: '#ec4899', label: "CLR' -> FF3", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_2_pin_1' },
        { id: 'w_clr4', from: { row: 2, col: 'A' }, to: { row: 21, col: 'F' }, color: '#ec4899', label: "CLR' -> FF4", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_2_pin_13' },

        // Common Clock bus
        { id: 'w_clk1', from: { row: 4, col: 'B' }, to: { row: 10, col: 'E' }, color: '#f59e0b', label: 'CLK -> FF1', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_1_pin_3' },
        { id: 'w_clk2', from: { row: 4, col: 'C' }, to: { row: 11, col: 'F' }, color: '#f59e0b', label: 'CLK -> FF2', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_1_pin_11' },
        { id: 'w_clk3', from: { row: 4, col: 'D' }, to: { row: 22, col: 'E' }, color: '#f59e0b', label: 'CLK -> FF3', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_2_pin_3' },
        { id: 'w_clk4', from: { row: 4, col: 'A' }, to: { row: 23, col: 'F' }, color: '#f59e0b', label: 'CLK -> FF4', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_2_pin_11' },

        // Serial Daisy-Chain Data Path
        { id: 'w_din', from: { row: 6, col: 'B' }, to: { row: 9, col: 'E' }, color: '#3b82f6', label: 'Din -> FF1 1D', fromPinId: 'sw_out_in_din', toPinId: 'ic_7474_1_pin_2' },
        { id: 'w_q1_d2', from: { row: 12, col: 'E' }, to: { row: 10, col: 'F' }, color: '#8b5cf6', label: 'Q1 -> FF2 2D', fromPinId: 'ic_7474_1_pin_5', toPinId: 'ic_7474_1_pin_12' },
        { id: 'w_q2_d3', from: { row: 13, col: 'F' }, to: { row: 21, col: 'E' }, color: '#8b5cf6', label: 'Q2 -> FF3 1D', fromPinId: 'ic_7474_1_pin_9', toPinId: 'ic_7474_2_pin_2' },
        { id: 'w_q3_d4', from: { row: 24, col: 'E' }, to: { row: 22, col: 'F' }, color: '#8b5cf6', label: 'Q3 -> FF4 2D', fromPinId: 'ic_7474_2_pin_5', toPinId: 'ic_7474_2_pin_12' },

        // Indicator LEDs
        { id: 'w_out_q1', from: { row: 12, col: 'D' }, to: { row: 28, col: 'I' }, color: '#f59e0b', label: 'Q1 LED', fromPinId: 'ic_7474_1_pin_5', toPinId: 'led_in_out_q1' },
        { id: 'w_out_q2', from: { row: 13, col: 'G' }, to: { row: 30, col: 'I' }, color: '#f59e0b', label: 'Q2 LED', fromPinId: 'ic_7474_1_pin_9', toPinId: 'led_in_out_q2' },
        { id: 'w_out_q3', from: { row: 24, col: 'D' }, to: { row: 32, col: 'I' }, color: '#f59e0b', label: 'Q3 LED', fromPinId: 'ic_7474_2_pin_5', toPinId: 'led_in_out_q3' },
        { id: 'w_out_q4', from: { row: 25, col: 'F' }, to: { row: 34, col: 'I' }, color: '#22c55e', label: 'Q4 (Sout) LED', fromPinId: 'ic_7474_2_pin_9', toPinId: 'led_in_out_q4' },
      ],
      truthTable: [
        { inputs: { "CLR'": 0, CLK: 0, Din: 0 }, outputs: { Q1: 0, Q2: 0, Q3: 0, 'Q4 (Sout)': 0 }, label: 'Async Clear -> 0000' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 1 }, outputs: { Q1: 1, Q2: 0, Q3: 0, 'Q4 (Sout)': 0 }, label: 'Clock 1 (Din=1) -> 1000' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 0 }, outputs: { Q1: 1, Q2: 0, Q3: 0, 'Q4 (Sout)': 0 }, label: 'Clock Low (Prep Din=0)' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 0 }, outputs: { Q1: 0, Q2: 1, Q3: 0, 'Q4 (Sout)': 0 }, label: 'Clock 2 (Din=0) -> 0100' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 1 }, outputs: { Q1: 0, Q2: 1, Q3: 0, 'Q4 (Sout)': 0 }, label: 'Clock Low (Prep Din=1)' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 1 }, outputs: { Q1: 1, Q2: 0, Q3: 1, 'Q4 (Sout)': 0 }, label: 'Clock 3 (Din=1) -> 1010' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 0 }, outputs: { Q1: 1, Q2: 0, Q3: 1, 'Q4 (Sout)': 0 }, label: 'Clock Low (Prep Din=0)' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 0 }, outputs: { Q1: 0, Q2: 1, Q3: 0, 'Q4 (Sout)': 1 }, label: 'Clock 4 -> 1 reaches Sout (Q4)!' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 0 }, outputs: { Q1: 0, Q2: 1, Q3: 0, 'Q4 (Sout)': 1 }, label: 'Hold State (0101)' },
      ],
      booleanExpression: {
        primary: "Q_1(t+1) = D_{\\text{in}},\\quad Q_2(t+1) = Q_1(t),\\quad Q_3(t+1) = Q_2(t),\\quad Q_4(t+1) = Q_3(t)",
        intermediate: [
          "\\text{Serial Latency}: 4\\text{ Clock Pulses to shift input } D_{\\text{in}} \\text{ to } Q_4\\,(S_{\\text{out}})",
          "\\text{Reset}: \\overline{\\text{CLR}} = 0 \\implies Q_1 = Q_2 = Q_3 = Q_4 = 0",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Active-Low Asynchronous Clear',
          description: 'Setting CLR\' = 0 clears all four flip-flops (IC 7474 #1 & #2) immediately to 0000.',
          formulaSnippet: "\\overline{\\text{CLR}} = 0 \\implies Q_{1..4} = 0",
          highlightComponentId: 'ic_7474_1',
          highlightPins: [1, 13],
        },
        {
          step: 2,
          title: 'Serial Bit Entry at FF1',
          description: 'With CLR\' = 1, toggle CLK 0 -> 1 to latch Din into Q1 (Pin 5).',
          formulaSnippet: "Q_1 \\leftarrow D_{\\text{in}}",
          highlightComponentId: 'ic_7474_1',
          highlightPins: [2, 3, 5],
        },
        {
          step: 3,
          title: 'Shift Through FF2, FF3, FF4 to Serial Out',
          description: 'Each subsequent rising clock edge moves data right by one stage (Q1 -> Q2 -> Q3 -> Q4), appearing at Q4 (Sout) after 4 clocks.',
          formulaSnippet: "S_{\\text{out}}(t+4) = D_{\\text{in}}(t)",
          highlightComponentId: 'ic_7474_2',
          highlightPins: [2, 5, 9, 12],
        },
      ],
    },
    {
      id: 'sipo_7474',
      name: '4-Bit SIPO Shift Register (2× IC 7474)',
      subtitle: 'Serial Input Din -> Parallel Outputs QA, QB, QC, QD',
      description: '4-bit Serial-In Parallel-Out shift register converting 4 serial input bits into a simultaneous 4-bit parallel word.',
      ics: [
        { instanceId: 'ic_7474_1', partNumber: '7474', label: 'IC 7474 #1 (FF1, FF2)', rowStart: 8 },
        { instanceId: 'ic_7474_2', partNumber: '7474', label: 'IC 7474 #2 (FF3, FF4)', rowStart: 20 },
      ],
      inputs: [
        { id: 'in_clr', label: "CLR'", defaultState: DigitalSignal.HIGH, boardConnection: { row: 2, col: 'B' } },
        { id: 'in_clk', label: 'CLK', defaultState: DigitalSignal.LOW, boardConnection: { row: 4, col: 'B' } },
        { id: 'in_din', label: 'Din', defaultState: DigitalSignal.LOW, boardConnection: { row: 6, col: 'B' } },
      ],
      outputs: [
        { id: 'out_qa', label: 'QA', color: 'green', boardConnection: { row: 28, col: 'I' } },
        { id: 'out_qb', label: 'QB', color: 'green', boardConnection: { row: 30, col: 'I' } },
        { id: 'out_qc', label: 'QC', color: 'green', boardConnection: { row: 32, col: 'I' } },
        { id: 'out_qd', label: 'QD', color: 'green', boardConnection: { row: 34, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc_1', from: { row: 8, col: 'L+' }, to: { row: 8, col: 'J' }, color: '#ef4444', label: '7474 #1 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7474_1_pin_14' },
        { id: 'w_gnd_1', from: { row: 14, col: 'L-' }, to: { row: 14, col: 'A' }, color: '#1e293b', label: '7474 #1 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7474_1_pin_7' },
        { id: 'w_vcc_2', from: { row: 20, col: 'L+' }, to: { row: 20, col: 'J' }, color: '#ef4444', label: '7474 #2 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7474_2_pin_14' },
        { id: 'w_gnd_2', from: { row: 26, col: 'L-' }, to: { row: 26, col: 'A' }, color: '#1e293b', label: '7474 #2 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7474_2_pin_7' },

        { id: 'w_pr1', from: { row: 11, col: 'L+' }, to: { row: 11, col: 'D' }, color: '#ef4444', label: "FF1 1PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_1_pin_4' },
        { id: 'w_pr2', from: { row: 12, col: 'R+' }, to: { row: 12, col: 'J' }, color: '#ef4444', label: "FF2 2PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_1_pin_10' },
        { id: 'w_pr3', from: { row: 23, col: 'L+' }, to: { row: 23, col: 'D' }, color: '#ef4444', label: "FF3 1PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_2_pin_4' },
        { id: 'w_pr4', from: { row: 24, col: 'R+' }, to: { row: 24, col: 'J' }, color: '#ef4444', label: "FF4 2PR' -> +5V", fromPinId: 'pwr_vcc', toPinId: 'ic_7474_2_pin_10' },

        { id: 'w_clr1', from: { row: 2, col: 'B' }, to: { row: 8, col: 'E' }, color: '#ec4899', label: "CLR' -> FF1", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_1_pin_1' },
        { id: 'w_clr2', from: { row: 2, col: 'C' }, to: { row: 9, col: 'F' }, color: '#ec4899', label: "CLR' -> FF2", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_1_pin_13' },
        { id: 'w_clr3', from: { row: 2, col: 'D' }, to: { row: 20, col: 'E' }, color: '#ec4899', label: "CLR' -> FF3", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_2_pin_1' },
        { id: 'w_clr4', from: { row: 2, col: 'A' }, to: { row: 21, col: 'F' }, color: '#ec4899', label: "CLR' -> FF4", fromPinId: 'sw_out_in_clr', toPinId: 'ic_7474_2_pin_13' },

        { id: 'w_clk1', from: { row: 4, col: 'B' }, to: { row: 10, col: 'E' }, color: '#f59e0b', label: 'CLK -> FF1', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_1_pin_3' },
        { id: 'w_clk2', from: { row: 4, col: 'C' }, to: { row: 11, col: 'F' }, color: '#f59e0b', label: 'CLK -> FF2', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_1_pin_11' },
        { id: 'w_clk3', from: { row: 4, col: 'D' }, to: { row: 22, col: 'E' }, color: '#f59e0b', label: 'CLK -> FF3', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_2_pin_3' },
        { id: 'w_clk4', from: { row: 4, col: 'A' }, to: { row: 23, col: 'F' }, color: '#f59e0b', label: 'CLK -> FF4', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7474_2_pin_11' },

        { id: 'w_din', from: { row: 6, col: 'B' }, to: { row: 9, col: 'E' }, color: '#3b82f6', label: 'Din -> FF1 1D', fromPinId: 'sw_out_in_din', toPinId: 'ic_7474_1_pin_2' },
        { id: 'w_qa_db', from: { row: 12, col: 'E' }, to: { row: 10, col: 'F' }, color: '#8b5cf6', label: 'QA -> FF2 2D', fromPinId: 'ic_7474_1_pin_5', toPinId: 'ic_7474_1_pin_12' },
        { id: 'w_qb_dc', from: { row: 13, col: 'F' }, to: { row: 21, col: 'E' }, color: '#8b5cf6', label: 'QB -> FF3 1D', fromPinId: 'ic_7474_1_pin_9', toPinId: 'ic_7474_2_pin_2' },
        { id: 'w_qc_dd', from: { row: 24, col: 'E' }, to: { row: 22, col: 'F' }, color: '#8b5cf6', label: 'QC -> FF4 2D', fromPinId: 'ic_7474_2_pin_5', toPinId: 'ic_7474_2_pin_12' },

        // Parallel output LEDs QA..QD
        { id: 'w_out_qa', from: { row: 12, col: 'D' }, to: { row: 28, col: 'I' }, color: '#22c55e', label: 'QA LED', fromPinId: 'ic_7474_1_pin_5', toPinId: 'led_in_out_qa' },
        { id: 'w_out_qb', from: { row: 13, col: 'G' }, to: { row: 30, col: 'I' }, color: '#22c55e', label: 'QB LED', fromPinId: 'ic_7474_1_pin_9', toPinId: 'led_in_out_qb' },
        { id: 'w_out_qc', from: { row: 24, col: 'D' }, to: { row: 32, col: 'I' }, color: '#22c55e', label: 'QC LED', fromPinId: 'ic_7474_2_pin_5', toPinId: 'led_in_out_qc' },
        { id: 'w_out_qd', from: { row: 25, col: 'F' }, to: { row: 34, col: 'I' }, color: '#22c55e', label: 'QD LED', fromPinId: 'ic_7474_2_pin_9', toPinId: 'led_in_out_qd' },
      ],
      truthTable: [
        { inputs: { "CLR'": 0, CLK: 0, Din: 0 }, outputs: { QA: 0, QB: 0, QC: 0, QD: 0 }, label: 'Async Clear -> 0000' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 1 }, outputs: { QA: 1, QB: 0, QC: 0, QD: 0 }, label: 'Clock 1 (Din=1) -> 1000' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 1 }, outputs: { QA: 1, QB: 0, QC: 0, QD: 0 }, label: 'Clock Low (Prep Din=1)' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 1 }, outputs: { QA: 1, QB: 1, QC: 0, QD: 0 }, label: 'Clock 2 (Din=1) -> 1100' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 0 }, outputs: { QA: 1, QB: 1, QC: 0, QD: 0 }, label: 'Clock Low (Prep Din=0)' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 0 }, outputs: { QA: 0, QB: 1, QC: 1, QD: 0 }, label: 'Clock 3 (Din=0) -> 0110' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 1 }, outputs: { QA: 0, QB: 1, QC: 1, QD: 0 }, label: 'Clock Low (Prep Din=1)' },
        { inputs: { "CLR'": 1, CLK: 1, Din: 1 }, outputs: { QA: 1, QB: 0, QC: 1, QD: 1 }, label: 'Clock 4 -> Parallel Word 1011!' },
        { inputs: { "CLR'": 1, CLK: 0, Din: 0 }, outputs: { QA: 1, QB: 0, QC: 1, QD: 1 }, label: 'Hold Parallel Output 1011' },
      ],
      booleanExpression: {
        primary: "Q_A(t+1) = D_{\\text{in}},\\; Q_B(t+1) = Q_A(t),\\; Q_C(t+1) = Q_B(t),\\; Q_D(t+1) = Q_C(t)",
        intermediate: [
          "\\text{Parallel Output Readout}: [Q_A\\, Q_B\\, Q_C\\, Q_D]\\; \\text{available simultaneously after 4 shifts}",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Reset Stored Bits (CLR\'=0)',
          description: 'Drive CLR\' LOW to reset parallel outputs QA QB QC QD to 0000.',
          formulaSnippet: "[Q_A Q_B Q_C Q_D] = 0000",
          highlightComponentId: 'ic_7474_1',
          highlightPins: [1, 13],
        },
        {
          step: 2,
          title: 'Shift Serial Stream (4 Clocks)',
          description: 'With CLR\' = 1, apply 4 serial bits on Din alongside rising clock pulses. After 4 pulses, all 4 bits appear simultaneously on LEDs QA–QD.',
          formulaSnippet: "D_{\\text{in}} \\rightarrow Q_A \\rightarrow Q_B \\rightarrow Q_C \\rightarrow Q_D",
          highlightComponentId: 'ic_7474_2',
        },
      ],
    },
    {
      id: 'sipo_7495',
      name: '4-Bit Shift Register (IC 7495)',
      subtitle: 'Serial Shift (M=0) & Parallel Load Clear (M=1)',
      description: 'Dedicated IC 7495 4-bit shift register: Mode M=1 clears via parallel inputs A..D=0, and M=0 shifts Din right across QA..QD.',
      ics: [
        { instanceId: 'ic_7495', partNumber: '7495', label: 'IC 7495 (4-Bit Shift Reg)', rowStart: 12 },
      ],
      inputs: [
        { id: 'in_m', label: 'M', defaultState: DigitalSignal.LOW, boardConnection: { row: 4, col: 'B' } },
        { id: 'in_clk', label: 'CLK', defaultState: DigitalSignal.LOW, boardConnection: { row: 6, col: 'B' } },
        { id: 'in_din', label: 'Din', defaultState: DigitalSignal.LOW, boardConnection: { row: 8, col: 'B' } },
      ],
      outputs: [
        { id: 'out_qa', label: 'QA', color: 'green', boardConnection: { row: 20, col: 'I' } },
        { id: 'out_qb', label: 'QB', color: 'green', boardConnection: { row: 22, col: 'I' } },
        { id: 'out_qc', label: 'QC', color: 'green', boardConnection: { row: 24, col: 'I' } },
        { id: 'out_qd', label: 'QD', color: 'green', boardConnection: { row: 26, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc', from: { row: 12, col: 'L+' }, to: { row: 12, col: 'J' }, color: '#ef4444', label: '7495 VCC (Pin 14)', fromPinId: 'pwr_vcc', toPinId: 'ic_7495_pin_14' },
        { id: 'w_gnd', from: { row: 18, col: 'L-' }, to: { row: 18, col: 'A' }, color: '#1e293b', label: '7495 GND (Pin 7)', fromPinId: 'pwr_gnd', toPinId: 'ic_7495_pin_7' },

        // Ground parallel inputs A, B, C, D so M=1 loads 0000
        { id: 'w_pa_gnd', from: { row: 13, col: 'L-' }, to: { row: 13, col: 'D' }, color: '#1e293b', label: 'A (Pin 2) -> GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7495_pin_2' },
        { id: 'w_pb_gnd', from: { row: 14, col: 'L-' }, to: { row: 14, col: 'D' }, color: '#1e293b', label: 'B (Pin 3) -> GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7495_pin_3' },
        { id: 'w_pc_gnd', from: { row: 15, col: 'L-' }, to: { row: 15, col: 'D' }, color: '#1e293b', label: 'C (Pin 4) -> GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7495_pin_4' },
        { id: 'w_pd_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'D' }, color: '#1e293b', label: 'D (Pin 5) -> GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7495_pin_5' },

        // Din, Mode Control M, Clock -> CK1 & CK2
        { id: 'w_din', from: { row: 8, col: 'B' }, to: { row: 12, col: 'E' }, color: '#3b82f6', label: 'Din -> DS (Pin 1)', fromPinId: 'sw_out_in_din', toPinId: 'ic_7495_pin_1' },
        { id: 'w_mode', from: { row: 4, col: 'B' }, to: { row: 17, col: 'E' }, color: '#ec4899', label: 'M -> Mode (Pin 6)', fromPinId: 'sw_out_in_m', toPinId: 'ic_7495_pin_6' },
        { id: 'w_clk_ck1', from: { row: 6, col: 'B' }, to: { row: 17, col: 'F' }, color: '#f59e0b', label: 'CLK -> CK1 (Pin 9)', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7495_pin_9' },
        { id: 'w_clk_ck2', from: { row: 6, col: 'C' }, to: { row: 18, col: 'F' }, color: '#f59e0b', label: 'CLK -> CK2 (Pin 8)', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7495_pin_8' },

        // Outputs QA..QD -> LEDs
        { id: 'w_out_qa', from: { row: 13, col: 'F' }, to: { row: 20, col: 'I' }, color: '#22c55e', label: 'QA (Pin 13) -> LED', fromPinId: 'ic_7495_pin_13', toPinId: 'led_in_out_qa' },
        { id: 'w_out_qb', from: { row: 14, col: 'F' }, to: { row: 22, col: 'I' }, color: '#22c55e', label: 'QB (Pin 12) -> LED', fromPinId: 'ic_7495_pin_12', toPinId: 'led_in_out_qb' },
        { id: 'w_out_qc', from: { row: 15, col: 'F' }, to: { row: 24, col: 'I' }, color: '#22c55e', label: 'QC (Pin 11) -> LED', fromPinId: 'ic_7495_pin_11', toPinId: 'led_in_out_qc' },
        { id: 'w_out_qd', from: { row: 16, col: 'F' }, to: { row: 26, col: 'I' }, color: '#22c55e', label: 'QD (Pin 10) -> LED', fromPinId: 'ic_7495_pin_10', toPinId: 'led_in_out_qd' },
      ],
      truthTable: [
        { inputs: { M: 1, CLK: 1, Din: 0 }, outputs: { QA: 0, QB: 0, QC: 0, QD: 0 }, label: 'M=1 Parallel Load 0000 (Clear)' },
        { inputs: { M: 0, CLK: 0, Din: 1 }, outputs: { QA: 0, QB: 0, QC: 0, QD: 0 }, label: 'M=0 Shift Mode, Prep Din=1' },
        { inputs: { M: 0, CLK: 1, Din: 1 }, outputs: { QA: 1, QB: 0, QC: 0, QD: 0 }, label: 'Clock 1 (Din=1) -> 1000' },
        { inputs: { M: 0, CLK: 0, Din: 0 }, outputs: { QA: 1, QB: 0, QC: 0, QD: 0 }, label: 'CLK=0, Prep Din=0' },
        { inputs: { M: 0, CLK: 1, Din: 0 }, outputs: { QA: 0, QB: 1, QC: 0, QD: 0 }, label: 'Clock 2 (Din=0) -> 0100' },
        { inputs: { M: 0, CLK: 0, Din: 1 }, outputs: { QA: 0, QB: 1, QC: 0, QD: 0 }, label: 'CLK=0, Prep Din=1' },
        { inputs: { M: 0, CLK: 1, Din: 1 }, outputs: { QA: 1, QB: 0, QC: 1, QD: 0 }, label: 'Clock 3 (Din=1) -> 1010' },
        { inputs: { M: 0, CLK: 0, Din: 1 }, outputs: { QA: 1, QB: 0, QC: 1, QD: 0 }, label: 'CLK=0, Prep Din=1' },
        { inputs: { M: 0, CLK: 1, Din: 1 }, outputs: { QA: 1, QB: 1, QC: 0, QD: 1 }, label: 'Clock 4 (Din=1) -> 1101' },
      ],
      booleanExpression: {
        primary: "M = 0:\\; Q_A \\leftarrow D_S,\\; Q_B \\leftarrow Q_A,\\; Q_C \\leftarrow Q_B,\\; Q_D \\leftarrow Q_C \\quad|\\quad M = 1:\\; [Q_A..Q_D] \\leftarrow [A..D]",
        intermediate: [
          "\\text{Pin 1}: D_S\\; (\\text{Serial Input}),\\; \\text{Pins 2–5}: A, B, C, D = 0000",
          "\\text{Pin 6}: \\text{Mode Control } M,\\; \\text{Pin 9}: \\text{CK1},\\; \\text{Pin 8}: \\text{CK2}",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Parallel Load Reset (M = 1)',
          description: 'With parallel inputs A, B, C, D wired to GND, setting M = 1 and pulsing CLK loads 0000 across QA–QD.',
          formulaSnippet: "M = 1 \\implies [Q_A..Q_D] \\leftarrow [A..D] = 0000",
          highlightComponentId: 'ic_7495',
          highlightPins: [2, 3, 4, 5, 6, 8],
        },
        {
          step: 2,
          title: 'Serial Right Shift (M = 0)',
          description: 'Set M = 0 and pulse CLK. Each clock moves DS (Pin 1) into QA, shifting QA -> QB -> QC -> QD.',
          formulaSnippet: "M = 0 \\implies Q_A \\leftarrow D_S,\\; Q_B \\leftarrow Q_A,\\; Q_C \\leftarrow Q_B,\\; Q_D \\leftarrow Q_C",
          highlightComponentId: 'ic_7495',
          highlightPins: [1, 9, 10, 11, 12, 13],
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount two IC 7474 chips (or one IC 7495) on the breadboard and connect Pin 14 to +5V, Pin 7 to GND.' },
    { stepNumber: 2, instruction: 'Tie active-low Preset (PR\') pins (Pins 4, 10) of 7474 ICs to +5V and connect common Clear (CLR\') and Clock (CLK) lines.' },
    { stepNumber: 3, instruction: 'Cascade 1Q -> 2D (FF1 to FF2), 2Q -> 1D (FF2 to FF3), and 1Q -> 2D (FF3 to FF4).' },
    { stepNumber: 4, instruction: 'Reset all flip-flops (CLR\'=0 on 7474 or M=1 load 0000 on 7495), then apply serial input bits on Din with clock pulses.' },
    { stepNumber: 5, instruction: 'Observe serial output at Q4 (SISO) and parallel outputs QA–QD (SIPO).' },
  ],
  conclusion: 'Serial In-Serial Out and Serial In-Parallel Out Shift Registers were studied and implemented successfully.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'What is the primary application of a SISO shift register?',
      answer: 'A SISO shift register acts as an N-clock-cycle digital delay line or temporary serial buffer.',
      hint: 'Count how many clock pulses it takes for one bit to exit.',
    },
    {
      id: 'v2',
      category: 'Basic',
      question: 'What is the primary application of a SIPO shift register?',
      answer: 'A SIPO shift register converts incoming serial bitstreams (such as UART/SPI data) into parallel multi-bit words for microprocessors or displays.',
      hint: 'Think of serial-to-parallel interface conversion.',
    },
    {
      id: 'v3',
      category: 'Intermediate',
      question: 'How many clock pulses are required to enter and retrieve a 4-bit word completely in a 4-bit SISO register?',
      answer: '4 clock pulses to load the 4 bits serially, and 3 additional pulses (7 pulses total) for the remaining bits to exit completely serially.',
      hint: 'Once the 4th bit enters FF1, the 1st bit is at FF4.',
    },
    {
      id: 'v4',
      category: 'Intermediate',
      question: 'Why must Preset (PR\') pins on IC 7474 be connected to +5V during normal shifting?',
      answer: 'Because Preset (PR\') is active-LOW; leaving it floating or grounded can accidentally force Q = 1 asynchronously regardless of clock or D.',
      hint: 'Check the bubble / overbar on PR\' and CLR\' in the 7474 pinout.',
    },
    {
      id: 'v5',
      category: 'Advanced',
      question: 'How does the Mode Control (Pin 6) on IC 7495 control operation?',
      answer: 'When M = 0, IC 7495 operates in Serial Shift-Right mode clocked by CK1 (Pin 9). When M = 1, it operates in Parallel Load mode clocked by CK2 (Pin 8).',
      hint: 'Check Pin 6, Pin 8, and Pin 9 labels on Page 27 of the manual.',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'How many IC 7474 packages are required to construct a 4-bit shift register?',
      options: ['2', '1', '4', '3'],
      correctIndex: 0,
      explanation: 'Each IC 7474 contains 2 D flip-flops (Dual D Flip-Flop), so 2 ICs provide 4 flip-flops.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'Which pin of IC 7474 is the active-low Clear input for Flip-Flop 1?',
      options: ['Pin 1', 'Pin 2', 'Pin 4', 'Pin 5'],
      correctIndex: 0,
      explanation: 'Per IC 7474 pin diagram on page 26, Pin 1 is 1CLR\', Pin 2 is 1D, Pin 3 is 1CK, Pin 4 is 1PR\', and Pin 5 is 1Q.',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'On IC 7495, which Mode Control (Pin 6) level selects Serial Shift-Right operation?',
      options: ['M = 0 (LOW)', 'M = 1 (HIGH)', 'Floating', 'Pulsed'],
      correctIndex: 0,
      explanation: 'Mode M = 0 enables serial shift right via CK1; M = 1 enables parallel loading via A, B, C, D and CK2.',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'After clearing a 4-bit SIPO register to 0000, you shift in Din = 1, 0, 1, 1 over 4 clock pulses (first bit enters QA first). What is [QA QB QC QD] after Clock 4?',
      options: ['1011', '1101', '0110', '1000'],
      correctIndex: 1,
      explanation: 'CLK1 -> 1000; CLK2 (Din=0) -> 0100; CLK3 (Din=1) -> 1010; CLK4 (Din=1) -> 1101.',
    },
  ],
  commonMistakes: [
    {
      title: 'Leaving Preset (PR\') or Clear (CLR\') Unconnected',
      mistake: 'Omitting +5V jumper to active-low PR\' pins (4 & 10) on IC 7474.',
      remedy: 'Always tie inactive active-low PR\' pins to VCC (+5V) and drive CLR\' HIGH except when clearing.',
      impact: 'Flip-flop may randomly preset/clear or fail to shift cleanly.',
    },
    {
      title: 'Wiring Q\' Instead of Q to Next Stage D Input',
      mistake: 'Connecting Pin 6 (1Q\') instead of Pin 5 (1Q) to Pin 12 (2D).',
      remedy: 'Connect true outputs 1Q (Pin 5) and 2Q (Pin 9) to the next flip-flop D input.',
      impact: 'Alternating inverted bits travel down the shift register.',
    },
  ],
};
