import { DigitalSignal, Pin, Wire, SwitchComponent, LEDComponent, ResistorComponent, ICInstance, TraceNode } from './types';
import { evaluateGate } from './logic';

export interface CircuitStateSnapshot {
  pins: Record<string, Pin>;
  wires: Wire[];
  switches: Record<string, SwitchComponent>;
  leds: Record<string, LEDComponent>;
  ics: Record<string, ICInstance>;
  intermediateSignals: Record<string, DigitalSignal>;
  hasContention: boolean;
  contentionMessage?: string;
}

export class Circuit {
  public pins: Record<string, Pin> = {};
  public wires: Wire[] = [];
  public switches: Record<string, SwitchComponent> = {};
  public leds: Record<string, LEDComponent> = {};
  public ics: Record<string, ICInstance> = {};
  public resistors: ResistorComponent[] = [];
  public intermediateSignals: Record<string, DigitalSignal> = {};
  public hasContention = false;
  public contentionMessage?: string;

  constructor(public id: string = 'main_circuit') {}

  public addPin(pin: Pin): void {
    this.pins[pin.id] = { ...pin };
  }

  public addWire(wire: Wire): void {
    this.wires.push({ ...wire });
  }

  public addIC(ic: ICInstance): void {
    this.ics[ic.instanceId] = ic;
    // Register its pins
    for (const [pinNumStr, pinId] of Object.entries(ic.pinIds)) {
      const pinNum = parseInt(pinNumStr, 10);
      const direction = ic.definition.pinDirections[pinNum] ?? 'PASSIVE';
      const label = `${ic.label} P${pinNum} (${ic.definition.pinLabels[pinNum] ?? ''})`;
      
      let initialSignal = DigitalSignal.FLOATING;
      if (direction === 'POWER') initialSignal = DigitalSignal.HIGH;
      if (direction === 'GROUND') initialSignal = DigitalSignal.LOW;

      this.addPin({
        id: pinId,
        label,
        direction,
        signal: initialSignal,
        componentId: ic.instanceId,
        pinNumber: pinNum,
        description: ic.definition.pinLabels[pinNum],
      });
    }
  }

  public addSwitch(sw: SwitchComponent): void {
    this.switches[sw.id] = sw;
    this.addPin({
      id: sw.outputPinId,
      label: `Switch ${sw.label} Out`,
      direction: 'OUTPUT',
      signal: sw.state,
      componentId: sw.id,
    });
  }

  public addLED(led: LEDComponent): void {
    this.leds[led.id] = led;
    // Anode (+) Positive Terminal
    this.addPin({
      id: led.inputPinId,
      label: `LED ${led.label} Anode (+)`,
      direction: 'INPUT',
      signal: DigitalSignal.LOW,
      componentId: led.id,
    });
    // Cathode (-) Negative / Ground Terminal
    const cathodePinId = led.cathodePinId ?? `led_cathode_${led.id}`;
    this.addPin({
      id: cathodePinId,
      label: `LED ${led.label} Cathode (-)`,
      direction: 'GROUND',
      signal: DigitalSignal.LOW,
      componentId: led.id,
    });
  }

  public setSwitch(switchId: string, state: DigitalSignal): CircuitStateSnapshot {
    if (this.switches[switchId]) {
      this.switches[switchId].state = state;
      const pinId = this.switches[switchId].outputPinId;
      if (this.pins[pinId]) {
        this.pins[pinId].signal = state;
      }
    }
    return this.propagate();
  }

  public setSwitches(states: Record<string, DigitalSignal>): CircuitStateSnapshot {
    for (const [swId, state] of Object.entries(states)) {
      if (this.switches[swId]) {
        this.switches[swId].state = state;
        const pinId = this.switches[swId].outputPinId;
        if (this.pins[pinId]) {
          this.pins[pinId].signal = state;
        }
      }
    }
    return this.propagate();
  }

