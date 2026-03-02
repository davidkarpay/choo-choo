/**
 * mcpBridge.ts
 *
 * Browser-side WebSocket bridge that connects the running simulation to
 * the MCP server. The browser app acts as a WebSocket CLIENT, connecting
 * to the MCP server's WebSocket server on ws://localhost:3001.
 *
 * The bridge listens for JSON-RPC 2.0 requests from the MCP server,
 * executes them by reading/writing Zustand stores and engine modules,
 * and sends back JSON-RPC responses. This allows an LLM to query and
 * control the train simulation through the MCP protocol.
 *
 * Activation: The bridge activates when the URL contains `?mcp=true`.
 * It will attempt to connect to ws://localhost:3001 and reconnect with
 * exponential backoff if the MCP server is not yet running.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - stores/useSimulationStore: simulation clock, speed, day/night
 *   - stores/useTrainStore: train state, dispatch, routing
 *   - stores/useStationStore: station data, waiting cargo/passengers
 *   - stores/useRouteStore: route/corridor data
 *   - stores/useCargoStore: cargo shipments
 *   - stores/usePassengerStore: passenger journeys
 *   - stores/useStatsStore: daily and all-time statistics
 *   - stores/useNetworkStore: network graph, pathfinding
 *   - engine/events: simulation event bus and log
 *   - engine/persistence: save/load game state
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import { useSimulationStore } from '../stores/useSimulationStore';
import { useTrainStore } from '../stores/useTrainStore';
import { useStationStore } from '../stores/useStationStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useCargoStore } from '../stores/useCargoStore';
import { usePassengerStore } from '../stores/usePassengerStore';
import { useStatsStore } from '../stores/useStatsStore';
import { useNetworkStore } from '../stores/useNetworkStore';
import { eventBus } from './events';
import { saveGameState, loadGameState, clearGameState } from './persistence';
import type { SimulationSpeed } from '../types/simulation';
import type { Train } from '../types/train';
import type { Station, IndustryInstance } from '../types/station';
import type { Route, RouteGeometry } from '../types/route';
import type { CargoShipment, CargoType } from '../types/cargo';
import type { Passenger, AgeGroup, PassengerMood, PassengerAppearance } from '../types/passenger';

// ---------------------------------------------------------------------------
// JSON-RPC types (must match mcp-server/src/shared/types.ts)
// ---------------------------------------------------------------------------

interface BridgeRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface BridgeResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------------

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const DEFAULT_WS_URL = 'ws://localhost:3001';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether MCP mode is enabled via the URL query parameter.
 *
 * The bridge activates when the app URL contains `?mcp=true`. This
 * function can be called before initMcpBridge() to conditionally
 * render MCP-related UI indicators.
 *
 * Returns:
 *   True if the current URL has the `mcp=true` query parameter.
 *
 * Example:
 *   if (isMcpEnabled()) {
 *     console.log('MCP mode is active');
 *   }
 */
export function isMcpEnabled(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('mcp') === 'true';
}

/**
 * Initialize the MCP bridge if the URL contains ?mcp=true.
 *
 * Call this once at app startup (e.g., in main.tsx or App.tsx). If the
 * mcp query parameter is not present, this function does nothing and
 * returns a no-op cleanup function.
 *
 * Returns:
 *   A cleanup function that disconnects the bridge and stops
 *   reconnection attempts. Safe to call even if the bridge was
 *   never activated.
 *
 * Example:
 *   // In main.tsx or a React useEffect:
 *   const cleanup = initMcpBridge();
 *   // Later, on unmount:
 *   cleanup();
 */
export function initMcpBridge(): () => void {
  if (!isMcpEnabled()) {
    return () => {};
  }

  console.log('[mcpBridge] MCP mode enabled. Connecting to MCP server...');
  connect();

  return disconnectMcpBridge;
}

/**
 * Disconnect the MCP bridge and stop reconnecting.
 *
 * Call this to cleanly shut down the bridge, e.g., on app unmount.
 */
export function disconnectMcpBridge(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  console.log('[mcpBridge] Disconnected');
}

/**
 * Check whether the MCP bridge is currently connected.
 *
 * Returns:
 *   True if the WebSocket connection to the MCP server is open.
 */
export function isMcpBridgeConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

