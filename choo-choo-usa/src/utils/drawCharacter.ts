/**
 * drawCharacter.ts
 *
 * Modular character renderer used by both train interior and station scenes.
 * Composites a character from PassengerAppearance data with a pose system.
 * Follows the drawTrain.ts pattern: composed PixiJS Graphics in a Container,
 * INK outlines at 2px, scale parameter.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: /docs/STYLE_GUIDE.md for character rendering guidelines
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics, Text, TextStyle
 *   - passenger types: PassengerAppearance, PassengerActivity, AgeGroup
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { PassengerAppearance, PassengerActivity } from '../types/passenger';
import { hexToNumber } from './animation';

const INK = 0x1A1A2E;
const SKIN_TONE = 0xE8B87A;
const SKIN_TONE_CHILD = 0xF0C8A0;

/** Visual pose determining limb positions and body adjustments. */
export type CharacterPose =
  | 'standing'
  | 'sitting'
  | 'sleeping_sitting'
  | 'reading'
  | 'eating'
  | 'looking_out'
  | 'talking'
  | 'waving'
  | 'walking';

export interface CharacterOptions {
  appearance: PassengerAppearance;
  pose?: CharacterPose;
  scale?: number;
  showName?: string;
  /** Flip character to face left (default faces right). */
  flipX?: boolean;
}

/** Map passenger activities to visual character poses. */
export function activityToPose(activity: PassengerActivity): CharacterPose {
  switch (activity) {
    case 'waiting': return 'standing';
    case 'boarding': return 'walking';
    case 'sleeping': return 'sleeping_sitting';
    case 'eating': return 'eating';
    case 'reading': return 'reading';
    case 'talking': return 'talking';
    case 'looking_out_window': return 'looking_out';
    case 'arriving': return 'standing';
    case 'deboarding': return 'walking';
    case 'leaving': return 'walking';
    default: return 'standing';
  }
}

/**
 * Create a programmatic character sprite.
 * Origin is at the bottom-center (feet).
 * Body type scaling: child=0.6x, adult=1.0x, elderly=0.9x.
 */
