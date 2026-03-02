/**
 * drawTrain.ts
 *
 * Programmatic locomotive rendering using PixiJS Graphics. Draws recognizable
 * steam and diesel locomotive profiles with proper anatomical parts: boiler,
 * smokestack, domes, cab, tender (steam) or hoods, cab, trucks (diesel).
 *
 * Each train's silhouette is driven by config from trainSilhouettes.ts, giving
 * each engine a distinct wheel arrangement and body proportion. The Disney-warm
 * style uses bold ink outlines, rounded shapes, exaggerated smokestacks, and
 * warm colors.
 *
 * Part of: Choo-Choo USA
 * See: docs/STYLE_GUIDE.md for visual guidelines
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics, Text, TextStyle
 *   - trainSilhouettes.ts: per-train config
 *   - animation.ts: hexToNumber utility
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { hexToNumber } from '../../utils/animation';
import { getSilhouette } from './trainSilhouettes';
import type { SteamSilhouette, DieselSilhouette } from './trainSilhouettes';

const INK = 0x1A1A2E;
const RAIL_SILVER = 0x8C8C8C;
const COAL_DARK = 0x2E2E38;
const LANTERN_ORANGE = 0xE8913A;
const SUNRISE_GOLD = 0xF4C542;
const CREAM = 0xFDF6E3;

interface TrainColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Structured return from drawTrain, providing access to animatable parts.
 */
export interface TrainSprite {
  /** The root container — set .x, .y, .rotation on this */
  container: Container;
  /** Individual wheel Graphics for rotation animation */
  wheels: Graphics[];
  /** Connecting rod between drive wheels (steam only) */
  connectingRod: Graphics | null;
  /** Where smoke should emit from, relative to container origin */
  smokeOrigin: { x: number; y: number };
  /** Total pixel width of the locomotive (for layout) */
  length: number;
}

/**
 * Create a programmatic train sprite facing right.
 *
 * The container origin is at the bottom-center of the locomotive body
 * (at wheel level). The tender extends to the right of center for steam.
 *
 * Args:
 *   name: Display name for the locomotive
 *   colors: Primary, secondary, accent hex color strings
 *   type: 'steam' or 'diesel'
 *   scale: Multiplier for all dimensions (default 1.0)
 *   trainId: Optional train ID for per-train silhouette lookup
 *
 * Returns:
 *   TrainSprite with container and animatable part references
 */
export function drawTrain(
  name: string,
  colors: TrainColors,
  type: 'steam' | 'diesel',
  scale = 1.0,
  trainId?: string,
): TrainSprite {
  const container = new Container();
  const s = scale;
  const silhouette = getSilhouette(trainId ?? '', type);

  const primary = hexToNumber(colors.primary);
  const secondary = hexToNumber(colors.secondary);
  const accent = hexToNumber(colors.accent);

  if (silhouette.kind === 'steam') {
    return drawSteamEngine(container, s, primary, secondary, accent, name, silhouette);
  } else {
    return drawDieselEngine(container, s, primary, secondary, accent, name, silhouette);
  }
}

// ---------------------------------------------------------------------------
// Steam Locomotive
// ---------------------------------------------------------------------------

