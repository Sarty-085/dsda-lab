import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP5_CODE_CONVERTERS: Experiment = {
  id: 'exp5',
  experimentNumber: 5,
  title: 'Construct Code Converters (Binary to Gray and Gray to Binary)',
  aim: 'To design and verify different code converters (Binary to Gray code converter and Gray to Binary code converter).',
  theory: {
    summary: 'Code converters transform data represented in one binary code into another code format. Gray code is a unit-distance reflective code where only one bit changes between successive numbers, eliminating spurious glitches in digital communication and rotary encoders.',
    detailed: `The availability of a large variety of codes for the same discrete elements of information results in the use of different codes by different digital systems. A converter is a combinational circuit that performs code transformation by means of logic gates that converts one code to another.

Binary to Gray Code Converter:
In Gray code, adjacent decimal numbers differ by only a single bit (unit distance property).
From K-maps on page 13 of the manual:
- G3 = B3
- G2 = B3 ⊕ B2
- G1 = B2 ⊕ B1
- G0 = B1 ⊕ B0
This requires 3 XOR gates from a single IC 7486.

Gray to Binary Code Converter:
To convert Gray code back into standard binary:
From K-maps on page 15 of the manual:
- B3 = G3
- B2 = G3 ⊕ G2
- B1 = B2 ⊕ G1 = G3 ⊕ G2 ⊕ G1
- B0 = B1 ⊕ G0 = G3 ⊕ G2 ⊕ G1 ⊕ G0
This uses a cascade of 3 XOR gates from IC 7486, where the previous calculated binary bit is XORed with the next Gray bit.`,
    keyPoints: [
      'Gray code is a non-weighted, unit-distance code: only 1 bit flips between adjacent numbers.',
      'Binary to Gray uses parallel XOR gates: Gi = Bi ⊕ B(i-1) (with MSB G3 = B3).',
      'Gray to Binary uses cascaded XOR gates: Bi = B(i+1) ⊕ Gi.',
      'Entire circuit for both directions can be realized with a single IC 7486 Quad 2-Input XOR gate.',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Connecting Wires', quantity: 18, category: 'PASSIVE' },
    { name: '5V Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Crocodile Clips', quantity: 2, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 4, category: 'PASSIVE' },
    { name: 'Output LEDs', quantity: 4, spec: 'Green Diffused (Bits 3..0)', category: 'OUTPUT' },
    { name: 'IC 7486', quantity: 1, spec: 'Quad 2-Input XOR Gate DIP-14', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'bin_to_gray',
      name: 'Binary to Gray Code Converter',
      subtitle: '4-bit Binary (B3..B0) to 4-bit Gray (G3..G0)',
      description: 'G3 = B3, G2 = B3 ⊕ B2, G1 = B2 ⊕ B1, G0 = B1 ⊕ B0 (Uses 3 XOR gates of IC 7486)',
      ics: [
        { instanceId: 'ic_7486', partNumber: '7486', label: 'IC 7486 (Quad XOR)', rowStart: 10 },
      ],
      inputs: [
        { id: 'in_b3', label: 'B3 (MSB)', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } },
        { id: 'in_b2', label: 'B2', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
        { id: 'in_b1', label: 'B1', defaultState: DigitalSignal.LOW, boardConnection: { row: 13, col: 'B' } },
        { id: 'in_b0', label: 'B0 (LSB)', defaultState: DigitalSignal.LOW, boardConnection: { row: 14, col: 'B' } },
      ],
      outputs: [
        { id: 'out_g3', label: 'G3', color: 'green', boardConnection: { row: 10, col: 'I' } },
        { id: 'out_g2', label: 'G2', color: 'green', boardConnection: { row: 12, col: 'I' } },
        { id: 'out_g1', label: 'G1', color: 'green', boardConnection: { row: 15, col: 'I' } },
        { id: 'out_g0', label: 'G0', color: 'green', boardConnection: { row: 17, col: 'I' } },
      ],
      wires: [
        // Power
        { id: 'w_vcc', fromPinId: 'pwr_vcc', toPinId: 'ic_7486_pin_14', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444' },
        { id: 'w_gnd', fromPinId: 'pwr_gnd', toPinId: 'ic_7486_pin_7', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b' },
        // B3 directly to G3 LED and to XOR1 Pin 1 (7486 Pin 1)
        { id: 'w_b3_g3', fromPinId: 'sw_out_in_b3', toPinId: 'led_in_out_g3', from: { row: 10, col: 'B' }, to: { row: 10, col: 'I' }, color: '#3b82f6', label: 'B3 -> G3 LED' },
        { id: 'w_b3_xor1', fromPinId: 'sw_out_in_b3', toPinId: 'ic_7486_pin_1', from: { row: 10, col: 'B' }, to: { row: 10, col: 'E' }, color: '#3b82f6', label: 'B3 -> XOR1 Pin 1' },
        // B2 to XOR1 Pin 2 and XOR2 Pin 4
        { id: 'w_b2_xor1', fromPinId: 'sw_out_in_b2', toPinId: 'ic_7486_pin_2', from: { row: 11, col: 'B' }, to: { row: 11, col: 'E' }, color: '#10b981', label: 'B2 -> XOR1 Pin 2' },
        { id: 'w_b2_xor2', fromPinId: 'sw_out_in_b2', toPinId: 'ic_7486_pin_4', from: { row: 11, col: 'C' }, to: { row: 13, col: 'E' }, color: '#10b981', label: 'B2 -> XOR2 Pin 4' },
        // XOR1 Out (Pin 3) is G2 -> G2 LED
        { id: 'w_g2', fromPinId: 'ic_7486_pin_3', toPinId: 'led_in_out_g2', from: { row: 12, col: 'E' }, to: { row: 12, col: 'I' }, color: '#22c55e', label: 'XOR1 Pin 3 -> G2 LED' },
        // B1 to XOR2 Pin 5 and XOR3 Pin 9
        { id: 'w_b1_xor2', fromPinId: 'sw_out_in_b1', toPinId: 'ic_7486_pin_5', from: { row: 13, col: 'B' }, to: { row: 14, col: 'E' }, color: '#f59e0b', label: 'B1 -> XOR2 Pin 5' },
        { id: 'w_b1_xor3', fromPinId: 'sw_out_in_b1', toPinId: 'ic_7486_pin_9', from: { row: 13, col: 'C' }, to: { row: 15, col: 'F' }, color: '#f59e0b', label: 'B1 -> XOR3 Pin 9' },
        // XOR2 Out (Pin 6) is G1 -> G1 LED
        { id: 'w_g1', fromPinId: 'ic_7486_pin_6', toPinId: 'led_in_out_g1', from: { row: 15, col: 'E' }, to: { row: 15, col: 'I' }, color: '#22c55e', label: 'XOR2 Pin 6 -> G1 LED' },
        // B0 to XOR3 Pin 10 (7486 Pin 10)
        { id: 'w_b0_xor3', fromPinId: 'sw_out_in_b0', toPinId: 'ic_7486_pin_10', from: { row: 14, col: 'B' }, to: { row: 14, col: 'F' }, color: '#ec4899', label: 'B0 -> XOR3 Pin 10' },
        // XOR3 Out (Pin 8) is G0 -> G0 LED
        { id: 'w_g0', fromPinId: 'ic_7486_pin_8', toPinId: 'led_in_out_g0', from: { row: 16, col: 'F' }, to: { row: 17, col: 'I' }, color: '#22c55e', label: 'XOR3 Pin 8 -> G0 LED' },
      ],
      truthTable: [
        { inputs: { B3: 0, B2: 0, B1: 0, B0: 0 }, outputs: { G3: 0, G2: 0, G1: 0, G0: 0 }, label: 'Dec 0' },
        { inputs: { B3: 0, B2: 0, B1: 0, B0: 1 }, outputs: { G3: 0, G2: 0, G1: 0, G0: 1 }, label: 'Dec 1' },
        { inputs: { B3: 0, B2: 0, B1: 1, B0: 0 }, outputs: { G3: 0, G2: 0, G1: 1, G0: 1 }, label: 'Dec 2' },
        { inputs: { B3: 0, B2: 0, B1: 1, B0: 1 }, outputs: { G3: 0, G2: 0, G1: 1, G0: 0 }, label: 'Dec 3' },
        { inputs: { B3: 0, B2: 1, B0: 0, B1: 0 }, outputs: { G3: 0, G2: 1, G1: 1, G0: 0 }, label: 'Dec 4' },
        { inputs: { B3: 0, B2: 1, B0: 1, B1: 0 }, outputs: { G3: 0, G2: 1, G1: 1, G0: 1 }, label: 'Dec 5' },
        { inputs: { B3: 0, B2: 1, B0: 0, B1: 1 }, outputs: { G3: 0, G2: 1, G1: 0, G0: 1 }, label: 'Dec 6' },
        { inputs: { B3: 0, B2: 1, B0: 1, B1: 1 }, outputs: { G3: 0, G2: 1, G1: 0, G0: 0 }, label: 'Dec 7' },
        { inputs: { B3: 1, B2: 0, B1: 0, B0: 0 }, outputs: { G3: 1, G2: 1, G1: 0, G0: 0 }, label: 'Dec 8' },
        { inputs: { B3: 1, B2: 0, B1: 0, B0: 1 }, outputs: { G3: 1, G2: 1, G1: 0, G0: 1 }, label: 'Dec 9' },
        { inputs: { B3: 1, B2: 0, B1: 1, B0: 0 }, outputs: { G3: 1, G2: 1, G1: 1, G0: 1 }, label: 'Dec 10' },
        { inputs: { B3: 1, B2: 0, B1: 1, B0: 1 }, outputs: { G3: 1, G2: 1, G1: 1, G0: 0 }, label: 'Dec 11' },
        { inputs: { B3: 1, B2: 1, B0: 0, B1: 0 }, outputs: { G3: 1, G2: 0, G1: 1, G0: 0 }, label: 'Dec 12' },
        { inputs: { B3: 1, B2: 1, B0: 1, B1: 0 }, outputs: { G3: 1, G2: 0, G1: 1, G0: 1 }, label: 'Dec 13' },
        { inputs: { B3: 1, B2: 1, B0: 0, B1: 1 }, outputs: { G3: 1, G2: 0, G1: 0, G0: 1 }, label: 'Dec 14' },
        { inputs: { B3: 1, B2: 1, B0: 1, B1: 1 }, outputs: { G3: 1, G2: 0, G1: 0, G0: 0 }, label: 'Dec 15' },
      ],
      booleanExpression: {
        primary: 'G_3 = B_3,\\quad G_2 = B_3 \\oplus B_2,\\quad G_1 = B_2 \\oplus B_1,\\quad G_0 = B_1 \\oplus B_0',
      },
      explanationSteps: [
        {
          step: 1,
          title: 'MSB Direct Transfer',
          description: 'The most significant bit G3 is identical to binary MSB B3 (no gate required).',
          formulaSnippet: 'G_3 = B_3',
        },
        {
          step: 2,
          title: 'Bit 2 Conversion',
          description: 'G2 is computed by XORing B3 and B2 using Gate 1.',
          formulaSnippet: 'G_2 = B_3 \\oplus B_2',
          highlightComponentId: 'ic_7486',
          highlightPins: [1, 2, 3],
        },
        {
          step: 3,
          title: 'Bit 1 Conversion',
          description: 'G1 is computed by XORing B2 and B1 using Gate 2.',
          formulaSnippet: 'G_1 = B_2 \\oplus B_1',
          highlightComponentId: 'ic_7486',
          highlightPins: [4, 5, 6],
        },
        {
          step: 4,
          title: 'LSB Conversion',
          description: 'G0 is computed by XORing B1 and B0 using Gate 3.',
          formulaSnippet: 'G_0 = B_1 \\oplus B_0',
          highlightComponentId: 'ic_7486',
          highlightPins: [8, 9, 10],
        },
      ],
    },
    {
      id: 'gray_to_bin',
      name: 'Gray to Binary Code Converter',
      subtitle: '4-bit Gray (G3..G0) to 4-bit Binary (B3..B0)',
      description: 'B3 = G3, B2 = G3 ⊕ G2, B1 = B2 ⊕ G1, B0 = B1 ⊕ G0 (Cascaded XOR gates)',
      ics: [
        { instanceId: 'ic_7486', partNumber: '7486', label: 'IC 7486 (Quad XOR)', rowStart: 10 },
      ],
      inputs: [
        { id: 'in_g3', label: 'G3 (MSB)', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } },
        { id: 'in_g2', label: 'G2', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
        { id: 'in_g1', label: 'G1', defaultState: DigitalSignal.LOW, boardConnection: { row: 13, col: 'B' } },
        { id: 'in_g0', label: 'G0 (LSB)', defaultState: DigitalSignal.LOW, boardConnection: { row: 14, col: 'B' } },
      ],
      outputs: [
        { id: 'out_b3', label: 'B3', color: 'green', boardConnection: { row: 10, col: 'I' } },
        { id: 'out_b2', label: 'B2', color: 'green', boardConnection: { row: 12, col: 'I' } },
        { id: 'out_b1', label: 'B1', color: 'green', boardConnection: { row: 15, col: 'I' } },
        { id: 'out_b0', label: 'B0', color: 'green', boardConnection: { row: 17, col: 'I' } },
      ],
      wires: [
        { id: 'w_vcc', fromPinId: 'pwr_vcc', toPinId: 'ic_7486_pin_14', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444' },
        { id: 'w_gnd', fromPinId: 'pwr_gnd', toPinId: 'ic_7486_pin_7', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b' },
        // G3 directly to B3 LED and to XOR1 Pin 1
        { id: 'w_g3_b3', fromPinId: 'sw_out_in_g3', toPinId: 'led_in_out_b3', from: { row: 10, col: 'B' }, to: { row: 10, col: 'I' }, color: '#3b82f6', label: 'G3 -> B3 LED' },
        { id: 'w_g3_xor1', fromPinId: 'sw_out_in_g3', toPinId: 'ic_7486_pin_1', from: { row: 10, col: 'B' }, to: { row: 10, col: 'E' }, color: '#3b82f6', label: 'G3 -> XOR1 Pin 1' },
        // G2 to XOR1 Pin 2
        { id: 'w_g2_xor1', fromPinId: 'sw_out_in_g2', toPinId: 'ic_7486_pin_2', from: { row: 11, col: 'B' }, to: { row: 11, col: 'E' }, color: '#10b981', label: 'G2 -> XOR1 Pin 2' },
        // XOR1 Out (Pin 3) is B2 -> B2 LED and cascades into XOR2 Pin 4
        { id: 'w_b2_led', fromPinId: 'ic_7486_pin_3', toPinId: 'led_in_out_b2', from: { row: 12, col: 'E' }, to: { row: 12, col: 'I' }, color: '#22c55e', label: 'B2 -> LED' },
        { id: 'w_b2_cascade', fromPinId: 'ic_7486_pin_3', toPinId: 'ic_7486_pin_4', from: { row: 12, col: 'D' }, to: { row: 13, col: 'E' }, color: '#22c55e', label: 'B2 -> XOR2 Pin 4' },
        // G1 to XOR2 Pin 5
        { id: 'w_g1_xor2', fromPinId: 'sw_out_in_g1', toPinId: 'ic_7486_pin_5', from: { row: 13, col: 'B' }, to: { row: 14, col: 'E' }, color: '#f59e0b', label: 'G1 -> XOR2 Pin 5' },
        // XOR2 Out (Pin 6) is B1 -> B1 LED and cascades into XOR3 Pin 9
        { id: 'w_b1_led', fromPinId: 'ic_7486_pin_6', toPinId: 'led_in_out_b1', from: { row: 15, col: 'E' }, to: { row: 15, col: 'I' }, color: '#22c55e', label: 'B1 -> LED' },
        { id: 'w_b1_cascade', fromPinId: 'ic_7486_pin_6', toPinId: 'ic_7486_pin_9', from: { row: 15, col: 'D' }, to: { row: 15, col: 'F' }, color: '#22c55e', label: 'B1 -> XOR3 Pin 9' },
        // G0 to XOR3 Pin 10
        { id: 'w_g0_xor3', fromPinId: 'sw_out_in_g0', toPinId: 'ic_7486_pin_10', from: { row: 14, col: 'B' }, to: { row: 14, col: 'F' }, color: '#ec4899', label: 'G0 -> XOR3 Pin 10' },
        // XOR3 Out (Pin 8) is B0 -> B0 LED
        { id: 'w_b0_led', fromPinId: 'ic_7486_pin_8', toPinId: 'led_in_out_b0', from: { row: 16, col: 'F' }, to: { row: 17, col: 'I' }, color: '#22c55e', label: 'B0 -> LED' },
      ],
      truthTable: [
        { inputs: { G3: 0, G2: 0, G1: 0, G0: 0 }, outputs: { B3: 0, B2: 0, B1: 0, B0: 0 }, label: 'Dec 0' },
        { inputs: { G3: 0, G2: 0, G1: 0, G0: 1 }, outputs: { B3: 0, B2: 0, B1: 0, B0: 1 }, label: 'Dec 1' },
        { inputs: { G3: 0, G2: 0, G1: 1, G0: 1 }, outputs: { B3: 0, B2: 0, B1: 1, B0: 0 }, label: 'Dec 2' },
        { inputs: { G3: 0, G2: 0, G1: 1, G0: 0 }, outputs: { B3: 0, B2: 0, B1: 1, B0: 1 }, label: 'Dec 3' },
        { inputs: { G3: 0, G2: 1, G1: 1, G0: 0 }, outputs: { B3: 0, B2: 1, B0: 0, B1: 0 }, label: 'Dec 4' },
        { inputs: { G3: 0, G2: 1, G1: 1, G0: 1 }, outputs: { B3: 0, B2: 1, B0: 1, B1: 0 }, label: 'Dec 5' },
        { inputs: { G3: 0, G2: 1, G1: 0, G0: 1 }, outputs: { B3: 0, B2: 1, B0: 0, B1: 1 }, label: 'Dec 6' },
        { inputs: { G3: 0, G2: 1, G1: 0, G0: 0 }, outputs: { B3: 0, B2: 1, B0: 1, B1: 1 }, label: 'Dec 7' },
        { inputs: { G3: 1, G2: 1, G1: 0, G0: 0 }, outputs: { B3: 1, B2: 0, B1: 0, B0: 0 }, label: 'Dec 8' },
        { inputs: { G3: 1, G2: 1, G1: 0, G0: 1 }, outputs: { B3: 1, B2: 0, B1: 0, B0: 1 }, label: 'Dec 9' },
        { inputs: { G3: 1, G2: 1, G1: 1, G0: 1 }, outputs: { B3: 1, B2: 0, B1: 1, B0: 0 }, label: 'Dec 10' },
        { inputs: { G3: 1, G2: 1, G1: 1, G0: 0 }, outputs: { B3: 1, B2: 0, B1: 1, B0: 1 }, label: 'Dec 11' },
        { inputs: { G3: 1, G2: 0, G1: 1, G0: 0 }, outputs: { B3: 1, B2: 1, B0: 0, B1: 0 }, label: 'Dec 12' },
        { inputs: { G3: 1, G2: 0, G1: 1, G0: 1 }, outputs: { B3: 1, B2: 1, B0: 1, B1: 0 }, label: 'Dec 13' },
        { inputs: { G3: 1, G2: 0, G1: 0, G0: 1 }, outputs: { B3: 1, B2: 1, B0: 0, B1: 1 }, label: 'Dec 14' },
        { inputs: { G3: 1, G2: 0, G1: 0, G0: 0 }, outputs: { B3: 1, B2: 1, B0: 1, B1: 1 }, label: 'Dec 15' },
      ],
      booleanExpression: {
        primary: 'B_3 = G_3,\\quad B_2 = G_3 \\oplus G_2,\\quad B_1 = B_2 \\oplus G_1,\\quad B_0 = B_1 \\oplus G_0',
      },
      explanationSteps: [
        {
          step: 1,
          title: 'MSB Direct Transfer',
          description: 'B3 is set directly from G3.',
          formulaSnippet: 'B_3 = G_3',
        },
        {
          step: 2,
          title: 'Cascaded Bit 2 Computation',
          description: 'B2 is generated by XORing G3 and G2.',
          formulaSnippet: 'B_2 = G_3 \\oplus G_2 = B_3 \\oplus G_2',
          highlightPins: [1, 2, 3],
        },
        {
          step: 3,
          title: 'Cascaded Bit 1 Computation',
          description: 'B1 is generated by XORing previously computed B2 with G1.',
          formulaSnippet: 'B_1 = B_2 \\oplus G_1',
          highlightPins: [4, 5, 6],
        },
        {
          step: 4,
          title: 'Cascaded LSB Computation',
          description: 'B0 is generated by XORing previously computed B1 with G0.',
          formulaSnippet: 'B_0 = B_1 \\oplus G_0',
          highlightPins: [8, 9, 10],
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount IC 7486 across the center trough of the breadboard.' },
    { stepNumber: 2, instruction: 'Connect Pin 14 to +5V and Pin 7 to GND.' },
    { stepNumber: 3, instruction: 'For Binary to Gray: connect input switches B3..B0 and route outputs of XOR gates to output LEDs G3..G0.' },
    { stepNumber: 4, instruction: 'For Gray to Binary: cascade the XOR outputs so that Bi = B(i+1) ⊕ Gi.' },
    { stepNumber: 5, instruction: 'Test all 16 input combinations (0000 to 1111) and record outputs.' },
  ],
  conclusion: 'Binary to Gray and Gray to Binary code converters were designed using XOR gates and verified against their complete truth tables.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'What is a Gray code and why is it called a unit-distance code?',
      answer: 'Gray code is a binary numeral system where two successive values differ in only one bit position. This single-bit transition prevents erroneous states during mechanical rotation or asynchronous transitions.',
      hint: 'Compare consecutive codes in the truth table.',
    },
    {
      id: 'v2',
      category: 'Intermediate',
      question: 'Why is Gray code widely used in optical shaft encoders?',
      answer: 'Because with standard binary, multiple bits change simultaneously (e.g. 0111 to 1000 changes 4 bits), which can cause false readings due to minor mechanical misalignment. Gray code only changes 1 bit at any boundary.',
      hint: 'Think about physical sensor alignment.',
    },
    {
      id: 'v3',
      category: 'Advanced',
      question: 'How do the circuit topologies of Binary-to-Gray and Gray-to-Binary differ?',
      answer: 'Binary-to-Gray is a feed-forward parallel circuit where XOR inputs come purely from input bits (Gi = Bi ⊕ Bi-1). Gray-to-Binary is a cascaded circuit where each XOR gate takes the output of the preceding stage (Bi = Bi+1 ⊕ Gi).',
      hint: 'Look at where the second input of each XOR gate originates.',
    },
    {
      id: 'v4',
      category: 'Basic',
      question: 'Is Gray code a weighted code like 8421 BCD?',
      answer: 'No, Gray code is an unweighted code. Positional weights (such as 2^0, 2^1, 2^2) do not apply to Gray code bit positions.',
      hint: 'Consider whether each bit column has a fixed numeric weight.',
    },
    {
      id: 'v5',
      category: 'Intermediate',
      question: 'Why is Gray code also referred to as a cyclic or reflected code?',
      answer: 'Because the lower bits reflect symmetrically about the midpoint as higher bits are added, and the transition from the last state back to the first state involves only a 1-bit change.',
      hint: 'Look at the reflective symmetry of bits in the table.',
    },
    {
      id: 'v6',
      category: 'Advanced',
      question: 'What is the propagation delay of an n-bit Gray-to-Binary converter compared to Binary-to-Gray?',
      answer: 'In Binary-to-Gray, all bits are computed concurrently with 1 XOR gate delay. In Gray-to-Binary, each bit cascades into the next, resulting in a worst-case delay of (n-1) XOR gate propagation delays.',
      hint: 'Consider the ripple effect in Gray-to-Binary.',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'What is the Gray code equivalent of binary 1011 (decimal 11)?',
      options: ['1110', '1101', '1010', '1111'],
      correctIndex: 0,
      explanation: 'G3 = 1; G2 = 1 ⊕ 0 = 1; G1 = 0 ⊕ 1 = 1; G0 = 1 ⊕ 1 = 0. Result: 1110.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'What is the binary equivalent of Gray code 1100 (decimal 8)?',
      options: ['1000', '1010', '1111', '0110'],
      correctIndex: 0,
      explanation: 'B3 = 1; B2 = 1 ⊕ 1 = 0; B1 = 0 ⊕ 0 = 0; B0 = 0 ⊕ 0 = 0. Result: 1000.',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'What is the Gray code for binary 0100 (decimal 4)?',
      options: ['0110', '0101', '0111', '0010'],
      correctIndex: 0,
      explanation: 'G3 = 0, G2 = 0 ⊕ 1 = 1, G1 = 1 ⊕ 0 = 1, G0 = 0 ⊕ 0 = 0. Result: 0110.',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'In a 4-bit Binary-to-Gray converter, how many XOR gates are required?',
      options: ['2', '3', '4', '5'],
      correctIndex: 1,
      explanation: 'G3 is directly connected to B3 (0 gates). G2, G1, and G0 each require 1 XOR gate, giving 3 XOR gates total.',
    },
    {
      id: 'q5',
      type: 'MCQ',
      question: 'Which property makes Gray code essential for asynchronous FIFO pointer synchronization?',
      options: [
        'Only 1 bit changes at any counter increment, eliminating multi-bit metastability glitches across clock domains',
        'It has positional bit weights',
        'It performs modulo-10 counting directly',
        'It uses fewer bits than binary code',
      ],
      correctIndex: 0,
      explanation: 'Single-bit transitions guarantee that a clock synchronizer will sample either the old value or new value, never a corrupted intermediate value.',
    },
  ],
  commonMistakes: [
    {
      title: 'Inverting Cascade Direction in Gray to Binary',
      mistake: 'Wiring the cascade from LSB to MSB instead of starting from the MSB (B3 = G3).',
      remedy: 'Always start from the MSB bit: B3 is directly G3, and then cascades downwards to B2, B1, and B0.',
      impact: 'Completely corrupted binary output.',
    },
    {
      title: 'Missing MSB Direct Connection',
      mistake: 'Passing MSB through an XOR gate with ground instead of direct connection.',
      remedy: 'MSB in both converters transfers directly: G3 = B3 and B3 = G3.',
      impact: 'Unnecessary gate delay or wrong logic if miswired.',
    },
  ],
};
