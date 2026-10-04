import { Circuit } from './engine/Circuit';
import { SubCircuitConfig } from '../experiments/types';
import { IC_CATALOG } from './ics/definitions';
import { DigitalSignal, SwitchComponent, LEDComponent } from './engine/types';

/**
 * Builds an interactive, executable Circuit from a SubCircuitConfig.
 */
export function buildCircuitFromConfig(config: SubCircuitConfig, activeWireIds?: string[]): Circuit {
  const circuit = new Circuit(config.id);

  // 1. Add ICs
  for (const icConfig of config.ics) {
    const def = IC_CATALOG[icConfig.partNumber];
    if (!def) {
      console.warn(`IC definition not found for part number: ${icConfig.partNumber}`);
      continue;
    }

    const pinIds: Record<number, string> = {};
    for (let p = 1; p <= def.pinCount; p++) {
      pinIds[p] = `${icConfig.instanceId}_pin_${p}`;
    }

    circuit.addIC({
      instanceId: icConfig.instanceId,
      partNumber: icConfig.partNumber,
      label: icConfig.label,
      definition: def,
      position: { rowStart: icConfig.rowStart, centerTrough: true },
      pinIds,
    });
  }

  // 2. Add Switches (Inputs)
  for (const input of config.inputs) {
    const sw: SwitchComponent = {
      id: input.id,
      label: input.label,
      state: input.defaultState ?? DigitalSignal.LOW,
      outputPinId: `sw_out_${input.id}`,
    };
    circuit.addSwitch(sw);
  }

  // 3. Add LEDs (Outputs)
  for (const output of config.outputs) {
    const led: LEDComponent = {
      id: output.id,
      label: output.label,
      inputPinId: `led_in_${output.id}`,
      cathodePinId: `led_cathode_${output.id}`,
      color: output.color ?? 'red',
      state: DigitalSignal.LOW,
    };
    circuit.addLED(led);
  }

  // 4. Connect Wires based on configuration
  // When activeWireIds is provided (e.g. in Build Mode), connect ONLY placed wires
  const wiresToConnect = activeWireIds !== undefined
    ? config.wires.filter(w => activeWireIds.includes(w.id))
    : config.wires;

  for (const wireDef of wiresToConnect) {
    const fromPinId = wireDef.fromPinId ?? resolveHoleToPinId(circuit, config, wireDef.from);
    const toPinId = wireDef.toPinId ?? resolveHoleToPinId(circuit, config, wireDef.to);

    if (fromPinId && toPinId) {
      circuit.addWire({
        id: wireDef.id,
        fromPinId,
        toPinId,
        color: wireDef.color,
        label: wireDef.label,
        signal: DigitalSignal.LOW,
      });
    }
  }

  // 5. Run initial propagation
  circuit.propagate();

  return circuit;
}

/**
 * Resolves a breadboard hole {row, col} to the associated circuit Pin ID
 */
function resolveHoleToPinId(
  circuit: Circuit,
  config: SubCircuitConfig,
  hole: { row: number; col: string }
): string | null {
  const colUpper = hole.col.toUpperCase();

  // Check if hole is on power rails
  if (colUpper === 'L+' || colUpper === 'R+') {
    const pwrPinId = `pwr_vcc_${hole.row}_${hole.col}`;
    if (!circuit.pins[pwrPinId]) {
      circuit.addPin({
        id: pwrPinId,
        label: `VCC Rail (+5V)`,
        direction: 'POWER',
        signal: DigitalSignal.HIGH,
        componentId: 'power_rail',
      });
    }
    return pwrPinId;
  }

  if (colUpper === 'L-' || colUpper === 'R-') {
    const gndPinId = `pwr_gnd_${hole.row}_${hole.col}`;
    if (!circuit.pins[gndPinId]) {
      circuit.addPin({
        id: gndPinId,
        label: `GND Rail (0V)`,
        direction: 'GROUND',
        signal: DigitalSignal.LOW,
        componentId: 'ground_rail',
      });
    }
    return gndPinId;
  }

  // Check if hole corresponds to an Input Switch
  const matchedInput = config.inputs.find(
    inp => inp.boardConnection.row === hole.row && inp.boardConnection.col.toUpperCase() === colUpper
  );
  if (matchedInput) {
    return `sw_out_${matchedInput.id}`;
  }

  // Check if hole corresponds to an Output LED
  const matchedOutput = config.outputs.find(
    out => out.boardConnection.row === hole.row && out.boardConnection.col.toUpperCase() === colUpper
  );
  if (matchedOutput) {
    return `led_in_${matchedOutput.id}`;
  }

  // Check if hole aligns with an IC pin on the breadboard terminal strips
  // Columns A..E connect electrically to Left Pin of IC at that row (Pins 1..7/8)
  // Columns F..J connect electrically to Right Pin of IC at that row (Pins 8..14 / 9..16)
  for (const ic of config.ics) {
    const def = IC_CATALOG[ic.partNumber];
    if (!def) continue;

    const rowOffset = hole.row - ic.rowStart;
    const halfPins = def.pinCount / 2;

    if (rowOffset >= 0 && rowOffset < halfPins) {
      if (['A', 'B', 'C', 'D', 'E'].includes(colUpper)) {
        const pinNum = rowOffset + 1; // Pin 1 to halfPins
        return `${ic.instanceId}_pin_${pinNum}`;
      } else if (['F', 'G', 'H', 'I', 'J'].includes(colUpper)) {
        const pinNum = def.pinCount - rowOffset; // Pins on the right descend from pinCount down
        return `${ic.instanceId}_pin_${pinNum}`;
      }
    }
  }

  // Generic tie point on breadboard
  const tiePinId = `tie_row_${hole.row}_col_${hole.col}`;
  if (!circuit.pins[tiePinId]) {
    circuit.addPin({
      id: tiePinId,
      label: `Breadboard ${hole.col}${hole.row}`,
      direction: 'PASSIVE',
      signal: DigitalSignal.FLOATING,
      componentId: 'breadboard',
    });
  }
  return tiePinId;
}