export function drawCharacter(options: CharacterOptions): Container {
  const {
    appearance,
    pose = 'standing',
    scale = 1.0,
    showName,
    flipX = false,
  } = options;

  const container = new Container();

  // Body type scale multiplier
  const bodyScale = appearance.bodyType === 'child' ? 0.6
    : appearance.bodyType === 'elderly' ? 0.9
    : 1.0;
  const s = scale * bodyScale;

  const skin = appearance.bodyType === 'child' ? SKIN_TONE_CHILD : SKIN_TONE;
  const clothingNum = hexToNumber(appearance.clothingColor);

  const isSitting = pose === 'sitting' || pose === 'sleeping_sitting'
    || pose === 'reading' || pose === 'eating' || pose === 'looking_out';

  const g = new Graphics();

  // --- Legs ---
  if (isSitting) {
    // Seated: legs extend forward, bent at knee
    g.moveTo(-5 * s, -8 * s);
    g.lineTo(-8 * s, 0);
    g.moveTo(5 * s, -8 * s);
    g.lineTo(8 * s, 0);
    g.stroke({ color: INK, width: 2.5 * s });
    // Shoes
    g.roundRect(-10 * s, -2 * s, 5 * s, 3 * s, 1 * s);
    g.roundRect(6 * s, -2 * s, 5 * s, 3 * s, 1 * s);
    g.fill(0x3E2F1C);
  } else {
    // Standing / walking
    const legSpread = pose === 'walking' ? 4 : 0;
    g.moveTo(-4 * s, -8 * s);
    g.lineTo(-4 * s - legSpread * s, 0);
    g.moveTo(4 * s, -8 * s);
    g.lineTo(4 * s + legSpread * s, 0);
    g.stroke({ color: INK, width: 2.5 * s });
    // Shoes
    g.roundRect(-6 * s - legSpread * s, -2 * s, 5 * s, 3 * s, 1 * s);
    g.roundRect(2 * s + legSpread * s, -2 * s, 5 * s, 3 * s, 1 * s);
    g.fill(0x3E2F1C);
  }

  // --- Body (torso) ---
  const bodyY = isSitting ? -8 * s : -8 * s;
  const bodyH = 26 * s;
  const bodyW = 16 * s;

  // Elderly slight forward lean
  const leanX = appearance.bodyType === 'elderly' ? 2 * s : 0;

  g.roundRect(-bodyW / 2 + leanX, bodyY - bodyH, bodyW, bodyH, 4 * s);
  g.fill(clothingNum);
  g.roundRect(-bodyW / 2 + leanX, bodyY - bodyH, bodyW, bodyH, 4 * s);
  g.stroke({ color: INK, width: 2 * s });

  // --- Arms ---
  const shoulderY = bodyY - bodyH + 5 * s;
  const shoulderLX = -bodyW / 2 + leanX;
  const shoulderRX = bodyW / 2 + leanX;

  switch (pose) {
    case 'waving':
      // Left arm down
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(shoulderLX - 6 * s, shoulderY + 18 * s);
      // Right arm up waving
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(shoulderRX + 8 * s, shoulderY - 12 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Hand
      g.circle(shoulderRX + 8 * s, shoulderY - 13 * s, 2.5 * s);
      g.fill(skin);
      break;
    case 'reading':
      // Both arms forward holding a book
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(shoulderLX + 4 * s, shoulderY + 14 * s);
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(shoulderRX - 4 * s, shoulderY + 14 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Book
      g.roundRect(-5 * s + leanX, shoulderY + 12 * s, 10 * s, 7 * s, 1 * s);
      g.fill(0x5B98B5);
      g.stroke({ color: INK, width: 1.5 * s });
      break;
    case 'eating':
      // Left arm on table, right arm raised to mouth
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(shoulderLX - 2 * s, shoulderY + 16 * s);
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(shoulderRX + 3 * s, shoulderY + 8 * s);
      g.lineTo(shoulderRX + 6 * s, shoulderY + 2 * s);
      g.stroke({ color: INK, width: 2 * s });
      break;
    case 'looking_out':
      // One arm resting on window sill, head turned
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(shoulderLX - 4 * s, shoulderY + 16 * s);
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(shoulderRX + 10 * s, shoulderY + 6 * s);
      g.stroke({ color: INK, width: 2 * s });
      break;
    case 'talking':
      // Animated arm gesture
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(shoulderLX - 10 * s, shoulderY + 10 * s);
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(shoulderRX + 10 * s, shoulderY + 8 * s);
      g.stroke({ color: INK, width: 2 * s });
      break;
    case 'sleeping_sitting':
      // Arms in lap
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(leanX - 2 * s, shoulderY + 18 * s);
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(leanX + 2 * s, shoulderY + 18 * s);
      g.stroke({ color: INK, width: 2 * s });
      break;
    default:
      // Arms hanging down
      g.moveTo(shoulderLX, shoulderY);
      g.lineTo(shoulderLX - 4 * s, shoulderY + 20 * s);
      g.moveTo(shoulderRX, shoulderY);
      g.lineTo(shoulderRX + 4 * s, shoulderY + 20 * s);
      g.stroke({ color: INK, width: 2 * s });
  }

  // --- Head ---
  const headY = bodyY - bodyH - 8 * s;
  const headR = 8 * s;

  // Head tilt for sleeping
  const headTiltX = pose === 'sleeping_sitting' ? 4 * s : 0;

  g.circle(leanX + headTiltX, headY, headR);
  g.fill(skin);
  g.circle(leanX + headTiltX, headY, headR);
  g.stroke({ color: INK, width: 1.5 * s });

  // Eyes (dot eyes per style guide)
  if (pose === 'sleeping_sitting') {
    // Closed eyes — short lines
    g.moveTo(leanX + headTiltX - 3 * s, headY - 1 * s);
    g.lineTo(leanX + headTiltX - 1 * s, headY - 1 * s);
    g.moveTo(leanX + headTiltX + 1 * s, headY - 1 * s);
    g.lineTo(leanX + headTiltX + 3 * s, headY - 1 * s);
    g.stroke({ color: INK, width: 1.5 * s });
  } else {
    g.circle(leanX + headTiltX - 2.5 * s, headY - 1 * s, 1.2 * s);
    g.circle(leanX + headTiltX + 2.5 * s, headY - 1 * s, 1.2 * s);
    g.fill(INK);
  }

  // Mouth (simple curved line)
  if (pose !== 'sleeping_sitting') {
    g.moveTo(leanX + headTiltX - 2 * s, headY + 3 * s);
    g.quadraticCurveTo(leanX + headTiltX, headY + 5 * s, leanX + headTiltX + 2 * s, headY + 3 * s);
    g.stroke({ color: INK, width: 1 * s });
  }

  // --- Hair ---
  const hairTop = headY - headR;
  if (appearance.hairStyle === 'short') {
    g.arc(leanX + headTiltX, headY - 2 * s, headR + 1 * s, -Math.PI, 0);
    g.fill(0x3E2F1C);
  } else if (appearance.hairStyle === 'long') {
    // Longer hair flowing down sides
    g.arc(leanX + headTiltX, headY - 2 * s, headR + 1 * s, -Math.PI, 0);
    g.fill(0x3E2F1C);
    g.roundRect(leanX + headTiltX - headR - 1 * s, headY, 3 * s, 12 * s, 1 * s);
    g.roundRect(leanX + headTiltX + headR - 2 * s, headY, 3 * s, 12 * s, 1 * s);
    g.fill(0x3E2F1C);
  } else if (appearance.hairStyle === 'bald') {
    // Slight sheen line on bald head
    g.arc(leanX + headTiltX - 2 * s, hairTop + 3 * s, 3 * s, -0.5, 0.5, false);
    g.stroke({ color: 0xF0EDE4, width: 1 * s, alpha: 0.4 });
  }
  // hairStyle 'hat' — handled by hatType below

  // --- Hat ---
  if (appearance.hatType !== 'none') {
    drawHat(g, leanX + headTiltX, headY, headR, appearance.hatType, s);
  }

  // --- Bag ---
  if (appearance.bagType !== 'none' && !isSitting) {
    drawBag(g, shoulderRX + 4 * s, shoulderY + 14 * s, appearance.bagType, s);
  }

  container.addChild(g);

  // --- Name label ---
  if (showName) {
    const nameStyle = new TextStyle({
      fontFamily: 'Nunito, Trebuchet MS, sans-serif',
      fontSize: 9 * scale,
      fill: INK,
      fontWeight: '600',
    });
    const nameText = new Text({ text: showName, style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.y = bodyY - bodyH - headR * 2 - 14 * s;
    container.addChild(nameText);
  }

  if (flipX) {
    container.scale.x = -1;
  }

  return container;
}

function drawHat(
  g: Graphics,
  cx: number,
  headY: number,
  headR: number,
  hatType: string,
  s: number,
): void {
  const top = headY - headR - 2 * s;

  switch (hatType) {
    case 'conductor':
      // Flat-top conductor hat
      g.roundRect(cx - 10 * s, top - 6 * s, 20 * s, 8 * s, 2 * s);
      g.fill(INK);
      g.rect(cx - 8 * s, top + 1 * s, 16 * s, 3 * s);
      g.fill(INK);
      break;
    case 'cowboy':
      // Wide brim cowboy hat
      g.ellipse(cx, top + 2 * s, 14 * s, 3 * s);
      g.fill(0x8B6914);
      g.stroke({ color: INK, width: 1 * s });
      g.roundRect(cx - 7 * s, top - 8 * s, 14 * s, 10 * s, 3 * s);
      g.fill(0x8B6914);
      g.stroke({ color: INK, width: 1 * s });
      break;
    case 'beanie':
      g.arc(cx, headY - 2 * s, headR + 2 * s, -Math.PI, 0);
      g.fill(0xD64045);
      g.stroke({ color: INK, width: 1 * s });
      // Pom-pom
      g.circle(cx, top - 4 * s, 3 * s);
      g.fill(0xD64045);
      break;
    case 'sun_hat':
      // Wide brimmed sun hat
      g.ellipse(cx, top + 2 * s, 15 * s, 3 * s);
      g.fill(0xD4A843);
      g.stroke({ color: INK, width: 1 * s });
      g.arc(cx, headY - 2 * s, headR + 1 * s, -Math.PI, 0);
      g.fill(0xD4A843);
      g.stroke({ color: INK, width: 1 * s });
      break;
  }
}

function drawBag(
  g: Graphics,
  x: number,
  y: number,
  bagType: string,
  s: number,
): void {
  switch (bagType) {
    case 'suitcase':
      g.roundRect(x, y, 10 * s, 8 * s, 2 * s);
      g.fill(0x6B4226);
      g.stroke({ color: INK, width: 1.5 * s });
      // Handle
      g.moveTo(x + 3 * s, y);
      g.lineTo(x + 3 * s, y - 3 * s);
      g.lineTo(x + 7 * s, y - 3 * s);
      g.lineTo(x + 7 * s, y);
      g.stroke({ color: INK, width: 1.5 * s });
      break;
    case 'backpack':
      g.roundRect(x - 2 * s, y - 8 * s, 8 * s, 12 * s, 2 * s);
      g.fill(0x2D5A3D);
      g.stroke({ color: INK, width: 1.5 * s });
      break;
    case 'briefcase':
      g.roundRect(x, y, 12 * s, 8 * s, 1 * s);
      g.fill(0x1A1A2E);
      g.stroke({ color: INK, width: 1.5 * s });
      // Clasp
      g.circle(x + 6 * s, y + 4 * s, 1.5 * s);
      g.fill(0x8C8C8C);
      break;
    case 'bundle':
      // Cloth bundle tied with string
      g.circle(x + 4 * s, y, 5 * s);
      g.fill(0xD64045);
      g.stroke({ color: INK, width: 1.5 * s });
      // String
      g.moveTo(x + 4 * s, y - 5 * s);
      g.lineTo(x + 4 * s, y - 9 * s);
      g.stroke({ color: INK, width: 1 * s });
      break;
  }
}
