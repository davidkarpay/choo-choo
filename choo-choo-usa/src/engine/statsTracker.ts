/**
 * statsTracker.ts
 *
 * Subscribes to the event bus and updates the stats store on cargo
 * deliveries, passenger arrivals, and day transitions. Should be
 * initialized once at application startup.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - events: event bus
 *   - useStatsStore: statistics state
 */

import { eventBus } from './events';
import { useStatsStore } from '../stores/useStatsStore';

let initialized = false;

/**
 * Initialize the stats tracker by subscribing to simulation events.
 * Safe to call multiple times — only sets up listeners once.
 */
export function initStatsTracker(): void {
  if (initialized) return;
  initialized = true;

  eventBus.on('cargo_delivered', (event) => {
    const quantity = (event.data.quantity as number) ?? 0;
    useStatsStore.getState().recordCargoDelivery(quantity);
  });

  eventBus.on('passenger_arrived', () => {
    useStatsStore.getState().recordPassengerDelivery();
  });

  eventBus.on('new_day', () => {
    useStatsStore.getState().resetDaily();
  });
}
