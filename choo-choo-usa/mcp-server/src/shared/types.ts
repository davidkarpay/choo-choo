/**
 * shared/types.ts
 *
 * Shared type definitions for the MCP server. These mirror the simulation's
 * TypeScript types but are simplified for JSON serialization over the
 * WebSocket bridge. Maps and Sets are replaced with plain objects and
 * arrays; only JSON-safe primitives are used.
 *
 * Part of: Choo-Choo USA MCP Server
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - None (standalone type definitions)
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export type SimulationSpeed = 0 | 1 | 5 | 15 | 60;

export interface DailyStatsResponse {
  cargoTonsMoved: number;
  cargoDeliveries: number;
  passengersDelivered: number;
  trainMilesTraveled: number;
  busiestStation: string;
  busiestCorridor: string;
}

export interface SimulationStateResponse {
  clock: number;
  speed: SimulationSpeed;
  dayNumber: number;
  timeOfDay: number;
  timeOfDayPeriod: string;
  isDaytime: boolean;
  isPaused: boolean;
  stats: {
    today: DailyStatsResponse;
    allTime: DailyStatsResponse;
  };
}

// ---------------------------------------------------------------------------
// Trains
// ---------------------------------------------------------------------------

export type TrainStatus =
  | 'sleeping'
  | 'warming_up'
  | 'departing'
  | 'en_route'
  | 'arriving'
  | 'at_station'
  | 'returning'
  | 'maintenance';

export type TrainType = 'steam' | 'diesel';
export type TrainCategory = 'freight' | 'passenger';

export interface TrainSummaryResponse {
  id: string;
  name: string;
  type: TrainType;
  status: TrainStatus;
  currentRouteId: string | null;
  routeProgress: number;
  currentPosition: [number, number];
  heading: number;
  cargoCount: number;
  passengerCount: number;
  speedMph: number;
  operator?: string;
  category?: TrainCategory;
}

export interface TrainDetailResponse {
  id: string;
  name: string;
  type: TrainType;
  status: TrainStatus;
  color: { primary: string; secondary: string; accent: string };
  personality: string;
  currentRouteId: string | null;
  routeProgress: number;
  currentPosition: [number, number];
  heading: number;
  speedMph: number;
  maxCars: number;
  cargoCapability: string[];
  homeRoundhouseId: string;
  operator?: string;
  category?: TrainCategory;
  preferredRouteIds?: string[];
  currentSegmentIndex: number;
  segmentProgress: number;
  dwellTimer: number;
  dwellStationId: string | null;
  currentJourneyRoutes?: string[];
  currentJourneyLeg: number;
  cargoManifest: CargoShipmentResponse[];
  passengers: PassengerResponse[];
  stats: {
    totalMiles: number;
    totalDeliveries: number;
    totalPassengersCarried: number;
  };
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

export type StationSize = 'major_hub' | 'regional' | 'local';

export interface IndustryResponse {
  type: string;
  name: string;
  produces: string[];
  consumes: string[];
  productionRate: number;
  minBatch: number;
  maxBatch: number;
}

export interface StationSummaryResponse {
  id: string;
  name: string;
  city: string;
  state: string;
  position: [number, number];
  size: StationSize;
  trackCount: number;
  industryCount: number;
  waitingCargoCount: number;
  waitingPassengerCount: number;
  trainsAtStation: string[];
}

export interface StationDetailResponse {
  id: string;
  name: string;
  city: string;
  state: string;
  position: [number, number];
  size: StationSize;
  trackCount: number;
  architectureStyle: string;
  description: string;
  industries: IndustryResponse[];
  waitingCargo: CargoShipmentResponse[];
  waitingPassengers: PassengerResponse[];
  trainsAtStation: string[];
  isJunction?: boolean;
  connectedRouteIds?: string[];
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export type RouteType = 'freight' | 'passenger' | 'mixed';

export interface RouteSummaryResponse {
  id: string;
  name: string;
  stationIds: string[];
  lengthMiles: number;
  color: string;
  operator?: string;
  type?: RouteType;
}

export interface RouteDetailResponse {
  id: string;
  name: string;
  description: string;
  stationIds: string[];
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  lengthMiles: number;
  primaryCargoTypes: string[];
  color: string;
  operator?: string;
  type?: RouteType;
}

// ---------------------------------------------------------------------------
// Cargo
// ---------------------------------------------------------------------------

export interface CargoShipmentResponse {
  id: string;
  type: string;
  quantity: number;
  unit: string;
  originStationId: string;
  destinationStationId: string;
  assignedTrainId: string | null;
  status: 'waiting' | 'in_transit' | 'delivered';
  createdAt: number;
  loadedAt: number | null;
  deliveredAt: number | null;
  industrySource: string;
  industryDestination: string;
}

// ---------------------------------------------------------------------------
// Passengers
// ---------------------------------------------------------------------------

export interface PassengerResponse {
  id: string;
  name: string;
  ageGroup: string;
  originStationId: string;
  destinationStationId: string;
  assignedTrainId: string | null;
  activity: string;
  mood: string;
  status: 'waiting' | 'in_transit' | 'arrived';
  createdAt: number;
  boardedAt: number | null;
  arrivedAt: number | null;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface SimEventResponse {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export interface NetworkNodeResponse {
  stationId: string;
  connectedRouteIds: string[];
  isJunction: boolean;
}

export interface NetworkGraphResponse {
  junctionStationIds: string[];
  totalNodes: number;
  totalEdges: number;
  nodes: NetworkNodeResponse[];
  connectivity: Array<{
    routeId: string;
    stationIds: string[];
    lengthMiles: number;
    operator?: string;
    type?: string;
  }>;
}

export interface NetworkPathResponse {
  fromStationId: string;
  toStationId: string;
  legs: Array<{
    routeId: string;
    fromStationId: string;
    toStationId: string;
    distanceMiles: number;
  }>;
  totalDistanceMiles: number;
  stationSequence: string[];
}

// ---------------------------------------------------------------------------
// JSON-RPC bridge protocol
// ---------------------------------------------------------------------------

export interface BridgeRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface BridgeResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
