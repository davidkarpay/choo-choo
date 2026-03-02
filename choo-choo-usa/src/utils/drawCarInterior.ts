/**
 * drawCarInterior.ts
 *
 * Functions to draw cutaway train car interiors as composable PixiJS
 * Containers. Each car type returns a Container sized CAR_WIDTH x CAR_HEIGHT
 * with interactive elements for click-to-inspect.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: /docs/STYLE_GUIDE.md, specs/PHASE_4_INTERIORS.md
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics, Text, TextStyle
 *   - drawCharacter: passenger rendering
 *   - drawWorker: worker rendering
 *   - animation: hexToNumber
 *   - cargo types
 *   - passenger types
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { drawCharacter, activityToPose } from './drawCharacter';
import { drawWorker } from './drawWorker';
import { hexToNumber } from './animation';
import type { Passenger } from '../types/passenger';
import type { CargoShipment, CargoType } from '../types/cargo';

// -- Layout constants --
export const CAR_WIDTH = 400;
export const CAR_HEIGHT = 250;
export const COUPLING_WIDTH = 20;

const INK = 0x1A1A2E;
const CREAM = 0xFDF6E3;
const RAIL_SILVER = 0x8C8C8C;
const COAL_DARK = 0x2E2E38;
const LANTERN_ORANGE = 0xE8913A;
const WARM_BRICK = 0xC45B3E;
const WOOD_BROWN = 0x6B4226;

export interface InteractiveElement {
  container: Container;
  type: 'passenger' | 'cargo' | 'worker';
  data: Passenger | CargoShipment | { role: string };
}

export interface CarInteriorResult {
  container: Container;
  interactiveElements: InteractiveElement[];
  windows: Graphics[];
}

/** Map cargo type to visual car type for interior rendering. */
export function cargoToVisualType(cargoType: CargoType): 'boxcar' | 'tanker' | 'flatcar' | 'hopper' {
  switch (cargoType) {
    case 'fuel':
    case 'chemicals':
      return 'tanker';
    case 'automobiles':
    case 'lumber':
    case 'steel':
      return 'flatcar';
    case 'coal':
      return 'hopper';
    default:
      return 'boxcar';
  }
}

// ===== SHARED SHELL =====

function drawCarShell(
  width: number,
  height: number,
  roofStyle: 'arched' | 'flat' | 'none' = 'arched',
): { shell: Container; floorY: number; ceilingY: number } {
  const shell = new Container();
  const g = new Graphics();

  const x = 0;
  const y = 0;
  const floorY = y + height - 30;
  const ceilingY = y + 20;

  // Back wall
  g.rect(x, y, width, height);
  g.fill(0xD4C4A0);
  g.stroke({ color: INK, width: 2 });

  // Floor
  g.rect(x, floorY, width, 20);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 1.5 });

  // Floor planks
  for (let px = x + 20; px < x + width; px += 30) {
    g.moveTo(px, floorY);
    g.lineTo(px, floorY + 20);
    g.stroke({ color: 0x5A3A1A, width: 0.5 });
  }

  // Roof
  if (roofStyle === 'arched') {
    g.moveTo(x, ceilingY);
    g.quadraticCurveTo(x + width / 2, y - 10, x + width, ceilingY);
    g.lineTo(x + width, ceilingY + 5);
    g.quadraticCurveTo(x + width / 2, y - 5, x, ceilingY + 5);
    g.closePath();
    g.fill(0x8B4513);
    g.stroke({ color: INK, width: 2 });
  } else if (roofStyle === 'flat') {
    g.rect(x - 5, y, width + 10, ceilingY - y + 5);
    g.fill(COAL_DARK);
    g.stroke({ color: INK, width: 2 });
  }

  // Wheels (3 per side, visible below floor)
  const wheelY = y + height - 5;
  const wheelR = 8;
  const wheelPositions = [x + 40, x + width / 2, x + width - 40];
  for (const wx of wheelPositions) {
    g.circle(wx, wheelY, wheelR);
    g.fill(COAL_DARK);
    g.stroke({ color: INK, width: 1.5 });
    g.circle(wx, wheelY, wheelR - 2);
    g.stroke({ color: RAIL_SILVER, width: 1 });
    g.circle(wx, wheelY, 2);
    g.fill(RAIL_SILVER);
  }

  // Couplings on both ends
  g.rect(x - COUPLING_WIDTH, floorY - 5, COUPLING_WIDTH, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });
  g.rect(x + width, floorY - 5, COUPLING_WIDTH, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });

  shell.addChild(g);
  return { shell, floorY, ceilingY };
}

