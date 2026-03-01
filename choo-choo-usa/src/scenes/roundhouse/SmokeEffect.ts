/**
 * Smoke particle system for train smokestacks.
 *
 * Each particle: radial gradient circle, Steam White (#F0EDE4) center fading to transparent.
 * Particles expand, drift upward, and fade as described in the style guide.
 * Uses object pooling for performance (max 200 particles on screen).
 */

import { Container, Graphics } from 'pixi.js';

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  active: boolean;
  graphic: Graphics;
}

const MAX_PARTICLES = 200;
const STEAM_WHITE = 0xF0EDE4;

export class SmokeEffect {
  container: Container;
  private particles: SmokeParticle[] = [];
  private pool: SmokeParticle[] = [];

  /** Emission point relative to the parent container. */
  emitX = 0;
  emitY = 0;
  /** Puffs per second. Scales with train speed. */
  emissionRate = 4;
  /** Is this emitter actively producing smoke? */
  active = false;
  /** Wind drift direction (pixels/sec). */
  windX = 15;
  /** Intensity multiplier: 0 (off) to 1 (full). */
  intensity = 1;

  private timeSinceLastEmit = 0;

  constructor() {
    this.container = new Container();

    // Pre-allocate pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const g = new Graphics();
      g.circle(0, 0, 1);
      g.fill({ color: STEAM_WHITE, alpha: 0.7 });
      g.visible = false;
      this.container.addChild(g);
      this.pool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        size: 1, maxSize: 1, alpha: 0,
        rotation: 0, rotationSpeed: 0,
        life: 0, maxLife: 1, active: false,
        graphic: g,
      });
    }
  }

  private emit() {
    // Find an inactive particle from the pool
    const p = this.pool.find((p) => !p.active);
    if (!p) return;

    p.active = true;
    p.x = this.emitX + (Math.random() - 0.5) * 6;
    p.y = this.emitY;
    p.vx = this.windX + (Math.random() - 0.5) * 20;
    p.vy = -(40 + Math.random() * 40); // Rise speed: 40-80 px/sec
    p.size = 20 + Math.random() * 10; // Initial size: 20-30px
    p.maxSize = 80 + Math.random() * 40; // Final size: 80-120px
    p.alpha = 0.7 * this.intensity;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotationSpeed = (0.5 + Math.random() * 1.5) * (Math.PI / 180); // 0.5-2 deg/frame
    p.life = 0;
    p.maxLife = 2 + Math.random() * 2; // 2-4 seconds

    p.graphic.visible = true;
    this.particles.push(p);
  }

  update(dt: number) {
    // Cap dt to prevent burst emissions after tab backgrounding
    dt = Math.min(dt, 0.1);

    if (this.active && this.intensity > 0) {
      this.timeSinceLastEmit += dt;
      const interval = 1 / this.emissionRate;
      let emitCount = 0;
      while (this.timeSinceLastEmit >= interval && emitCount < 10) {
        this.emit();
        this.timeSinceLastEmit -= interval;
        emitCount++;
      }
      // Drain any remaining accumulated time to prevent catch-up burst next frame
      if (emitCount >= 10) {
        this.timeSinceLastEmit = 0;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        p.active = false;
        p.graphic.visible = false;
        this.particles.splice(i, 1);
        continue;
      }

      const t = p.life / p.maxLife; // 0 to 1

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Slow down rise over time (arc path)
      p.vy *= 0.998;

      // Expand
      const currentSize = p.size + (p.maxSize - p.size) * t;

      // Fade out
      const fadeAlpha = p.alpha * (1 - t);

      p.rotation += p.rotationSpeed;

      // Update graphic
      const g = p.graphic;
      g.clear();
      g.circle(0, 0, currentSize / 2);
      // Slight warm tint variation
      const tint = Math.random() > 0.5 ? 0xF0EDE4 : 0xF5F0E8;
      g.fill({ color: tint, alpha: fadeAlpha });
      g.x = p.x;
      g.y = p.y;
      g.rotation = p.rotation;
    }
  }

  /** Remove all particles immediately. */
  clear() {
    for (const p of this.particles) {
      p.active = false;
      p.graphic.visible = false;
    }
    this.particles.length = 0;
  }

  destroy() {
    this.clear();
    this.container.destroy({ children: true });
  }
}
