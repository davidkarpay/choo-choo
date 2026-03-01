/**
 * Programmatic train sprite drawing.
 *
 * Each train is built from composed shapes following the style guide:
 * rounded rectangle body, cab, smokestack, headlamp, wheels with connecting rods.
 * Bold ink outlines (2-3px, #1A1A2E), warm colors per train data.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { hexToNumber } from '../../utils/animation';

const INK = 0x1A1A2E;
const RAIL_SILVER = 0x8C8C8C;
const COAL_DARK = 0x2E2E38;

interface TrainColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Create a programmatic train sprite facing right.
 * Returns a Container with all parts as children.
 * Origin is at the bottom-center of the wheels.
 */
export function drawTrain(
  name: string,
  colors: TrainColors,
  type: 'steam' | 'diesel',
  scale = 1.0
): Container {
  const container = new Container();
  const s = scale;

  const primary = hexToNumber(colors.primary);
  const secondary = hexToNumber(colors.secondary);
  const accent = hexToNumber(colors.accent);

  if (type === 'steam') {
    drawSteamEngine(container, s, primary, secondary, accent, name);
  } else {
    drawDieselEngine(container, s, primary, secondary, accent, name);
  }

  return container;
}

function drawSteamEngine(
  container: Container,
  s: number,
  primary: number,
  secondary: number,
  accent: number,
  name: string
) {
  const bodyW = 140 * s;
  const bodyH = 50 * s;
  const cabW = 45 * s;
  const cabH = 40 * s;

  // Body — rounded rectangle
  const body = new Graphics();
  body.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, 8 * s);
  body.fill(primary);
  body.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, 8 * s);
  body.stroke({ color: INK, width: 2.5 * s });
  body.y = 0;
  container.addChild(body);

  // Boiler cylinder (front portion of body)
  const boiler = new Graphics();
  const boilerR = bodyH / 2 - 2 * s;
  boiler.ellipse(-bodyW / 2 + 25 * s, -bodyH / 2, 15 * s, boilerR);
  boiler.fill(primary);
  boiler.stroke({ color: INK, width: 2 * s });
  container.addChild(boiler);

  // Cab — on the rear
  const cab = new Graphics();
  const cabX = bodyW / 2 - cabW - 5 * s;
  cab.roundRect(cabX - bodyW / 2, -bodyH - cabH + 5 * s, cabW, cabH, 4 * s);
  cab.fill(secondary);
  cab.stroke({ color: INK, width: 2 * s });
  container.addChild(cab);

  // Cab window
  const cabWin = new Graphics();
  cabWin.roundRect(cabX - bodyW / 2 + 8 * s, -bodyH - cabH + 12 * s, cabW - 16 * s, cabH / 2, 3 * s);
  cab.fill(0xF4C542);
  cabWin.fill(0xF4C542);
  cabWin.stroke({ color: INK, width: 1.5 * s });
  container.addChild(cabWin);

  // Smokestack — trapezoid on front
  const stack = new Graphics();
  const stackX = -bodyW / 2 + 20 * s;
  const stackBottomW = 14 * s;
  const stackTopW = 20 * s;
  const stackH = 30 * s;
  stack.moveTo(stackX - stackBottomW / 2, -bodyH);
  stack.lineTo(stackX - stackTopW / 2, -bodyH - stackH);
  stack.lineTo(stackX + stackTopW / 2, -bodyH - stackH);
  stack.lineTo(stackX + stackBottomW / 2, -bodyH);
  stack.closePath();
  stack.fill(accent);
  stack.stroke({ color: INK, width: 2 * s });
  container.addChild(stack);

  // Headlamp
  const lamp = new Graphics();
  lamp.circle(-bodyW / 2 - 2 * s, -bodyH / 2, 6 * s);
  lamp.fill(0xE8913A);
  lamp.stroke({ color: INK, width: 1.5 * s });
  container.addChild(lamp);

  // Headlamp glow
  const glow = new Graphics();
  glow.circle(-bodyW / 2 - 2 * s, -bodyH / 2, 12 * s);
  glow.fill({ color: 0xE8913A, alpha: 0.2 });
  container.addChild(glow);

  // Wheels
  const wheelR = 12 * s;
  const wheelY = 2 * s;
  const wheelPositions = [-bodyW / 2 + 25 * s, -10 * s, 20 * s, bodyW / 2 - 20 * s];

  for (const wx of wheelPositions) {
    const wheel = new Graphics();
    wheel.circle(wx, wheelY, wheelR);
    wheel.fill(COAL_DARK);
    wheel.stroke({ color: INK, width: 2 * s });
    // Rim
    wheel.circle(wx, wheelY, wheelR - 3 * s);
    wheel.stroke({ color: RAIL_SILVER, width: 1.5 * s });
    // Hub
    wheel.circle(wx, wheelY, 3 * s);
    wheel.fill(RAIL_SILVER);
    container.addChild(wheel);
  }

  // Connecting rod between drive wheels
  const rod = new Graphics();
  rod.moveTo(wheelPositions[0], wheelY);
  rod.lineTo(wheelPositions[3], wheelY);
  rod.stroke({ color: RAIL_SILVER, width: 2 * s });
  container.addChild(rod);

  // Name text on body
  const nameStyle = new TextStyle({
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 11 * s,
    fill: 0xFDF6E3,
    fontWeight: '700',
  });
  const nameText = new Text({ text: name, style: nameStyle });
  nameText.anchor.set(0.5, 0.5);
  nameText.x = 10 * s;
  nameText.y = -bodyH / 2;
  container.addChild(nameText);

  // Cowcatcher (pilot) at front
  const pilot = new Graphics();
  pilot.moveTo(-bodyW / 2 - 10 * s, 0);
  pilot.lineTo(-bodyW / 2, -8 * s);
  pilot.lineTo(-bodyW / 2, 8 * s);
  pilot.closePath();
  pilot.fill(COAL_DARK);
  pilot.stroke({ color: INK, width: 2 * s });
  container.addChild(pilot);
}