function drawWindow(
  container: Container,
  x: number,
  y: number,
  w: number,
  h: number,
): Graphics {
  const win = new Graphics();
  win.roundRect(x, y, w, h, 4);
  win.fill(0x87CEEB);
  win.roundRect(x, y, w, h, 4);
  win.stroke({ color: INK, width: 2 });
  // Cross frame
  win.moveTo(x + w / 2, y);
  win.lineTo(x + w / 2, y + h);
  win.moveTo(x, y + h / 2);
  win.lineTo(x + w, y + h / 2);
  win.stroke({ color: INK, width: 1 });
  container.addChild(win);
  return win;
}

// ===== LOCOMOTIVE CAB =====

export function drawLocomotiveCab(
  trainColors: { primary: string; secondary: string; accent: string },
  trainType: 'steam' | 'diesel',
): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];
  const windows: Graphics[] = [];

  const { shell, floorY, ceilingY } = drawCarShell(CAR_WIDTH, CAR_HEIGHT, 'flat');
  container.addChild(shell);

  const primary = hexToNumber(trainColors.primary);
  const secondary = hexToNumber(trainColors.secondary);

  // Paint interior walls with secondary color
  const wall = new Graphics();
  wall.rect(10, ceilingY + 5, CAR_WIDTH - 20, floorY - ceilingY - 5);
  wall.fill({ color: secondary, alpha: 0.3 });
  container.addChild(wall);

  // Front window (looking ahead)
  const fw = drawWindow(container, CAR_WIDTH - 80, ceilingY + 15, 60, 50);
  windows.push(fw);

  // Side windows
  const sw1 = drawWindow(container, 20, ceilingY + 15, 40, 40);
  windows.push(sw1);

  if (trainType === 'steam') {
    // Firebox on the left
    const firebox = new Graphics();
    firebox.roundRect(30, floorY - 80, 60, 60, 5);
    firebox.fill(0x3A3530);
    firebox.stroke({ color: INK, width: 2 });
    // Glow
    firebox.roundRect(35, floorY - 75, 50, 45, 3);
    firebox.fill(0xE85A00);
    // Embers
    firebox.roundRect(35, floorY - 75, 50, 45, 3);
    firebox.fill({ color: 0xFF4500, alpha: 0.6 });
    // Door frame
    firebox.roundRect(40, floorY - 70, 40, 35, 2);
    firebox.stroke({ color: 0xE8913A, width: 2 });
    container.addChild(firebox);

    // Gauges (right side above controls)
    for (let gi = 0; gi < 3; gi++) {
      const gx = CAR_WIDTH - 160 + gi * 40;
      const gauge = new Graphics();
      gauge.circle(gx, ceilingY + 50, 14);
      gauge.fill(CREAM);
      gauge.stroke({ color: INK, width: 2 });
      // Needle
      const angle = -Math.PI / 4 + (gi / 2) * Math.PI / 2;
      gauge.moveTo(gx, ceilingY + 50);
      gauge.lineTo(gx + Math.cos(angle) * 10, ceilingY + 50 + Math.sin(angle) * 10);
      gauge.stroke({ color: 0xD64045, width: 1.5 });
      container.addChild(gauge);
    }

    // Throttle lever
    const throttle = new Graphics();
    throttle.rect(CAR_WIDTH - 120, floorY - 60, 8, 50);
    throttle.fill(RAIL_SILVER);
    throttle.stroke({ color: INK, width: 1.5 });
    throttle.circle(CAR_WIDTH - 116, floorY - 60, 6);
    throttle.fill(0xD64045);
    container.addChild(throttle);

    // Engineer
    const engineer = drawWorker('engineer', 0.7);
    engineer.x = CAR_WIDTH - 100;
    engineer.y = floorY;
    engineer.eventMode = 'static';
    engineer.cursor = 'pointer';
    container.addChild(engineer);
    interactiveElements.push({ container: engineer, type: 'worker', data: { role: 'engineer' } });

    // Fireman
    const fireman = drawWorker('fireman', 0.7);
    fireman.x = 80;
    fireman.y = floorY;
    fireman.eventMode = 'static';
    fireman.cursor = 'pointer';
    container.addChild(fireman);
    interactiveElements.push({ container: fireman, type: 'worker', data: { role: 'fireman' } });
  } else {
    // Diesel: control panel across front wall
    const panel = new Graphics();
    panel.roundRect(CAR_WIDTH - 200, floorY - 90, 180, 70, 4);
    panel.fill(0x3A3530);
    panel.stroke({ color: INK, width: 2 });
    // Instrument row
    for (let gi = 0; gi < 5; gi++) {
      panel.circle(CAR_WIDTH - 180 + gi * 35, floorY - 60, 10);
      panel.fill(CREAM);
      panel.stroke({ color: INK, width: 1.5 });
    }
    container.addChild(panel);

    const engineer = drawWorker('engineer', 0.7);
    engineer.x = CAR_WIDTH - 120;
    engineer.y = floorY;
    engineer.eventMode = 'static';
    engineer.cursor = 'pointer';
    container.addChild(engineer);
    interactiveElements.push({ container: engineer, type: 'worker', data: { role: 'engineer' } });
  }

  return { container, interactiveElements, windows };
}

