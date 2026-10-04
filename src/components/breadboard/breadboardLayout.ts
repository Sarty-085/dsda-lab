/**
 * Exact geometric coordinate system for SVG Breadboard matching the visual reference.
 */

export interface Point {
  x: number;
  y: number;
}

export const BB_CONFIG = {
  viewBoxWidth: 560,
  viewBoxHeight: 1020,
  boardX: 20,
  boardY: 20,
  boardWidth: 520,
  boardHeight: 980,
  rowPitch: 19.5,
  colPitch: 18,
  rowsCount: 44,
  startY: 75,

  // Columns X coordinates
  railLeftPlusX: 52,
  railLeftMinusX: 72,
  
  colAX: 122,
  colBX: 140,
  colCX: 158,
  colDX: 176,
  colEX: 194,

  troughCenterX: 228,
  troughWidth: 26,

  colFX: 262,
  colGX: 280,
  colHX: 298,
  colIX: 316,
  colJX: 334,

  railRightMinusX: 384,
  railRightPlusX: 404,

  holeRadius: 3.5,
};

export function getHoleCoords(row: number, col: string): Point {
  const y = BB_CONFIG.startY + (row - 1) * BB_CONFIG.rowPitch;

  switch (col.toUpperCase()) {
    case 'L+':
      return { x: BB_CONFIG.railLeftPlusX, y };
    case 'L-':
      return { x: BB_CONFIG.railLeftMinusX, y };
    case 'A':
      return { x: BB_CONFIG.colAX, y };
    case 'B':
      return { x: BB_CONFIG.colBX, y };
    case 'C':
      return { x: BB_CONFIG.colCX, y };
    case 'D':
      return { x: BB_CONFIG.colDX, y };
    case 'E':
      return { x: BB_CONFIG.colEX, y };
    case 'F':
      return { x: BB_CONFIG.colFX, y };
    case 'G':
      return { x: BB_CONFIG.colGX, y };
    case 'H':
      return { x: BB_CONFIG.colHX, y };
    case 'I':
      return { x: BB_CONFIG.colIX, y };
    case 'J':
      return { x: BB_CONFIG.colJX, y };
    case 'R-':
      return { x: BB_CONFIG.railRightMinusX, y };
    case 'R+':
      return { x: BB_CONFIG.railRightPlusX, y };
    default:
      return { x: BB_CONFIG.colCX, y };
  }
}
