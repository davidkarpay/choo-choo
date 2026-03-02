/**
 * useRouteStore.ts
 *
 * Zustand store for rail corridor data. Loads routes from the static
 * JSON seed file and provides lookup helpers.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 */

import { create } from 'zustand';
import type { Route } from '../types/route';
import routeSeedData from '../../data/routes.json';

interface RouteStore {
  routes: Route[];
  selectedRouteId: string | null;

  selectRoute: (id: string | null) => void;
  getRouteById: (id: string) => Route | undefined;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: routeSeedData as Route[],
  selectedRouteId: null,

  selectRoute: (id) => set({ selectedRouteId: id }),
  getRouteById: (id) => get().routes.find((r) => r.id === id),
}));
