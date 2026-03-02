import type { CargoType, CargoShipment } from './cargo';
import type { Passenger } from './passenger';

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
export type WhistleType = 'deep' | 'high' | 'horn' | 'scratchy' | 'mellow' | 'sharp';

export type TrainCategory = 'freight' | 'passenger';

export interface TrainSeedData {
  id: string;
  name: string;
  type: TrainType;
  color: {
    primary: string;
    secondary: string;
    accent: string;
  };
  personality: string;
  whistleType: WhistleType;
  whistleSoundFile: string;
  cargoCapability: CargoType[];
  maxCars: number;
  speedMph: number;
  homeRoundhouseId: string;
  berthIndex: number;
  /** Railroad operator (e.g., "BNSF", "Amtrak"). Added in Phase 5. */
  operator?: string;
  /** Whether this train runs freight or passenger service. Added in Phase 5. */
  category?: TrainCategory;
  /** Preferred route IDs this train runs on, in order. Added in Phase 5. */
  preferredRouteIds?: string[];
}

export interface Train extends TrainSeedData {
  status: TrainStatus;
  currentRouteId: string | null;
  routeProgress: number;
  currentPosition: [number, number];
  heading: number;
  cargoManifest: CargoShipment[];
  passengers: Passenger[];
  /** Index into the route's station progress array (which segment we're on). */
  currentSegmentIndex: number;
  /** Progress within the current segment, 0.0 to 1.0. */
  segmentProgress: number;
  /** Remaining dwell time at a station, in simulated minutes. */
  dwellTimer: number;
  /** Station the train is currently dwelling at, or null. */
  dwellStationId: string | null;
  /** Route IDs for a multi-corridor journey (Phase 5). */
  currentJourneyRoutes?: string[];
  /** Current leg index within currentJourneyRoutes (Phase 5). */
  currentJourneyLeg: number;
  stats: {
    totalMiles: number;
    totalDeliveries: number;
    totalPassengersCarried: number;
  };
}
