/**
 * drawStation.ts
 *
 * Programmatic station building and platform element drawers.
 * Architecture style varies by station size: grand, modest, rustic.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: /docs/STYLE_GUIDE.md, specs/PHASE_4_INTERIORS.md
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics, Text, TextStyle
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const INK = 0x1A1A2E;
const WARM_BRICK = 0xC45B3E;
const CREAM = 0xFDF6E3;
const WOOD_BROWN = 0x6B4226;
const RAIL_SILVER = 0x8C8C8C;
const LANTERN_ORANGE = 0xE8913A;
const COAL_DARK = 0x2E2E38;

/**
 * Draw a station building based on its architecture style.
 * Origin at bottom-center of the building.
 */
export function drawStationBuilding(
  style: 'grand' | 'modest' | 'rustic',
  name: string,
  scale = 1.0,
): Container {
  const container = new Container();
  const s = scale;

  switch (style) {
    case 'grand':
      drawGrandStation(container, name, s);
      break;
    case 'modest':
      drawModestStation(container, name, s);
      break;
    case 'rustic':
      drawRusticStation(container, name, s);
      break;
  }

  return container;
}

function drawGrandStation(container: Container, name: string, s: number): void {
  const g = new Graphics();
  const w = 300 * s;
  const h = 200 * s;

  // Main building body
  g.roundRect(-w / 2, -h, w, h, 4 * s);
  g.fill(WARM_BRICK);
  g.roundRect(-w / 2, -h, w, h, 4 * s);
  g.stroke({ color: INK, width: 2.5 * s });

  // Mortar lines
  for (let row = 0; row < 10; row++) {
    const y = -h + 15 * s + row * 18 * s;
    g.moveTo(-w / 2 + 5 * s, y);
    g.lineTo(w / 2 - 5 * s, y);
    g.stroke({ color: 0xA04A32, width: 0.5 * s, alpha: 0.3 });
  }

  // Arched windows (upper row)
  for (let i = 0; i < 5; i++) {
    const wx = -w / 2 + 30 * s + i * 55 * s;
    g.roundRect(wx, -h + 25 * s, 30 * s, 45 * s, 15 * s);
    g.fill(0xF4C542);
    g.stroke({ color: INK, width: 1.5 * s });
    // Cross frame
    g.moveTo(wx + 15 * s, -h + 25 * s);
    g.lineTo(wx + 15 * s, -h + 70 * s);
    g.stroke({ color: INK, width: 1 * s });
  }

  // Lower windows (rectangular)
  for (let i = 0; i < 4; i++) {
    const wx = -w / 2 + 45 * s + i * 60 * s;
    g.roundRect(wx, -h + 90 * s, 25 * s, 35 * s, 3 * s);
    g.fill(0xF4C542);
    g.stroke({ color: INK, width: 1.5 * s });
  }

  // Main entrance (large arch)
  g.roundRect(-25 * s, -h + 120 * s, 50 * s, 80 * s, 25 * s);
  g.fill(0x3A3530);
  g.stroke({ color: INK, width: 2 * s });
  // Door
  g.rect(-15 * s, -h + 150 * s, 30 * s, 50 * s);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1.5 * s });

  // Clock tower (center top)
  const towerW = 50 * s;
  const towerH = 70 * s;
  g.roundRect(-towerW / 2, -h - towerH, towerW, towerH, 3 * s);
  g.fill(WARM_BRICK);
  g.stroke({ color: INK, width: 2 * s });
  // Clock face
  g.circle(0, -h - towerH / 2, 16 * s);
  g.fill(CREAM);
  g.stroke({ color: INK, width: 2 * s });
  // Tower roof (pointed)
  g.moveTo(-towerW / 2 - 5 * s, -h - towerH);
  g.lineTo(0, -h - towerH - 25 * s);
  g.lineTo(towerW / 2 + 5 * s, -h - towerH);
  g.closePath();
  g.fill(0x8B4513);
  g.stroke({ color: INK, width: 2 * s });

  // Roof line
  g.rect(-w / 2 - 10 * s, -h - 5 * s, w + 20 * s, 8 * s);
  g.fill(0x8B4513);
  g.stroke({ color: INK, width: 1.5 * s });

  container.addChild(g);

  // Station name sign
  addNameSign(container, name, 0, -h + 110 * s, s, true);
}

