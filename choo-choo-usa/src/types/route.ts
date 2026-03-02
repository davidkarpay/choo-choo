import type { CargoType } from './cargo';

export type RouteOperator = 'BNSF' | 'UP' | 'CSX' | 'NS' | 'CN' | 'Amtrak' | 'mixed' | string;
export type RouteType = 'freight' | 'passenger' | 'mixed';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface Route {
  id: string;
  name: string;
  description: string;
  stationIds: string[];
  geometry: RouteGeometry;
  lengthMiles: number;
  primaryCargoTypes: CargoType[];
  color: string;
  /** Railroad operator (e.g., "BNSF", "Amtrak"). Added in Phase 5. */
  operator?: RouteOperator;
  /** Whether this corridor is freight, passenger, or mixed. Added in Phase 5. */
  type?: RouteType;
  /** Simplified geometry for low-zoom rendering (Douglas-Peucker). Added in Phase 5. */
  geometrySimplified?: RouteGeometry;
}
