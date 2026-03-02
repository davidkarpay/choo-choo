/**
 * cargoCapacity.ts
 *
 * Constants and helpers for train cargo capacity. Defines how many
 * units of each cargo type fit in one rail car, and computes how many
 * cars a shipment needs and how much capacity a train has remaining.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - cargo types
 *   - train types
 */

import type { CargoType } from '../types/cargo';
import type { Train } from '../types/train';

/** Tons (or units) that fit in a single rail car, by cargo type. */
export const UNITS_PER_CAR: Record<CargoType, number> = {
  coal: 100,
  grain: 80,
  produce: 25,
  livestock: 30,
  automobiles: 10,
  steel: 60,
  fuel: 50,
  chemicals: 40,
  lumber: 35,
  packages: 20,
  passengers: 50,
};

/**
 * How many cars are needed to carry a given quantity of cargo.
 *
 * Args:
 *   type: The cargo type.
 *   quantity: Number of units to haul.
 *
 * Returns:
 *   Number of rail cars (rounded up).
 */
export function carsRequired(type: CargoType, quantity: number): number {
  const perCar = UNITS_PER_CAR[type] ?? 20;
  return Math.ceil(quantity / perCar);
}

/**
 * How many rail cars the train has available (not used by current cargo).
 *
 * Args:
 *   train: The train to check.
 *
 * Returns:
 *   Number of free car slots.
 */
export function availableCars(train: Train): number {
  let usedCars = 0;
  for (const shipment of train.cargoManifest) {
    usedCars += carsRequired(shipment.type, shipment.quantity);
  }
  return Math.max(0, train.maxCars - usedCars);
}
