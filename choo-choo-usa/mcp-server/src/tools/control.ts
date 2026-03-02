/**
 * tools/control.ts
 *
 * MCP tools for controlling the train simulation. These 6 tools let an
 * LLM modify simulation state: adjusting speed, dispatching trains,
 * changing routes, recalling trains, setting the clock, and managing
 * save/load operations.
 *
 * All control tools validate inputs with Zod before sending them to the
 * browser bridge. The browser-side mcpBridge executes the corresponding
 * Zustand store actions.
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
 * Register all 6 control tools on the MCP server.
 *
 * These tools modify the simulation state. They should be used with
 * care, as they can change train positions, routes, speed, and time.
 *
 * Args:
 *   server: The McpServer instance to register tools on.
 *   transport: The BridgeTransport for communicating with the browser.
 */
export function registerControlTools(server: McpServer, transport: BridgeTransport): void {

  // -----------------------------------------------------------------------
  // 1. set_speed
  // -----------------------------------------------------------------------
  server.tool(
    'set_speed',
    'Set the simulation speed multiplier. 0 pauses the simulation. 1 is real-time (1 real second = 1 simulated minute). 5, 15, and 60 are fast-forward speeds. The simulation clock, train movement, cargo generation, and passenger generation all scale with this speed.',
    {
      speed: z.union([z.literal(0), z.literal(1), z.literal(5), z.literal(15), z.literal(60)])
        .describe('Simulation speed multiplier: 0 (paused), 1 (normal), 5, 15, or 60 (fastest)'),
    },
    async ({ speed }) => {
      try {
        const result = await transport.sendRequest('set_speed', { speed });
        const label = speed === 0 ? 'Paused' : `${speed}x`;
        return {
          content: [{
            type: 'text' as const,
            text: `Simulation speed set to ${label}. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 2. dispatch_train
  // -----------------------------------------------------------------------
  server.tool(
    'dispatch_train',
    'Manually dispatch a train on a specific route. The train will be assigned to the route and its status set to "departing". The train must exist and preferably be in a state where it can depart (sleeping, at_station, or maintenance). The route must exist in the simulation.',
    {
      trainId: z.string().describe('The ID of the train to dispatch (e.g., "train-001")'),
      routeId: z.string().describe('The ID of the route to dispatch the train on (e.g., "northeast-corridor")'),
    },
    async ({ trainId, routeId }) => {
      try {
        const result = await transport.sendRequest('dispatch_train', { trainId, routeId });
        return {
          content: [{
            type: 'text' as const,
            text: `Train "${trainId}" dispatched on route "${routeId}". ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 3. assign_route
  // -----------------------------------------------------------------------
  server.tool(
    'assign_route',
    'Change a train\'s assigned route without dispatching it. This updates the train\'s route assignment and resets its route progress. The train\'s status is not changed. Use this to pre-configure which route a train will run before it departs.',
    {
      trainId: z.string().describe('The ID of the train to reassign (e.g., "train-001")'),
      routeId: z.string().describe('The ID of the new route to assign (e.g., "northeast-corridor")'),
    },
    async ({ trainId, routeId }) => {
      try {
        const result = await transport.sendRequest('assign_route', { trainId, routeId });
        return {
          content: [{
            type: 'text' as const,
            text: `Train "${trainId}" assigned to route "${routeId}". ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 4. recall_train
  // -----------------------------------------------------------------------
  server.tool(
    'recall_train',
    'Send a train back to its home roundhouse. Sets the train\'s status to "returning" and clears its current route. The train will stop carrying cargo and passengers and head home. Use this to pull a train off its route.',
    {
      trainId: z.string().describe('The ID of the train to recall (e.g., "train-001")'),
    },
    async ({ trainId }) => {
      try {
        const result = await transport.sendRequest('recall_train', { trainId });
        return {
          content: [{
            type: 'text' as const,
            text: `Train "${trainId}" recalled to roundhouse. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 5. set_clock
  // -----------------------------------------------------------------------
  server.tool(
    'set_clock',
    'Set the simulation clock to a specific time. The clock is measured in minutes since midnight of day 1. For example, hour=6 minute=30 on day 1 would be 390 minutes. The day number, time of day, and daylight state will update accordingly. This affects train schedules and day/night visuals.',
    {
      hour: z.number().int().min(0).max(23)
        .describe('Hour of the day (0-23). 0 is midnight, 6 is dawn, 12 is noon, 18 is evening.'),
      minute: z.number().int().min(0).max(59)
        .describe('Minute of the hour (0-59).'),
    },
    async ({ hour, minute }) => {
      try {
        const result = await transport.sendRequest('set_clock', { hour, minute });
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        return {
          content: [{
            type: 'text' as const,
            text: `Simulation clock set to ${timeStr}. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  // -----------------------------------------------------------------------
  // 6. save_load_game
  // -----------------------------------------------------------------------
  server.tool(
    'save_load_game',
    'Manage game save states. "save" serializes the entire simulation state (trains, cargo, passengers, stats, clock) to IndexedDB. "load" restores a previously saved state. "clear" deletes the saved state. The browser must be running for this to work.',
    {
      action: z.enum(['save', 'load', 'clear'])
        .describe('The action to perform: "save" to save current state, "load" to restore saved state, "clear" to delete the save.'),
    },
    async ({ action }) => {
      try {
        const result = await transport.sendRequest('save_load_game', { action });
        const labels = { save: 'Game saved', load: 'Game loaded', clear: 'Save cleared' };
        return {
          content: [{
            type: 'text' as const,
            text: `${labels[action]}. ${JSON.stringify(result)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
      }
    }
  );
}