// ---------------------------------------------------------------------------
// WebSocket connection management
// ---------------------------------------------------------------------------

function connect(): void {
  const url = DEFAULT_WS_URL;

  try {
    ws = new WebSocket(url);
  } catch (err) {
    console.warn('[mcpBridge] Failed to create WebSocket:', err);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[mcpBridge] Connected to MCP server');
    reconnectAttempts = 0;
  };

  ws.onmessage = (event: MessageEvent) => {
    handleMessage(event.data as string);
  };

  ws.onclose = () => {
    console.log('[mcpBridge] Connection closed');
    ws = null;
    scheduleReconnect();
  };

  ws.onerror = (event: Event) => {
    // The onerror event doesn't carry useful info in browsers; the
    // onclose handler will fire right after and trigger reconnection.
    console.warn('[mcpBridge] WebSocket error');
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY_MS
  );
  reconnectAttempts++;

  console.log(`[mcpBridge] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

function handleMessage(raw: string): void {
  let request: BridgeRequest;
  try {
    request = JSON.parse(raw) as BridgeRequest;
  } catch {
    console.error('[mcpBridge] Invalid JSON:', raw.slice(0, 200));
    return;
  }

  if (!request.id || !request.method) {
    console.error('[mcpBridge] Invalid request (missing id or method):', request);
    return;
  }

  // Execute the method and send back the response
  executeMethod(request.method, request.params ?? {})
    .then((result) => {
      sendResponse({ id: request.id, result });
    })
    .catch((err: Error) => {
      sendResponse({
        id: request.id,
        error: { code: -32603, message: err.message },
      });
    });
}

function sendResponse(response: BridgeResponse): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('[mcpBridge] Cannot send response — not connected');
    return;
  }
  ws.send(JSON.stringify(response));
}

// ---------------------------------------------------------------------------
// Method router
// ---------------------------------------------------------------------------

/**
 * Execute a JSON-RPC method by dispatching to the appropriate handler.
 *
 * Args:
 *   method: The method name (e.g., "get_simulation_state").
 *   params: The method parameters object.
 *
 * Returns:
 *   The result to include in the JSON-RPC response.
 *
 * Raises:
 *   Error: If the method is not recognized.
 */
async function executeMethod(
  method: string,
  params: Record<string, unknown>
): Promise<unknown> {
  switch (method) {
    // ---- Query tools ----
    case 'get_simulation_state':
      return handleGetSimulationState();
    case 'get_all_trains':
      return handleGetAllTrains();
    case 'get_train':
      return handleGetTrain(params);
    case 'get_all_stations':
      return handleGetAllStations();
    case 'get_station':
      return handleGetStation(params);
    case 'get_all_routes':
      return handleGetAllRoutes();
    case 'get_route':
      return handleGetRoute(params);
    case 'get_cargo_shipments':
      return handleGetCargoShipments(params);
    case 'get_passengers':
      return handleGetPassengers(params);
    case 'get_stats':
      return handleGetStats();
    case 'get_event_log':
      return handleGetEventLog();
    case 'get_network_graph':
      return handleGetNetworkGraph();
    case 'find_path':
      return handleFindPath(params);

    // ---- Control tools ----
    case 'set_speed':
      return handleSetSpeed(params);
    case 'dispatch_train':
      return handleDispatchTrain(params);
    case 'assign_route':
      return handleAssignRoute(params);
    case 'recall_train':
      return handleRecallTrain(params);
    case 'set_clock':
      return handleSetClock(params);
    case 'save_load_game':
      return handleSaveLoadGame(params);

    // ---- Scenario tools ----
    case 'create_station':
      return handleCreateStation(params);
    case 'create_route':
      return handleCreateRoute(params);
    case 'create_train':
      return handleCreateTrain(params);
    case 'add_industry':
      return handleAddIndustry(params);
    case 'spawn_cargo':
      return handleSpawnCargo(params);
    case 'spawn_passengers':
      return handleSpawnPassengers(params);
    case 'reset_simulation':
      return handleResetSimulation();
    case 'export_scenario':
      return handleExportScenario();
    case 'import_scenario':
      return handleImportScenario(params);

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// Query handlers
// ---------------------------------------------------------------------------

function handleGetSimulationState(): unknown {
  const sim = useSimulationStore.getState();
  const stats = useStatsStore.getState();

  return {
    clock: sim.clock,
    speed: sim.speed,
    dayNumber: sim.dayNumber,
    timeOfDay: sim.timeOfDay,
    timeOfDayPeriod: sim.timeOfDayPeriod,
    isDaytime: sim.isDaytime,
    isPaused: sim.isPaused,
    stats: {
      today: stats.today,
      allTime: stats.allTime,
    },
  };
}

function handleGetAllTrains(): unknown {
  const { trains } = useTrainStore.getState();

  return trains.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    status: t.status,
    currentRouteId: t.currentRouteId,
    routeProgress: t.routeProgress,
    currentPosition: t.currentPosition,
    heading: t.heading,
    cargoCount: t.cargoManifest.length,
    passengerCount: t.passengers.length,
    speedMph: t.speedMph,
    operator: t.operator,
    category: t.category,
  }));
}

function handleGetTrain(params: Record<string, unknown>): unknown {
  const trainId = params.trainId as string;
  const train = useTrainStore.getState().getTrainById(trainId);
  if (!train) return null;

  return serializeTrainDetail(train);
}

function handleGetAllStations(): unknown {
  const { stations } = useStationStore.getState();

  return stations.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    position: s.position,
    size: s.size,
    trackCount: s.trackCount,
    industryCount: s.industries.length,
    waitingCargoCount: s.waitingCargo.length,
    waitingPassengerCount: s.waitingPassengers.length,
    trainsAtStation: s.trainsAtStation,
  }));
}

function handleGetStation(params: Record<string, unknown>): unknown {
  const stationId = params.stationId as string;
  const station = useStationStore.getState().getStationById(stationId);
  if (!station) return null;

  return serializeStationDetail(station);
}

function handleGetAllRoutes(): unknown {
  const { routes } = useRouteStore.getState();

  return routes.map((r) => ({
    id: r.id,
    name: r.name,
    stationIds: r.stationIds,
    lengthMiles: r.lengthMiles,
    color: r.color,
    operator: r.operator,
    type: r.type,
  }));
}

function handleGetRoute(params: Record<string, unknown>): unknown {
  const routeId = params.routeId as string;
  const route = useRouteStore.getState().getRouteById(routeId);
  if (!route) return null;

  return {
    id: route.id,
    name: route.name,
    description: route.description,
    stationIds: route.stationIds,
    geometry: route.geometry,
    lengthMiles: route.lengthMiles,
    primaryCargoTypes: route.primaryCargoTypes,
    color: route.color,
    operator: route.operator,
    type: route.type,
  };
}

function handleGetCargoShipments(params: Record<string, unknown>): unknown {
  const { shipments } = useCargoStore.getState();
  let filtered = [...shipments];

  const status = params.status as string | undefined;
  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }

  const stationId = params.stationId as string | undefined;
  if (stationId) {
    filtered = filtered.filter(
      (s) => s.originStationId === stationId || s.destinationStationId === stationId
    );
  }

  return filtered.map(serializeCargoShipment);
}

function handleGetPassengers(params: Record<string, unknown>): unknown {
  const { passengers } = usePassengerStore.getState();
  let filtered = [...passengers];

  const status = params.status as string | undefined;
  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  const stationId = params.stationId as string | undefined;
  if (stationId) {
    filtered = filtered.filter(
      (p) => p.originStationId === stationId || p.destinationStationId === stationId
    );
  }

  return filtered.map(serializePassenger);
}

function handleGetStats(): unknown {
  const { today, allTime } = useStatsStore.getState();
  return { today, allTime };
}

function handleGetEventLog(): unknown {
  return eventBus.getLog();
}

function handleGetNetworkGraph(): unknown {
  const networkStore = useNetworkStore.getState();
  const { network } = networkStore;

  if (!network) {
    return {
      junctionStationIds: [],
      totalNodes: 0,
      totalEdges: 0,
      nodes: [],
      connectivity: [],
    };
  }

  const nodes: Array<{
    stationId: string;
    connectedRouteIds: string[];
    isJunction: boolean;
  }> = [];

  for (const node of network.nodes.values()) {
    nodes.push({
      stationId: node.stationId,
      connectedRouteIds: node.connectedRouteIds,
      isJunction: node.isJunction,
    });
  }

  const connectivity: Array<{
    routeId: string;
    stationIds: string[];
    lengthMiles: number;
    operator?: string;
    type?: string;
  }> = [];

  for (const edge of network.edges.values()) {
    connectivity.push({
      routeId: edge.routeId,
      stationIds: edge.stationIds,
      lengthMiles: edge.lengthMiles,
      operator: edge.operator,
      type: edge.type,
    });
  }

  return {
    junctionStationIds: network.junctionIds,
    totalNodes: network.nodes.size,
    totalEdges: network.edges.size,
    nodes,
    connectivity,
  };
}

function handleFindPath(params: Record<string, unknown>): unknown {
  const from = params.from as string;
  const to = params.to as string;
  const path = useNetworkStore.getState().findPath(from, to);

  if (!path) return null;

  return {
    fromStationId: path.fromStationId,
    toStationId: path.toStationId,
    legs: path.legs.map((leg) => ({
      routeId: leg.routeId,
      fromStationId: leg.fromStationId,
      toStationId: leg.toStationId,
      distanceMiles: leg.distanceMiles,
    })),
    totalDistanceMiles: path.totalDistanceMiles,
    stationSequence: path.stationSequence,
  };
}

// ---------------------------------------------------------------------------
// Control handlers
// ---------------------------------------------------------------------------

function handleSetSpeed(params: Record<string, unknown>): unknown {
  const speed = params.speed as SimulationSpeed;
  useSimulationStore.getState().setSpeed(speed);

  return { success: true, speed };
}

function handleDispatchTrain(params: Record<string, unknown>): unknown {
  const trainId = params.trainId as string;
  const routeId = params.routeId as string;

  const trainStore = useTrainStore.getState();
  const train = trainStore.getTrainById(trainId);
  if (!train) {
    throw new Error(`Train "${trainId}" not found`);
  }

  const route = useRouteStore.getState().getRouteById(routeId);
  if (!route) {
    throw new Error(`Route "${routeId}" not found`);
  }

  trainStore.assignRoute(trainId, routeId);
  trainStore.setTrainStatus(trainId, 'departing');

  return {
    success: true,
    trainId,
    routeId,
    previousStatus: train.status,
    newStatus: 'departing',
  };
}

function handleAssignRoute(params: Record<string, unknown>): unknown {
  const trainId = params.trainId as string;
  const routeId = params.routeId as string;

  const train = useTrainStore.getState().getTrainById(trainId);
  if (!train) {
    throw new Error(`Train "${trainId}" not found`);
  }

  const route = useRouteStore.getState().getRouteById(routeId);
  if (!route) {
    throw new Error(`Route "${routeId}" not found`);
  }

  useTrainStore.getState().assignRoute(trainId, routeId);

  return {
    success: true,
    trainId,
    routeId,
    trainStatus: train.status,
  };
}

function handleRecallTrain(params: Record<string, unknown>): unknown {
  const trainId = params.trainId as string;

  const trainStore = useTrainStore.getState();
  const train = trainStore.getTrainById(trainId);
  if (!train) {
    throw new Error(`Train "${trainId}" not found`);
  }

  trainStore.setTrainStatus(trainId, 'returning');
  trainStore.clearRoute(trainId);
  trainStore.clearJourneyPlan(trainId);

  return {
    success: true,
    trainId,
    previousStatus: train.status,
    newStatus: 'returning',
  };
}

function handleSetClock(params: Record<string, unknown>): unknown {
  const hour = params.hour as number;
  const minute = params.minute as number;

  // Preserve the current day number by computing minutes from midnight
  // relative to the current day.
  const sim = useSimulationStore.getState();
  const currentDayStart = Math.floor(sim.clock / 1440) * 1440;
  const newClock = currentDayStart + hour * 60 + minute;

  useSimulationStore.getState().setClock(newClock);

  const updated = useSimulationStore.getState();
  return {
    success: true,
    clock: updated.clock,
    dayNumber: updated.dayNumber,
    timeOfDay: updated.timeOfDay,
    timeOfDayPeriod: updated.timeOfDayPeriod,
    isDaytime: updated.isDaytime,
  };
}

async function handleSaveLoadGame(params: Record<string, unknown>): Promise<unknown> {
  const action = params.action as 'save' | 'load' | 'clear';

  switch (action) {
    case 'save':
      await saveGameState();
      return { success: true, action: 'save', savedAt: Date.now() };

    case 'load': {
      const loaded = await loadGameState();
      return { success: loaded, action: 'load' };
    }

    case 'clear':
      await clearGameState();
      return { success: true, action: 'clear' };

    default:
      throw new Error(`Unknown save/load action: ${action}`);
  }
}

// ---------------------------------------------------------------------------
// Scenario handlers
// ---------------------------------------------------------------------------

function handleCreateStation(params: Record<string, unknown>): unknown {
  const stationStore = useStationStore.getState();

  // Check for duplicate ID
  if (stationStore.getStationById(params.id as string)) {
    throw new Error(`Station with ID "${params.id}" already exists`);
  }

  const newStation: Station = {
    id: params.id as string,
    name: params.name as string,
    city: params.city as string,
    state: params.state as string,
    position: params.position as [number, number],
    size: params.size as Station['size'],
    trackCount: (params.size as string) === 'major_hub' ? 8 : (params.size as string) === 'regional' ? 4 : 2,
    industries: (params.industries as IndustryInstance[]) ?? [],
    architectureStyle: (params.size as string) === 'major_hub' ? 'grand' : (params.size as string) === 'regional' ? 'modest' : 'rustic',
    description: params.description as string,
    waitingCargo: [],
    waitingPassengers: [],
    trainsAtStation: [],
  };

  useStationStore.setState((state) => ({
    stations: [...state.stations, newStation],
  }));

  // Rebuild network graph to include the new station
  useNetworkStore.getState().initialize();

  return { success: true, stationId: newStation.id };
}

function handleCreateRoute(params: Record<string, unknown>): unknown {
  const routeStore = useRouteStore.getState();

  // Check for duplicate ID
  if (routeStore.getRouteById(params.id as string)) {
    throw new Error(`Route with ID "${params.id}" already exists`);
  }

  // Validate that all station IDs exist
  const stationStore = useStationStore.getState();
  const stationIds = params.stationIds as string[];
  for (const sid of stationIds) {
    if (!stationStore.getStationById(sid)) {
      throw new Error(`Station "${sid}" not found. Create the station first.`);
    }
  }

  const newRoute: Route = {
    id: params.id as string,
    name: params.name as string,
    description: `${params.name} rail corridor`,
    stationIds,
    geometry: params.geometry as RouteGeometry,
    lengthMiles: params.lengthMiles as number,
    primaryCargoTypes: [],
    color: params.color as string,
    operator: params.operator as string | undefined,
    type: (params.type as Route['type']) ?? 'mixed',
  };

  useRouteStore.setState((state) => ({
    routes: [...state.routes, newRoute],
  }));

  // Rebuild network graph to include the new route
  useNetworkStore.getState().initialize();

  return { success: true, routeId: newRoute.id };
}

function handleCreateTrain(params: Record<string, unknown>): unknown {
  const trainStore = useTrainStore.getState();

  // Check for duplicate ID
  if (trainStore.getTrainById(params.id as string)) {
    throw new Error(`Train with ID "${params.id}" already exists`);
  }

  const newTrain: Train = {
    id: params.id as string,
    name: params.name as string,
    type: params.type as Train['type'],
    color: params.color as Train['color'],
    personality: params.personality as string,
    whistleType: 'deep',
    whistleSoundFile: 'whistle-blast-01.mp3',
    cargoCapability: params.cargoCapability as CargoType[],
    maxCars: params.maxCars as number,
    speedMph: params.speedMph as number,
    homeRoundhouseId: 'roundhouse-main',
    berthIndex: trainStore.trains.length,
    operator: params.operator as string | undefined,
    category: params.category as Train['category'],
    preferredRouteIds: params.preferredRouteIds as string[] | undefined,
    status: 'sleeping',
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

  useTrainStore.setState((state) => ({
    trains: [...state.trains, newTrain],
  }));

  return { success: true, trainId: newTrain.id };
}

function handleAddIndustry(params: Record<string, unknown>): unknown {
  const stationId = params.stationId as string;
  const industry = params.industry as IndustryInstance;

  const station = useStationStore.getState().getStationById(stationId);
  if (!station) {
    throw new Error(`Station "${stationId}" not found`);
  }

  useStationStore.setState((state) => ({
    stations: state.stations.map((s) =>
      s.id === stationId
        ? { ...s, industries: [...s.industries, industry] }
        : s
    ),
  }));

  return { success: true, stationId, industryType: industry.type };
}

function handleSpawnCargo(params: Record<string, unknown>): unknown {
  const originStationId = params.originStationId as string;
  const destinationStationId = params.destinationStationId as string;

  // Validate stations exist
  const stationStore = useStationStore.getState();
  if (!stationStore.getStationById(originStationId)) {
    throw new Error(`Origin station "${originStationId}" not found`);
  }
  if (!stationStore.getStationById(destinationStationId)) {
    throw new Error(`Destination station "${destinationStationId}" not found`);
  }

  const shipment: CargoShipment = {
    id: `cargo-mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: params.type as CargoType,
    quantity: params.quantity as number,
    unit: 'tons',
    originStationId,
    destinationStationId,
    assignedTrainId: null,
    status: 'waiting',
    createdAt: useSimulationStore.getState().clock,
    loadedAt: null,
    deliveredAt: null,
    industrySource: 'mcp-spawned',
    industryDestination: 'mcp-spawned',
  };

  useCargoStore.getState().addShipment(shipment);
  stationStore.addWaitingCargo(originStationId, shipment.id);

  return { success: true, shipmentId: shipment.id };
}

