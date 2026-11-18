import { IC_CATALOG } from '../simulator/ics/definitions';
import {
  ActiveChannel,
  LogicLevel,
  PlacedIC,
  SequentialMemory,
  StatusMessage,
  WorkbenchSimResult,
  WorkbenchState,
} from './workbenchTypes';
import { getICPinHole, getNodeKey } from './workbenchGeometry';

export function createEmptySeqMemory(): SequentialMemory {
  return {
    dff: {},
    sr7495: {},
    latchVals: {},
  };
}

function inv(v: LogicLevel): LogicLevel {
  if (v === 1) return 0;
  if (v === 0) return 1;
  return 'X';
}

function andGate(inputs: LogicLevel[]): LogicLevel {
  if (inputs.some(v => v === 0)) return 0;
  if (inputs.length > 0 && inputs.every(v => v === 1)) return 1;
  return 'X';
}

function orGate(inputs: LogicLevel[]): LogicLevel {
  if (inputs.some(v => v === 1)) return 1;
  if (inputs.length > 0 && inputs.every(v => v === 0)) return 0;
  return 'X';
}

function xorGate(inputs: LogicLevel[]): LogicLevel {
  if (inputs.some(v => v === 'X' || v === 'C')) return 'X';
  const ones = inputs.filter(v => v === 1).length;
  return ones % 2 === 1 ? 1 : 0;
}

function evaluateCombinationalGate(
  type: string,
  inputs: LogicLevel[],
  isAllWiredForLatch: boolean,
  prevOutVal: LogicLevel | undefined
): LogicLevel[] {
  switch (type) {
    case 'NOT':
      return [inv(inputs[0] ?? 'X')];
    case 'BUFFER':
      return [inputs[0] ?? 'X'];
    case 'AND':
      return [andGate(inputs)];
    case 'OR':
      return [orGate(inputs)];
    case 'NAND': {
      // Handle symmetric cross-coupled NAND latch startup safely when both inputs are physically wired
      const res = inv(andGate(inputs));
      if (res === 'X' && isAllWiredForLatch && (prevOutVal === 0 || prevOutVal === 1)) {
        return [prevOutVal];
      }
      return [res];
    }
    case 'NOR': {
      const res = inv(orGate(inputs));
      if (res === 'X' && isAllWiredForLatch && (prevOutVal === 0 || prevOutVal === 1)) {
        return [prevOutVal];
      }
      return [res];
    }
    case 'XOR':
      return [xorGate(inputs)];
    case 'XNOR':
      return [inv(xorGate(inputs))];
    case 'ADDER_4BIT': {
      // [A3, A2, A1, A0, B3, B2, B1, B0, Cin] -> [S3, S2, S1, S0, Cout]
      if (inputs.some(v => v === 'X' || v === 'C')) {
        return ['X', 'X', 'X', 'X', 'X'];
      }
      const a = ((inputs[0] as number) << 3) | ((inputs[1] as number) << 2) | ((inputs[2] as number) << 1) | (inputs[3] as number);
      const b = ((inputs[4] as number) << 3) | ((inputs[5] as number) << 2) | ((inputs[6] as number) << 1) | (inputs[7] as number);
      const cin = inputs[8] as number;
      const sum = a + b + cin;
      return [
        (sum & 8) ? 1 : 0,
        (sum & 4) ? 1 : 0,
        (sum & 2) ? 1 : 0,
        (sum & 1) ? 1 : 0,
        (sum & 16) ? 1 : 0,
      ];
    }
    default:
      return ['X'];
  }
}

