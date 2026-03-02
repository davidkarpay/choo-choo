/**
 * terrainProfile.ts
 *
 * Generates layered hill profiles for background scenes. Uses multi-frequency
 * bezier curves and atmospheric perspective (far = cool/desaturated,
 * near = warm/saturated) to create depth.
 *
 * Part of: Choo-Choo USA
 * See: docs/STYLE_GUIDE.md § Backgrounds
 *
 * Dependencies:
 *   - pixi.js: Graphics
 */

import { Graphics } from 'pixi.js';

const INK = 0x1A1A2E;

export interface HillLayer {
  /** Graphics object containing the filled hill shape */
  graphics: Graphics;
  /** Parallax speed multiplier (0.2 = far, 0.8 = near) */
  parallaxSpeed: number;
}

export interface TerrainConfig {
  /** Scene width in pixels */
  width: number;
  /** Scene height in pixels */
  height: number;
  /** Y position where the ground/track level is */
  groundY: number;
  /** Random seed for deterministic terrain (use stationId hash) */
  seed: number;
}

/**
 * Generate a seeded pseudo-random number generator.
 * Simple mulberry32 PRNG for deterministic terrain per station.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a multi-frequency terrain profile Y value for a given X.
 * Combines 3 sine waves at different frequencies for organic shapes.
 */
function terrainY(
  x: number,
  baseY: number,
  amplitude: number,
  freq1: number,
  freq2: number,
  freq3: number,
  phase: number,
): number {
  return baseY
    + Math.sin(x * freq1 + phase) * amplitude
    + Math.sin(x * freq2 + phase * 1.7) * (amplitude * 0.5)
    + Math.sin(x * freq3 + phase * 0.3) * (amplitude * 0.25);
}

/**
 * Generate layered hill profiles for a scene background.
 * Returns 3-4 hill layers from far (cool, desaturated) to near (warm, saturated).
 *
 * Args:
 *   config: Scene dimensions, ground position, and random seed
 *
 * Returns:
 *   Array of HillLayer objects, ordered far-to-near
 */
export function generateTerrain(config: TerrainConfig): HillLayer[] {
  const { width, height, groundY, seed } = config;
  const rng = seededRandom(seed);
  const layers: HillLayer[] = [];

  // Layer definitions: [color, parallaxSpeed, baseY offset, amplitude, frequencies, hasOutline]
  const layerDefs: Array<{
    color: number;
    parallax: number;
    baseYOffset: number;
    amplitude: number;
    freq1: number;
    freq2: number;
    freq3: number;
    outlineWidth: number;
  }> = [
    {
      // Far hills: cool blue-purple, smooth gentle curves
      color: 0x3A4A6B,
      parallax: 0.25,
      baseYOffset: -180,
      amplitude: 35,
      freq1: 0.003,
      freq2: 0.007,
      freq3: 0.015,
      outlineWidth: 0,
    },
    {
      // Mid-far hills: blue-green, moderate detail
      color: 0x3A6B4F,
      parallax: 0.4,
      baseYOffset: -120,
      amplitude: 45,
      freq1: 0.004,
      freq2: 0.01,
      freq3: 0.022,
      outlineWidth: 1,
    },
    {
      // Mid-near hills: forest green, visible contour
      color: 0x2D6B3D,
      parallax: 0.6,
      baseYOffset: -60,
      amplitude: 50,
      freq1: 0.005,
      freq2: 0.013,
      freq3: 0.028,
      outlineWidth: 1.5,
    },
    {
      // Near hills: full Deep Forest, bold outline
      color: 0x2D5A3D,
      parallax: 0.75,
      baseYOffset: -10,
      amplitude: 35,
      freq1: 0.006,
      freq2: 0.015,
      freq3: 0.035,
      outlineWidth: 2,
    },
  ];

  for (const def of layerDefs) {
    const g = new Graphics();
    const phase = rng() * Math.PI * 6;
    const baseY = groundY + def.baseYOffset;

    // Start at bottom-left
    g.moveTo(0, height);

    // Draw terrain profile left to right
    const step = 8; // pixel step size
    for (let x = 0; x <= width + step; x += step) {
      const y = terrainY(x, baseY, def.amplitude, def.freq1, def.freq2, def.freq3, phase);
      g.lineTo(x, y);
    }

    // Close the shape at bottom-right
    g.lineTo(width + step, height);
    g.closePath();

    g.fill(def.color);

    if (def.outlineWidth > 0) {
      // Redraw just the top edge for the outline
      g.moveTo(0, terrainY(0, baseY, def.amplitude, def.freq1, def.freq2, def.freq3, phase));
      for (let x = step; x <= width + step; x += step) {
        const y = terrainY(x, baseY, def.amplitude, def.freq1, def.freq2, def.freq3, phase);
        g.lineTo(x, y);
      }
      g.stroke({ color: INK, width: def.outlineWidth, alpha: 0.4 });
    }

    layers.push({ graphics: g, parallaxSpeed: def.parallax });
  }

  return layers;
}

/**
 * Get the top Y coordinate of a terrain layer at a given X position.
 * Useful for placing trees along the ridgeline.
 */
export function getTerrainTopY(
  x: number,
  baseY: number,
  amplitude: number,
  freq1: number,
  freq2: number,
  freq3: number,
  phase: number,
): number {
  return terrainY(x, baseY, amplitude, freq1, freq2, freq3, phase);
}