// ===== PASSENGER COACH =====

export function drawPassengerCoach(passengers: Passenger[]): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];
  const windows: Graphics[] = [];

  const { shell, floorY, ceilingY } = drawCarShell(CAR_WIDTH, CAR_HEIGHT);
  container.addChild(shell);

  // Aisle runner
  const aisle = new Graphics();
  aisle.rect(20, floorY - 2, CAR_WIDTH - 40, 2);
  aisle.fill(0xD64045);
  container.addChild(aisle);

  // Ceiling lights
  for (let li = 0; li < 4; li++) {
    const lx = 60 + li * 90;
    const light = new Graphics();
    light.roundRect(lx - 6, ceilingY + 6, 12, 8, 2);
    light.fill(0xF4C542);
    light.circle(lx, ceilingY + 18, 12);
    light.fill({ color: LANTERN_ORANGE, alpha: 0.1 });
    container.addChild(light);
  }

  // Windows and seats
  const seatSpacing = 70;
  const numSeats = Math.min(5, Math.max(3, Math.ceil(CAR_WIDTH / seatSpacing) - 1));

  for (let i = 0; i < numSeats; i++) {
    const sx = 40 + i * seatSpacing;

    // Window
    const w = drawWindow(container, sx - 5, ceilingY + 20, 35, 40);
    windows.push(w);

    // Seat (simple rounded rectangle)
    const seat = new Graphics();
    seat.roundRect(sx - 2, floorY - 30, 30, 20, 4);
    seat.fill(WARM_BRICK);
    seat.stroke({ color: INK, width: 1.5 });
    // Seat back
    seat.roundRect(sx - 2, floorY - 50, 30, 22, 4);
    seat.fill(WARM_BRICK);
    seat.stroke({ color: INK, width: 1 });
    container.addChild(seat);

    // Place passenger if available
    if (i < passengers.length) {
      const p = passengers[i];
      const pose = activityToPose(p.activity);
      const charContainer = drawCharacter({
        appearance: p.appearance,
        pose,
        scale: 0.55,
      });
      charContainer.x = sx + 14;
      charContainer.y = floorY - 10;
      charContainer.eventMode = 'static';
      charContainer.cursor = 'pointer';
      container.addChild(charContainer);
      interactiveElements.push({ container: charContainer, type: 'passenger', data: p });
    }
  }

  return { container, interactiveElements, windows };
}

// ===== DINING CAR =====

