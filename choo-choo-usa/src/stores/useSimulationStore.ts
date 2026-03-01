import { create } from 'zustand';
import type { SimulationSpeed } from '../types/simulation';
import {
  getTimeOfDay,
  getDayNumber,
  isDaytime,
  getTimeOfDayPeriod,
  type TimeOfDayPeriod,
} from '../utils/time';

interface SimulationStore {
  clock: number;
  speed: SimulationSpeed;
  dayNumber: number;
  timeOfDay: number;
  isDaytime: boolean;
  isPaused: boolean;
  timeOfDayPeriod: TimeOfDayPeriod;

  setSpeed: (speed: SimulationSpeed) => void;
  tick: (deltaMs: number) => void;
  setClock: (clock: number) => void;
}

// Start at 4:30 AM so the player can witness the dawn and morning departure
const INITIAL_CLOCK = 4 * 60 + 30;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  clock: INITIAL_CLOCK,
  speed: 1,
  dayNumber: getDayNumber(INITIAL_CLOCK),
  timeOfDay: getTimeOfDay(INITIAL_CLOCK),
  isDaytime: isDaytime(INITIAL_CLOCK),
  isPaused: false,
  timeOfDayPeriod: getTimeOfDayPeriod(INITIAL_CLOCK),

  setSpeed: (speed) =>
    set({ speed, isPaused: speed === 0 }),

  tick: (deltaMs) => {
    const { speed, clock } = get();
    if (speed === 0) return;

    // 1 real second = 1 sim minute at 1x speed
    // deltaMs is in milliseconds, so sim minutes = (deltaMs/1000) * speed
    const simMinutes = (deltaMs / 1000) * speed;
    const newClock = clock + simMinutes;

    set({
      clock: newClock,
      dayNumber: getDayNumber(newClock),
      timeOfDay: getTimeOfDay(newClock),
      isDaytime: isDaytime(newClock),
      timeOfDayPeriod: getTimeOfDayPeriod(newClock),
    });
  },

  setClock: (clock) =>
    set({
      clock,
      dayNumber: getDayNumber(clock),
      timeOfDay: getTimeOfDay(clock),
      isDaytime: isDaytime(clock),
      timeOfDayPeriod: getTimeOfDayPeriod(clock),
    }),
}));