export function simulateWorkbench(
  state: WorkbenchState,
  seqMem: SequentialMemory
): WorkbenchSimResult {
  // 1. Disjoint-Set (Union-Find) over breadboard strips and rails connected by wires
  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    if (parent[x] === undefined || parent[x] === x) {
      parent[x] = x;
      return x;
    }
    parent[x] = find(parent[x]);
    return parent[x];
  };
  const getNode = (terminalId: string) => find(getNodeKey(terminalId));

  // Merge nodes connected by wires
  for (const w of state.wires) {
    const rA = getNode(w.a);
    const rB = getNode(w.b);
    if (rA !== rB) {
      parent[rA] = rB;
    }
  }

  // Track which root nodes have physical wires, resistors, or LED legs attached
  const wiredRoots = new Set<string>();
  for (const w of state.wires) {
    wiredRoots.add(getNode(w.a));
    wiredRoots.add(getNode(w.b));
  }

  const allComponentRoots = new Set<string>(wiredRoots);
  for (const r of state.resistors) {
    allComponentRoots.add(getNode(r.a));
    allComponentRoots.add(getNode(r.b));
  }
  for (const l of state.leds) {
    allComponentRoots.add(getNode(l.anode));
    allComponentRoots.add(getNode(l.cathode));
  }

  // Strong constant sources
  const baseSources: Record<string, LogicLevel[]> = {};
  const addSource = (root: string, val: LogicLevel) => {
    if (!baseSources[root]) baseSources[root] = [];
    baseSources[root].push(val);
  };

  addSource(getNode('PSUG'), 0);
  if (state.psu) {
    addSource(getNode('PSU+'), 1);
    addSource(getNode('P1'), state.p[0]);
    addSource(getNode('P2'), state.p[1]);
    addSource(getNode('CLK'), state.clkLevel);
  }

  // Reset sequential state if trainer power is OFF
  if (!state.psu) {
    seqMem.dff = {};
    seqMem.sr7495 = {};
    seqMem.latchVals = {};
  }

  const shortCircuit = state.psu && getNode('PSU+') === getNode('PSUG');

  let vals: Record<string, LogicLevel> = { ...seqMem.latchVals };
  const icPowered: Record<number, boolean> = {};
  const gateOutputNodes = new Set<string>();

  if (!shortCircuit) {
    const MAX_ITERS = 25;
    let preEdgeVals: Record<string, LogicLevel> = {};
    let dffUpdated = false;
    let srUpdated = false;

    for (let it = 0; it < MAX_ITERS; it++) {
      const strongDrivers: Record<string, LogicLevel[]> = {};
      for (const n in baseSources) {
        strongDrivers[n] = [...baseSources[n]];
      }

      // Compute current strong resolved levels (used as input during this iteration)
      const currentStrongResolve = () => {
        const nextVals: Record<string, LogicLevel> = {};
        for (const n in strongDrivers) {
          const arr = strongDrivers[n];
          nextVals[n] = arr.every(v => v === arr[0]) ? arr[0] : 'C';
        }
        // Apply resistive passive coupling to nodes without strong drivers
        for (let rPass = 0; rPass < 4; rPass++) {
          const weakDrivers: Record<string, LogicLevel[]> = {};
          for (const res of state.resistors) {
            const u = getNode(res.a);
            const v = getNode(res.b);
            if (u === v) continue;
            const vu = nextVals[u] ?? 'X';
            const vv = nextVals[v] ?? 'X';
            if ((vv === 0 || vv === 1) && nextVals[u] === undefined) {
              if (!weakDrivers[u]) weakDrivers[u] = [];
              weakDrivers[u].push(vv);
            }
            if ((vu === 0 || vu === 1) && nextVals[v] === undefined) {
              if (!weakDrivers[v]) weakDrivers[v] = [];
              weakDrivers[v].push(vu);
            }
          }
          let updatedWeak = false;
          for (const n in weakDrivers) {
            const arr = weakDrivers[n];
            const val = arr.every(v => v === arr[0]) ? arr[0] : 'X';
            if (val !== 'X' && nextVals[n] !== val) {
              nextVals[n] = val;
              updatedWeak = true;
            }
          }
          if (!updatedWeak) break;
        }
        return nextVals;
      };

      // Update IC power states and snapshot pre-edge levels on first iteration
      if (it === 0) {
        const initVals = currentStrongResolve();
        preEdgeVals = { ...vals, ...initVals };
        vals = { ...preEdgeVals };
      }

      // Evaluate ICs in placement order
      for (const ic of state.ics) {
        const def = IC_CATALOG[ic.type];
        if (!def) continue;

        const vccVal = vals[getNode(getICPinHole(ic, def.vccPin))];
        const gndVal = vals[getNode(getICPinHole(ic, def.gndPin))];
        const powered = state.psu && vccVal === 1 && gndVal === 0;
        icPowered[ic.id] = powered;

        if (!powered) continue;

        for (const gate of def.gates) {
          let outs: LogicLevel[];

          if (gate.type === 'D_FF_7474') {
            if (it > 0 && dffUpdated) {
              const key = `${ic.id}_${gate.id}`;
              const st = seqMem.dff[key] ?? { q: 0, prevClk: 0 };
              outs = [st.q, st.q === 1 ? 0 : 1];
            } else {
              const key = `${ic.id}_${gate.id}`;
              if (!seqMem.dff[key]) seqMem.dff[key] = { q: 0, prevClk: 0 };
              const st = seqMem.dff[key];
              const [clrN, dVal, clkVal, prN] = gate.inputPinNumbers.map(
                p => preEdgeVals[getNode(getICPinHole(ic, p))] ?? 'X'
              );
              const normClk: 0 | 1 = clkVal === 1 ? 1 : 0;
              if (clrN === 0) {
                st.q = 0;
              } else if (prN === 0) {
                st.q = 1;
              } else if (st.prevClk === 0 && normClk === 1) {
                st.q = dVal === 1 ? 1 : 0;
              }
              st.prevClk = normClk;
              outs = [st.q, st.q === 1 ? 0 : 1];
            }
          } else if (gate.type === 'SHIFT_REG_7495') {
            if (it > 0 && srUpdated) {
              const key = `${ic.id}_${gate.id}`;
              const st = seqMem.sr7495[key] ?? { qa: 0, qb: 0, qc: 0, qd: 0, prevCk1: 0, prevCk2: 0 };
              outs = [st.qa, st.qb, st.qc, st.qd];
            } else {
              const key = `${ic.id}_${gate.id}`;
              if (!seqMem.sr7495[key]) {
                seqMem.sr7495[key] = { qa: 0, qb: 0, qc: 0, qd: 0, prevCk1: 0, prevCk2: 0 };
              }
              const st = seqMem.sr7495[key];
              const [ds, inA, inB, inC, inD, mode, ck1, ck2] = gate.inputPinNumbers.map(
                p => preEdgeVals[getNode(getICPinHole(ic, p))] ?? 'X'
              );
              const nCk1: 0 | 1 = ck1 === 1 ? 1 : 0;
              const nCk2: 0 | 1 = ck2 === 1 ? 1 : 0;
              if (mode !== 1) {
                if (st.prevCk1 === 0 && nCk1 === 1) {
                  st.qd = st.qc;
                  st.qc = st.qb;
                  st.qb = st.qa;
                  st.qa = ds === 1 ? 1 : 0;
                }
              } else {
                if (st.prevCk2 === 0 && nCk2 === 1) {
                  st.qa = inA === 1 ? 1 : 0;
                  st.qb = inB === 1 ? 1 : 0;
                  st.qc = inC === 1 ? 1 : 0;
                  st.qd = inD === 1 ? 1 : 0;
                }
              }
              st.prevCk1 = nCk1;
              st.prevCk2 = nCk2;
              outs = [st.qa, st.qb, st.qc, st.qd];
            }
          } else {
            // Skip 7410 steering gate after iteration 0 to avoid JK toggle race-around
            if (ic.type === '7410' && it > 0) {
              const firstOutNode = getNode(getICPinHole(ic, gate.outputPinNumbers[0]));
              if (vals[firstOutNode] === 0 || vals[firstOutNode] === 1) {
                if (!strongDrivers[firstOutNode]) strongDrivers[firstOutNode] = [];
                strongDrivers[firstOutNode].push(vals[firstOutNode]);
                gateOutputNodes.add(firstOutNode);
                continue;
              }
            }

            const inNodes = gate.inputPinNumbers.map(p => getNode(getICPinHole(ic, p)));
            const isAllWired = inNodes.every(n => allComponentRoots.has(n));
            const inputVals = inNodes.map(n => vals[n] ?? 'X');
            const firstOutNode = getNode(getICPinHole(ic, gate.outputPinNumbers[0]));
            const prevOut = seqMem.latchVals[firstOutNode] ?? (isAllWired && it === 0 ? 1 : undefined);
            outs = evaluateCombinationalGate(gate.type, inputVals, isAllWired, prevOut);
          }

          gate.outputPinNumbers.forEach((outPinNum, idx) => {
            const outNode = getNode(getICPinHole(ic, outPinNum));
            const val = outs[idx] ?? 'X';
            gateOutputNodes.add(outNode);
            if (val !== 'X') {
              if (!strongDrivers[outNode]) strongDrivers[outNode] = [];
              strongDrivers[outNode].push(val);
              // Immediate Gauss-Seidel update on vals so cross-coupled latches settle deterministically
              vals[outNode] = strongDrivers[outNode].every(v => v === strongDrivers[outNode][0])
                ? strongDrivers[outNode][0]
                : 'C';
            }
          });
        }
      }

      if (it === 0) {
        dffUpdated = true;
        srUpdated = true;
      }

      const resolved = currentStrongResolve();
      const prevJson = JSON.stringify(vals);
      vals = resolved;
      if (it > 0 && JSON.stringify(vals) === prevJson) {
        break;
      }
    }

    // Persist latch outputs for stateful 7400/7402/7410 continuity across ticks
    seqMem.latchVals = {};
    for (const node of gateOutputNodes) {
      if (vals[node] === 0 || vals[node] === 1) {
        seqMem.latchVals[node] = vals[node];
      }
    }
  } else {
    vals = {};
    for (const ic of state.ics) {
      icPowered[ic.id] = false;
    }
  }

  const getTerminalValue = (terminalId: string): LogicLevel => {
    const val = vals[getNode(terminalId)];
    return val === 0 || val === 1 || val === 'C' ? val : 'X';
  };

  // Evaluate LED states & current-limiting resistor protection
  const ledStates: WorkbenchSimResult['ledStates'] = {};

  // Build nodes directly wired (zero resistors) to any HIGH strong source vs any LOW strong source
  const directHighNodes = new Set<string>();
  const directLowNodes = new Set<string>();
  if (state.psu && !shortCircuit) {
    for (const [node, val] of Object.entries(vals)) {
      if (val === 1 && baseSources[node]?.includes(1)) directHighNodes.add(node);
      if (val === 0 && baseSources[node]?.includes(0)) directLowNodes.add(node);
    }
    // Check IC outputs driving node
    for (const ic of state.ics) {
      if (!icPowered[ic.id]) continue;
      const def = IC_CATALOG[ic.type];
      if (!def) continue;
      for (const g of def.gates) {
        for (const p of g.outputPinNumbers) {
          const n = getNode(getICPinHole(ic, p));
          if (vals[n] === 1) directHighNodes.add(n);
          if (vals[n] === 0) directLowNodes.add(n);
        }
      }
    }
  }

  const messages: StatusMessage[] = [];
  if (!state.psu) {
    messages.push({ severity: 'info', text: 'Power supply is OFF. Flip the ON/OFF switch to energize the circuit.' });
  }
  if (shortCircuit) {
    messages.push({
      severity: 'error',
      text: 'SHORT CIRCUIT: +5V is directly connected to GND without load! Remove the shorting wire.',
    });
  }

  // Rail diagnostics
  const railsPowered = {
    topPlus: state.psu && !shortCircuit && vals[getNode('Rt+:0')] === 1,
    topMinus: state.psu && !shortCircuit && vals[getNode('Rt-:0')] === 0,
    botPlus: state.psu && !shortCircuit && vals[getNode('Rb+:0')] === 1,
    botMinus: state.psu && !shortCircuit && vals[getNode('Rb-:0')] === 0,
  };

  // LED evaluation & warnings
  state.leds.forEach((led, idx) => {
    const aNode = getNode(led.anode);
    const kNode = getNode(led.cathode);
    const aVal = getTerminalValue(led.anode);
    const kVal = getTerminalValue(led.cathode);
    const lit = Boolean(state.psu && !shortCircuit && aVal === 1 && kVal === 0);
    const reverseBiased = Boolean(state.psu && !shortCircuit && aVal === 0 && kVal === 1);
    const unprotectedDirect = directHighNodes.has(aNode) && directLowNodes.has(kNode);
    const hasResistor = !lit || !unprotectedDirect;

    ledStates[led.id] = {
      lit,
      anodeVal: aVal,
      cathodeVal: kVal,
      hasResistor,
      reverseBiased,
    };

    const name = led.label || `LED${idx + 1}`;
    if (aNode === kNode) {
      messages.push({
        severity: 'error',
        text: `${name}: Anode (+) and Cathode (−) share the same breadboard strip (shorted).`,
      });
    } else if (state.psu && !shortCircuit) {
      if (lit && unprotectedDirect) {
        messages.push({
          severity: 'warning',
          text: `${name}: Lit without a 330Ω current-limiting resistor in series.`,
        });
      } else if (aVal === 1 && kVal === 'X') {
        messages.push({
          severity: 'warning',
          text: `${name}: Anode (+) is HIGH, but Cathode (−) is floating (connect Cathode to GND − rail).`,
        });
      } else if (reverseBiased) {
        messages.push({
          severity: 'info',
          text: `${name}: Reverse-biased (Anode=0, Cathode=1). Use ↻ Rotate if polarity is inverted.`,
        });
      }
    }
  });

  // IC diagnostics (smart per-gate floating check so unused gates on Quad ICs stay clean)
  state.ics.forEach((ic: PlacedIC, idx: number) => {
    const def = IC_CATALOG[ic.type];
    if (!def) return;
    const label = `IC${idx + 1} (${def.partNumber})`;
    const vccNode = getNode(getICPinHole(ic, def.vccPin));
    const gndNode = getNode(getICPinHole(ic, def.gndPin));

    if (state.psu && !shortCircuit) {
      if (vals[vccNode] !== 1) {
        messages.push({
          severity: 'error',
          text: `${label}: Pin ${def.vccPin} (VCC) is not receiving +5V.`,
        });
      }
      if (vals[gndNode] !== 0) {
        messages.push({
          severity: 'error',
          text: `${label}: Pin ${def.gndPin} (GND) is not connected to Ground (0V).`,
        });
      }
    }

    if (icPowered[ic.id]) {
      const floatingIn: string[] = [];
      for (const gate of def.gates) {
        const gatePinNodes = [
          ...gate.inputPinNumbers.map(p => getNode(getICPinHole(ic, p))),
          ...gate.outputPinNumbers.map(p => getNode(getICPinHole(ic, p))),
        ];
        const gatePartiallyWired = gatePinNodes.some(n => allComponentRoots.has(n));
        if (gatePartiallyWired) {
          for (const p of gate.inputPinNumbers) {
            const pNode = getNode(getICPinHole(ic, p));
            if (vals[pNode] === 'X') {
              floatingIn.push(`${def.pinLabels[p]}(P${p})`);
            }
          }
        }
      }
      if (floatingIn.length > 0) {
        messages.push({
          severity: 'warning',
          text: `${label}: Active gate has floating inputs (X): ${floatingIn.join(', ')}`,
        });
      }
    }
  });

  // Contention check
  if (Object.values(vals).includes('C')) {
    messages.push({
      severity: 'error',
      text: 'Bus contention (C): Two outputs or power rails are driving different levels on the same node.',
    });
  }

  if (messages.length === 0) {
    messages.push({
      severity: 'ok',
      text: 'Circuit powered cleanly. No faults detected.',
    });
  }

  // Build active Inputs & Outputs for Truth Table Log and Logic Analyser
  const activeInputs: ActiveChannel[] = [];
  const usedNodes = new Set<string>();

  if (wiredRoots.has(getNode('P1'))) {
    const val = getTerminalValue('P1');
    activeInputs.push({ id: 'P1', label: 'P1', role: 'input', value: val });
    usedNodes.add(getNode('P1'));
  }
  if (wiredRoots.has(getNode('P2'))) {
    const val = getTerminalValue('P2');
    activeInputs.push({ id: 'P2', label: 'P2', role: 'input', value: val });
    usedNodes.add(getNode('P2'));
  }
  if (wiredRoots.has(getNode('CLK'))) {
    const val = getTerminalValue('CLK');
    activeInputs.push({ id: 'CLK', label: 'CLK', role: 'input', value: val });
    usedNodes.add(getNode('CLK'));
  }

  // Primary IC input pins driven by power rails / sources (not another gate's output)
  state.ics.forEach((ic, idx) => {
    const def = IC_CATALOG[ic.type];
    if (!def) return;
    for (let p = 1; p <= def.pinCount; p++) {
      if (def.pinDirections[p] !== 'INPUT') continue;
      const hole = getICPinHole(ic, p);
      const node = getNode(hole);
      if (!allComponentRoots.has(node)) continue;
      if (gateOutputNodes.has(node)) continue; // Internal cascade, not primary user input
      if (usedNodes.has(node) && (node === getNode('P1') || node === getNode('P2') || node === getNode('CLK'))) {
        continue;
      }
      const val = vals[node] ?? 'X';
      if (val === 0 || val === 1 || wiredRoots.has(node)) {
        activeInputs.push({
          id: `ic${ic.id}_p${p}`,
          label: `${state.ics.length > 1 ? `IC${idx + 1}.` : ''}${def.pinLabels[p]}`,
          role: 'input',
          value: val,
        });
      }
    }
  });

  const activeOutputs: ActiveChannel[] = state.leds.map((led, idx) => {
    const st = ledStates[led.id];
    const value: LogicLevel = !state.psu || shortCircuit
      ? 'X'
      : st.lit
      ? 1
      : st.anodeVal === 'X' || st.cathodeVal === 'X'
      ? 'X'
      : 0;
    return {
      id: `led_${led.id}`,
      label: led.label || `LED${idx + 1}`,
      role: 'output',
      value,
    };
  });

  return {
    vals,
    getNode,
    getTerminalValue,
    icPowered,
    ledStates,
    shortCircuit,
    railsPowered,
    messages,
    activeInputs,
    activeOutputs,
  };
}
