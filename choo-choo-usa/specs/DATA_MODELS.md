# Data Models

All TypeScript type definitions for the simulation. These live in `/src/types/`.

---

## Train

```typescript
// /src/types/train.ts

export type TrainStatus =
  | 'sleeping'       // In roundhouse, nighttime
  | 'warming_up'     // Fires stoked, preparing to depart
  | 'departing'      // Rolling out of roundhouse
  | 'en_route'       // Moving along a corridor
  | 'arriving'       // Approaching a station
  | 'at_station'     // Stopped at a station, loading/unloading
  | 'returning'      // Heading back to roundhouse
  | 'maintenance'    // Rare: broken down, being repaired

export type TrainType = 'steam' | 'diesel';
export type WhistleType = 'deep' | 'high' | 'horn' | 'scratchy' | 'mellow' | 'sharp';

export interface Train {
  id: string;                          // Unique identifier (e.g., "big-thunder")
  name: string;                        // Display name (e.g., "Big Thunder")
  type: TrainType;
  color: {
    primary: string;                   // Hex color for the main body
    secondary: string;                 // Hex color for trim/accents
    accent: string;                    // Hex color for small details
  };
  personality: string;                 // Short description for the narrator
  whistleType: WhistleType;
  whistleSoundFile: string;            // Path to audio file
  cargoCapability: CargoType[];        // What types of cargo this train can carry
  maxCars: number;                     // Maximum number of cars this train can pull
  speedMph: number;                    // Average speed in miles per hour
  homeRoundhouseId: string;            // Which roundhouse this train returns to
  berthIndex: number;                  // Position in the roundhouse (0-5 for 6 berths)

  // Runtime state (not in seed data, set by simulation)
  status: TrainStatus;
  currentRouteId: string | null;       // Which corridor it's on
  routeProgress: number;               // 0.0 to 1.0 along the route
  currentPosition: [number, number];   // [latitude, longitude]
  heading: number;                     // Degrees, for icon rotation
  cargoManifest: CargoShipment[];      // Currently loaded cargo
  passengers: Passenger[];             // Currently aboard passengers
  stats: {
    totalMiles: number;
    totalDeliveries: number;
    totalPassengersCarried: number;
  };
}
```

---

## Cargo

```typescript
// /src/types/cargo.ts

export type CargoType =
  | 'coal'
  | 'grain'
  | 'produce'
  | 'livestock'
  | 'automobiles'
  | 'steel'
  | 'fuel'
  | 'chemicals'
  | 'lumber'
  | 'packages'
  | 'passengers';    // Treated as a cargo type for routing purposes

export type CargoCategory = 'minerals' | 'agriculture' | 'manufacturing' | 'energy' | 'goods' | 'people';

export interface CargoTypeDefinition {
  type: CargoType;
  category: CargoCategory;
  displayName: string;                 // Human-friendly name
  unit: string;                        // "tons", "head", "units", "barrels", "passengers"
  carType: string;                     // What rail car carries it: "hopper", "boxcar", "tanker", etc.
  icon: string;                        // Icon identifier for UI rendering
  color: string;                       // Badge/icon color (hex)
  description: string;                 // Narrator-voice description for kids
}

export interface CargoShipment {
  id: string;
  type: CargoType;
  quantity: number;
  unit: string;
  originStationId: string;
  destinationStationId: string;
  assignedTrainId: string | null;      // null if waiting at origin
  status: 'waiting' | 'in_transit' | 'delivered';
  createdAt: number;                   // Simulation timestamp
  loadedAt: number | null;
  deliveredAt: number | null;
  industrySource: string;              // Which industry produced this
  industryDestination: string;         // Which industry consumes this
}
```

---

## Passenger

