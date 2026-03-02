/**
 * geo.ts
 *
 * Geographic calculation utilities for interpolating train positions
 * along GeoJSON LineString corridors. Uses the Haversine formula for
 * distance and bearing calculations without external dependencies.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - None (pure math)
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Haversine distance between two [lng, lat] points, in miles.
 *
 * Args:
 *   a: [longitude, latitude] of point A
 *   b: [longitude, latitude] of point B
 *
 * Returns:
 *   Distance in miles.
 */
export function haversineDistance(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = (lat2 - lat1) * DEG2RAD;
  const dLng = (lng2 - lng1) * DEG2RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1 * DEG2RAD) * Math.cos(lat2 * DEG2RAD) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/**
 * Bearing from point A to point B in degrees (0 = north, 90 = east).
 *
 * Args:
 *   a: [longitude, latitude]
 *   b: [longitude, latitude]
 *
 * Returns:
 *   Bearing in degrees [0, 360).
 */
export function bearing(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLng = (lng2 - lng1) * DEG2RAD;
  const lat1R = lat1 * DEG2RAD;
  const lat2R = lat2 * DEG2RAD;
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  return ((Math.atan2(y, x) * RAD2DEG) + 360) % 360;
}

/**
 * Calculate cumulative segment distances along a LineString.
 *
 * Args:
 *   coords: Array of [lng, lat] coordinates forming the line.
 *
 * Returns:
 *   Array of cumulative distances (in miles) from the start.
 *   First element is always 0. Length equals coords.length.
 */
export function cumulativeDistances(coords: [number, number][]): number[] {
  const distances = [0];
  for (let i = 1; i < coords.length; i++) {
    distances.push(distances[i - 1] + haversineDistance(coords[i - 1], coords[i]));
  }
  return distances;
}

/**
 * Interpolate a position along a GeoJSON LineString at parameter t (0-1).
 *
 * Uses linear interpolation between coordinate vertices, weighted by
 * cumulative distance so t=0.5 is the geographic midpoint, not the
 * midpoint of the vertex array.
 *
 * Args:
 *   coords: Array of [lng, lat] coordinates forming the route.
 *   t: Parametric position from 0.0 (start) to 1.0 (end).
 *
 * Returns:
 *   { position: [lat, lng], heading: degrees } where position uses
 *   Leaflet's [lat, lng] convention and heading is compass bearing.
 */
export function interpolateAlongRoute(
  coords: [number, number][],
  t: number
): { position: [number, number]; heading: number } {
  if (coords.length === 0) {
    return { position: [0, 0], heading: 0 };
  }
  if (coords.length === 1 || t <= 0) {
    const c = coords[0];
    const nextHeading = coords.length > 1 ? bearing(coords[0], coords[1]) : 0;
    return { position: [c[1], c[0]], heading: nextHeading };
  }
  if (t >= 1) {
    const c = coords[coords.length - 1];
    const prevHeading = bearing(coords[coords.length - 2], coords[coords.length - 1]);
    return { position: [c[1], c[0]], heading: prevHeading };
  }

  const cumDist = cumulativeDistances(coords);
  const totalDist = cumDist[cumDist.length - 1];
  const targetDist = t * totalDist;

  // Find the segment containing targetDist
  let segIndex = 0;
  for (let i = 1; i < cumDist.length; i++) {
    if (cumDist[i] >= targetDist) {
      segIndex = i - 1;
      break;
    }
  }

  const segStart = cumDist[segIndex];
  const segEnd = cumDist[segIndex + 1];
  const segLen = segEnd - segStart;
  const segT = segLen > 0 ? (targetDist - segStart) / segLen : 0;

  const a = coords[segIndex];
  const b = coords[segIndex + 1];

  // Linear interpolation of lng/lat along this segment
  const lng = a[0] + (b[0] - a[0]) * segT;
  const lat = a[1] + (b[1] - a[1]) * segT;

  const hdg = bearing(a, b);

  // Return [lat, lng] for Leaflet
  return { position: [lat, lng], heading: hdg };
}

/**
 * Total length of a GeoJSON LineString in miles.
 */
export function routeLengthMiles(coords: [number, number][]): number {
  const cumDist = cumulativeDistances(coords);
  return cumDist[cumDist.length - 1] || 0;
}
