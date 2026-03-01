import { create } from 'zustand';

export type SceneId = 'roundhouse' | 'national-map' | 'station' | 'train-interior';

interface PlayerStore {
  currentScene: SceneId;
  cameraX: number;
  cameraY: number;
  zoom: number;

  setScene: (scene: SceneId) => void;
  setCamera: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentScene: 'roundhouse',
  cameraX: 0,
  cameraY: 0,
  zoom: 1,

  setScene: (scene) => set({ currentScene: scene }),
  setCamera: (x, y) => set({ cameraX: x, cameraY: y }),
  setZoom: (zoom) => set({ zoom }),
}));
