/**
 * networkGraph.ts
 *
 * Builds an interconnected graph from the existing corridor/route model
 * so trains can traverse multiple corridors via junction stations. Provides
 * Dijkstra pathfinding and junction detection.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - types/network: graph types (RailNetwork, NetworkPath, etc.)
 *   - types/route: Route corridor data
 *   - types/station: Station data for position lookups
 *   - utils/geo: haversineDistance for edge weights
 */

import type { Route } from '../types/route';
import type { Station } from '../types/station';
import type {
  RailNetwork,
  NetworkNode,
  NetworkEdge,
  NetworkPath,
  NetworkPathLeg,
  AdjacencyEntry,
} from '../types/network';
import { haversineDistance } from '../utils/geo';

/** LRU-style path cache with a max size to prevent unbounded growth. */
const pathCache = new Map<string, NetworkPath | null>();
const PATH_CACHE_MAX = 200;

/**
 * Build the rail network graph from routes and stations.
 *
 * Scans all routes to determine which stations connect to which routes,
 * identifies junctions (stations appearing in 2+ routes), and builds
 * an adjacency map with haversine-based edge weights.
 *
 * Args:
 *   routes: All rail corridors.
 *   stations: All stations (used for position lookups).
 *
 * Returns:
 *   A complete RailNetwork graph.
 */
export function buildNetwork(routes: Route[], stations: Station[]): RailNetwork {
  const stationMap = new Map<string, Station>();
  for (const s of stations) {
    stationMap.set(s.id, s);
  }

  // Build nodes: track which routes each station belongs to
  const nodeMap = new Map<string, NetworkNode>();
  for (const route of routes) {
    for (const stationId of route.stationIds) {
      const existing = nodeMap.get(stationId);
      if (existing) {
        if (!existing.connectedRouteIds.includes(route.id)) {
          existing.connectedRouteIds.push(route.id);
        }
      } else {
        nodeMap.set(stationId, {
          stationId,
          connectedRouteIds: [route.id],
          isJunction: false,
        });
      }
    }
  }

  // Mark junctions
  const junctionIds: string[] = [];
  for (const node of nodeMap.values()) {
    node.isJunction = node.connectedRouteIds.length >= 2;
    if (node.isJunction) {
      junctionIds.push(node.stationId);
    }
  }

  // Build edges
  const edgeMap = new Map<string, NetworkEdge>();
  for (const route of routes) {
    edgeMap.set(route.id, {
      routeId: route.id,
      stationIds: route.stationIds,
      operator: route.operator,
      type: route.type,
      lengthMiles: route.lengthMiles,
    });
  }

  // Build adjacency: for each route, connect consecutive stations
  const adjacency = new Map<string, AdjacencyEntry[]>();
  for (const route of routes) {
    const ids = route.stationIds;
    for (let i = 0; i < ids.length - 1; i++) {
      const fromId = ids[i];
      const toId = ids[i + 1];
      const fromStation = stationMap.get(fromId);
      const toStation = stationMap.get(toId);
      if (!fromStation || !toStation) continue;

      // Distance between consecutive stations using their positions
      // Station positions are [lat, lng], haversineDistance expects [lng, lat]
      const dist = haversineDistance(
        [fromStation.position[1], fromStation.position[0]],
        [toStation.position[1], toStation.position[0]]
      );

      // Add bidirectional edges
      addAdjacency(adjacency, fromId, { neighborStationId: toId, routeId: route.id, distanceMiles: dist });
      addAdjacency(adjacency, toId, { neighborStationId: fromId, routeId: route.id, distanceMiles: dist });
    }
  }

  // Clear path cache when network is rebuilt
  pathCache.clear();

  return { nodes: nodeMap, edges: edgeMap, adjacency, junctionIds };
}

function addAdjacency(
  adj: Map<string, AdjacencyEntry[]>,
  stationId: string,
  entry: AdjacencyEntry
): void {
  const list = adj.get(stationId);
  if (list) {
    // Avoid duplicate entries (same neighbor via same route)
    const exists = list.some(
      (e) => e.neighborStationId === entry.neighborStationId && e.routeId === entry.routeId
    );
    if (!exists) list.push(entry);
  } else {
    adj.set(stationId, [entry]);
  }
}

/**
 * Find the shortest path between two stations using Dijkstra's algorithm.
 *
 * Uses haversine-based segment distances as edge weights. Results are
 * cached for repeated lookups.
 *
 * Args:
 *   network: The rail network graph.
 *   fromStationId: Starting station ID.
 *   toStationId: Destination station ID.
 *
 * Returns:
 *   A NetworkPath with legs, or null if no path exists.
 */
export function findPath(
  network: RailNetwork,
  fromStationId: string,
  toStationId: string
): NetworkPath | null {
  if (fromStationId === toStationId) return null;

  const cacheKey = `${fromStationId}:${toStationId}`;
  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey) ?? null;
  }

  const result = dijkstra(network, fromStationId, toStationId);

  // Evict oldest entries if cache is full
  if (pathCache.size >= PATH_CACHE_MAX) {
    const firstKey = pathCache.keys().next().value;
    if (firstKey !== undefined) pathCache.delete(firstKey);
  }
  pathCache.set(cacheKey, result);

  return result;
}