```typescript
// /src/types/passenger.ts

export type AgeGroup = 'child' | 'adult' | 'elderly';
export type PassengerActivity =
  | 'waiting'
  | 'boarding'
  | 'sleeping'
  | 'eating'
  | 'reading'
  | 'talking'
  | 'looking_out_window'
  | 'arriving'
  | 'deboarding'
  | 'leaving';

export type PassengerMood = 'happy' | 'tired' | 'excited' | 'nervous';

export interface PassengerAppearance {
  bodyType: AgeGroup;
  clothingColor: string;               // Hex
  hairStyle: 'short' | 'long' | 'bald' | 'hat';
  hatType: 'none' | 'conductor' | 'cowboy' | 'beanie' | 'sun_hat';
  bagType: 'none' | 'suitcase' | 'backpack' | 'briefcase' | 'bundle';
}

export interface Passenger {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  appearance: PassengerAppearance;
  originStationId: string;
  destinationStationId: string;
  assignedTrainId: string | null;
  activity: PassengerActivity;
  mood: PassengerMood;
  status: 'waiting' | 'in_transit' | 'arrived';
  createdAt: number;                   // Simulation timestamp
  boardedAt: number | null;
  arrivedAt: number | null;
}
```

---

## Station

```typescript
// /src/types/station.ts

export type StationSize = 'major_hub' | 'regional' | 'local';

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  position: [number, number];          // [latitude, longitude]
  size: StationSize;
  trackCount: number;                  // Number of platform tracks
  industries: IndustryInstance[];       // What industries are near this station
  architectureStyle: 'grand' | 'modest' | 'rustic';
  description: string;                 // Narrator-voice description

  // Runtime state
  waitingCargo: CargoShipment[];
  waitingPassengers: Passenger[];
  trainsAtStation: string[];           // Train IDs currently stopped here
}

export interface IndustryInstance {
  type: string;                        // Industry type from the industry table
  name: string;                        // Specific name (e.g., "Appalachian Coal Co.")
  produces: CargoType[];
  consumes: CargoType[];
  productionRate: number;              // Probability per sim-hour of generating cargo
  minBatch: number;
  maxBatch: number;
}
```

---

## Route

```typescript
// /src/types/route.ts

export interface Route {
  id: string;
  name: string;
  description: string;                 // Narrator-voice corridor description
  stationIds: string[];                // Ordered list of station IDs along this route
  geometry: GeoJSON.LineString;        // GeoJSON coordinates for the track path
  lengthMiles: number;
  primaryCargoTypes: CargoType[];      // What usually travels this corridor
  color: string;                       // Hex color for map rendering
}
```

---

## Simulation State

```typescript
// /src/types/simulation.ts

export interface SimulationState {
  clock: number;                       // Simulation time in minutes since midnight, Day 1
  speed: 0 | 1 | 5 | 15 | 60;        // Multiplier (0 = paused)
  dayNumber: number;                   // Current simulation day
  timeOfDay: number;                   // Minutes since midnight (0-1439)
  isDaytime: boolean;
  isPaused: boolean;

  // Aggregate statistics
  stats: {
    today: DailyStats;
    allTime: DailyStats;
  };
}

export interface DailyStats {
  cargoTonsMoved: number;
  cargoDeliveries: number;
  passengersDelivered: number;
  trainMilesTraveled: number;
  busiestStation: string;              // Station ID
  busiestCorridor: string;             // Route ID
}
```

---

## IndexedDB Schema (Dexie.js)

```typescript
// /src/stores/db.ts

import Dexie from 'dexie';

class ChooChooDB extends Dexie {
  trains!: Dexie.Table<Train, string>;
  cargoShipments!: Dexie.Table<CargoShipment, string>;
  passengers!: Dexie.Table<Passenger, string>;
  stations!: Dexie.Table<Station, string>;
  routes!: Dexie.Table<Route, string>;
  simulationState!: Dexie.Table<SimulationState, number>;

  constructor() {
    super('ChooChooDB');
    this.version(1).stores({
      trains: 'id, status, currentRouteId',
      cargoShipments: 'id, type, status, originStationId, destinationStationId, assignedTrainId',
      passengers: 'id, status, originStationId, destinationStationId, assignedTrainId',
      stations: 'id, city, state',
      routes: 'id',
      simulationState: '++id',
    });
  }
}

export const db = new ChooChooDB();
```
