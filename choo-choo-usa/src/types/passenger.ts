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
  clothingColor: string;
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
  createdAt: number;
  boardedAt: number | null;
  arrivedAt: number | null;
}
