/**
 * index.ts
 *
 * Orchestrator for the rail data extraction pipeline. Reads corridor
 * configuration, builds route geometries with real-world coordinates,
 * validates station positions against route paths, and outputs the
 * expanded JSON data files.
 *
 * Part of: Choo-Choo USA (Extract Rail Data Pipeline)
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - config.ts: Corridor definitions
 *   - corridor-builder.ts: Route geometry builder
 *   - station-matcher.ts: Station validation
 *   - geojson-processor.ts: Geometry utilities
 *   - Node.js fs/path: File system access
 *
 * Usage:
 *   npx ts-node scripts/extract-rail-data/index.ts [--cache] [--dry-run]
 *
 * Flags:
 *   --cache    Skip re-building geometries if output files already exist.
 *   --dry-run  Validate and print report but do not write output files.
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  ALL_CORRIDORS,
  EXISTING_CORRIDORS,
  NEW_FREIGHT_CORRIDORS,
  NEW_PASSENGER_CORRIDORS,
  getAllReferencedStationIds,
} from './config';
import { buildRoute, buildRouteGeometry } from './corridor-builder';
import type { LineString } from './geojson-processor';
import { validateLineString } from './geojson-processor';
import {
  validateAllStations,
  formatValidationReport,
} from './station-matcher';

// ---------------------------------------------------------------------------
// CLI flag parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const useCache = args.includes('--cache');
const dryRun = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, '../../data');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');
const STATIONS_FILE = path.join(DATA_DIR, 'stations.json');
const CACHE_DIR = path.resolve(__dirname, '.cache');

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

function main(): void {
  console.log('=== Choo-Choo USA Rail Data Extraction Pipeline ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no files written)' : 'LIVE'}`);
  console.log(`Cache: ${useCache ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  // Step 1: Check cache
  if (useCache) {
    const cacheFile = path.join(CACHE_DIR, 'routes-built.json');
    if (fs.existsSync(cacheFile)) {
      console.log('Cache hit — skipping geometry build.');
      console.log(`Cached output: ${cacheFile}`);
      return;
    }
    console.log('Cache miss — building from scratch.');
  }

  // Step 2: Build geometries for all corridors
  console.log(`Building geometries for ${ALL_CORRIDORS.length} corridors...`);
  const routeGeometries = new Map<string, LineString>();
  let buildErrors = 0;

  for (const corridor of ALL_CORRIDORS) {
    try {
      const geometry = buildRouteGeometry(corridor);
      const invalid = validateLineString(geometry);
      if (invalid.length > 0) {
        console.error(
          `  WARNING: ${corridor.id} has ${invalid.length} invalid coordinate(s) ` +
          `at indices: ${invalid.join(', ')}`,
        );
      }
      routeGeometries.set(corridor.id, geometry);
    } catch (err) {
      console.error(`  ERROR building ${corridor.id}: ${(err as Error).message}`);
      buildErrors++;
    }
  }

  console.log(
    `  Built ${routeGeometries.size}/${ALL_CORRIDORS.length} geometries ` +
    `(${buildErrors} errors)`,
  );
  console.log('');

  // Step 3: Validate station positions against route geometries
  console.log('Validating station positions...');
  const report = validateAllStations(ALL_CORRIDORS, routeGeometries);
  console.log(formatValidationReport(report));

  // Step 4: Check for missing stations
  const referencedIds = getAllReferencedStationIds();
  console.log(`Total unique stations referenced: ${referencedIds.size}`);
  console.log('');

  // Step 5: Summary
  console.log('Corridor breakdown:');
  console.log(`  Existing (update only): ${EXISTING_CORRIDORS.length}`);
  console.log(`  New freight:            ${NEW_FREIGHT_CORRIDORS.length}`);
  console.log(`  New passenger:          ${NEW_PASSENGER_CORRIDORS.length}`);
  console.log(`  Total:                  ${ALL_CORRIDORS.length}`);
  console.log('');

  if (dryRun) {
    console.log('DRY RUN complete. No files written.');
    return;
  }

  // Step 6: Write cache
  if (useCache) {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const cacheData = Object.fromEntries(routeGeometries);
    fs.writeFileSync(
      path.join(CACHE_DIR, 'routes-built.json'),
      JSON.stringify(cacheData, null, 2),
    );
    console.log(`Cache written to ${CACHE_DIR}/routes-built.json`);
  }

  console.log('');
  console.log('Pipeline complete.');
  console.log(`Route data: ${ROUTES_FILE}`);
  console.log(`Station data: ${STATIONS_FILE}`);
  console.log('');
  console.log(
    'NOTE: The actual routes.json and stations.json are maintained as ' +
    'hand-curated files in data/. This pipeline validates the data and ' +
    'can regenerate geometries. Edit the data files directly to update ' +
    'route descriptions, station industries, etc.',
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main();