function drawDieselEngine(
  container: Container,
  s: number,
  primary: number,
  secondary: number,
  accent: number,
  name: string
) {
  const bodyW = 120 * s;
  const bodyH = 55 * s;

  // Body — more boxy than steam
  const body = new Graphics();
  body.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, 4 * s);
  body.fill(primary);
  body.stroke({ color: INK, width: 2.5 * s });
  container.addChild(body);

  // Hood (upper portion)
  const hood = new Graphics();
  hood.roundRect(-bodyW / 2 + 5 * s, -bodyH - 15 * s, bodyW * 0.4, 15 * s, 3 * s);
  hood.fill(secondary);
  hood.stroke({ color: INK, width: 2 * s });
  container.addChild(hood);

  // Cab (rear upper)
  const cab = new Graphics();
  cab.roundRect(bodyW / 2 - 40 * s, -bodyH - 25 * s, 35 * s, 25 * s, 4 * s);
  cab.fill(secondary);
  cab.stroke({ color: INK, width: 2 * s });
  container.addChild(cab);

  // Cab windshield
  const windshield = new Graphics();
  windshield.roundRect(bodyW / 2 - 36 * s, -bodyH - 20 * s, 27 * s, 12 * s, 2 * s);
  windshield.fill(0x5B98B5);
  windshield.stroke({ color: INK, width: 1.5 * s });
  container.addChild(windshield);

  // Headlamps (dual)
  for (const offset of [-8 * s, 8 * s]) {
    const lamp = new Graphics();
    lamp.circle(-bodyW / 2 - 2 * s, -bodyH / 2 + offset, 5 * s);
    lamp.fill(0xE8913A);
    lamp.stroke({ color: INK, width: 1.5 * s });
    container.addChild(lamp);
  }

  // Stripe detail
  const stripe = new Graphics();
  stripe.rect(-bodyW / 2 + 3 * s, -bodyH * 0.35, bodyW - 6 * s, 4 * s);
  stripe.fill(accent);
  container.addChild(stripe);

  // Wheels (truck bogies)
  const wheelR = 10 * s;
  const wheelY = 2 * s;
  const wheelPositions = [-bodyW / 2 + 20 * s, -bodyW / 2 + 40 * s, bodyW / 2 - 40 * s, bodyW / 2 - 20 * s];

  for (const wx of wheelPositions) {
    const wheel = new Graphics();
    wheel.circle(wx, wheelY, wheelR);
    wheel.fill(COAL_DARK);
    wheel.stroke({ color: INK, width: 2 * s });
    wheel.circle(wx, wheelY, wheelR - 3 * s);
    wheel.stroke({ color: RAIL_SILVER, width: 1 * s });
    wheel.circle(wx, wheelY, 2 * s);
    wheel.fill(RAIL_SILVER);
    container.addChild(wheel);
  }

  // Name text
  const nameStyle = new TextStyle({
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 10 * s,
    fill: 0xFDF6E3,
    fontWeight: '700',
  });
  const nameText = new Text({ text: name, style: nameStyle });
  nameText.anchor.set(0.5, 0.5);
  nameText.x = 10 * s;
  nameText.y = -bodyH / 2;
  container.addChild(nameText);
}
