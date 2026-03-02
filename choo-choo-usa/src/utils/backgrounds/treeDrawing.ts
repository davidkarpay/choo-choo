/**
 * treeDrawing.ts
 *
 * Draws trees at three distance levels and multiple styles for background scenes.
 * Distant trees are simple silhouette bumps. Mid-ground trees have visible crown
 * and trunk. Foreground trees have full detail with leaf texture and ink outlines.
 *
 * Part of: Choo-Choo USA
 * See: docs/STYLE_GUIDE.md § Backgrounds
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics
 */

import { Container, Graphics } from 'pixi.js';

const INK = 0x1A1A2E;
const DEEP_FOREST = 0x2D5A3D;
const BARK_BROWN = 0x6B4226;
const DARK_GREEN = 0x1E4A2E;
const MID_GREEN = 0x3A7A4F;
const LIGHT_GREEN = 0x4A8A5F;

export type TreeStyle = 'deciduous' | 'pine' | 'oak';
export type TreeDistance = 'distant' | 'mid' | 'near';

/**
 * Draw a single tree at the specified position and style.
 *
 * Args:
 *   x: Center X position
 *   y: Base Y position (ground level)
 *   style: Tree silhouette type
 *   distance: Level of detail (distant = least, near = most)
 *   scale: Size multiplier (default 1.0)
 *   rng: Optional seeded random function for variation
 *
 * Returns:
 *   Container with the tree graphics
 */
export function drawTree(
  x: number,
  y: number,
  style: TreeStyle,
  distance: TreeDistance,
  scale = 1.0,
  rng?: () => number,
): Container {
  const container = new Container();
  const s = scale;
  const rand = rng ?? Math.random;

  // Slight random variation in size and lean
  const sizeVar = 0.85 + rand() * 0.3;
  const lean = (rand() - 0.5) * 3 * s;

  switch (style) {
    case 'deciduous':
      drawDeciduous(container, x, y, s * sizeVar, distance, lean, rand);
      break;
    case 'pine':
      drawPine(container, x, y, s * sizeVar, distance, lean, rand);
      break;
    case 'oak':
      drawOak(container, x, y, s * sizeVar, distance, lean, rand);
      break;
  }

  return container;
}

/**
 * Draw a cluster of distant tree bumps along a ridgeline.
 * These merge into a continuous canopy silhouette.
 *
 * Args:
 *   startX: Left X of the cluster
 *   endX: Right X of the cluster
 *   baseY: Y position (ridgeline)
 *   color: Fill color (matches the hill layer)
 *   density: Trees per 100px (default 3)
 *   rng: Seeded random function
 *
 * Returns:
 *   Graphics with the tree line silhouette
 */
export function drawTreeLine(
  startX: number,
  endX: number,
  baseY: number,
  color: number,
  density = 3,
  rng?: () => number,
): Graphics {
  const g = new Graphics();
  const rand = rng ?? Math.random;
  const width = endX - startX;
  const treeCount = Math.floor((width / 100) * density);

  // Build a bumpy canopy profile
  g.moveTo(startX, baseY);

  const positions: number[] = [];
  for (let i = 0; i < treeCount; i++) {
    positions.push(startX + (width * i) / treeCount + rand() * (width / treeCount) * 0.6);
  }
  positions.sort((a, b) => a - b);

  for (const tx of positions) {
    const h = 10 + rand() * 18;
    const w = 8 + rand() * 12;
    // Approach the tree
    g.lineTo(tx - w / 2, baseY);
    // Crown bump (semicircle approximation with quadratic curve)
    g.quadraticCurveTo(tx - w / 4, baseY - h, tx, baseY - h);
    g.quadraticCurveTo(tx + w / 4, baseY - h, tx + w / 2, baseY);
  }

  g.lineTo(endX, baseY);
  g.lineTo(endX, baseY + 20);
  g.lineTo(startX, baseY + 20);
  g.closePath();

  // Slightly darker than the hill it sits on
  g.fill(darkenColor(color, 0.12));

  return g;
}