function drawSteamEngine(
  container: Container,
  s: number,
  primary: number,
  secondary: number,
  accent: number,
  name: string,
  cfg: SteamSilhouette,
): TrainSprite {
  const W = cfg.bodyWidth * s;
  const H = cfg.bodyHeight * s;
  const boilerR = (H / 2) * cfg.boilerScale;
  const allWheels: Graphics[] = [];

  // Locomotive extends from -W/2 (front) to +W/2 (rear cab end).
  // Tender adds extra length behind +W/2.
  const frontX = -W / 2;
  const rearX = W / 2;

  // Track / ground level at y=0. Locomotive body sits above.
  const groundY = 0;
  const driveR = cfg.driveWheelRadius * s;
  const smallR = driveR * 0.55;
  const frameY = groundY - driveR * 0.4; // bottom of boiler/frame

  // ---- Frame Rail ----
  const frame = new Graphics();
  frame.rect(frontX - 12 * s, frameY - 2 * s, W + 24 * s, 4 * s);
  frame.fill(COAL_DARK);
  container.addChild(frame);

  // ---- Running Board (walkway along boiler) ----
  const runBoard = new Graphics();
  const runY = frameY - 4 * s;
  runBoard.rect(frontX + 10 * s, runY, W * 0.65, 3 * s);
  runBoard.fill(COAL_DARK);
  runBoard.stroke({ color: INK, width: 1 * s });
  container.addChild(runBoard);

  // ---- Pilot Wheels (front) ----
  const pilotCount = cfg.wheels.pilotWheels;
  const pilotStartX = frontX + smallR + 6 * s;
  for (let i = 0; i < pilotCount; i++) {
    const wx = pilotStartX + i * (smallR * 2.2);
    allWheels.push(drawWheel(container, wx, groundY, smallR, s));
  }

  // ---- Drive Wheels ----
  const driveCount = cfg.wheels.driveWheels;
  // Center the drive wheels under the boiler
  const driveGroupWidth = (driveCount - 1) * (driveR * 2.2);
  const driveStartX = frontX + W * 0.25 - driveGroupWidth * 0.15;
  const driveWheelXPositions: number[] = [];

  for (let i = 0; i < driveCount; i++) {
    const wx = driveStartX + i * (driveR * 2.2);
    driveWheelXPositions.push(wx);
    allWheels.push(drawWheel(container, wx, groundY, driveR, s, true));
  }

  // ---- Connecting Rod between drive wheels ----
  let connectingRod: Graphics | null = null;
  if (driveWheelXPositions.length >= 2) {
    connectingRod = new Graphics();
    const rodY = groundY - driveR * 0.35;
    connectingRod.moveTo(driveWheelXPositions[0], rodY);
    connectingRod.lineTo(driveWheelXPositions[driveWheelXPositions.length - 1], rodY);
    connectingRod.stroke({ color: RAIL_SILVER, width: 2.5 * s });
    // Crosshead at front
    connectingRod.circle(driveWheelXPositions[0], rodY, 3 * s);
    connectingRod.fill(RAIL_SILVER);
    container.addChild(connectingRod);
  }

  // ---- Trailing Wheels (rear) ----
  const trailingCount = cfg.wheels.trailingWheels;
  const trailingStartX = rearX - smallR - 10 * s - (trailingCount - 1) * (smallR * 2.2);
  for (let i = 0; i < trailingCount; i++) {
    const wx = trailingStartX + i * (smallR * 2.2);
    allWheels.push(drawWheel(container, wx, groundY, smallR, s));
  }

  // ---- Boiler (the dominant cylindrical shape) ----
  const boiler = new Graphics();
  const boilerTop = frameY - boilerR * 2.2;
  const boilerFrontX = frontX + 8 * s;
  const boilerRearX = rearX - cfg.bodyWidth * 0.28 * s; // boiler ends where cab starts

  // Draw boiler as a clearly cylindrical shape with a pronounced rounded top
  boiler.moveTo(boilerFrontX, frameY);
  // Bottom of boiler (flat)
  boiler.lineTo(boilerRearX, frameY);
  // Up to cab junction
  boiler.lineTo(boilerRearX, boilerTop + 10 * s);
  // Curved top of boiler — big dramatic arc for obvious cylinder look
  const boilerMidX = (boilerFrontX + boilerRearX) / 2;
  boiler.bezierCurveTo(
    boilerRearX - (boilerRearX - boilerMidX) * 0.3, boilerTop - 6 * s,
    boilerMidX, boilerTop - 10 * s,
    boilerFrontX + 5 * s, boilerTop + 2 * s,
  );
  // Down front of boiler (smokebox)
  boiler.lineTo(boilerFrontX, frameY);
  boiler.closePath();
  boiler.fill(primary);
  boiler.stroke({ color: INK, width: 2.5 * s });
  container.addChild(boiler);

  // ---- Smokebox Face (front circle — prominent round face) ----
  const smokeboxCY = (frameY + boilerTop + 6 * s) / 2;
  const smokeboxR = boilerR * 0.85;
  const smokebox = new Graphics();
  smokebox.circle(boilerFrontX, smokeboxCY, smokeboxR);
  smokebox.fill(darken(primary, 0.15));
  smokebox.stroke({ color: INK, width: 2 * s });
  // Smokebox door latch (cross)
  smokebox.moveTo(boilerFrontX - 4 * s, smokeboxCY);
  smokebox.lineTo(boilerFrontX + 4 * s, smokeboxCY);
  smokebox.moveTo(boilerFrontX, smokeboxCY - 4 * s);
  smokebox.lineTo(boilerFrontX, smokeboxCY + 4 * s);
  smokebox.stroke({ color: INK, width: 1.5 * s });
  container.addChild(smokebox);

  // ---- Smokestack (dramatically exaggerated bell shape) ----
  const stack = new Graphics();
  const stackX = boilerFrontX + 15 * s;
  const stackBaseW = 12 * s * cfg.stackScale;
  const stackTopW = 24 * s * cfg.stackScale;
  const stackH = 48 * s * cfg.stackScale;
  const stackBaseY = boilerTop + 2 * s;
  const stackTopY = stackBaseY - stackH;

  // Bell shape: narrow at base, flared at top with curved rim
  stack.moveTo(stackX - stackBaseW / 2, stackBaseY);
  stack.bezierCurveTo(
    stackX - stackBaseW / 2, stackBaseY - stackH * 0.6,
    stackX - stackTopW / 2 - 2 * s, stackTopY + stackH * 0.15,
    stackX - stackTopW / 2, stackTopY,
  );
  // Top rim
  stack.lineTo(stackX + stackTopW / 2, stackTopY);
  // Right side bell curve
  stack.bezierCurveTo(
    stackX + stackTopW / 2 + 2 * s, stackTopY + stackH * 0.15,
    stackX + stackBaseW / 2, stackBaseY - stackH * 0.6,
    stackX + stackBaseW / 2, stackBaseY,
  );
  stack.closePath();
  stack.fill(accent);
  stack.stroke({ color: INK, width: 2.5 * s });
  // Rim ring at top
  stack.rect(stackX - stackTopW / 2 - 1 * s, stackTopY - 2 * s, stackTopW + 2 * s, 3 * s);
  stack.fill(darken(accent, 0.1));
  stack.stroke({ color: INK, width: 1.5 * s });
  container.addChild(stack);

  // ---- Sand Dome (smaller bump, between stack and steam dome) ----
  const sandDomeX = boilerFrontX + W * 0.22;
  const sandDomeR = 9 * s;
  const sandDome = new Graphics();
  sandDome.ellipse(sandDomeX, boilerTop + 2 * s, sandDomeR, sandDomeR * 0.75);
  sandDome.fill(darken(primary, 0.05));
  sandDome.stroke({ color: INK, width: 1.5 * s });
  container.addChild(sandDome);

  // ---- Steam Dome (main dome, at ~40% of boiler) ----
  const steamDomeX = boilerFrontX + W * 0.35;
  const steamDomeR = 12 * s;
  const steamDome = new Graphics();
  steamDome.ellipse(steamDomeX, boilerTop + 1 * s, steamDomeR, steamDomeR * 0.8);
  steamDome.fill(secondary);
  steamDome.stroke({ color: INK, width: 2 * s });
  container.addChild(steamDome);

  // ---- Bell (small detail between domes) ----
  const bellX = (sandDomeX + steamDomeX) / 2;
  const bell = new Graphics();
  // Bell stand
  bell.rect(bellX - 1.5 * s, boilerTop - 4 * s, 3 * s, 6 * s);
  bell.fill(SUNRISE_GOLD);
  // Bell body
  bell.ellipse(bellX, boilerTop - 6 * s, 4 * s, 3 * s);
  bell.fill(SUNRISE_GOLD);
  bell.stroke({ color: INK, width: 1 * s });
  container.addChild(bell);

  // ---- Cab (rear boxy structure with roof) ----
  const cab = new Graphics();
  const cabX = boilerRearX;
  const cabW = (rearX - boilerRearX) + 4 * s;
  const cabH = boilerR * 2.2;
  const cabTop = frameY - cabH;
  const cabRoofOverhang = 6 * s;

  // Cab body
  cab.roundRect(cabX, cabTop + 6 * s, cabW, cabH - 6 * s, 3 * s);
  cab.fill(secondary);
  cab.stroke({ color: INK, width: 2.5 * s });

  // Cab roof (with overhang)
  cab.roundRect(
    cabX - cabRoofOverhang / 2, cabTop,
    cabW + cabRoofOverhang, 8 * s,
    3 * s,
  );
  cab.fill(darken(secondary, 0.15));
  cab.stroke({ color: INK, width: 2 * s });

  // Cab windows (two side windows with golden glow)
  const winW = cabW * 0.32;
  const winH = cabH * 0.35;
  const winY = cabTop + 14 * s;
  // Front window
  cab.roundRect(cabX + 4 * s, winY, winW, winH, 2 * s);
  cab.fill(SUNRISE_GOLD);
  cab.stroke({ color: INK, width: 1.5 * s });
  // Rear window
  cab.roundRect(cabX + cabW - winW - 4 * s, winY, winW, winH, 2 * s);
  cab.fill(SUNRISE_GOLD);
  cab.stroke({ color: INK, width: 1.5 * s });
  container.addChild(cab);

  // ---- Headlamp (on smokebox face) ----
  const lampR = 7 * s;
  const lampY = smokeboxCY - smokeboxR * 0.5;
  // Glow
  const glow = new Graphics();
  glow.circle(boilerFrontX - 2 * s, lampY, lampR * 2);
  glow.fill({ color: LANTERN_ORANGE, alpha: 0.2 });
  container.addChild(glow);
  // Lamp body
  const lamp = new Graphics();
  lamp.circle(boilerFrontX - 2 * s, lampY, lampR);
  lamp.fill(LANTERN_ORANGE);
  lamp.stroke({ color: INK, width: 1.5 * s });
  // Inner bright spot
  lamp.circle(boilerFrontX - 2 * s, lampY, lampR * 0.45);
  lamp.fill(SUNRISE_GOLD);
  container.addChild(lamp);

  // ---- Cowcatcher / Pilot (V-wedge at front bottom — big and obvious) ----
  const pilot = new Graphics();
  const pilotTipX = frontX - 22 * s;
  const pilotTopY = frameY - 6 * s;
  const pilotBotY = groundY + 2 * s;
  // Main wedge shape
  pilot.moveTo(pilotTipX, (pilotTopY + pilotBotY) / 2);
  pilot.lineTo(frontX, pilotTopY);
  pilot.lineTo(frontX, pilotBotY);
  pilot.closePath();
  pilot.fill(COAL_DARK);
  pilot.stroke({ color: INK, width: 2 * s });
  // Slat lines across the pilot
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const sx = pilotTipX + (frontX - pilotTipX) * t;
    pilot.moveTo(sx, pilotTopY + (pilotBotY - pilotTopY) * (1 - t) * 0.5);
    pilot.lineTo(sx, pilotBotY - (pilotBotY - pilotTopY) * (1 - t) * 0.3);
    pilot.stroke({ color: INK, width: 1 * s });
  }
  container.addChild(pilot);

  // ---- Handrails (thin lines along boiler side) ----
  const handrail = new Graphics();
  handrail.moveTo(boilerFrontX + 20 * s, boilerTop + boilerR * 0.3);
  handrail.lineTo(boilerRearX - 5 * s, boilerTop + boilerR * 0.3);
  handrail.stroke({ color: RAIL_SILVER, width: 1.5 * s });
  container.addChild(handrail);

  // ---- Boiler Band Rings (decorative horizontal bands) ----
  const bands = new Graphics();
  for (let i = 1; i <= 2; i++) {
    const bandX = boilerFrontX + W * (0.15 + i * 0.18);
    bands.rect(bandX - 1 * s, boilerTop + 3 * s, 2 * s, boilerR * 1.5);
    bands.fill({ color: RAIL_SILVER, alpha: 0.4 });
  }
  container.addChild(bands);

  // ---- Tender (separate car behind cab) ----
  let tenderLength = 0;
  if (cfg.hasTender) {
    tenderLength = 55 * s;
    const tenderGap = 4 * s;
    const tenderX = rearX + tenderGap;
    const tenderH = cabH * 0.75;
    const tenderY = frameY - tenderH;
    const tender = new Graphics();

    // Tender body
    tender.roundRect(tenderX, tenderY + 4 * s, tenderLength, tenderH - 4 * s, 4 * s);
    tender.fill(primary);
    tender.stroke({ color: INK, width: 2.5 * s });

    // Coal bunker (open top, dark fill at front half)
    tender.rect(tenderX + 3 * s, tenderY + 8 * s, tenderLength * 0.45, tenderH * 0.5);
    tender.fill(COAL_DARK);
    tender.stroke({ color: INK, width: 1 * s });

    // Water tank hatch (rear half, small rounded bump on top)
    tender.roundRect(
      tenderX + tenderLength * 0.55, tenderY + 2 * s,
      tenderLength * 0.35, 6 * s, 3 * s,
    );
    tender.fill(darken(primary, 0.1));
    tender.stroke({ color: INK, width: 1 * s });

    container.addChild(tender);

    // Tender wheels
    const tenderWheelR = smallR * 1.1;
    for (let i = 0; i < 4; i++) {
      const wx = tenderX + 8 * s + i * (tenderLength - 16 * s) / 3;
      allWheels.push(drawWheel(container, wx, groundY, tenderWheelR, s));
    }

    // Coupler between cab and tender
    const coupler = new Graphics();
    coupler.rect(rearX, frameY - 4 * s, tenderGap, 4 * s);
    coupler.fill(COAL_DARK);
    container.addChild(coupler);
  }

  // ---- Name Text on boiler ----
  const nameStyle = new TextStyle({
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: Math.max(9, 11 * s),
    fill: CREAM,
    fontWeight: '700',
  });
  const nameText = new Text({ text: name, style: nameStyle });
  nameText.anchor.set(0.5, 0.5);
  nameText.x = (boilerFrontX + boilerRearX) / 2;
  nameText.y = (frameY + boilerTop) / 2 + 8 * s;
  container.addChild(nameText);

  // Smoke origin at the top of the smokestack
  const smokeOrigin = { x: stackX, y: stackTopY - 4 * s };
  const totalLength = W + tenderLength + 20 * s;

  return {
    container,
    wheels: allWheels,
    connectingRod,
    smokeOrigin,
    length: totalLength,
  };
}

