/**
 * index.ts
 *
 * Entry point for the Choo-Choo USA MCP server. This server exposes the
 * train simulation to LLMs via the Model Context Protocol. It bridges
 * between Claude Desktop (via stdio) and the browser-based simulation
 * (via WebSocket).
 *
 * Architecture:
 *   Claude Desktop  --stdio-->  MCP Server  --WebSocket-->  Browser mcpBridge  -->  Zustand stores
 *
 * The MCP server runs a WebSocket server on port 3001 (configurable via
 * BROWSER_WS_PORT env var). The browser app connects as a WebSocket client.
 * Claude Desktop communicates with the MCP server over stdio using the
 * Model Context Protocol.
 *
 * Tools are organized into three categories:
 *   - Query (13 tools): Read-only inspection of simulation state
 *   - Control (6 tools): Modify simulation speed, dispatch trains, etc.
 *   - Scenario (9 tools): Create/import/export world configurations
 *
 * Part of: Choo-Choo USA MCP Server
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - @modelcontextprotocol/sdk: MCP server SDK (McpServer, StdioServerTransport)
 *   - transport: BridgeTransport for WebSocket bridge to browser
 *   - tools/query: Read-only query tools
 *   - tools/control: Simulation control tools
 *   - tools/scenario: Scenario creation/management tools
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BridgeTransport } from './transport.js';
import { registerQueryTools } from './tools/query.js';
import { registerControlTools } from './tools/control.js';
import { registerScenarioTools } from './tools/scenario.js';

/**
 * Initialize and start the MCP server.
 *
 * Sets up the WebSocket bridge transport, registers all 28 tools, and
 * connects to Claude Desktop via stdio. Handles graceful shutdown on
 * SIGINT and SIGTERM.
 *
 * Note:
 *   All log output goes to stderr (not stdout) because stdout is
 *   reserved for the MCP stdio protocol.
 */
async function main(): Promise<void> {
  process.stderr.write('[ChooChooMCP] Starting Choo-Choo USA MCP server v1.0.0\n');

  // -----------------------------------------------------------------------
  // 1. Create the WebSocket bridge transport
  // -----------------------------------------------------------------------
  const bridgeTransport = new BridgeTransport();
  bridgeTransport.start();

  // -----------------------------------------------------------------------
  // 2. Create the MCP server
  // -----------------------------------------------------------------------
  const server = new McpServer({
    name: 'choo-choo-usa',
    version: '1.0.0',
  });

  // -----------------------------------------------------------------------
  // 3. Register all tools
  // -----------------------------------------------------------------------
  registerQueryTools(server, bridgeTransport);
  registerControlTools(server, bridgeTransport);
  registerScenarioTools(server, bridgeTransport);

  process.stderr.write('[ChooChooMCP] Registered 28 tools (13 query + 6 control + 9 scenario)\n');

  // -----------------------------------------------------------------------
  // 4. Connect to Claude Desktop via stdio
  // -----------------------------------------------------------------------
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);

  process.stderr.write('[ChooChooMCP] Connected to Claude Desktop via stdio\n');
  process.stderr.write('[ChooChooMCP] Waiting for browser to connect on WebSocket...\n');

  // -----------------------------------------------------------------------
  // 5. Graceful shutdown
  // -----------------------------------------------------------------------
  const shutdown = async (signal: string): Promise<void> => {
    process.stderr.write(`\n[ChooChooMCP] Received ${signal}, shutting down...\n`);

    try {
      await bridgeTransport.shutdown();
    } catch (err) {
      process.stderr.write(`[ChooChooMCP] Error during bridge shutdown: ${(err as Error).message}\n`);
    }

    try {
      await server.close();
    } catch (err) {
      process.stderr.write(`[ChooChooMCP] Error during server close: ${(err as Error).message}\n`);
    }

    process.stderr.write('[ChooChooMCP] Shutdown complete\n');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Run the server
main().catch((err) => {
  process.stderr.write(`[ChooChooMCP] Fatal error: ${(err as Error).message}\n`);
  process.stderr.write(`${(err as Error).stack}\n`);
  process.exit(1);
});
