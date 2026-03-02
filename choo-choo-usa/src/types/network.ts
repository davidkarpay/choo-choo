/**
 * network.ts
 *
 * Graph-layer types for the rail network. These overlay the existing
 * corridor/route model with an interconnected graph so trains can
 * traverse multiple corridors via junction stations.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - route.ts: Route corridors that form edges
 *   - station.ts: Stations that form nodes
 */

/** A node in the rail network — one station that may connect to multiple routes. */
export interface NetworkNode {
  /** Station ID (matches Station.id). */
  stationId: string;
  /** Route IDs that pass through this station. */
  connectedRouteIds: string[];
  /** True if this station appears in 2+ routes (transfer point). */
  isJunction: boolean;
}

/** An edge in the rail network — one route corridor connecting stations. */
export interface NetworkEdge {
  /** Route ID (matches Route.id). */
  routeId: string;
  /** Ordered station IDs along this route. */
  stationIds: string[];
  /** Railroad operator (e.g., "BNSF", "Amtrak"). */
  operator?: string;
  /** Route type: freight-only, passenger-only, or mixed. */
  type?: 'freight' | 'passenger' | 'mixed';
  /** Total length in miles. */
  lengthMiles: number;
}

/** One leg of a multi-corridor journey. */
export interface NetworkPathLeg {
  /** Route corridor for this leg. */
  routeId: string;
  /** Station where this leg begins. */
  fromStationId: string;
  /** Station where this leg ends (junction or final destination). */
  toStationId: string;
  /** Estimated distance for this leg in miles. */
  distanceMiles: number;
}

/** A pre-computed path through the network, possibly spanning multiple corridors. */
export interface NetworkPath {
  /** Starting station ID. */
  fromStationId: string;
  /** Ending station ID. */
  toStationId: string;
  /** Ordered legs of the journey. */
  legs: NetworkPathLeg[];
  /** Total distance in miles across all legs. */
  totalDistanceMiles: number;
  /** Ordered station IDs along the full path (including junctions). */
  stationSequence: string[];
}

/** Adjacency entry: from a station, which other stations are directly reachable and on which route. */
export interface AdjacencyEntry {
  /** Neighboring station ID. */
  neighborStationId: string;
  /** Route that connects them. */
  routeId: string;
  /** Distance in miles between the two stations along that route. */
  distanceMiles: number;
}

/** The full rail network graph. */
export interface RailNetwork {
  /** All nodes keyed by station ID. */
  nodes: Map<string, NetworkNode>;
  /** All edges keyed by route ID. */
  edges: Map<string, NetworkEdge>;
  /** Adjacency map: stationId -> list of directly reachable neighbors. */
  adjacency: Map<string, AdjacencyEntry[]>;
  /** Station IDs that are junctions (appear in 2+ routes). */
  junctionIds: string[];
}