// ---------------------------------------------------------------------------
// Diesel Locomotive
// ---------------------------------------------------------------------------

function drawDieselEngine(
  container: Container,
  s: number,
  primary: number,
  secondary: number,
  accent: number,
  name: string,
  cfg: DieselSilhouette,
): TrainSprite {
  const W = cfg.bodyWidth * s;
  const H = cfg.bodyHeight * s;
  const allWheels: Graphics[] = [];

  const frontX = -W / 2;
  const rearX = W / 2;
  const groundY = 0;
  const wheelR = cfg.wheelRadius * s;

  // Body sits on top of underframe
  const underframeH = 8 * s;
  const bodyBottom = groundY - wheelR - 4 * s;
  const bodyTop = bodyBottom - H;

  // ---- Underframe ----
  const underframe = new Graphics();
  underframe.roundRect(frontX - 2 * s, bodyBottom, W + 4 * s, underframeH, 2 * s);
  underframe.fill(COAL_DARK);
  underframe.stroke({ color: INK, width: 1.5 * s });
  container.addChild(underframe);

  // ---- Truck/Bogie Assemblies ----
  const truckWidth = (cfg.trucks.axlesPerTruck * wheelR * 2.4) + 8 * s;
  // Front truck centered under short hood
  const frontTruckX = frontX + truckWidth / 2 + 10 * s;
  // Rear truck centered under long hood
  const rearTruckX = rearX - truckWidth / 2 - 10 * s;

  drawTruck(container, allWheels, frontTruckX, groundY, truckWidth, cfg.trucks.axlesPerTruck, wheelR, s);
  drawTruck(container, allWheels, rearTruckX, groundY, truckWidth, cfg.trucks.axlesPerTruck, wheelR, s);

  // ---- Walkway / Catwalk (narrow platform along base) ----
  const walkway = new Graphics();
  walkway.rect(frontX, bodyBottom - 3 * s, W, 3 * s);
  walkway.fill(darken(primary, 0.2));
  walkway.stroke({ color: INK, width: 1 * s });
  container.addChild(walkway);

  // ---- Long Hood (rear section, contains diesel engine) ----
  const longHoodW = W * cfg.longHoodRatio;
  const longHoodX = rearX - longHoodW;
  const hoodTopInset = 12 * s; // hood is narrower than full body height
  const longHood = new Graphics();
  longHood.roundRect(longHoodX, bodyTop, longHoodW, H, 5 * s);
  longHood.fill(primary);
  longHood.stroke({ color: INK, width: 2.5 * s });
  container.addChild(longHood);

  // Radiator grilles on long hood (horizontal lines)
  const grilles = new Graphics();
  const grilleX = longHoodX + longHoodW * 0.15;
  const grilleW = longHoodW * 0.35;
  for (let i = 0; i < 8; i++) {
    const gy = bodyTop + hoodTopInset + i * (H - hoodTopInset * 2) / 8;
    grilles.moveTo(grilleX, gy);
    grilles.lineTo(grilleX + grilleW, gy);
  }
  grilles.stroke({ color: darken(primary, 0.15), width: 1.5 * s });
  container.addChild(grilles);

  // Second grille section
  const grilles2 = new Graphics();
  const grilleX2 = longHoodX + longHoodW * 0.6;
  const grilleW2 = longHoodW * 0.3;
  for (let i = 0; i < 6; i++) {
    const gy = bodyTop + hoodTopInset + i * (H - hoodTopInset * 2) / 6;
    grilles2.moveTo(grilleX2, gy);
    grilles2.lineTo(grilleX2 + grilleW2, gy);
  }
  grilles2.stroke({ color: darken(primary, 0.15), width: 1.5 * s });
  container.addChild(grilles2);

  // ---- Dynamic Brake Blister (raised box on top of long hood) ----
  if (cfg.hasDynamicBrake) {
    const dbW = longHoodW * 0.3;
    const dbH = 8 * s;
    const dbX = longHoodX + longHoodW * 0.55;
    const db = new Graphics();
    db.roundRect(dbX, bodyTop - dbH, dbW, dbH, 3 * s);
    db.fill(darken(primary, 0.1));
    db.stroke({ color: INK, width: 1.5 * s });
    container.addChild(db);
  }

  // ---- Exhaust Stack (small, on top of long hood) ----
  const exhaustStack = new Graphics();
  const exX = longHoodX + longHoodW * 0.35;
  const exW = 8 * s;
  const exH = 10 * s;
  exhaustStack.roundRect(exX - exW / 2, bodyTop - exH, exW, exH, 2 * s);
  exhaustStack.fill(COAL_DARK);
  exhaustStack.stroke({ color: INK, width: 1.5 * s });
  container.addChild(exhaustStack);

  // ---- Cab (windowed section between hoods — taller and prominent) ----
  const cabW = W * 0.24;
  const cabX = longHoodX - cabW + 3 * s;
  const cabH = H + 26 * s; // much taller than hood for recognizable profile
  const cabTop = bodyTop - 26 * s;
  const isWideCab = cfg.features.includes('wide_cab');

  const cab = new Graphics();
  cab.roundRect(cabX, cabTop, cabW + (isWideCab ? 6 * s : 0), cabH, 4 * s);
  cab.fill(primary);
  cab.stroke({ color: INK, width: 2.5 * s });
  container.addChild(cab);

  // Cab roof
  const cabRoof = new Graphics();
  cabRoof.roundRect(cabX - 3 * s, cabTop - 3 * s, cabW + (isWideCab ? 12 * s : 6 * s), 6 * s, 3 * s);
  cabRoof.fill(darken(primary, 0.15));
  cabRoof.stroke({ color: INK, width: 1.5 * s });
  container.addChild(cabRoof);

  // Cab windshields (large, prominent windows)
  const windshield = new Graphics();
  const wsW = cabW * 0.75;
  const wsH = cabH * 0.38;
  const wsX = cabX + (cabW - wsW) / 2;
  const wsY = cabTop + 8 * s;
  // Main windshield
  windshield.roundRect(wsX, wsY, wsW, wsH, 3 * s);
  windshield.fill(0x5B98B5);
  windshield.stroke({ color: INK, width: 1.5 * s });
  // Windshield divider
  windshield.moveTo(wsX + wsW / 2, wsY);
  windshield.lineTo(wsX + wsW / 2, wsY + wsH);
  windshield.stroke({ color: INK, width: 1 * s });
  container.addChild(windshield);

  // Side windows
  const sideWinW = cabW * 0.25;
  const sideWinH = wsH * 0.7;
  const sideWin = new Graphics();
  sideWin.roundRect(cabX + cabW - sideWinW - 2 * s, wsY + 3 * s, sideWinW, sideWinH, 2 * s);
  sideWin.fill(0x5B98B5);
  sideWin.stroke({ color: INK, width: 1 * s });
  container.addChild(sideWin);

  // ---- Short Hood / Nose (front section) ----
  const shortHoodW = W - longHoodW - cabW + 6 * s;
  const shortHoodX = frontX;
  const shortHoodH = H * 0.8; // shorter than long hood
  const shortHoodTop = bodyBottom - shortHoodH;

  const shortHood = new Graphics();
  // Tapered nose shape
  shortHood.moveTo(shortHoodX, bodyBottom);
  shortHood.lineTo(shortHoodX, shortHoodTop + 8 * s);
  shortHood.quadraticCurveTo(shortHoodX, shortHoodTop, shortHoodX + 10 * s, shortHoodTop);
  shortHood.lineTo(shortHoodX + shortHoodW, shortHoodTop - 4 * s);
  shortHood.lineTo(shortHoodX + shortHoodW, bodyBottom);
  shortHood.closePath();
  shortHood.fill(primary);
  shortHood.stroke({ color: INK, width: 2.5 * s });
  container.addChild(shortHood);

  // ---- Snowplow (if applicable) ----
  if (cfg.hasSnowplow) {
    const plow = new Graphics();
    plow.moveTo(frontX - 12 * s, bodyBottom + underframeH);
    plow.lineTo(frontX, bodyBottom - 5 * s);
    plow.lineTo(frontX, bodyBottom + underframeH);
    plow.closePath();
    plow.fill(RAIL_SILVER);
    plow.stroke({ color: INK, width: 2 * s });
    container.addChild(plow);
  }

  // ---- Headlamps (dual, on nose face) ----
  for (const offsetY of [-10 * s, 6 * s]) {
    const lampGlow = new Graphics();
    lampGlow.circle(frontX - 1 * s, shortHoodTop + shortHoodH / 2 + offsetY, 10 * s);
    lampGlow.fill({ color: LANTERN_ORANGE, alpha: 0.15 });
    container.addChild(lampGlow);

    const headlamp = new Graphics();
    headlamp.circle(frontX - 1 * s, shortHoodTop + shortHoodH / 2 + offsetY, 5 * s);
    headlamp.fill(LANTERN_ORANGE);
    headlamp.stroke({ color: INK, width: 1.5 * s });
    container.addChild(headlamp);
  }

  // ---- Number Board (rectangular panel at front) ----
  const numBoard = new Graphics();
  const nbW = 16 * s;
  const nbH = 8 * s;
  numBoard.roundRect(frontX + 2 * s, shortHoodTop + 2 * s, nbW, nbH, 2 * s);
  numBoard.fill(CREAM);
  numBoard.stroke({ color: INK, width: 1 * s });
  container.addChild(numBoard);

  // ---- Livery Stripe (bold railroad stripe across body) ----
  const stripe = new Graphics();
  const stripeH = 6 * s;
  const stripeY = bodyTop + H * 0.6;
  stripe.rect(frontX + 4 * s, stripeY, W - 8 * s, stripeH);
  stripe.fill(accent);
  container.addChild(stripe);

  // ---- Handrails (along body sides) ----
  const handrail = new Graphics();
  handrail.moveTo(frontX + 8 * s, bodyTop + H * 0.3);
  handrail.lineTo(rearX - 8 * s, bodyTop + H * 0.3);
  handrail.stroke({ color: RAIL_SILVER, width: 1.5 * s });
  container.addChild(handrail);

  // ---- Steps at cab doors ----
  const steps = new Graphics();
  const stepX = cabX + cabW - 2 * s;
  for (let i = 0; i < 3; i++) {
    steps.rect(stepX, bodyBottom + i * 5 * s, 6 * s, 3 * s);
  }
  steps.fill(COAL_DARK);
  steps.stroke({ color: INK, width: 1 * s });
  container.addChild(steps);

  // ---- Name Text on body ----
  const nameStyle = new TextStyle({
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: Math.max(9, 10 * s),
    fill: CREAM,
    fontWeight: '700',
  });
  const nameText = new Text({ text: name, style: nameStyle });
  nameText.anchor.set(0.5, 0.5);
  nameText.x = longHoodX + longHoodW / 2;
  nameText.y = bodyTop + H / 2;
  container.addChild(nameText);

  // Smoke origin at the exhaust stack
  const smokeOrigin = { x: exX, y: bodyTop - exH - 4 * s };

  return {
    container,
    wheels: allWheels,
    connectingRod: null,
    smokeOrigin,
    length: W + 20 * s,
  };
}

