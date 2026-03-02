/**
 * overpass-queries.ts
 *
 * Overpass QL query templates for extracting railroad geometry from
 * OpenStreetMap. These are reference templates for future use when
 * transitioning from hand-curated coordinates to live OSM data.
 *
 * The actual game data in Phase 5/M2 is hand-curated from known geography
 * because Overpass queries return raw ways that require significant
 * post-processing (merging, simplification, gap-filling). These templates
 * document the intended extraction approach for future automation.
 *
 * Part of: Choo-Choo USA (Extract Rail Data Pipeline)
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - None (pure reference templates)
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverpassQuery {
  /** Human-readable label */
  name: string;
  /** What kind of rail data this query targets */
  category: 'freight_mainline' | 'passenger_corridor' | 'yard' | 'station';
  /** The raw Overpass QL string (use with Overpass API at overpass-api.de) */
  query: string;
  /** Explanation of what this query returns and any caveats */
  notes: string;
}

// ---------------------------------------------------------------------------
// Bounding boxes for major US rail regions (south, west, north, east)
// ---------------------------------------------------------------------------

export const BOUNDING_BOXES = {
  /** Continental US */
  conus: '24.396308,-124.848974,49.384358,-66.885444',
  /** Midwest + Great Plains (Chicago hub radiating west) */
  midwest: '36.0,-104.0,49.0,-84.0',
  /** Northeast Corridor (Boston to DC) */
  northeast: '38.5,-77.5,42.5,-71.0',
  /** Southeast (DC to Florida to New Orleans) */
  southeast: '25.0,-93.0,39.0,-75.0',
  /** West (Rockies to Pacific) */
  west: '32.0,-124.5,49.0,-104.0',
  /** Gulf Coast (Houston to New Orleans) */
  gulf: '28.0,-97.0,31.0,-88.0',
  /** Powder River Basin (Wyoming coal) */
  powder_river: '42.0,-107.0,46.0,-104.0',
} as const;

// ---------------------------------------------------------------------------
// Query templates
// ---------------------------------------------------------------------------