/**
 * Internal Dijkstra implementation.
 *
 * Tracks which route each step uses so we can reconstruct legs
 * (grouped by corridor).
 */
function dijkstra(
  network: RailNetwork,
  from: string,
  to: string
): NetworkPath | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { stationId: string; routeId: string } | null>();
  const visited = new Set<string>();

  // Simple priority queue using an array (fine for our ~100-station graph)
  const queue: { stationId: string; distance: number }[] = [];

  dist.set(from, 0);
  prev.set(from, null);
  queue.push({ stationId: from, distance: 0 });

  while (queue.length > 0) {
    // Extract minimum
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift()!;

    if (visited.has(current.stationId)) continue;
    visited.add(current.stationId);

    if (current.stationId === to) break;

    const neighbors = network.adjacency.get(current.stationId) ?? [];
    for (const edge of neighbors) {
      if (visited.has(edge.neighborStationId)) continue;

      const newDist = current.distance + edge.distanceMiles;
      const known = dist.get(edge.neighborStationId);

      if (known === undefined || newDist < known) {
        dist.set(edge.neighborStationId, newDist);
        prev.set(edge.neighborStationId, {
          stationId: current.stationId,
          routeId: edge.routeId,
        });
        queue.push({ stationId: edge.neighborStationId, distance: newDist });
      }
    }
  }

  // Reconstruct path
  if (!prev.has(to)) return null;

  const stationSequence: string[] = [];
  const steps: { stationId: string; routeId: string }[] = [];
  let current: string | undefined = to;

  while (current !== undefined) {
    stationSequence.unshift(current);
    const p = prev.get(current);
    if (p === null || p === undefined) break;
    steps.unshift({ stationId: current, routeId: p.routeId });
    current = p.stationId;
  }

  if (stationSequence[0] !== from) return null;

  // Group consecutive steps on the same route into legs
  const legs: NetworkPathLeg[] = [];
  let legStart = stationSequence[0];
  let legRoute = steps.length > 0 ? steps[0].routeId : '';
  let legDist = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const prevStation = stationSequence[i];
    const nextStation = step.stationId;

    if (step.routeId !== legRoute && i > 0) {
      // End current leg
      legs.push({
        routeId: legRoute,
        fromStationId: legStart,
        toStationId: prevStation,
        distanceMiles: legDist,
      });
      legStart = prevStation;
      legRoute = step.routeId;
      legDist = 0;
    }

    // Accumulate distance for this step
    const edgeDist = getEdgeDistance(network, prevStation, nextStation, step.routeId);
    legDist += edgeDist;
  }

  // Close final leg
  if (stationSequence.length > 1) {
    legs.push({
      routeId: legRoute,
      fromStationId: legStart,
      toStationId: to,
      distanceMiles: legDist,
    });
  }

  const totalDistanceMiles = dist.get(to) ?? 0;

  return {
    fromStationId: from,
    toStationId: to,
    legs,
    totalDistanceMiles,
    stationSequence,
  };
}

/**
 * Get the distance between two adjacent stations on a specific route.
 */
function getEdgeDistance(
  network: RailNetwork,
  from: string,
  to: string,
  routeId: string
): number {
  const neighbors = network.adjacency.get(from) ?? [];
  const edge = neighbors.find(
    (e) => e.neighborStationId === to && e.routeId === routeId
  );
  return edge?.distanceMiles ?? 0;
}

/**
 * Get all junction stations (stations appearing in 2+ routes).
 *
 * Args:
 *   network: The rail network graph.
 *
 * Returns:
 *   Array of junction station IDs.
 */
export function getJunctions(network: RailNetwork): string[] {
  return network.junctionIds;
}

/**
 * Get all route IDs that pass through a given station.
 *
 * Args:
 *   network: The rail network graph.
 *   stationId: Station to look up.
 *
 * Returns:
 *   Array of route IDs, or empty array if station not in network.
 */
export function getRoutesForStation(network: RailNetwork, stationId: string): string[] {
  const node = network.nodes.get(stationId);
  return node ? node.connectedRouteIds : [];
}

/**
 * Get all stations reachable from a given station (any number of hops).
 *
 * Uses BFS traversal of the adjacency graph.
 *
 * Args:
 *   network: The rail network graph.
 *   stationId: Starting station.
 *
 * Returns:
 *   Set of reachable station IDs (excluding the start).
 */
export function getReachableStations(network: RailNetwork, stationId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [stationId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = network.adjacency.get(current) ?? [];
    for (const edge of neighbors) {
      if (!visited.has(edge.neighborStationId)) {
        queue.push(edge.neighborStationId);
      }
    }
  }

  visited.delete(stationId);
  return visited;
}

/**
 * Clear the path cache. Call when the network changes.
 */
export function clearPathCache(): void {
  pathCache.clear();
}