  /**
   * Deterministic propagation loop
   */
  public propagate(): CircuitStateSnapshot {
    this.hasContention = false;
    this.contentionMessage = undefined;

    // Reset non-driven pins to floating
    for (const pin of Object.values(this.pins)) {
      if (pin.direction === 'POWER') {
        pin.signal = DigitalSignal.HIGH;
      } else if (pin.direction === 'GROUND') {
        pin.signal = DigitalSignal.LOW;
      } else if (pin.componentId in this.switches) {
        pin.signal = this.switches[pin.componentId].state;
      } else if (pin.direction === 'INPUT' || pin.direction === 'PASSIVE') {
        pin.signal = DigitalSignal.FLOATING;
      }
    }

    // Build adjacency list for wires to group into connected nets
    const adj: Record<string, string[]> = {};
    for (const pinId of Object.keys(this.pins)) {
      adj[pinId] = [];
    }
    for (const wire of this.wires) {
      if (!adj[wire.fromPinId]) adj[wire.fromPinId] = [];
      if (!adj[wire.toPinId]) adj[wire.toPinId] = [];
      adj[wire.fromPinId].push(wire.toPinId);
      adj[wire.toPinId].push(wire.fromPinId);
    }

    // Find connected components (nets)
    const visited = new Set<string>();
    const nets: string[][] = [];
    for (const pinId of Object.keys(this.pins)) {
      if (!visited.has(pinId)) {
        const net: string[] = [];
        const queue = [pinId];
        visited.add(pinId);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          net.push(curr);
          for (const neighbor of (adj[curr] || [])) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        nets.push(net);
      }
    }

    // Propagation iteration loop (max 20 iterations to resolve cascades)
    let changed = true;
    let iteration = 0;
    const MAX_ITERATIONS = 25;

    while (changed && iteration < MAX_ITERATIONS) {
      changed = false;
      iteration++;

      // 1. Resolve nets: every net takes the signal from its driver (OUTPUT, POWER, GROUND)
      for (const net of nets) {
        let drivingSignal = DigitalSignal.FLOATING;
        let driversCount = 0;
        let conflicting = false;

        for (const pinId of net) {
          const pin = this.pins[pinId];
          if (!pin) continue;
          if (pin.direction === 'OUTPUT' || pin.direction === 'POWER' || pin.direction === 'GROUND') {
            if (pin.signal !== DigitalSignal.FLOATING) {
              if (driversCount > 0 && drivingSignal !== pin.signal) {
                conflicting = true;
              }
              drivingSignal = pin.signal;
              driversCount++;
            }
          }
        }

        if (conflicting) {
          this.hasContention = true;
          this.contentionMessage = `Bus contention detected: Multiple drivers asserting different signals on net containing ${net.join(', ')}`;
        }

        // Apply net signal to all pins and wires in this net
        for (const pinId of net) {
          const pin = this.pins[pinId];
          if (!pin) continue;
          if (pin.direction === 'INPUT' || pin.direction === 'PASSIVE') {
            if (pin.signal !== drivingSignal) {
              pin.signal = drivingSignal;
              changed = true;
            }
          }
        }
      }

      // 2. Evaluate IC internal gates
      for (const ic of Object.values(this.ics)) {
        for (const gate of ic.definition.gates) {
          const inputSignals = gate.inputPinNumbers.map(pinNum => {
            const pinId = ic.pinIds[pinNum];
            return this.pins[pinId]?.signal ?? DigitalSignal.LOW;
          });

          const outputSignals = evaluateGate(gate.type, inputSignals);

          gate.outputPinNumbers.forEach((pinNum, idx) => {
            const outPinId = ic.pinIds[pinNum];
            const outPin = this.pins[outPinId];
            const newSig = outputSignals[idx] ?? DigitalSignal.LOW;
            if (outPin && outPin.signal !== newSig) {
              outPin.signal = newSig;
              changed = true;
            }
          });
        }
      }
    }

    // 3. Update wire signals based on the driver pin of that wire
    for (const wire of this.wires) {
      const fromPin = this.pins[wire.fromPinId];
      const toPin = this.pins[wire.toPinId];
      if (fromPin && fromPin.signal !== DigitalSignal.FLOATING) {
        wire.signal = fromPin.signal;
      } else if (toPin && toPin.signal !== DigitalSignal.FLOATING) {
        wire.signal = toPin.signal;
      } else {
        wire.signal = DigitalSignal.FLOATING;
      }
    }

    // 4. Update LEDs (Forward-biased when Anode is HIGH and Cathode is GROUND/LOW)
    for (const led of Object.values(this.leds)) {
      const inPin = this.pins[led.inputPinId];
      const cathodePinId = led.cathodePinId ?? `led_cathode_${led.id}`;
      const cathodePin = this.pins[cathodePinId];

      const isAnodeHigh = inPin?.signal === DigitalSignal.HIGH;
      const isCathodeLow = !cathodePin || cathodePin.signal === DigitalSignal.LOW;
      led.state = (isAnodeHigh && isCathodeLow) ? DigitalSignal.HIGH : DigitalSignal.LOW;
    }

    return this.getSnapshot();
  }

