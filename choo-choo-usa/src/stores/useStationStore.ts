/**
 * useStationStore.ts
 *
 * Zustand store for station data. Loads stations from the static JSON
 * seed file and provides lookup helpers. Also manages runtime state
 * for waiting cargo, waiting passengers, and trains at the station.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 */

import { create } from 'zustand';
import type { Station } from '../types/station';
import stationSeedData from '../../data/stations.json';

/** Seed data omits runtime arrays that start empty. */
type StationSeed = Omit<Station, 'waitingCargo' | 'waitingPassengers' | 'trainsAtStation'>;

function initStation(seed: StationSeed): Station {
  return {
    ...seed,
    waitingCargo: [],
    waitingPassengers: [],
    trainsAtStation: [],
  };
}

interface StationStore {
  stations: Station[];
  selectedStationId: string | null;

  selectStation: (id: string | null) => void;
  getStationById: (id: string) => Station | undefined;

  // Cargo management
  addWaitingCargo: (stationId: string, shipmentId: string) => void;
  removeWaitingCargo: (stationId: string, shipmentId: string) => void;

  // Passenger management
  addWaitingPassengers: (stationId: string, passengerIds: string[]) => void;
  removeWaitingPassengers: (stationId: string, passengerIds: string[]) => void;

  // Train presence
  addTrainAtStation: (stationId: string, trainId: string) => void;
  removeTrainFromStation: (stationId: string, trainId: string) => void;
}

export const useStationStore = create<StationStore>((set, get) => ({
  stations: (stationSeedData as StationSeed[]).map(initStation),
  selectedStationId: null,

  selectStation: (id) => set({ selectedStationId: id }),
  getStationById: (id) => get().stations.find((s) => s.id === id),

  addWaitingCargo: (stationId, shipmentId) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? { ...s, waitingCargo: [...s.waitingCargo, { id: shipmentId } as any] }
          : s
      ),
    })),

  removeWaitingCargo: (stationId, shipmentId) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? { ...s, waitingCargo: s.waitingCargo.filter((c) => c.id !== shipmentId) }
          : s
      ),
    })),

  addWaitingPassengers: (stationId, passengerIds) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              waitingPassengers: [
                ...s.waitingPassengers,
                ...passengerIds.map((id) => ({ id } as any)),
              ],
            }
          : s
      ),
    })),

  removeWaitingPassengers: (stationId, passengerIds) => {
    const idSet = new Set(passengerIds);
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? { ...s, waitingPassengers: s.waitingPassengers.filter((p) => !idSet.has(p.id)) }
          : s
      ),
    }));
  },

  addTrainAtStation: (stationId, trainId) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId && !s.trainsAtStation.includes(trainId)
          ? { ...s, trainsAtStation: [...s.trainsAtStation, trainId] }
          : s
      ),
    })),

  removeTrainFromStation: (stationId, trainId) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? { ...s, trainsAtStation: s.trainsAtStation.filter((id) => id !== trainId) }
          : s
      ),
    })),
}));
