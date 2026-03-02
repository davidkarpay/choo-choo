/**
 * tools/scenario.ts
 *
 * MCP tools for creating and managing simulation scenarios. These 9 tools
 * let an LLM build custom railroad worlds: creating stations, routes, and
 * trains; adding industries; spawning cargo and passengers; resetting the
 * simulation; and exporting/importing scenario snapshots.
 *
 * Scenario tools are the most powerful tools in the MCP server. They can
 * fundamentally change the simulation world, so they should be used with
 * intent and understanding.
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
 * Register all 9 scenario tools on the MCP server.
 *
 * These tools create, modify, and manage the simulation world. They can
 * add new stations, routes, trains, and cargo/passengers, reset the sim,
 * or export/import entire scenarios.
 *
 * Args:
 *   server: The McpServer instance to register tools on.
 *   transport: The BridgeTransport for communicating with the browser.
 */
export function registerScenarioTools(server: McpServer, transport: BridgeTransport): void {

  // -----------------------------------------------------------------------
  // 1. create_station
  // -----------------------------------------------------------------------
  server.tool(
    'create_station',
    'Create a new railroad station in the simulation. The station will appear on the map and can receive trains, cargo, and passengers. Industries define what cargo the station produces and consumes. Position is [latitude, longitude].',
    {
      id: z.string()
        .describe('Unique station identifier (e.g., "denver-union"). Must be unique across all stations.'),
      name: z.string()
        .describe('Display name for the station (e.g., "Denver Union Station")'),
      city: z.string()
        .describe('City where the station is located (e.g., "Denver")'),
      state: z.string()
        .describe('US state abbreviation (e.g., "CO")'),
      position: z.tuple([z.number(), z.number()])
        .describe('Geographic position as [latitude, longitude] (e.g., [39.7528, -104.9997])'),
      size: z.enum(['major_hub', 'regional', 'local'])
        .describe('Station size: "major_hub" (big city), "regional" (medium city), or "local" (small town)'),
      industries: z.array(z.object({
        type: z.string().describe('Industry type identifier (e.g., "steel_mill", "grain_elevator")'),
        name: z.string().describe('Display name (e.g., "Denver Steel Works")'),
        produces: z.array(z.string()).describe('Cargo types this industry produces (e.g., ["steel", "coal"])'),
        consumes: z.array(z.string()).describe('Cargo types this industry consumes (e.g., ["coal", "lumber"])'),
        productionRate: z.number().describe('How often cargo is produced, in simulated minutes between batches'),
        minBatch: z.number().describe('Minimum quantity per production batch'),
        maxBatch: z.number().describe('Maximum quantity per production batch'),
      })).describe('Array of industries at this station. Can be empty.'),
      description: z.string()
        .describe('Narrative description of the station in warm, storybook style'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('create_station', params);
        return {
          content: [{
            type: 'text' as const,
            text: `Station "${params.name}" (${params.id}) created in ${params.city}, ${params.state}. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 2. create_route
  // -----------------------------------------------------------------------
  server.tool(
    'create_route',
    'Create a new rail route (corridor) connecting stations. The route defines the path trains take between stations. The geometry is a GeoJSON LineString of [longitude, latitude] coordinate pairs. Station IDs must reference existing stations. The route will appear on the national map.',
    {
      id: z.string()
        .describe('Unique route identifier (e.g., "rocky-mountain-line"). Must be unique across all routes.'),
      name: z.string()
        .describe('Display name for the route (e.g., "Rocky Mountain Express")'),
      stationIds: z.array(z.string()).min(2)
        .describe('Ordered array of station IDs along this route (minimum 2). Trains traverse stations in this order.'),
      geometry: z.object({
        type: z.literal('LineString'),
        coordinates: z.array(z.tuple([z.number(), z.number()])).min(2)
          .describe('Array of [longitude, latitude] coordinate pairs defining the route path'),
      }).describe('GeoJSON LineString geometry for map rendering'),
      lengthMiles: z.number().positive()
        .describe('Total route length in miles'),
      color: z.string()
        .describe('CSS color for rendering the route on the map (e.g., "#C45B3E")'),
      operator: z.string().optional()
        .describe('Railroad operator name (e.g., "BNSF", "UP", "Amtrak"). Optional.'),
      type: z.enum(['freight', 'passenger', 'mixed']).optional()
        .describe('Route type: "freight", "passenger", or "mixed". Optional, defaults to "mixed".'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('create_route', params);
        return {
          content: [{
            type: 'text' as const,
            text: `Route "${params.name}" (${params.id}) created with ${params.stationIds.length} stations, ${params.lengthMiles} miles. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 3. create_train
  // -----------------------------------------------------------------------
  server.tool(
    'create_train',
    'Create a new train in the simulation. The train starts in "sleeping" status at its home roundhouse. It can then be dispatched on routes to haul cargo and passengers. Each train has a unique personality and visual style.',
    {
      id: z.string()
        .describe('Unique train identifier (e.g., "train-012"). Must be unique across all trains.'),
      name: z.string()
        .describe('Display name for the train (e.g., "The Silver Streak")'),
      type: z.enum(['steam', 'diesel'])
        .describe('Engine type: "steam" (classic, slower) or "diesel" (modern, faster)'),
      color: z.object({
        primary: z.string().describe('Primary body color hex (e.g., "#C45B3E")'),
        secondary: z.string().describe('Secondary trim color hex (e.g., "#F4C542")'),
        accent: z.string().describe('Accent detail color hex (e.g., "#1B3A5C")'),
      }).describe('Three-color scheme for the train'),
      personality: z.string()
        .describe('A short personality description in storybook style (e.g., "A cheerful old steamer who loves mountain passes")'),
      cargoCapability: z.array(z.string())
        .describe('Array of cargo types this train can carry (e.g., ["coal", "steel", "lumber"])'),
      maxCars: z.number().int().positive()
        .describe('Maximum number of cars this train can pull'),
      speedMph: z.number().positive()
        .describe('Cruising speed in miles per hour'),
      operator: z.string().optional()
        .describe('Railroad operator name (e.g., "BNSF"). Optional.'),
      category: z.enum(['freight', 'passenger']).optional()
        .describe('Train category: "freight" or "passenger". Optional.'),
      preferredRouteIds: z.array(z.string()).optional()
        .describe('Preferred route IDs this train should run on, in order. Optional.'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('create_train', params);
        return {
          content: [{
            type: 'text' as const,
            text: `Train "${params.name}" (${params.id}) created. Type: ${params.type}, Speed: ${params.speedMph}mph, Max cars: ${params.maxCars}. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 4. add_industry
  // -----------------------------------------------------------------------
  server.tool(
    'add_industry',
    'Add a new industry to an existing station. Industries produce and consume cargo, driving the simulation\'s economy. For example, a steel mill consumes coal and produces steel. The industry will begin generating cargo at its production rate.',
    {
      stationId: z.string()
        .describe('The ID of the station to add the industry to (e.g., "pittsburgh-station")'),
      industry: z.object({
        type: z.string().describe('Industry type identifier (e.g., "auto_plant", "grain_elevator", "oil_refinery")'),
        name: z.string().describe('Display name (e.g., "Pittsburgh Steel Works")'),
        produces: z.array(z.string()).describe('Cargo types this industry produces'),
        consumes: z.array(z.string()).describe('Cargo types this industry consumes'),
        productionRate: z.number().describe('Minutes between cargo production batches'),
        minBatch: z.number().describe('Minimum quantity per production batch'),
        maxBatch: z.number().describe('Maximum quantity per production batch'),
      }).describe('The industry definition to add'),
    },
    async ({ stationId, industry }) => {
      try {
        const result = await transport.sendRequest('add_industry', { stationId, industry });
        return {
          content: [{
            type: 'text' as const,
            text: `Industry "${industry.name}" (${industry.type}) added to station "${stationId}". Produces: ${industry.produces.join(', ')}. Consumes: ${industry.consumes.join(', ')}. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 5. spawn_cargo
  // -----------------------------------------------------------------------
  server.tool(
    'spawn_cargo',
    'Manually spawn a cargo shipment at a station. The cargo will appear as "waiting" at the origin station and needs a train to pick it up and deliver it to the destination station. Use this to test delivery scenarios or simulate demand.',
    {
      type: z.string()
        .describe('Cargo type (e.g., "coal", "grain", "steel", "lumber", "packages", "automobiles", "fuel", "chemicals", "produce", "livestock")'),
      quantity: z.number().positive()
        .describe('Amount of cargo in the type\'s native unit (tons, bushels, etc.)'),
      originStationId: z.string()
        .describe('Station ID where the cargo will be placed for pickup'),
      destinationStationId: z.string()
        .describe('Station ID where the cargo needs to be delivered'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('spawn_cargo', params);
        return {
          content: [{
            type: 'text' as const,
            text: `Spawned ${params.quantity} units of ${params.type} cargo at "${params.originStationId}" bound for "${params.destinationStationId}". ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 6. spawn_passengers
  // -----------------------------------------------------------------------
  server.tool(
    'spawn_passengers',
    'Manually spawn passengers at a station. The passengers will appear as "waiting" at the origin station and need a train to board and carry them to the destination station. Each passenger gets a randomly generated name, appearance, and mood.',
    {
      count: z.number().int().positive().max(50)
        .describe('Number of passengers to spawn (1-50)'),
      originStationId: z.string()
        .describe('Station ID where the passengers will wait for a train'),
      destinationStationId: z.string()
        .describe('Station ID where the passengers want to go'),
    },
    async (params) => {
      try {
        const result = await transport.sendRequest('spawn_passengers', params);
        return {
          content: [{
            type: 'text' as const,
            text: `Spawned ${params.count} passenger(s) at "${params.originStationId}" headed to "${params.destinationStationId}". ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 7. reset_simulation
  // -----------------------------------------------------------------------
  server.tool(
    'reset_simulation',
    'Reset the entire simulation to its initial state. All trains return to sleeping in their roundhouses, all cargo and passengers are removed, statistics are zeroed, and the clock resets to dawn (4:30 AM Day 1). The network graph is rebuilt. This is irreversible.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('reset_simulation', {});
        return {
          content: [{
            type: 'text' as const,
            text: `Simulation reset to initial state. Clock at dawn, all trains sleeping, cargo and passengers cleared. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 8. export_scenario
  // -----------------------------------------------------------------------
  server.tool(
    'export_scenario',
    'Export the current simulation state as a complete JSON scenario. This includes all stations, routes, trains (with their cargo and passengers), the simulation clock, statistics, and event log. Use this to save a custom world configuration that can be re-imported later.',
    {},
    async () => {
      try {
        const result = await transport.sendRequest('export_scenario', {});
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 9. import_scenario
  // -----------------------------------------------------------------------
  server.tool(
    'import_scenario',
    'Import a previously exported scenario JSON to restore a complete simulation state. This replaces all current stations, routes, trains, cargo, passengers, and statistics with the imported data. The current state is lost. The scenario object must match the format produced by export_scenario.',
    {
      scenario: z.record(z.unknown())
        .describe('The full scenario object as exported by export_scenario. Must include stations, routes, trains, simulation, cargo, passengers, and stats fields.'),
    },
    async ({ scenario }) => {
      try {
        const result = await transport.sendRequest('import_scenario', { scenario });
        return {
          content: [{
            type: 'text' as const,
            text: `Scenario imported successfully. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );
}
