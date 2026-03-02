/**
 * Shared animation utilities. All timing uses easing — never linear.
 */

/** Quadratic ease-out: decelerating to zero velocity. */
export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/** Quadratic ease-in: accelerating from zero velocity. */
export function easeInQuad(t: number): number {
  return t * t;
}

/** Cubic ease-in-out. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Overshoot bounce for entrances. */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Interpolate between two values. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp value to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Interpolate a hex color. */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

/** Convert hex to a PixiJS-compatible numeric color. */
export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/** Interpolate between two numeric (PixiJS) hex colors. */
export function lerpHexNum(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xFF;
  const ag = (a >> 8) & 0xFF;
  const ab = a & 0xFF;
  const br = (b >> 16) & 0xFF;
  const bg = (b >> 8) & 0xFF;
  const bb = b & 0xFF;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
