/**
 * soundEvents.ts
 *
 * Wires the event bus to sound effects. Plays station bells on
 * arrival, loading clunks on cargo, and celebration chimes on
 * delivery milestones.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - events: event bus
 *   - sound: audio functions
 */

import { eventBus } from './events';
import { playStationBell, playLoadingSound, playCelebrationChime } from '../utils/sound';

let initialized = false;

/**
 * Initialize sound event listeners. Safe to call multiple times.
 */
export function initSoundEvents(): void {
  if (initialized) return;
  initialized = true;

  eventBus.on('train_arrived', () => {
    playStationBell();
  });

  eventBus.on('cargo_loaded', () => {
    playLoadingSound();
  });

  eventBus.on('cargo_delivered', () => {
    playCelebrationChime();
  });
}
