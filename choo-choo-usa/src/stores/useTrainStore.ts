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
    currentSegmentIndex: 0,
    segmentProgress: 0,
    dwellTimer: 0,
    dwellStationId: null,
    currentJourneyRoutes: undefined,
    currentJourneyLeg: 0,
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
  followedTrainId: string | null;

  selectTrain: (id: string | null) => void;
  followTrain: (id: string | null) => void;
  setTrainStatus: (id: string, status: TrainStatus) => void;
  setAllStatus: (status: TrainStatus) => void;
  getTrainById: (id: string) => Train | undefined;
  assignRoute: (trainId: string, routeId: string) => void;
  updateRouteProgress: (trainId: string, progress: number, position: [number, number], heading: number) => void;
  clearRoute: (trainId: string) => void;

  // Segment-based movement (Phase 3)
  advanceSegment: (trainId: string) => void;
  setDwellTimer: (trainId: string, minutes: number, stationId: string) => void;
  tickDwellTimer: (trainId: string, deltaMinutes: number) => number;
  updateSegmentProgress: (trainId: string, segProgress: number) => void;
  setSegmentIndex: (trainId: string, index: number) => void;

  // Cargo/passenger helpers (Phase 3)
  updateTrainCargo: (trainId: string, updater: (train: Train) => Partial<Train>) => void;

  // Stats (Phase 3)
  recordTrainStats: (trainId: string, stats: { miles?: number; deliveries?: number; passengersCarried?: number }) => void;

  // Multi-corridor journey (Phase 5)
  setJourneyPlan: (trainId: string, routes: string[]) => void;
  advanceJourneyLeg: (trainId: string) => void;
  clearJourneyPlan: (trainId: string) => void;
}

export const useTrainStore = create<TrainStore>((set, get) => ({
  trains: (trainSeedData as TrainSeedData[]).map(initTrain),
  selectedTrainId: null,
  followedTrainId: null,

  selectTrain: (id) => set({ selectedTrainId: id }),
  followTrain: (id) => set({ followedTrainId: id }),

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

  assignRoute: (trainId, routeId) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? { ...t, currentRouteId: routeId, routeProgress: 0, currentSegmentIndex: 0, segmentProgress: 0, dwellTimer: 0, dwellStationId: null }
          : t
      ),
    })),

  updateRouteProgress: (trainId, progress, position, heading) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId ? { ...t, routeProgress: progress, currentPosition: position, heading } : t
      ),
    })),

  clearRoute: (trainId) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? {
              ...t,
              currentRouteId: null,
              routeProgress: 0,
              currentPosition: [0, 0] as [number, number],
              heading: 0,
              currentSegmentIndex: 0,
              segmentProgress: 0,
              dwellTimer: 0,
              dwellStationId: null,
            }
          : t
      ),
    })),

  advanceSegment: (trainId) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? { ...t, currentSegmentIndex: t.currentSegmentIndex + 1, segmentProgress: 0 }
          : t
      ),
    })),

  setDwellTimer: (trainId, minutes, stationId) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? { ...t, dwellTimer: minutes, dwellStationId: stationId, status: 'at_station' as TrainStatus }
          : t
      ),
    })),

  tickDwellTimer: (trainId, deltaMinutes) => {
    let remaining = 0;
    set((state) => ({
      trains: state.trains.map((t) => {
        if (t.id !== trainId) return t;
        const newTimer = Math.max(0, t.dwellTimer - deltaMinutes);
        remaining = newTimer;
        return { ...t, dwellTimer: newTimer };
      }),
    }));
    return remaining;
  },

  updateSegmentProgress: (trainId, segProgress) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId ? { ...t, segmentProgress: segProgress } : t
      ),
    })),

  setSegmentIndex: (trainId, index) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId ? { ...t, currentSegmentIndex: index, segmentProgress: 0 } : t
      ),
    })),

  updateTrainCargo: (trainId, updater) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId ? { ...t, ...updater(t) } : t
      ),
    })),

  recordTrainStats: (trainId, stats) =>
    set((state) => ({
      trains: state.trains.map((t) => {
        if (t.id !== trainId) return t;
        return {
          ...t,
          stats: {
            totalMiles: t.stats.totalMiles + (stats.miles ?? 0),
            totalDeliveries: t.stats.totalDeliveries + (stats.deliveries ?? 0),
            totalPassengersCarried: t.stats.totalPassengersCarried + (stats.passengersCarried ?? 0),
          },
        };
      }),
    })),

  setJourneyPlan: (trainId, routes) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? { ...t, currentJourneyRoutes: routes, currentJourneyLeg: 0 }
          : t
      ),
    })),

  advanceJourneyLeg: (trainId) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? { ...t, currentJourneyLeg: t.currentJourneyLeg + 1 }
          : t
      ),
    })),

  clearJourneyPlan: (trainId) =>
    set((state) => ({
      trains: state.trains.map((t) =>
        t.id === trainId
          ? { ...t, currentJourneyRoutes: undefined, currentJourneyLeg: 0 }
          : t
      ),
    })),
}));