// ---------------------------------------------------------------------------
// Shared drawing helpers
// ---------------------------------------------------------------------------

/**
 * Draw a single wheel with rim, spokes, and hub. Returns the Graphics.
 */
function drawWheel(
  parent: Container,
  x: number,
  y: number,
  radius: number,
  s: number,
  isDriveWheel = false,
): Graphics {
  const wheel = new Graphics();

  // Outer tire
  wheel.circle(x, y, radius);
  wheel.fill(COAL_DARK);
  wheel.stroke({ color: INK, width: 2 * s });

  // Rim
  wheel.circle(x, y, radius - 2.5 * s);
  wheel.stroke({ color: RAIL_SILVER, width: 1.5 * s });

  // Spokes for drive wheels
  if (isDriveWheel) {
    const spokeCount = 6;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (Math.PI * 2 * i) / spokeCount;
      const innerR = 3 * s;
      const outerR = radius - 4 * s;
      wheel.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
      wheel.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
      wheel.stroke({ color: RAIL_SILVER, width: 1 * s });
    }
  }

  // Hub
  wheel.circle(x, y, 3 * s);
  wheel.fill(RAIL_SILVER);
  wheel.stroke({ color: INK, width: 1 * s });

  parent.addChild(wheel);
  return wheel;
}

/**
 * Draw a diesel truck/bogie assembly.
 */
function drawTruck(
  parent: Container,
  allWheels: Graphics[],
  centerX: number,
  groundY: number,
  width: number,
  axles: number,
  wheelR: number,
  s: number,
): void {
  // Truck sideframe
  const truckFrame = new Graphics();
  const frameY = groundY - wheelR * 1.2;
  truckFrame.roundRect(centerX - width / 2, frameY, width, wheelR * 0.8, 2 * s);
  truckFrame.fill(COAL_DARK);
  truckFrame.stroke({ color: INK, width: 1.5 * s });
  parent.addChild(truckFrame);

  // Wheels
  const spacing = (width - wheelR * 2) / Math.max(axles - 1, 1);
  const startX = centerX - width / 2 + wheelR;
  for (let i = 0; i < axles; i++) {
    const wx = startX + i * spacing;
    allWheels.push(drawWheel(parent, wx, groundY, wheelR, s));
  }
}

/**
 * Darken a numeric color by a fraction (0.0-1.0).
 */
function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xFF) * (1 - amount)) | 0;
  const g = Math.max(0, ((color >> 8) & 0xFF) * (1 - amount)) | 0;
  const b = Math.max(0, (color & 0xFF) * (1 - amount)) | 0;
  return (r << 16) | (g << 8) | b;
}