export function drawDiningCar(passengers: Passenger[]): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];
  const windows: Graphics[] = [];

  const { shell, floorY, ceilingY } = drawCarShell(CAR_WIDTH, CAR_HEIGHT);
  container.addChild(shell);

  // Tables with tablecloths
  const tablePositions = [60, 170, 280];
  for (let ti = 0; ti < tablePositions.length; ti++) {
    const tx = tablePositions[ti];

    // Window behind table
    const w = drawWindow(container, tx + 5, ceilingY + 20, 35, 40);
    windows.push(w);

    // Table
    const table = new Graphics();
    // Tablecloth (white with slight drape)
    table.roundRect(tx, floorY - 35, 50, 25, 3);
    table.fill(0xF0EDE4);
    table.stroke({ color: INK, width: 1.5 });
    // Table surface
    table.rect(tx + 2, floorY - 35, 46, 3);
    table.fill(WOOD_BROWN);
    // Table leg
    table.rect(tx + 22, floorY - 12, 6, 12);
    table.fill(WOOD_BROWN);
    table.stroke({ color: INK, width: 1 });
    container.addChild(table);

    // Plates on table
    const plate = new Graphics();
    plate.circle(tx + 15, floorY - 38, 5);
    plate.fill(0xFDF6E3);
    plate.stroke({ color: INK, width: 0.5 });
    plate.circle(tx + 35, floorY - 38, 5);
    plate.fill(0xFDF6E3);
    plate.stroke({ color: INK, width: 0.5 });
    container.addChild(plate);

    // Seated passengers
    if (ti < passengers.length) {
      const p = passengers[ti];
      const charContainer = drawCharacter({
        appearance: p.appearance,
        pose: 'eating',
        scale: 0.5,
      });
      charContainer.x = tx + 10;
      charContainer.y = floorY;
      charContainer.eventMode = 'static';
      charContainer.cursor = 'pointer';
      container.addChild(charContainer);
      interactiveElements.push({ container: charContainer, type: 'passenger', data: p });
    }
  }

  // Kitchen area on the right
  const kitchen = new Graphics();
  kitchen.roundRect(CAR_WIDTH - 80, ceilingY + 10, 65, floorY - ceilingY - 15, 3);
  kitchen.fill({ color: 0x3A3530, alpha: 0.5 });
  kitchen.stroke({ color: INK, width: 1.5 });
  container.addChild(kitchen);

  // Cook
  const cook = drawWorker('cook', 0.6);
  cook.x = CAR_WIDTH - 50;
  cook.y = floorY;
  cook.eventMode = 'static';
  cook.cursor = 'pointer';
  container.addChild(cook);
  interactiveElements.push({ container: cook, type: 'worker', data: { role: 'cook' } });

  // Waiter in aisle
  const waiter = drawWorker('waiter', 0.55);
  waiter.x = 140;
  waiter.y = floorY;
  waiter.eventMode = 'static';
  waiter.cursor = 'pointer';
  container.addChild(waiter);
  interactiveElements.push({ container: waiter, type: 'worker', data: { role: 'waiter' } });

  return { container, interactiveElements, windows };
}

// ===== SLEEPER CAR =====

