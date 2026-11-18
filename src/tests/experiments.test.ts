import { describe, it, expect } from 'vitest';
import { EXPERIMENTS } from '../experiments/registry';
import { buildCircuitFromConfig } from '../simulator/circuitFactory';
import { DigitalSignal } from '../simulator/engine/types';

describe('Comprehensive Automated Truth Table Verification across All 10 Experiments', () => {
  for (const exp of EXPERIMENTS) {
    describe(`Experiment ${exp.experimentNumber}: ${exp.title}`, () => {
      for (const sub of exp.subCircuits) {
        it(`verifies complete truth table for [${sub.name}]`, () => {
          const circuit = buildCircuitFromConfig(sub);
          expect(circuit).toBeDefined();

          for (const row of sub.truthTable) {
            // Apply switch inputs (prefer exact label match before substring id fallback)
            const switchInputs: Record<string, DigitalSignal> = {};
            for (const [inKey, inVal] of Object.entries(row.inputs)) {
              const keyLower = inKey.toLowerCase();
              const matchedInput =
                sub.inputs.find(i => i.label.toLowerCase() === keyLower) ||
                sub.inputs.find(i => i.id.toLowerCase().includes(keyLower));
              if (matchedInput) {
                switchInputs[matchedInput.id] = inVal === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW;
              }
            }

            circuit.setSwitches(switchInputs);

            // Verify outputs (prefer exact label match before substring id fallback)
            for (const [outKey, expectedVal] of Object.entries(row.outputs)) {
              const keyLower = outKey.toLowerCase();
              const matchedOutput =
                sub.outputs.find(o => o.label.toLowerCase() === keyLower) ||
                sub.outputs.find(o => o.id.toLowerCase().includes(keyLower));

              if (matchedOutput) {
                const led = circuit.leds[matchedOutput.id];
                expect(led, `LED for ${outKey} should exist`).toBeDefined();
                const expectedSignal = expectedVal === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW;

                // Truth verification assertion
                expect(
                  led.state,
                  `Mismatch in Exp ${exp.experimentNumber} [${sub.name}] for inputs ${JSON.stringify(row.inputs)}: Output '${outKey}' expected ${expectedSignal} but got ${led.state}`
                ).toBe(expectedSignal);
              }
            }
          }
        });
      }
    });
  }
});

describe('Build Mode Dynamic Wiring and Unconnected State Verification', () => {
  it('ensures LEDs remain OFF when no wires are placed in build mode even if inputs are toggled', () => {
    const sub = EXPERIMENTS[0].subCircuits[0];
    const buildCircuit = buildCircuitFromConfig(sub, []);

    // Toggle all inputs to HIGH
    const switchInputs: Record<string, DigitalSignal> = {};
    for (const inp of sub.inputs) switchInputs[inp.id] = DigitalSignal.HIGH;
    buildCircuit.setSwitches(switchInputs);

    // All LEDs must remain LOW because no wires are connected on the breadboard
    for (const out of sub.outputs) {
      expect(buildCircuit.leds[out.id].state).toBe(DigitalSignal.LOW);
    }
  });

  it('ensures full circuit outputs match truth table once all wires are placed in build mode', () => {
    const sub = EXPERIMENTS[0].subCircuits[0];
    const allWireIds = sub.wires.map(w => w.id);
    const buildCircuit = buildCircuitFromConfig(sub, allWireIds);

    const firstRow = sub.truthTable[0];
    const switchInputs: Record<string, DigitalSignal> = {};
    for (const [inKey, inVal] of Object.entries(firstRow.inputs)) {
      const matched = sub.inputs.find(i => i.label.toLowerCase() === inKey.toLowerCase());
      if (matched) switchInputs[matched.id] = inVal === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW;
    }
    buildCircuit.setSwitches(switchInputs);

    for (const [outKey, outVal] of Object.entries(firstRow.outputs)) {
      const matched = sub.outputs.find(o => o.label.toLowerCase() === outKey.toLowerCase());
      if (matched) {
        expect(buildCircuit.leds[matched.id].state).toBe(outVal === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW);
      }
    }
  });

  it('correctly matches wire when clicking pinhole in front of the IC (Col D) or IC pin itself (Col E)', () => {
    const sub = EXPERIMENTS[0].subCircuits[0];
    const wire = sub.wires.find(w => w.id === 'w_in_a')!;
    expect(wire).toBeDefined();

    const areHolesElectricallyConnected = (h1: { row: number; col: string }, h2: { row: number; col: string }) => {
      const c1 = h1.col.toUpperCase();
      const c2 = h2.col.toUpperCase();
      if (h1.row === h2.row && c1 === c2) return true;
      if (h1.row === h2.row) {
        const isLeftHalf = (c: string) => ['A', 'B', 'C', 'D', 'E'].includes(c);
        if (isLeftHalf(c1) && isLeftHalf(c2)) return true;
      }
      return false;
    };

    const startHole = { row: 10, col: 'B' };
    const endHoleColD = { row: 10, col: 'D' }; // Pinhole in front of IC
    const endHoleColE = { row: 10, col: 'E' }; // IC pin hole

    const matchColD = areHolesElectricallyConnected(wire.from, startHole) && areHolesElectricallyConnected(wire.to, endHoleColD);
    expect(matchColD).toBe(true);

    const matchColE = areHolesElectricallyConnected(wire.from, startHole) && areHolesElectricallyConnected(wire.to, endHoleColE);
    expect(matchColE).toBe(true);
  });

  it('correctly accounts for both Anode (+) and Cathode (-) terminals of the LED', () => {
    const sub = EXPERIMENTS[0].subCircuits[0];
    const circuit = buildCircuitFromConfig(sub);

    for (const out of sub.outputs) {
      const led = circuit.leds[out.id];
      expect(led).toBeDefined();

      // Anode (+) Pin Check
      const anodePin = circuit.pins[led.inputPinId];
      expect(anodePin).toBeDefined();
      expect(anodePin.direction).toBe('INPUT');
      expect(anodePin.label).toContain('Anode');

      // Cathode (-) Pin Check
      const cathodePinId = led.cathodePinId ?? `led_cathode_${led.id}`;
      const cathodePin = circuit.pins[cathodePinId];
      expect(cathodePin).toBeDefined();
      expect(cathodePin.direction).toBe('GROUND');
      expect(cathodePin.label).toContain('Cathode');
      expect(cathodePin.signal).toBe(DigitalSignal.LOW);
    }
  });
});

