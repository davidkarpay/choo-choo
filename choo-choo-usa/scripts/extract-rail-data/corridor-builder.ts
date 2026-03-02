/**
 * corridor-builder.ts
 *
 * Takes raw corridor config and builds Route objects with proper geometry
 * coordinates. Uses known real-world coordinates for each station and
 * interpolated waypoints for curves along real rail paths.
 *
 * Part of: Choo-Choo USA (Extract Rail Data Pipeline)
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - config.ts: Corridor definitions
 *   - geojson-processor.ts: Coordinate validation
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import type { CorridorConfig } from './config';
import type { Coordinate, LineString } from './geojson-processor';
import { isValidConusCoordinate } from './geojson-processor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteOutput {
  id: string;
  name: string;
  description: string;
  stationIds: string[];
  geometry: LineString;
  lengthMiles: number;
  primaryCargoTypes: string[];
  color: string;
  operator: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Known station coordinates (longitude, latitude — GeoJSON order)
// This is the master lookup for building route geometries.
// ---------------------------------------------------------------------------

export const STATION_COORDS: Record<string, Coordinate> = {
  // Existing stations (38)
  'chicago-il': [-87.6298, 41.8781],
  'new-york-ny': [-73.9857, 40.7484],
  'los-angeles-ca': [-118.2437, 34.0522],
  'kansas-city-mo': [-94.5786, 39.0997],
  'denver-co': [-104.9903, 39.7392],
  'houston-tx': [-95.3698, 29.7604],
  'charleston-wv': [-81.6326, 38.3498],
  'boston-ma': [-71.0589, 42.3601],
  'washington-dc': [-77.0369, 38.9072],
  'seattle-wa': [-122.3321, 47.6062],
  'sacramento-ca': [-121.4944, 38.5816],
  'new-orleans-la': [-90.0715, 29.9511],
  'west-palm-beach-fl': [-80.0534, 26.7153],
  'columbus-oh': [-82.9988, 40.7989],
  'pittsburgh-pa': [-79.9959, 40.4406],
  'portland-or': [-122.6765, 45.5152],
  'albuquerque-nm': [-106.6504, 35.0844],
  'bakersfield-ca': [-119.0187, 35.3733],
  'baltimore-md': [-76.6122, 39.2904],
  'baton-rouge-la': [-91.1871, 30.4515],
  'beaumont-tx': [-94.1266, 30.0802],
  'cleveland-oh': [-81.6944, 41.4993],
  'dallas-tx': [-96.7970, 32.7767],
  'eugene-or': [-123.0868, 44.0521],
  'flagstaff-az': [-111.6513, 35.1983],
  'fresno-ca': [-119.7871, 36.7378],
  'gary-in': [-87.3465, 41.5934],
  'glenwood-springs-co': [-107.3248, 39.5506],
  'huntington-wv': [-82.4452, 38.4137],
  'jacksonville-fl': [-81.6557, 30.3322],
  'lake-charles-la': [-93.2174, 30.2266],
  'miami-fl': [-80.1918, 25.7617],
  'new-haven-ct': [-72.9279, 41.3082],
  'oklahoma-city-ok': [-97.5164, 35.4676],
  'orlando-fl': [-81.3789, 28.5383],
  'philadelphia-pa': [-75.1652, 39.9526],
  'portsmouth-oh': [-82.9977, 38.7318],
  'summit-co': [-106.1500, 39.6333],
  'tampa-fl': [-82.4572, 27.9506],
  'toledo-oh': [-83.5379, 41.6528],
  'wichita-ks': [-97.3301, 37.6872],

  // New stations (added in Phase 5 M2)
  'minneapolis-mn': [-93.2650, 44.9778],
  'milwaukee-wi': [-87.9065, 43.0389],
  'omaha-ne': [-95.9345, 41.2565],
  'salt-lake-city-ut': [-111.8910, 40.7608],
  'emeryville-ca': [-122.2927, 37.8313],
  'spokane-wa': [-117.4260, 47.6588],
  'glacier-park-mt': [-113.2263, 48.3118],
  'fargo-nd': [-96.7898, 46.8772],
  'atlanta-ga': [-84.3880, 33.7490],
  'charlotte-nc': [-80.8431, 35.2271],
  'nashville-tn': [-86.7816, 36.1627],
  'birmingham-al': [-86.8025, 33.5207],
  'richmond-va': [-77.4360, 37.5407],
  'raleigh-nc': [-78.6382, 35.7796],
  'charleston-sc': [-79.9311, 32.7765],
  'savannah-ga': [-81.0998, 32.0809],
  'memphis-tn': [-90.0490, 35.1495],
  'jackson-ms': [-90.1848, 32.2988],
  'st-louis-mo': [-90.1994, 38.6270],
  'little-rock-ar': [-92.2896, 34.7465],
  'san-antonio-tx': [-98.4936, 29.4241],
  'el-paso-tx': [-106.4424, 31.7619],
  'tucson-az': [-110.9747, 32.2226],
  'cincinnati-oh': [-84.5120, 39.1031],
  'buffalo-ny': [-78.8784, 42.8864],
  'syracuse-ny': [-76.1474, 43.0481],
  'albany-ny': [-73.7562, 42.6526],
  'dodge-city-ks': [-100.0171, 37.7528],
  'san-jose-ca': [-121.8863, 37.3382],
  'santa-barbara-ca': [-119.6982, 34.4208],
  'lorton-va': [-77.2277, 38.7048],
  'sanford-fl': [-81.2714, 28.8003],
  'cheyenne-wy': [-104.8202, 41.1400],
  'sheridan-wy': [-106.9562, 44.7972],
  'gillette-wy': [-105.5022, 44.2911],
  'alliance-ne': [-102.8720, 42.1016],
};

// ---------------------------------------------------------------------------
// Waypoints for realistic route geometry
// These are intermediate points along real rail corridors to make the
// lines curve realistically on the map rather than flying straight
// between stations.
// ---------------------------------------------------------------------------

export const ROUTE_WAYPOINTS: Record<string, Coordinate[]> = {
  // BNSF Northern Transcon: Chicago → Milwaukee → Minneapolis → Fargo → Glacier → Spokane → Seattle
  'bnsf-northern-transcon': [
    [-87.6298, 41.8781],   // Chicago
    [-87.9065, 43.0389],   // Milwaukee
    [-93.2650, 44.9778],   // Minneapolis
    [-96.7898, 46.8772],   // Fargo
    [-104.0, 47.5],        // Eastern MT
    [-109.5, 47.9],        // Central MT
    [-113.2263, 48.3118],  // Glacier Park
    [-115.5, 47.7],        // W Montana
    [-117.4260, 47.6588],  // Spokane
    [-120.5, 47.4],        // Central WA
    [-122.3321, 47.6062],  // Seattle
  ],

  // UP Overland: Chicago → Omaha → Cheyenne → SLC → Emeryville
  'up-overland': [
    [-87.6298, 41.8781],   // Chicago
    [-89.6, 41.5],         // DeKalb IL
    [-91.5, 41.5],         // Iowa City area
    [-95.9345, 41.2565],   // Omaha
    [-100.0, 41.1],        // North Platte NE
    [-104.8202, 41.1400],  // Cheyenne
    [-107.2, 41.3],        // Rawlins WY
    [-109.2, 41.2],        // Rock Springs WY
    [-110.9, 40.9],        // Evanston WY
    [-111.8910, 40.7608],  // Salt Lake City
    [-114.0, 40.8],        // W Utah
    [-117.2, 40.0],        // NE Nevada
    [-119.8, 39.5],        // Reno area
    [-121.3, 38.7],        // Sacramento area
    [-122.2927, 37.8313],  // Emeryville
  ],

  // UP Sunset: LA → Tucson → El Paso → San Antonio → Houston → New Orleans
  'up-sunset': [
    [-118.2437, 34.0522],  // LA
    [-116.5, 33.9],        // Palm Springs area
    [-114.6, 32.7],        // Yuma area
    [-110.9747, 32.2226],  // Tucson
    [-109.0, 32.0],        // SE Arizona
    [-106.4424, 31.7619],  // El Paso
    [-104.0, 30.9],        // W Texas
    [-101.5, 30.3],        // W Texas
    [-100.4, 29.9],        // Del Rio area
    [-98.4936, 29.4241],   // San Antonio
    [-97.0, 29.8],         // Between SA-Houston
    [-95.3698, 29.7604],   // Houston
    [-94.1266, 30.0802],   // Beaumont
    [-93.2174, 30.2266],   // Lake Charles
    [-91.1871, 30.4515],   // Baton Rouge
    [-90.0715, 29.9511],   // New Orleans
  ],

  // CSX Water Level: NY → Albany → Syracuse → Buffalo → Cleveland → Chicago
  'csx-water-level': [
    [-73.9857, 40.7484],   // NY
    [-73.7562, 42.6526],   // Albany
    [-75.5, 43.0],         // Utica area
    [-76.1474, 43.0481],   // Syracuse
    [-77.6, 43.2],         // Rochester area
    [-78.8784, 42.8864],   // Buffalo
    [-79.9, 42.1],         // Erie PA
    [-81.6944, 41.4993],   // Cleveland
    [-83.5, 41.6],         // Toledo area
    [-85.0, 41.7],         // Elkhart IN
    [-87.6298, 41.8781],   // Chicago
  ],

  // NS Crescent Corridor: DC → Charlotte → Atlanta → Birmingham → New Orleans
  'ns-crescent-corridor': [
    [-77.0369, 38.9072],   // DC
    [-77.5, 38.3],         // N Virginia
    [-78.5, 37.5],         // Central VA
    [-79.4, 37.3],         // Lynchburg VA
    [-80.0, 36.1],         // Danville VA
    [-80.4, 35.6],         // Greensboro NC
    [-80.8431, 35.2271],   // Charlotte
    [-82.3, 34.8],         // Greenville SC
    [-83.3, 34.1],         // NE Georgia
    [-84.3880, 33.7490],   // Atlanta
    [-85.5, 33.5],         // Anniston AL
    [-86.8025, 33.5207],   // Birmingham
    [-87.8, 33.1],         // W Alabama
    [-88.7, 32.4],         // Meridian MS
    [-89.3, 31.3],         // S Mississippi
    [-90.0715, 29.9511],   // New Orleans
  ],

  // NS Pittsburgh Line: NY → Pittsburgh → Chicago
  'ns-pittsburgh-line': [
    [-73.9857, 40.7484],   // NY
    [-74.2, 40.7],         // Newark area
    [-75.1, 40.6],         // Allentown area
    [-76.0, 40.5],         // Harrisburg area
    [-77.5, 40.5],         // Central PA
    [-79.9959, 40.4406],   // Pittsburgh
    [-81.5, 40.8],         // E Ohio
    [-83.5, 41.1],         // Mansfield OH area
    [-85.0, 41.1],         // Fort Wayne IN area
    [-87.6298, 41.8781],   // Chicago
  ],

  // BNSF Powder River: Gillette WY → Sheridan → Alliance NE → KC
  'bnsf-powder-river': [
    [-105.5022, 44.2911],  // Gillette
    [-106.9562, 44.7972],  // Sheridan
    [-105.0, 43.0],        // SE Wyoming
    [-102.8720, 42.1016],  // Alliance NE
    [-101.0, 41.1],        // W Nebraska
    [-99.0, 40.5],         // Central NE
    [-97.0, 40.0],         // SE Nebraska
    [-95.5, 39.5],         // NE Kansas
    [-94.5786, 39.0997],   // Kansas City
  ],

  // UP I-5 Corridor: LA → Bakersfield → Fresno → Sacramento → Portland
  'up-i5-corridor': [
    [-118.2437, 34.0522],  // LA
    [-118.7, 34.8],        // Tehachapi area
    [-119.0187, 35.3733],  // Bakersfield
    [-119.7871, 36.7378],  // Fresno
    [-120.5, 37.6],        // Modesto area
    [-121.4944, 38.5816],  // Sacramento
    [-122.2, 40.0],        // Redding area
    [-122.5, 41.5],        // N California
    [-122.7, 43.0],        // S Oregon
    [-122.6, 44.0],        // Eugene area
    [-122.6765, 45.5152],  // Portland
  ],

  // CSX Southeast: Jacksonville → Savannah → Atlanta → Nashville
  'csx-southeast': [
    [-81.6557, 30.3322],   // Jacksonville
    [-81.0998, 32.0809],   // Savannah
    [-82.0, 32.8],         // Macon GA area
    [-83.5, 33.2],         // Central GA
    [-84.3880, 33.7490],   // Atlanta
    [-85.2, 34.3],         // NW Georgia
    [-86.1, 35.0],         // S Tennessee
    [-86.7816, 36.1627],   // Nashville
  ],

  // NS Piedmont: DC → Richmond → Raleigh → Charlotte → Atlanta
  'ns-piedmont': [
    [-77.0369, 38.9072],   // DC
    [-77.4360, 37.5407],   // Richmond
    [-78.0, 36.8],         // South VA
    [-78.6382, 35.7796],   // Raleigh
    [-79.5, 35.5],         // Between Raleigh-Charlotte
    [-80.8431, 35.2271],   // Charlotte
    [-81.5, 34.9],         // Gastonia/Spartanburg area
    [-82.5, 34.5],         // Greenville SC area
    [-83.5, 34.0],         // NE Georgia
    [-84.3880, 33.7490],   // Atlanta
  ],

  // Amtrak California Zephyr: Chicago → Omaha → Denver → Glenwood → SLC → Emeryville
  'amtrak-california-zephyr': [
    [-87.6298, 41.8781],   // Chicago
    [-89.5, 41.5],         // Central IL
    [-91.5, 41.5],         // Iowa
    [-93.6, 41.6],         // Des Moines area
    [-95.9345, 41.2565],   // Omaha
    [-99.0, 40.8],         // Central NE
    [-102.0, 40.6],        // W Nebraska
    [-104.9903, 39.7392],  // Denver
    [-105.5, 39.6],        // Front Range
    [-106.1500, 39.6333],  // Summit
    [-107.3248, 39.5506],  // Glenwood Springs
    [-108.5, 39.4],        // Grand Junction area
    [-110.0, 39.6],        // Green River UT
    [-111.8910, 40.7608],  // Salt Lake City
    [-114.5, 40.8],        // W Utah
    [-117.0, 40.0],        // NE Nevada
    [-120.0, 39.3],        // Reno/Truckee area
    [-121.5, 38.6],        // Sacramento area
    [-122.2927, 37.8313],  // Emeryville
  ],

  // Amtrak Empire Builder: Chicago → Milwaukee → Mpls → Fargo → Glacier → Spokane → Seattle
  'amtrak-empire-builder': [
    [-87.6298, 41.8781],   // Chicago
    [-87.9065, 43.0389],   // Milwaukee
    [-90.5, 43.8],         // WI Dells area
    [-93.2650, 44.9778],   // Minneapolis
    [-96.7898, 46.8772],   // Fargo
    [-100.8, 47.5],        // Minot ND area
    [-104.0, 47.5],        // E Montana
    [-107.8, 48.0],        // Havre MT area
    [-110.5, 48.2],        // Central MT
    [-113.2263, 48.3118],  // Glacier Park
    [-115.5, 47.7],        // W Montana
    [-117.4260, 47.6588],  // Spokane
    [-120.5, 47.4],        // Central WA
    [-122.3321, 47.6062],  // Seattle
  ],

  // Amtrak Southwest Chief: Chicago → KC → Dodge City → Albuquerque → Flagstaff → LA
  'amtrak-southwest-chief': [
    [-87.6298, 41.8781],   // Chicago
    [-89.5, 40.5],         // Central IL
    [-91.5, 39.8],         // Quincy area
    [-94.5786, 39.0997],   // Kansas City
    [-97.0, 38.3],         // Emporia KS area
    [-100.0171, 37.7528],  // Dodge City
    [-102.5, 37.0],        // SW Kansas
    [-104.6, 36.5],        // Raton NM area
    [-105.5, 35.7],        // Las Vegas NM area
    [-106.6504, 35.0844],  // Albuquerque
    [-108.5, 35.5],        // Gallup NM area
    [-110.0, 35.3],        // Winslow AZ area
    [-111.6513, 35.1983],  // Flagstaff
    [-113.0, 35.0],        // Kingman AZ area
    [-115.0, 34.9],        // Needles CA area
    [-117.2, 34.1],        // San Bernardino area
    [-118.2437, 34.0522],  // LA
  ],

  // Amtrak Coast Starlight: Seattle → Portland → Sacramento → San Jose → Santa Barbara → LA
  'amtrak-coast-starlight': [
    [-122.3321, 47.6062],  // Seattle
    [-122.5, 46.0],        // Centralia WA area
    [-122.6765, 45.5152],  // Portland
    [-123.0, 44.5],        // Salem area
    [-123.0868, 44.0521],  // Eugene
    [-122.5, 42.3],        // Klamath Falls area
    [-122.3, 40.6],        // Redding area
    [-121.4944, 38.5816],  // Sacramento
    [-121.8863, 37.3382],  // San Jose
    [-121.5, 36.6],        // Salinas area
    [-120.6, 35.4],        // San Luis Obispo area
    [-119.6982, 34.4208],  // Santa Barbara
    [-119.2, 34.3],        // Ventura area
    [-118.2437, 34.0522],  // LA
  ],

  // Amtrak City of New Orleans: Chicago → Memphis → Jackson → New Orleans
  'amtrak-city-of-nola': [
    [-87.6298, 41.8781],   // Chicago
    [-88.0, 40.5],         // Kankakee IL area
    [-88.5, 39.8],         // Champaign IL area
    [-89.0, 38.5],         // Centralia IL area
    [-89.2, 37.8],         // Carbondale IL area
    [-89.5, 36.6],         // NW Tennessee
    [-90.0490, 35.1495],   // Memphis
    [-90.2, 34.2],         // N Mississippi
    [-90.1848, 32.2988],   // Jackson MS
    [-90.3, 31.3],         // S Mississippi
    [-90.1, 30.5],         // Hammond LA area
    [-90.0715, 29.9511],   // New Orleans
  ],

  // Amtrak Silver Meteor: NY → DC → Richmond → Raleigh → Charleston SC → Savannah → Jacksonville → Miami
  'amtrak-silver-meteor': [
    [-73.9857, 40.7484],   // NY
    [-74.4, 40.5],         // NJ
    [-75.1652, 39.9526],   // Philadelphia
    [-76.6122, 39.2904],   // Baltimore
    [-77.0369, 38.9072],   // DC
    [-77.4360, 37.5407],   // Richmond
    [-78.1, 36.6],         // Between Richmond-Raleigh
    [-78.6382, 35.7796],   // Raleigh
    [-79.1, 34.8],         // Fayetteville NC area
    [-79.5, 34.0],         // Florence SC area
    [-79.9311, 32.7765],   // Charleston SC
    [-80.8, 32.1],         // Between Charleston-Savannah
    [-81.0998, 32.0809],   // Savannah
    [-81.6557, 30.3322],   // Jacksonville
    [-81.3, 29.2],         // Daytona area
    [-80.6, 27.8],         // Vero Beach area
    [-80.0534, 26.7153],   // West Palm Beach
    [-80.1918, 25.7617],   // Miami
  ],

  // Amtrak Lake Shore Limited: NY → Albany → Syracuse → Buffalo → Cleveland → Toledo → Chicago
  'amtrak-lake-shore': [
    [-73.9857, 40.7484],   // NY
    [-73.7562, 42.6526],   // Albany
    [-75.5, 43.0],         // Utica area
    [-76.1474, 43.0481],   // Syracuse
    [-77.6, 43.2],         // Rochester area
    [-78.8784, 42.8864],   // Buffalo
    [-79.9, 42.1],         // Erie PA
    [-81.6944, 41.4993],   // Cleveland
    [-83.5379, 41.6528],   // Toledo
    [-85.0, 41.7],         // Elkhart IN
    [-87.6298, 41.8781],   // Chicago
  ],

  // Amtrak Crescent: NY → DC → Charlotte → Atlanta → Birmingham → New Orleans
  'amtrak-crescent': [
    [-73.9857, 40.7484],   // NY
    [-74.2, 40.7],         // Newark
    [-75.1652, 39.9526],   // Philadelphia
    [-76.6122, 39.2904],   // Baltimore
    [-77.0369, 38.9072],   // DC
    [-77.5, 38.3],         // N Virginia
    [-78.5, 37.5],         // Central VA
    [-79.4, 37.3],         // Lynchburg
    [-80.0, 36.1],         // Danville VA
    [-80.4, 35.6],         // Greensboro
    [-80.8431, 35.2271],   // Charlotte
    [-82.3, 34.8],         // Greenville SC
    [-83.3, 34.1],         // NE Georgia
    [-84.3880, 33.7490],   // Atlanta
    [-85.5, 33.5],         // Anniston AL
    [-86.8025, 33.5207],   // Birmingham
    [-87.8, 33.1],         // W Alabama
    [-88.7, 32.4],         // Meridian MS
    [-89.3, 31.3],         // S Mississippi
    [-90.0715, 29.9511],   // New Orleans
  ],

  // Amtrak Texas Eagle: Chicago → St. Louis → Little Rock → Dallas → San Antonio
  'amtrak-texas-eagle': [
    [-87.6298, 41.8781],   // Chicago
    [-88.5, 41.0],         // Joliet IL area
    [-89.2, 40.5],         // Bloomington IL area
    [-89.6, 39.8],         // Springfield IL area
    [-90.1994, 38.6270],   // St. Louis
    [-91.0, 37.5],         // SE Missouri
    [-92.2896, 34.7465],   // Little Rock
    [-93.5, 33.5],         // SW Arkansas
    [-95.0, 33.0],         // NE Texas
    [-96.7970, 32.7767],   // Dallas
    [-97.1, 31.5],         // Waco TX area
    [-97.5, 30.6],         // Temple/Austin TX area
    [-98.4936, 29.4241],   // San Antonio
  ],

  // Amtrak Capitol Limited: DC → Pittsburgh → Cleveland → Toledo → Chicago
  'amtrak-capitol-limited': [
    [-77.0369, 38.9072],   // DC
    [-77.8, 39.5],         // Martinsburg WV area
    [-78.5, 39.6],         // Cumberland MD area
    [-79.9959, 40.4406],   // Pittsburgh
    [-80.8, 40.8],         // E Ohio
    [-81.6944, 41.4993],   // Cleveland
    [-83.5379, 41.6528],   // Toledo
    [-85.0, 41.7],         // Elkhart IN
    [-87.6298, 41.8781],   // Chicago
  ],

  // Amtrak Auto Train: Lorton VA → Sanford FL
  'amtrak-auto-train': [
    [-77.2277, 38.7048],   // Lorton
    [-77.4, 37.5],         // Richmond area
    [-78.6, 35.8],         // Raleigh area
    [-79.5, 34.0],         // Florence SC area
    [-80.3, 32.9],         // Between Florence-Savannah
    [-81.1, 32.1],         // Savannah area
    [-81.5, 30.3],         // Jacksonville area
    [-81.2714, 28.8003],   // Sanford
  ],

  // Amtrak Cardinal: NY → DC → Charleston WV → Cincinnati → Chicago
  'amtrak-cardinal': [
    [-73.9857, 40.7484],   // NY
    [-74.2, 40.7],         // Newark
    [-75.1652, 39.9526],   // Philadelphia
    [-76.6122, 39.2904],   // Baltimore
    [-77.0369, 38.9072],   // DC
    [-78.5, 38.0],         // Charlottesville VA area
    [-79.5, 37.8],         // Staunton VA area
    [-80.5, 38.0],         // White Sulphur Springs WV
    [-81.6326, 38.3498],   // Charleston WV
    [-82.5, 38.5],         // Ashland KY area
    [-84.5120, 39.1031],   // Cincinnati
    [-85.5, 39.5],         // Indianapolis area
    [-87.6298, 41.8781],   // Chicago
  ],
};

// ---------------------------------------------------------------------------
// Build route geometry from corridor config
// ---------------------------------------------------------------------------

/**
 * Builds a GeoJSON LineString geometry for a corridor by looking up
 * pre-defined waypoints. If no waypoints are defined for the corridor,
 * falls back to straight-line segments between station coordinates.
 *
 * Args:
 *   corridor: A CorridorConfig object from config.ts.
 *
 * Returns:
 *   A GeoJSON LineString with coordinates along the real rail path.
 *
 * Raises:
 *   Error if any station in the corridor has no known coordinates.
 */