function drawModestStation(container: Container, name: string, s: number): void {
  const g = new Graphics();
  const w = 220 * s;
  const h = 150 * s;

  // Main building
  g.roundRect(-w / 2, -h, w, h, 3 * s);
  g.fill(0xD4A843);
  g.roundRect(-w / 2, -h, w, h, 3 * s);
  g.stroke({ color: INK, width: 2 * s });

  // Roof (gabled)
  g.moveTo(-w / 2 - 15 * s, -h);
  g.lineTo(0, -h - 40 * s);
  g.lineTo(w / 2 + 15 * s, -h);
  g.closePath();
  g.fill(0x8B4513);
  g.stroke({ color: INK, width: 2 * s });

  // Windows
  for (let i = 0; i < 3; i++) {
    const wx = -w / 2 + 25 * s + i * 70 * s;
    g.roundRect(wx, -h + 30 * s, 35 * s, 40 * s, 3 * s);
    g.fill(0xF4C542);
    g.stroke({ color: INK, width: 1.5 * s });
    // Cross
    g.moveTo(wx + 17.5 * s, -h + 30 * s);
    g.lineTo(wx + 17.5 * s, -h + 70 * s);
    g.moveTo(wx, -h + 50 * s);
    g.lineTo(wx + 35 * s, -h + 50 * s);
    g.stroke({ color: INK, width: 1 * s });
  }

  // Door
  g.roundRect(-15 * s, -h + 90 * s, 30 * s, 60 * s, 3 * s);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1.5 * s });

  // Covered waiting area (awning extending toward platform)
  const awningW = w * 0.6;
  g.moveTo(w / 2, -h + 20 * s);
  g.lineTo(w / 2 + awningW, -h + 40 * s);
  g.lineTo(w / 2 + awningW, -h + 45 * s);
  g.lineTo(w / 2, -h + 25 * s);
  g.closePath();
  g.fill(0x8B4513);
  g.stroke({ color: INK, width: 1.5 * s });
  // Awning support posts
  g.rect(w / 2 + awningW - 5 * s, -h + 45 * s, 5 * s, h - 45 * s);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1 * s });

  container.addChild(g);

  addNameSign(container, name, 0, -h + 15 * s, s, false);
}

function drawRusticStation(container: Container, name: string, s: number): void {
  const g = new Graphics();
  const w = 140 * s;
  const h = 100 * s;

  // Wooden structure
  g.roundRect(-w / 2, -h, w, h, 2 * s);
  g.fill(WOOD_BROWN);
  g.roundRect(-w / 2, -h, w, h, 2 * s);
  g.stroke({ color: INK, width: 2 * s });

  // Wood plank lines
  for (let pi = 0; pi < 6; pi++) {
    const py = -h + 10 * s + pi * 15 * s;
    g.moveTo(-w / 2 + 3 * s, py);
    g.lineTo(w / 2 - 3 * s, py);
    g.stroke({ color: 0x5A3A1A, width: 0.5 * s });
  }

  // Roof (simple sloped)
  g.moveTo(-w / 2 - 15 * s, -h);
  g.lineTo(0, -h - 25 * s);
  g.lineTo(w / 2 + 15 * s, -h);
  g.closePath();
  g.fill(0x8B4513);
  g.stroke({ color: INK, width: 2 * s });

  // Single window
  g.roundRect(-15 * s, -h + 25 * s, 30 * s, 30 * s, 3 * s);
  g.fill(0xF4C542);
  g.stroke({ color: INK, width: 1.5 * s });

  // Door
  g.roundRect(20 * s, -h + 40 * s, 25 * s, 60 * s, 2 * s);
  g.fill(0x5A3A1A);
  g.stroke({ color: INK, width: 1.5 * s });

  // Bench outside
  g.rect(-w / 2 - 30 * s, -15 * s, 25 * s, 5 * s);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1 * s });
  // Bench legs
  g.rect(-w / 2 - 28 * s, -10 * s, 3 * s, 10 * s);
  g.rect(-w / 2 - 10 * s, -10 * s, 3 * s, 10 * s);
  g.fill(WOOD_BROWN);

  container.addChild(g);

  addNameSign(container, name, 0, -h - 30 * s, s, false);
}

function addNameSign(
  container: Container,
  name: string,
  x: number,
  y: number,
  s: number,
  isGrand: boolean,
): void {
  // Backing plate
  const bg = new Graphics();
  const textWidth = name.length * 10 * s + 30 * s;
  bg.roundRect(x - textWidth / 2, y - 12 * s, textWidth, 24 * s, 4 * s);
  bg.fill(isGrand ? CREAM : WOOD_BROWN);
  bg.stroke({ color: INK, width: 1.5 * s });
  container.addChild(bg);

  const style = new TextStyle({
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 14 * s,
    fill: isGrand ? INK : CREAM,
    fontWeight: '900',
  });
  const text = new Text({ text: name, style });
  text.anchor.set(0.5, 0.5);
  text.x = x;
  text.y = y;
  container.addChild(text);
}

// ===== PLATFORM ELEMENTS =====

/**
 * Draw platform elements: benches, lampposts, luggage carts,
 * safety line, and station clock.
 */
