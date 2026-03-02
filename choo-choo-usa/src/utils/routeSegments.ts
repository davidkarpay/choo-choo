/**
 * routeSegments.ts
 *
 * Computes station positions along GeoJSON route geometry so trains
 * can travel segment-by-segment between stations rather than sliding
 * continuously. Each station maps to a fractional progress value (0-1)
 * along the route.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - geo.ts: cumulativeDistances, haversineDistance
 */

import { cumulativeDistances, haversineDistance } from './geo';
import type { Route } from '../types/route';
import type { Station } from '../types/station';

export interface StationProgress {
  stationId: string;
  progress: number; // 0.0 (route start) to 1.0 (route end)
}

/**
 * For each station on a route, compute its fractional position (0-1)
 * along the route's GeoJSON geometry by finding the nearest point
 * on the LineString to the station's geographic position.
 *
 * Args:
 *   route: The rail corridor with GeoJSON coordinates and stationIds.
 *   stations: All stations (used to look up positions).
 *
 * Returns:
 *   Ordered array of { stationId, progress } from start to end.
 *   Stations not found in the lookup are skipped.
 */
export function computeStationProgressMap(
  route: Route,
  stations: Station[],
): StationProgress[] {
  const coords = route.geometry.coordinates as [number, number][];
  if (coords.length < 2) return [];

  const cumDist = cumulativeDistances(coords);
  const totalDist = cumDist[cumDist.length - 1];
  if (totalDist === 0) return [];

  const stationMap = new Map(stations.map((s) => [s.id, s]));
  const result: StationProgress[] = [];

  for (const stationId of route.stationIds) {
    const station = stationMap.get(stationId);
    if (!station) continue;

    // Station position is [lat, lng]; route coords are [lng, lat]
    const stationLngLat: [number, number] = [station.position[1], station.position[0]];

    // Find nearest segment on the route and project the station onto it
    let bestDist = Infinity;
    let bestProgress = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      const segLen = cumDist[i + 1] - cumDist[i];

      if (segLen === 0) continue;

      // Project station onto segment (approximate with lng/lat as planar)
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const sx = stationLngLat[0] - a[0];
      const sy = stationLngLat[1] - a[1];
      let t = (sx * dx + sy * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t));

      const projLng = a[0] + dx * t;
      const projLat = a[1] + dy * t;
      const dist = haversineDistance(stationLngLat, [projLng, projLat]);

      if (dist < bestDist) {
        bestDist = dist;
        bestProgress = (cumDist[i] + segLen * t) / totalDist;
      }
    }

    // Also check each vertex directly (handles endpoint snapping)
    for (let i = 0; i < coords.length; i++) {
      const dist = haversineDistance(stationLngLat, coords[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestProgress = cumDist[i] / totalDist;
      }
    }

    result.push({ stationId, progress: Math.max(0, Math.min(1, bestProgress)) });
  }

  return result;
}

/** Dwell time in simulated minutes based on station size. */
export function getDwellMinutes(size: 'major_hub' | 'regional' | 'local'): number {
  switch (size) {
    case 'major_hub': return 15;
    case 'regional': return 10;
    case 'local': return 5;
  }
}