export const OVERPASS_QUERIES: OverpassQuery[] = [
  // -----------------------------------------------------------------------
  // Freight mainlines
  // -----------------------------------------------------------------------
  {
    name: 'BNSF Mainline (tagged)',
    category: 'freight_mainline',
    query: `
[out:json][timeout:120];
(
  way["railway"="rail"]["operator"~"BNSF",i]({{bbox}});
  way["railway"="rail"]["name"~"BNSF",i]({{bbox}});
);
out geom;
    `.trim(),
    notes:
      'Returns all ways tagged as BNSF-operated. Coverage varies — many BNSF ' +
      'tracks lack operator tags in OSM. Use in combination with route-relation ' +
      'queries for better coverage.',
  },
  {
    name: 'Union Pacific Mainline (tagged)',
    category: 'freight_mainline',
    query: `
[out:json][timeout:120];
(
  way["railway"="rail"]["operator"~"Union Pacific",i]({{bbox}});
  way["railway"="rail"]["name"~"Union Pacific",i]({{bbox}});
);
out geom;
    `.trim(),
    notes:
      'Returns UP-tagged ways. UP lines in the western US are generally well-tagged.',
  },
  {
    name: 'CSX Mainline (tagged)',
    category: 'freight_mainline',
    query: `
[out:json][timeout:120];
(
  way["railway"="rail"]["operator"~"CSX",i]({{bbox}});
  way["railway"="rail"]["name"~"CSX",i]({{bbox}});
);
out geom;
    `.trim(),
    notes:
      'Returns CSX-tagged ways. CSX operates primarily in the eastern US.',
  },
  {
    name: 'Norfolk Southern Mainline (tagged)',
    category: 'freight_mainline',
    query: `
[out:json][timeout:120];
(
  way["railway"="rail"]["operator"~"Norfolk Southern",i]({{bbox}});
  way["railway"="rail"]["name"~"Norfolk Southern",i]({{bbox}});
);
out geom;
    `.trim(),
    notes:
      'Returns NS-tagged ways. NS operates primarily in the eastern US, ' +
      'often parallel to CSX routes.',
  },

  // -----------------------------------------------------------------------
  // Passenger corridors
  // -----------------------------------------------------------------------
  {
    name: 'Amtrak Route Relations',
    category: 'passenger_corridor',
    query: `
[out:json][timeout:120];
(
  relation["route"="train"]["operator"~"Amtrak",i]({{bbox}});
);
out geom;
    `.trim(),
    notes:
      'Returns Amtrak route relations. These are the best source for passenger ' +
      'corridor geometry as they represent complete named routes. Relation members ' +
      'are ordered ways that can be merged into continuous LineStrings.',
  },
  {
    name: 'Northeast Corridor (high-speed rail)',
    category: 'passenger_corridor',
    query: `
[out:json][timeout:120];
(
  way["railway"="rail"]["usage"="main"]["maxspeed"~"^(1[0-9]{2}|200)$"](38.5,-77.5,42.5,-71.0);
  way["railway"="rail"]["name"~"Northeast Corridor",i](38.5,-77.5,42.5,-71.0);
);
out geom;
    `.trim(),
    notes:
      'Targets high-speed rail segments along the NEC. The maxspeed filter ' +
      'catches Acela-capable segments (>100 mph).',
  },

  // -----------------------------------------------------------------------
  // Stations
  // -----------------------------------------------------------------------
  {
    name: 'Major Rail Stations',
    category: 'station',
    query: `
[out:json][timeout:60];
(
  node["railway"="station"]["name"]({{bbox}});
  way["railway"="station"]["name"]({{bbox}});
);
out center;
    `.trim(),
    notes:
      'Returns named railway stations. Use "out center" to collapse way-based ' +
      'stations (buildings) into point coordinates.',
  },
  {
    name: 'Amtrak Stations',
    category: 'station',
    query: `
[out:json][timeout:60];
(
  node["railway"="station"]["operator"~"Amtrak",i]({{bbox}});
  node["railway"="halt"]["operator"~"Amtrak",i]({{bbox}});
);
out;
    `.trim(),
    notes:
      'Returns Amtrak-tagged stations and halts. Halts are smaller stops ' +
      'without full station facilities.',
  },

  // -----------------------------------------------------------------------
  // Yards and facilities
  // -----------------------------------------------------------------------
  {
    name: 'Rail Yards',
    category: 'yard',
    query: `
[out:json][timeout:60];
(
  way["railway"="rail"]["service"="yard"]({{bbox}});
  way["landuse"="railway"]({{bbox}});
);
out geom;
    `.trim(),
    notes:
      'Returns rail yard trackage and railway land use areas. Useful for ' +
      'identifying major classification yards where trains are assembled.',
  },
];

// ---------------------------------------------------------------------------
// Utility: build a ready-to-execute query by substituting a bounding box
// ---------------------------------------------------------------------------

/**
 * Replaces {{bbox}} placeholders in a query template with an actual
 * bounding box string. The bbox format is "south,west,north,east".
 *
 * Args:
 *   template: The Overpass QL query string with {{bbox}} placeholders.
 *   bbox: A bounding box string in "south,west,north,east" format.
 *
 * Returns:
 *   The query string with all {{bbox}} placeholders replaced.
 *
 * Example:
 *   >>> substituteBox(query, BOUNDING_BOXES.northeast)
 */
export function substituteBbox(template: string, bbox: string): string {
  return template.replace(/\{\{bbox\}\}/g, bbox);
}

/**
 * Returns the full Overpass API URL for executing a query.
 *
 * Args:
 *   query: A fully-formed Overpass QL query string (no placeholders).
 *   endpoint: The Overpass API base URL. Defaults to the public instance.
 *
 * Returns:
 *   A complete URL suitable for fetch() or curl.
 */
export function buildOverpassUrl(
  query: string,
  endpoint = 'https://overpass-api.de/api/interpreter',
): string {
  return `${endpoint}?data=${encodeURIComponent(query)}`;
}
