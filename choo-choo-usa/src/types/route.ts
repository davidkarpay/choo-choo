import type { CargoType } from './cargo';

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
}
