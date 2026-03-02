# Rail Data Extraction Pipeline

Tooling for building and validating the Choo-Choo USA railroad corridor data. This pipeline reads corridor configuration, constructs GeoJSON route geometries from known real-world coordinates, validates station positions, and reports on data quality.

## Overview

The game's rail network data lives in `data/routes.json` and `data/stations.json`. These files are **hand-curated** with real geographic coordinates, narrator-voice descriptions, and industry data. This pipeline supports the curation process by:

1. Defining all target corridors in a single master config (`config.ts`)
2. Providing Overpass QL templates for future OSM data extraction (`overpass-queries.ts`)
3. Building route geometries from known station coordinates and waypoints (`corridor-builder.ts`)
4. Simplifying polylines with Douglas-Peucker for different zoom levels (`geojson-processor.ts`)
5. Validating that stations sit on or near their assigned routes (`station-matcher.ts`)
6. Orchestrating the full pipeline with CLI flags (`index.ts`)

## Files

| File | Purpose |
|------|---------|
| `config.ts` | Master corridor list: IDs, operators, types, station sequences, colors |
| `overpass-queries.ts` | Overpass QL reference templates for future OSM extraction |
| `geojson-processor.ts` | LineString merging, Douglas-Peucker simplification, coordinate validation |
| `corridor-builder.ts` | Builds route geometries from known coordinates and waypoints |
| `station-matcher.ts` | Validates station positions against route geometry |
| `index.ts` | CLI orchestrator that runs all pipeline steps |

## Prerequisites

- Node.js 18+
- TypeScript (`npm install -D typescript ts-node`)

## Running the Pipeline

From the project root (`choo-choo-usa/`):

```bash
# Full run: validate all data, report results
npx ts-node scripts/extract-rail-data/index.ts

# Dry run: validate only, do not write any files
npx ts-node scripts/extract-rail-data/index.ts --dry-run

# With cache: skip geometry rebuild if cache exists
npx ts-node scripts/extract-rail-data/index.ts --cache

# Both flags
npx ts-node scripts/extract-rail-data/index.ts --cache --dry-run
```

## Output

The pipeline reports:

- Number of corridors built (with any coordinate validation errors)
- Station-corridor validation report (which stations are within tolerance of their routes)
- Corridor breakdown by type (existing/freight/passenger)

The actual `routes.json` and `stations.json` files are maintained by hand. This pipeline validates the data but does not overwrite those files automatically.

## Corridor Configuration

All corridors are defined in `config.ts`. Each corridor has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique slug matching routes.json |
| `name` | string | Display name |
| `operator` | string | Operating railroad (BNSF, UP, CSX, NS, Amtrak) |
| `type` | string | 'freight', 'passenger', or 'mixed' |
| `stationIds` | string[] | Ordered station IDs along the route |
| `color` | string | Hex color for map rendering |
| `primaryCargoTypes` | string[] | What this corridor carries |
| `lengthMiles` | number | Approximate real-world distance |

## Overpass Queries

The `overpass-queries.ts` file contains reference templates for extracting rail data from OpenStreetMap via the Overpass API. These are not currently used in the pipeline (we hand-curate coordinates from known geography) but document the intended approach for future automation.

To use a query manually:

1. Go to [Overpass Turbo](https://overpass-turbo.eu/)
2. Copy a query template from `overpass-queries.ts`
3. Replace `{{bbox}}` with the appropriate bounding box (or use Overpass Turbo's map extent)
4. Run the query and export the GeoJSON result

## Adding a New Corridor

1. Add the corridor config to `config.ts` (in the appropriate array)
2. Add waypoint coordinates to `ROUTE_WAYPOINTS` in `corridor-builder.ts`
3. Add any new station coordinates to `STATION_COORDS` in `corridor-builder.ts`
4. Add the station entries to `data/stations.json`
5. Add the route entry to `data/routes.json`
6. Run the pipeline with `--dry-run` to validate
7. Run without `--dry-run` to cache the geometry

## Coordinate Conventions

**IMPORTANT**: The project uses two different coordinate orders:

| Context | Order | Example |
|---------|-------|---------|
| GeoJSON geometry (routes) | `[longitude, latitude]` | `[-87.6298, 41.8781]` (Chicago) |
| Leaflet station positions | `[latitude, longitude]` | `[41.8781, -87.6298]` (Chicago) |

This is an unavoidable mismatch between the GeoJSON spec (longitude-first) and Leaflet's convention (latitude-first). Always double-check which convention a given field uses.
