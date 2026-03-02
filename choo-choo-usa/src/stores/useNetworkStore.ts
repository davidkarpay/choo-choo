/**
 * useNetworkStore.ts
 *
 * Zustand store holding the rail network graph. Exposes pathfinding,
 * junction queries, and route-for-station lookups. Built from the
 * route and station stores on initialization.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - zustand: state management
 *   - engine/networkGraph: graph builder and Dijkstra
 *   - types/network: RailNetwork, NetworkPath
 *   - stores/useRouteStore: route data
 *   - stores/useStationStore: station data
 */

import { create } from 'zustand';
import type { RailNetwork, NetworkPath } from '../types/network';
import {
  buildNetwork,
  findPath as graphFindPath,
  getJunctions as graphGetJunctions,
  getRoutesForStation as graphGetRoutesForStation,
  getReachableStations as graphGetReachableStations,
} from '../engine/networkGraph';
import { useRouteStore } from './useRouteStore';
import { useStationStore } from './useStationStore';

interface NetworkStore {
  /** The computed rail network graph, or null if not yet initialized. */
  network: RailNetwork | null;
  /** Whether the network has been built at least once. */
  initialized: boolean;

  /**
   * Build or rebuild the network from current routes and stations.
   * Call once at app startup after routes and stations are loaded.
   */
  initialize: () => void;

  /**
   * Find the shortest path between two stations.
   * Returns null if no path exists or network not initialized.
   */
  findPath: (fromStationId: string, toStationId: string) => NetworkPath | null;

  /**
   * Get all junction station IDs (stations on 2+ routes).
   */
  getJunctions: () => string[];

  /**
   * Get all route IDs passing through a station.
   */
  getRoutesForStation: (stationId: string) => string[];

  /**
   * Get all stations reachable from a given station.
   */
  getReachableStations: (stationId: string) => Set<string>;

  /**
   * Check whether a station is a junction.
   */
  isJunction: (stationId: string) => boolean;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  network: null,
  initialized: false,

  initialize: () => {
    const routes = useRouteStore.getState().routes;
    const stations = useStationStore.getState().stations;
    const network = buildNetwork(routes, stations);
    set({ network, initialized: true });
  },

  findPath: (fromStationId, toStationId) => {
    const { network } = get();
    if (!network) return null;
    return graphFindPath(network, fromStationId, toStationId);
  },

  getJunctions: () => {
    const { network } = get();
    if (!network) return [];
    return graphGetJunctions(network);
  },

  getRoutesForStation: (stationId) => {
    const { network } = get();
    if (!network) return [];
    return graphGetRoutesForStation(network, stationId);
  },

  getReachableStations: (stationId) => {
    const { network } = get();
    if (!network) return new Set<string>();
    return graphGetReachableStations(network, stationId);
  },

  isJunction: (stationId) => {
    const { network } = get();
    if (!network) return false;
    const node = network.nodes.get(stationId);
    return node?.isJunction ?? false;
  },
}));