  public getSnapshot(): CircuitStateSnapshot {
    return {
      pins: { ...this.pins },
      wires: this.wires.map(w => ({ ...w })),
      switches: { ...this.switches },
      leds: { ...this.leds },
      ics: { ...this.ics },
      intermediateSignals: { ...this.intermediateSignals },
      hasContention: this.hasContention,
      contentionMessage: this.contentionMessage,
    };
  }

  /**
   * Signal Trace: Given a pin or LED, build the causal upstream tree
   */
  public traceSignal(targetPinId: string, visited: Set<string> = new Set()): TraceNode {
    const pin = this.pins[targetPinId];
    if (!pin || visited.has(targetPinId)) {
      return {
        type: 'IC_PIN',
        id: targetPinId,
        label: targetPinId,
        value: pin ? pin.signal : DigitalSignal.FLOATING,
        upstream: [],
      };
    }
    visited.add(targetPinId);

    // If it's a switch output
    if (pin.componentId in this.switches) {
      const sw = this.switches[pin.componentId];
      return {
        type: 'INPUT',
        id: sw.id,
        label: `Switch ${sw.label}`,
        value: sw.state,
        equation: `${sw.label} = ${sw.state}`,
        upstream: [],
      };
    }

    // If it's an IC output pin, find the gate that produces it
    if (pin.componentId in this.ics && pin.direction === 'OUTPUT') {
      const ic = this.ics[pin.componentId];
      const gate = ic.definition.gates.find(g => g.outputPinNumbers.includes(pin.pinNumber!));
      if (gate) {
        const upstreamNodes = gate.inputPinNumbers.map(inPinNum => {
          const inPinId = ic.pinIds[inPinNum];
          return this.traceSignal(inPinId, new Set(visited));
        });

        return {
          type: 'GATE',
          id: gate.id,
          label: `${ic.label} (${ic.definition.partNumber}) ${gate.type} Gate`,
          value: pin.signal,
          equation: `${gate.label || gate.type}`,
          upstream: upstreamNodes,
        };
      }
    }

    // If it's an input pin, trace backwards along connected wires
    const drivingWires = this.wires.filter(w => w.toPinId === targetPinId || w.fromPinId === targetPinId);
    const upstreamNodes: TraceNode[] = [];
    for (const wire of drivingWires) {
      const otherPinId = wire.fromPinId === targetPinId ? wire.toPinId : wire.fromPinId;
      const otherPin = this.pins[otherPinId];
      if (otherPin && (otherPin.direction === 'OUTPUT' || otherPin.direction === 'POWER' || otherPin.direction === 'GROUND')) {
        upstreamNodes.push(this.traceSignal(otherPinId, new Set(visited)));
      }
    }

    return {
      type: 'IC_PIN',
      id: pin.id,
      label: pin.label,
      value: pin.signal,
      upstream: upstreamNodes,
    };
  }
}
