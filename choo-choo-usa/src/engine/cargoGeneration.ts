/**
 * cargoGeneration.ts
 *
 * Generates cargo shipments from station industries once per simulated
 * hour. Each industry with a non-zero productionRate has a random
 * chance to produce a batch of cargo that gets placed into the station's
 * waiting queue for pickup by passing trains.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - useStationStore: station industry data
 *   - useCargoStore: shipment storage
 *   - useRouteStore: route data for destination matching
 */

import { useStationStore } from '../stores/useStationStore';
import { useCargoStore } from '../stores/useCargoStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useNetworkStore } from '../stores/useNetworkStore';
import type { CargoType, CargoShipment } from '../types/cargo';
import type { Station } from '../types/station';

let nextShipmentId = 1;

function makeShipmentId(): string {
  return `cargo-${nextShipmentId++}`;
}

/**
 * Find a destination station that consumes the given cargo type.
 * Uses the network graph to find reachable destinations.
 * Prefers stations on the same route for simpler logistics,
 * but can route across junctions if needed.
 *
 * Args:
 *   originStationId: Where the cargo was produced.
 *   cargoType: What kind of cargo to deliver.
 *   allStations: All station data.
 *
 * Returns:
 *   Destination station ID, or null if none found.
 */
function findDestination(
  originStationId: string,
  cargoType: CargoType,
  allStations: Station[],
): string | null {
  const routes = useRouteStore.getState().routes;
  const networkStore = useNetworkStore.getState();

  // Find routes that serve this origin station
  const originRoutes = routes.filter((r) => r.stationIds.includes(originStationId));

  // Get network-reachable stations (if network is initialized)
  const reachable = networkStore.initialized
    ? networkStore.getReachableStations(originStationId)
    : null;

  // Collect candidate stations that consume this cargo type
  const candidates: { stationId: string; sameRoute: boolean; reachable: boolean }[] = [];

  for (const station of allStations) {
    if (station.id === originStationId) continue;
    const consumes = station.industries.some((ind) => ind.consumes.includes(cargoType));
    if (!consumes) continue;

    const sameRoute = originRoutes.some((r) => r.stationIds.includes(station.id));
    const isReachable = reachable ? reachable.has(station.id) : sameRoute;

    // Only consider reachable destinations
    if (!isReachable && !sameRoute) continue;

    candidates.push({ stationId: station.id, sameRoute, reachable: isReachable });
  }

  if (candidates.length === 0) return null;

  // Prefer same-route destinations (75% chance if available)
  const sameRouteCandidates = candidates.filter((c) => c.sameRoute);
  if (sameRouteCandidates.length > 0 && Math.random() < 0.75) {
    return sameRouteCandidates[Math.floor(Math.random() * sameRouteCandidates.length)].stationId;
  }

  // Otherwise pick from all reachable candidates
  const reachableCandidates = candidates.filter((c) => c.reachable);
  if (reachableCandidates.length > 0) {
    return reachableCandidates[Math.floor(Math.random() * reachableCandidates.length)].stationId;
  }

  return candidates[Math.floor(Math.random() * candidates.length)].stationId;
}

/**
 * Generate cargo from all station industries. Called once per sim-hour.
 * Each industry with productionRate > 0 rolls for production.
 *
 * Args:
 *   clock: Current simulation clock (minutes).
 */
export function generateCargo(clock: number): void {
  const stationStore = useStationStore.getState();
  const cargoStore = useCargoStore.getState();

  // Respect the cap
  if (cargoStore.getActiveCount() >= 500) return;

  for (const station of stationStore.stations) {
    for (const industry of station.industries) {
      if (industry.productionRate <= 0 || industry.produces.length === 0) continue;

      // Roll for production
      if (Math.random() > industry.productionRate) continue;

      for (const cargoType of industry.produces) {
        // Random quantity within the industry's batch range
        const quantity = industry.minBatch +
          Math.floor(Math.random() * (industry.maxBatch - industry.minBatch + 1));

        if (quantity <= 0) continue;

        const destinationId = findDestination(station.id, cargoType, stationStore.stations);
        if (!destinationId) continue;

        // Find the consuming industry at the destination
        const destStation = stationStore.getStationById(destinationId);
        const destIndustry = destStation?.industries.find((ind) => ind.consumes.includes(cargoType));

        const shipment: CargoShipment = {
          id: makeShipmentId(),
          type: cargoType,
          quantity,
          unit: 'tons',
          originStationId: station.id,
          destinationStationId: destinationId,
          assignedTrainId: null,
          status: 'waiting',
          createdAt: clock,
          loadedAt: null,
          deliveredAt: null,
          industrySource: industry.name,
          industryDestination: destIndustry?.name ?? 'Unknown',
        };

        cargoStore.addShipment(shipment);
        stationStore.addWaitingCargo(station.id, shipment.id);

        // Check cap again
        if (cargoStore.getActiveCount() >= 500) return;
      }
    }
  }
}