export function drawSleeperCar(passengers: Passenger[]): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];
  const windows: Graphics[] = [];

  const { shell, floorY, ceilingY } = drawCarShell(CAR_WIDTH, CAR_HEIGHT);
  container.addChild(shell);

  // Dim blue interior overlay for nighttime feel
  const dim = new Graphics();
  dim.rect(0, 0, CAR_WIDTH, CAR_HEIGHT);
  dim.fill({ color: 0x1B3A5C, alpha: 0.15 });
  container.addChild(dim);

  // Bunks along the wall
  const bunkSpacing = 80;
  const numBunks = Math.min(4, Math.ceil(CAR_WIDTH / bunkSpacing));

  for (let i = 0; i < numBunks; i++) {
    const bx = 30 + i * bunkSpacing;

    // Small window with curtain partially drawn
    const w = drawWindow(container, bx + 5, ceilingY + 15, 30, 30);
    windows.push(w);
    // Curtain
    const curtain = new Graphics();
    curtain.rect(bx + 5, ceilingY + 15, 15, 30);
    curtain.fill({ color: 0x1B3A5C, alpha: 0.6 });
    container.addChild(curtain);

    // Lower bunk
    const bunk = new Graphics();
    bunk.roundRect(bx, floorY - 35, 60, 8, 2);
    bunk.fill(WOOD_BROWN);
    bunk.stroke({ color: INK, width: 1.5 });
    // Mattress
    bunk.roundRect(bx + 2, floorY - 42, 56, 8, 2);
    bunk.fill(0xF0EDE4);
    bunk.stroke({ color: INK, width: 1 });
    // Pillow
    bunk.roundRect(bx + 2, floorY - 45, 14, 5, 3);
    bunk.fill(0xF0EDE4);
    container.addChild(bunk);

    // Upper bunk
    const upper = new Graphics();
    upper.roundRect(bx, floorY - 80, 60, 8, 2);
    upper.fill(WOOD_BROWN);
    upper.stroke({ color: INK, width: 1.5 });
    upper.roundRect(bx + 2, floorY - 87, 56, 8, 2);
    upper.fill(0xF0EDE4);
    upper.stroke({ color: INK, width: 1 });
    container.addChild(upper);

    // Warm reading lamp
    const lamp = new Graphics();
    lamp.circle(bx + 55, floorY - 50, 4);
    lamp.fill(LANTERN_ORANGE);
    lamp.circle(bx + 55, floorY - 50, 10);
    lamp.fill({ color: LANTERN_ORANGE, alpha: 0.1 });
    container.addChild(lamp);

    // Passenger on lower bunk
    if (i < passengers.length) {
      const p = passengers[i];
      const charContainer = drawCharacter({
        appearance: p.appearance,
        pose: 'sleeping_sitting',
        scale: 0.45,
      });
      charContainer.x = bx + 30;
      charContainer.y = floorY - 18;
      charContainer.eventMode = 'static';
      charContainer.cursor = 'pointer';
      container.addChild(charContainer);
      interactiveElements.push({ container: charContainer, type: 'passenger', data: p });
    }
  }

  return { container, interactiveElements, windows };
}

// ===== BOXCAR =====

export function drawBoxcar(cargo: CargoShipment[]): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];

  const { shell, floorY, ceilingY } = drawCarShell(CAR_WIDTH, CAR_HEIGHT, 'flat');
  container.addChild(shell);

  // Cargo items
  const cargoX = 30;
  const maxItems = Math.min(cargo.length, 4);

  for (let i = 0; i < maxItems; i++) {
    const c = cargo[i];
    const cx = cargoX + i * 85;

    const item = new Container();
    item.eventMode = 'static';
    item.cursor = 'pointer';

    const itemG = new Graphics();

    // Draw different shapes based on cargo type
    switch (c.type) {
      case 'grain':
      case 'produce':
        // Sacks
        for (let si = 0; si < 3; si++) {
          itemG.roundRect(cx + si * 15, floorY - 30 - si * 12, 25, 20, 5);
          itemG.fill(0xD4A843);
          itemG.stroke({ color: INK, width: 1.5 });
        }
        break;
      case 'packages':
        // Stacked boxes
        for (let bi = 0; bi < 3; bi++) {
          for (let bj = 0; bj < 2 - bi; bj++) {
            itemG.roundRect(cx + bj * 28, floorY - 30 - bi * 22, 25, 20, 2);
            itemG.fill(WARM_BRICK);
            itemG.stroke({ color: INK, width: 1.5 });
          }
        }
        break;
      default:
        // Crates
        for (let ci = 0; ci < 2; ci++) {
          itemG.roundRect(cx + ci * 30, floorY - 40, 28, 30, 2);
          itemG.fill(WOOD_BROWN);
          itemG.stroke({ color: INK, width: 1.5 });
          // Cross strapping
          itemG.moveTo(cx + ci * 30, floorY - 40);
          itemG.lineTo(cx + ci * 30 + 28, floorY - 10);
          itemG.moveTo(cx + ci * 30 + 28, floorY - 40);
          itemG.lineTo(cx + ci * 30, floorY - 10);
          itemG.stroke({ color: INK, width: 0.5 });
        }
    }

    item.addChild(itemG);

    // Label
    const label = cargoLabel(c);
    const labelStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 8,
      fill: INK,
      fontWeight: '700',
    });
    const labelText = new Text({ text: label, style: labelStyle });
    labelText.anchor.set(0.5, 0);
    labelText.x = cx + 25;
    labelText.y = floorY - 52;
    item.addChild(labelText);

    container.addChild(item);
    interactiveElements.push({ container: item, type: 'cargo', data: c });
  }

  // Manifest clipboard on wall (right side)
  const clipboard = new Graphics();
  clipboard.roundRect(CAR_WIDTH - 55, ceilingY + 30, 35, 45, 3);
  clipboard.fill(CREAM);
  clipboard.stroke({ color: INK, width: 1.5 });
  // Lines on clipboard
  for (let li = 0; li < 5; li++) {
    clipboard.moveTo(CAR_WIDTH - 50, ceilingY + 42 + li * 7);
    clipboard.lineTo(CAR_WIDTH - 25, ceilingY + 42 + li * 7);
    clipboard.stroke({ color: RAIL_SILVER, width: 0.5 });
  }
  // Clip at top
  clipboard.roundRect(CAR_WIDTH - 48, ceilingY + 27, 16, 6, 2);
  clipboard.fill(RAIL_SILVER);
  clipboard.stroke({ color: INK, width: 1 });
  container.addChild(clipboard);

  return { container, interactiveElements, windows: [] };
}

