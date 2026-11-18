import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP9_FLIPFLOPS: Experiment = {
  id: 'exp9',
  experimentNumber: 9,
  title: 'Verify the Truth Table of JK and D Flip-Flops',
  aim: 'To study the truth tables of JK and D flip-flops.',
  theory: {
    summary:
      'Flip-flops are bistable sequential logic circuits capable of storing 1 bit of memory. The D (Data) flip-flop eliminates the invalid state of an SR latch, while the JK flip-flop generalizes SR operation by toggling when both J and K inputs are HIGH on a clock pulse.',
    detailed: `JK Flip-Flop:
The name JK flip-flop is termed from the inventor Jack Kilby from Texas Instruments. Due to its versatility they are available as IC packages. The major applications of JK flip-flop are shift registers, storage registers, counters and control circuits (PWM generation, etc.). Here we use NAND gates for demonstrating the JK flip-flop.

The J and K are the input states for the JK flip-flop. Q and Q' represent the complementary output states. It works like an SR flip-flop for complementary inputs (J=1,K=0 -> Set; J=0,K=1 -> Reset), holds state when J=0,K=0, and has the advantage of a toggling function when J=1, K=1 (toggles on the leading edge of the clock signal).

Circuit Representation:
- Steering Stage (IC 7410 Triple 3-Input NAND):
  S' = ¬(J · CLK · Q')
  R' = ¬(K · CLK · Q)
- Latch Stage (IC 7400 Cross-Coupled NAND SR Latch):
  Q  = ¬(S' · Q')
  Q' = ¬(R' · Q)

D Flip-Flop:
D flip-flops are used as memory storage elements and data processors to introduce delay in timing circuits, as buffers, and for sampling data at specific intervals. Using 5 2-input NAND gates (2× IC 7400):
- Input D is inverted by a tied-input NAND gate to generate D' = ¬D.
- Steering NANDs compute S' = ¬(D · CLK) and R' = ¬(D' · CLK).
- Cross-coupled NAND latch outputs Q = D when CLK is HIGH, and latches state when CLK returns LOW.`,
    keyPoints: [
      'A flip-flop is a 1-bit sequential memory element with complementary outputs Q and Q\'.',
      'D Flip-Flop is realized with 5 NAND gates (two IC 7400 packages) and removes the S=R=1 forbidden condition.',
      'JK Flip-Flop uses 3-input steering NAND gates (IC 7410) fed back from Q and Q\' plus an SR NAND latch (IC 7400).',
      'When J = K = 1 in a JK flip-flop, a clock pulse toggles the output state (Q becomes Q\').',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Clock / Function Generator', quantity: 1, spec: 'Square Pulse / Manual Clock Switch', category: 'INPUT' },
    { name: 'Connecting Wires & BNC Cable', quantity: 16, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 2, category: 'PASSIVE' },
    { name: 'Output LEDs (Q and Q\')', quantity: 2, spec: 'Green (Q) & Red (Q\')', category: 'OUTPUT' },
    { name: 'IC 7400', quantity: 2, spec: 'Quad 2-Input NAND Gate DIP-14', category: 'IC' },
    { name: 'IC 7410', quantity: 1, spec: 'Triple 3-Input NAND Gate DIP-14 (for JK Steering)', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'd_flipflop',
      name: 'D Flip-Flop using NAND Gates',
      subtitle: '5 NAND Gates (2× IC 7400)',
      description: '5-NAND D flip-flop from manual page 2: CLK=LOW latches state, CLK=HIGH transfers D to Q and D\' to Q\'.',
      ics: [
        { instanceId: 'ic_7400_1', partNumber: '7400', label: 'IC 7400 #1 (Gated SR)', rowStart: 8 },
        { instanceId: 'ic_7400_2', partNumber: '7400', label: 'IC 7400 #2 (D Inverter)', rowStart: 20 },
      ],
      inputs: [
        { id: 'in_clk', label: 'CLK', defaultState: DigitalSignal.LOW, boardConnection: { row: 3, col: 'B' } },
        { id: 'in_d', label: 'D', defaultState: DigitalSignal.LOW, boardConnection: { row: 6, col: 'B' } },
      ],
      outputs: [
        { id: 'out_q', label: 'Q', color: 'green', boardConnection: { row: 16, col: 'I' } },
        { id: 'out_qbar', label: "Q'", color: 'red', boardConnection: { row: 18, col: 'I' } },
      ],
      wires: [
        // Power & GND
        { id: 'w_vcc_1', from: { row: 8, col: 'L+' }, to: { row: 8, col: 'J' }, color: '#ef4444', label: '7400 #1 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7400_1_pin_14' },
        { id: 'w_gnd_1', from: { row: 14, col: 'L-' }, to: { row: 14, col: 'A' }, color: '#1e293b', label: '7400 #1 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7400_1_pin_7' },
        { id: 'w_vcc_2', from: { row: 20, col: 'L+' }, to: { row: 20, col: 'J' }, color: '#ef4444', label: '7400 #2 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7400_2_pin_14' },
        { id: 'w_gnd_2', from: { row: 26, col: 'L-' }, to: { row: 26, col: 'A' }, color: '#1e293b', label: '7400 #2 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7400_2_pin_7' },

        // D Inverter (IC 7400 #2 Gate 1: tied pins 1 & 2 -> pin 3 = D')
        { id: 'w_d_to_g1', from: { row: 6, col: 'B' }, to: { row: 8, col: 'E' }, color: '#3b82f6', label: 'D -> NAND1 Pin 1', fromPinId: 'sw_out_in_d', toPinId: 'ic_7400_1_pin_1' },
        { id: 'w_d_to_inv', from: { row: 6, col: 'C' }, to: { row: 20, col: 'E' }, color: '#3b82f6', label: 'D -> Inv Pin 1', fromPinId: 'sw_out_in_d', toPinId: 'ic_7400_2_pin_1' },
        { id: 'w_inv_tie', from: { row: 20, col: 'D' }, to: { row: 21, col: 'E' }, color: '#6366f1', label: 'Inv Tie Pin 1–2', fromPinId: 'ic_7400_2_pin_1', toPinId: 'ic_7400_2_pin_2' },

        // Clock to Steering NAND1 (Pin 2) & NAND2 (Pin 4)
        { id: 'w_clk_g1', from: { row: 3, col: 'B' }, to: { row: 9, col: 'E' }, color: '#f59e0b', label: 'CLK -> NAND1 Pin 2', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7400_1_pin_2' },
        { id: 'w_clk_g2', from: { row: 3, col: 'C' }, to: { row: 11, col: 'E' }, color: '#f59e0b', label: 'CLK -> NAND2 Pin 4', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7400_1_pin_4' },

        // D' (7400 #2 Pin 3) -> NAND2 Pin 5
        { id: 'w_dbar_g2', from: { row: 22, col: 'E' }, to: { row: 12, col: 'E' }, color: '#a855f7', label: "D' -> NAND2 Pin 5", fromPinId: 'ic_7400_2_pin_3', toPinId: 'ic_7400_1_pin_5' },

        // Steering outputs to cross-coupled latch:
        { id: 'w_sbar_to_g4', from: { row: 10, col: 'E' }, to: { row: 10, col: 'F' }, color: '#10b981', label: "S' (Pin 3) -> Latch Q Pin 12", fromPinId: 'ic_7400_1_pin_3', toPinId: 'ic_7400_1_pin_12' },
        { id: 'w_rbar_to_g3', from: { row: 13, col: 'E' }, to: { row: 13, col: 'F' }, color: '#ec4899', label: "R' (Pin 6) -> Latch Q' Pin 9", fromPinId: 'ic_7400_1_pin_6', toPinId: 'ic_7400_1_pin_9' },

        // Cross-coupled feedback: Q' (Pin 8) -> Pin 13; Q (Pin 11) -> Pin 10
        { id: 'w_qbar_fb', from: { row: 14, col: 'F' }, to: { row: 9, col: 'G' }, color: '#ef4444', label: "Feedback Q' -> Pin 13", fromPinId: 'ic_7400_1_pin_8', toPinId: 'ic_7400_1_pin_13' },
        { id: 'w_q_fb', from: { row: 11, col: 'F' }, to: { row: 12, col: 'G' }, color: '#22c55e', label: 'Feedback Q -> Pin 10', fromPinId: 'ic_7400_1_pin_11', toPinId: 'ic_7400_1_pin_10' },

        // Output LEDs
        { id: 'w_out_q', from: { row: 11, col: 'H' }, to: { row: 16, col: 'I' }, color: '#22c55e', label: 'Pin 11 -> Q LED', fromPinId: 'ic_7400_1_pin_11', toPinId: 'led_in_out_q' },
        { id: 'w_out_qbar', from: { row: 14, col: 'H' }, to: { row: 18, col: 'I' }, color: '#ef4444', label: "Pin 8 -> Q' LED", fromPinId: 'ic_7400_1_pin_8', toPinId: 'led_in_out_qbar' },
      ],
      truthTable: [
        { inputs: { CLK: 0, D: 0 }, outputs: { Q: 0, "Q'": 1 }, label: 'CLK=LOW -> Latched (0, 1)' },
        { inputs: { CLK: 1, D: 0 }, outputs: { Q: 0, "Q'": 1 }, label: 'CLK=HIGH, D=0 -> Reset (0, 1)' },
        { inputs: { CLK: 1, D: 1 }, outputs: { Q: 1, "Q'": 0 }, label: 'CLK=HIGH, D=1 -> Set (1, 0)' },
        { inputs: { CLK: 0, D: 1 }, outputs: { Q: 1, "Q'": 0 }, label: 'CLK=LOW -> Hold Latched State (1, 0)' },
      ],
      booleanExpression: {
        primary: "S' = \\overline{D \\cdot \\text{CLK}},\\quad R' = \\overline{\\overline{D} \\cdot \\text{CLK}},\\quad Q = \\overline{S' \\cdot Q'},\\quad Q' = \\overline{R' \\cdot Q}",
        intermediate: [
          "\\text{When CLK}=1: Q_{\\text{next}} = D,\\; Q'_{\\text{next}} = \\overline{D}",
          "\\text{When CLK}=0: S' = R' = 1 \\implies Q_{\\text{next}} = Q\\; (\\text{Latched})",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Generate Complement D\'',
          description: 'IC 7400 #2 Gate 1 has its inputs (Pins 1 & 2) tied together so it acts as a NOT gate, generating D\'.',
          formulaSnippet: "D' = \\overline{D}",
          highlightComponentId: 'ic_7400_2',
          highlightPins: [1, 2, 3],
        },
        {
          step: 2,
          title: 'Gated Steering Stage',
          description: 'When CLK = 1, Gates 1 & 2 of IC 7400 #1 pass D and D\' inverted as active-low S\' and R\'. When CLK = 0, both S\' and R\' stay 1 to lock the latch.',
          formulaSnippet: "S' = \\overline{D \\cdot \\text{CLK}},\\; R' = \\overline{\\overline{D} \\cdot \\text{CLK}}",
          highlightComponentId: 'ic_7400_1',
          highlightPins: [1, 2, 3, 4, 5, 6],
        },
        {
          step: 3,
          title: 'Cross-Coupled NAND Latch (Q, Q\')',
          description: 'Gates 3 & 4 of IC 7400 #1 cross-couple Q\' (Pin 8) and Q (Pin 11) to store the sampled bit.',
          formulaSnippet: "Q = \\overline{S' \\cdot Q'},\\quad Q' = \\overline{R' \\cdot Q}",
          highlightComponentId: 'ic_7400_1',
          highlightPins: [8, 9, 10, 11, 12, 13],
        },
      ],
    },
    {
      id: 'jk_flipflop',
      name: 'JK Flip-Flop using NAND Gates',
      subtitle: 'IC 7410 (3-Input Steering) + IC 7400 (SR Latch)',
      description: 'JK Flip-Flop from manual page 1: supports No Change (0,0), Reset (0,1), Set (1,0), and Leading-Edge Toggle (1,1).',
      ics: [
        { instanceId: 'ic_7410', partNumber: '7410', label: 'IC 7410 (3-In Steering)', rowStart: 8 },
        { instanceId: 'ic_7400', partNumber: '7400', label: 'IC 7400 (SR Latch)', rowStart: 20 },
      ],
      inputs: [
        { id: 'in_clk', label: 'CLK', defaultState: DigitalSignal.LOW, boardConnection: { row: 2, col: 'B' } },
        { id: 'in_j', label: 'J', defaultState: DigitalSignal.LOW, boardConnection: { row: 4, col: 'B' } },
        { id: 'in_k', label: 'K', defaultState: DigitalSignal.LOW, boardConnection: { row: 6, col: 'B' } },
      ],
      outputs: [
        { id: 'out_q', label: 'Q', color: 'green', boardConnection: { row: 28, col: 'I' } },
        { id: 'out_qbar', label: "Q'", color: 'red', boardConnection: { row: 30, col: 'I' } },
      ],
      wires: [
        // Power & GND
        { id: 'w_vcc_10', from: { row: 8, col: 'L+' }, to: { row: 8, col: 'J' }, color: '#ef4444', label: '7410 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7410_pin_14' },
        { id: 'w_gnd_10', from: { row: 14, col: 'L-' }, to: { row: 14, col: 'A' }, color: '#1e293b', label: '7410 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7410_pin_7' },
        { id: 'w_vcc_00', from: { row: 20, col: 'L+' }, to: { row: 20, col: 'J' }, color: '#ef4444', label: '7400 VCC', fromPinId: 'pwr_vcc', toPinId: 'ic_7400_pin_14' },
        { id: 'w_gnd_00', from: { row: 26, col: 'L-' }, to: { row: 26, col: 'A' }, color: '#1e293b', label: '7400 GND', fromPinId: 'pwr_gnd', toPinId: 'ic_7400_pin_7' },

        // Inputs J, CLK, K -> 7410 3-input NANDs (Gate 1: pins 1,2,13 -> 12; Gate 2: pins 3,4,5 -> 6)
        { id: 'w_j', from: { row: 4, col: 'B' }, to: { row: 8, col: 'E' }, color: '#3b82f6', label: 'J -> 7410 Pin 1', fromPinId: 'sw_out_in_j', toPinId: 'ic_7410_pin_1' },
        { id: 'w_clk_j', from: { row: 2, col: 'B' }, to: { row: 9, col: 'E' }, color: '#f59e0b', label: 'CLK -> 7410 Pin 2', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7410_pin_2' },
        { id: 'w_clk_k', from: { row: 2, col: 'C' }, to: { row: 10, col: 'E' }, color: '#f59e0b', label: 'CLK -> 7410 Pin 3', fromPinId: 'sw_out_in_clk', toPinId: 'ic_7410_pin_3' },
        { id: 'w_k', from: { row: 6, col: 'B' }, to: { row: 11, col: 'E' }, color: '#06b6d4', label: 'K -> 7410 Pin 4', fromPinId: 'sw_out_in_k', toPinId: 'ic_7410_pin_4' },

        // Steering outputs to 7400 SR latch
        { id: 'w_sbar_latch', from: { row: 10, col: 'F' }, to: { row: 23, col: 'E' }, color: '#10b981', label: "S' -> 7400 Pin 4", fromPinId: 'ic_7410_pin_12', toPinId: 'ic_7400_pin_4' },
        { id: 'w_rbar_latch', from: { row: 13, col: 'E' }, to: { row: 20, col: 'E' }, color: '#ec4899', label: "R' -> 7400 Pin 1", fromPinId: 'ic_7410_pin_6', toPinId: 'ic_7400_pin_1' },

        // Cross-coupling inside 7400 latch + feedback to 7410 + output LEDs
        { id: 'w_qbar_latch', from: { row: 22, col: 'E' }, to: { row: 24, col: 'E' }, color: '#ef4444', label: "Q' (Pin 3) -> Pin 5", fromPinId: 'ic_7400_pin_3', toPinId: 'ic_7400_pin_5' },
        { id: 'w_qbar_fb', from: { row: 22, col: 'D' }, to: { row: 9, col: 'F' }, color: '#ef4444', label: "Feedback Q' -> 7410 Pin 13", fromPinId: 'ic_7400_pin_3', toPinId: 'ic_7410_pin_13' },
        { id: 'w_out_qbar', from: { row: 22, col: 'C' }, to: { row: 30, col: 'I' }, color: '#ef4444', label: "Q' -> Red LED", fromPinId: 'ic_7400_pin_3', toPinId: 'led_in_out_qbar' },

        { id: 'w_q_latch', from: { row: 25, col: 'E' }, to: { row: 21, col: 'E' }, color: '#22c55e', label: 'Q (Pin 6) -> Pin 2', fromPinId: 'ic_7400_pin_6', toPinId: 'ic_7400_pin_2' },
        { id: 'w_q_fb', from: { row: 25, col: 'D' }, to: { row: 12, col: 'E' }, color: '#22c55e', label: 'Feedback Q -> 7410 Pin 5', fromPinId: 'ic_7400_pin_6', toPinId: 'ic_7410_pin_5' },
        { id: 'w_out_q', from: { row: 25, col: 'C' }, to: { row: 28, col: 'I' }, color: '#22c55e', label: 'Q -> Green LED', fromPinId: 'ic_7400_pin_6', toPinId: 'led_in_out_q' },
      ],
      truthTable: [
        { inputs: { CLK: 0, J: 0, K: 0 }, outputs: { Q: 0, "Q'": 1 }, label: 'CLK=0 -> Latched (0, 1)' },
        { inputs: { CLK: 1, J: 0, K: 0 }, outputs: { Q: 0, "Q'": 1 }, label: 'J=0, K=0 -> No Change (0, 1)' },
        { inputs: { CLK: 1, J: 1, K: 0 }, outputs: { Q: 1, "Q'": 0 }, label: 'J=1, K=0 -> Set (1, 0)' },
        { inputs: { CLK: 0, J: 0, K: 0 }, outputs: { Q: 1, "Q'": 0 }, label: 'CLK=0 -> Latched (1, 0)' },
        { inputs: { CLK: 1, J: 0, K: 0 }, outputs: { Q: 1, "Q'": 0 }, label: 'J=0, K=0 -> No Change (1, 0)' },
        { inputs: { CLK: 1, J: 0, K: 1 }, outputs: { Q: 0, "Q'": 1 }, label: 'J=0, K=1 -> Reset (0, 1)' },
        { inputs: { CLK: 0, J: 1, K: 1 }, outputs: { Q: 0, "Q'": 1 }, label: 'Prep Toggle Pulse (CLK=0)' },
        { inputs: { CLK: 1, J: 1, K: 1 }, outputs: { Q: 1, "Q'": 0 }, label: 'J=1, K=1 -> Toggle 0 -> 1' },
        { inputs: { CLK: 0, J: 1, K: 1 }, outputs: { Q: 1, "Q'": 0 }, label: 'Prep Next Toggle Pulse (CLK=0)' },
        { inputs: { CLK: 1, J: 1, K: 1 }, outputs: { Q: 0, "Q'": 1 }, label: 'J=1, K=1 -> Toggle 1 -> 0' },
      ],
      booleanExpression: {
        primary: "Q_{\\text{next}} = J\\overline{Q} + \\overline{K}Q\\; (\\text{on clock pulse})",
        intermediate: [
          "S' = \\overline{J \\cdot \\text{CLK} \\cdot Q'},\\quad R' = \\overline{K \\cdot \\text{CLK} \\cdot Q}",
          "Q = \\overline{S' \\cdot Q'},\\quad Q' = \\overline{R' \\cdot Q}",
        ],
      },
      explanationSteps: [
        {
          step: 1,
          title: '3-Input Steering NANDs (IC 7410)',
          description: 'IC 7410 Gates 1 & 2 combine J and K with CLK and cross-feedback Q\' and Q so only the opposite state triggers on a clock edge.',
          formulaSnippet: "S' = \\overline{J \\cdot \\text{CLK} \\cdot Q'},\\; R' = \\overline{K \\cdot \\text{CLK} \\cdot Q}",
          highlightComponentId: 'ic_7410',
          highlightPins: [1, 2, 3, 4, 5, 6, 12, 13],
        },
        {
          step: 2,
          title: 'Cross-Coupled SR NAND Latch (IC 7400)',
          description: 'IC 7400 Gates 1 & 2 store Q and Q\'. When J=K=1 and CLK pulses HIGH, feedback steers Q to toggle cleanly.',
          formulaSnippet: "J=K=1 \\implies Q_{\\text{next}} = \\overline{Q}",
          highlightComponentId: 'ic_7400',
          highlightPins: [1, 2, 3, 4, 5, 6],
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount IC 7400 (and IC 7410 for JK flip-flop) on the breadboard and connect Pin 14 to +5V, Pin 7 to GND.' },
    { stepNumber: 2, instruction: 'For D Flip-Flop: wire the 5 NAND gates as shown on Page 2 using two 7400 ICs, with D and CLK connected to input switches.' },
    { stepNumber: 3, instruction: 'For JK Flip-Flop: wire two 3-input NAND gates (IC 7410) feeding a cross-coupled SR latch (IC 7400), including feedback from Q and Q\'.' },
    { stepNumber: 4, instruction: 'Connect outputs Q and Q\' to LEDs through 330Ω resistors.' },
    { stepNumber: 5, instruction: 'Apply combinations of inputs and clock pulses and record Next State outputs to verify the truth tables.' },
  ],
  conclusion: 'D and JK Flip-flops are constructed and their truth table is verified successfully.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'What is the main difference between a combinational circuit and a sequential circuit?',
      answer: 'Combinational circuit outputs depend solely on present inputs, whereas sequential circuit outputs depend on both present inputs and stored past state (memory).',
      hint: 'Think about why a flip-flop holds its value when CLK=0.',
    },
    {
      id: 'v2',
      category: 'Basic',
      question: 'Why does the D flip-flop prevent the invalid state of an SR flip-flop?',
      answer: 'Because the D input is split via an inverter into S = D and R = D\', guaranteeing S and R are always complements and never simultaneously active.',
      hint: 'Check the inverter connected to D in the 5-NAND circuit.',
    },
    {
      id: 'v3',
      category: 'Intermediate',
      question: 'What happens in a JK flip-flop when J = 1 and K = 1 during a clock trigger?',
      answer: 'It enters the Toggle mode: Q changes to Q\' and Q\' changes to Q (complementing the present stored bit).',
      hint: 'Check the last inference row of the JK truth table.',
    },
    {
      id: 'v4',
      category: 'Advanced',
      question: 'What is the race-around condition in a level-triggered JK flip-flop and how is it eliminated?',
      answer: 'When J=K=1 and CLK stays HIGH longer than the propagation delay of the gates, Q repeatedly toggles back and forth (oscillates). It is prevented by edge-triggering (narrow pulse) or Master-Slave JK configuration.',
      hint: 'Note why the manual states "Toggles on leading edge of clock signal".',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'In a JK Flip-Flop, what does J = 1, K = 0 produce when clocked?',
      options: ['Set (Q = 1, Q\' = 0)', 'Reset (Q = 0, Q\' = 1)', 'No Change', 'Toggle'],
      correctIndex: 0,
      explanation: 'J corresponds to Set and K corresponds to Reset. J=1, K=0 sets Q = 1.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'In the D Flip-Flop truth table, what happens when Clock = LOW?',
      options: ['Output remains latched regardless of D', 'Output immediately follows D', 'Output toggles', 'Q and Q\' both become 1'],
      correctIndex: 0,
      explanation: 'When CLK = LOW, steering NAND outputs S\' and R\' stay 1, preserving the latch state.',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'Which IC contains the 3-input NAND gates needed for the JK flip-flop steering stage?',
      options: ['IC 7410', 'IC 7400', 'IC 7411', 'IC 7402'],
      correctIndex: 0,
      explanation: 'IC 7410 is a Triple 3-Input NAND gate.',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'Who is the JK flip-flop named after according to the lab manual?',
      options: ['Jack Kilby', 'John Karnaugh', 'James Kirk', 'Joseph Kelvin'],
      correctIndex: 0,
      explanation: 'Per page 1 of the manual, the JK flip-flop is named after inventor Jack Kilby from Texas Instruments.',
    },
  ],
  commonMistakes: [
    {
      title: 'Missing Cross-Feedback in JK Flip-Flop',
      mistake: 'Leaving Pin 13 of 7410 (Q\') or Pin 5 of 7410 (Q) unconnected.',
      remedy: 'Always wire Q\' from the latch back to the J steering NAND (Pin 13) and Q back to the K steering NAND (Pin 5).',
      impact: 'J=K=1 fails to toggle and causes invalid S\'=R\'=0.',
    },
    {
      title: 'Forgetting Tied-Input Inverter for D\'',
      mistake: 'Wiring both steering gates directly to D without inverting one branch.',
      remedy: 'Invert D via a tied-input NAND gate on IC 7400 #2 before feeding the lower steering gate.',
      impact: 'Q and Q\' cannot both follow D and D\' accurately.',
    },
  ],
};
