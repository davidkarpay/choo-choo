/**
 * groundStamps.ts
 *
 * Small programmatic "stamp" sprites for foreground ground detail.
 * Scattered across the ground plane to add texture and visual interest.
 * Inspired by texel-splatting but done with warm, painterly shapes.
 *
 * Part of: Choo-Choo USA
 * See: docs/STYLE_GUIDE.md § Backgrounds
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics
 */

import { Container, Graphics } from 'pixi.js';

const DEEP_FOREST = 0x2D5A3D;
const MID_GREEN = 0x3A7A4F;
const LIGHT_GREEN = 0x4A8A5F;
const BARK_BROWN = 0x6B4226;
const ROCK_GRAY = 0x7A7A72;
const WILDFLOWER_PINK = 0xD98BA5;
const WILDFLOWER_YELLOW = 0xE8C84A;
const WILDFLOWER_BLUE = 0x6A8FC4;
const WHEAT_GOLD = 0xD4A843;

/**
 * Draw a tuft of grass (3-5 short curved blades).
 */
export function drawGrassTuft(
  x: number,
  y: number,
  scale = 1.0,
  rng?: () => number,
): Graphics {
  const g = new Graphics();
  const rand = rng ?? Math.random;
  const s = scale;
  const bladeCount = 3 + Math.floor(rand() * 3);
  const colors = [DEEP_FOREST, MID_GREEN, LIGHT_GREEN];

  for (let i = 0; i < bladeCount; i++) {
    const bx = x + (rand() - 0.5) * 6 * s;
    const height = (8 + rand() * 12) * s;
    const lean = (rand() - 0.5) * 6 * s;
    const color = colors[Math.floor(rand() * colors.length)];

    g.moveTo(bx, y);
    g.quadraticCurveTo(bx + lean * 0.5, y - height * 0.6, bx + lean, y - height);
    g.stroke({ color, width: 1.5 * s });
  }

  return g;
}

/**
 * Draw a small cluster of wildflowers (2-3 colored circles with stems).
 */
export function drawFlowerCluster(
  x: number,
  y: number,
  scale = 1.0,
  rng?: () => number,
): Graphics {
  const g = new Graphics();
  const rand = rng ?? Math.random;
  const s = scale;
  const flowerCount = 2 + Math.floor(rand() * 2);
  const flowerColors = [WILDFLOWER_PINK, WILDFLOWER_YELLOW, WILDFLOWER_BLUE];

  for (let i = 0; i < flowerCount; i++) {
    const fx = x + (rand() - 0.5) * 8 * s;
    const stemH = (6 + rand() * 8) * s;
    const flowerR = (2 + rand() * 2) * s;
    const color = flowerColors[Math.floor(rand() * flowerColors.length)];

    // Stem
    g.moveTo(fx, y);
    g.lineTo(fx + (rand() - 0.5) * 2 * s, y - stemH);
    g.stroke({ color: MID_GREEN, width: 1 * s });

    // Flower head
    g.circle(fx + (rand() - 0.5) * 2 * s, y - stemH - flowerR, flowerR);
    g.fill(color);

    // Center dot
    g.circle(fx + (rand() - 0.5) * 2 * s, y - stemH - flowerR, flowerR * 0.35);
    g.fill(WHEAT_GOLD);
  }

  return g;
}

/**
 * Draw a small rock (irregular rounded shape).
 */
export function drawRock(
  x: number,
  y: number,
  scale = 1.0,
  rng?: () => number,
): Graphics {
  const g = new Graphics();
  const rand = rng ?? Math.random;
  const s = scale;
  const w = (8 + rand() * 10) * s;
  const h = (5 + rand() * 6) * s;

  // Irregular rounded shape using a path
  g.moveTo(x - w * 0.4, y);
  g.quadraticCurveTo(x - w * 0.5, y - h * 0.6, x - w * 0.15, y - h);
  g.quadraticCurveTo(x + w * 0.1, y - h * 1.1, x + w * 0.35, y - h * 0.7);
  g.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.4, y);
  g.closePath();
  g.fill(ROCK_GRAY);
  g.stroke({ color: darken(ROCK_GRAY, 0.2), width: 1 * s });

  // Highlight on top
  g.moveTo(x - w * 0.15, y - h * 0.85);
  g.lineTo(x + w * 0.15, y - h * 0.75);
  g.stroke({ color: lighten(ROCK_GRAY, 0.2), width: 1 * s });

  return g;
}

/**
 * Draw a fence section (vertical posts with horizontal rail).
 */
export function drawFenceSection(
  startX: number,
  endX: number,
  y: number,
  scale = 1.0,
): Graphics {
  const g = new Graphics();
  const s = scale;
  const postSpacing = 30 * s;
  const postH = 15 * s;
  const postW = 3 * s;
  const posts = Math.ceil((endX - startX) / postSpacing);

  for (let i = 0; i <= posts; i++) {
    const px = startX + i * postSpacing;
    g.rect(px - postW / 2, y - postH, postW, postH);
    g.fill(BARK_BROWN);
    g.stroke({ color: darken(BARK_BROWN, 0.15), width: 0.8 * s });
  }

  // Horizontal rails (two)
  g.rect(startX, y - postH * 0.7, endX - startX, 2 * s);
  g.fill(BARK_BROWN);
  g.rect(startX, y - postH * 0.35, endX - startX, 2 * s);
  g.fill(BARK_BROWN);

  return g;
}

/**
 * Scatter ground stamps across a region for texture.
 *
 * Args:
 *   startX: Left edge
 *   endX: Right edge
 *   groundY: Ground level Y
 *   density: Stamps per 100px (default 5)
 *   seed: Random seed for deterministic placement
 *
 * Returns:
 *   Container with all ground detail stamps
 */
export function scatterGroundStamps(
  startX: number,
  endX: number,
  groundY: number,
  density = 5,
  seed = 42,
): Container {
  const container = new Container();
  const rng = seededRandom(seed);
  const width = endX - startX;
  const count = Math.floor((width / 100) * density);

  for (let i = 0; i < count; i++) {
    const x = startX + rng() * width;
    const y = groundY - rng() * 8; // slight Y variation
    const roll = rng();

    if (roll < 0.5) {
      // Grass tuft (most common)
      container.addChild(drawGrassTuft(x, y, 0.8, rng));
    } else if (roll < 0.75) {
      // Flowers
      container.addChild(drawFlowerCluster(x, y, 0.8, rng));
    } else {
      // Rock
      container.addChild(drawRock(x, y, 0.7, rng));
    }
  }

  return container;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xFF) * (1 - amount)) | 0;
  const g = Math.max(0, ((color >> 8) & 0xFF) * (1 - amount)) | 0;
  const b = Math.max(0, (color & 0xFF) * (1 - amount)) | 0;
  return (r << 16) | (g << 8) | b;
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xFF) * (1 + amount)) | 0;
  const g = Math.min(255, ((color >> 8) & 0xFF) * (1 + amount)) | 0;
  const b = Math.min(255, (color & 0xFF) * (1 + amount)) | 0;
  return (r << 16) | (g << 8) | b;
}