// ===== TANKER (EXTERIOR ONLY) =====

export function drawTankerExterior(cargo: CargoShipment | null): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];

  // Tanker body (cylindrical shape)
  const g = new Graphics();

  // Chassis / underframe
  g.rect(0, CAR_HEIGHT - 35, CAR_WIDTH, 10);
  g.fill(COAL_DARK);
  g.stroke({ color: INK, width: 1.5 });

  // Tank body (ellipse approximation)
  g.roundRect(20, 40, CAR_WIDTH - 40, CAR_HEIGHT - 90, 40);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 2.5 });

  // Rivet lines
  g.moveTo(30, 65);
  g.lineTo(CAR_WIDTH - 30, 65);
  g.moveTo(30, CAR_HEIGHT - 65);
  g.lineTo(CAR_WIDTH - 30, CAR_HEIGHT - 65);
  g.stroke({ color: 0x7A7A7A, width: 1 });

  // Dome on top
  g.roundRect(CAR_WIDTH / 2 - 20, 25, 40, 20, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1.5 });

  // Wheels
  const wheelY = CAR_HEIGHT - 10;
  for (const wx of [50, CAR_WIDTH / 2, CAR_WIDTH - 50]) {
    g.circle(wx, wheelY, 8);
    g.fill(COAL_DARK);
    g.stroke({ color: INK, width: 1.5 });
    g.circle(wx, wheelY, 5);
    g.stroke({ color: RAIL_SILVER, width: 1 });
    g.circle(wx, wheelY, 2);
    g.fill(RAIL_SILVER);
  }

  // Couplings
  g.rect(-COUPLING_WIDTH, CAR_HEIGHT - 35, COUPLING_WIDTH, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });
  g.rect(CAR_WIDTH, CAR_HEIGHT - 35, COUPLING_WIDTH, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });

  container.addChild(g);

  // Stenciled text
  const cargoLabel = cargo ? cargo.type.toUpperCase() : 'FUEL';
  const stencilStyle = new TextStyle({
    fontFamily: 'Fira Mono, Courier New, monospace',
    fontSize: 18,
    fill: INK,
    fontWeight: '400',
    letterSpacing: 4,
  });
  const stencil = new Text({ text: cargoLabel, style: stencilStyle });
  stencil.anchor.set(0.5, 0.5);
  stencil.x = CAR_WIDTH / 2;
  stencil.y = CAR_HEIGHT / 2 - 5;
  container.addChild(stencil);

  if (cargo) {
    const clickTarget = new Graphics();
    clickTarget.rect(20, 40, CAR_WIDTH - 40, CAR_HEIGHT - 90);
    clickTarget.fill({ color: 0xFFFFFF, alpha: 0.001 });
    clickTarget.eventMode = 'static';
    clickTarget.cursor = 'pointer';
    container.addChild(clickTarget);
    interactiveElements.push({ container: clickTarget, type: 'cargo', data: cargo });
  }

  return { container, interactiveElements, windows: [] };
}

