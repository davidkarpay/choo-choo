import type { CargoType, CargoShipment } from './cargo';
import type { Passenger } from './passenger';

export type StationSize = 'major_hub' | 'regional' | 'local';

export interface IndustryInstance {
  type: string;
  name: string;
  produces: CargoType[];
  consumes: CargoType[];
  productionRate: number;
  minBatch: number;
  maxBatch: number;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  position: [number, number];
  size: StationSize;
  trackCount: number;
  industries: IndustryInstance[];
  architectureStyle: 'grand' | 'modest' | 'rustic';
  description: string;
  waitingCargo: CargoShipment[];
  waitingPassengers: Passenger[];
  trainsAtStation: string[];
  /** True if this station appears in 2+ routes (Phase 5). */
  isJunction?: boolean;
  /** Route IDs that pass through this station (Phase 5). */
  connectedRouteIds?: string[];
}
