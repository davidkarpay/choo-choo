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
  | 'passengers';

export type CargoCategory = 'minerals' | 'agriculture' | 'manufacturing' | 'energy' | 'goods' | 'people';

export interface CargoTypeDefinition {
  type: CargoType;
  category: CargoCategory;
  displayName: string;
  unit: string;
  carType: string;
  icon: string;
  color: string;
  description: string;
}

export interface CargoShipment {
  id: string;
  type: CargoType;
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
