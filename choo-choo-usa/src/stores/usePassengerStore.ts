/**
 * usePassengerStore.ts
 *
 * Zustand store for passenger journey state. Tracks passengers waiting
 * at stations, in transit on trains, and arrived at their destinations.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - zustand: state management
 *   - passenger types
 */

import { create } from 'zustand';
import type { Passenger, PassengerActivity } from '../types/passenger';

const MAX_ACTIVE_PASSENGERS = 300;

interface PassengerStore {
  passengers: Passenger[];
  arrivedCount: number;

  addPassenger: (passenger: Passenger) => void;
  boardPassenger: (passengerId: string, trainId: string, boardedAt: number) => void;
  arrivePassenger: (passengerId: string, arrivedAt: number) => void;
  updateActivity: (passengerId: string, activity: PassengerActivity) => void;
  getWaitingAtStation: (stationId: string) => Passenger[];
  getOnTrain: (trainId: string) => Passenger[];
  getActiveCount: () => number;
}

export const usePassengerStore = create<PassengerStore>((set, get) => ({
  passengers: [],
  arrivedCount: 0,

  addPassenger: (passenger) =>
    set((state) => {
      if (state.passengers.length >= MAX_ACTIVE_PASSENGERS) return state;
      return { passengers: [...state.passengers, passenger] };
    }),

  boardPassenger: (passengerId, trainId, boardedAt) =>
    set((state) => ({
      passengers: state.passengers.map((p) =>
        p.id === passengerId
          ? { ...p, assignedTrainId: trainId, status: 'in_transit' as const, activity: 'boarding' as const, boardedAt }
          : p
      ),
    })),

  arrivePassenger: (passengerId, arrivedAt) =>
    set((state) => {
      const passenger = state.passengers.find((p) => p.id === passengerId);
      if (!passenger) return state;
      return {
        passengers: state.passengers.filter((p) => p.id !== passengerId),
        arrivedCount: state.arrivedCount + 1,
      };
    }),

  updateActivity: (passengerId, activity) =>
    set((state) => ({
      passengers: state.passengers.map((p) =>
        p.id === passengerId ? { ...p, activity } : p
      ),
    })),

  getWaitingAtStation: (stationId) =>
    get().passengers.filter(
      (p) => p.status === 'waiting' && p.originStationId === stationId
    ),

  getOnTrain: (trainId) =>
    get().passengers.filter(
      (p) => p.status === 'in_transit' && p.assignedTrainId === trainId
    ),

  getActiveCount: () => get().passengers.length,
}));
