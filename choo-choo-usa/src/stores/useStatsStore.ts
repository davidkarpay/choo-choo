/**
 * useStatsStore.ts
 *
 * Zustand store for daily and all-time simulation statistics.
 * Tracks cargo tonnage, delivery counts, passenger counts, and
 * train mileage. Daily stats reset at midnight.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - zustand: state management
 *   - simulation types: DailyStats
 */

import { create } from 'zustand';
import type { DailyStats } from '../types/simulation';

function emptyStats(): DailyStats {
  return {
    cargoTonsMoved: 0,
    cargoDeliveries: 0,
    passengersDelivered: 0,
    trainMilesTraveled: 0,
    busiestStation: '',
    busiestCorridor: '',
  };
}

interface StatsStore {
  today: DailyStats;
  allTime: DailyStats;

  recordCargoDelivery: (tons: number) => void;
  recordPassengerDelivery: () => void;
  recordTrainMiles: (miles: number) => void;
  setBusiestStation: (stationName: string) => void;
  setBusiestCorridor: (corridorName: string) => void;
  resetDaily: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  today: emptyStats(),
  allTime: emptyStats(),

  recordCargoDelivery: (tons) =>
    set((state) => ({
      today: {
        ...state.today,
        cargoTonsMoved: state.today.cargoTonsMoved + tons,
        cargoDeliveries: state.today.cargoDeliveries + 1,
      },
      allTime: {
        ...state.allTime,
        cargoTonsMoved: state.allTime.cargoTonsMoved + tons,
        cargoDeliveries: state.allTime.cargoDeliveries + 1,
      },
    })),

  recordPassengerDelivery: () =>
    set((state) => ({
      today: {
        ...state.today,
        passengersDelivered: state.today.passengersDelivered + 1,
      },
      allTime: {
        ...state.allTime,
        passengersDelivered: state.allTime.passengersDelivered + 1,
      },
    })),

  recordTrainMiles: (miles) =>
    set((state) => ({
      today: {
        ...state.today,
        trainMilesTraveled: state.today.trainMilesTraveled + miles,
      },
      allTime: {
        ...state.allTime,
        trainMilesTraveled: state.allTime.trainMilesTraveled + miles,
      },
    })),

  setBusiestStation: (stationName) =>
    set((state) => ({
      today: { ...state.today, busiestStation: stationName },
    })),

  setBusiestCorridor: (corridorName) =>
    set((state) => ({
      today: { ...state.today, busiestCorridor: corridorName },
    })),

  resetDaily: () =>
    set((state) => ({
      today: emptyStats(),
    })),
}));