// ===== FLATCAR =====

export function drawFlatcar(cargo: CargoShipment[]): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];

  // Flat platform
  const g = new Graphics();
  const platformY = CAR_HEIGHT - 50;

  // Platform bed
  g.rect(0, platformY, CAR_WIDTH, 15);
  g.fill(WOOD_BROWN);
  g.stroke({ color: INK, width: 2 });

  // Side stakes
  for (const sx of [5, CAR_WIDTH - 10]) {
    g.rect(sx, platformY - 40, 5, 40);
    g.fill(RAIL_SILVER);
    g.stroke({ color: INK, width: 1 });
  }

  // Wheels
  const wheelY = CAR_HEIGHT - 10;
  for (const wx of [50, CAR_WIDTH / 2, CAR_WIDTH - 50]) {
    g.circle(wx, wheelY, 8);
    g.fill(COAL_DARK);
    g.stroke({ color: INK, width: 1.5 });
    g.circle(wx, wheelY, 5);
    g.stroke({ color: RAIL_SILVER, width: 1 });
  }

  // Couplings
  g.rect(-COUPLING_WIDTH, platformY + 3, COUPLING_WIDTH, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });
  g.rect(CAR_WIDTH, platformY + 3, COUPLING_WIDTH, 10);
  g.fill(RAIL_SILVER);
  g.stroke({ color: INK, width: 1 });

  container.addChild(g);

  // Cargo on top
  const maxItems = Math.min(cargo.length, 3);
  for (let i = 0; i < maxItems; i++) {
    const c = cargo[i];
    const cx = 30 + i * 120;
    const item = new Container();
    item.eventMode = 'static';
    item.cursor = 'pointer';

    const itemG = new Graphics();

    switch (c.type) {
      case 'automobiles':
        // Simple car silhouette
        itemG.roundRect(cx, platformY - 30, 60, 20, 4);
        itemG.fill(0x5B98B5);
        itemG.stroke({ color: INK, width: 1.5 });
        // Windshield
        itemG.roundRect(cx + 35, platformY - 30, 20, 12, 2);
        itemG.fill(0x87CEEB);
        itemG.stroke({ color: INK, width: 1 });
        // Wheels
        itemG.circle(cx + 12, platformY - 8, 5);
        itemG.circle(cx + 48, platformY - 8, 5);
        itemG.fill(COAL_DARK);
        break;
      case 'lumber':
        // Stacked logs
        for (let li = 0; li < 4; li++) {
          for (let lj = 0; lj < 3 - li; lj++) {
            itemG.roundRect(cx, platformY - 15 - li * 12 + lj * 0, 80, 10, 4);
            itemG.fill(0x8B6914);
            itemG.stroke({ color: INK, width: 1 });
          }
        }
        break;
      case 'steel':
        // Steel coils
        itemG.circle(cx + 25, platformY - 25, 18);
        itemG.fill(RAIL_SILVER);
        itemG.stroke({ color: INK, width: 2 });
        itemG.circle(cx + 25, platformY - 25, 8);
        itemG.fill(0xD4C4A0);
        break;
      default:
        // Generic container
        itemG.roundRect(cx, platformY - 40, 80, 35, 3);
        itemG.fill(WARM_BRICK);
        itemG.stroke({ color: INK, width: 2 });
    }

    // Tie-down straps
    itemG.moveTo(cx, platformY);
    itemG.lineTo(cx + 40, platformY - 40);
    itemG.stroke({ color: 0xD4A843, width: 1 });

    item.addChild(itemG);
    container.addChild(item);
    interactiveElements.push({ container: item, type: 'cargo', data: c });
  }

  return { container, interactiveElements, windows: [] };
}

// ===== CABOOSE =====