// ---------------------------------------------------------------------------
// Individual tree drawing functions
// ---------------------------------------------------------------------------

function drawDeciduous(
  container: Container,
  x: number,
  y: number,
  s: number,
  distance: TreeDistance,
  lean: number,
  rand: () => number,
): void {
  const g = new Graphics();
  const trunkH = 22 * s;
  const trunkW = 4 * s;
  const crownR = 14 * s;

  if (distance === 'distant') {
    // Simple circle on a stick
    g.circle(x + lean * 0.5, y - trunkH - crownR * 0.6, crownR * 0.7);
    g.fill(DEEP_FOREST);
    container.addChild(g);
    return;
  }

  // Trunk
  g.rect(x - trunkW / 2 + lean, y - trunkH, trunkW, trunkH);
  g.fill(BARK_BROWN);
  if (distance === 'near') {
    g.stroke({ color: INK, width: 1.5 * s });
  }

  // Crown: 2-3 overlapping circles
  const crownCX = x + lean * 0.5;
  const crownCY = y - trunkH - crownR * 0.5;
  const circles = distance === 'near' ? 3 : 2;

  for (let i = 0; i < circles; i++) {
    const cx = crownCX + (rand() - 0.5) * crownR * 0.6;
    const cy = crownCY + (rand() - 0.5) * crownR * 0.4;
    const r = crownR * (0.7 + rand() * 0.3);
    g.circle(cx, cy, r);
    g.fill(i === 0 ? DEEP_FOREST : (i === 1 ? MID_GREEN : DARK_GREEN));
  }

  if (distance === 'near') {
    // Re-draw the main crown circle with an outline
    g.circle(crownCX, crownCY, crownR);
    g.stroke({ color: INK, width: 2 * s });

    // Leaf texture: small dabs of varying green
    for (let i = 0; i < 8; i++) {
      const lx = crownCX + (rand() - 0.5) * crownR * 1.2;
      const ly = crownCY + (rand() - 0.5) * crownR * 1.0;
      const lr = 2 * s + rand() * 3 * s;
      g.circle(lx, ly, lr);
      g.fill(rand() > 0.5 ? LIGHT_GREEN : DARK_GREEN);
    }
  }

  container.addChild(g);
}

function drawPine(
  container: Container,
  x: number,
  y: number,
  s: number,
  distance: TreeDistance,
  lean: number,
  rand: () => number,
): void {
  const g = new Graphics();
  const trunkH = 25 * s;
  const trunkW = 3 * s;
  const treeH = 30 * s;
  const treeW = 16 * s;

  if (distance === 'distant') {
    // Simple triangle
    g.moveTo(x, y - trunkH - treeH * 0.6);
    g.lineTo(x - treeW * 0.3, y - trunkH * 0.4);
    g.lineTo(x + treeW * 0.3, y - trunkH * 0.4);
    g.closePath();
    g.fill(DARK_GREEN);
    container.addChild(g);
    return;
  }

  // Trunk
  g.rect(x - trunkW / 2 + lean * 0.5, y - trunkH, trunkW, trunkH);
  g.fill(BARK_BROWN);
  if (distance === 'near') {
    g.stroke({ color: INK, width: 1 * s });
  }

  // Layered triangles for pine canopy (3 layers)
  const layers = distance === 'near' ? 3 : 2;
  for (let i = 0; i < layers; i++) {
    const layerY = y - trunkH + 5 * s - i * (treeH / layers) * 0.8;
    const layerW = treeW * (1 - i * 0.2);
    const layerH = treeH / layers + 5 * s;
    const cx = x + lean * 0.3;

    g.moveTo(cx, layerY - layerH);
    g.lineTo(cx - layerW / 2, layerY);
    g.lineTo(cx + layerW / 2, layerY);
    g.closePath();
    g.fill(i === 0 ? DEEP_FOREST : (i === 1 ? DARK_GREEN : MID_GREEN));

    if (distance === 'near') {
      g.moveTo(cx, layerY - layerH);
      g.lineTo(cx - layerW / 2, layerY);
      g.lineTo(cx + layerW / 2, layerY);
      g.closePath();
      g.stroke({ color: INK, width: 1.5 * s });
    }
  }

  container.addChild(g);
}

