import { DigitalSignal, GateType } from './types';

/**
 * Deterministic Digital Logic Function Evaluator
 */
export function evaluateGate(type: GateType, inputs: DigitalSignal[]): DigitalSignal[] {
  // If any input is floating/unknown, treat conservatively or as floating if critical
  const resolved = inputs.map(i => (i === DigitalSignal.FLOATING ? DigitalSignal.LOW : i));

  switch (type) {
    case 'NOT': {
      const in0 = resolved[0] ?? DigitalSignal.LOW;
      return [in0 === DigitalSignal.HIGH ? DigitalSignal.LOW : DigitalSignal.HIGH];
    }
    case 'BUFFER': {
      const in0 = resolved[0] ?? DigitalSignal.LOW;
      return [in0];
    }
    case 'AND': {
      const allHigh = resolved.length > 0 && resolved.every(sig => sig === DigitalSignal.HIGH);
      return [allHigh ? DigitalSignal.HIGH : DigitalSignal.LOW];
    }
    case 'OR': {
      const anyHigh = resolved.some(sig => sig === DigitalSignal.HIGH);
      return [anyHigh ? DigitalSignal.HIGH : DigitalSignal.LOW];
    }
    case 'NAND': {
      const allHigh = resolved.length > 0 && resolved.every(sig => sig === DigitalSignal.HIGH);
      return [allHigh ? DigitalSignal.LOW : DigitalSignal.HIGH];
    }
    case 'NOR': {
      const anyHigh = resolved.some(sig => sig === DigitalSignal.HIGH);
      return [anyHigh ? DigitalSignal.LOW : DigitalSignal.HIGH];
    }
    case 'XOR': {
      // Standard 2-input XOR: high if odd number of inputs are high
      const highCount = resolved.filter(sig => sig === DigitalSignal.HIGH).length;
      return [highCount % 2 === 1 ? DigitalSignal.HIGH : DigitalSignal.LOW];
    }
    case 'XNOR': {
      const highCount = resolved.filter(sig => sig === DigitalSignal.HIGH).length;
      return [highCount % 2 === 0 ? DigitalSignal.HIGH : DigitalSignal.LOW];
    }
    case 'ADDER_4BIT': {
      // 4-bit adder (e.g. 7483)
      // Inputs: [A3, A2, A1, A0, B3, B2, B1, B0, Cin]
      // Outputs: [S3, S2, S1, S0, Cout]
      const a = (resolved[0] << 3) | (resolved[1] << 2) | (resolved[2] << 1) | resolved[3];
      const b = (resolved[4] << 3) | (resolved[5] << 2) | (resolved[6] << 1) | resolved[7];
      const cin = resolved[8] ?? DigitalSignal.LOW;
      const sum = a + b + cin;

      const s3 = (sum & 0b1000) ? DigitalSignal.HIGH : DigitalSignal.LOW;
      const s2 = (sum & 0b0100) ? DigitalSignal.HIGH : DigitalSignal.LOW;
      const s1 = (sum & 0b0010) ? DigitalSignal.HIGH : DigitalSignal.LOW;
      const s0 = (sum & 0b0001) ? DigitalSignal.HIGH : DigitalSignal.LOW;
      const cout = (sum & 0b10000) ? DigitalSignal.HIGH : DigitalSignal.LOW;

      return [s3, s2, s1, s0, cout];
    }
    default:
      return [DigitalSignal.LOW];
  }
}

export function signalToString(signal: DigitalSignal): string {
  switch (signal) {
    case DigitalSignal.HIGH:
      return '1';
    case DigitalSignal.LOW:
      return '0';
    case DigitalSignal.FLOATING:
      return 'Z';
  }
}

export function parseSignal(val: number | string | boolean): DigitalSignal {
  if (val === 1 || val === '1' || val === true) return DigitalSignal.HIGH;
  if (val === 0 || val === '0' || val === false) return DigitalSignal.LOW;
  return DigitalSignal.FLOATING;
}
