import { PlacedIC } from './workbenchTypes';

export const WB_COLS = 35; // 35 breadboard columns (0..34, displayed 1..35)
export const COL_PITCH = 26;
export const FIRST_COL_X = 192;

export const WB_VIEWBOX_W = 1120;
export const WB_VIEWBOX_H = 550;

export const TOP_ROWS = ['a', 'b', 'c', 'd', 'e'] as const;
export const BOT_ROWS = ['f', 'g', 'h', 'i', 'j'] as const;

export const ROW_Y: Record<string, number> = {
  a: 146,
  b: 172,
  c: 198,
  d: 224,
  e: 250,
  f: 318,
  g: 344,
  h: 370,
  i: 396,
  j: 422,
};

export const RAIL_Y: Record<string, number> = {
  't+': 62,
  't-': 90,
  'b+': 476,
  'b-': 504,
};

export const PANEL_TERMINALS: Record<string, [number, number]> = {
  'PSU+': [48, 174],
  PSUG: [106, 174],
  P1: [48, 396],
  P2: [106, 396],
  CLK: [77, 494],
};

export function colX(col: number): number {
  return FIRST_COL_X + col * COL_PITCH;
}

export function getTerminalPos(id: string): [number, number] {
  if (PANEL_TERMINALS[id]) return PANEL_TERMINALS[id];

  const railMatch = id.match(/^R([tb][+-]):(\d+)$/);
  if (railMatch) {
    return [colX(parseInt(railMatch[2], 10)), RAIL_Y[railMatch[1]]];
  }

  const gridMatch = id.match(/^[TB](\d+)([a-j])$/);
  if (gridMatch) {
    return [colX(parseInt(gridMatch[1], 10)), ROW_Y[gridMatch[2]]];
  }

  return [0, 0];
}

/**
 * Returns the electrical strip key for a terminal hole:
 * - T{col}a..e -> T{col} (5 vertical holes share spring clip)
 * - B{col}f..j -> B{col} (5 vertical holes share spring clip)
 * - Rt+:col -> Rt+ (Top + rail runs across entire top strip)
 * - Rt-:col -> Rt-
 * - Rb+:col -> Rb+
 * - Rb-:col -> Rb-
 */
export function getNodeKey(terminalId: string): string {
  const gridMatch = terminalId.match(/^([TB]\d+)[a-j]$/);
  if (gridMatch) return gridMatch[1];
  if (terminalId.startsWith('R')) return terminalId.split(':')[0];
  return terminalId;
}

/**
 * Physical hole under the IC leg for a given pin number (1..14 or 1..16)
 */
export function getICPinHole(ic: Pick<PlacedIC, 'col' | 'pinCount'>, pinNum: number): string {
  const half = ic.pinCount / 2;
  if (pinNum <= half) {
    return `B${ic.col + pinNum - 1}f`;
  }
  return `T${ic.col + ic.pinCount - pinNum}e`;
}

/**
 * Human-readable label for a terminal ID
 */
export function formatTerminalLabel(terminalId: string): string {
  if (terminalId === 'PSU+') return 'Power Supply +5V';
  if (terminalId === 'PSUG') return 'Power Supply GND';
  if (terminalId === 'P1') return 'Pulser P1';
  if (terminalId === 'P2') return 'Pulser P2';
  if (terminalId === 'CLK') return 'Pulse Generator CLK';

  const rMatch = terminalId.match(/^R([tb])([+-]):(\d+)$/);
  if (rMatch) {
    const side = rMatch[1] === 't' ? 'Top' : 'Bottom';
    const pol = rMatch[2] === '+' ? '+ Rail' : '− Rail';
    return `${side} ${pol} Col ${parseInt(rMatch[3], 10) + 1}`;
  }

  const gMatch = terminalId.match(/^[TB](\d+)([a-j])$/);
  if (gMatch) {
    return `Col ${parseInt(gMatch[1], 10) + 1}, Row ${gMatch[2].toUpperCase()}`;
  }

  return terminalId;
}

/**
 * Compute default or rotated 2-pin component span given an anchor hole (or col, isTop).
 */
export function computeTwoPinSpan(
  anchorHole: string,
  spanCols = 3
): { a: string; b: string } {
  const rMatch = anchorHole.match(/^R([tb])([+-]):(\d+)$/);
  if (rMatch) {
    const col = parseInt(rMatch[3], 10);
    const row = rMatch[1] === 't' ? 'a' : 'j';
    const prefix = rMatch[1] === 't' ? 'T' : 'B';
    return { a: `${prefix}${col}${row}`, b: anchorHole };
  }

  const gMatch = anchorHole.match(/^([TB])(\d+)([a-j])$/);
  if (gMatch) {
    const side = gMatch[1];
    const col = parseInt(gMatch[2], 10);
    const row = gMatch[3];
    const endCol = col + spanCols < WB_COLS ? col + spanCols : col - spanCols;
    return { a: `${side}${col}${row}`, b: `${side}${endCol}${row}` };
  }

  return { a: 'B5h', b: 'B8h' };
}

/**
 * Cycle rotation/orientation for a 2-pin component (LED or Resistor)
 */
export function cycleTwoPinOrientation(
  a: string,
  b: string,
  spanCols: number
): { a: string; b: string } {
  const gA = a.match(/^([TB])(\d+)([a-j])$/);
  const gB = b.match(/^([TB])(\d+)([a-j])$/);
  const rB = b.match(/^R([tb])([+-]):(\d+)$/);
  const rA = a.match(/^R([tb])([+-]):(\d+)$/);

  // 1. Horizontal (A left -> B right) -> flip polarity / bridge gap
  if (gA && gB && gA[1] === gB[1]) {
    const colA = parseInt(gA[2], 10);
    const colB = parseInt(gB[2], 10);
    if (colA < colB) {
      // Flip polarity horizontally
      return { a: b, b: a };
    } else {
      // Switch to Bridge Across Gap (e <-> f) or To Minus Rail!
      const baseCol = Math.min(colA, colB);
      if (gA[1] === 'B') {
        return { a: `B${baseCol}j`, b: `Rb-:${baseCol}` };
      } else {
        return { a: `T${baseCol}a`, b: `Rt-:${baseCol}` };
      }
    }
  }

  // 2. Vertical to Minus rail -> Vertical to Plus rail
  if (gA && rB && rB[2] === '-') {
    const col = parseInt(gA[2], 10);
    return { a, b: `R${rB[1]}+:${col}` };
  }

  // 3. Vertical to Plus rail -> Across Center Gap (T..e <-> B..f)
  if (gA && rB && rB[2] === '+') {
    const col = parseInt(gA[2], 10);
    return { a: `T${col}d`, b: `B${col}g` };
  }

  // 4. Across Center Gap (T <-> B) -> Back to Horizontal
  if (gA && gB && gA[1] !== gB[1]) {
    const col = parseInt(gA[2], 10);
    const endCol = col + spanCols < WB_COLS ? col + spanCols : col - spanCols;
    return { a: `B${col}h`, b: `B${endCol}h` };
  }

  // Fallback
  if (rA && gB) {
    const col = parseInt(gB[2], 10);
    const endCol = col + spanCols < WB_COLS ? col + spanCols : col - spanCols;
    return { a: `B${col}h`, b: `B${endCol}h` };
  }

  return { a: b, b: a };
}
