/**
 * config.ts
 *
 * Master corridor configuration for the Choo-Choo USA rail network.
 * Defines all ~30 target corridors with their IDs, names, operators, types,
 * approximate station sequences, and display colors.
 *
 * Part of: Choo-Choo USA (Extract Rail Data Pipeline)
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - None (pure data definitions)
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CorridorType = 'freight' | 'passenger' | 'mixed';

export interface CorridorConfig {
  /** Unique slug ID matching routes.json */
  id: string;
  /** Display name (warm narrator voice) */
  name: string;
  /** Operating railroad company */
  operator: 'BNSF' | 'UP' | 'CSX' | 'NS' | 'Amtrak' | 'Multiple';
  /** Corridor type */
  type: CorridorType;
  /** Ordered station IDs along the route */
  stationIds: string[];
  /** Map display color (hex) */
  color: string;
  /** Primary cargo types carried on this corridor */
  primaryCargoTypes: string[];
  /** Approximate route length in miles */
  lengthMiles: number;
  /** Whether this corridor already exists in routes.json (update only) */
  existing?: boolean;
}

// ---------------------------------------------------------------------------
// Operator brand colors
// ---------------------------------------------------------------------------

export const OPERATOR_COLORS = {
  BNSF: '#E87722',
  UP: '#00274C',
  CSX: '#0033A0',
  NS: '#52B848',
  Amtrak: '#1A5DAD',
} as const;

// ---------------------------------------------------------------------------
// Existing corridors (10) — update with operator/type metadata only
// ---------------------------------------------------------------------------

export const EXISTING_CORRIDORS: CorridorConfig[] = [
  {
    id: 'appalachian-coal',
    name: 'Appalachian Coal Line',
    operator: 'CSX',
    type: 'freight',
    stationIds: ['charleston-wv', 'huntington-wv', 'portsmouth-oh', 'columbus-oh', 'toledo-oh'],
    color: '#2E2E38',
    primaryCargoTypes: ['coal', 'steel'],
    lengthMiles: 380,
    existing: true,
  },
  {
    id: 'northeast-corridor',
    name: 'Northeast Corridor',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['boston-ma', 'new-haven-ct', 'new-york-ny', 'philadelphia-pa', 'baltimore-md', 'washington-dc'],
    color: '#5B98B5',
    primaryCargoTypes: ['passengers', 'packages'],
    lengthMiles: 457,
    existing: true,
  },
  {
    id: 'grain-belt',
    name: 'Grain Belt Express',
    operator: 'BNSF',
    type: 'freight',
    stationIds: ['kansas-city-mo', 'wichita-ks', 'oklahoma-city-ok', 'dallas-tx', 'houston-tx'],
    color: '#D4A843',
    primaryCargoTypes: ['grain', 'produce', 'livestock'],
    lengthMiles: 850,
    existing: true,
  },
  {
    id: 'transcon',
    name: 'Transcontinental Main',
    operator: 'BNSF',
    type: 'freight',
    stationIds: ['chicago-il', 'kansas-city-mo', 'denver-co', 'albuquerque-nm', 'flagstaff-az', 'los-angeles-ca'],
    color: '#E8913A',
    primaryCargoTypes: ['fuel', 'automobiles', 'packages', 'chemicals'],
    lengthMiles: 2200,
    existing: true,
  },
  {
    id: 'california-produce',
    name: 'California Produce Run',
    operator: 'UP',
    type: 'freight',
    stationIds: ['sacramento-ca', 'fresno-ca', 'bakersfield-ca', 'los-angeles-ca'],
    color: '#2D5A3D',
    primaryCargoTypes: ['produce'],
    lengthMiles: 400,
    existing: true,
  },
  {
    id: 'chicago-hub-east',
    name: 'Chicago Eastern Gateway',
    operator: 'CSX',
    type: 'mixed',
    stationIds: ['chicago-il', 'gary-in', 'cleveland-oh', 'pittsburgh-pa', 'new-york-ny'],
    color: '#8C8C8C',
    primaryCargoTypes: ['steel', 'automobiles', 'packages'],
    lengthMiles: 790,
    existing: true,
  },
  {
    id: 'mountain-pass',
    name: 'Rocky Mountain Pass',
    operator: 'UP',
    type: 'mixed',
    stationIds: ['denver-co', 'summit-co', 'glenwood-springs-co'],
    color: '#D64045',
    primaryCargoTypes: ['coal', 'fuel', 'packages'],
    lengthMiles: 160,
    existing: true,
  },
  {
    id: 'sunset-route',
    name: 'Sunset Route',
    operator: 'UP',
    type: 'freight',
    stationIds: ['houston-tx', 'beaumont-tx', 'lake-charles-la', 'baton-rouge-la', 'new-orleans-la'],
    color: '#C45B3E',
    primaryCargoTypes: ['fuel', 'chemicals'],
    lengthMiles: 365,
    existing: true,
  },
  {
    id: 'florida-corridor',
    name: 'Florida Sunshine Line',
    operator: 'CSX',
    type: 'mixed',
    stationIds: ['jacksonville-fl', 'orlando-fl', 'tampa-fl', 'west-palm-beach-fl', 'miami-fl'],
    color: '#F4C542',
    primaryCargoTypes: ['produce', 'passengers'],
    lengthMiles: 450,
    existing: true,
  },
  {
    id: 'pacific-lumber',
    name: 'Pacific Lumber Line',
    operator: 'BNSF',
    type: 'freight',
    stationIds: ['seattle-wa', 'portland-or', 'eugene-or', 'sacramento-ca'],
    color: '#3E2F1C',
    primaryCargoTypes: ['lumber'],
    lengthMiles: 750,
    existing: true,
  },
];

