/**
 * drawWorker.ts
 *
 * Fixed-appearance worker character renderer. Workers have preset uniform
 * colors and role-specific poses/accessories. Used by both station and
 * train interior scenes.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: /docs/STYLE_GUIDE.md for character rendering guidelines
 *
 * Dependencies:
 *   - pixi.js: Container, Graphics
 *   - drawCharacter: shared character compositing
 */

import { Container, Graphics } from 'pixi.js';

const INK = 0x1A1A2E;
const SKIN_TONE = 0xE8B87A;

export type WorkerRole =
  | 'engineer'
  | 'fireman'
  | 'conductor'
  | 'porter'
  | 'cook'
  | 'waiter'
  | 'ticket_collector';

interface WorkerConfig {
  uniformColor: number;
  hatColor: number;
  hasHat: boolean;
  accessory: 'lantern' | 'flag' | 'tray' | 'spatula' | 'luggage_cart' | 'ticket' | 'shovel' | 'none';
}

const WORKER_CONFIGS: Record<WorkerRole, WorkerConfig> = {
  engineer: {
    uniformColor: 0x4A6FA5,
    hatColor: INK,
    hasHat: true,
    accessory: 'lantern',
  },
  fireman: {
    uniformColor: 0xC45B3E,
    hatColor: 0xC45B3E,
    hasHat: false,
    accessory: 'shovel',
  },
  conductor: {
    uniformColor: 0x1B3A5C,
    hatColor: INK,
    hasHat: true,
    accessory: 'flag',
  },
  porter: {
    uniformColor: 0x8C8C8C,
    hatColor: 0x8C8C8C,
    hasHat: true,
    accessory: 'luggage_cart',
  },
  cook: {
    uniformColor: 0xF0EDE4,
    hatColor: 0xF0EDE4,
    hasHat: true,
    accessory: 'spatula',
  },
  waiter: {
    uniformColor: 0x2E2E38,
    hatColor: 0x2E2E38,
    hasHat: false,
    accessory: 'tray',
  },
  ticket_collector: {
    uniformColor: 0x1B3A5C,
    hatColor: INK,
    hasHat: true,
    accessory: 'ticket',
  },
};

/**
 * Create a programmatic worker sprite.
 * Origin is at the bottom-center (feet).
 */
export function drawWorker(role: WorkerRole, scale = 1.0): Container {
  const container = new Container();
  const config = WORKER_CONFIGS[role];
  const s = scale;
  const g = new Graphics();

  // --- Legs ---
  g.moveTo(-4 * s, -8 * s);
  g.lineTo(-4 * s, 0);
  g.moveTo(4 * s, -8 * s);
  g.lineTo(4 * s, 0);
  g.stroke({ color: INK, width: 2.5 * s });
  // Shoes
  g.roundRect(-6 * s, -2 * s, 5 * s, 3 * s, 1 * s);
  g.roundRect(2 * s, -2 * s, 5 * s, 3 * s, 1 * s);
  g.fill(0x3E2F1C);

  // --- Body ---
  const bodyY = -8 * s;
  const bodyH = 26 * s;
  const bodyW = 16 * s;
  g.roundRect(-bodyW / 2, bodyY - bodyH, bodyW, bodyH, 4 * s);
  g.fill(config.uniformColor);
  g.roundRect(-bodyW / 2, bodyY - bodyH, bodyW, bodyH, 4 * s);
  g.stroke({ color: INK, width: 2 * s });

  // Buttons down the front
  for (let i = 0; i < 3; i++) {
    g.circle(0, bodyY - bodyH + 8 * s + i * 7 * s, 1.2 * s);
    g.fill(0xF4C542);
  }

  // --- Arms + accessory ---
  const shoulderY = bodyY - bodyH + 5 * s;
  const shoulderL = -bodyW / 2;
  const shoulderR = bodyW / 2;

  drawAccessory(g, config.accessory, shoulderL, shoulderR, shoulderY, s);

  // --- Head ---
  const headY = bodyY - bodyH - 8 * s;
  const headR = 8 * s;
  g.circle(0, headY, headR);
  g.fill(SKIN_TONE);
  g.circle(0, headY, headR);
  g.stroke({ color: INK, width: 1.5 * s });

  // Eyes
  g.circle(-2.5 * s, headY - 1 * s, 1.2 * s);
  g.circle(2.5 * s, headY - 1 * s, 1.2 * s);
  g.fill(INK);

  // Smile
  g.moveTo(-2 * s, headY + 3 * s);
  g.quadraticCurveTo(0, headY + 5 * s, 2 * s, headY + 3 * s);
  g.stroke({ color: INK, width: 1 * s });

  // --- Hat ---
  if (config.hasHat) {
    const hatTop = headY - headR - 2 * s;
    if (role === 'cook') {
      // Chef's toque
      g.roundRect(-7 * s, hatTop - 12 * s, 14 * s, 14 * s, 5 * s);
      g.fill(config.hatColor);
      g.stroke({ color: INK, width: 1 * s });
    } else if (role === 'porter') {
      // Pillbox hat
      g.roundRect(-8 * s, hatTop - 5 * s, 16 * s, 7 * s, 2 * s);
      g.fill(config.hatColor);
      g.stroke({ color: INK, width: 1 * s });
    } else {
      // Conductor / engineer / ticket collector flat cap
      g.roundRect(-10 * s, hatTop - 6 * s, 20 * s, 8 * s, 2 * s);
      g.fill(config.hatColor);
      g.rect(-8 * s, hatTop + 1 * s, 16 * s, 3 * s);
      g.fill(config.hatColor);
    }
  } else {
    // Short hair
    g.arc(0, headY - 2 * s, headR + 1 * s, -Math.PI, 0);
    g.fill(0x3E2F1C);
  }

  container.addChild(g);
  return container;
}

