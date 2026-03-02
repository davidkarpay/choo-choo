/**
 * TrainAmbient.ts
 *
 * Ambient effects for the train interior scene: window parallax
 * advancement, car rocking, lamp swaying, firebox glow pulsing.
 * Managed via update(dt, clock) and destroy().
 *
 * Part of: Choo-Choo USA — Phase 4
 *
 * Dependencies:
 *   - pixi.js: Container
 *   - sound: playWheelClack
 */

import type { Container } from 'pixi.js';
import { playWheelClack } from '../../utils/sound';

export class TrainAmbient {
  private carContainers: Container[] = [];
  private speedMph = 0;
  private clackTimer = 0;
  private destroyed = false;

  /**
   * Args:
   *   cars: Array of car Container references for rocking animation.
   *   speedMph: Current train speed (used for sound/parallax pacing).
   */
  setCarContainers(cars: Container[]): void {
    this.carContainers = cars;
  }

  setSpeed(speedMph: number): void {
    this.speedMph = speedMph;
  }

  update(dt: number, clock: number): void {
    if (this.destroyed) return;

    // -- Car rocking --
    for (let i = 0; i < this.carContainers.length; i++) {
      const car = this.carContainers[i];
      // Gentle oscillation: ±1 degree, offset per car index
      car.rotation = Math.sin(clock * 0.8 + i * 0.5) * (Math.PI / 180);
    }

    // -- Wheel clack rhythm --
    if (this.speedMph > 0) {
      const clackInterval = Math.max(0.3, 1.5 - (this.speedMph / 80));
      this.clackTimer += dt;
      if (this.clackTimer >= clackInterval) {
        this.clackTimer = 0;
        playWheelClack(this.speedMph / 60);
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.carContainers = [];
  }
}
