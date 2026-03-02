/**
 * geojson-processor.ts
 *
 * Functions for processing GeoJSON geometry: merging disconnected ways into
 * continuous LineStrings, simplifying polylines with Douglas-Peucker, and
 * validating coordinates.
 *
 * Part of: Choo-Choo USA (Extract Rail Data Pipeline)
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - None (pure geometry functions, no external libraries)
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A coordinate pair: [longitude, latitude] per GeoJSON spec. */
export type Coordinate = [number, number];

export interface LineString {
  type: 'LineString';
  coordinates: Coordinate[];
}

// ---------------------------------------------------------------------------
// Coordinate validation
// ---------------------------------------------------------------------------

/**
 * Validates that a coordinate is a plausible [longitude, latitude] pair
 * within the Continental US bounding box.
 *
 * Args:
 *   coord: A [longitude, latitude] array.
 *
 * Returns:
 *   True if the coordinate falls within reasonable CONUS bounds.
 *
 * Note:
 *   Uses a generous bounding box that includes parts of Canada and Mexico
 *   to accommodate rail corridors that curve near borders.
 */
export function isValidConusCoordinate(coord: Coordinate): boolean {
  const [lng, lat] = coord;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  // Generous CONUS bounds: lat 23-50, lng -130 to -65
  return lat >= 23 && lat <= 50 && lng >= -130 && lng <= -65;
}

/**
 * Validates every coordinate in a LineString.
 *
 * Args:
 *   line: A GeoJSON LineString object.
 *
 * Returns:
 *   An array of indices where invalid coordinates were found.
 *   Empty array means all coordinates are valid.
 */
export function validateLineString(line: LineString): number[] {
  const invalid: number[] = [];
  for (let i = 0; i < line.coordinates.length; i++) {
    if (!isValidConusCoordinate(line.coordinates[i])) {
      invalid.push(i);
    }
  }
  return invalid;
}

// ---------------------------------------------------------------------------
// Way merging
// ---------------------------------------------------------------------------

/**
 * Merges an array of disconnected LineStrings (e.g., from Overpass way results)
 * into a single continuous LineString by connecting endpoints.
 *
 * The algorithm:
 * 1. Start with the first segment.
 * 2. Find the segment whose start or end is closest to the current chain's
 *    endpoints.
 * 3. Append (or prepend) that segment, flipping it if needed.
 * 4. Repeat until all segments are consumed.
 *
 * Args:
 *   segments: Array of LineString objects to merge.
 *
 * Returns:
 *   A single merged LineString. Coordinates are deduplicated at junctions.
 *
 * Note:
 *   This is a greedy nearest-neighbor approach. It works well for rail
 *   corridors where ways are roughly sequential, but may produce odd
 *   results for complex junctions. For production use, consider using
 *   the relation-member ordering from OSM instead.
 */
export function mergeLineStrings(segments: LineString[]): LineString {
  if (segments.length === 0) {
    return { type: 'LineString', coordinates: [] };
  }
  if (segments.length === 1) {
    return { type: 'LineString', coordinates: [...segments[0].coordinates] };
  }

  const remaining = segments.map((s) => ({ coords: [...s.coordinates] }));
  const merged: Coordinate[] = [...remaining[0].coords];
  remaining.splice(0, 1);

  while (remaining.length > 0) {
    const chainStart = merged[0];
    const chainEnd = merged[merged.length - 1];

    let bestIdx = 0;
    let bestDist = Infinity;
    let bestEnd: 'start' | 'end' = 'end';
    let bestFlip = false;

    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i].coords;
      const segStart = seg[0];
      const segEnd = seg[seg.length - 1];

      // Try appending to chain end
      const dEndToStart = haversineDistance(chainEnd, segStart);
      if (dEndToStart < bestDist) {
        bestDist = dEndToStart;
        bestIdx = i;
        bestEnd = 'end';
        bestFlip = false;
      }
      const dEndToEnd = haversineDistance(chainEnd, segEnd);
      if (dEndToEnd < bestDist) {
        bestDist = dEndToEnd;
        bestIdx = i;
        bestEnd = 'end';
        bestFlip = true;
      }

      // Try prepending to chain start
      const dStartToEnd = haversineDistance(chainStart, segEnd);
      if (dStartToEnd < bestDist) {
        bestDist = dStartToEnd;
        bestIdx = i;
        bestEnd = 'start';
        bestFlip = false;
      }
      const dStartToStart = haversineDistance(chainStart, segStart);
      if (dStartToStart < bestDist) {
        bestDist = dStartToStart;
        bestIdx = i;
        bestEnd = 'start';
        bestFlip = true;
      }
    }

    let newCoords = remaining[bestIdx].coords;
    if (bestFlip) {
      newCoords = [...newCoords].reverse();
    }

    // Skip duplicate junction point
    if (bestEnd === 'end') {
      if (coordsEqual(merged[merged.length - 1], newCoords[0])) {
        newCoords = newCoords.slice(1);
      }
      merged.push(...newCoords);
    } else {
      if (coordsEqual(merged[0], newCoords[newCoords.length - 1])) {
        newCoords = newCoords.slice(0, -1);
      }
      merged.unshift(...newCoords);
    }

    remaining.splice(bestIdx, 1);
  }

  return { type: 'LineString', coordinates: merged };
}