export function drawPlatformElements(
  stationSize: 'major_hub' | 'regional' | 'local',
  clockMinutes: number,
): Container {
  const container = new Container();

  const platformWidth = stationSize === 'major_hub' ? 800
    : stationSize === 'regional' ? 600
    : 400;

  // Platform surface
  const platform = new Graphics();
  platform.rect(0, 0, platformWidth, 40);
  platform.fill(0xBBAA90);
  platform.stroke({ color: INK, width: 2 });
  // Edge detail
  platform.rect(0, 35, platformWidth, 5);
  platform.fill(0x9A8A70);
  container.addChild(platform);

  // Yellow safety line along edge
  const safety = new Graphics();
  for (let sx = 10; sx < platformWidth - 10; sx += 20) {
    safety.rect(sx, 32, 12, 3);
    safety.fill(0xF4C542);
  }
  container.addChild(safety);

  // Benches
  const numBenches = stationSize === 'major_hub' ? 4 : stationSize === 'regional' ? 2 : 1;
  const benchSpacing = platformWidth / (numBenches + 1);
  for (let i = 0; i < numBenches; i++) {
    const bx = benchSpacing * (i + 1);
    drawBench(container, bx, 5);
  }

  // Lampposts
  const numLamps = stationSize === 'major_hub' ? 5 : stationSize === 'regional' ? 3 : 1;
  const lampSpacing = platformWidth / (numLamps + 1);
  for (let i = 0; i < numLamps; i++) {
    const lx = lampSpacing * (i + 1);
    drawLamppost(container, lx, 0);
  }

  // Luggage cart (for major and regional)
  if (stationSize !== 'local') {
    drawLuggageCart(container, platformWidth * 0.7, 10);
  }

  // Station clock
  if (stationSize !== 'local') {
    drawClockFace(container, platformWidth * 0.3, -60, clockMinutes);
  }

  return container;
}

function drawBench(container: Container, x: number, y: number): void {
  const g = new Graphics();
  // Seat
  g.roundRect(x - 20, y, 40, 6, 2);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1.5 });
  // Back
  g.roundRect(x - 18, y - 15, 36, 16, 2);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1 });
  // Legs
  g.rect(x - 18, y + 5, 3, 12);
  g.rect(x + 15, y + 5, 3, 12);
  g.fill(COAL_DARK);
  container.addChild(g);
}

function drawLamppost(container: Container, x: number, y: number): void {
  const g = new Graphics();
  // Pole
  g.rect(x - 2, y - 80, 4, 80);
  g.fill(COAL_DARK);
  g.stroke({ color: INK, width: 1 });
  // Lamp head
  g.roundRect(x - 8, y - 95, 16, 18, 3);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1 });
  // Light glow
  g.circle(x, y - 86, 5);
  g.fill(LANTERN_ORANGE);
  g.circle(x, y - 86, 14);
  g.fill({ color: LANTERN_ORANGE, alpha: 0.1 });
  container.addChild(g);
}

function drawLuggageCart(container: Container, x: number, y: number): void {
  const g = new Graphics();
  // Cart platform
  g.roundRect(x - 25, y, 50, 8, 2);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1 });
  // Wheels
  g.circle(x - 15, y + 12, 4);
  g.circle(x + 15, y + 12, 4);
  g.fill(COAL_DARK);
  g.stroke({ color: INK, width: 1 });
  // Handle
  g.rect(x + 22, y - 15, 3, 20);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });
  // Luggage on cart
  g.roundRect(x - 20, y - 12, 18, 12, 2);
  g.fill(0x8B6914);
  g.stroke({ color: INK, width: 1 });
  g.roundRect(x, y - 8, 14, 8, 2);
  g.fill(COAL_DARK);
  g.stroke({ color: INK, width: 1 });
  container.addChild(g);
}

function drawClockFace(container: Container, x: number, y: number, minutes: number): void {
  const g = new Graphics();
  const radius = 20;

  // Post
  g.rect(x - 3, y, 6, 60);
  g.fill(COAL_DARK);
  g.stroke({ color: INK, width: 1 });

  // Clock face
  g.circle(x, y, radius);
  g.fill(CREAM);
  g.stroke({ color: INK, width: 2 });

  // Hour markers
  for (let h = 0; h < 12; h++) {
    const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = radius - 4;
    const outer = radius - 1;
    g.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    g.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    g.stroke({ color: INK, width: 1.5 });
  }

  // Hour hand
  const totalMinutes = minutes % (12 * 60);
  const hourAngle = (totalMinutes / (12 * 60)) * Math.PI * 2 - Math.PI / 2;
  g.moveTo(x, y);
  g.lineTo(x + Math.cos(hourAngle) * (radius * 0.5), y + Math.sin(hourAngle) * (radius * 0.5));
  g.stroke({ color: INK, width: 2 });

  // Minute hand
  const minAngle = ((minutes % 60) / 60) * Math.PI * 2 - Math.PI / 2;
  g.moveTo(x, y);
  g.lineTo(x + Math.cos(minAngle) * (radius * 0.7), y + Math.sin(minAngle) * (radius * 0.7));
  g.stroke({ color: INK, width: 1.5 });

  // Center dot
  g.circle(x, y, 2);
  g.fill(INK);

  container.addChild(g);
}