// ---------------------------------------------------------------------------
// New freight corridors (10)
// ---------------------------------------------------------------------------

export const NEW_FREIGHT_CORRIDORS: CorridorConfig[] = [
  {
    id: 'bnsf-northern-transcon',
    name: 'BNSF Northern Transcontinental',
    operator: 'BNSF',
    type: 'freight',
    stationIds: ['chicago-il', 'milwaukee-wi', 'minneapolis-mn', 'fargo-nd', 'glacier-park-mt', 'spokane-wa', 'seattle-wa'],
    color: OPERATOR_COLORS.BNSF,
    primaryCargoTypes: ['grain', 'packages', 'lumber', 'automobiles'],
    lengthMiles: 2206,
  },
  {
    id: 'up-overland',
    name: 'Union Pacific Overland Route',
    operator: 'UP',
    type: 'freight',
    stationIds: ['chicago-il', 'omaha-ne', 'cheyenne-wy', 'salt-lake-city-ut', 'emeryville-ca'],
    color: OPERATOR_COLORS.UP,
    primaryCargoTypes: ['packages', 'automobiles', 'chemicals', 'fuel'],
    lengthMiles: 1870,
  },
  {
    id: 'up-sunset',
    name: 'Union Pacific Sunset Route',
    operator: 'UP',
    type: 'freight',
    stationIds: ['los-angeles-ca', 'tucson-az', 'el-paso-tx', 'san-antonio-tx', 'houston-tx', 'new-orleans-la'],
    color: OPERATOR_COLORS.UP,
    primaryCargoTypes: ['fuel', 'chemicals', 'packages', 'automobiles'],
    lengthMiles: 2035,
  },
  {
    id: 'csx-water-level',
    name: 'CSX Water Level Route',
    operator: 'CSX',
    type: 'freight',
    stationIds: ['new-york-ny', 'albany-ny', 'syracuse-ny', 'buffalo-ny', 'cleveland-oh', 'chicago-il'],
    color: OPERATOR_COLORS.CSX,
    primaryCargoTypes: ['packages', 'automobiles', 'steel', 'chemicals'],
    lengthMiles: 960,
  },
  {
    id: 'ns-crescent-corridor',
    name: 'Norfolk Southern Crescent Corridor',
    operator: 'NS',
    type: 'freight',
    stationIds: ['washington-dc', 'charlotte-nc', 'atlanta-ga', 'birmingham-al', 'new-orleans-la'],
    color: OPERATOR_COLORS.NS,
    primaryCargoTypes: ['packages', 'automobiles', 'coal', 'chemicals'],
    lengthMiles: 1090,
  },
  {
    id: 'ns-pittsburgh-line',
    name: 'Norfolk Southern Pittsburgh Line',
    operator: 'NS',
    type: 'freight',
    stationIds: ['new-york-ny', 'pittsburgh-pa', 'chicago-il'],
    color: OPERATOR_COLORS.NS,
    primaryCargoTypes: ['packages', 'steel', 'automobiles'],
    lengthMiles: 820,
  },
  {
    id: 'bnsf-powder-river',
    name: 'BNSF Powder River Basin',
    operator: 'BNSF',
    type: 'freight',
    stationIds: ['gillette-wy', 'sheridan-wy', 'alliance-ne', 'kansas-city-mo'],
    color: OPERATOR_COLORS.BNSF,
    primaryCargoTypes: ['coal'],
    lengthMiles: 870,
  },
  {
    id: 'up-i5-corridor',
    name: 'Union Pacific I-5 Corridor',
    operator: 'UP',
    type: 'freight',
    stationIds: ['los-angeles-ca', 'bakersfield-ca', 'fresno-ca', 'sacramento-ca', 'portland-or'],
    color: OPERATOR_COLORS.UP,
    primaryCargoTypes: ['produce', 'packages', 'fuel', 'lumber'],
    lengthMiles: 1060,
  },
  {
    id: 'csx-southeast',
    name: 'CSX Southeast Corridor',
    operator: 'CSX',
    type: 'freight',
    stationIds: ['jacksonville-fl', 'savannah-ga', 'atlanta-ga', 'nashville-tn'],
    color: OPERATOR_COLORS.CSX,
    primaryCargoTypes: ['packages', 'automobiles', 'produce', 'chemicals'],
    lengthMiles: 690,
  },
  {
    id: 'ns-piedmont',
    name: 'Norfolk Southern Piedmont Mainline',
    operator: 'NS',
    type: 'freight',
    stationIds: ['washington-dc', 'richmond-va', 'raleigh-nc', 'charlotte-nc', 'atlanta-ga'],
    color: OPERATOR_COLORS.NS,
    primaryCargoTypes: ['packages', 'automobiles', 'steel', 'produce'],
    lengthMiles: 640,
  },
];

