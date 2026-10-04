import { Experiment } from '../types';
import { DigitalSignal } from '../../simulator/engine/types';

export const EXP2_UNIVERSAL_GATES: Experiment = {
  id: 'exp2',
  experimentNumber: 2,
  title: 'Universal Gates (NAND & NOR Realizations)',
  aim: 'To realize the basic gates (NOT, AND, OR, NOR, NAND) using NAND and NOR gates.',
  theory: {
    summary: 'The NAND and NOR gates are known as universal gates because any combinational logic circuit or Boolean expression can be constructed exclusively using only NAND gates or only NOR gates.',
    detailed: `The NAND and NOR gates are known as universal gates, since any logic function can be implemented using these two gates.

According to De Morgan's Laws:
1. \\overline{A \\cdot B} = \\overline{A} + \\overline{B}
2. \\overline{A + B} = \\overline{A} \\cdot \\overline{B}

By applying De Morgan's theorems and involution (double negation \\overline{\\overline{A}} = A), any gate can be synthesized:
- An Inverter (NOT) is obtained by tying the two inputs of a NAND or NOR gate together.
- An AND gate is obtained from NAND followed by an inverter.
- An OR gate is obtained using NAND gates by inverting each input before feeding into a NAND gate.
- Similarly, with NOR gates, inverted inputs into a NOR gate produce an AND function, while a NOR followed by an inverter produces an OR function.`,
    keyPoints: [
      'NAND and NOR can implement all 3 basic logic operations: NOT, AND, OR.',
      'De Morgan\'s laws justify universal gate equivalence.',
      'IC 7400 contains 4 NAND gates, sufficient to implement NOT, AND, OR, or NOR.',
      'IC 7402 contains 4 NOR gates with outputs on pins 1, 4, 10, 13.',
    ],
  },
  components: [
    { name: 'Breadboard', quantity: 1, category: 'PASSIVE' },
    { name: 'Connecting Wires', quantity: 15, category: 'PASSIVE' },
    { name: '5V Power Supply', quantity: 1, spec: '+5V DC Regulated', category: 'POWER' },
    { name: 'Crocodile Clips', quantity: 2, category: 'PASSIVE' },
    { name: '330Ω Resistors', quantity: 2, category: 'PASSIVE' },
    { name: 'LEDs', quantity: 2, category: 'OUTPUT' },
    { name: 'IC 7400', quantity: 1, spec: 'Quad 2-Input NAND Gate DIP-14', category: 'IC' },
    { name: 'IC 7402', quantity: 1, spec: 'Quad 2-Input NOR Gate DIP-14', category: 'IC' },
  ],
  subCircuits: [
    {
      id: 'nand_as_not',
      name: 'NAND as NOT',
      subtitle: 'IC 7400 with tied inputs',
      description: 'Both inputs tied together: Y = (A · A)\' = A\'',
      ics: [{ instanceId: 'ic_7400', partNumber: '7400', label: 'IC 7400 (NAND)', rowStart: 10 }],
      inputs: [{ id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } }],
      outputs: [{ id: 'out_y', label: 'Y', color: 'red', boardConnection: { row: 12, col: 'I' } }],
      wires: [
        { id: 'w_vcc', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444', label: 'VCC (+5V)' },
        { id: 'w_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b', label: 'GND (0V)' },
        // A connects to both Pin 1 and Pin 2
        { id: 'w_in_a1', from: { row: 10, col: 'B' }, to: { row: 10, col: 'E' }, color: '#3b82f6', label: 'A -> Pin 1' },
        { id: 'w_in_a2', from: { row: 10, col: 'D' }, to: { row: 11, col: 'D' }, color: '#3b82f6', label: 'Jumper Pin 1 to Pin 2' },
        // Pin 3 out to LED
        { id: 'w_out', from: { row: 12, col: 'E' }, to: { row: 12, col: 'I' }, color: '#f59e0b', label: 'Pin 3 (Y) -> LED' },
      ],
      truthTable: [
        { inputs: { A: 0 }, outputs: { Y: 1 } },
        { inputs: { A: 1 }, outputs: { Y: 0 } },
      ],
      booleanExpression: {
        primary: 'Y = \\overline{A \\cdot A} = \\overline{A}',
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Input Tie Connection',
          description: 'Input signal A is wired to both Pin 1 and Pin 2 of the 7400 NAND gate.',
          formulaSnippet: '1A = A,\\; 1B = A',
          highlightPins: [1, 2],
        },
        {
          step: 2,
          title: 'NAND Inversion Principle',
          description: 'Since both inputs are identical, the NAND operation (A · A)\' simplifies directly to A\' (NOT A).',
          formulaSnippet: 'Y = \\overline{A \\cdot A} = \\overline{A}',
          highlightPins: [1, 2, 3],
        },
      ],
    },
    {
      id: 'nand_as_and',
      name: 'NAND as AND',
      subtitle: 'NAND followed by NAND Inverter',
      description: 'NAND gate followed by an inverter NAND gate: Y = ((A · B)\')\' = A · B',
      ics: [{ instanceId: 'ic_7400', partNumber: '7400', label: 'IC 7400 (NAND)', rowStart: 10 }],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
      ],
      outputs: [{ id: 'out_y', label: 'Y', color: 'red', boardConnection: { row: 15, col: 'I' } }],
      wires: [
        { id: 'w_vcc', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444', label: 'VCC (+5V)' },
        { id: 'w_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b', label: 'GND (0V)' },
        // Gate 1 inputs
        { id: 'w_in_a', from: { row: 10, col: 'B' }, to: { row: 10, col: 'E' }, color: '#3b82f6', label: 'A -> Pin 1' },
        { id: 'w_in_b', from: { row: 11, col: 'B' }, to: { row: 11, col: 'E' }, color: '#10b981', label: 'B -> Pin 2' },
        // Gate 1 out (Pin 3) into Gate 2 inputs (Pins 4 & 5 tied)
        { id: 'w_inter', from: { row: 12, col: 'E' }, to: { row: 13, col: 'E' }, color: '#8b5cf6', label: 'Pin 3 (NAND out) -> Pin 4' },
        { id: 'w_tie', from: { row: 13, col: 'D' }, to: { row: 14, col: 'D' }, color: '#8b5cf6', label: 'Tie Pin 4 to Pin 5' },
        // Gate 2 out (Pin 6) to LED
        { id: 'w_out', from: { row: 15, col: 'E' }, to: { row: 15, col: 'I' }, color: '#f59e0b', label: 'Pin 6 (Y) -> LED' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0 }, outputs: { Y: 0 } },
        { inputs: { A: 0, B: 1 }, outputs: { Y: 0 } },
        { inputs: { A: 1, B: 0 }, outputs: { Y: 0 } },
        { inputs: { A: 1, B: 1 }, outputs: { Y: 1 } },
      ],
      booleanExpression: {
        primary: 'Y = \\overline{\\overline{A \\cdot B}} = A \\cdot B',
        intermediate: ['X = \\overline{A \\cdot B}', 'Y = \\overline{X \\cdot X} = X\' = A \\cdot B'],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'First NAND Stage',
          description: 'Gate 1 calculates the NAND of inputs A and B at Pin 3.',
          formulaSnippet: 'X = \\overline{A \\cdot B}',
          highlightPins: [1, 2, 3],
        },
        {
          step: 2,
          title: 'Inverting Stage',
          description: 'Gate 2 has its inputs (Pins 4 and 5) tied together, inverting X back to A · B.',
          formulaSnippet: 'Y = \\overline{X} = A \\cdot B',
          highlightPins: [4, 5, 6],
        },
      ],
    },
    {
      id: 'nand_as_or',
      name: 'NAND as OR',
      subtitle: '3 NAND Gates (De Morgan)',
      description: 'Invert inputs with 2 NANDs, feed into 3rd NAND: Y = (A\' · B\')\' = A + B',
      ics: [{ instanceId: 'ic_7400', partNumber: '7400', label: 'IC 7400 (NAND)', rowStart: 10 }],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 10, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 13, col: 'B' } },
      ],
      outputs: [{ id: 'out_y', label: 'Y', color: 'red', boardConnection: { row: 15, col: 'J' } }],
      wires: [
        { id: 'w_vcc', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444', label: 'VCC (+5V)' },
        { id: 'w_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b', label: 'GND (0V)' },
        // A into Gate 1 (pins 1, 2 tied) -> Pin 3 is A'
        { id: 'w_a1', from: { row: 10, col: 'B' }, to: { row: 10, col: 'E' }, color: '#3b82f6', label: 'A -> Pin 1' },
        { id: 'w_a2', from: { row: 10, col: 'D' }, to: { row: 11, col: 'D' }, color: '#3b82f6', label: 'Tie Pin 1 & 2' },
        // B into Gate 2 (pins 4, 5 tied) -> Pin 6 is B'
        { id: 'w_b1', from: { row: 13, col: 'B' }, to: { row: 13, col: 'E' }, color: '#10b981', label: 'B -> Pin 4' },
        { id: 'w_b2', from: { row: 13, col: 'D' }, to: { row: 14, col: 'D' }, color: '#10b981', label: 'Tie Pin 4 & 5' },
        // Pin 3 (A') to Gate 3 Pin 9 (row 15, col F); Pin 6 (B') to Gate 3 Pin 10 (row 14, col F)
        { id: 'w_g3_1', from: { row: 12, col: 'E' }, to: { row: 15, col: 'F' }, color: '#8b5cf6', label: 'Pin 3 (A\') -> Pin 9' },
        { id: 'w_g3_2', from: { row: 15, col: 'E' }, to: { row: 14, col: 'F' }, color: '#ec4899', label: 'Pin 6 (B\') -> Pin 10' },
        // Gate 3 Output Pin 8 (row 16, col F) to LED
        { id: 'w_out', from: { row: 16, col: 'F' }, to: { row: 15, col: 'J' }, color: '#f59e0b', label: 'Pin 8 (Y) -> LED' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0 }, outputs: { Y: 0 } },
        { inputs: { A: 0, B: 1 }, outputs: { Y: 1 } },
        { inputs: { A: 1, B: 0 }, outputs: { Y: 1 } },
        { inputs: { A: 1, B: 1 }, outputs: { Y: 1 } },
      ],
      booleanExpression: {
        primary: 'Y = \\overline{\\overline{A} \\cdot \\overline{B}} = A + B',
        intermediate: ['\\text{Gate 1}: \\overline{A}', '\\text{Gate 2}: \\overline{B}', '\\text{Gate 3}: \\overline{\\overline{A} \\cdot \\overline{B}} = A + B'],
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Input Inversions',
          description: 'Gate 1 produces A\' and Gate 2 produces B\' by tying their respective inputs.',
          formulaSnippet: '\\overline{A},\\; \\overline{B}',
          highlightPins: [1, 2, 3, 4, 5, 6],
        },
        {
          step: 2,
          title: 'De Morgan Combining Stage',
          description: 'Gate 3 performs NAND on the inverted inputs: (A\' · B\')\'. By De Morgan\'s theorem, this equals A + B (OR function).',
          formulaSnippet: 'Y = \\overline{\\overline{A} \\cdot \\overline{B}} = A + B',
          highlightPins: [8, 9, 10],
        },
      ],
    },
    {
      id: 'nor_as_not',
      name: 'NOR as NOT',
      subtitle: 'IC 7402 with tied inputs',
      description: 'Inputs tied together: Y = (A + A)\' = A\' (Output is Pin 1)',
      ics: [{ instanceId: 'ic_7402', partNumber: '7402', label: 'IC 7402 (NOR)', rowStart: 10 }],
      inputs: [{ id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } }],
      outputs: [{ id: 'out_y', label: 'Y', color: 'red', boardConnection: { row: 10, col: 'I' } }],
      wires: [
        { id: 'w_vcc', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444', label: 'VCC (+5V)' },
        { id: 'w_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b', label: 'GND (0V)' },
        // A into Pin 2 and 3
        { id: 'w_in_a1', from: { row: 11, col: 'B' }, to: { row: 11, col: 'E' }, color: '#3b82f6', label: 'A -> Pin 2' },
        { id: 'w_in_a2', from: { row: 11, col: 'D' }, to: { row: 12, col: 'D' }, color: '#3b82f6', label: 'Tie Pin 2 to Pin 3' },
        // Pin 1 out to LED
        { id: 'w_out', from: { row: 10, col: 'E' }, to: { row: 10, col: 'I' }, color: '#f59e0b', label: 'Pin 1 (Y) -> LED' },
      ],
      truthTable: [
        { inputs: { A: 0 }, outputs: { Y: 1 } },
        { inputs: { A: 1 }, outputs: { Y: 0 } },
      ],
      booleanExpression: {
        primary: 'Y = \\overline{A + A} = \\overline{A}',
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Input Tie on IC 7402',
          description: 'Input A connects to both Pin 2 and Pin 3. Output is Pin 1.',
          formulaSnippet: '1A = A,\\; 1B = A \\implies 1Y = \\overline{A}',
          highlightPins: [1, 2, 3],
        },
      ],
    },
    {
      id: 'nor_as_or',
      name: 'NOR as OR',
      subtitle: 'NOR followed by NOR Inverter',
      description: 'NOR gate followed by an inverter NOR: Y = ((A + B)\')\' = A + B',
      ics: [{ instanceId: 'ic_7402', partNumber: '7402', label: 'IC 7402 (NOR)', rowStart: 10 }],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 12, col: 'B' } },
      ],
      outputs: [{ id: 'out_y', label: 'Y', color: 'red', boardConnection: { row: 13, col: 'I' } }],
      wires: [
        { id: 'w_vcc', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444', label: 'VCC (+5V)' },
        { id: 'w_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b', label: 'GND (0V)' },
        // A -> Pin 2, B -> Pin 3
        { id: 'w_in_a', from: { row: 11, col: 'B' }, to: { row: 11, col: 'E' }, color: '#3b82f6', label: 'A -> Pin 2' },
        { id: 'w_in_b', from: { row: 12, col: 'B' }, to: { row: 12, col: 'E' }, color: '#10b981', label: 'B -> Pin 3' },
        // Pin 1 (NOR out) into Gate 2 inputs (Pins 5 & 6 tied)
        { id: 'w_inter', from: { row: 10, col: 'E' }, to: { row: 14, col: 'E' }, color: '#8b5cf6', label: 'Pin 1 -> Pin 5' },
        { id: 'w_tie', from: { row: 14, col: 'D' }, to: { row: 15, col: 'D' }, color: '#8b5cf6', label: 'Tie Pin 5 to Pin 6' },
        // Gate 2 out is Pin 4 (row 13, col E) to LED
        { id: 'w_out', from: { row: 13, col: 'E' }, to: { row: 13, col: 'I' }, color: '#f59e0b', label: 'Pin 4 (Y) -> LED' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0 }, outputs: { Y: 0 } },
        { inputs: { A: 0, B: 1 }, outputs: { Y: 1 } },
        { inputs: { A: 1, B: 0 }, outputs: { Y: 1 } },
        { inputs: { A: 1, B: 1 }, outputs: { Y: 1 } },
      ],
      booleanExpression: {
        primary: 'Y = \\overline{\\overline{A + B}} = A + B',
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Initial NOR Stage',
          description: 'Gate 1 (Pins 2 & 3 in, Pin 1 out) calculates (A + B)\'.',
          formulaSnippet: 'X = \\overline{A + B}',
          highlightPins: [1, 2, 3],
        },
        {
          step: 2,
          title: 'Inversion Stage',
          description: 'Gate 2 (Pins 5 & 6 in, Pin 4 out) inverts X, restoring the original OR function.',
          formulaSnippet: 'Y = \\overline{X} = A + B',
          highlightPins: [4, 5, 6],
        },
      ],
    },
    {
      id: 'nor_as_and',
      name: 'NOR as AND',
      subtitle: '3 NOR Gates (De Morgan)',
      description: 'Invert inputs with 2 NORs, feed into 3rd NOR: Y = (A\' + B\')\' = A · B',
      ics: [{ instanceId: 'ic_7402', partNumber: '7402', label: 'IC 7402 (NOR)', rowStart: 10 }],
      inputs: [
        { id: 'in_a', label: 'A', defaultState: DigitalSignal.LOW, boardConnection: { row: 11, col: 'B' } },
        { id: 'in_b', label: 'B', defaultState: DigitalSignal.LOW, boardConnection: { row: 14, col: 'B' } },
      ],
      outputs: [{ id: 'out_y', label: 'Y', color: 'red', boardConnection: { row: 14, col: 'J' } }],
      wires: [
        { id: 'w_vcc', from: { row: 10, col: 'L+' }, to: { row: 10, col: 'J' }, color: '#ef4444', label: 'VCC (+5V)' },
        { id: 'w_gnd', from: { row: 16, col: 'L-' }, to: { row: 16, col: 'A' }, color: '#1e293b', label: 'GND (0V)' },
        // Gate 1: A into Pins 2 & 3 tied -> Out Pin 1 (A')
        { id: 'w_a1', from: { row: 11, col: 'B' }, to: { row: 11, col: 'E' }, color: '#3b82f6', label: 'A -> Pin 2' },
        { id: 'w_a2', from: { row: 11, col: 'D' }, to: { row: 12, col: 'D' }, color: '#3b82f6', label: 'Tie Pin 2 & 3' },
        // Gate 2: B into Pins 5 & 6 tied -> Out Pin 4 (B')
        { id: 'w_b1', from: { row: 14, col: 'B' }, to: { row: 14, col: 'E' }, color: '#10b981', label: 'B -> Pin 5' },
        { id: 'w_b2', from: { row: 14, col: 'D' }, to: { row: 15, col: 'D' }, color: '#10b981', label: 'Tie Pin 5 & 6' },
        // Gate 3 has inputs at Pin 8 (row 16, col F) and Pin 9 (row 15, col F), Output at Pin 10 (row 14, col F)
        { id: 'w_g3_1', from: { row: 10, col: 'E' }, to: { row: 16, col: 'F' }, color: '#8b5cf6', label: 'Pin 1 (A\') -> Pin 8' },
        { id: 'w_g3_2', from: { row: 13, col: 'E' }, to: { row: 15, col: 'F' }, color: '#ec4899', label: 'Pin 4 (B\') -> Pin 9' },
        // Gate 3 out is Pin 10 to LED
        { id: 'w_out', from: { row: 14, col: 'F' }, to: { row: 14, col: 'J' }, color: '#f59e0b', label: 'Pin 10 (Y) -> LED' },
      ],
      truthTable: [
        { inputs: { A: 0, B: 0 }, outputs: { Y: 0 } },
        { inputs: { A: 0, B: 1 }, outputs: { Y: 0 } },
        { inputs: { A: 1, B: 0 }, outputs: { Y: 0 } },
        { inputs: { A: 1, B: 1 }, outputs: { Y: 1 } },
      ],
      booleanExpression: {
        primary: 'Y = \\overline{\\overline{A} + \\overline{B}} = A \\cdot B',
      },
      explanationSteps: [
        {
          step: 1,
          title: 'Input Inversions with NOR',
          description: 'Two NOR gates invert A and B independently by tying their input pins.',
          formulaSnippet: '\\overline{A},\\; \\overline{B}',
          highlightPins: [1, 2, 3, 4, 5, 6],
        },
        {
          step: 2,
          title: 'De Morgan Conjunction',
          description: 'Feeding A\' and B\' into a third NOR produces (A\' + B\')\' which, by De Morgan\'s theorem, equals A · B.',
          formulaSnippet: 'Y = \\overline{\\overline{A} + \\overline{B}} = A \\cdot B',
          highlightPins: [8, 9, 10],
        },
      ],
    },
  ],
  procedure: [
    { stepNumber: 1, instruction: 'Mount IC 7400 (for NAND realizations) or IC 7402 (for NOR realizations) firmly on the breadboard.' },
    { stepNumber: 2, instruction: 'Connect Pin 14 to +5V (VCC) and Pin 7 to GND.' },
    { stepNumber: 3, instruction: 'Wire the gates according to the selected universal gate circuit diagram.' },
    { stepNumber: 4, instruction: 'Connect the output pin to a 330Ω resistor and LED anode.' },
    { stepNumber: 5, instruction: 'Cycle through all input combinations and verify that the synthesized gate matches the expected basic gate truth table.' },
  ],
  conclusion: 'It has been experimentally verified that NAND and NOR are universal gates as all basic logic functions were successfully synthesized.',
  vivaQuestions: [
    {
      id: 'v1',
      category: 'Basic',
      question: 'Why are NAND and NOR called universal gates?',
      answer: 'Because any Boolean function or basic gate (NOT, AND, OR) can be constructed solely using only NAND gates or only NOR gates without needing any other gate type.',
      hint: 'Think about whether any additional gates are required.',
    },
    {
      id: 'v2',
      category: 'Intermediate',
      question: 'How many 2-input NAND gates are required to construct an OR gate?',
      answer: 'Three 2-input NAND gates are required: two to invert inputs A and B, and a third to combine the inverted inputs (Y = (A\' · B\')\' = A + B).',
      hint: 'Apply De Morgan\'s theorem to A + B.',
    },
    {
      id: 'v3',
      category: 'Intermediate',
      question: 'How many 2-input NOR gates are required to construct an AND gate?',
      answer: 'Three 2-input NOR gates are required: two to invert inputs A and B, and a third to combine them (Y = (A\' + B\')\' = A · B).',
      hint: 'Apply De Morgan\'s theorem to A · B.',
    },
    {
      id: 'v4',
      category: 'Advanced',
      question: 'What are the practical advantages of using universal gates in IC fabrication?',
      answer: 'Using a single type of gate across an entire chip simplifies manufacturing, reduces layout complexity, lowers production costs, and standardizes propagation delays.',
      hint: 'Consider fabrication consistency.',
    },
    {
      id: 'v5',
      category: 'Intermediate',
      question: 'State De Morgan\'s First and Second Laws.',
      answer: 'First Law: (A + B)\' = A\' · B\' (The complement of a sum equals the product of the complements). Second Law: (A · B)\' = A\' + B\' (The complement of a product equals the sum of the complements).',
      hint: 'Recall duality between conjunction and disjunction.',
    },
    {
      id: 'v6',
      category: 'Advanced',
      question: 'How many NAND gates are required to implement a 2-input XOR gate?',
      answer: 'Four 2-input NAND gates are required to implement an XOR gate (A ⊕ B) using the canonical efficient configuration: Gate 1 does (AB)\', Gates 2 & 3 multiply by A and B, and Gate 4 combines them.',
      hint: 'Y = A(AB)\' + B(AB)\'.',
    },
    {
      id: 'v7',
      category: 'Advanced',
      question: 'How many NOR gates are required to implement a 2-input XNOR gate?',
      answer: 'Four 2-input NOR gates are required to implement an XNOR gate (dual of the 4-NAND XOR structure).',
      hint: 'By duality with the 4-NAND XOR implementation.',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'To convert a 2-input NAND gate into an inverter (NOT gate), how should the inputs be connected?',
      options: ['Tie both inputs together', 'Connect one input to GND', 'Leave one input floating', 'Connect both inputs to +5V'],
      correctIndex: 0,
      explanation: 'Tying both inputs together forces A·A = A, so (A·A)\' = A\'.',
    },
    {
      id: 'q2',
      type: 'MCQ',
      question: 'How many NAND gates are needed to construct a 2-input NOR gate?',
      options: ['2', '3', '4', '5'],
      correctIndex: 2,
      explanation: '3 NAND gates are needed to construct OR (A+B), and a 4th NAND gate inverts the result to produce NOR ((A+B)\').',
    },
    {
      id: 'q3',
      type: 'MCQ',
      question: 'How many NOR gates are needed to construct a 2-input AND gate?',
      options: ['2', '3', '4', '5'],
      correctIndex: 1,
      explanation: 'Two NOR inverters complement A and B (giving A\' and B\'), and a 3rd NOR combines them: (A\' + B\')\' = A · B by De Morgan\'s Law.',
    },
    {
      id: 'q4',
      type: 'MCQ',
      question: 'What is the minimum number of NAND gates needed to implement a 2-input XOR gate?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
      explanation: 'Exactly 4 two-input NAND gates are required to implement A ⊕ B without inverted inputs.',
    },
    {
      id: 'q5',
      type: 'MCQ',
      question: 'If one input of a 2-input NOR gate is permanently tied to logic 1 (+5V), what is the output?',
      options: ['Always 0', 'Always 1', 'Equal to the other input', 'Inverted version of the other input'],
      correctIndex: 0,
      explanation: 'For a NOR gate, (A + 1)\' = 1\' = 0 regardless of the value of input A.',
    },
  ],
  commonMistakes: [
    {
      title: 'Floating Second Input on Inverter',
      mistake: 'Connecting input A to only one pin of the NAND gate and leaving the second input unconnected.',
      remedy: 'Tie both input pins together with a jumper wire so both inputs transition together.',
      impact: 'Floating TTL inputs float HIGH, which may invert A, but is prone to electrical noise and violations.',
    },
    {
      title: 'Confusing 7400 and 7402 Gate Orientation',
      mistake: 'Using IC 7402 pin numbers as if it were a 7400.',
      remedy: 'Always reference the 7402 pinout diagram: pin 1 is the output, pins 2 and 3 are inputs.',
      impact: 'Driving an IC output pin with a switch causes high current and wrong logic levels.',
    },
  ],
};
