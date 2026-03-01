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
}

export interface Train extends TrainSeedData {
  status: TrainStatus;
  currentRouteId: string | null;
  routeProgress: number;
  currentPosition: [number, number];
  heading: number;
  cargoManifest: CargoShipment[];
  passengers: Passenger[];
  stats: {
    totalMiles: number;
    totalDeliveries: number;
    totalPassengersCarried: number;
  };
}