function handleSpawnPassengers(params: Record<string, unknown>): unknown {
  const count = params.count as number;
  const originStationId = params.originStationId as string;
  const destinationStationId = params.destinationStationId as string;

  // Validate stations exist
  const stationStore = useStationStore.getState();
  if (!stationStore.getStationById(originStationId)) {
    throw new Error(`Origin station "${originStationId}" not found`);
  }
  if (!stationStore.getStationById(destinationStationId)) {
    throw new Error(`Destination station "${destinationStationId}" not found`);
  }

  const FIRST_NAMES = [
    'Alice', 'Bob', 'Charlie', 'Dorothy', 'Earl', 'Faye', 'George',
    'Helen', 'Ivan', 'Judy', 'Karl', 'Lily', 'Morris', 'Nancy',
    'Oscar', 'Patty', 'Quincy', 'Rose', 'Sam', 'Tina',
  ];

  const AGE_GROUPS: AgeGroup[] = ['child', 'adult', 'elderly'];
  const MOODS: PassengerMood[] = ['happy', 'tired', 'excited', 'nervous'];
  const CLOTHING_COLORS = ['#C45B3E', '#2D5A3D', '#1B3A5C', '#F4C542', '#8B4513'];

  const passengerIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const id = `pax-mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ageGroup = AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)];

    const appearance: PassengerAppearance = {
      bodyType: ageGroup,
      clothingColor: CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)],
      hairStyle: (['short', 'long', 'bald', 'hat'] as const)[Math.floor(Math.random() * 4)],
      hatType: (['none', 'conductor', 'cowboy', 'beanie', 'sun_hat'] as const)[Math.floor(Math.random() * 5)],
      bagType: (['none', 'suitcase', 'backpack', 'briefcase', 'bundle'] as const)[Math.floor(Math.random() * 5)],
    };

    const passenger: Passenger = {
      id,
      name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
      ageGroup,
      appearance,
      originStationId,
      destinationStationId,
      assignedTrainId: null,
      activity: 'waiting',
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
      status: 'waiting',
      createdAt: useSimulationStore.getState().clock,
      boardedAt: null,
      arrivedAt: null,
    };

    usePassengerStore.getState().addPassenger(passenger);
    passengerIds.push(id);
  }

  stationStore.addWaitingPassengers(originStationId, passengerIds);

  return { success: true, count, passengerIds };
}

function handleResetSimulation(): unknown {
  // Reset clock to dawn
  useSimulationStore.getState().setClock(4 * 60 + 30);
  useSimulationStore.getState().setSpeed(1);

  // Reset all trains to sleeping with cleared routes
  const trainStore = useTrainStore.getState();
  trainStore.setAllStatus('sleeping');
  for (const train of trainStore.trains) {
    trainStore.clearRoute(train.id);
    trainStore.clearJourneyPlan(train.id);
  }

  // Clear cargo and passengers
  useCargoStore.setState({ shipments: [], deliveredCount: 0, deliveredTons: 0 });
  usePassengerStore.setState({ passengers: [], arrivedCount: 0 });

  // Reset stats
  useStatsStore.getState().resetDaily();
  useStatsStore.setState({
    allTime: {
      cargoTonsMoved: 0,
      cargoDeliveries: 0,
      passengersDelivered: 0,
      trainMilesTraveled: 0,
      busiestStation: '',
      busiestCorridor: '',
    },
  });

  // Clear station runtime state
  useStationStore.setState((state) => ({
    stations: state.stations.map((s) => ({
      ...s,
      waitingCargo: [],
      waitingPassengers: [],
      trainsAtStation: [],
    })),
  }));

  // Rebuild network
  useNetworkStore.getState().initialize();

  // Clear event log
  eventBus.clear();

  return { success: true, message: 'Simulation reset to initial state' };
}

function handleExportScenario(): unknown {
  const sim = useSimulationStore.getState();
  const trains = useTrainStore.getState().trains;
  const stations = useStationStore.getState().stations;
  const routes = useRouteStore.getState().routes;
  const cargo = useCargoStore.getState();
  const passengers = usePassengerStore.getState();
  const stats = useStatsStore.getState();

  return {
    version: 1,
    exportedAt: Date.now(),
    simulation: {
      clock: sim.clock,
      speed: sim.speed,
      dayNumber: sim.dayNumber,
    },
    stations: stations.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      state: s.state,
      position: s.position,
      size: s.size,
      trackCount: s.trackCount,
      industries: s.industries,
      architectureStyle: s.architectureStyle,
      description: s.description,
    })),
    routes: routes.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      stationIds: r.stationIds,
      geometry: r.geometry,
      lengthMiles: r.lengthMiles,
      primaryCargoTypes: r.primaryCargoTypes,
      color: r.color,
      operator: r.operator,
      type: r.type,
    })),
    trains: trains.map(serializeTrainDetail),
    cargo: {
      shipments: cargo.shipments.map(serializeCargoShipment),
      deliveredCount: cargo.deliveredCount,
      deliveredTons: cargo.deliveredTons,
    },
    passengers: {
      passengers: passengers.passengers.map(serializePassenger),
      arrivedCount: passengers.arrivedCount,
    },
    stats: {
      today: stats.today,
      allTime: stats.allTime,
    },
  };
}

function handleImportScenario(params: Record<string, unknown>): unknown {
  const scenario = params.scenario as Record<string, unknown>;

  if (!scenario || typeof scenario !== 'object') {
    throw new Error('Invalid scenario object');
  }

  // RATIONALE: We validate the top-level structure minimally and trust the
  // data shapes, since the export_scenario tool produces the expected format.
  // A full validation would require duplicating the entire type system.

  const simData = scenario.simulation as Record<string, unknown> | undefined;
  if (simData) {
    if (typeof simData.clock === 'number') {
      useSimulationStore.getState().setClock(simData.clock);
    }
    if (typeof simData.speed === 'number') {
      useSimulationStore.getState().setSpeed(simData.speed as SimulationSpeed);
    }
  }

  const stationsData = scenario.stations as Station[] | undefined;
  if (Array.isArray(stationsData)) {
    useStationStore.setState({
      stations: stationsData.map((s) => ({
        ...s,
        waitingCargo: s.waitingCargo ?? [],
        waitingPassengers: s.waitingPassengers ?? [],
        trainsAtStation: s.trainsAtStation ?? [],
      })),
    });
  }

  const routesData = scenario.routes as Route[] | undefined;
  if (Array.isArray(routesData)) {
    useRouteStore.setState({ routes: routesData });
  }

  const trainsData = scenario.trains as Train[] | undefined;
  if (Array.isArray(trainsData)) {
    useTrainStore.setState({
      trains: trainsData.map((t) => ({
        ...t,
        cargoManifest: t.cargoManifest ?? [],
        passengers: t.passengers ?? [],
        stats: t.stats ?? { totalMiles: 0, totalDeliveries: 0, totalPassengersCarried: 0 },
      })),
    });
  }

  const cargoData = scenario.cargo as Record<string, unknown> | undefined;
  if (cargoData) {
    useCargoStore.setState({
      shipments: (cargoData.shipments as CargoShipment[]) ?? [],
      deliveredCount: (cargoData.deliveredCount as number) ?? 0,
      deliveredTons: (cargoData.deliveredTons as number) ?? 0,
    });
  }

  const passengerData = scenario.passengers as Record<string, unknown> | undefined;
  if (passengerData) {
    usePassengerStore.setState({
      passengers: (passengerData.passengers as Passenger[]) ?? [],
      arrivedCount: (passengerData.arrivedCount as number) ?? 0,
    });
  }

  const statsData = scenario.stats as Record<string, unknown> | undefined;
  if (statsData) {
    useStatsStore.setState({
      today: (statsData.today as ReturnType<typeof useStatsStore.getState>['today']) ?? {
        cargoTonsMoved: 0,
        cargoDeliveries: 0,
        passengersDelivered: 0,
        trainMilesTraveled: 0,
        busiestStation: '',
        busiestCorridor: '',
      },
      allTime: (statsData.allTime as ReturnType<typeof useStatsStore.getState>['allTime']) ?? {
        cargoTonsMoved: 0,
        cargoDeliveries: 0,
        passengersDelivered: 0,
        trainMilesTraveled: 0,
        busiestStation: '',
        busiestCorridor: '',
      },
    });
  }

  // Rebuild network graph after importing
  useNetworkStore.getState().initialize();

  return { success: true, message: 'Scenario imported' };
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

function serializeTrainDetail(t: Train): unknown {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    status: t.status,
    color: t.color,
    personality: t.personality,
    currentRouteId: t.currentRouteId,
    routeProgress: t.routeProgress,
    currentPosition: t.currentPosition,
    heading: t.heading,
    speedMph: t.speedMph,
    maxCars: t.maxCars,
    cargoCapability: t.cargoCapability,
    homeRoundhouseId: t.homeRoundhouseId,
    operator: t.operator,
    category: t.category,
    preferredRouteIds: t.preferredRouteIds,
    currentSegmentIndex: t.currentSegmentIndex,
    segmentProgress: t.segmentProgress,
    dwellTimer: t.dwellTimer,
    dwellStationId: t.dwellStationId,
    currentJourneyRoutes: t.currentJourneyRoutes,
    currentJourneyLeg: t.currentJourneyLeg,
    cargoManifest: t.cargoManifest.map(serializeCargoShipment),
    passengers: t.passengers.map(serializePassenger),
    stats: t.stats,
  };
}

function serializeStationDetail(s: Station): unknown {
  return {
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    position: s.position,
    size: s.size,
    trackCount: s.trackCount,
    architectureStyle: s.architectureStyle,
    description: s.description,
    industries: s.industries.map((ind) => ({
      type: ind.type,
      name: ind.name,
      produces: ind.produces,
      consumes: ind.consumes,
      productionRate: ind.productionRate,
      minBatch: ind.minBatch,
      maxBatch: ind.maxBatch,
    })),
    waitingCargo: s.waitingCargo.map(serializeCargoShipment),
    waitingPassengers: s.waitingPassengers.map(serializePassenger),
    trainsAtStation: s.trainsAtStation,
    isJunction: s.isJunction,
    connectedRouteIds: s.connectedRouteIds,
  };
}

function serializeCargoShipment(c: CargoShipment): unknown {
  return {
    id: c.id,
    type: c.type,
    quantity: c.quantity,
    unit: c.unit,
    originStationId: c.originStationId,
    destinationStationId: c.destinationStationId,
    assignedTrainId: c.assignedTrainId,
    status: c.status,
    createdAt: c.createdAt,
    loadedAt: c.loadedAt,
    deliveredAt: c.deliveredAt,
    industrySource: c.industrySource,
    industryDestination: c.industryDestination,
  };
}

function serializePassenger(p: Passenger): unknown {
  return {
    id: p.id,
    name: p.name,
    ageGroup: p.ageGroup,
    originStationId: p.originStationId,
    destinationStationId: p.destinationStationId,
    assignedTrainId: p.assignedTrainId,
    activity: p.activity,
    mood: p.mood,
    status: p.status,
    createdAt: p.createdAt,
    boardedAt: p.boardedAt,
    arrivedAt: p.arrivedAt,
  };
}