// ---------------------------------------------------------------------------
// Douglas-Peucker simplification
// ---------------------------------------------------------------------------

/**
 * Simplifies a polyline using the Douglas-Peucker algorithm.
 *
 * This reduces the number of points while preserving the overall shape.
 * A tolerance of 0.01 degrees (~1.1 km) produces a "simplified" version
 * suitable for small-scale map rendering. A tolerance of 0 preserves
 * all points.
 *
 * Args:
 *   coordinates: Array of [longitude, latitude] pairs.
 *   tolerance: Maximum perpendicular distance (in degrees) a point can
 *              deviate from the simplified line before it must be kept.
 *              Default: 0.01 (~1.1 km).
 *
 * Returns:
 *   A new array of coordinates with redundant points removed.
 *
 * Example:
 *   >>> const simplified = douglasPeucker(route.coordinates, 0.01);
 *   >>> console.log(`Reduced from ${route.coordinates.length} to ${simplified.length} points`);
 */
export function douglasPeucker(
  coordinates: Coordinate[],
  tolerance = 0.01,
): Coordinate[] {
  if (coordinates.length <= 2) {
    return [...coordinates];
  }

  // Find the point farthest from the line between first and last
  let maxDist = 0;
  let maxIdx = 0;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const dist = perpendicularDistance(coordinates[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    // Recursively simplify both halves
    const left = douglasPeucker(coordinates.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(coordinates.slice(maxIdx), tolerance);
    // Combine, removing duplicate junction point
    return [...left.slice(0, -1), ...right];
  } else {
    // All intermediate points are within tolerance; keep only endpoints
    return [first, last];
  }
}

// ---------------------------------------------------------------------------
// Helper: perpendicular distance from point to line segment
// ---------------------------------------------------------------------------

/**
 * Calculates the perpendicular distance (in degrees) from a point to
 * the line defined by two endpoints.
 *
 * Args:
 *   point: The point to measure from.
 *   lineStart: One end of the line segment.
 *   lineEnd: Other end of the line segment.
 *
 * Returns:
 *   Distance in degrees (approximate; treats coordinates as planar).
 *
 * Note:
 *   This uses a planar approximation which is acceptable for the small
 *   segments involved in Douglas-Peucker simplification at map scale.
 */
function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate,
): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // lineStart and lineEnd are the same point
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  const numerator = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx ** 2 + dy ** 2);
  return numerator / denominator;
}

// ---------------------------------------------------------------------------
// Helper: Haversine distance (meters) between two coordinates
// ---------------------------------------------------------------------------

/**
 * Calculates the great-circle distance between two [lng, lat] coordinates
 * using the Haversine formula.
 *
 * Args:
 *   a: First coordinate [longitude, latitude].
 *   b: Second coordinate [longitude, latitude].
 *
 * Returns:
 *   Distance in meters.
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6_371_000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);
  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDLng * sinHalfDLng;

  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------------------
// Helper: coordinate equality check
// ---------------------------------------------------------------------------

function coordsEqual(a: Coordinate, b: Coordinate): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
