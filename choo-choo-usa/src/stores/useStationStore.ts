/**
 * useStationStore.ts
 *
 * Zustand store for station data. Loads stations from the static JSON
 * seed file and provides lookup helpers.
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
}

export const useStationStore = create<StationStore>((set, get) => ({
  stations: (stationSeedData as StationSeed[]).map(initStation),
  selectedStationId: null,

  selectStation: (id) => set({ selectedStationId: id }),
  getStationById: (id) => get().stations.find((s) => s.id === id),
}));
