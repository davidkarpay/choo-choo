export type SimulationSpeed = 0 | 1 | 5 | 15 | 60;

export interface DailyStats {
  cargoTonsMoved: number;
  cargoDeliveries: number;
  passengersDelivered: number;
  trainMilesTraveled: number;
  busiestStation: string;
  busiestCorridor: string;
}

export interface SimulationState {
  clock: number;
  speed: SimulationSpeed;
  dayNumber: number;
  timeOfDay: number;
  isDaytime: boolean;
  isPaused: boolean;
  stats: {
    today: DailyStats;
    allTime: DailyStats;
  };
}