function drawOak(
  container: Container,
  x: number,
  y: number,
  s: number,
  distance: TreeDistance,
  lean: number,
  rand: () => number,
): void {
  const g = new Graphics();
  const trunkH = 18 * s;
  const trunkW = 6 * s;
  const crownW = 22 * s;
  const crownH = 16 * s;

  if (distance === 'distant') {
    // Wide, spread-out bump
    g.ellipse(x + lean * 0.3, y - trunkH - crownH * 0.3, crownW * 0.5, crownH * 0.5);
    g.fill(DEEP_FOREST);
    container.addChild(g);
    return;
  }

  // Thick trunk
  g.rect(x - trunkW / 2 + lean, y - trunkH, trunkW, trunkH);
  g.fill(BARK_BROWN);
  if (distance === 'near') {
    g.stroke({ color: INK, width: 2 * s });
    // Branch hints
    g.moveTo(x + lean, y - trunkH * 0.7);
    g.lineTo(x + lean - 8 * s, y - trunkH - 4 * s);
    g.stroke({ color: BARK_BROWN, width: 2 * s });
    g.moveTo(x + lean, y - trunkH * 0.6);
    g.lineTo(x + lean + 7 * s, y - trunkH - 2 * s);
    g.stroke({ color: BARK_BROWN, width: 2 * s });
  }

  // Wide spreading crown
  const crownCX = x + lean * 0.3;
  const crownCY = y - trunkH - crownH * 0.4;

  // Multiple overlapping ellipses for a spread-out look
  const blobs = distance === 'near' ? 4 : 2;
  for (let i = 0; i < blobs; i++) {
    const bx = crownCX + (rand() - 0.5) * crownW * 0.6;
    const by = crownCY + (rand() - 0.5) * crownH * 0.3;
    const bw = crownW * (0.4 + rand() * 0.25);
    const bh = crownH * (0.35 + rand() * 0.2);
    g.ellipse(bx, by, bw, bh);
    g.fill(i % 2 === 0 ? DEEP_FOREST : MID_GREEN);
  }

  if (distance === 'near') {
    // Outline around the overall crown
    g.ellipse(crownCX, crownCY, crownW * 0.55, crownH * 0.55);
    g.stroke({ color: INK, width: 2 * s });
  }

  container.addChild(g);
}

/**
 * Scatter trees along a hill layer.
 *
 * Args:
 *   startX: Left edge of the region
 *   endX: Right edge of the region
 *   getY: Function returning the hill top Y at a given X position
 *   distance: Detail level for the trees
 *   density: Trees per 100px
 *   seed: Random seed
 *
 * Returns:
 *   Container with all scattered trees
 */
export function scatterTrees(
  startX: number,
  endX: number,
  getY: (x: number) => number,
  distance: TreeDistance,
  density: number,
  seed: number,
): Container {
  const container = new Container();
  const rng = seededRandom(seed);
  const width = endX - startX;
  const count = Math.floor((width / 100) * density);
  const styles: TreeStyle[] = ['deciduous', 'pine', 'oak'];

  for (let i = 0; i < count; i++) {
    const tx = startX + rng() * width;
    const ty = getY(tx);
    const style = styles[Math.floor(rng() * styles.length)];
    const scale = distance === 'distant' ? 0.5 : distance === 'mid' ? 0.75 : 1.0;
    const tree = drawTree(tx, ty, style, distance, scale, rng);
    container.addChild(tree);
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

function darkenColor(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xFF) * (1 - amount)) | 0;
  const g = Math.max(0, ((color >> 8) & 0xFF) * (1 - amount)) | 0;
  const b = Math.max(0, (color & 0xFF) * (1 - amount)) | 0;
  return (r << 16) | (g << 8) | b;
}
