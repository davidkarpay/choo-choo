/**
 * station-matcher.ts
 *
 * Validates station positions against corridor geometry and snaps stations
 * to the nearest point on their assigned routes. Ensures that every station
 * referenced by a corridor actually exists and has valid coordinates.
 *
 * Part of: Choo-Choo USA (Extract Rail Data Pipeline)
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - config.ts: Corridor definitions
 *   - corridor-builder.ts: Station coordinate lookup
 *   - geojson-processor.ts: Haversine distance calculation
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import type { CorridorConfig } from './config';
import type { Coordinate, LineString } from './geojson-processor';
import { haversineDistance } from './geojson-processor';
import { STATION_COORDS } from './corridor-builder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StationMatchResult {
  stationId: string;
  corridorId: string;
  /** Station's declared position [lng, lat] */
  stationPosition: Coordinate;
  /** Nearest point on the route geometry [lng, lat] */
  nearestPointOnRoute: Coordinate;
  /** Distance from station to nearest route point, in meters */
  distanceMeters: number;
  /** Whether the station is within acceptable snap tolerance */
  withinTolerance: boolean;
}

export interface ValidationReport {
  /** Total number of station-corridor pairs checked */
  totalChecked: number;
  /** Stations within tolerance */
  passed: StationMatchResult[];
  /** Stations beyond tolerance (may need position adjustment) */
  warnings: StationMatchResult[];
  /** Stations with no known coordinates */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Maximum acceptable distance (in meters) between a station and the
 * nearest point on its corridor geometry. Stations beyond this distance
 * generate warnings but are not automatically moved.
 *
 * 50 km is generous because our route geometries are simplified with
 * relatively few waypoints, so stations may be offset from the actual
 * rail path.
 */
const SNAP_TOLERANCE_METERS = 50_000; // 50 km

// ---------------------------------------------------------------------------
// Core matching logic
// ---------------------------------------------------------------------------

/**
 * Finds the nearest point on a LineString to a given station coordinate.
 *
 * The algorithm checks every segment of the polyline and finds the closest
 * point (either a vertex or the perpendicular projection onto a segment).
 *
 * Args:
 *   stationCoord: The station's [longitude, latitude].
 *   line: The route's GeoJSON LineString geometry.
 *
 * Returns:
 *   An object with the nearest coordinate and the distance in meters.
 */
export function findNearestPointOnLine(
  stationCoord: Coordinate,
  line: LineString,
): { point: Coordinate; distance: number } {
  let bestPoint: Coordinate = line.coordinates[0];
  let bestDist = haversineDistance(stationCoord, bestPoint);

  for (let i = 0; i < line.coordinates.length - 1; i++) {
    const a = line.coordinates[i];
    const b = line.coordinates[i + 1];

    // Project stationCoord onto segment a-b (planar approximation)
    const projected = projectPointOntoSegment(stationCoord, a, b);
    const dist = haversineDistance(stationCoord, projected);

    if (dist < bestDist) {
      bestDist = dist;
      bestPoint = projected;
    }
  }

  return { point: bestPoint, distance: bestDist };
}

/**
 * Projects a point onto a line segment, returning the closest point on
 * the segment. Uses planar math (acceptable for short segments).
 *
 * Args:
 *   p: The point to project [longitude, latitude].
 *   a: Segment start [longitude, latitude].
 *   b: Segment end [longitude, latitude].
 *
 * Returns:
 *   The closest point on segment a-b to point p.
 */
function projectPointOntoSegment(
  p: Coordinate,
  a: Coordinate,
  b: Coordinate,
): Coordinate {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // a and b are the same point
    return a;
  }

  // Parameter t of the projection along the segment [0, 1]
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return [a[0] + t * dx, a[1] + t * dy];
}

// ---------------------------------------------------------------------------
// Batch validation
// ---------------------------------------------------------------------------

/**
 * Validates all station positions against their corridor geometries.
 *
 * For every corridor, checks each referenced station to ensure:
 * 1. The station has known coordinates in STATION_COORDS.
 * 2. The station is within SNAP_TOLERANCE_METERS of its route geometry.
 *
 * Args:
 *   corridors: Array of CorridorConfig objects.
 *   routeGeometries: Map of corridor ID → built LineString geometry.
 *
 * Returns:
 *   A ValidationReport with passed, warnings, and errors.
 *
 * Example:
 *   >>> const report = validateAllStations(ALL_CORRIDORS, geometries);
 *   >>> console.log(`${report.warnings.length} stations need attention`);
 */
export function validateAllStations(
  corridors: CorridorConfig[],
  routeGeometries: Map<string, LineString>,
): ValidationReport {
  const report: ValidationReport = {
    totalChecked: 0,
    passed: [],
    warnings: [],
    errors: [],
  };

  for (const corridor of corridors) {
    const geometry = routeGeometries.get(corridor.id);
    if (!geometry) {
      report.errors.push(
        `No geometry found for corridor "${corridor.id}".`,
      );
      continue;
    }

    for (const stationId of corridor.stationIds) {
      report.totalChecked++;

      const stationCoord = STATION_COORDS[stationId];
      if (!stationCoord) {
        report.errors.push(
          `Station "${stationId}" (corridor "${corridor.id}") has no known coordinates.`,
        );
        continue;
      }

      const { point, distance } = findNearestPointOnLine(
        stationCoord,
        geometry,
      );

      const result: StationMatchResult = {
        stationId,
        corridorId: corridor.id,
        stationPosition: stationCoord,
        nearestPointOnRoute: point,
        distanceMeters: Math.round(distance),
        withinTolerance: distance <= SNAP_TOLERANCE_METERS,
      };

      if (result.withinTolerance) {
        report.passed.push(result);
      } else {
        report.warnings.push(result);
      }
    }
  }

  return report;
}

/**
 * Returns a human-readable summary of a validation report.
 *
 * Args:
 *   report: A ValidationReport from validateAllStations().
 *
 * Returns:
 *   A multi-line string summarizing the validation results.
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [
    `Station-Corridor Validation Report`,
    `===================================`,
    `Total pairs checked: ${report.totalChecked}`,
    `Passed (within ${SNAP_TOLERANCE_METERS / 1000}km): ${report.passed.length}`,
    `Warnings (beyond tolerance): ${report.warnings.length}`,
    `Errors (missing data): ${report.errors.length}`,
    '',
  ];

  if (report.warnings.length > 0) {
    lines.push('WARNINGS:');
    for (const w of report.warnings) {
      lines.push(
        `  - ${w.stationId} on ${w.corridorId}: ` +
        `${(w.distanceMeters / 1000).toFixed(1)}km from route`,
      );
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('ERRORS:');
    for (const e of report.errors) {
      lines.push(`  - ${e}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