export function drawCaboose(trainName: string): CarInteriorResult {
  const container = new Container();
  const interactiveElements: InteractiveElement[] = [];
  const windows: Graphics[] = [];

  const { shell, floorY, ceilingY } = drawCarShell(CAR_WIDTH * 0.75, CAR_HEIGHT);
  container.addChild(shell);
  const w = CAR_WIDTH * 0.75;

  // Paint interior warm red
  const wall = new Graphics();
  wall.rect(10, ceilingY + 5, w - 20, floorY - ceilingY - 5);
  wall.fill({ color: 0xD64045, alpha: 0.15 });
  container.addChild(wall);

  // Rear window (looking backward)
  const rw = drawWindow(container, 15, ceilingY + 15, 40, 40);
  windows.push(rw);

  // Side window
  const sw = drawWindow(container, w - 60, ceilingY + 15, 40, 40);
  windows.push(sw);

  // Desk
  const desk = new Graphics();
  desk.roundRect(w / 2 - 30, floorY - 35, 60, 25, 3);
  desk.fill(WOOD_BROWN);
  desk.stroke({ color: INK, width: 1.5 });
  // Logbook on desk
  desk.roundRect(w / 2 - 15, floorY - 42, 25, 15, 2);
  desk.fill(0x8B6914);
  desk.stroke({ color: INK, width: 1 });
  // Pen
  desk.moveTo(w / 2 + 12, floorY - 38);
  desk.lineTo(w / 2 + 18, floorY - 44);
  desk.stroke({ color: INK, width: 1 });
  container.addChild(desk);

  // Stove (left side)
  const stove = new Graphics();
  stove.roundRect(70, floorY - 45, 25, 35, 3);
  stove.fill(0x2E2E38);
  stove.stroke({ color: INK, width: 1.5 });
  // Stovepipe
  stove.rect(78, floorY - 65, 8, 20);
  stove.fill(0x2E2E38);
  stove.stroke({ color: INK, width: 1 });
  // Glow
  stove.roundRect(73, floorY - 30, 18, 10, 2);
  stove.fill({ color: LANTERN_ORANGE, alpha: 0.5 });
  container.addChild(stove);

  // Lantern hanging
  const lantern = new Graphics();
  lantern.moveTo(w / 2, ceilingY + 5);
  lantern.lineTo(w / 2, ceilingY + 20);
  lantern.stroke({ color: RAIL_SILVER, width: 1 });
  lantern.roundRect(w / 2 - 5, ceilingY + 20, 10, 14, 2);
  lantern.fill(WOOD_BROWN);
  lantern.stroke({ color: INK, width: 1 });
  lantern.circle(w / 2, ceilingY + 27, 4);
  lantern.fill(LANTERN_ORANGE);
  lantern.circle(w / 2, ceilingY + 27, 10);
  lantern.fill({ color: LANTERN_ORANGE, alpha: 0.1 });
  container.addChild(lantern);

  // Conductor at desk
  const conductor = drawWorker('conductor', 0.65);
  conductor.x = w / 2;
  conductor.y = floorY;
  conductor.eventMode = 'static';
  conductor.cursor = 'pointer';
  container.addChild(conductor);
  interactiveElements.push({ container: conductor, type: 'worker', data: { role: 'conductor' } });

  // Train name painted on interior wall
  const nameStyle = new TextStyle({
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 12,
    fill: 0xFDF6E3,
    fontWeight: '700',
    fontStyle: 'italic',
  });
  const nameText = new Text({ text: trainName, style: nameStyle });
  nameText.anchor.set(0.5, 0.5);
  nameText.x = w / 2;
  nameText.y = ceilingY + 70;
  container.addChild(nameText);

  return { container, interactiveElements, windows };
}

// ===== HELPERS =====

function cargoLabel(c: CargoShipment): string {
  const labels: Record<string, string> = {
    coal: 'COAL',
    grain: 'GRAIN',
    produce: 'FRESH PRODUCE',
    livestock: 'LIVESTOCK',
    automobiles: 'AUTOMOBILES',
    steel: 'STEEL',
    fuel: 'FUEL',
    chemicals: 'CHEMICALS',
    lumber: 'LUMBER',
    packages: 'PACKAGES',
  };
  return labels[c.type] ?? c.type.toUpperCase();
}