describe('Experiments 7–10 Registry, Breadboard Layout & Build Mode Wiring Integrity', () => {
  it('registers all 10 laboratory experiments in sequential order', () => {
    expect(EXPERIMENTS).toHaveLength(10);
    expect(EXPERIMENTS.map(e => e.experimentNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('ensures no wire in Experiments 7–10 shorts holes sharing the same breadboard internal clip and all rows fit within 1..44', () => {
    const isLeftHalf = (c: string) => ['A', 'B', 'C', 'D', 'E'].includes(c);
    const isRightHalf = (c: string) => ['F', 'G', 'H', 'I', 'J'].includes(c);
    const sharesClip = (h1: { row: number; col: string }, h2: { row: number; col: string }) => {
      const c1 = h1.col.toUpperCase();
      const c2 = h2.col.toUpperCase();
      if (h1.row === h2.row && c1 === c2) return true;
      if ((c1 === 'L+' && c2 === 'L+') || (c1 === 'R+' && c2 === 'R+')) return true;
      if ((c1 === 'L-' && c2 === 'L-') || (c1 === 'R-' && c2 === 'R-')) return true;
      if (h1.row === h2.row) {
        if (isLeftHalf(c1) && isLeftHalf(c2)) return true;
        if (isRightHalf(c1) && isRightHalf(c2)) return true;
      }
      return false;
    };

    for (const exp of EXPERIMENTS.filter(e => e.experimentNumber >= 7)) {
      for (const sub of exp.subCircuits) {
        for (const wire of sub.wires) {
          expect(wire.from.row, `Exp ${exp.experimentNumber} [${sub.id}] wire ${wire.id} from row out of bounds`).toBeGreaterThanOrEqual(1);
          expect(wire.from.row, `Exp ${exp.experimentNumber} [${sub.id}] wire ${wire.id} from row out of bounds`).toBeLessThanOrEqual(44);
          expect(wire.to.row, `Exp ${exp.experimentNumber} [${sub.id}] wire ${wire.id} to row out of bounds`).toBeGreaterThanOrEqual(1);
          expect(wire.to.row, `Exp ${exp.experimentNumber} [${sub.id}] wire ${wire.id} to row out of bounds`).toBeLessThanOrEqual(44);
          expect(
            sharesClip(wire.from, wire.to),
            `Exp ${exp.experimentNumber} [${sub.id}] wire ${wire.id} (${wire.from.col}${wire.from.row} -> ${wire.to.col}${wire.to.row}) must not already share an internal spring clip`
          ).toBe(false);
        }
      }
    }
  });
});
