/**
 * StationAmbient.ts
 *
 * Ambient effects for the station scene: birds arcing across the sky,
 * flag rippling, clock ticking, distant horns. Managed via update(dt)
 * called from the PixiJS ticker, and destroy() for cleanup.
 *
 * Part of: Choo-Choo USA — Phase 4
 *
 * Dependencies:
 *   - pixi.js: Graphics, Container
 *   - sound: playBirdChirp, playClockTick
 */

import { Container, Graphics } from 'pixi.js';
import { playBirdChirp, playClockTick } from '../../utils/sound';

interface Bird {
  g: Graphics;
  x: number;
  y: number;
  startX: number;
  speed: number;
  arcHeight: number;
  progress: number;
}

export class StationAmbient {
  container: Container;
  private birds: Bird[] = [];
  private birdTimer = 0;
  private clockTimer = 0;
  private sceneWidth: number;
  private destroyed = false;

  constructor(sceneWidth = 1600) {
    this.container = new Container();
    this.sceneWidth = sceneWidth;
  }

  update(dt: number): void {
    if (this.destroyed) return;

    // -- Birds --
    this.birdTimer += dt;
    if (this.birdTimer > 4 + Math.random() * 6) {
      this.spawnBird();
      this.birdTimer = 0;
    }

    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i];
      bird.progress += dt * bird.speed;
      bird.x = bird.startX + bird.progress * 150;
      bird.y = 60 + Math.sin(bird.progress * Math.PI) * bird.arcHeight;
      bird.g.x = bird.x;
      bird.g.y = bird.y;

      // Wing flap via rotation
      bird.g.rotation = Math.sin(bird.progress * 12) * 0.3;

      if (bird.x > this.sceneWidth + 50 || bird.x < -50) {
        this.container.removeChild(bird.g);
        bird.g.destroy();
        this.birds.splice(i, 1);
      }
    }

    // Occasional chirp
    if (this.birds.length > 0 && Math.random() < dt * 0.1) {
      playBirdChirp();
    }

    // -- Clock tick (once per ~real second) --
    this.clockTimer += dt;
    if (this.clockTimer > 1.0) {
      this.clockTimer = 0;
      playClockTick();
    }
  }

  private spawnBird(): void {
    const g = new Graphics();
    // Simple V-shaped bird
    g.moveTo(-6, 0);
    g.lineTo(0, -4);
    g.lineTo(6, 0);
    g.stroke({ color: 0x1A1A2E, width: 1.5 });

    const goingRight = Math.random() > 0.5;
    const startX = goingRight ? -30 : this.sceneWidth + 30;
    const speed = (0.3 + Math.random() * 0.4) * (goingRight ? 1 : -1);

    const bird: Bird = {
      g,
      x: startX,
      y: 60,
      startX,
      speed,
      arcHeight: -(30 + Math.random() * 40),
      progress: 0,
    };

    g.x = startX;
    g.y = 60;
    this.container.addChild(g);
    this.birds.push(bird);
  }

  destroy(): void {
    this.destroyed = true;
    for (const bird of this.birds) {
      bird.g.destroy();
    }
    this.birds = [];
    this.container.destroy({ children: true });
  }
}
