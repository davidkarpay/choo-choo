import { create } from 'zustand';
import type { Train, TrainStatus } from '../types/train';
import type { TrainSeedData } from '../types/train';
import trainSeedData from '../../data/trains.json';

function initTrain(seed: TrainSeedData): Train {
  return {
    ...seed,
    status: 'sleeping' as TrainStatus,
    currentRouteId: null,
    routeProgress: 0,
    currentPosition: [0, 0],
    heading: 0,
    cargoManifest: [],
    passengers: [],
    stats: {
      totalMiles: 0,
      totalDeliveries: 0,
      totalPassengersCarried: 0,
    },
  };
}

interface TrainStore {
  trains: Train[];
  selectedTrainId: string | null;

  selectTrain: (id: string | null) => void;
  setTrainStatus: (id: string, status: TrainStatus) => void;
  setAllStatus: (status: TrainStatus) => void;
  getTrainById: (id: string) => Train | undefined;
}

export const useTrainStore = create<TrainStore>((set, get) => ({
  trains: (trainSeedData as TrainSeedData[]).map(initTrain),
  selectedTrainId: null,

  selectTrain: (id) => set({ selectedTrainId: id }),

  setTrainStatus: (id, status) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    })),

  setAllStatus: (status) =>
    set((state) => ({
      trains: state.trains.map((t) => ({ ...t, status })),
    })),

  getTrainById: (id) => get().trains.find((t) => t.id === id),
}));