function drawAccessory(
  g: Graphics,
  accessory: string,
  shoulderL: number,
  shoulderR: number,
  shoulderY: number,
  s: number,
): void {
  switch (accessory) {
    case 'lantern':
      // Left arm down
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 4 * s, shoulderY + 18 * s);
      // Right arm holding lantern out
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 10 * s, shoulderY + 10 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Lantern
      g.circle(shoulderR + 10 * s, shoulderY + 10 * s, 4 * s);
      g.fill(0xE8913A);
      g.circle(shoulderR + 10 * s, shoulderY + 10 * s, 8 * s);
      g.fill({ color: 0xE8913A, alpha: 0.2 });
      break;

    case 'flag':
      // Left arm down
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 4 * s, shoulderY + 18 * s);
      // Right arm up holding flag
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 6 * s, shoulderY - 4 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Flag pole
      g.moveTo(shoulderR + 6 * s, shoulderY - 4 * s);
      g.lineTo(shoulderR + 6 * s, shoulderY - 20 * s);
      g.stroke({ color: 0x6B4226, width: 2 * s });
      // Flag
      g.moveTo(shoulderR + 6 * s, shoulderY - 20 * s);
      g.lineTo(shoulderR + 18 * s, shoulderY - 16 * s);
      g.lineTo(shoulderR + 6 * s, shoulderY - 12 * s);
      g.closePath();
      g.fill(0xD64045);
      g.stroke({ color: INK, width: 1 * s });
      break;

    case 'tray':
      // Both arms forward carrying tray
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL + 4 * s, shoulderY + 12 * s);
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR - 4 * s, shoulderY + 12 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Tray
      g.roundRect(-8 * s, shoulderY + 11 * s, 16 * s, 2 * s, 1 * s);
      g.fill(0x8C8C8C);
      g.stroke({ color: INK, width: 1 * s });
      // Items on tray
      g.circle(-3 * s, shoulderY + 9 * s, 2.5 * s);
      g.circle(3 * s, shoulderY + 9 * s, 2.5 * s);
      g.fill(0xF4C542);
      break;

    case 'spatula':
      // Left arm akimbo
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 8 * s, shoulderY + 10 * s);
      g.lineTo(shoulderL - 2 * s, shoulderY + 16 * s);
      // Right arm holding spatula
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 8 * s, shoulderY + 6 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Spatula
      g.moveTo(shoulderR + 8 * s, shoulderY + 6 * s);
      g.lineTo(shoulderR + 14 * s, shoulderY + 2 * s);
      g.stroke({ color: 0x8C8C8C, width: 2 * s });
      g.roundRect(shoulderR + 13 * s, shoulderY - 2 * s, 6 * s, 8 * s, 1 * s);
      g.fill(0x8C8C8C);
      g.stroke({ color: INK, width: 1 * s });
      break;

    case 'luggage_cart':
      // Both arms pushing forward
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 2 * s, shoulderY + 14 * s);
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 12 * s, shoulderY + 14 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Cart handle
      g.moveTo(shoulderR + 12 * s, shoulderY + 14 * s);
      g.lineTo(shoulderR + 12 * s, shoulderY + 22 * s);
      g.stroke({ color: 0x8C8C8C, width: 2 * s });
      // Cart platform
      g.roundRect(shoulderR + 8 * s, shoulderY + 22 * s, 16 * s, 4 * s, 1 * s);
      g.fill(0x6B4226);
      g.stroke({ color: INK, width: 1 * s });
      // Wheel
      g.circle(shoulderR + 22 * s, shoulderY + 28 * s, 3 * s);
      g.fill(0x2E2E38);
      g.stroke({ color: INK, width: 1 * s });
      // Luggage on cart
      g.roundRect(shoulderR + 10 * s, shoulderY + 16 * s, 8 * s, 6 * s, 2 * s);
      g.fill(0x6B4226);
      g.stroke({ color: INK, width: 1 * s });
      break;

    case 'shovel':
      // Left arm down
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 4 * s, shoulderY + 18 * s);
      // Right arm holding shovel
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 6 * s, shoulderY + 12 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Shovel handle
      g.moveTo(shoulderR + 6 * s, shoulderY + 12 * s);
      g.lineTo(shoulderR + 16 * s, shoulderY + 22 * s);
      g.stroke({ color: 0x6B4226, width: 2 * s });
      // Shovel head
      g.roundRect(shoulderR + 14 * s, shoulderY + 20 * s, 8 * s, 6 * s, 2 * s);
      g.fill(0x8C8C8C);
      g.stroke({ color: INK, width: 1 * s });
      break;

    case 'ticket':
      // Left arm holding ticket up
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 6 * s, shoulderY + 6 * s);
      // Right arm down
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 4 * s, shoulderY + 18 * s);
      g.stroke({ color: INK, width: 2 * s });
      // Ticket
      g.roundRect(shoulderL - 10 * s, shoulderY + 3 * s, 8 * s, 5 * s, 1 * s);
      g.fill(0xFDF6E3);
      g.stroke({ color: INK, width: 1 * s });
      break;

    default:
      // Arms hanging down
      g.moveTo(shoulderL, shoulderY);
      g.lineTo(shoulderL - 4 * s, shoulderY + 20 * s);
      g.moveTo(shoulderR, shoulderY);
      g.lineTo(shoulderR + 4 * s, shoulderY + 20 * s);
      g.stroke({ color: INK, width: 2 * s });
  }
}