// ---------------------------------------------------------------------------
// New Amtrak passenger corridors (12)
// ---------------------------------------------------------------------------

export const NEW_PASSENGER_CORRIDORS: CorridorConfig[] = [
  {
    id: 'amtrak-california-zephyr',
    name: 'Amtrak California Zephyr',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['chicago-il', 'omaha-ne', 'denver-co', 'glenwood-springs-co', 'salt-lake-city-ut', 'emeryville-ca'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 2438,
  },
  {
    id: 'amtrak-empire-builder',
    name: 'Amtrak Empire Builder',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['chicago-il', 'milwaukee-wi', 'minneapolis-mn', 'fargo-nd', 'glacier-park-mt', 'spokane-wa', 'seattle-wa'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 2206,
  },
  {
    id: 'amtrak-southwest-chief',
    name: 'Amtrak Southwest Chief',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['chicago-il', 'kansas-city-mo', 'dodge-city-ks', 'albuquerque-nm', 'flagstaff-az', 'los-angeles-ca'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 2256,
  },
  {
    id: 'amtrak-coast-starlight',
    name: 'Amtrak Coast Starlight',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['seattle-wa', 'portland-or', 'sacramento-ca', 'san-jose-ca', 'santa-barbara-ca', 'los-angeles-ca'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 1377,
  },
  {
    id: 'amtrak-city-of-nola',
    name: 'Amtrak City of New Orleans',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['chicago-il', 'memphis-tn', 'jackson-ms', 'new-orleans-la'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 934,
  },
  {
    id: 'amtrak-silver-meteor',
    name: 'Amtrak Silver Meteor',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['new-york-ny', 'washington-dc', 'richmond-va', 'raleigh-nc', 'charleston-sc', 'savannah-ga', 'jacksonville-fl', 'miami-fl'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 1389,
  },
  {
    id: 'amtrak-lake-shore',
    name: 'Amtrak Lake Shore Limited',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['new-york-ny', 'albany-ny', 'syracuse-ny', 'buffalo-ny', 'cleveland-oh', 'toledo-oh', 'chicago-il'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 959,
  },
  {
    id: 'amtrak-crescent',
    name: 'Amtrak Crescent',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['new-york-ny', 'washington-dc', 'charlotte-nc', 'atlanta-ga', 'birmingham-al', 'new-orleans-la'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 1377,
  },
  {
    id: 'amtrak-texas-eagle',
    name: 'Amtrak Texas Eagle',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['chicago-il', 'st-louis-mo', 'little-rock-ar', 'dallas-tx', 'san-antonio-tx'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 1306,
  },
  {
    id: 'amtrak-capitol-limited',
    name: 'Amtrak Capitol Limited',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['washington-dc', 'pittsburgh-pa', 'cleveland-oh', 'toledo-oh', 'chicago-il'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 780,
  },
  {
    id: 'amtrak-auto-train',
    name: 'Amtrak Auto Train',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['lorton-va', 'sanford-fl'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers', 'automobiles'],
    lengthMiles: 855,
  },
  {
    id: 'amtrak-cardinal',
    name: 'Amtrak Cardinal',
    operator: 'Amtrak',
    type: 'passenger',
    stationIds: ['new-york-ny', 'washington-dc', 'charleston-wv', 'cincinnati-oh', 'chicago-il'],
    color: OPERATOR_COLORS.Amtrak,
    primaryCargoTypes: ['passengers'],
    lengthMiles: 1147,
  },
];

// ---------------------------------------------------------------------------
// Combined master list
// ---------------------------------------------------------------------------

export const ALL_CORRIDORS: CorridorConfig[] = [
  ...EXISTING_CORRIDORS,
  ...NEW_FREIGHT_CORRIDORS,
  ...NEW_PASSENGER_CORRIDORS,
];

/**
 * Returns all corridor IDs referenced in the master config.
 */
export function getAllCorridorIds(): string[] {
  return ALL_CORRIDORS.map((c) => c.id);
}

/**
 * Returns a set of every station ID referenced across all corridors.
 * Useful for identifying which stations need to exist in stations.json.
 */
export function getAllReferencedStationIds(): Set<string> {
  const ids = new Set<string>();
  for (const corridor of ALL_CORRIDORS) {
    for (const sid of corridor.stationIds) {
      ids.add(sid);
    }
  }
  return ids;
}