export function buildRouteGeometry(corridor: CorridorConfig): LineString {
  // Prefer pre-defined waypoints for realistic curves
  const waypoints = ROUTE_WAYPOINTS[corridor.id];
  if (waypoints && waypoints.length > 0) {
    return {
      type: 'LineString',
      coordinates: [...waypoints],
    };
  }

  // Fallback: straight line through station coordinates
  const coords: Coordinate[] = [];
  for (const stationId of corridor.stationIds) {
    const coord = STATION_COORDS[stationId];
    if (!coord) {
      throw new Error(
        `No coordinates found for station "${stationId}" on corridor "${corridor.id}". ` +
        `Add it to STATION_COORDS in corridor-builder.ts.`,
      );
    }
    coords.push(coord);
  }

  return {
    type: 'LineString',
    coordinates: coords,
  };
}

/**
 * Builds a complete RouteOutput object from a CorridorConfig.
 * This is the main entry point for the corridor builder.
 *
 * Args:
 *   corridor: A CorridorConfig from config.ts.
 *   description: The narrator-voice description for this route. Pass an
 *                empty string if the description will be filled in later.
 *
 * Returns:
 *   A RouteOutput object ready to be serialized to routes.json.
 *
 * Note:
 *   Validates all coordinates after building geometry. Throws if any
 *   coordinate falls outside CONUS bounds.
 */
export function buildRoute(
  corridor: CorridorConfig,
  description: string,
): RouteOutput {
  const geometry = buildRouteGeometry(corridor);

  // Validate all coordinates
  for (let i = 0; i < geometry.coordinates.length; i++) {
    if (!isValidConusCoordinate(geometry.coordinates[i])) {
      throw new Error(
        `Invalid coordinate at index ${i} for corridor "${corridor.id}": ` +
        `[${geometry.coordinates[i]}]. Expected [longitude, latitude] within CONUS.`,
      );
    }
  }

  return {
    id: corridor.id,
    name: corridor.name,
    description,
    stationIds: corridor.stationIds,
    geometry,
    lengthMiles: corridor.lengthMiles,
    primaryCargoTypes: corridor.primaryCargoTypes,
    color: corridor.color,
    operator: corridor.operator,
    type: corridor.type,
  };
}
