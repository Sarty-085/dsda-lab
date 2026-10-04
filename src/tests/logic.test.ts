import { describe, it, expect } from 'vitest';
import { evaluateGate } from '../simulator/engine/logic';
import { DigitalSignal } from '../simulator/engine/types';
import { Circuit } from '../simulator/engine/Circuit';
import { IC_7486, IC_7408 } from '../simulator/ics/definitions';

describe('Deterministic Gate Logic', () => {
  it('correctly evaluates NOT gate', () => {
    expect(evaluateGate('NOT', [DigitalSignal.LOW])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('NOT', [DigitalSignal.HIGH])).toEqual([DigitalSignal.LOW]);
  });

  it('correctly evaluates AND gate', () => {
    expect(evaluateGate('AND', [DigitalSignal.LOW, DigitalSignal.LOW])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('AND', [DigitalSignal.LOW, DigitalSignal.HIGH])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('AND', [DigitalSignal.HIGH, DigitalSignal.LOW])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('AND', [DigitalSignal.HIGH, DigitalSignal.HIGH])).toEqual([DigitalSignal.HIGH]);
  });

  it('correctly evaluates OR gate', () => {
    expect(evaluateGate('OR', [DigitalSignal.LOW, DigitalSignal.LOW])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('OR', [DigitalSignal.LOW, DigitalSignal.HIGH])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('OR', [DigitalSignal.HIGH, DigitalSignal.LOW])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('OR', [DigitalSignal.HIGH, DigitalSignal.HIGH])).toEqual([DigitalSignal.HIGH]);
  });

  it('correctly evaluates NAND gate', () => {
    expect(evaluateGate('NAND', [DigitalSignal.LOW, DigitalSignal.LOW])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('NAND', [DigitalSignal.LOW, DigitalSignal.HIGH])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('NAND', [DigitalSignal.HIGH, DigitalSignal.LOW])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('NAND', [DigitalSignal.HIGH, DigitalSignal.HIGH])).toEqual([DigitalSignal.LOW]);
  });

  it('correctly evaluates NOR gate', () => {
    expect(evaluateGate('NOR', [DigitalSignal.LOW, DigitalSignal.LOW])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('NOR', [DigitalSignal.LOW, DigitalSignal.HIGH])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('NOR', [DigitalSignal.HIGH, DigitalSignal.LOW])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('NOR', [DigitalSignal.HIGH, DigitalSignal.HIGH])).toEqual([DigitalSignal.LOW]);
  });

  it('correctly evaluates XOR gate', () => {
    expect(evaluateGate('XOR', [DigitalSignal.LOW, DigitalSignal.LOW])).toEqual([DigitalSignal.LOW]);
    expect(evaluateGate('XOR', [DigitalSignal.LOW, DigitalSignal.HIGH])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('XOR', [DigitalSignal.HIGH, DigitalSignal.LOW])).toEqual([DigitalSignal.HIGH]);
    expect(evaluateGate('XOR', [DigitalSignal.HIGH, DigitalSignal.HIGH])).toEqual([DigitalSignal.LOW]);
  });
});

describe('Circuit Level Simulation - Half Adder', () => {
  it('correctly simulates physical IC 7486 XOR and 7408 AND for Half Adder', () => {
    const circuit = new Circuit('half_adder_test');

    // Add ICs
    circuit.addIC({
      instanceId: 'ic_xor',
      partNumber: '7486',
      label: 'IC1 (7486)',
      definition: IC_7486,
      position: { rowStart: 5, centerTrough: true },
      pinIds: {
        1: 'xor_p1', 2: 'xor_p2', 3: 'xor_p3', 4: 'xor_p4', 5: 'xor_p5', 6: 'xor_p6', 7: 'xor_p7',
        8: 'xor_p8', 9: 'xor_p9', 10: 'xor_p10', 11: 'xor_p11', 12: 'xor_p12', 13: 'xor_p13', 14: 'xor_p14',
      },
    });

    circuit.addIC({
      instanceId: 'ic_and',
      partNumber: '7408',
      label: 'IC2 (7408)',
      definition: IC_7408,
      position: { rowStart: 15, centerTrough: true },
      pinIds: {
        1: 'and_p1', 2: 'and_p2', 3: 'and_p3', 4: 'and_p4', 5: 'and_p5', 6: 'and_p6', 7: 'and_p7',
        8: 'and_p8', 9: 'and_p9', 10: 'and_p10', 11: 'and_p11', 12: 'and_p12', 13: 'and_p13', 14: 'and_p14',
      },
    });

    // Switches
    circuit.addSwitch({
      id: 'sw_a',
      label: 'A',
      state: DigitalSignal.LOW,
      outputPinId: 'sw_a_out',
    });
    circuit.addSwitch({
      id: 'sw_b',
      label: 'B',
      state: DigitalSignal.LOW,
      outputPinId: 'sw_b_out',
    });

    // LEDs
    circuit.addLED({
      id: 'led_sum',
      label: 'Sum',
      inputPinId: 'led_sum_in',
      color: 'green',
      state: DigitalSignal.LOW,
    });
    circuit.addLED({
      id: 'led_carry',
      label: 'Carry',
      inputPinId: 'led_carry_in',
      color: 'red',
      state: DigitalSignal.LOW,
    });

    // Wires:
    // A to XOR pin 1 and AND pin 1
    circuit.addWire({ id: 'w1', fromPinId: 'sw_a_out', toPinId: 'xor_p1', signal: DigitalSignal.LOW });
    circuit.addWire({ id: 'w2', fromPinId: 'sw_a_out', toPinId: 'and_p1', signal: DigitalSignal.LOW });
    // B to XOR pin 2 and AND pin 2
    circuit.addWire({ id: 'w3', fromPinId: 'sw_b_out', toPinId: 'xor_p2', signal: DigitalSignal.LOW });
    circuit.addWire({ id: 'w4', fromPinId: 'sw_b_out', toPinId: 'and_p2', signal: DigitalSignal.LOW });

    // XOR out (pin 3) to Sum LED
    circuit.addWire({ id: 'w5', fromPinId: 'xor_p3', toPinId: 'led_sum_in', signal: DigitalSignal.LOW });
    // AND out (pin 3) to Carry LED
    circuit.addWire({ id: 'w6', fromPinId: 'and_p3', toPinId: 'led_carry_in', signal: DigitalSignal.LOW });

    // Test combinations:
    const testCases = [
      { a: DigitalSignal.LOW, b: DigitalSignal.LOW, sum: DigitalSignal.LOW, carry: DigitalSignal.LOW },
      { a: DigitalSignal.LOW, b: DigitalSignal.HIGH, sum: DigitalSignal.HIGH, carry: DigitalSignal.LOW },
      { a: DigitalSignal.HIGH, b: DigitalSignal.LOW, sum: DigitalSignal.HIGH, carry: DigitalSignal.LOW },
      { a: DigitalSignal.HIGH, b: DigitalSignal.HIGH, sum: DigitalSignal.LOW, carry: DigitalSignal.HIGH },
    ];

    for (const tc of testCases) {
      circuit.setSwitches({ sw_a: tc.a, sw_b: tc.b });
      expect(circuit.leds.led_sum.state).toBe(tc.sum);
      expect(circuit.leds.led_carry.state).toBe(tc.carry);
    }
  });
});
