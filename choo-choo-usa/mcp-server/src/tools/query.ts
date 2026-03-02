/**
 * tools/query.ts
 *
 * Read-only MCP tools for querying the train simulation state. These 13
 * tools let an LLM inspect every aspect of the simulation without
 * modifying anything: trains, stations, routes, cargo, passengers,
 * statistics, events, and the network graph.
 *
 * Each tool sends a JSON-RPC request to the browser via the WebSocket
 * bridge transport and returns the response. The browser-side mcpBridge
 * reads the corresponding Zustand stores and serializes the data.
 *
 * Part of: Choo-Choo USA MCP Server
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - zod: input validation schemas
 *   - transport: BridgeTransport for WebSocket communication
 *   - @modelcontextprotocol/sdk: McpServer for tool registration
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BridgeTransport } from '../transport.js';

/**
 * Register all 13 read-only query tools on the MCP server.
 *
 * These tools are safe to call at any time and do not modify simulation
 * state. They provide a comprehensive view of the running simulation.
 *
 * Args:
 *   server: The McpServer instance to register tools on.
 *   transport: The BridgeTransport for communicating with the browser.
 */
export function registerQueryTools(server: McpServer, transport: BridgeTransport): void {

  // -----------------------------------------------------------------------
  // 1. get_simulation_state
  // -----------------------------------------------------------------------
  server.tool(
    'get_simulation_state',
    'Get the current simulation state including the in-game clock (minutes since midnight), simulation speed multiplier (0=paused, 1/5/15/60x), day number, time of day period (dawn/morning/afternoon/evening/night), whether it is daytime, and daily plus all-time statistics for cargo, passengers, and train mileage.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_simulation_state', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 2. get_all_trains
  // -----------------------------------------------------------------------
  server.tool(
    'get_all_trains',
    'Get a summary list of all trains in the simulation. Each entry includes the train ID, name, type (steam/diesel), current status (sleeping/warming_up/departing/en_route/arriving/at_station/returning/maintenance), position, route progress, cargo count, passenger count, speed, and operator.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_all_trains', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 3. get_train
  // -----------------------------------------------------------------------
  server.tool(
    'get_train',
    'Get full details for a specific train by ID, including its complete cargo manifest (every shipment it is carrying), passenger list, color scheme, personality, home roundhouse, segment progress, dwell timer, journey plan, and lifetime statistics (total miles, deliveries, passengers carried).',
    { trainId: z.string().describe('The unique train identifier (e.g., "train-001")') },
    async ({ trainId }) => {
      try {
        const result = await transport.sendRequest('get_train', { trainId });
        if (!result) {
          return { content: [{ type: 'text' as const, text: `No train found with ID "${trainId}"` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 4. get_all_stations
  // -----------------------------------------------------------------------
  server.tool(
    'get_all_stations',
    'Get a summary list of all stations in the simulation. Each entry includes the station ID, name, city, state, geographic position, size (major_hub/regional/local), track count, industry count, counts of waiting cargo and passengers, and which trains are currently at the station.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_all_stations', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 5. get_station
  // -----------------------------------------------------------------------
  server.tool(
    'get_station',
    'Get full details for a specific station by ID, including its industries (what they produce and consume), all waiting cargo shipments, all waiting passengers, architecture style, description, junction status, and connected route IDs.',
    { stationId: z.string().describe('The unique station identifier (e.g., "chicago-union")') },
    async ({ stationId }) => {
      try {
        const result = await transport.sendRequest('get_station', { stationId });
        if (!result) {
          return { content: [{ type: 'text' as const, text: `No station found with ID "${stationId}"` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 6. get_all_routes
  // -----------------------------------------------------------------------
  server.tool(
    'get_all_routes',
    'Get a summary list of all rail routes (corridors) in the simulation. Each entry includes the route ID, name, station IDs along the route, total length in miles, display color, railroad operator, and route type (freight/passenger/mixed).',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_all_routes', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 7. get_route
  // -----------------------------------------------------------------------
  server.tool(
    'get_route',
    'Get full details for a specific route by ID, including its description, full GeoJSON geometry (LineString coordinates), all station IDs in order, primary cargo types, display color, operator, and type.',
    { routeId: z.string().describe('The unique route identifier (e.g., "northeast-corridor")') },
    async ({ routeId }) => {
      try {
        const result = await transport.sendRequest('get_route', { routeId });
        if (!result) {
          return { content: [{ type: 'text' as const, text: `No route found with ID "${routeId}"` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 8. get_cargo_shipments
  // -----------------------------------------------------------------------
  server.tool(
    'get_cargo_shipments',
    'Get cargo shipments, optionally filtered by status (waiting/in_transit/delivered) and/or station ID. Returns an array of shipments with type, quantity, origin, destination, assigned train, timestamps, and industry source/destination.',
    {
      status: z.enum(['waiting', 'in_transit', 'delivered']).optional()
        .describe('Filter by shipment status. Omit to return all statuses.'),
      stationId: z.string().optional()
        .describe('Filter by origin or destination station ID. Omit to return shipments for all stations.'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('get_cargo_shipments', params);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 9. get_passengers
  // -----------------------------------------------------------------------
  server.tool(
    'get_passengers',
    'Get passengers, optionally filtered by status (waiting/in_transit/arrived) and/or station ID. Returns an array of passengers with name, age group, origin, destination, assigned train, activity, mood, and timestamps.',
    {
      status: z.enum(['waiting', 'in_transit', 'arrived']).optional()
        .describe('Filter by passenger status. Omit to return all statuses.'),
      stationId: z.string().optional()
        .describe('Filter by origin or destination station ID. Omit to return passengers for all stations.'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('get_passengers', params);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 10. get_stats
  // -----------------------------------------------------------------------
  server.tool(
    'get_stats',
    'Get simulation statistics for both today (resets at midnight) and all-time. Includes cargo tons moved, cargo deliveries, passengers delivered, train miles traveled, busiest station, and busiest corridor.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_stats', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 11. get_event_log
  // -----------------------------------------------------------------------
  server.tool(
    'get_event_log',
    'Get the last 50 simulation events. Events include train_departed, train_arrived, cargo_loaded, cargo_delivered, passenger_boarded, passenger_arrived, and new_day. Each event has a type, timestamp, and data payload.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_event_log', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 12. get_network_graph
  // -----------------------------------------------------------------------
  server.tool(
    'get_network_graph',
    'Get the rail network graph showing how stations and routes are interconnected. Returns junction station IDs (stations on 2+ routes), total node and edge counts, all network nodes with their connected routes, and route connectivity (which stations each route connects and its length/operator/type).',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('get_network_graph', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 13. find_path
  // -----------------------------------------------------------------------
  server.tool(
    'find_path',
    'Find the shortest path between two stations using Dijkstra\'s algorithm over the rail network. Returns the path broken into legs (each leg is one route corridor), total distance in miles, and the full station sequence. Returns null if no path exists.',
    {
      from: z.string().describe('Origin station ID (e.g., "chicago-union")'),
      to: z.string().describe('Destination station ID (e.g., "new-york-penn")'),
    },
    async ({ from, to }) => {
      try {
        const result = await transport.sendRequest('find_path', { from, to });
        if (!result) {
          return { content: [{ type: 'text' as const, text: `No path found from "${from}" to "${to}". The stations may not be connected in the current network.` }] };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );
}
