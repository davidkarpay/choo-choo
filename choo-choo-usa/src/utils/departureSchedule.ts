/**
 * departureSchedule.ts
 *
 * Derives departure/arrival schedule for a station from current simulation
 * state. Used by the DepartureBoard overlay in the station scene.
 *
 * Part of: Choo-Choo USA — Phase 4
 *
 * Dependencies:
 *   - useTrainStore: train positions and routes
 *   - useRouteStore: route definitions with station lists
 *   - useSimulationStore: current clock
 */

import { useTrainStore } from '../stores/useTrainStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useSimulationStore } from '../stores/useSimulationStore';

export interface ScheduleEntry {
  trainId: string;
  trainName: string;
  destination: string;
  estimatedTime: number;
  status: 'SCHEDULED' | 'APPROACHING' | 'BOARDING' | 'DELAYED';
}

/**
 * Get departure schedule entries for a given station.
 *
 * Derives schedule from:
 * - Trains currently at the station (status: BOARDING)
 * - Trains en_route whose route includes this station (estimated from progress + speed)
 * - Trains scheduled to pass through (from route data)
 *
 * Args:
 *   stationId: The station to get departures for.
 *
 * Returns:
 *   Array of schedule entries sorted by estimated time.
 */
export function getDeparturesForStation(stationId: string): ScheduleEntry[] {
  const trains = useTrainStore.getState().trains;
  const routes = useRouteStore.getState().routes;
  const clock = useSimulationStore.getState().clock;

  const entries: ScheduleEntry[] = [];

  for (const train of trains) {
    // Train currently at this station
    if (train.dwellStationId === stationId && train.status === 'at_station') {
      // Find where it's going next on its route
      const route = routes.find((r) => r.id === train.currentRouteId);
      const nextStation = getNextStationOnRoute(route, stationId);

      entries.push({
        trainId: train.id,
        trainName: train.name,
        destination: nextStation ?? 'End of Line',
        estimatedTime: clock + Math.max(0, train.dwellTimer),
        status: 'BOARDING',
      });
      continue;
    }

    // Train en_route heading toward this station
    if (train.status === 'en_route' && train.currentRouteId) {
      const route = routes.find((r) => r.id === train.currentRouteId);
      if (!route) continue;

      const stationIndex = route.stationIds.indexOf(stationId);
      if (stationIndex === -1) continue;

      // Check if train hasn't passed this station yet
      const trainSegment = train.currentSegmentIndex;
      if (trainSegment < stationIndex) {
        // Estimate time based on remaining segments and speed
        const remainingSegments = stationIndex - trainSegment;
        const segmentLengthMiles = route.lengthMiles / Math.max(1, route.stationIds.length - 1);
        const remainingMiles = segmentLengthMiles * (remainingSegments - train.segmentProgress);
        const minutesToArrive = (remainingMiles / train.speedMph) * 60;

        const nextStation = getNextStationOnRoute(route, stationId);
        const isApproaching = minutesToArrive < 15;

        entries.push({
          trainId: train.id,
          trainName: train.name,
          destination: nextStation ?? 'End of Line',
          estimatedTime: clock + minutesToArrive,
          status: isApproaching ? 'APPROACHING' : 'SCHEDULED',
        });
      }
    }
  }

  // Sort by estimated time
  entries.sort((a, b) => a.estimatedTime - b.estimatedTime);

  return entries;
}

function getNextStationOnRoute(
  route: { stationIds: string[] } | undefined,
  currentStationId: string,
): string | null {
  if (!route) return null;
  const idx = route.stationIds.indexOf(currentStationId);
  if (idx === -1 || idx >= route.stationIds.length - 1) return null;

  // Return the final destination of the route for display
  return route.stationIds[route.stationIds.length - 1]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Format a simulation clock time for display (e.g., "10:15 AM").
 */
export function formatScheduleTime(clock: number): string {
  const totalMinutes = clock % 1440;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
