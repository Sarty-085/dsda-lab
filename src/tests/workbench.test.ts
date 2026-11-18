import { describe, it, expect } from 'vitest';
import { createEmptySeqMemory, simulateWorkbench } from '../workbench/workbenchEngine';
import { WorkbenchState } from '../workbench/workbenchTypes';
import { evaluatePracticeProgress } from '../workbench/practiceGuides';

function baseWorkbench(): WorkbenchState {
  return {
    psu: true,
    p: [0, 0],
    clkActive: false,
    clkLevel: 0,
    ics: [],
    resistors: [],
    leds: [],
    wires: [],
    nid: 1,
  };
}

describe('Custom Breadboard Workbench Simulation Engine', () => {
  it('simulates an IC 7408 AND gate wired from power rails through a 330Ω resistor and LED', () => {
    const seq = createEmptySeqMemory();
    const s = baseWorkbench();
    s.ics = [{ id: 1, type: '7408', col: 5, pinCount: 14 }];
    // Place 330Ω resistor from B15g to B18g and LED from B18h (+) to Rb-:18 (-)
    s.resistors = [{ id: 2, a: 'B15g', b: 'B18g', ohms: 330 }];
    s.leds = [{ id: 3, anode: 'B18h', cathode: 'Rb-:18', color: 'green', label: 'Y' }];
    s.wires = [
      // Power rails from PSU
      { id: 10, a: 'PSU+', b: 'Rt+:0', color: '#ef4444' },
      { id: 11, a: 'PSUG', b: 'Rt-:0', color: '#334155' },
      { id: 12, a: 'PSU+', b: 'Rb+:0', color: '#ef4444' },
      { id: 13, a: 'PSUG', b: 'Rb-:0', color: '#334155' },
      // IC 7408 VCC (Pin 14 -> col 5 row e -> col 5 top a to Rt+:5) & GND (Pin 7 -> col 11 row j to Rb-:11)
      { id: 14, a: 'T5a', b: 'Rt+:5', color: '#ef4444' },
      { id: 15, a: 'B11j', b: 'Rb-:11', color: '#334155' },
      // Inputs: Pin 1 (B5) -> Rb+:2 (1), Pin 2 (B6) -> Rb-:3 (0)
      { id: 16, a: 'B5g', b: 'Rb+:2', color: '#2563eb' },
      { id: 17, a: 'B6g', b: 'Rb-:3', color: '#334155' },
      // Output Pin 3 (B7) -> resistor leg at B15i
      { id: 18, a: 'B7g', b: 'B15i', color: '#16a34a' },
    ];

    // State (1, 0) -> Y = 0
    let sim = simulateWorkbench(s, seq);
    expect(sim.shortCircuit).toBe(false);
    expect(sim.icPowered[1]).toBe(true);
    expect(sim.ledStates[3].lit).toBe(false);
    expect(sim.ledStates[3].anodeVal).toBe(0);
    expect(sim.activeInputs.map(i => i.value)).toEqual([1, 0]);
    expect(sim.activeOutputs[0].value).toBe(0);

    // Move Pin 2 wire from GND rail (Rb-:3) to +5V rail (Rb+:3) -> State (1, 1) -> Y = 1!
    s.wires = s.wires.map(w => (w.id === 17 ? { ...w, b: 'Rb+:3' } : w));
    sim = simulateWorkbench(s, seq);
    expect(sim.ledStates[3].lit).toBe(true);
    expect(sim.ledStates[3].hasResistor).toBe(true);
    expect(sim.activeInputs.map(i => i.value)).toEqual([1, 1]);
    expect(sim.activeOutputs[0].value).toBe(1);
    expect(sim.messages.some(m => m.severity === 'error' || m.severity === 'warning')).toBe(false);
  });

  it('detects direct short circuits and disables active ICs and LEDs', () => {
    const seq = createEmptySeqMemory();
    const s = baseWorkbench();
    s.ics = [{ id: 1, type: '7404', col: 2, pinCount: 14 }];
    s.leds = [{ id: 2, anode: 'B15h', cathode: 'Rb-:15', color: 'red' }];
    s.wires = [
      { id: 10, a: 'PSU+', b: 'Rt+:0', color: '#ef4444' },
      { id: 11, a: 'PSUG', b: 'Rt-:0', color: '#334155' },
      { id: 12, a: 'Rt+:2', b: 'Rt-:2', color: '#ef4444' }, // Direct short
    ];

    const sim = simulateWorkbench(s, seq);
    expect(sim.shortCircuit).toBe(true);
    expect(sim.icPowered[1]).toBe(false);
    expect(sim.ledStates[2].lit).toBe(false);
    expect(sim.messages.some(m => m.severity === 'error' && m.text.includes('SHORT CIRCUIT'))).toBe(true);
  });

  it('warns when an LED is illuminated without a 330Ω current-limiting resistor and respects polarity', () => {
    const seq = createEmptySeqMemory();
    const s = baseWorkbench();
    s.leds = [
      { id: 1, anode: 'B10h', cathode: 'Rb-:10', color: 'red', label: 'Unprotected' },
      { id: 2, anode: 'Rb-:12', cathode: 'B12h', color: 'green', label: 'Reversed' },
    ];
    s.wires = [
      { id: 10, a: 'PSU+', b: 'Rb+:0', color: '#ef4444' },
      { id: 11, a: 'PSUG', b: 'Rb-:0', color: '#334155' },
      { id: 12, a: 'B10j', b: 'Rb+:10', color: '#ef4444' }, // Direct +5V to LED1 Anode!
      { id: 13, a: 'B12j', b: 'Rb+:12', color: '#ef4444' }, // Reverse bias LED2!
    ];

    const sim = simulateWorkbench(s, seq);
    expect(sim.ledStates[1].lit).toBe(true);
    expect(sim.ledStates[1].hasResistor).toBe(false);
    expect(sim.messages.some(m => m.severity === 'warning' && m.text.includes('without a 330Ω'))).toBe(true);

    expect(sim.ledStates[2].lit).toBe(false);
    expect(sim.ledStates[2].reverseBiased).toBe(true);
  });

  it('latches IC 7474 D Flip-Flop state on Clock Generator rising transition', () => {
    const seq = createEmptySeqMemory();
    const s = baseWorkbench();
    s.ics = [{ id: 1, type: '7474', col: 5, pinCount: 14 }];
    s.resistors = [{ id: 2, a: 'B9i', b: 'B15i', ohms: 330 }]; // Pin 5 (1Q = B9) -> R -> B15
    s.leds = [{ id: 3, anode: 'B15j', cathode: 'Rb-:15', color: 'green', label: 'Q' }];
    s.wires = [
      { id: 10, a: 'PSU+', b: 'Rt+:0', color: '#ef4444' },
      { id: 11, a: 'PSUG', b: 'Rt-:0', color: '#334155' },
      { id: 12, a: 'PSU+', b: 'Rb+:0', color: '#ef4444' },
      { id: 13, a: 'PSUG', b: 'Rb-:0', color: '#334155' },
      // Power 7474: Pin 14 (T5) & Pin 7 (B11)
      { id: 14, a: 'T5a', b: 'Rt+:5', color: '#ef4444' },
      { id: 15, a: 'B11j', b: 'Rb-:11', color: '#334155' },
      // Active-low CLR' (Pin 1 = B5) & PR' (Pin 4 = B8) tied HIGH (+ rail)
      { id: 16, a: 'B5g', b: 'Rb+:5', color: '#ef4444' },
      { id: 17, a: 'B8g', b: 'Rb+:8', color: '#ef4444' },
      // D (Pin 2 = B6) -> HIGH, CLK (Pin 3 = B7) -> Clock Gen CLK
      { id: 18, a: 'B6g', b: 'Rb+:6', color: '#2563eb' },
      { id: 19, a: 'B7g', b: 'CLK', color: '#a855f7' },
    ];

    // Before clock edge (CLK=0): Q stays 0
    s.clkLevel = 0;
    let sim = simulateWorkbench(s, seq);
    expect(sim.ledStates[3].lit).toBe(false);

    // Rising edge (CLK 0 -> 1): Q latches D = 1!
    s.clkLevel = 1;
    sim = simulateWorkbench(s, seq);
    expect(sim.ledStates[3].lit).toBe(true);
  });

  it('tracks Experiment Practice milestones cleanly for Half Adder without giving away auto-wiring', () => {
    const seq = createEmptySeqMemory();
    const s = baseWorkbench();
    s.ics = [
      { id: 1, type: '7486', col: 2, pinCount: 14 },
      { id: 2, type: '7408', col: 12, pinCount: 14 },
    ];
    s.leds = [
      { id: 3, anode: 'B20h', cathode: 'Rb-:20', color: 'green' },
      { id: 4, anode: 'B23h', cathode: 'Rb-:23', color: 'red' },
    ];
    s.resistors = [
      { id: 5, a: 'B20g', b: 'B25g', ohms: 330 },
      { id: 6, a: 'B23g', b: 'B26g', ohms: 330 },
    ];
    s.wires = [
      { id: 10, a: 'PSU+', b: 'Rt+:0', color: '#ef4444' },
      { id: 11, a: 'PSUG', b: 'Rt-:0', color: '#334155' },
      // Power both ICs
      { id: 12, a: 'T2a', b: 'Rt+:2', color: '#ef4444' },
      { id: 13, a: 'B8j', b: 'Rt-:8', color: '#334155' },
      { id: 14, a: 'T12a', b: 'Rt+:12', color: '#ef4444' },
      { id: 15, a: 'B18j', b: 'Rt-:18', color: '#334155' },
    ];

    const sim = simulateWorkbench(s, seq);
    const prog = evaluatePracticeProgress('exp3', 'half_adder', s, sim);
    expect(prog).not.toBeNull();
    expect(prog!.milestones[0].completed).toBe(true); // Rails energized
    expect(prog!.milestones[1].completed).toBe(true); // 7486 + 7408 + 2 LEDs + 2 resistors placed
    expect(prog!.milestones[2].completed).toBe(true); // Both ICs powered
    expect(prog!.milestones[3].completed).toBe(false); // Inputs & LED outputs not wired yet!
  });
});
