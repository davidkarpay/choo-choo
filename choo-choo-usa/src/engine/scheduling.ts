/**
 * scheduling.ts
 *
 * Dynamic route assignment for trains. Replaces the hardcoded
 * TRAIN_ROUTE_MAP with a flexible system that uses each train's
 * preferredRouteIds, an optional routeSequence, or round-robin
 * fallback assignment.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - useRouteStore: route data for validation
 *   - useNetworkStore: network graph for multi-corridor journeys
 *   - types/train: TrainSeedData for preferredRouteIds
 *   - types/network: NetworkPath for journey planning
 */

import { useRouteStore } from '../stores/useRouteStore';
import { useNetworkStore } from '../stores/useNetworkStore';
import type { Train } from '../types/train';
import type { Route } from '../types/route';
import type { NetworkPath } from '../types/network';

/**
 * Result of route assignment: which route to run today, and optionally
 * a multi-corridor journey plan if the route spans multiple corridors.
 */
export interface RouteAssignment {
  /** Primary route ID to start on. */
  routeId: string;
  /** If set, this is a multi-corridor journey with route IDs for each leg. */
  journeyRoutes?: string[];
}

/** Track which preferredRouteId index each train used last (for round-robin). */
const lastPreferredIndex = new Map<string, number>();

/**
 * Get the assigned route for a train on a given day.
 *
 * Priority:
 *   1. Train's preferredRouteIds, round-robin by day
 *   2. Any route matching the train's cargo capability
 *   3. null if no valid route found
 *
 * Args:
 *   train: The train to assign a route to.
 *   dayNumber: Current simulation day (used for round-robin).
 *
 * Returns:
 *   RouteAssignment with the route to run, or null if no route fits.
 */
export function getAssignedRoute(
  train: Train,
  dayNumber: number,
): RouteAssignment | null {
  const routeStore = useRouteStore.getState();
  const routes = routeStore.routes;

  // Priority 1: Use preferredRouteIds (round-robin by day)
  if (train.preferredRouteIds && train.preferredRouteIds.length > 0) {
    const validPreferred = train.preferredRouteIds.filter(
      (rid) => routeStore.getRouteById(rid) !== undefined
    );

    if (validPreferred.length > 0) {
      const index = dayNumber % validPreferred.length;
      lastPreferredIndex.set(train.id, index);
      const routeId = validPreferred[index];
      return { routeId };
    }
  }

  // Priority 2: Find a matching route by cargo capability and operator
  const matchingRoutes = findMatchingRoutes(train, routes);
  if (matchingRoutes.length > 0) {
    const index = dayNumber % matchingRoutes.length;
    return { routeId: matchingRoutes[index].id };
  }

  return null;
}

/**
 * Plan a multi-corridor journey between two stations for a train.
 * Uses the network graph to find a path and returns the route IDs.
 *
 * Args:
 *   fromStationId: Starting station.
 *   toStationId: Destination station.
 *
 * Returns:
 *   Array of route IDs forming the journey, or null if no path.
 */
export function planJourney(
  fromStationId: string,
  toStationId: string,
): NetworkPath | null {
  const networkStore = useNetworkStore.getState();
  return networkStore.findPath(fromStationId, toStationId);
}

/**
 * Find routes that match a train's capabilities.
 * Considers cargo types, operator affinity, and route type (freight/passenger).
 *
 * Args:
 *   train: Train to match.
 *   routes: All available routes.
 *
 * Returns:
 *   Filtered list of compatible routes, best matches first.
 */
function findMatchingRoutes(train: Train, routes: Route[]): Route[] {
  const isPassengerTrain = train.category === 'passenger' ||
    (train.cargoCapability.length === 1 && train.cargoCapability[0] === 'passengers');

  return routes.filter((route) => {
    // Passenger trains should prefer passenger/mixed routes
    if (isPassengerTrain) {
      return route.type === 'passenger' || route.type === 'mixed';
    }

    // Freight trains: check cargo compatibility
    const routeCargoTypes = route.primaryCargoTypes;
    const hasMatchingCargo = routeCargoTypes.some(
      (ct) => train.cargoCapability.includes(ct)
    );
    if (!hasMatchingCargo) return false;

    // Prefer same operator
    if (train.operator && route.operator) {
      return route.operator === train.operator || route.type === 'mixed';
    }

    return true;
  }).sort((a, b) => {
    // Sort: same operator first, then by cargo match count
    const aOperatorMatch = (a.operator === train.operator) ? 0 : 1;
    const bOperatorMatch = (b.operator === train.operator) ? 0 : 1;
    if (aOperatorMatch !== bOperatorMatch) return aOperatorMatch - bOperatorMatch;

    const aCargoMatch = a.primaryCargoTypes.filter((ct) => train.cargoCapability.includes(ct)).length;
    const bCargoMatch = b.primaryCargoTypes.filter((ct) => train.cargoCapability.includes(ct)).length;
    return bCargoMatch - aCargoMatch;
  });
}

/**
 * Get the next route in a multi-corridor journey.
 *
 * Args:
 *   journeyRoutes: Array of route IDs forming the journey.
 *   currentLeg: Current leg index (0-based).
 *
 * Returns:
 *   Next route ID, or null if journey is complete.
 */
export function getNextJourneyLeg(
  journeyRoutes: string[],
  currentLeg: number,
): string | null {
  const nextIndex = currentLeg + 1;
  if (nextIndex >= journeyRoutes.length) return null;
  return journeyRoutes[nextIndex];
}

/**
 * Check if a train has completed its multi-corridor journey.
 */
export function isJourneyComplete(
  journeyRoutes: string[] | undefined,
  currentLeg: number,
): boolean {
  if (!journeyRoutes || journeyRoutes.length === 0) return true;
  return currentLeg >= journeyRoutes.length - 1;
}
